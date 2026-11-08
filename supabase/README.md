# Supabase (website RPCs only)

This repo's `supabase/` directory does **not** own the full database schema —
the Surfmate app's backend (tables, auth, storage, the rest of the RPCs) lives
in the mobile app's own repository and is migrated from there.

The migrations here are additive-only: they add a few website-specific
columns and read-only RPCs (`get_website_*`) on top of tables that already
exist in the linked production project. Because of that, `supabase db reset`
/ `supabase start` won't produce a working local database from this repo
alone — there's no earlier migration here that creates `spots`,
`surf_sessions`, `events`, etc. To develop against real data, point the
website at the existing project's API (see `lib/supabase.js`) instead of
running a local Supabase stack.

New migrations are applied directly to the linked production project with:

```bash
supabase db query --linked -f supabase/migrations/<file>.sql
```

(`supabase db push` is not used here since this repo's migration history
doesn't match the remote project's full history.)
