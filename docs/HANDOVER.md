# Switching the church site over (about 15 minutes, in the church's Vercel account)

For whoever holds the `Officialkid/ChristhoodWebsite` Vercel project. The code is finished and tested on the `overramp` branch. A working copy is at https://christhood-team-site.vercel.app for you to look at first.

## 1. Connect a database (free)
Set **`MONGODB_URI`** (Settings → Environment Variables) to the church's MongoDB connection string. In Atlas, allow connections from Vercel (Network Access → `0.0.0.0/0`, since Vercel has no fixed address) and use a database user that can read and write only this database. Collections are created on first use and all start with `ch_`. Alternatively connect **Neon** (Postgres) or **Upstash Redis** from the Vercel Marketplace; MongoDB is used first when more than one is set.

## 2. Add three settings
Project → **Settings → Environment Variables** (Production). Make each value with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

| Name | What it is |
|---|---|
| `AUTH_SECRET` | Signs people in. 32+ characters. |
| `ADMIN_SETUP_KEY` | Any secret phrase. Typed once to create the first administrator. |
| `REGISTRATION_KEY` | Encrypts children's health details in camp applications. 32+ characters. **Keep a copy somewhere safe.** Without it those details can never be read again, and changing it later locks out the old ones. |

Optional: `NEXT_PUBLIC_SITE_URL=https://www.christhoodministries.org` (already the default), the email settings for welcome emails and alerts, and `GOOGLE_SHEET_WEBHOOK`. See `.env.example`.

## 3. Deploy
Merge `overramp` into `main` (this replaces the old static site), or point the Vercel project's production branch at `overramp` first to check it. Then **delete the `legacy/` folder** once you are happy.

## 4. First sign-in
Open `https://www.christhoodministries.org/123admin`. Create the first administrator with the setup key. Then **Team and access → Add a person** for each department head. Each gets a temporary password to share privately and must choose their own.

Give the **Protocol** department to whoever registers new members (only they can). Give the **Camps Department** to the people who run camps: they see every camp application and the returning campers register, can import the register, and manage the camp events and the Jewels and Teen Life pages. Give **Jewels** or **Teen Life** on its own to a programme head who should see only that programme's applications. Every other ministry and programme (Institute of Apologetics, iAct, Branch, Impact and so on) is a department too. **Web & Communications**, **Media** and **Pastoral** are the shared teams.

## 5. Load last year's camper register (optional)
It is a private CSV (not in this repository). Sign in as an administrator → **Camp applications → Returning campers → Import returning campers**, and choose the file. Columns: `id, name, camp, year, age, guardian, location, contact`.

## 6. Check
**System status** (in the team area) shows what is switched on. Send one test prayer request, then delete it under Prayer requests.

## Still to confirm
- The camp consent wording (Part D) still names "Nawiri Africa": confirm it before public rollout.
- Who follows up new members and how soon, and who may read prayer requests.
- The Jewels logo (`legacy/image/Jewels Logo.png`) uses Disney characters and is not used on the site.
