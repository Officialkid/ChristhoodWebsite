# Christhood website: agent instructions

Next.js (App Router) site for Christhood Ministries, with a Sanity admin area at `/admin`. Work happens on the `overramp` branch. Never push to `main` without the owner's say-so (the repo belongs to another GitHub account, `Officialkid`).

## Before any visual change
1. Read `.impeccable.md`. It is the design brief: warm paper, ink type, one royal purple, gold only for the single main action, photographs first, cardless layouts.
2. Use the shared skills (`impeccable`, `ui-ux-pro-max`, `web-design-guidelines`). The library and its notes are in `C:\Projects\_tools\skills\README.md`.
3. Do not bring back: gradients or glows, glassmorphism, gradient or italic headings, icon tiles, rounded cards with shadows, tracked all-caps labels, stat strips, scrolling ribbons, pill buttons.
4. Fonts are Archivo (headings, UI) and Literata (reading text). Colours are the tokens in `src/app/globals.css`. Do not add new colours.

## Rules for content
- Plain words a non-technical reader understands. Never name the technology on public pages.
- Keep the church's own wording. Do not invent facts, dates, prices or quotes.
- Anything the team may need to change belongs in the admin area (`src/sanity/schema.ts` and `src/lib/content.ts`), not hard-coded in a page.

## Checks before committing
- `npm run lint` (type check) and `npm run build` must pass.
- Check the result in a real browser at 390px and 1440px wide. Playwright is off limits on this machine (token cost); use a node script over Chrome DevTools (see the Memory note `reference-cdp-browser-verification`).
- Accessibility must stay at zero axe violations.

## Do not read or edit
`legacy/` (the original site, kept only as a reference), `node_modules/`, `.next/`, `public/img/` (generated).
