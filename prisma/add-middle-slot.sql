DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AdSlotKey' AND e.enumlabel = 'MIDDLE'
  ) THEN
    ALTER TYPE "AdSlotKey" ADD VALUE 'MIDDLE';
  END IF;
END $$;

INSERT INTO "AdSlot" ("id", "key", "name", "description")
SELECT gen_random_uuid(), 'MIDDLE', 'MIDDLE', 'Middle page advertisement slot'
WHERE NOT EXISTS (SELECT 1 FROM "AdSlot" WHERE "key" = 'MIDDLE');
