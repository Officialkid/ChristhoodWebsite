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

**Screens (each has its own icon in the menu).** Overview · Home page · Pages (every ministry and programme, as sub-items) · Events · Announcement bar · Messages to watch · Leaders and stories · Page pictures · Photo library · New guests · Prayer requests · Share links and QR codes · Church details · Team and access (including Camp access) · System status · Activity log · My account. Press `Ctrl K` anywhere to jump to a screen.

**Page pictures.** One screen lists every place on the site that has a main or background picture, grouped by page. Pick a page, choose a new picture (church photos, uploads, or a new upload), click to set which part stays in view, and it changes on the live site at once. "Go back to the original" undoes it.

**Photo library.** Uploads are cleaned up automatically: dull or dark pictures are brightened and balanced, small ones are enlarged with a sharp resize, and everything is sharpened. This is classic image processing (`src/lib/enhance.ts`), not artificial intelligence, so it never invents faces or details. Choose Natural (default), Strong or Off per upload.

## New members, prayer requests and camp applications

These replace two earlier projects: the visitor and prayer forms (`CIOM`) and the camps portal. Both folders were retired on 2026-11-01 after their useful parts were brought in.

**New members: the Protocol team only.** Nobody can sign themselves up as a member. The public page `/visit` explains what to expect and who will welcome you. Members are registered from the team area by the Protocol department (or an administrator) under **New members → Register a new member**: name, phone, email (or a tick that they have none), visit details, and a consent tick once the person has agreed. If email is switched on (see `.env.example`), a short welcome email goes to them. Other departments, such as the Pastoral Team, can follow members up but cannot register them. The check is made on the server, not just in the menu.

**Prayer requests and thanksgivings** (`/prayer`, `/prayer?type=thanksgiving`) stay public, anonymous if wished, with the "pastoral team only" choice respected. Spam traps (hidden field, time on form, per-address limit) and a consent tick-box carry over from the original design.

**Camp applications** (`/events/apply`) are the camps portal's registration, rebuilt on this site. A parent can register one to eight children for the same open camp in one submission. Camp choice, parent details, emergency contacts and payment reference are shared; each child has separate health and care details, consent, media choice, payment status and amount, and gets an individual application for the relevant programme head. The form uses the Teenlife Registration Form (2026): guardian, up to three emergency contacts, health and care, consent and optional media authorization (the original Part D wording, kept word for word in `src/content/camp-consent.json`, including its Nawiri Africa organisation name; the wording was approved for publication on 10 November 2026), and declared payment. Nothing is charged on the site. Children's health, family and consent details are **encrypted before they are saved** (AES-256-GCM, `src/lib/crypto.ts`) with `REGISTRATION_KEY`; without a key the page tells parents to WhatsApp the camp office instead of saving anything. Rules carried over: at least one emergency contact, age checked against the published programme ranges (Jewels 7 to 12, Teen Life 13 to 19) and flagged for a person to look at rather than refused, and duplicate applications for the same child and camp are refused. The Jewels and Teen Life heads see only their own programme's applications under **Camp applications**: read the details, check the payment, mark Approved, Needs correction or Declined, download a list. Facilitator and sponsor sign-ups stay on `/events/register`.

**Camp access.** An administrator opens **Team and access → Camp access** to see and assign reviewers. Active administrators already have full access. **Camps Department** can review every camp and use the camp operations tools; **Jewels** and **Teen Life** are limited to their own programme. The administrator can add an existing active team member to an approved department, after confirming the department head approved them, or use **Add a person** to create a new account. Choose Administrator for full site access, or Department head and the approved department for limited access. A camp assignment does not change the person's other departments. Removing their only department is blocked until another department is assigned; switching off the account stops sign-in.

**Camp days** (`/123admin/camps/day`) are the facilitators' tools: a timetable per camp, the expected list (approved applications; no health details for head facilitators), who looks after whom, attendance per day, a downloadable register, and care details plus notes for the children a facilitator was given. Shared notes and the timetable appear on the parent's `/family` page. Departments **Camp facilitators** (`camps:day`, `camps:care`) and **Head facilitators** (`camps:day`, `camps:roster`) carry the permissions; the Camps Department has `camps:day` and `camps:roster`. Collections: `camp-sessions`, `camp-assignments`, `camp-attendance` (id `<application>~<date>`), `camp-notes` (sealed). Code: `src/lib/camp-day.ts`, `src/app/123admin/actions-day.ts`, `src/app/123admin/camps/day/`.

**Family page** (`/family`) gives each signed-in parent the progress for only their linked children: application and payment status, day-by-day check-ins, the published timetable, notes the camp team shared, and private photos. A first-time parent gets a family page automatically when submitting a camp application; the child and application are linked immediately, and the confirmation shows a temporary password which must be changed on first visit. If a phone number already belongs to a family page, the parent signs in before applying so another person cannot claim that account. Applications made before a family page existed are linked by the camp office after checking the parent's identity. Parents can edit a child's saved details; updates also reach current camp applications and are flagged for the camp team. Signed consent and payment records are preserved. Camp staff can share a photo from a camper's care page only after the application is linked to a verified family and the parent's photo permission is Yes. Images are resized and encrypted with `REGISTRATION_KEY` in the same live database; the image route checks the family session and application on every request. Parents can update their name/email; changing the sign-in phone requires a one-time code to the new number. A parent can opt in to brief texts for application receipts, newly shared notes and newly recorded away check-ins when httpSMS is configured. Texts contain no health information or note contents.

**Team door, Google sign-in and access requests.** `src/proxy.ts` hides the team area: without a signed-in session or a pass from the door, `/123admin`, `/123admin/**` and `/api/admin/**` answer 404 like any page that does not exist. The door is `POST /api/door` (a phrase, `123admin` until the administrator changes it, then kept scrambled) and `POST /api/door/code` (a six-digit code that rotates every 30 seconds, RFC 6238, its secret sealed with `REGISTRATION_KEY`); both are throttled and say nothing when they refuse, and `src/components/TeamDoor.tsx` is the hidden trigger (type the phrase outside a box and press Enter, or tap the logo seven times). Google sign-in (`GOOGLE_CLIENT_ID`, the same web client the Institute of Apologetics uses) checks Google's RS256 ID token with a one-time nonce (`src/lib/google-verify.ts`): an email on the team list signs in, anyone else becomes an access request that an administrator approves under Team and access (`src/lib/google-decide.ts`). `DOOR_OFF=1` removes the guard and `DOOR_CODE_OFF=1` stops asking for the code. See `docs/HANDOVER.md`.

**Returning campers.** The 2025 register from the old portal (66 campers: 27 Jewels, 39 Teen Life) is imported under **Camp applications → Returning campers** so the programme heads can invite families back. Names are searchable; guardians and areas are sealed. Administrators import an updated CSV on that screen (columns `id, name, camp, year, age, guardian, location, contact`), or load one straight into the database with `scripts/import-camp-roster.mts`. The register file itself is never kept in this repository.

The old camps portal was a local prototype and had no live family or facilitator records. The family pages and camp-day tools described above are the rebuilt versions; the 2025 camper register is the only record imported from that portal.

Also available: **Share links and QR codes** for the bulletin, a spreadsheet download of each list, and an optional copy into the church's private Google Sheet (`integrations/google-sheet/Code.gs`, setup in its header and in System status).

## Putting the team area live (once, in the hosting dashboard)

Everything below is set in the Vercel project, not in code. The **System status** screen in the team area shows what is still missing.

1. **Database (needed to save anything).** Set **`MONGODB_URI`** to a MongoDB connection string (the Atlas free tier works; allow Vercel in its network access list), or connect a free Marketplace database: **Neon Postgres** (adds `DATABASE_URL`/`POSTGRES_URL`) or **Upstash Redis** (adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`). Whichever is set is used (MongoDB first). Collections or tables are created on first use and all start with `ch_`, so the same MongoDB database can safely hold other things too.
2. **`AUTH_SECRET`** (needed to sign in): a long random value, 32 characters or more.
3. **`ADMIN_SETUP_KEY`**: any secret phrase. Typed once on `/123admin` to create the first administrator.
4. **`REGISTRATION_KEY`**: a long random value (32+ characters). Encrypts children's health details in camp applications. Keep a copy somewhere safe: without it those details cannot be read again.
5. Redeploy. On a new empty database, open `/123admin` and create the first administrator; on the live production database, existing administrators sign in there. Then add each department head under Team and access. Each new account gets a temporary password to share privately and must choose their own at first sign-in.
6. Optional: Vercel Blob (large photo libraries), SMTP settings for email alerts, `GOOGLE_SHEET_WEBHOOK`. See `.env.example`.

Until the database is connected the public site still works from the content in `src/content/`, and forms tell visitors to call or WhatsApp instead of losing their message.

## The online test copy

A separate test copy runs at **https://christhood-team-site.vercel.app** (Vercel project `christhood-team-site`, free Neon Postgres database `christhood-team-db`). It is kept out of search results (`NOINDEX=1`) and may not match production. Do not copy its database or environment values into production.

The live site is **https://www.christhoodministries.org**, on Vercel project `christhood-website` in team `tests-projects-82a39f14`. It uses the live Atlas database `christhood` in the Christhood Platform project. Camp applications are open there. The test copy remains separate and is not used by parents or the camp team.

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

### Connect the photo archive

The team area's Photo library embeds the full Immich web app in Christhood's Media section. A compact Christhood picker remains available there for selecting photos to copy into Cloudinary folders; those copies are then available for page pictures through the existing chooser. The site does not run the photo archive server itself.

Set these private environment variables in the hosting dashboard:

- **IMMICH_SERVER_URL**: the Immich base address, such as https://photos.example.org (do not add /api). The deployed site must be able to reach this address over HTTPS. A server available only on a home or church local network cannot be reached by Vercel.
- **IMMICH_WEB_URL**: optional browser address for the Immich web app. It defaults to `IMMICH_SERVER_URL`. Immich must be served at the root of its own domain; it does not support a subpath such as `/media`. For embedded sign-in to work reliably, use an Immich subdomain under the same Christhood domain. Configure its reverse proxy to remove `X-Frame-Options` and allow the Christhood site in the `Content-Security-Policy` `frame-ancestors` directive. Keep the rest of Immich's security policy in place. See the [Immich reverse proxy guide](https://docs.immich.app/administration/reverse-proxy/).
- **IMMICH_API_KEY**: an Immich API key with `asset.read`, `asset.view`, `asset.download`, `asset.update`, `album.read`, `album.create`, `albumAsset.create` and `albumAsset.delete` permissions. These allow photo browsing, previews, description search, favorites, archiving and album management. Do not grant `asset.delete` for this integration. Immich smart search must be enabled and its photo index ready.
- **CLOUDINARY_CLOUD_NAME**, **CLOUDINARY_API_KEY**, and **CLOUDINARY_API_SECRET**: the Cloudinary account used to deliver website images. Keep the API secret private.
- **CLOUDINARY_ASSET_FOLDER**: the Cloudinary Media Library folder for imports. Defaults to `christhood/media`.
- **CLOUDINARY_FOLDER_MODE**: `dynamic` by default; use `fixed` only if the Cloudinary product environment is on legacy fixed folders. The upload code sets the actual folder for either mode while keeping the same `christhood/media/...` delivery ID path.

Set the values for the desired Vercel environments and redeploy. The Immich key and Cloudinary secret are used only by server routes; they are never sent to the browser. The full Immich web app opens inside Christhood's Photo library; its own sign-in remains in place. The Media Team can then use the Christhood picker to copy selected photos into the chosen Cloudinary folder. The copied image is available to the existing page-picture chooser. The Immich server must be reachable from Vercel over HTTPS; a server available only on a home or church local network cannot be reached by the deployed site.

For Codex, `.codex/config.toml` registers Cloudinary's official Asset Management MCP for this repository. Trust the repository and sign in through Codex OAuth to browse or manage Cloudinary assets and folders. This connection does not reveal the API secret required by the website; obtain that from Cloudinary Console Settings and add it directly to Vercel.

## Old addresses

Every old `.html` address redirects to its new page (see `next.config.ts`), so bookmarks and search results keep working.

## Before merging to `main`

- `framework` is set to `nextjs` in `vercel.json`, so the existing Vercel project builds this branch correctly.
- Delete `legacy/` once the new site is live and confirmed.
- Live domain: `https://www.christhoodministries.org` (the bare `christhoodministries.org` redirects to it; both are served by Vercel and currently show the old static site from `main`). It is now the default site address. Override with `NEXT_PUBLIC_SITE_URL` if that changes.
- Camp fee is KES 10,960 for both camps (confirmed by the owner, and the same as the Teen Life edition in the old camps portal). Heads can change it on the Events screen.
- The Jewels logo (`legacy/image/Jewels Logo.png`) uses Disney characters. It is not used on the new site. Replace it before using it anywhere public.
