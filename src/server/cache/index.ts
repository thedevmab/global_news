import { unstable_cache, revalidateTag } from "next/cache";
import { tags } from "./tags";

export { tags };

const DATE_KEYS = new Set([
  "publishedAt",
  "updatedAt",
  "createdAt",
  "breakingExpiresAt",
  "scheduledAt",
  "startsAt",
  "endsAt",
  "expiresAt",
]);

const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function reviveDates<T>(value: T): T {
  return reviveValue(value) as T;
}

function reviveValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(reviveValue);
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(obj)) {
    if (
      DATE_KEYS.has(key) &&
      typeof v === "string" &&
      ISO_DATE_RE.test(v)
    ) {
      out[key] = new Date(v);
    } else {
      out[key] = reviveValue(v);
    }
  }
  return out;
}

type CacheOpts = {
  tags: string[];
  revalidate: number | false;
};

/**
 * Wrap a query with unstable_cache and revive Date fields after JSON round-trip.
 */
export function cachedQuery<TResult, TArgs extends unknown[] = []>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  opts: CacheOpts,
): (...args: TArgs) => Promise<TResult> {
  const cached = unstable_cache(
    async (...args: TArgs): Promise<TResult> => fn(...args),
    keyParts,
    { tags: opts.tags, revalidate: opts.revalidate },
  );

  return async (...args: TArgs): Promise<TResult> => {
    try {
      const result = await cached(...args);
      return reviveDates(result);
    } catch (err) {
      // Outside a Next request (vitest/tsx) there is no incrementalCache.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("incrementalCache")) {
        return fn(...args);
      }
      throw err;
    }
  };
}

/**
 * Expire tagged entries immediately. Safe outside a request (seed/tsx): no-op.
 */
export function invalidate(...tagList: string[]) {
  for (const tag of tagList) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch {
      // Outside a Next request (scripts, unit tests): ignore.
    }
  }
}
