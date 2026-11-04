import { NextResponse } from "next/server";
import { timingSafeEqualString } from "@/lib/security/tokens";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || !token || !timingSafeEqualString(secret, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEWSLETTER_SENDING_ENABLED !== "true") {
    return NextResponse.json({
      skipped: true,
      reason: "NEWSLETTER_SENDING_ENABLED is not true",
    });
  }

  const campaigns = await prisma.newsletterCampaign.findMany({
    where: { status: "SENDING" },
    take: 1,
    include: {
      recipients: {
        where: { sentAt: null },
        take: 50,
        include: { subscriber: true },
      },
    },
  });

  let sent = 0;
  for (const campaign of campaigns) {
    for (const recipient of campaign.recipients) {
      if (recipient.subscriber.status !== "ACTIVE") continue;
      try {
        await sendEmail({
          to: recipient.subscriber.email,
          subject: campaign.subject,
          html: campaign.bodyHtml,
        });
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { sentAt: new Date() },
        });
        sent += 1;
      } catch (err) {
        logger.error("newsletter.send_failed", {
          recipientId: recipient.id,
          error: String(err),
        });
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { error: String(err) },
        });
      }
    }
    const remaining = await prisma.campaignRecipient.count({
      where: { campaignId: campaign.id, sentAt: null },
    });
    if (remaining === 0) {
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    }
  }

  return NextResponse.json({ sent });
}
