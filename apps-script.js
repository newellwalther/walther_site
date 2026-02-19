// ─────────────────────────────────────────────────────────────────────────────
// walther.website — Google Apps Script backend
// ─────────────────────────────────────────────────────────────────────────────
//
// SETUP (one-time):
//
// 1. Google Sheet tabs required:
//      "Flashcards"  → Row 1: english | vietnamese | timestamp
//      "Suggestions" → Row 1: suggestion | timestamp
//      "Newsletter"  → Row 1: name | email | timestamp
//      "Air Game"    → Row 1: user | score | timestamp
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

    // ── existing features ──────────────────────────────────────

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

    // ── Air Game high score ────────────────────────────────────

    } else if (p.type === 'air_get') {
      // Return the all-time best score
      const sheet = ss.getSheetByName('Air Game');
      const data  = sheet.getDataRange().getValues();
      let best = { user: '', score: 0 };
      for (let i = 1; i < data.length; i++) {
        const score = Number(data[i][1]);
        if (data[i][0] && score > best.score) {
          best = { user: String(data[i][0]), score: score };
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(best))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (p.type === 'air_submit') {
      // Only write if this is genuinely a new best
      const user  = String(p.user  || '').trim().substring(0, 20);
      const score = Number(p.score || 0);
      if (user && score > 0) {
        const sheet = ss.getSheetByName('Air Game');
        const data  = sheet.getDataRange().getValues();
        let currentBest = 0;
        for (let i = 1; i < data.length; i++) {
          const s = Number(data[i][1]);
          if (s > currentBest) currentBest = s;
        }
        if (score > currentBest) {
          sheet.appendRow([user, score, timestamp]);
        }
      }
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
