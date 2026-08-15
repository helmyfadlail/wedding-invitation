/**
 * Google Apps Script backend for the RSVP form.
 *
 * This file is NOT part of the site build — it is the code you paste into the
 * Apps Script editor attached to a Google Sheet. Deploying it gives you a URL
 * to put in VITE_RSVP_ENDPOINT. Step-by-step instructions are in README.md
 * under "RSVP and the guestbook".
 *
 * It answers the two calls src/features/rsvp/store.ts makes:
 *   GET  -> every row, newest last, as JSON
 *   POST -> appends one row
 *
 * A note on why POST arrives as text/plain: a web app published from Apps
 * Script cannot answer the OPTIONS preflight a browser sends before a
 * application/json POST, so the invitation sends the same JSON under a
 * text/plain content type, which needs no preflight. The body is still JSON —
 * hence JSON.parse below.
 */

/** The tab the entries go on. It is created on first write if missing. */
var SHEET_NAME = "RSVP";

/** Column order. Changing this reorders the sheet; keep `id` first. */
var COLUMNS = ["id", "name", "phone", "attendance", "guests", "message", "at"];

/** Human headers, so the sheet reads like a guest list and not like JSON. */
var HEADERS = ["ID", "Nama", "No. Telp", "Kehadiran", "Jumlah", "Wishes & Doa", "Waktu"];

/** What the "Kehadiran" column shows, and how to read it back. */
var PRESENT = "Hadir";
var ABSENT = "Tidak Hadir";

function sheet_() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var tab = book.getSheetByName(SHEET_NAME);
  if (!tab) {
    tab = book.insertSheet(SHEET_NAME);
  }
  if (tab.getLastRow() === 0) {
    tab.appendRow(HEADERS);
    tab.setFrozenRows(1);
  }
  return tab;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

/** Returns every entry. The invitation sorts them itself. */
function doGet() {
  var tab = sheet_();
  var rows = tab.getDataRange().getValues();
  var out = [];

  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (!row[0]) continue; // a blank line someone left behind
    var absent = String(row[3]).toLowerCase().indexOf("tidak") === 0;
    out.push({
      id: String(row[0]),
      name: String(row[1]),
      phone: String(row[2]),
      attendance: absent ? "tidak-hadir" : "hadir",
      guests: absent ? 0 : Number(row[4]) || 1,
      message: String(row[5]),
      // A Date becomes an ISO string through JSON; the site parses either that
      // or plain epoch milliseconds.
      at: row[6] instanceof Date ? row[6].toISOString() : row[6],
    });
  }

  return json_(out);
}

/** Appends one entry. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Two guests submitting at the same second must not land on the same row.
  lock.waitLock(20000);

  try {
    var body = JSON.parse(e.postData.contents);
    var absent = String(body.attendance) === "tidak-hadir";

    sheet_().appendRow([
      String(body.id || Utilities.getUuid()),
      String(body.name || ""),
      String(body.phone || ""),
      absent ? ABSENT : PRESENT,
      absent ? 0 : Number(body.guests) || 1,
      String(body.message || ""),
      body.at ? new Date(Number(body.at)) : new Date(),
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
