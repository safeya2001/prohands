/**
 * =====================================================
 *  Google Apps Script — Pro Hands Backend
 * =====================================================
 *  Deploy as: Web App → Execute as "Me" → Access "Anyone"
 *
 *  Handles:
 *    POST → writes new volunteer / newsletter rows
 *    GET  → reads data or updates volunteer status
 *
 *  Sheets expected:
 *    "Volunteers"  — Timestamp | Name | Email | Phone | Role | Message | Status
 *    "Newsletter"  — Timestamp | Email
 * =====================================================
 */

/* ---------- POST: receive form data ---------- */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === 'newsletter') {
      var sheet = ss.getSheetByName('Newsletter') || ss.insertSheet('Newsletter');
      if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Email']);
      sheet.appendRow([new Date().toLocaleString(), data.email]);
    } else {
      var sheet = ss.getSheetByName('Volunteers') || ss.insertSheet('Volunteers');
      if (sheet.getLastRow() === 0) sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Role', 'Message', 'Status']);
      sheet.appendRow([
        new Date().toLocaleString(),
        data.name    || '',
        data.email   || '',
        data.phone   || '',
        data.role    || '',
        data.message || '',
        'pending'
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ---------- GET: read data / update status ---------- */
function doGet(e) {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e.parameter && e.parameter.action) || 'read';

  /* ---- Update a volunteer's status ---- */
  if (action === 'updateStatus') {
    var row    = parseInt(e.parameter.row, 10);   // 1-based data row index
    var status = e.parameter.status || 'pending';
    var sheet  = ss.getSheetByName('Volunteers');
    if (sheet) {
      var statusCol = 7; // Column G = Status
      sheet.getRange(row + 1, statusCol).setValue(status); // +1 for header row
    }
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* ---- Read all data ---- */
  var output = {};

  // Volunteers
  var vSheet = ss.getSheetByName('Volunteers');
  if (vSheet && vSheet.getLastRow() > 1) {
    var vData    = vSheet.getDataRange().getValues();
    var vHeaders = vData[0];
    output.volunteers = vData.slice(1).map(function(row) {
      var obj = {};
      vHeaders.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
  } else {
    output.volunteers = [];
  }

  // Newsletter
  var nSheet = ss.getSheetByName('Newsletter');
  if (nSheet && nSheet.getLastRow() > 1) {
    var nData    = nSheet.getDataRange().getValues();
    var nHeaders = nData[0];
    output.newsletter = nData.slice(1).map(function(row) {
      var obj = {};
      nHeaders.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
  } else {
    output.newsletter = [];
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
