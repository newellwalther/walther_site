// ─────────────────────────────────────────────────────────────────────────────
// walther.website — Google Apps Script backend
// ─────────────────────────────────────────────────────────────────────────────
//
// SETUP (one-time, ~10 minutes):
//
// 1. Create a Google Sheet at sheets.google.com → name it "walther.website"
//    Add three tabs named exactly:
//      "Flashcards"  → Row 1 headers: english | vietnamese | timestamp
//      "Suggestions" → Row 1 headers: suggestion | timestamp
//      "Newsletter"  → Row 1 headers: name | email | timestamp
//
// 2. In the Flashcards tab, paste the 33 starter cards starting at row 2.
//    (Copy them from the initialCards array in tieng-viet.html)
//
// 3. Share the sheet → "Anyone with the link can view"
//    (needed so the flashcard page can fetch cards publicly)
//
// 4. Copy your Sheet ID from the URL:
//    https://docs.google.com/spreadsheets/d/  ←THIS PART→  /edit
//    Paste it below as SHEET_ID.
//
// 5. Go to script.google.com → New project → paste this entire file.
//
// 6. Click Deploy → New deployment
//      Type:            Web app
//      Execute as:      Me
//      Who has access:  Anyone
//    Authorize when prompted. Copy the deployment URL.
//
// 7. In tieng-viet.html, drawings.html, and contact.html replace
//    YOUR_APPS_SCRIPT_URL with the deployment URL you just copied.
//    In tieng-viet.html also replace YOUR_SHEET_ID with your Sheet ID.
//
// 8. git push — done.
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_ID = '1cvoQWgtJy7R8u4BBVFY1GBfP1UH_dFnjS5wEihCMh1hjFln5RiNuToW4';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const timestamp = new Date().toISOString();

    if (data.type === 'flashcard') {
      const sheet = ss.getSheetByName('Flashcards');
      sheet.appendRow([
        String(data.english  || '').substring(0, 250),
        String(data.vietnamese || '').substring(0, 250),
        timestamp
      ]);

    } else if (data.type === 'suggestion') {
      const sheet = ss.getSheetByName('Suggestions');
      sheet.appendRow([
        String(data.suggestion || '').substring(0, 500),
        timestamp
      ]);

    } else if (data.type === 'newsletter') {
      const sheet = ss.getSheetByName('Newsletter');
      sheet.appendRow([
        String(data.name  || '').substring(0, 200),
        String(data.email || '').substring(0, 200),
        timestamp
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
