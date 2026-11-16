-- Plain-text body for full-text search (TipTap JSON is not indexable as text).
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "bodyPlain" TEXT NOT NULL DEFAULT '';

-- Rebuild article searchVector: simple + english, include bodyPlain.
ALTER TABLE "Article" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Article" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("headline", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("headline", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("subheadline", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("subheadline", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("summary", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("summary", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("bodyPlain", '')), 'C') ||
    setweight(to_tsvector('english', coalesce("bodyPlain", '')), 'C')
  ) STORED;
CREATE INDEX "Article_searchVector_idx" ON "Article" USING GIN ("searchVector");

-- Rebuild video searchVector with both dictionaries.
ALTER TABLE "Video" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Video" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;
CREATE INDEX "Video_searchVector_idx" ON "Video" USING GIN ("searchVector");

-- Rebuild podcast searchVector with both dictionaries.
ALTER TABLE "Podcast" DROP COLUMN IF EXISTS "searchVector";
ALTER TABLE "Podcast" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("showNotes", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("showNotes", '')), 'B')
  ) STORED;
CREATE INDEX "Podcast_searchVector_idx" ON "Podcast" USING GIN ("searchVector");
