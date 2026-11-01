> Notes carried over from the old local camps portal (retired 2026-11-01). Kept for the features not yet rebuilt here: family accounts, facilitators, timetable, attendance and wellbeing.

# Local camps portal

Run `npm run local` from this folder, then open http://127.0.0.1:5190/.
Requires Node.js 24. Keep the server terminal running.

On first visit, create the leader account with a password of at least 12 characters.
No default passwords exist. Leaders create family accounts and select their children.
Share credentials directly with the guardian.

The database is in `.local-data/camps.sqlite`. Stop the server before copying the
entire `.local-data` folder for a consistent backup, including SQLite sidecar files.
The folder is excluded from Git. The source workbook is unchanged.

The 2025 roster is seeded once. Ages are historical. Attendance and wellbeing begin
as Not recorded. Activities and notes begin empty. Phone contacts were not imported;
leaders or parents can enter them through the profile form.

Supported: leader setup/login, family login, camper search/filter/export, saved
profile edits, attendance, wellbeing, private notes, shared family updates,
published activities, family accounts linked to children, messages, and audit trail.

The server binds only to this computer. Ministry website integration requires a
hosted backend, HTTPS, backups, and account recovery. Publishing just the frontend
through Sites will not deploy the local Node/SQLite backend.

## Sign-in and families

The front page has separate Parents & guardians and Leaders & facilitators tabs.
Existing staff use their original username and password. After setup, the setup
screen is no longer the default; after signing out, choose the appropriate tab.
Existing legacy username-based parent accounts can still use the username sign-in.

For an existing camper, the leader opens Family invitations, independently verifies
the guardian, selects their children, and shares the one-time code directly.
The parent uses Connect your existing records, their phone, guardian name, one
child's name and the code, then chooses a password. Codes expire after 72 hours.
To add a sibling to an existing phone account, use its existing family password.
No SMS has been sent and no telephone-ownership verification provider is connected.
Names and phone numbers alone never unlock an existing child profile.
New families use Register for the first time and then Registration. They start
with no access to other records. Phone numbers beginning with 0 normalize to +254.
Changing a child's contact phone does not change the family account login phone.

## Annual camp operations

Registration digitizes the supplied Teenlife Registration Form (2026), including
participant details, guardian information, three emergency contact slots, medical
care, optional media consent, typed guardian acknowledgement and declared payment.
At least one emergency contact is required. Guardian ID is optional. Payments are
self-reported until independently verified by the office; no payment is processed.
The original Part D wording is preserved, including its Nawiri Africa organisation
name. Confirm that wording and the digital consent process before public rollout.
This implementation does not assert legal enforceability of a typed signature.

The December 6–11, 2026 Teen Life edition, Lukenya Academy venue and KSh 10,960 fee
come from the supplied form. Leaders can create additional editions. Future forms
reuse saved details but require new consent and payment declarations. Ages outside
Jewels 6–12 or Teen Life 13–19 are flagged for review rather than automatically
refused. These ranges apply to the current programme. Approval records an edition in history and updates
the current programme without deleting earlier Jewels records or stable camper IDs.
Approval is not proof of attendance. The imported 2025 history is labelled as an
unverified register entry, not confirmed attendance.

Leaders create facilitators and assign campers. Facilitators can see only assigned
camper profiles and limited care details, not guardian ID, insurance, payment or
private office notes. Leaders assign timetable sessions. Assigned session owners
record participation and learning/game notes and publish family-visible summaries.
Timetable conflicts for the same facilitator are rejected. Times are EAT.
Parent-visible session summaries must not contain another child's private details.

Leaders can create a head facilitator account or change an existing facilitator's
role under Facilitators. The head
facilitator can mark or remove campers from an expected list for each camp edition.
This planning list can include returning campers before a new application is made;
it does not approve registration or record check-in. Head facilitators see the
camper's name, ID, last recorded programme and age, without family contact,
medical, payment or private office details. Leaders can update the same list.

## Privacy and operational limits

Registration payloads use AES-256-GCM with a local registration.key file. Passwords
use salted scrypt. This is NOT whole-disk encryption: basic roster/contact records,
messages and participation notes remain plain SQLite, protected by application access.
Anyone with filesystem access to both database and key can decrypt registrations.
Back up the entire .local-data directory, including registration.key and SQLite
sidecars, with the server stopped. A missing key prevents registration recovery.
This workspace is under OneDrive; review your folder-sync and Windows account access
before collecting live medical details. Do not share the database or its key.

Public hosting, HTTPS, verified SMS/OTP delivery, automated password recovery,
staff account revocation UI, payment integration and legal/privacy review are not
included in this local build. The portal is not an urgent-care notification system.

Research references checked September 16, 2026:
- https://instituteofapologetics.org/ — iACT ministry learning areas.
- https://www.christhoodministries.org/iAct.html — Institute and GeMM programme.
- https://www.christhoodministries.org/teen-life.html — camp activities and mentorship.
- https://www.christhoodministries.org/ — programme pathways and published age bands.

Verification: node scripts/test-local.mjs and node scripts/test-workflows.mjs.
