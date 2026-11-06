-- Add MIDDLE placement for homepage/article mid-page ads.
ALTER TYPE "AdSlotKey" ADD VALUE IF NOT EXISTS 'MIDDLE';

INSERT INTO "AdSlot" ("id", "key", "name", "description")
SELECT gen_random_uuid(), 'MIDDLE', 'Middle of page', 'Banner shown in the middle of home and article pages'
WHERE NOT EXISTS (SELECT 1 FROM "AdSlot" WHERE "key" = 'MIDDLE');
