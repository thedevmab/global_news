import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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

class LocalStorage implements StorageDriver {
  private root: string;

  constructor(root = process.env.UPLOAD_DIR || "./uploads") {
    this.root = path.resolve(/*turbopackIgnore: true*/ root);
  }

  async ensureRoot() {
    await mkdir(this.root, { recursive: true });
  }

  async put(opts: {
    buffer: Buffer;
    extension: string;
    contentType: string;
  }): Promise<StoredObject> {
    await this.ensureRoot();
    const year = new Date().getUTCFullYear();
    const month = String(new Date().getUTCMonth() + 1).padStart(2, "0");
    const dir = path.join(this.root, String(year), month);
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${opts.extension.replace(/^\./, "")}`;
    const absolutePath = path.join(/*turbopackIgnore: true*/ dir, name);
    await writeFile(absolutePath, opts.buffer);
    const storageKey = path
      .relative(this.root, absolutePath)
      .split(path.sep)
      .join("/");
    return { storageKey, absolutePath };
  }

  getAbsolutePath(storageKey: string): string {
    const resolved = path.resolve(/*turbopackIgnore: true*/ this.root, storageKey);
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

/** Stub for future S3-compatible storage. */
class S3Storage implements StorageDriver {
  async put(): Promise<StoredObject> {
    throw new Error(
      "S3 storage is not configured. Set STORAGE_DRIVER=local or implement S3 credentials.",
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

export function getStorage(): StorageDriver {
  if (driver) return driver;
  driver =
    process.env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  return driver;
}

export function getLocalStorage(): LocalStorage {
  return new LocalStorage();
}
