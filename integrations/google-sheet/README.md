# Optional: copy new guests and prayer requests into a private Google Sheet

The team area already keeps every new guest, prayer request and thanksgiving. This script also adds each one to a private Google Sheet owned by the church, for teams that like to work in a spreadsheet. It comes from the original visitor and prayer forms project and works unchanged.

1. Sign in to the church's Google account and create a new Google Sheet. Name it **Christhood Website Records**.
2. **Extensions → Apps Script**. Delete what is in `Code.gs`, paste in the whole of `Code.gs` from this folder and save. To get an email when something arrives, put the address(es) in `NOTIFY_EMAILS` (emails only say something arrived; prayer details are never emailed).
3. Choose **setup** in the function menu and press **Run**. Allow the permissions (this is a private script you own).
4. **Deploy → New deployment → Web app**. Execute as **Me**, who has access **Anyone**. Copy the address ending in `/exec`.
5. In the hosting settings add it as `GOOGLE_SHEET_WEBHOOK`, then redeploy. System status shows it as on.
6. **Share** the Sheet only with the few people who need it. Never use "Anyone with the link". Prayer requests often mention health, family or money.

Privacy: collecting personal details falls under Kenya's Data Protection Act (2019). Keep the consent tick-box, limit who can see the records and clear old prayer requests once a year.
