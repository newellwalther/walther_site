#!/usr/bin/env node
// Adds English translations to each phrase in question-highlights.json.
// Sources (in priority order):
//   1. vocab.json — exact Vietnamese match
//   2. question_en field — extract parallel phrase by position heuristic
//   3. answer_en fields — look for matching translated answer
//   4. explanation_en — first sentence for context
//   5. "" placeholder (manual fill required)

const fs = require('fs');
const path = require('path');

const HIGHLIGHTS_PATH = path.join(__dirname, '../duong_thuy/question-highlights.json');
const QUESTIONS_PATH  = path.join(__dirname, '../duong_thuy/questions.json');
const VOCAB_PATH      = path.join(__dirname, '../duong_thuy/vocab.json');

const highlights = JSON.parse(fs.readFileSync(HIGHLIGHTS_PATH, 'utf8'));
const { questions } = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));
const { vocab } = JSON.parse(fs.readFileSync(VOCAB_PATH, 'utf8'));

// Build vocab lookup (normalised Vietnamese → English)
const vocabMap = {};
for (const v of vocab) {
  vocabMap[v.vi.toLowerCase().trim()] = v.en;
}

// Build question lookup by id
const qMap = {};
for (const q of questions) qMap[q.id] = q;

function norm(s) {
  return s.toLowerCase().replace(/[.,;:?!()[\]"'""'']/g, ' ').replace(/\s+/g, ' ').trim();
}

// Try to find an English phrase that corresponds to the Vietnamese phrase
// by looking for shared key words in the English question/answers
function tryExtract(phrase, q) {
  const viNorm = norm(phrase);
  const t = q.translation || {};

  // 1. Exact vocab lookup
  if (vocabMap[viNorm]) return vocabMap[viNorm];

  // 2. Check if any vocab entry is a substring of the phrase
  for (const [vi, en] of Object.entries(vocabMap)) {
    if (viNorm.includes(vi) && vi.length > 4) return en;
  }

  // 3. Heuristic: for "Báo hiệu thông báo/chỉ [X]" questions the question_en
  //    has a parallel structure "Sign indicating [Y]" — extract Y
  if (q.question_vi.match(/^Báo hiệu/i) && t.question_en) {
    const m = t.question_en.match(/^(?:Sign|Marker|Buoy|Beacon|Mark)\s+(?:indicating|marking|showing|identifying|for|at|of|denoting)?\s*(.+?)(?:\s+is:|\s*:|\s*$)/i);
    if (m) return m[1].trim().replace(/^(that|the|a|an)\s+/i, '');
  }

  // 4. For "Nút X" knot questions, question_en often says "The X knot is/does"
  if (q.question_vi.match(/^Nút\s/i) && t.question_en) {
    const m = t.question_en.match(/^(?:The\s+)?(.+?\s+knot)/i);
    if (m) return m[1].trim();
  }

  // 5. Return empty for manual fill
  return '';
}

let filled = 0;
for (const [qKey, entries] of Object.entries(highlights)) {
  const id = parseInt(qKey.replace('q', ''), 10);
  const q = qMap[id];
  if (!q) continue;
  for (const entry of entries) {
    if (!entry.translation) {
      const trans = tryExtract(entry.phrase, q);
      if (trans) { entry.translation = trans; filled++; }
    }
  }
}

fs.writeFileSync(HIGHLIGHTS_PATH, JSON.stringify(highlights, null, 2), 'utf8');
console.log(`Filled ${filled} translations automatically. Run manually for the rest.`);
