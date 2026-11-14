# Switching the church site over (about 15 minutes, in the church's Vercel account)

For whoever maintains the `Officialkid/ChristhoodWebsite` Vercel project. Production is live at https://www.christhoodministries.org. The separate https://christhood-team-site.vercel.app address is an older test deployment and may not show current production changes.

## 1. Connect a database (free)
Set **`MONGODB_URI`** (Settings → Environment Variables) to the church's MongoDB connection string. In Atlas, allow connections from Vercel (Network Access → `0.0.0.0/0`, since Vercel has no fixed address) and use a database user that can read and write only this database. Collections are created on first use and all start with `ch_`. Alternatively connect **Neon** (Postgres) or **Upstash Redis** from the Vercel Marketplace; MongoDB is used first when more than one is set.

## 2. Add three settings
Project → **Settings → Environment Variables** (Production). Make each value with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

| Name | What it is |
|---|---|
| `AUTH_SECRET` | Signs people in. 32+ characters. |
| `ADMIN_SETUP_KEY` | Any secret phrase. Typed once to create the first administrator. |
| `REGISTRATION_KEY` | Encrypts children's health details in camp applications. 32+ characters. **Keep a copy somewhere safe.** Without it those details can never be read again, and changing it later locks out the old ones. |

Optional: `NEXT_PUBLIC_SITE_URL=https://www.christhoodministries.org` (already the default), email settings, `GOOGLE_SHEET_WEBHOOK`, and httpSMS for camp family texts. For httpSMS, set `HTTPSMS_API_KEY` and `HTTPSMS_FROM` (the E.164 number on the Android phone signed into the httpSMS app); optionally set `CAMP_SMS_TO` to one or more office numbers. Parent application receipts, shared camp notes and away check-in alerts only send after the camp records are saved. See `.env.example`.

## 3. Deploy
The current production site was deployed directly from the local `overramp` checkout on 10 November 2026. That deployment did not create a GitHub commit. Future production changes can be deployed from the same Vercel project, or the `overramp` branch can be merged into `main` after the repository owner approves it. Do not merge to `main` without that approval. **Delete the `legacy/` folder** only after the church is happy with the live site.

## 4. First sign-in
Open `https://www.christhoodministries.org/123admin`. Create the first administrator with the setup key. Then **Team and access → Add a person** for each department head. Each gets a temporary password to share privately and must choose their own.

Give the **Protocol** department to whoever registers new members (only they can). Give the **Camps Department** to the people who run camps: they see every camp application and the returning campers register, can import the register, and manage the camp events and the Jewels and Teen Life pages. Give **Jewels** or **Teen Life** on its own to a programme head who should see only that programme's applications. Give **Camp facilitators** to the people who look after children on camp days, and **Head facilitators** to the people who keep the expected list and the timetable (see "Camp days" below). Every other ministry and programme (Institute of Apologetics, iAct, Branch, Impact and so on) is a department too. **Web & Communications**, **Media** and **Pastoral** are the shared teams.

The **Camp access** section under Team and access shows who can review each camp. Active administrators already have full site access. Add an existing active team member to **Camps Department** for all camps, or to **Jewels** or **Teen Life** for that programme's applications and page. Before saving an assignment, confirm the relevant department head approved the person; the server also requires this confirmation. To add someone new, use **Add a person** and choose Administrator for full site access, or Department head with the approved department for limited access. Only assign delegates approved by the relevant department head.

## 5. Load last year's camper register (optional)
It is a private CSV (not in this repository). Sign in as an administrator → **Camp applications → Returning campers → Import returning campers**, and choose the file. Columns: `id, name, camp, year, age, guardian, location, contact`.

## 6. Check
**System status** (in the team area) shows what is switched on. Send one test prayer request, then delete it under Prayer requests.

## Still to confirm
- The camp consent wording (Part D) names "Nawiri Africa"; the owner approved publishing that exact wording on 10 November 2026.
- Who follows up new members and how soon, and who may read prayer requests.
- The Jewels logo (`legacy/image/Jewels Logo.png`) uses Disney characters and is not used on the site.

## The camps address (waiting on the domain holder)
- Official short address: `camp.christhoodministries.org`. It is already added to the project and the site already answers to it, but Vercel will not serve it until the holder of `christhoodministries.org` proves ownership.
- The domain is registered at NameSilo (expires 25 Feb 2027) and its DNS lives in a Vercel account we cannot see. The holder adds ONE record in that account's DNS (Domains, christhoodministries.org, DNS Records): type TXT, name `_vercel`, value `vc-domain-verify=camp.christhoodministries.org,df36c916c46ba99f635f`.
- Then: verify with `vercel api -X POST /v9/projects/prj_i663jmN8rebC6mBGcwOb4dekrCDm/domains/camp.christhoodministries.org/verify`, check it opens the Camps page, and turn the old `camp.instituteofapologetics.org` into a permanent forward (`vercel api -X PATCH /v9/projects/prj_i663jmN8rebC6mBGcwOb4dekrCDm/domains/camp.instituteofapologetics.org -F redirect=camp.christhoodministries.org -F redirectStatusCode=308`).
- The main address `www.christhoodministries.org` now serves this production site. Check the bare domain separately in Vercel if it is meant to redirect here. The camp subdomain remains pending the DNS verification record above.

## Parents' family page and the camp office
- A first-time parent gets a family page automatically when submitting `/events/apply`: the application and each child's saved details are linked, the parent receives a temporary password on the confirmation screen, and the first family-page visit asks them to choose their own password. If the phone already belongs to a family page, sign in before applying; the form keeps its answers open while the parent signs in from a new tab. Previously submitted applications are attached by the camp office after checking the parent's identity. At `/family`, parents can follow each application, update contact details, and edit the child's saved care information. Changes are copied to current camp applications and flagged for the camp team; consent and payment records are preserved. A new sign-in phone is confirmed by a code. At `/events/apply`, a parent can register up to eight siblings for the same camp together: parent and emergency details are entered once, while each child keeps separate health, consent, media choice and payment amounts. The system stores one application per child so the right programme head can review each one.
- The camp office (Camps Department or administrators) works from **Camp applications**: **Returning campers** (make a one-time family code after checking someone is the parent, then read it out), **Updates to families**, and **Family accounts** (give a temporary password to a parent who forgot theirs).
- Health details stay sealed with `REGISTRATION_KEY`; consent and payment are asked again every year.

## Camp days (facilitators)
- Everything for the days of camp is under **Camp days** in the team area, one screen set per camp that has approved campers.
- **Head facilitators** (and the Camps Department) keep the **timetable** (a session is a day, a time, a name, a place, who leads, and a note families can read), see the **expected list** (every approved child, with age, parent's phone and a "No photos" warning, but never health details), give children to facilitators under **Who looks after whom** (by hand, or "Share the rest out evenly"), mark anyone here or away, and download the day's **register** as a spreadsheet.
- **Camp facilitators** see the timetable and only the children given to them. For those children they mark here or away, open the **care details** (allergies, medication, emergency contacts, photo rule), and write notes. A note is either for the camp team only, or shared, in which case the parent reads it on their family page. Notes are sealed like the health details.
- Opening a child's care details is written to the **Activity log** (at most once every ten minutes per person and child). Take someone out of Camp facilitators and their access to the children given to them ends at once.
- Parents see day-by-day check-ins, the published timetable, shared notes and private camp photos on their family page, but only for linked children. A photo can be shared only when the approved application is linked to the verified family and photo consent is Yes. Each photo request checks the family session, application ownership and current consent. An application made before the parent had a family page is attached by the camp office: open the application, **Family page**, type the parent's phone number (after checking they are the parent). New applications create and link family access as part of submission; a phone number already on an account requires sign-in and is never linked by phone alone.
- Optional family texts use httpSMS. Set `HTTPSMS_API_KEY` and `HTTPSMS_FROM` in the production Vercel project; the sender must be the number on an Android phone signed into httpSMS. Set `CAMP_SMS_TO` only if the camp office should receive new-application alerts. Parents choose whether to receive updates. Texts never contain health details or the content of private notes. These settings are not present in production yet, so text delivery is not active.
- Not built: sign-out and pick-up records, and printing the timetable.

## The team door, Google sign-in and access requests
- **No public link.** Nothing on the website points at the team area, and `/123admin` (and the team's download and upload routes) answer a stranger exactly like a page that does not exist. A team member gets in by typing the phrase on any public page (not inside a box) and pressing Enter, or by tapping the logo seven times on a phone. The first phrase is `123admin`; change it under **Team and access, Team door**.
- **Rotating code.** Under **Team door**, make the code, scan the picture with an authenticator app on each team phone, then switch it on (it asks for a code that works right now, so nobody is locked out by mistake). The phrase then needs the six digits that change every 30 seconds. A code works once.
- **Locked out?** Whoever has the hosting account sets `DOOR_CODE_OFF=1` (the code is not asked) or `DOOR_OFF=1` (the door is removed), then takes it away again.
- **Google sign-in.** The sign-in page offers "Sign in with Google" above the password. It uses the same Google web client as IACT. The public `GOOGLE_CLIENT_ID` is configured in Christhood's Vercel production environment, and the shared OAuth client already authorizes `https://camp-christhood.vercel.app`, `https://christhood-team-site.vercel.app`, `https://camp.christhoodministries.org`, `https://www.christhoodministries.org`, `https://christhoodministries.org` and `https://camp.instituteofapologetics.org` as JavaScript origins. No redirect addresses are needed. If the button disappears, check the production environment variable first; hosting variable changes need a redeploy.
- **Who gets in.** A person on the team list signs in with the Google account that has the same email (Google's own id is then linked, so a recycled email cannot take over the account; a department head's temporary password is retired at that point, an administrator keeps theirs as a way back in). Anyone else who signs in with Google leaves an **access request**: an administrator approves it under **Team and access, Access requests**, chooses Administrator or Department head and the departments, or declines. They are never told why.
- Turn on Google's 2-step verification for every administrator. The door hides the sign-in; the approved list and Google are what keep people out.
