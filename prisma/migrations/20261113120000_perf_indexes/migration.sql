-- Drop indexes that duplicate unique constraints
DROP INDEX IF EXISTS "User_emailNormalized_idx";
DROP INDEX IF EXISTS "AuthorProfile_username_idx";
DROP INDEX IF EXISTS "SlugRedirect_fromPath_idx";

-- Article query patterns
CREATE INDEX "Article_authorProfileId_status_publishedAt_idx" ON "Article"("authorProfileId", "status", "publishedAt" DESC);
CREATE INDEX "Article_status_updatedAt_idx" ON "Article"("status", "updatedAt" DESC);

-- Newsletter
CREATE INDEX "NewsletterCampaign_status_updatedAt_idx" ON "NewsletterCampaign"("status", "updatedAt" DESC);
CREATE INDEX "CampaignRecipient_campaignId_sentAt_idx" ON "CampaignRecipient"("campaignId", "sentAt");
CREATE INDEX "CampaignRecipient_subscriberId_idx" ON "CampaignRecipient"("subscriberId");
