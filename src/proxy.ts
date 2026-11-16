import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const MAINT_TTL_MS = 30_000;
let maint = { value: false, at: 0 };

const isProd = process.env.NODE_ENV === "production";

/** Fixed CSP for cacheable public HTML (no per-request nonce). */
const PUBLIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
]
  .join("; ")
  .replace(/\s{2,}/g, " ")
  .trim();

function buildNonceCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (now - maint.at < MAINT_TTL_MS) {
    return maint.value;
  }
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: "default" },
      select: { data: true },
    });
    const data = (settings?.data ?? {}) as { maintenanceMode?: boolean };
    maint = { value: Boolean(data.maintenanceMode), at: now };
  } catch {
    // Fail open: leave previous value, refresh timestamp so we don't hammer DB.
    maint = { value: maint.value, at: now };
  }
  return maint.value;
}

function applyCommonSecurityHeaders(
  response: NextResponse,
  opts: { noindex?: boolean; privateCache?: boolean },
) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  if (opts.noindex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  if (opts.privateCache) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isAuth =
    pathname.startsWith("/login") || pathname.startsWith("/reset-password");
  const isApi = pathname.startsWith("/api");
  const isPreview = pathname.startsWith("/preview");
  const signedIn = hasSessionCookie(request);
  const useNonceCsp = isAdmin || isAuth || isPreview;

  // Optimistic admin gate — full auth still enforced in admin layout
  if (isAdmin && !signedIn) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = buildNonceCsp(nonce);
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    const redirect = NextResponse.redirect(login);
    redirect.headers.set("Content-Security-Policy", csp);
    return applyCommonSecurityHeaders(redirect, {
      noindex: true,
      privateCache: true,
    });
  }

  // Maintenance rewrite for public visitors (skip DB when signed in)
  if (
    !isAdmin &&
    !isAuth &&
    !isApi &&
    !isPreview &&
    pathname !== "/maintenance" &&
    !signedIn
  ) {
    if (await isMaintenanceMode()) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      const rewritten = NextResponse.rewrite(url);
      rewritten.headers.set("Content-Security-Policy", PUBLIC_CSP);
      return applyCommonSecurityHeaders(rewritten, {});
    }
  }

  if (useNonceCsp) {
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = buildNonceCsp(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", csp);
    return applyCommonSecurityHeaders(response, {
      noindex: isAdmin || isPreview,
      privateCache: isAdmin || isPreview,
    });
  }

  // Public routes: fixed CSP, no request header mutation, CDN-cacheable HTML
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", PUBLIC_CSP);
  return applyCommonSecurityHeaders(response, {});
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
