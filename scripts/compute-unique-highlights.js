'use strict';
const fs   = require('fs');
const path = require('path');

const STOP = new Set([
  'các','của','là','và','có','trong','cho','với','một','được','này','đó',
  'tại','trên','theo','về','từ','hay','hoặc','khi','mà','thì','nếu','đã',
  'sẽ','đến','ra','vào','đi','lên','xuống','không','bị','do','qua','sau',
  'trước','giữa','cả'
]);

const qData     = JSON.parse(fs.readFileSync(path.join(__dirname,'../duong_thuy/questions.json'),'utf8'));
const questions = qData.questions;

function tokenize(text) {
  return text
    .replace(/[.,;:!?()"''\[\]{}<>\/\\@#$%^&*+=~`–—…]/g, ' ')
    .split(/\s+/)
    .map(t => t.toLowerCase().trim())
    .filter(t => t.length > 1);
}

// phrase (lowercase) → Set of question IDs that contain it
const phraseToQIds = new Map();

for (const q of questions) {
  const tokens = tokenize(q.question_vi);
  const seen   = new Set();
  for (let n = 1; n <= 3; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n);
      if (n === 1 && STOP.has(gram[0])) continue;
      if (gram.every(t => STOP.has(t)))  continue;
      const phrase = gram.join(' ');
      if (seen.has(phrase)) continue;
      seen.add(phrase);
      if (!phraseToQIds.has(phrase)) phraseToQIds.set(phrase, new Set());
      phraseToQIds.get(phrase).add(q.id);
    }
  }
}

const highlights = {};

for (const q of questions) {
  const tokens = tokenize(q.question_vi);
  const candidates = [];

  // Collect unique phrases longest-first
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n);
      if (n === 1 && STOP.has(gram[0])) continue;
      if (gram.every(t => STOP.has(t)))  continue;
      const phrase = gram.join(' ');
      if (phraseToQIds.get(phrase)?.size === 1) {
        candidates.push(phrase);
      }
    }
  }

  // Remove phrases that are sub-strings of other candidates (keep the longer one)
  const deduped = candidates.filter(p => !candidates.some(o => o !== p && o.includes(p)));

  // Sort by length desc, keep top 3
  deduped.sort((a, b) => b.length - a.length);
  highlights[q.id] = deduped.slice(0, 3);
}

const outPath = path.join(__dirname, '../duong_thuy/question-highlights.json');
fs.writeFileSync(outPath, JSON.stringify(highlights, null, 2), 'utf8');

const withHighlights = Object.values(highlights).filter(h => h.length > 0).length;
console.log(`Highlights generated: ${withHighlights} / ${questions.length} questions`);
console.log('\nExamples:');
let shown = 0;
for (const [id, phrases] of Object.entries(highlights)) {
  if (phrases.length > 0 && shown < 25) {
    const q = questions.find(x => x.id == id);
    console.log(`  Q${id}: [${phrases.join(' | ')}]`);
    shown++;
  }
}
// Show any questions with NO highlights
const noHighlight = Object.entries(highlights).filter(([,h]) => h.length === 0);
if (noHighlight.length) {
  console.log(`\nQuestions with NO unique phrases (${noHighlight.length}):`);
  for (const [id] of noHighlight) {
    const q = questions.find(x => x.id == id);
    console.log(`  Q${id}: "${q.question_vi}"`);
  }
}
