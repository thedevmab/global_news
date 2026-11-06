-- Binary media storage for serverless hosts (no local disk / no Blob required).
CREATE TABLE "MediaObject" (
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaObject_pkey" PRIMARY KEY ("storageKey")
);
