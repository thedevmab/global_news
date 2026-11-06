import { logger } from "@/lib/logger";

export type TurnstileVerifyResult =
  | { ok: true; bypassed?: boolean }
  | { ok: false; error: string };

/**
 * Verify a Cloudflare Turnstile token.
 * In development, when TURNSTILE_SECRET_KEY is missing, verification is bypassed with a warning.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Allow contact/newsletter without CAPTCHA until Turnstile is configured.
    logger.warn("turnstile.bypass", {
      reason: "TURNSTILE_SECRET_KEY missing",
    });
    return { ok: true, bypassed: true };
  }

  if (!token || !token.trim()) {
    return { ok: false, error: "CAPTCHA token missing" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      return {
        ok: false,
        error: (data["error-codes"] || ["verification_failed"]).join(", "),
      };
    }
    return { ok: true };
  } catch (err) {
    logger.error("turnstile.verify_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: "CAPTCHA verification failed" };
  }
}
