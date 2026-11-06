-- Add MIDDLE placement for homepage/article mid-page ads.
-- Enum value only: Postgres cannot use a newly added enum label in the same
-- transaction, so the AdSlot row is created by seed / ensurePrimaryAdSlots().
ALTER TYPE "AdSlotKey" ADD VALUE 'MIDDLE';
