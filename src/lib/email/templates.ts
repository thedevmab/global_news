import { absoluteUrl } from "@/lib/utils";

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F3F5F8;font-family:Georgia,serif;color:#263449;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #E2E8F0;">
        <tr><td style="background:#10213A;color:#ffffff;padding:16px 24px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.04em;text-transform:uppercase;">
          Global Voice Network
        </td></tr>
        <tr><td style="padding:28px 24px;font-size:16px;line-height:1.55;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#10213A;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;font-size:12px;color:#718096;border-top:1px solid #E2E8F0;font-family:Arial,sans-serif;">
          © ${new Date().getFullYear()} Global Voice Network
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function passwordResetEmail(opts: {
  name: string;
  resetUrl: string;
}): EmailTemplate {
  const subject = "Reset your GVN password";
  const html = layout(
    "Password reset",
    `<p>Hello ${escapeHtml(opts.name)},</p>
     <p>We received a request to reset your password. This link expires in one hour and can only be used once.</p>
     <p><a href="${escapeHtml(opts.resetUrl)}" style="display:inline-block;background:#E63946;color:#fff;padding:10px 18px;text-decoration:none;font-family:Arial,sans-serif;">Reset password</a></p>
     <p style="font-size:13px;color:#718096;">If you did not request this, you can ignore this email.</p>`,
  );
  const text = `Hello ${opts.name},\n\nReset your password: ${opts.resetUrl}\n\nThis link expires in one hour and can only be used once.`;
  return { subject, html, text };
}

export function reviewAssignedEmail(opts: {
  name: string;
  headline: string;
  articleUrl: string;
}): EmailTemplate {
  const subject = `Review requested: ${opts.headline}`;
  const html = layout(
    "Article ready for review",
    `<p>Hello ${escapeHtml(opts.name)},</p>
     <p>An article has been submitted for your review:</p>
     <p><strong>${escapeHtml(opts.headline)}</strong></p>
     <p><a href="${escapeHtml(opts.articleUrl)}">Open in CMS</a></p>`,
  );
  const text = `Hello ${opts.name},\n\nReview requested for "${opts.headline}":\n${opts.articleUrl}`;
  return { subject, html, text };
}

export function articlePublishedEmail(opts: {
  name: string;
  headline: string;
  publicUrl: string;
}): EmailTemplate {
  const subject = `Published: ${opts.headline}`;
  const html = layout(
    "Your article is live",
    `<p>Hello ${escapeHtml(opts.name)},</p>
     <p><strong>${escapeHtml(opts.headline)}</strong> is now published.</p>
     <p><a href="${escapeHtml(opts.publicUrl)}">View article</a></p>`,
  );
  const text = `Hello ${opts.name},\n\n"${opts.headline}" is published:\n${opts.publicUrl}`;
  return { subject, html, text };
}

export function newsletterConfirmEmail(opts: {
  confirmUrl: string;
}): EmailTemplate {
  const subject = "Confirm your GVN newsletter subscription";
  const html = layout(
    "Confirm subscription",
    `<p>Thanks for subscribing to Global Voice Network.</p>
     <p>Please confirm your email to start receiving updates.</p>
     <p><a href="${escapeHtml(opts.confirmUrl)}" style="display:inline-block;background:#10213A;color:#fff;padding:10px 18px;text-decoration:none;font-family:Arial,sans-serif;">Confirm subscription</a></p>`,
  );
  const text = `Confirm your GVN newsletter subscription:\n${opts.confirmUrl}`;
  return { subject, html, text };
}

export function newsletterUnsubscribeEmail(opts: {
  unsubscribeUrl: string;
}): EmailTemplate {
  const subject = "Manage your GVN newsletter subscription";
  const url = opts.unsubscribeUrl.startsWith("http")
    ? opts.unsubscribeUrl
    : absoluteUrl(opts.unsubscribeUrl);
  const html = layout(
    "Unsubscribe",
    `<p>You can stop receiving GVN newsletter emails at any time.</p>
     <p><a href="${escapeHtml(url)}">Unsubscribe</a></p>`,
  );
  const text = `Unsubscribe from GVN newsletter:\n${url}`;
  return { subject, html, text };
}
