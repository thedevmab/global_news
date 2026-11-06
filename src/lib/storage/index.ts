import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { logger } from "@/lib/logger";

export interface StoredObject {
  storageKey: string;
  absolutePath?: string;
}

export interface StorageDriver {
  put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject>;
  delete(storageKey: string): Promise<void>;
  getAbsolutePath(storageKey: string): string;
}

function datedObjectName(extension: string): string {
  const year = new Date().getUTCFullYear();
  const month = String(new Date().getUTCMonth() + 1).padStart(2, "0");
  const ext = extension.replace(/^\./, "");
  return `${year}/${month}/${randomUUID()}.${ext}`;
}

class LocalStorage implements StorageDriver {
  private root: string;

  constructor(root = process.env.UPLOAD_DIR || "./uploads") {
    this.root = path.resolve(/*turbopackIgnore: true*/ root);
  }

  async ensureRoot() {
    if (process.env.VERCEL) {
      throw new Error(
        "Local disk uploads are not available on Vercel. Create a Blob store (Storage → Blob) so BLOB_READ_WRITE_TOKEN is set, then redeploy.",
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
    return { storageKey: relative, absolutePath };
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

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.getAbsolutePath(storageKey));
  }
}

/**
 * Vercel Blob — required on Vercel (local disk is read-only / ephemeral).
 * storageKey is the public blob URL so /media and next/image can use it directly.
 */
class BlobStorage implements StorageDriver {
  async put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Image uploads on Vercel need Blob storage. In the Vercel project open Storage → Create → Blob, then redeploy.",
      );
    }
    const pathname = datedObjectName(opts.extension);
    const result = await put(pathname, opts.buffer, {
      access: "public",
      contentType: opts.contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { storageKey: result.url };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await del(storageKey, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch (err) {
      logger.warn("storage.delete_failed", {
        storageKey,
        error: String(err),
      });
    }
  }

  getAbsolutePath(): string {
    throw new Error("Blob storage does not use local paths");
  }
}

/** Stub for future S3-compatible storage. */
class S3Storage implements StorageDriver {
  async put(): Promise<StoredObject> {
    throw new Error(
      "S3 storage is not configured. Set STORAGE_DRIVER=blob on Vercel or implement S3 credentials.",
    );
  }
  async delete(): Promise<void> {
    throw new Error("S3 storage is not configured.");
  }
  getAbsolutePath(): string {
    throw new Error("S3 storage is not configured.");
  }
}

let driver: StorageDriver | null = null;

function resolveDriverName(): "local" | "blob" | "s3" {
  const explicit = (process.env.STORAGE_DRIVER || "").toLowerCase();
  const onVercel = Boolean(process.env.VERCEL);

  // Vercel filesystem is read-only — never use local disk there, even if
  // STORAGE_DRIVER=local was copied from .env.example into project env.
  if (onVercel) {
    if (explicit === "s3") return "s3";
    return "blob";
  }

  if (explicit === "blob" || explicit === "s3" || explicit === "local") {
    return explicit;
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "local";
}

export function getStorage(): StorageDriver {
  if (driver) return driver;
  const name = resolveDriverName();
  if (name === "blob") driver = new BlobStorage();
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
