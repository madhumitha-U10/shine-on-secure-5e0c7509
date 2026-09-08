# Deploying NammaSpot to Vercel

The site is a TanStack Start app. The build already targets Vercel
(`nitro: { preset: "vercel" }` in `vite.config.ts`), so no adapter work is needed.

## 1. Prepare the backend pieces

1. **Google Sheet + Apps Script** — deploy `backend/Code.gs` as a Web App
   ("Execute as: me", "Who has access: anyone"). Copy the `/exec` URL and the
   write token you set inside the script.
2. **Supabase** — apply the migrations in `supabase/migrations`. Note the project
   URL, the publishable (anon) key and the service-role key.
3. **Admin password** — pick a long random string for the `/admin` console.

## 2. Create the Vercel project

1. Push this repository to GitHub and import it at vercel.com → **Add New… → Project**.
2. Framework preset: **Other**. Build command `npm run build`, output directory
   left at the default (`.vercel/output`, produced automatically). Install
   command `npm install` (or `bun install` if you prefer Bun).
3. Node version: 22.x.

## 3. Add the environment variables

Copy every name from `.env.example` into **Settings → Environment Variables**,
for both **Production** and **Preview**:

| Name | Scope | Notes |
| --- | --- | --- |
| `SHEETS_API_BASE` | server | Apps Script `/exec` URL |
| `SHEETS_WRITE_TOKEN` | server | must match the script |
| `ADMIN_PASSWORD` | server | `/admin` login |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | server | SSR reads |
| `SUPABASE_SERVICE_ROLE_KEY` | server | never expose |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | public by design |
| `LOVABLE_CRON_SECRET` | server | only if you use the scheduled endpoints |

Anything prefixed `VITE_` is embedded in the browser bundle — keep the write
token, service-role key and admin password unprefixed.

## 4. Deploy and smoke-test

After the first deploy, walk through:

- home, explore, categories, near-me, featured, saved, stories
- a shop page and a product page
- seller register → seller login → dashboard (edit a product, remove a product,
  upload a photo) and confirm the change appears on a second device
- `/admin`: approve a shop, reject a shop, confirm a rejected shop disappears
  from browsing, search and its own dashboard (the applicant sees the
  "not approved" message)
- `/sitemap.xml` returns URLs

## 5. Custom domain

Settings → Domains → add the domain and follow the DNS records Vercel shows.
Update the Supabase Auth "Site URL" and redirect URLs to the live domain
afterwards, or seller sign-in emails will point at the wrong host.
