import { createHmac, timingSafeEqual } from "crypto";
import { CampaignStatus, SubscriberStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  newsletterConfirmEmail,
  newsletterUnsubscribeEmail,
} from "@/lib/email/templates";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { absoluteUrl, normalizeEmail } from "@/lib/utils";
import { writeAudit } from "@/server/audit";

function unsubscribeSigningSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET (or CRON_SECRET) is required to sign newsletter unsubscribe links",
    );
  }
  return secret;
}

/** Signed unsubscribe token that does not require storing a raw secret. */
export function createUnsubscribeLinkToken(subscriberId: string): string {
  const sig = createHmac("sha256", unsubscribeSigningSecret())
    .update(`unsub:${subscriberId}`)
    .digest("base64url");
  return `${subscriberId}.${sig}`;
}

export function verifyUnsubscribeLinkToken(token: string): string | null {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expected = createHmac("sha256", unsubscribeSigningSecret())
    .update(`unsub:${id}`)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return id;
  } catch {
    return null;
  }
}

export async function subscribeNewsletter(opts: {
  email: string;
  name?: string;
  confirmationRequired?: boolean;
}) {
  const emailNormalized = normalizeEmail(opts.email);
  if (!emailNormalized.includes("@")) {
    throw new ValidationError("Invalid email");
  }

  const rawToken = generateToken(24);
  const tokenHash = hashToken(rawToken);
  const confirmationRequired =
    opts.confirmationRequired ??
    process.env.NEWSLETTER_CONFIRMATION_REQUIRED !== "false";

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { emailNormalized },
  });

  if (existing?.status === SubscriberStatus.ACTIVE) {
    return { status: "already_active" as const };
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { emailNormalized },
    create: {
      email: opts.email.trim(),
      emailNormalized,
      name: opts.name?.trim() || null,
      status: confirmationRequired
        ? SubscriberStatus.PENDING
        : SubscriberStatus.ACTIVE,
      tokenHash,
      confirmedAt: confirmationRequired ? null : new Date(),
    },
    update: {
      name: opts.name?.trim() || existing?.name || null,
      status: confirmationRequired
        ? SubscriberStatus.PENDING
        : SubscriberStatus.ACTIVE,
      tokenHash,
      unsubscribedAt: null,
      confirmedAt: confirmationRequired ? null : new Date(),
    },
  });

  if (confirmationRequired) {
    const confirmUrl = absoluteUrl(
      `/newsletter/confirm?token=${encodeURIComponent(rawToken)}`,
    );
    const tpl = newsletterConfirmEmail({ confirmUrl });
    await sendEmail({ to: subscriber.email, ...tpl });
  }

  return {
    status: confirmationRequired ? ("pending" as const) : ("active" as const),
    rawToken,
  };
}

export async function confirmNewsletter(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { tokenHash },
  });
  if (!subscriber) throw new NotFoundError("Invalid confirmation token");

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: SubscriberStatus.ACTIVE,
      confirmedAt: new Date(),
      unsubscribedAt: null,
    },
  });
  return subscriber;
}

export async function unsubscribeNewsletter(token: string) {
  // Prefer signed campaign links; fall back to confirmation/raw token hash.
  const signedId = verifyUnsubscribeLinkToken(token);
  const subscriber = signedId
    ? await prisma.newsletterSubscriber.findUnique({ where: { id: signedId } })
    : await prisma.newsletterSubscriber.findUnique({
        where: { tokenHash: hashToken(token) },
      });

  if (!subscriber) throw new NotFoundError("Invalid unsubscribe token");

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: SubscriberStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });

  await writeAudit({
    action: "newsletter.unsubscribe",
    entityType: "NewsletterSubscriber",
    entityId: subscriber.id,
    metadata: { email: subscriber.emailNormalized },
  });

  return subscriber;
}

export function isEligibleForSend(status: SubscriberStatus): boolean {
  return status === SubscriberStatus.ACTIVE;
}

/**
 * Process campaigns in SENDING status when NEWSLETTER_SENDING_ENABLED is true.
 */
export async function processPendingCampaigns(limit = 5): Promise<{
  processed: number;
  sent: number;
  skipped: boolean;
}> {
  if (process.env.NEWSLETTER_SENDING_ENABLED !== "true") {
    logger.info("cron.newsletter.disabled");
    return { processed: 0, sent: 0, skipped: true };
  }

  const campaigns = await prisma.newsletterCampaign.findMany({
    where: { status: CampaignStatus.SENDING },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let sent = 0;
  for (const campaign of campaigns) {
    const result = await sendCampaignBatch(campaign.id);
    sent += result.sent;
  }

  return { processed: campaigns.length, sent, skipped: false };
}

async function sendCampaignBatch(campaignId: string) {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign || campaign.status !== CampaignStatus.SENDING) {
    return { sent: 0 };
  }

  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId, sentAt: null },
    include: { subscriber: true },
    take: 100,
  });

  let sent = 0;
  for (const recipient of recipients) {
    if (!isEligibleForSend(recipient.subscriber.status)) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { error: "unsubscribed_or_inactive", sentAt: new Date() },
      });
      continue;
    }

    try {
      const unsubToken = createUnsubscribeLinkToken(recipient.subscriber.id);
      const footer = newsletterUnsubscribeEmail({
        unsubscribeUrl: `/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`,
      });
      await sendEmail({
        to: recipient.subscriber.email,
        subject: campaign.subject,
        html: `${campaign.bodyHtml}<hr/>${footer.html}`,
        text: footer.text,
      });
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { sentAt: new Date(), error: null },
      });
      sent += 1;
    } catch (err) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  const remaining = await prisma.campaignRecipient.count({
    where: { campaignId, sentAt: null },
  });

  if (remaining === 0) {
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.SENT, sentAt: new Date() },
    });
  }

  return { sent };
}

export async function assertCanManageNewsletter(role: string) {
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Insufficient permissions");
  }
}

const campaignSchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1),
  articleIds: z.array(z.string().uuid()).optional(),
});

export async function listSubscribers(user: AuthUser, status?: SubscriberStatus) {
  requirePermission(user, "newsletter:manage");
  return prisma.newsletterSubscriber.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function listCampaigns(user: AuthUser) {
  requirePermission(user, "newsletter:manage");
  return prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { recipients: true, articles: true } },
    },
  });
}

export async function createCampaign(user: AuthUser, input: unknown) {
  requirePermission(user, "newsletter:manage");
  const data = campaignSchema.parse(input);
  const campaign = await prisma.newsletterCampaign.create({
    data: {
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      createdById: user.id,
      articles: data.articleIds?.length
        ? {
            create: data.articleIds.map((articleId, position) => ({
              articleId,
              position,
            })),
          }
        : undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "newsletter.campaign_create",
    entityType: "NewsletterCampaign",
    entityId: campaign.id,
  });
  return campaign;
}

export async function updateCampaign(
  user: AuthUser,
  id: string,
  input: unknown,
) {
  requirePermission(user, "newsletter:manage");
  const data = campaignSchema.partial().parse(input);
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Campaign not found");
  if (existing.status === "SENT" || existing.status === "SENDING") {
    throw new ValidationError("Cannot edit a sent campaign");
  }
  return prisma.newsletterCampaign.update({
    where: { id },
    data: {
      subject: data.subject,
      bodyHtml: data.bodyHtml,
    },
  });
}

export async function testSendCampaign(
  user: AuthUser,
  id: string,
  testEmail: string,
) {
  requirePermission(user, "newsletter:manage");
  if (process.env.NEWSLETTER_SENDING_ENABLED !== "true") {
    throw new ForbiddenError("Newsletter sending is disabled");
  }
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  await sendEmail({
    to: testEmail,
    subject: `[TEST] ${campaign.subject}`,
    html: campaign.bodyHtml,
  });
  await prisma.newsletterCampaign.update({
    where: { id },
    data: { status: CampaignStatus.TEST_SENT, testSentAt: new Date() },
  });
  await writeAudit({
    actorId: user.id,
    action: "newsletter.test_send",
    entityType: "NewsletterCampaign",
    entityId: id,
    metadata: { testEmail },
  });
}

export async function sendCampaign(user: AuthUser, id: string) {
  requirePermission(user, "newsletter:manage");
  if (process.env.NEWSLETTER_SENDING_ENABLED !== "true") {
    throw new ForbiddenError("Newsletter sending is disabled");
  }
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) throw new NotFoundError("Campaign not found");
  if (campaign.status !== "TEST_SENT") {
    throw new ValidationError("Send a test email before full send");
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "ACTIVE" },
  });

  await prisma.$transaction(async (tx) => {
    await tx.campaignRecipient.deleteMany({ where: { campaignId: id } });
    if (subscribers.length) {
      await tx.campaignRecipient.createMany({
        data: subscribers.map((s) => ({
          campaignId: id,
          subscriberId: s.id,
        })),
      });
    }
    await tx.newsletterCampaign.update({
      where: { id },
      data: { status: CampaignStatus.SENDING },
    });
  });

  await writeAudit({
    actorId: user.id,
    action: "newsletter.send_queued",
    entityType: "NewsletterCampaign",
    entityId: id,
    metadata: { recipients: subscribers.length },
  });
}
