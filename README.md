# Christhood Ministries website

The Christhood website with a built-in **team area** at `/123admin`, so each department head can keep their own part of the site up to date without a developer. Built on the `overramp` branch. The original static site is untouched on `main` and kept for reference in `legacy/`.

- Design brief and rules: [`.impeccable.md`](.impeccable.md). Read it before changing the look.
- Agent instructions: [`AGENTS.md`](AGENTS.md).
- Original redesign proposal: `docs/Christhood_Website_Redesign_Proposal.docx`.

## Run it

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # type check
npm run images     # re-prepare the church photos from legacy/image (brighten, balance, sharpen, enlarge)
```

Locally everything works with no setup: changes are kept in a `.data/` folder (ignored by git). Open `http://localhost:3000/123admin` and create the first administrator.

## The team area

Type `/123admin` after the site address. It opens a sign-in page.

| Who | What they can change |
|---|---|
| **Administrator** | Everything, including adding people and choosing their departments |
| **Department head** | Only what their departments own (see below) |

**Departments.** Every ministry and programme is a department. Its head can edit that page (wording, sections, main picture) and the events that belong to it. Three shared teams carry wider jobs:

- **Web & Communications**: home page words, announcement bar, events, messages, leaders and stories, page pictures.
- **Media Team**: the photo library, page pictures, messages, and the Media Ministry page.
- **Pastoral Team**: new guests and prayer requests. Requests marked "pastoral team only" are shown only to this team and administrators.

Protocol, Security & Hospitality heads also see new guests. International Faith Chapel and Counselling heads also see prayer requests that were shared with the intercessory team.

**Screens (each has its own icon in the menu).** Overview · Home page · Pages (every ministry and programme, as sub-items) · Events · Announcement bar · Messages to watch · Leaders and stories · Page pictures · Photo library · New guests · Prayer requests · Share links and QR codes · Church details · Team and access · System status · Activity log · My account. Press `Ctrl K` anywhere to jump to a screen.

**Page pictures.** One screen lists every place on the site that has a main or background picture, grouped by page. Pick a page, choose a new picture (church photos, uploads, or a new upload), click to set which part stays in view, and it changes on the live site at once. "Go back to the original" undoes it.

**Photo library.** Uploads are cleaned up automatically: dull or dark pictures are brightened and balanced, small ones are enlarged with a sharp resize, and everything is sharpened. This is classic image processing (`src/lib/enhance.ts`), not artificial intelligence, so it never invents faces or details. Choose Natural (default), Strong or Off per upload.

## New guests and prayer requests

Replaces the separate visitor and prayer forms project. Public pages: `/visit`, `/prayer` and `/prayer?type=thanksgiving` (old `visit.html` and `prayer.html` addresses redirect). Submissions land in the team area:

- **New guests**: filter by status (new, contacted, settled in), call or WhatsApp in one tap, add notes, download a spreadsheet.
- **Prayer requests and thanksgivings**: same workflow, with the confidentiality choice made on the form respected.
- Spam traps (hidden field, time on form, per-address limit) and a consent tick-box carry over from the original design.
- **Share links and QR codes** prints a QR code for the entrance, the bulletin and the screen after service.
- Optional: a short email (never containing the details) when something arrives, and a copy into the church's private Google Sheet (`integrations/google-sheet/Code.gs`, setup in its header and in System status).

## Putting the team area live (once, in the hosting dashboard)

Everything below is set in the Vercel project, not in code. The **System status** screen in the team area shows what is still missing.

1. **Database (needed to save anything).** Project → Storage → add the free **Upstash Redis** database from the Marketplace and connect it. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or the `UPSTASH_REDIS_REST_*` names). Both work.
2. **`AUTH_SECRET`** (needed to sign in): a long random value, 32 characters or more.
3. **`ADMIN_SETUP_KEY`**: any secret phrase. Typed once on `/123admin` to create the first administrator.
4. Redeploy, open `/123admin`, create the administrator, then add each department head under Team and access. Each gets a temporary password to share privately and must choose their own at first sign-in.
5. Optional: Vercel Blob (large photo libraries), SMTP settings for email alerts, `GOOGLE_SHEET_WEBHOOK`. See `.env.example`.

Until the database is connected the public site still works from the content in `src/content/`, and forms tell visitors to call or WhatsApp instead of losing their message.

## How the site reads content

`src/lib/content.ts` reads what the team saved first and falls back to `src/content/` if nothing was saved or the database is unreachable. Saves call `publish()` (`src/lib/publish.ts`), so changes show on the live site straight away. A page edited in the team area replaces the shipped wording; "Back to the original wording" removes the edit.

## Where things are

| Path | What |
|---|---|
| `src/app/(site)/` | Public pages, including `/visit` and `/prayer` |
| `src/app/123admin/` | The team area (pages and server actions) |
| `src/components/admin/` | Team area interface pieces |
| `src/components/fx/` | Motion: dust in the hero (React Three Fiber), the animated weekly verse (Remotion), headline and scroll reveals (GSAP) |
| `src/lib/store.ts` | Where saved changes live (hosted database, or local files) |
| `src/lib/auth.ts`, `src/lib/rbac.ts` | Sign-in and who may change what |
| `src/lib/enhance.ts`, `src/lib/media.ts` | Photo clean-up and storage |
| `src/content/` | The text and data that ship with the site, and `slots.ts` (every swappable picture) |
| `integrations/google-sheet/` | Optional Google Sheet copy of guests and prayer requests |
| `scripts/optimize-images.mts` | Prepares the church photos into web sizes in `public/img` |
| `public/service-worker.js` | Clears the old site's saved pages from returning visitors' phones |

## Old addresses

Every old `.html` address redirects to its new page (see `next.config.ts`), so bookmarks and search results keep working.

## Before merging to `main`

- `framework` is set to `nextjs` in `vercel.json`, so the existing Vercel project builds this branch correctly.
- Delete `legacy/` once the new site is live and confirmed.
- Confirm the live domain (the old pages refer to `christhoodministries.org`) and set `NEXT_PUBLIC_SITE_URL` to it.
- Camp fees come from the events (Events screen). The old camp form showed KES 9,960 and 9,500 while the events sheet showed KES 10,960. Confirm the correct amounts and set them there.
- The Jewels logo (`legacy/image/Jewels Logo.png`) uses Disney characters. It is not used on the new site. Replace it before using it anywhere public.
