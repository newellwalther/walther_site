// ─────────────────────────────────────────────────────────────────────────────
// walther.website — Google Apps Script backend
// ─────────────────────────────────────────────────────────────────────────────
//
// SETUP (one-time):
//
// 1. Create a Google Sheet named "walther.website" with three tabs:
//      "Flashcards"  → Row 1 headers: english | vietnamese | timestamp
//      "Suggestions" → Row 1 headers: suggestion | timestamp
//      "Newsletter"  → Row 1 headers: name | email | timestamp
//    Share the sheet → "Anyone with the link can view"
//
// 2. Paste this file into script.google.com → Deploy → New deployment
//      Type: Web app | Execute as: Me | Who has access: Anyone
//
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_ID = '1QWOIimopt2EqbJ86N_Iu5PU--m5TwqUhG6ELUZ-kmkA';

function doGet(e) {
  try {
    const p = e.parameter;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const timestamp = new Date().toISOString();

    if (p.type === 'flashcard') {
      ss.getSheetByName('Flashcards').appendRow([
        String(p.english    || '').substring(0, 250),
        String(p.vietnamese || '').substring(0, 250),
        timestamp
      ]);

    } else if (p.type === 'suggestion') {
      ss.getSheetByName('Suggestions').appendRow([
        String(p.suggestion || '').substring(0, 500),
        timestamp
      ]);

    } else if (p.type === 'newsletter') {
      ss.getSheetByName('Newsletter').appendRow([
        String(p.name  || '').substring(0, 200),
        String(p.email || '').substring(0, 200),
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
