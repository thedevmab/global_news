import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

function applySecurityHeaders(
  response: NextResponse,
  opts: { nonce?: string; noindex?: boolean; privateCache?: boolean },
) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = opts.nonce;
  if (nonce) {
    const csp = [
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
    ]
      .join("; ")
      .replace(/\s{2,}/g, " ")
      .trim();
    response.headers.set("Content-Security-Policy", csp);
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (process.env.NODE_ENV === "production") {
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
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isAuth =
    pathname.startsWith("/login") || pathname.startsWith("/reset-password");
  const isApi = pathname.startsWith("/api");
  const isPreview = pathname.startsWith("/preview");

  // Optimistic admin gate — full auth still enforced in admin layout
  if (isAdmin && !hasSessionCookie(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    const redirect = NextResponse.redirect(login);
    return applySecurityHeaders(redirect, {
      nonce,
      noindex: true,
      privateCache: true,
    });
  }

  // Maintenance rewrite for public visitors
  if (!isAdmin && !isAuth && !isApi && !isPreview && pathname !== "/maintenance") {
    try {
      const settings = await prisma.siteSetting.findUnique({
        where: { id: "default" },
        select: { data: true },
      });
      const data = (settings?.data ?? {}) as { maintenanceMode?: boolean };
      if (data.maintenanceMode && !hasSessionCookie(request)) {
        const url = request.nextUrl.clone();
        url.pathname = "/maintenance";
        const rewritten = NextResponse.rewrite(url);
        return applySecurityHeaders(rewritten, { nonce });
      }
    } catch {
      // ignore DB errors in proxy
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return applySecurityHeaders(response, {
    nonce,
    noindex: isAdmin || isPreview,
    privateCache: isAdmin || isPreview,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
