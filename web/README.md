# Web assets (surfmate.eu)

Deploy these files to the public website so Supabase auth emails work on **any device**, not only where the app is installed.

## Auth email landing pages

| File | Deploy to | Purpose |
|------|-----------|---------|
| `auth/callback.html` | `https://surfmate.eu/auth/callback.html` | Sign-up confirm, magic link, email change |
| `auth/reset-password.html` | `https://surfmate.eu/auth/reset-password.html` | Password recovery |

Flow:

1. User taps link in email → Supabase verifies token.
2. Supabase redirects to the HTTPS page with session tokens in the URL hash.
3. On a phone: page opens `surfmate://auth/...` with the same tokens (app login / reset).
4. On desktop: page confirms success and tells the user to sign in on their phone.

## Supabase dashboard

**Authentication → URL Configuration → Redirect URLs** — allow all of:

- `https://surfmate.eu/auth/callback.html`
- `https://surfmate.eu/auth/reset-password.html`
- `surfmate://auth/callback`
- `surfmate://auth/reset-password`

Keep **Site URL** as your primary web origin (e.g. `https://surfmate.eu`).

After deploying new HTML, new confirmation emails use the web redirect automatically.
