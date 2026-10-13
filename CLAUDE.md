# Kopiscan — CLAUDE.md

Multi-tenant SaaS that turns a restaurant's physical menu into a QR ordering web app (Singapore market).
Diners scan a table QR → browse → order / call waiter / request bill. Staff see a live board. Owners edit the menu,
tables/QR codes and branding. A platform admin (us) creates restaurants and sets plans. Billing is manual (PayNow); no online diner payment in v1.

## Stack
Next.js 15 App Router + Server Actions · TypeScript · Tailwind v4 · Supabase (Postgres/RLS, Auth, Storage, Realtime) · Vercel `sin1` · zod · jose · qrcode · Vitest · Playwright.
No shadcn: dashboard primitives live in `src/components/dash/ui.tsx`.

## Commands
| | |
|---|---|
| `npm run dev` | local dev on :3000 (needs `.env.local`) |
| `npm run check` | typecheck + lint + unit tests. **Run before every commit.** |
| `npm run test:e2e` | Playwright against the DEV Supabase project (seeds `e2e-pro` / `e2e-basic`) |
| `npm run db:push` | apply `supabase/migrations/*` to the DB in `SUPABASE_DB_URL` |
| `npm run db:types` | regenerate `src/lib/database.types.ts` |
| `npm run seed` | (re)create the `demo-kopitiam` restaurant; prints table scan links |
| `npm run make-admin -- email [password]` | grant platform admin |

## Map
```
src/app/t/[qrToken]/route.ts   QR scan → validates token, creates table session, sets signed cookie
src/app/r/[slug]/...           DINER (themed): menu, cart, order/[id], orders
src/app/(dash)/staff           live board, summary (+csv)
src/app/(dash)/owner/*         menu, tables (+qr download, print), branding, staff, settings, analytics
src/app/admin                  platform admin (outside (dash): admins may have no membership)
src/components/diner/*         diner UI — THEME TOKENS ONLY
src/components/dash/*          dashboard UI
src/server/actions/*           ALL mutations ("use server" — every export is a public endpoint!)
src/server/*.ts                server-only helpers (diner-data, summary, qr, users)
src/lib/plans.ts               tier matrix — single source of truth
src/lib/theme/*                ThemeSchema, defaults, presets, resolve (plan stripping → CSS vars), contrast
src/lib/session.ts             diner table session (jose cookie + DB row)
src/lib/pricing.ts             server-side order pricing (source of truth for totals)
src/lib/rate-limit.ts          wrapper over Postgres hit_rate_limit()
supabase/migrations/           schema, RLS, grants, triggers, functions (place_order, hit_rate_limit)
```

## Non-negotiable rules
1. **Diners never touch Supabase directly.** `anon` has no table grants. Diner reads/writes go through server code using
   `createAdminClient()` (service role) **after** authorising. Every diner mutation follows this order:
   restaurant lookup → `getActiveSession(slug)` → zod parse → rate limit → `priceOrder()` (server prices) → write.
2. **Never trust client prices, totals, item availability or table ids.** The table comes from the session, never the request body.
3. **Service-role key only via `src/lib/supabase/admin.ts`** (imports `server-only`). Never import it into a client component.
   Prefer the RLS-scoped `createClient()` from `lib/supabase/server.ts` for owner/staff writes (defence in depth); use the
   service role only for narrow, already-authorised operations (and say why in a comment).
4. **`"use server"` files may export only async functions, and every export is callable by anyone.** Each action must
   authorise itself (`requireMember()`, `requireMember({ role: "owner" })`, `requirePlatformAdmin()`). Helpers that must
   not be public go in `src/server/*.ts` with `import "server-only"`.
5. **Diner components use only theme tokens**: `bg-m-*`, `text-m-*`, `border-m-*`, `rounded-m`, `font-m-heading|body`.
   No hard-coded colours, fonts, radii or user-facing button copy (use `theme.labels`). New customisable things →
   add to `ThemeSchema` + `DEFAULT_THEME` + `resolveTheme` plan stripping + branding editor + tests.
6. **Every tiered feature is registered in `src/lib/plans.ts`** and gated in three places: UI (hide/disable + `<Upsell>`),
   server action (`assertFeature` / `assertLimit`), and, for counts, the DB trigger (`plan_limits` must equal `LIMITS` —
   `tests/unit/plans.test.ts` enforces this).
7. **Schema changes = new migration file** (never edit an applied one) + RLS policies + column grants + `npm run db:types`.
   Every table gets RLS enabled. Staff may only update `status` columns (column-level grants).
   Supabase auto-grants `anon`/`authenticated` on new tables & functions, so each migration that adds one must
   `revoke all on <table> from anon;` (and `revoke execute ... from public, anon, authenticated` for service-only functions).
8. **Money is integer cents (SGD); display with `formatSgd`.** Times display in `Asia/Singapore` (`lib/restaurant.ts` helpers).
9. Owner-facing errors go through `toError()` (`server/actions/result.ts`) — never leak raw DB errors.
10. Destructive UI actions get an in-page confirm (no `window.confirm`).

## Testing / definition of done
- `npm run check` green. Add unit tests for pure logic (`tests/unit`), e2e for flows and security boundaries (`tests/e2e`).
- Security-relevant changes (RLS, grants, actions, session) need a test in `tests/e2e/security.spec.ts`.
- Check diner pages at 375px width and in at least two presets (light + "Noir" dark).
- `npm run build` must pass; grep `.next/static` for the service key if you touched env handling.

## Gotchas
- Zod is v4 (`z.uuid()` style also available; `.deepPartial()` doesn't exist — see `mergeTheme`).
- Auth emails must use the token_hash templates in `supabase/email-templates/` (see README) or invites break.
- Browsers block sound until a user gesture → staff board has a "Start shift" button. Keep it.
- QR URLs embed `NEXT_PUBLIC_SITE_URL`. Changing domains after printing breaks printed cards — set the final domain first.
- Realtime is best-effort; the staff board also polls every 20s. Don't remove the poll.
