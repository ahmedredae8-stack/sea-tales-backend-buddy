# Vercel deployment

Import this repository into Vercel. The project uses Nitro’s `vercel` preset, producing `.vercel/output` with server rendering and static assets. Keep Framework Preset as Other and leave Output Directory unset; do not override it with `.output/public`.

Set these Environment Variables for Production and Preview using the existing project values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

If server features use the corresponding variables, also set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_PROJECT_ID`. Never put a service-role or secret key in a `VITE_` variable.

Add the Vercel site URL to your existing account sign-in redirect allowlist. Images hosted by Lovable remain CDN assets; publishing on Vercel does not copy their storage or your existing database.

Configuration is prepared locally; an actual Vercel deployment and its environment settings must be configured and verified in your Vercel account.