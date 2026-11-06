import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface StoredObject {
  storageKey: string;
  absolutePath?: string;
  contentType?: string;
}

export interface StorageDriver {
  put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
  read(storageKey: string): Promise<{ buffer: Buffer; contentType: string }>;
  getAbsolutePath(storageKey: string): string;
}

function datedObjectName(extension: string): string {
  const year = new Date().getUTCFullYear();
  const month = String(new Date().getUTCMonth() + 1).padStart(2, "0");
  const ext = extension.replace(/^\./, "");
  return `${year}/${month}/${randomUUID()}.${ext}`;
}

function mimeFromKey(storageKey: string, fallback = "application/octet-stream") {
  const ext = path.extname(storageKey).toLowerCase();
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".mp3") return "audio/mpeg";
  return fallback;
}

class LocalStorage implements StorageDriver {
  private root: string;

  constructor(root = process.env.UPLOAD_DIR || "./uploads") {
    this.root = path.resolve(/*turbopackIgnore: true*/ root);
  }

  async ensureRoot() {
    if (process.env.VERCEL) {
      throw new Error(
        "Local disk uploads are not available on Vercel. Use database storage (default) instead.",
      );
    }
    await mkdir(this.root, { recursive: true });
  }

  async put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject> {
    await this.ensureRoot();
    const relative = datedObjectName(opts.extension);
    const absolutePath = path.join(
      /*turbopackIgnore: true*/ this.root,
      ...relative.split("/"),
    );
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, opts.buffer);
    return { storageKey: relative, absolutePath, contentType: opts.contentType };
  }

  getAbsolutePath(storageKey: string): string {
    const resolved = path.resolve(
      /*turbopackIgnore: true*/ this.root,
      storageKey,
    );
    if (!resolved.startsWith(this.root)) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(this.getAbsolutePath(storageKey));
    } catch (err) {
      logger.warn("storage.delete_failed", {
        storageKey,
        error: String(err),
      });
    }
  }

  async read(storageKey: string) {
    const buffer = await readFile(this.getAbsolutePath(storageKey));
    return { buffer, contentType: mimeFromKey(storageKey) };
  }
}

/** Store image bytes in Postgres — works on Vercel without Blob or S3. */
class DatabaseStorage implements StorageDriver {
  async put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject> {
    const storageKey = datedObjectName(opts.extension);
    await prisma.mediaObject.create({
      data: {
        storageKey,
        contentType: opts.contentType,
        data: opts.buffer,
      },
    });
    return { storageKey, contentType: opts.contentType };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await prisma.mediaObject.delete({ where: { storageKey } });
    } catch (err) {
      logger.warn("storage.delete_failed", {
        storageKey,
        error: String(err),
      });
    }
  }

  async read(storageKey: string) {
    const row = await prisma.mediaObject.findUnique({
      where: { storageKey },
    });
    if (!row) {
      throw new Error("Not found");
    }
    return {
      buffer: Buffer.from(row.data),
      contentType: row.contentType || mimeFromKey(storageKey),
    };
  }

  getAbsolutePath(): string {
    throw new Error("Database storage does not use local paths");
  }
}

/** Stub for future S3-compatible storage. */
class S3Storage implements StorageDriver {
  async put(): Promise<StoredObject> {
    throw new Error(
      "S3 storage is not configured. Set STORAGE_DRIVER=db (default on Vercel) or configure S3.",
    );
  }
  async delete(): Promise<void> {
    throw new Error("S3 storage is not configured.");
  }
  async read(): Promise<{ buffer: Buffer; contentType: string }> {
    throw new Error("S3 storage is not configured.");
  }
  getAbsolutePath(): string {
    throw new Error("S3 storage is not configured.");
  }
}

let driver: StorageDriver | null = null;

function resolveDriverName(): "local" | "db" | "s3" {
  const explicit = (process.env.STORAGE_DRIVER || "").toLowerCase();
  const onVercel = Boolean(process.env.VERCEL);

  // Vercel has no writable disk. Prefer Postgres media objects — no Blob needed.
  if (onVercel) {
    if (explicit === "s3") return "s3";
    return "db";
  }

  if (explicit === "db" || explicit === "s3" || explicit === "local") {
    return explicit;
  }
  // Treat legacy "blob" env as db so old Vercel settings keep working.
  if (explicit === "blob") return "db";
  return "local";
}

export function getStorage(): StorageDriver {
  if (driver) return driver;
  const name = resolveDriverName();
  if (name === "db") driver = new DatabaseStorage();
  else if (name === "s3") driver = new S3Storage();
  else driver = new LocalStorage();
  return driver;
}

export function getLocalStorage(): LocalStorage {
  return new LocalStorage();
}

export function isRemoteStorageKey(storageKey: string): boolean {
  return /^https?:\/\//i.test(storageKey);
}
