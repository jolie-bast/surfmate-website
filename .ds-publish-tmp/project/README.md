# Surfmate — design system

Surfmate helps surfers find spots, log sessions, and find each other. The site's voice is direct and a little playful — short headlines in a bold, condensed display face over ocean photography, running copy that stays plain. It's a marketing and community site, not a product UI: most surfaces are full-bleed sections, not dense forms, so the palette leans on one confident brand blue against near-black and white rather than a large neutral ramp.

This system was extracted from the live codebase (`css/variables.css`, `css/base.css`, and the component styles under `css/`) on 2026-09-18. It documents what the site actually ships, values and all — including a couple of rough edges called out below rather than silently smoothed over.

## Foundations

- **Color** is a single light theme: one brand blue (`brand-blue`) plus two ink tones (`ink` near-black, `ink-navy` a deep navy used specifically on blue fills), a small semantic set for success/error/live states, and two soft dark tokens (`ink`, `surface-dark`) that the header, footer, and event cards use as fills, not as a second theme.
- **Type** is three families doing three jobs: `eight-extra-condensed` (weight 900) for the hero and top-level headings only, `seattle` (regular/bold, two separate font files rather than weight variants of one family) for everything else editorial, and `Inter` for interface chrome — buttons, badges, labels. Seattle sits optically high; the source compensates with a small top-padding offset on every text element that follows it. Keep that pairing: Seattle for words people read, Inter for words people click.
- **Spacing** is a 6px-derived 7-step scale (`space-xs` … `space-3xl`), used consistently for both padding and the gaps between flex/grid children.
- **Radius** ranges from a tight 4px up to a full pill; 18px (`radius-xl`) is reserved for the event card, the largest rounded surface on the site — don't reuse it for smaller controls.
- **Shadow** is three resting elevations; the site otherwise prefers borders and translucent fills over shadow for depth (see the event card and nav panel).

## Voice

- Do: short, confident headlines; plain-spoken body copy; verb-first button labels ("Get the app", not "Sign up now!").
- Don't: exclamation marks in headings, dense paragraphs, jargon.

## Not synced — known gaps

- Four CSS custom properties are referenced in the stylesheets but never defined anywhere in `css/variables.css`: `--surfmate-gray` (footer copyright text), `--text-light-gray` / `--primary-black` / `--text-white` (the waitlist form). They currently resolve to nothing (inherited/initial), which is likely an unintended regression. This system does not invent values for them — fix the source, then re-sync.
- `brand-blue` is used directly as the global link color on white body text (`css/base.css`), at roughly 1.9:1 contrast — well under WCAG AA. Flagged on the token itself; worth an underline or a darker link color for in-copy links.
- The wordmark (`assets/Logos/surfmate-wordmark.svg`) is a solid-fill SVG, not single-ink `currentColor`; the header recolors it to white with a CSS `filter`, not a color token. The line icons, by contrast, are proper `currentColor` SVGs.
- No component library ships from this codebase — it's plain HTML/CSS/JS, not React. The five components below are hand-written from the site's actual CSS as a static reference (`components/bundle.css`), not a real bundle; there's no `components/bundle.js`.
