# Performance baseline — Step 0 (2026-11-13)

No application code was modified. Production server used for checks: `next start` on port 3010 after `npm run build`. Dev server remained on 3000.

## Build route table

Saved: `docs/perf-baseline/build-before.txt`

- Almost every public HTML route is **ƒ Dynamic** (`force-dynamic` on public layouts).
- Static (○): `/_not-found`, `/apple-icon.png`, `/icon.png`, `/maintenance`, `/robots.txt`, `/sitemap.xml`.
- Proxy (Middleware) is present.

## Finding 1 correction — CSP / nonce

**Plan claim:** CSP is only on the response + `x-nonce` on the request, so Next never applies nonces → scripts blocked under `strict-dynamic`.

**Observed on Next.js 16.4.3:**

1. Official docs still say set `Content-Security-Policy` on **request** headers (and `x-nonce` for app code). Our `src/proxy.ts` only sets CSP on the **response** and `x-nonce` on the request.
2. Next still applies matching nonces to framework scripts in **production**. Evidence: HTML scripts carry `nonce="…"` equal to the response CSP nonce; clock, theme toggle, and mobile menu work on `/`, `/politics/2-12`, and dates hydrate on those pages.
3. Mechanism: in `node_modules/next/dist/server/lib/router-utils/resolve-routes.js`, middleware/proxy **response** headers are copied onto `req.headers` as well as `resHeaders`. So the response CSP reaches `parseRequestHeaders` → `getScriptNonceFromHeader`.
4. `x-nonce` is unused by Next and by `src/` (no reader). It is harmless today; admin fix should still set CSP on request headers per docs.

**Implication for the plan:** P0-A remains valuable to make public HTML cacheable (fixed CSP, no per-request nonce) and to align admin with the documented request-header pattern. It is **not** an emergency “site never hydrates” bug on this Next version.

## Browser CSP / interactivity (production :3010)

| Route | Hydration (clock / theme / dates) | Notes |
|-------|-----------------------------------|--------|
| `/` | Yes | Theme button present; clock ticking |
| `/politics/2-12` | Yes | Same |
| `/login` | Form interactive | Sign-in form renders |

No evidence of mass script blocking under current CSP.

## TTFB (warm production, small dataset ≈ seed size)

Saved: `docs/perf-baseline/ttfb-before.json` (10 samples each)

| URL | p50 | p95 |
|-----|-----|-----|
| `/` | 58 ms | 81 ms |
| `/am` | 53 ms | 74 ms |
| `/politics` | 44 ms | 70 ms |
| `/search?q=ethiopia` | 32 ms | 51 ms |
| `/politics/2-12` | 72 ms | 147 ms |

**Not done yet:** 5,000-article seed, cold vs warm `x-nextjs-cache` comparison (all routes force-dynamic so no HIT), Lighthouse, query counts, session UPDATE counts.

## Next coding steps (awaiting approvals where noted)

1. P0-F (approval) + P0-G
2. P0-B cache layer…
3. P0-A (approval) then P0-C ISR
