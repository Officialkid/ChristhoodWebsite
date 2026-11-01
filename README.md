# Christhood Ministries website

The new Christhood website, built on the `overramp` branch. The original static site is untouched on `main` and kept for reference in `legacy/`.

- Design brief and rules: [`.impeccable.md`](.impeccable.md). Read it before changing the look.
- Agent instructions: [`AGENTS.md`](AGENTS.md).
- Original redesign proposal: `docs/Christhood_Website_Redesign_Proposal.docx`.

## Run it

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # type check
```

## How the team edits the site without a developer

The admin area lives at `/admin`. Staff sign in with their own email or Google account and edit: website settings (service time, address, phones, giving numbers), the announcement banner, events and camps, messages and sermons, ministry and programme pages, leaders and member stories. Changes appear on the live site within about a minute.

Until the admin area is connected the site shows the content that ships in `src/content/`, so nothing breaks.

### Connect it once (about five minutes)

1. `npx sanity login`, then `npx sanity init --env` in this folder. This creates a free content project and writes `.env.local`.
2. In the Sanity dashboard, open the project's API settings and add the site's address (and `http://localhost:3000`) as an allowed origin, with credentials on.
3. In Vercel, add the same `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` to the project's environment settings, then redeploy.
4. Load today's content so the team edits what is already on the site: create an Editor token in the Sanity dashboard, put it in `.env.local` as `SANITY_WRITE_TOKEN`, then run `npm run seed`. Delete the token afterwards.
5. Invite the team by email from the Sanity dashboard (the free plan includes 20 people).

### What the site reads

`src/lib/content.ts` asks the admin area first and falls back to `src/content/` if it is empty or unreachable. A ministry or programme page edited in the admin area replaces the shipped page with the same address (slug). Adding a new page there adds a new page to the site.

## Where things are

| Path | What |
|---|---|
| `src/app/(site)/` | Public pages |
| `src/app/admin/` | The admin area |
| `src/components/` | Shared interface pieces |
| `src/content/` | The text and data that ship with the site |
| `src/sanity/` | Admin area setup: what can be edited and the labels the team sees |
| `scripts/optimize-images.mjs` | Prepares photos from `legacy/image` into web sizes in `public/img` |
| `scripts/seed-sanity.ts` | One-time import into the admin area |
| `public/service-worker.js` | Clears the old site's saved pages from returning visitors' phones |

## Photos

Photos are prepared ahead of time (`npm run images`) into two sizes with a small blur preview, so pages stay fast on mobile data and no image service quota is used. New photos uploaded in the admin area are served and resized by the admin service.

## Old addresses

Every old `.html` address redirects to its new page (see `next.config.ts`), so bookmarks and search results keep working.

## Before merging to `main`

- `framework` is set to `nextjs` in `vercel.json`, so the existing Vercel project builds this branch correctly.
- Delete `legacy/` once the new site is live and confirmed.
- Confirm the live domain (the old pages refer to `christhoodministries.org`) and set `NEXT_PUBLIC_SITE_URL` to it.
- Camp fees are read from the events in the admin area. The old camp form showed KES 9,960 and 9,500 while the events sheet showed KES 10,960. Confirm the correct amounts and set them there.
- The Jewels logo (`legacy/image/Jewels Logo.png`) uses Disney characters. It is not used on the new site. Replace it before using it anywhere public.
