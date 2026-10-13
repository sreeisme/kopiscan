# Menuly

QR menus & table ordering for restaurants. See `CLAUDE.md` for architecture and rules.

## First-time setup (≈30 min)

### 1. Supabase (create TWO projects: `menuly-dev` and `menuly-prod`, region **Singapore**)
For each project:
1. **Project Settings → API**: copy the URL, `anon` key and `service_role` key.
2. **Project Settings → Database → Connection string → Session pooler**: copy the URI (with your DB password) → `SUPABASE_DB_URL`.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (dev) / `https://YOUR-DOMAIN` (prod)
   - Redirect URLs: add `http://localhost:3000/**` (dev) and `https://YOUR-DOMAIN/**`, `https://*.vercel.app/**` (prod)
4. **Authentication → Providers → Email**: keep Email enabled, **disable "Allow new users to sign up"** (accounts are invite-only).
5. **Authentication → Email Templates**: paste the files from `supabase/email-templates/` into *Invite user*, *Magic Link* and *Reset Password*.
6. **Authentication → SMTP Settings** (prod, required): enable custom SMTP using Resend (`smtp.resend.com`, port 465, user `resend`, password = Resend API key, sender `no-reply@YOUR-DOMAIN`). The built-in sender only allows a few emails per hour.

### 2. Local env
```bash
cp .env.example .env.local      # fill in the DEV project values
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"   # → SESSION_SECRET
npm install
npm run db:push                 # creates all tables, policies, functions, storage bucket
npm run make-admin -- you@example.com 'a-long-password'
npm run seed -- --owner owner@example.com --staff staff@example.com --password 'another-long-pass'
npm run dev
```
Open the scan links printed by `npm run seed` to act as a diner. Sign in at `/login` as staff in another browser to see the live board.

### 3. Vercel
1. Push to GitHub → **Import** in Vercel.
2. Environment variables (Production = prod Supabase, Preview = dev Supabase): every key in `.env.example` except `SUPABASE_DB_URL`.
   `NEXT_PUBLIC_SITE_URL` = `https://YOUR-DOMAIN` in Production.
3. Add your domain under **Settings → Domains**. Function region is pinned to `sin1` by `vercel.json`.

### 4. Onboarding a restaurant
`/admin` → *New restaurant* (name, slug, plan, owner email) → owner receives an invite → they set a password, build the menu at `/owner/menu`,
add tables at `/owner/tables`, brand it at `/owner/branding`, then **Print table cards**. After payment, change the plan in `/admin`.

## Everyday commands
```bash
npm run check       # typecheck + lint + unit tests
npm run test:e2e    # browser + security tests against the DEV project
```

## Launch checklist
- [ ] Final domain set in `NEXT_PUBLIC_SITE_URL` **before** printing any QR cards
- [ ] Prod Supabase: signups disabled, SMTP configured, templates pasted, redirect URLs set
- [ ] Supabase Pro plan for daily backups / PITR once you have paying customers
- [ ] Privacy policy + terms (PDPA) linked from the landing page
- [ ] Test on a real phone: scan a printed card, order, staff tablet chimes after "Start shift"
- [ ] Error monitoring (e.g. Sentry) added
