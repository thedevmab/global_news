import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { logger } from "@/lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || "GVN <noreply@localhost>",
      ...message,
    });
  }
}

class LogEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.info("email.dev_log", {
      to: message.to,
      subject: message.subject,
    });
  }
}

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;
  if (process.env.SMTP_HOST) {
    provider = new SmtpEmailProvider();
  } else {
    provider = new LogEmailProvider();
  }
  return provider;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await getEmailProvider().send(message);
}
