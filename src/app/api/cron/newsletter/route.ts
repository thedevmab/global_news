import { NextResponse } from "next/server";
import { CampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { timingSafeEqualString } from "@/lib/security/tokens";
import { sendCampaignBatch } from "@/server/newsletter/service";

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
    where: { status: CampaignStatus.SENDING },
    take: 1,
    select: { id: true },
  });

  let sent = 0;
  for (const campaign of campaigns) {
    const result = await sendCampaignBatch(campaign.id);
    sent += result.sent;
  }

  return NextResponse.json({ sent });
}
