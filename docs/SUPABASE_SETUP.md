# Investory — Supabase & Reports Setup

## What was added

### Dynamic investment reports
- Reports page derives one graph card per investment component that has invested monthly data
- No hard-coded investment types (PPF/SIP/Gold/NPS appear automatically after first contribution)
- Click a card for an expanded report (sidebar stays visible) with analysis + client-side PDF download

### Supabase cloud persistence
- Optional email/password auth via Supabase Auth
- Cloud is source of truth when logged in; localStorage remains a fast cache / offline fallback
- Export / Import / Clear in Settings remain intact

---

## Environment configuration

Edit both files and paste your Supabase **Project URL** and **anon/public** key (never the service-role key):

- `src/environments/environment.ts` (local `ng serve`)
- `src/environments/environment.production.ts` (production / GitHub Pages)

```ts
export const environment = {
  production: false, // true in production file
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY',
};
```

Leave both empty to keep the app fully local-only.

---

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full script in `supabase/schema.sql`
3. Enable **Email** auth under Authentication → Providers
4. (Optional) Disable email confirmations for easier local testing under Authentication → Settings
5. Copy Project URL + anon key into the Angular environment files

### Tables created
| Table | Purpose |
|-------|---------|
| `profiles` | 1:1 with `auth.users` |
| `investment_components` | Dynamic investments (PPF, SIP, Gold, …) |
| `monthly_investments` | Monthly records; entries stored as JSONB |
| `user_sync_meta` | `updated_at` / version for sync |

All tables have **RLS** policies so users only access their own rows.

---

## Local development

```bash
npm install
# set environment.supabaseUrl / supabaseAnonKey
npm start
```

Open Settings → Cloud Account to sign up / sign in.

---

## GitHub Pages deploy

Existing workflow (`.github/workflows/deploy.yml`) still builds with:

```bash
npm run build -- --configuration production --base-href /Investory/
```

Ensure `environment.production.ts` contains your Supabase URL and anon key before pushing to `main`.

For GitHub Pages + Supabase Auth, add your site URL to Supabase **Authentication → URL Configuration** (Site URL and Redirect URLs), e.g. `https://<user>.github.io/Investory/`.

---

## npm packages added

- `@supabase/supabase-js`
- `jspdf`
- `html2canvas`

---

## Architecture (authenticated)

```
UI change → signal state → localStorage (immediate)
                         → SyncService (debounced async push to Supabase)
```

On load (logged in): render cache → restore session → fetch cloud → reconcile → update cache/UI.

Offline: local writes queue via a pending flag; sync retries when connectivity returns.
