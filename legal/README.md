# Legal documents (surfmate.eu)

Source copies for the public legal pages linked from the mobile app.

**Before releasing an app version with a bumped `LEGAL_CONSENT_VERSION`:**

1. Deploy the updated HTML files to `https://surfmate.eu/`.
2. Confirm URLs match `apps/mobile/features/legal/constants/legal-documents.ts`.
3. Ship the app update so users with outdated consent see the **Legal update** prompt.

## Files

| File | Deploy target | Notes |
|------|---------------|-------|
| `community-guidelines.html` | `/community-guidelines.html` | Full replacement (2026-06-10) |
| `privacy-social-addendum.html` | Insert into `/datenschutz-app.html` | New §3.11 + §3.7 tweak |
| `terms-social-addendum.html` | Insert into `/terms.html` | §2 + §5 additions |

## 2026-06-10 changes (social feed)

- Document mates feed, session comments, comment likes, mate tagging, and related push notifications.
- Community Guidelines: in-app reporting as primary channel; appeals reference.
- App legal version bumped to `2026-06-10` (triggers re-consent for existing users).

## Disclaimer

These texts support compliance but are not legal advice. Have a qualified lawyer review before publication.
