import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function ensureEnvLoaded() {
  try {
    const filePath = path.resolve(process.cwd(), ".env");
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional
  }
}

ensureEnvLoaded();

export function getTestDatabaseUrl(): string | null {
  ensureEnvLoaded();
  return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || null;
}

let shared: PrismaClient | null = null;
let resolvedUrl: string | null = null;

async function probe(url: string): Promise<boolean> {
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await client.$disconnect();
  }
}

/**
 * Prefer TEST_DATABASE_URL when reachable; otherwise fall back to DATABASE_URL.
 */
export async function resolveDatabaseUrl(): Promise<string | null> {
  ensureEnvLoaded();
  const testUrl = process.env.TEST_DATABASE_URL;
  const mainUrl = process.env.DATABASE_URL;
  if (testUrl && (await probe(testUrl))) return testUrl;
  if (mainUrl && (await probe(mainUrl))) return mainUrl;
  if (testUrl) return testUrl;
  return mainUrl || null;
}

export function getTestPrisma(): PrismaClient | null {
  if (!resolvedUrl) {
    // sync fallback for callers that already awaited dbAvailable()
    const url = getTestDatabaseUrl();
    if (!url) return null;
    resolvedUrl = url;
  }
  if (!shared) {
    shared = new PrismaClient({
      datasources: { db: { url: resolvedUrl } },
    });
  }
  return shared;
}

export async function dbAvailable(): Promise<boolean> {
  const url = await resolveDatabaseUrl();
  if (!url) return false;
  // If TEST_DATABASE_URL was unreachable, resolveDatabaseUrl may still return it
  // as last resort — probe again and fall back.
  const testUrl = process.env.TEST_DATABASE_URL;
  const mainUrl = process.env.DATABASE_URL;

  let chosen: string | null = null;
  if (testUrl && (await probe(testUrl))) chosen = testUrl;
  else if (mainUrl && (await probe(mainUrl))) chosen = mainUrl;

  if (!chosen) return false;
  resolvedUrl = chosen;
  shared = new PrismaClient({
    datasources: { db: { url: chosen } },
  });
  return true;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (shared) {
    await shared.$disconnect();
    shared = null;
  }
  resolvedUrl = null;
}
