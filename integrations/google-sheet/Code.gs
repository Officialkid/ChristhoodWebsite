/**
 * @OnlyCurrentDoc
 *
 * Christhood Ministries - private record for the website's Visitor and Prayer/Thanksgiving forms.
 *
 * This script lives inside the church's Google Sheet (Extensions > Apps Script).
 * The website sends each form here, and the script adds one row to the right tab.
 * Setup steps: README.md, "Set up the private Google Sheet".
 */

// Who gets an email when something new comes in. Separate several addresses with commas.
// Leave it as '' for no emails. Emails only say that something arrived and link to the Sheet;
// the details themselves stay in the Sheet.
const NOTIFY_EMAILS = '';

const TIME_ZONE = 'Africa/Nairobi';

// Submissions sent faster than this are almost certainly spam bots.
const MIN_FILL_MS = 3000;

// One tab per kind of submission. Each column is [heading, form field].
// '@received' is the time it arrived, '@name' respects "keep me anonymous",
// and '' leaves the column blank for the team to fill in.
const TABS = {
  visitor: {
    name: 'Visitors',
    label: 'visitor registration',
    required: ['fullName', 'phone', 'consent'],
    columns: [
      ['Received', '@received'],
      ['Date of visit', 'visitDate'],
      ['Full name', 'fullName'],
      ['Phone / WhatsApp', 'phone'],
      ['Email', 'email'],
      ['Lives in', 'area'],
      ['Age group', 'ageGroup'],
      ['First visit?', 'firstVisit'],
      ['Heard about us', 'heardFrom'],
      ['Invited by', 'invitedBy'],
      ['Home church?', 'homeChurch'],
      ['Would like to', 'interests'],
      ['Prayer request', 'prayerRequest'],
      ['Consent given', 'consent'],
      ['Followed up by', ''],
      ['Notes', ''],
    ],
  },
  prayer: {
    name: 'Prayer Requests',
    label: 'prayer request',
    required: ['message', 'consent'],
    columns: [
      ['Received', '@received'],
      ['Name', '@name'],
      ['Phone / WhatsApp', 'phone'],
      ['Category', 'category'],
      ['Prayer request', 'message'],
      ['Who may read it', 'whoMaySee'],
      ['Call back?', 'callBack'],
      ['Prayed / followed up by', ''],
      ['Notes', ''],
    ],
  },
  thanksgiving: {
    name: 'Thanksgiving',
    label: 'thanksgiving',
    required: ['message', 'consent'],
    columns: [
      ['Received', '@received'],
      ['Name', '@name'],
      ['Phone / WhatsApp', 'phone'],
      ['Thanksgiving', 'message'],
      ['May share in fellowship?', 'mayShare'],
      ['Call back?', 'callBack'],
      ['Notes', ''],
    ],
  },
};

/** Receives a form from the website. */
function doPost(e) {
  const p = (e && e.parameter) || {};

  // Spam traps: a hidden field only bots fill in, and forms completed impossibly fast.
  // Answer "ok" so the bot has no reason to retry.
  if (p.website || Number(p.elapsedMs || 0) < MIN_FILL_MS) {
    return reply_({ ok: true });
  }

  const kind = kindOf_(p);
  if (!kind) {
    return reply_({ ok: false, error: 'Unknown form.' });
  }
  const missing = TABS[kind].required.filter((field) => !String(p[field] || '').trim());
  if (missing.length) {
    return reply_({ ok: false, error: 'Missing: ' + missing.join(', ') });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    appendRow_(kind, p);
  } catch (err) {
    console.error('Could not save submission', err);
    return reply_({ ok: false, error: 'Could not save. Please try again.' });
  } finally {
    lock.releaseLock();
  }

  notify_(kind, p);
  return reply_({ ok: true });
}

/** Lets the web developer open the /exec link in a browser to check it is live. */
function doGet() {
  return reply_({ ok: true, message: 'Christhood forms are connected.' });
}

/**
 * Run this once from the Apps Script editor (select "setup", press Run).
 * It creates the three tabs, sets the time zone and asks for permission.
 */
function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.setSpreadsheetTimeZone(TIME_ZONE);
  Object.keys(TABS).forEach((kind) => sheetFor_(TABS[kind]));

  const blank = spreadsheet.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) {
    spreadsheet.deleteSheet(blank);
  }
  console.log('Setup finished. Now deploy: Deploy > New deployment > Web app.');
}

/** Optional: adds one obviously fake row to each tab so you can see it working. Delete the rows afterwards. */
function testSubmission() {
  const common = { elapsedMs: '5000', consent: 'Yes', phone: '0700 000 000' };
  doPost({ parameter: Object.assign({ form: 'visitor', fullName: 'TEST Visitor', visitDate: '2026-01-01', firstVisit: 'First time' }, common) });
  doPost({ parameter: Object.assign({ form: 'prayer', type: 'prayer', name: 'TEST', message: 'Test prayer request', whoMaySee: 'Pastoral team only' }, common) });
  doPost({ parameter: Object.assign({ form: 'prayer', type: 'thanksgiving', name: 'TEST', message: 'Test thanksgiving', mayShare: 'Keep it private' }, common) });
  console.log('Added one TEST row to each tab.');
}

function kindOf_(p) {
  if (p.form === 'visitor') {
    return 'visitor';
  }
  if (p.form === 'prayer') {
    return p.type === 'thanksgiving' ? 'thanksgiving' : 'prayer';
  }
  return null;
}

function appendRow_(kind, p) {
  const tab = TABS[kind];
  const row = tab.columns.map((column) => valueFor_(column[1], p));
  sheetFor_(tab).appendRow(row);
}

function valueFor_(field, p) {
  if (field === '@received') {
    return new Date();
  }
  if (field === '@name') {
    return p.anonymous === 'Yes' ? 'Anonymous' : cellText_(p.name);
  }
  if (!field) {
    return '';
  }
  // A plain yyyy-mm-dd is left for Sheets to read as a real date, so the column sorts and filters by date.
  if (field === 'visitDate' && /^\d{4}-\d{2}-\d{2}$/.test(p.visitDate || '')) {
    return p.visitDate;
  }
  return cellText_(p[field]);
}

// Stops Sheets reading what people typed as a formula or a number
// (this also keeps the leading 0 on phone numbers like 0712...).
function cellText_(value) {
  const text = plain_(value, 3000);
  return /^[=+\-@0-9]/.test(text) ? "'" + text : text;
}

function plain_(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function sheetFor_(tab) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const existing = spreadsheet.getSheetByName(tab.name);
  if (existing) {
    return existing;
  }

  const sheet = spreadsheet.insertSheet(tab.name);
  const headings = tab.columns.map((column) => column[0]);
  sheet.getRange(1, 1, 1, headings.length)
    .setValues([headings])
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#4b248c')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, headings.length, 160);

  tab.columns.forEach((column, index) => {
    const range = sheet.getRange(2, index + 1, sheet.getMaxRows() - 1, 1);
    if (column[1] === '@received') {
      range.setNumberFormat('d mmm yyyy, h:mm am/pm');
    } else if (column[1] === 'visitDate') {
      range.setNumberFormat('d mmm yyyy');
    } else if (['message', 'prayerRequest'].indexOf(column[1]) !== -1) {
      sheet.setColumnWidth(index + 1, 320);
      range.setWrap(true);
    }
  });
  return sheet;
}

function notify_(kind, p) {
  const recipients = NOTIFY_EMAILS.trim();
  if (!recipients) {
    return;
  }
  try {
    const tab = TABS[kind];
    const who = kind === 'visitor'
      ? plain_(p.fullName, 60)
      : (p.anonymous === 'Yes' ? 'Anonymous' : plain_(p.name, 60) || 'Someone');
    MailApp.sendEmail({
      to: recipients,
      subject: 'New ' + tab.label + ' from the website: ' + who.replace(/[\r\n]+/g, ' '),
      body: 'A new ' + tab.label + ' has come in through christhoodministries.org.\n\n'
        + 'Open the "' + tab.name + '" tab to read it:\n'
        + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '\n\n'
        + 'For privacy, the details are kept only in the Sheet, not in this email.',
    });
  } catch (err) {
    // A failed email must never lose the submission, which is already saved.
    console.error('Notification email failed', err);
  }
}

function reply_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
