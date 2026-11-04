import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { ValidationError } from "@/lib/errors";

export const contactMessageSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  turnstileToken: z.string().optional(),
});

export async function submitContactMessage(opts: {
  input: unknown;
  ipAddress?: string | null;
}) {
  const data = contactMessageSchema.parse(opts.input);
  const ip = opts.ipAddress || "unknown";

  await rateLimit({
    key: `contact:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  const captcha = await verifyTurnstile(data.turnstileToken, ip);
  if (!captcha.ok) {
    throw new ValidationError(captcha.error || "CAPTCHA failed");
  }

  const row = await prisma.contactMessage.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim(),
      subject: data.subject.trim(),
      message: data.message.trim(),
      ipAddress: ip,
    },
  });

  const forward = process.env.CONTACT_FORWARD_EMAIL;
  if (forward) {
    try {
      await sendEmail({
        to: forward,
        subject: `[GVN Contact] ${row.subject}`,
        html: `<p><strong>From:</strong> ${row.name} &lt;${row.email}&gt;</p><p>${row.message.replace(/\n/g, "<br/>")}</p>`,
        text: `From: ${row.name} <${row.email}>\n\n${row.message}`,
      });
    } catch {
      // Persist the message even if SMTP is unavailable.
    }
  }

  return row;
}
