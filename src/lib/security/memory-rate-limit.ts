type Entry = { count: number; windowStart: number };

const MAX_KEYS = 10_000;
const store = new Map<string, Entry>();

/**
 * In-memory rate limiter for non-security-sensitive routes (e.g. view counting).
 * Per-instance only; not shared across processes.
 */
export function memoryRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number } {
  const now = Date.now();
  let entry = store.get(opts.key);

  if (!entry || now - entry.windowStart >= opts.windowMs) {
    entry = { count: 0, windowStart: now };
  }

  if (entry.count >= opts.limit) {
    store.set(opts.key, entry);
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  store.set(opts.key, entry);

  // Cap map size (simple LRU-ish: drop oldest half when over limit)
  if (store.size > MAX_KEYS) {
    const drop = Math.floor(MAX_KEYS / 2);
    let i = 0;
    for (const k of store.keys()) {
      store.delete(k);
      if (++i >= drop) break;
    }
  }

  return { ok: true, remaining: opts.limit - entry.count };
}
