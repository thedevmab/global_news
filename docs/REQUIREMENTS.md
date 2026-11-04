# GVN Derived Requirement IDs

> **Source of truth note:** The uploaded FRD PDF was not available. Requirement IDs below are derived from the user prompt (sections 1–17). Gaps and open decisions are listed in [OPEN_DECISIONS.md](./OPEN_DECISIONS.md).

## Legend
- **Must** — required for acceptance
- **Should** — strong preference; ship if feasible
- Status tracked in [TRACEABILITY.md](./TRACEABILITY.md)

---

## PUB — Public Website

| ID | Section | Requirement |
|----|---------|-------------|
| PUB-4.1-01 | 4.1 | Sticky header with logo, nav, search, language switch, theme toggle, mobile drawer |
| PUB-4.1-02 | 4.1 | Breaking-news ticker (max 5, pause-on-hover, a11y pause, auto-expire) |
| PUB-4.1-03 | 4.1 | Lead story + 4 secondary stories from CMS configuration |
| PUB-4.1-04 | 4.1 | Latest news, 12 per batch, Load More with loading/empty/error |
| PUB-4.1-05 | 4.1 | Featured category sections (4 articles each) |
| PUB-4.1-06 | 4.1 | Most-read, videos, podcasts, ads, newsletter, footer |
| PUB-4.1-07 | 4.1 | Never show unpublished/scheduled; elegant empty state when DB empty |
| PUB-4.2-01 | 4.2 | Article detail: breadcrumb, headline, author, dates, reading time, image |
| PUB-4.2-02 | 4.2 | TipTap body elements (headings, lists, embeds, tables, galleries) |
| PUB-4.2-03 | 4.2 | Social share (FB, X, Telegram, WhatsApp, LinkedIn, copy link) |
| PUB-4.2-04 | 4.2 | Related articles (4), ads, newsletter |
| PUB-4.2-05 | 4.2 | NewsArticle structured data + metadata |
| PUB-4.2-06 | 4.2 | View counter with session dedupe + bot exclusion |
| PUB-4.2-07 | 4.2 | Real 404 for unpublished/scheduled/trashed/deleted |
| PUB-4.3-01 | 4.3 | Category pages with pagination (12), SEO, subcategory filters |
| PUB-4.4-01 | 4.4 | Tag pages with pagination and SEO |
| PUB-4.5-01 | 4.5 | Author public profiles with published articles |
| PUB-4.6-01 | 4.6 | PostgreSQL FTS search with filters, snippets, URL query |
| PUB-4.7-01 | 4.7 | Video listing + detail with safe YouTube/Vimeo embeds |
| PUB-4.8-01 | 4.8 | Podcast listing + detail with audio player |
| PUB-4.9-01 | 4.9 | Newsletter subscribe/confirm/unsubscribe with tokens |
| PUB-4.10-01 | 4.10 | Contact form with CAPTCHA, rate limit 5/h/IP, DB + admin inbox |
| PUB-4.11-01 | 4.11 | CMS static pages + custom 404/500 |
| PUB-4.12-01 | 4.12 | Footer with brand links, categories, social, copyright year |

## CMS — Admin CMS

| ID | Section | Requirement |
|----|---------|-------------|
| CMS-5.0-01 | 5 | `/admin` auth-gated, noindex, RBAC nav, responsive |
| CMS-5.1-01 | 5.1 | Dashboard with real PostgreSQL metrics |
| CMS-5.2-01 | 5.2 | Article list with filters, search, bulk actions |
| CMS-5.3-01 | 5.3 | TipTap editor, autosave 30s, slug, SEO fields, preview |
| CMS-5.3-02 | 5.3 | Revision history, compare, restore, editorial notes |
| CMS-5.3-03 | 5.3 | Featured/breaking/pin/hide/schedule/soft-delete |
| CMS-5.4-01 | 5.4 | Workflow states and valid transitions with audit |
| CMS-5.4-02 | 5.4 | Role permissions for workflow; email notifications |
| CMS-5.4-03 | 5.4 | Scheduled publish via protected cron endpoint |
| CMS-5.5-01 | 5.5 | Homepage slot management (lead + 4 secondary) |
| CMS-5.6-01 | 5.6 | Categories/tags CRUD, bilingual names, merge, reassignment |
| CMS-5.7-01 | 5.7 | Author profile management |
| CMS-5.8-01 | 5.8 | Media library: upload, WebP variants, alt, usage |
| CMS-5.9-01 | 5.9 | User management with Super Admin protections |
| CMS-5.10-01 | 5.10 | Advertisement slots with Sponsored marking |
| CMS-5.11-01 | 5.11 | Newsletter campaigns with test-send gate |
| CMS-5.12-01 | 5.12 | Site settings + maintenance mode |

## RBAC — Access Control

| ID | Section | Requirement |
|----|---------|-------------|
| RBAC-6-01 | 6 | Six roles: Visitor, Contributor, Editor, Publisher, Admin, Super Admin |
| RBAC-6-02 | 6 | Server-side helpers on every protected operation |
| RBAC-6-03 | 6 | Contributor ownership enforcement |
| RBAC-6-04 | 6 | Tests for role boundaries |

## DB — Database

| ID | Section | Requirement |
|----|---------|-------------|
| DB-7-01 | 7 | Full Prisma schema with listed entities |
| DB-7-02 | 7 | Indexes, FKs, enums, soft deletes, FTS |
| DB-7-03 | 7 | Seed + secure Super Admin setup command |

## SEC — Security

| ID | Section | Requirement |
|----|---------|-------------|
| SEC-8-01 | 8 | Argon2 hashing, password policy (≥10, letter+number) |
| SEC-8-02 | 8 | Lockout 5 fails / 15 min; generic auth errors |
| SEC-8-03 | 8 | Reset tokens 30 min, single-use |
| SEC-8-04 | 8 | 8h inactivity session expiry; immediate logout |
| SEC-8-05 | 8 | Zod validation, sanitization, CSP, HSTS, rate limits |
| SEC-8-06 | 8 | Audit logging; no secret leakage |

## I18N / SEO / PERF

| ID | Section | Requirement |
|----|---------|-------------|
| I18N-9-01 | 9 | EN/AM content + UI; Ethiopic fonts; hreflang only for real translations |
| SEO-10-01 | 10 | Metadata, OG, JSON-LD, sitemap, news sitemap, robots, RSS |
| SEO-10-02 | 10 | Slug redirects; admin/previews noindex |
| PERF-11-01 | 11 | SSR, caching tags, image opts, a11y WCAG targets |

## ACC — Acceptance Tests (prompt §15)

| ID | Criterion |
|----|-----------|
| ACC-01 | Visitors view published articles |
| ACC-02 | Visitors cannot access unpublished |
| ACC-03 | Contributors create own drafts |
| ACC-04 | Contributors cannot publish |
| ACC-05 | Contributors cannot edit others' drafts |
| ACC-06 | Editors approve/return |
| ACC-07 | Publishers publish approved |
| ACC-08 | Scheduled publish via cron |
| ACC-09 | Expired breaking news hidden |
| ACC-10 | Duplicate slugs rejected/resolved |
| ACC-11 | Invalid uploads rejected |
| ACC-12 | Alt text required for publish |
| ACC-13 | Unauthorized cannot manage users/settings |
| ACC-14 | Last Super Admin protected |
| ACC-15 | Suspended users lose access |
| ACC-16 | Reset tokens expire / single-use |
| ACC-17 | Unsubscribe blocks further sends |
| ACC-18 | Contact validated + rate-limited |
| ACC-19 | Search is DB-backed |
| ACC-20 | Published appear in listings/search/sitemap/RSS |
| ACC-21 | Admin not publicly indexed |
| ACC-22 | Production build succeeds |
