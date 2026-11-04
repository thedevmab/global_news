import { timingSafeEqualString } from "@/lib/security/tokens";

export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;

  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;

  return timingSafeEqualString(match[1].trim(), secret);
}
