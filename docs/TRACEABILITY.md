# Requirement → Implementation → Test Traceability

Status: `pending` | `partial` | `done` | `blocked`

| Req ID | Implementation | Test | Status |
|--------|----------------|------|--------|
| PUB-4.1-01 | `src/components/layout/Header.tsx` | e2e/smoke | done |
| PUB-4.1-02 | `src/components/layout/BreakingTicker.tsx` | unit + public queries | done |
| PUB-4.1-03 | homepage + `HomepageSlot` | integration/articles-visibility | done |
| PUB-4.1-04 | LatestNews + `/api/articles/latest` | manual + API | done |
| PUB-4.1-05 | Homepage category sections | public home | done |
| PUB-4.1-06 | videos/podcasts/newsletter/footer | pages exist | done |
| PUB-4.1-07 | Public queries filter PUBLISHED | ACC-01/02 integration | done |
| PUB-4.2-01 | `(public)/[category]/[slug]` | integration visibility | done |
| PUB-4.2-02 | TipTap + sanitize | unit/sanitize | done |
| PUB-4.2-03 | ShareButtons | component | done |
| PUB-4.2-04 | relatedArticles | public.ts | done |
| PUB-4.2-05 | `lib/seo/jsonld` | present | done |
| PUB-4.2-06 | `/api/views` | route | done |
| PUB-4.2-07 | notFound() | ACC-02 | done |
| PUB-4.3-01 | `[category]/page.tsx` | page | done |
| PUB-4.4-01 | `tag/[slug]` | page | done |
| PUB-4.5-01 | `author/[username]` | page | done |
| PUB-4.6-01 | FTS search | search page + public.ts | done |
| PUB-4.7-01 | videos pages | pages | done |
| PUB-4.8-01 | podcasts pages | pages | done |
| PUB-4.9-01 | newsletter service | integration/newsletter | done |
| PUB-4.10-01 | contact service | integration/contact-rate-limit | done |
| PUB-4.11-01 | static pages + error/not-found | pages | done |
| PUB-4.12-01 | Footer.tsx | e2e smoke branding | done |
| CMS-5.0-01 | admin layout + proxy noindex | e2e admin→login | done |
| CMS-5.1-01 | admin dashboard metrics | page | done |
| CMS-5.2-01 | admin articles list | page | done |
| CMS-5.3-01 | TipTap editor + autosave | ArticleEditForm | done |
| CMS-5.3-02 | revisions route | admin revisions page | partial |
| CMS-5.3-03 | flags/schedule in editor | edit form | done |
| CMS-5.4-01 | workflow.ts | unit + integration workflow | done |
| CMS-5.4-02 | RBAC + email hooks | unit/rbac | done |
| CMS-5.4-03 | cron/publish-scheduled | route | done |
| CMS-5.5-01 | admin/homepage | page shell | partial |
| CMS-5.6-01 | categories/tags admin | page shells + services | partial |
| CMS-5.7-01 | authors admin | page shell | partial |
| CMS-5.8-01 | media upload API + sharp | media service | done |
| CMS-5.9-01 | users admin + protections | integration last-super-admin | done |
| CMS-5.10-01 | advertisements admin | page shell | partial |
| CMS-5.11-01 | newsletter admin | page shell + cron | partial |
| CMS-5.12-01 | settings + maintenance | settings API + /maintenance | done |
| RBAC-6-01 | Role enum + matrix | unit/rbac | done |
| RBAC-6-02 | requirePermission | ACC tests | done |
| RBAC-6-03 | assertArticleOwnership | unit/rbac | done |
| RBAC-6-04 | tests | unit + integration | done |
| DB-7-01 | prisma/schema.prisma | migrate | done |
| DB-7-02 | FTS migration | migrate | done |
| DB-7-03 | seed + setup:admin | scripts | done |
| SEC-8-01 | argon2 + password zod | unit/password | done |
| SEC-8-02 | lockout | integration/auth | done |
| SEC-8-03 | reset tokens | integration/auth | done |
| SEC-8-04 | session inactivity | auth.ts | done |
| SEC-8-05 | proxy headers | proxy.ts | done |
| SEC-8-06 | audit log | audit.ts | done |
| I18N-9-01 | en/am + fonts + /am routes | pages | done |
| SEO-10-01 | sitemap/rss/news/meta | routes | done |
| SEO-10-02 | robots + admin noindex | e2e robots | done |
| PERF-11-01 | SSR + images | build | partial |
| ACC-01 | visitors view published | integration | done |
| ACC-02 | cannot access unpublished | integration | done |
| ACC-03 | contributors create drafts | workflow + service | done |
| ACC-04 | contributors cannot publish | unit/rbac | done |
| ACC-05 | ownership | unit/rbac | done |
| ACC-06 | editors approve/return | unit + workflow | done |
| ACC-07 | publishers publish | integration workflow | done |
| ACC-08 | scheduled cron | route implemented | partial |
| ACC-09 | breaking expiry | getBreakingNews filter | done |
| ACC-10 | slug uniqueness | ensureUniqueSlug | done |
| ACC-11 | invalid uploads | media service validation | done |
| ACC-12 | alt text on publish | transitionArticle check | done |
| ACC-13 | unauthorized users/settings | integration users | done |
| ACC-14 | last Super Admin | integration | done |
| ACC-15 | suspension | setUserSuspended + sessions | done |
| ACC-16 | reset tokens | integration/auth | done |
| ACC-17 | unsubscribe | integration/newsletter | done |
| ACC-18 | contact rate limit | integration | done |
| ACC-19 | DB search | searchArticles FTS | done |
| ACC-20 | listings/sitemap/RSS | routes | done |
| ACC-21 | admin noindex | robots + proxy | done |
| ACC-22 | production build | `npm run build` OK | done |
