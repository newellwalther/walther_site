#!/usr/bin/env node
// Computes the best identifying phrase for each question.
// Handles special patterns in the Vietnamese question bank:
//   "Báo hiệu thông báo/chỉ [X] là:" → phrase = X
//   "Nút [X] là/có tác dụng:" → phrase = "Nút X"
//   General: find the rarest meaningful ngram

const fs = require('fs');
const path = require('path');

const QUESTIONS_PATH = path.join(__dirname, '../duong_thuy/questions.json');
const OUTPUT_PATH = path.join(__dirname, '../duong_thuy/question-highlights.json');

const { questions } = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf8'));

// Remove trailing "là:", "là", punctuation from extracted phrase
function cleanPhrase(s) {
  return s.replace(/\s+(là:|là|:)\s*$/i, '').replace(/[,.:?!]+$/, '').trim();
}

function norm(s) {
  return s.toLowerCase().replace(/[.,;:?!()[\]"'""'']/g, ' ').replace(/\s+/g, ' ').trim();
}

function ngrams(text, minN = 2, maxN = 5) {
  const words = norm(text).split(' ').filter(Boolean);
  const result = [];
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      result.push(words.slice(i, i + n).join(' '));
    }
  }
  return result;
}

// Count phrase occurrences across all questions
const phraseCount = {};
for (const q of questions) {
  const seen = new Set(ngrams(q.question_vi));
  for (const ph of seen) phraseCount[ph] = (phraseCount[ph] || 0) + 1;
}

// Restore original casing from source text
function restoreCase(original, normed) {
  const lo = norm(original);
  const idx = lo.indexOf(normed);
  if (idx >= 0) return original.slice(idx, idx + normed.length);
  return normed;
}

const result = {};

for (const q of questions) {
  const vi = q.question_vi;
  let phrase = null;

  // Pattern 1: "Báo hiệu [thông báo|chỉ] [X] là:" — X is the unique descriptor
  const baohieuM = vi.match(/^Báo hiệu (?:thông báo|chỉ)\s+(.+?)\s*(?:là:|là\s*$)/i);
  if (baohieuM) {
    phrase = cleanPhrase(baohieuM[1]);
  }

  // Pattern 2: "Nút [X] là:" or "Nút [X] có tác dụng:"
  if (!phrase) {
    const nutM = vi.match(/^(Nút\s+\S+(?:\s+\S+)?)\s+(?:là[:\s]|có tác dụng|dễ mở)/i);
    if (nutM) phrase = cleanPhrase(nutM[1]);
  }

  // Pattern 3: "Neo [X] là loại neo"
  if (!phrase) {
    const neoM = vi.match(/^(Neo\s+\S+(?:\s+\S+)?)\s+là/i);
    if (neoM) phrase = cleanPhrase(neoM[1]);
  }

  // Pattern 4: Extract core noun phrase after common starters
  if (!phrase) {
    // Strip common prefixes and pick what's left up to the verb/predicate
    const stripped = vi
      .replace(/^(Khi|Trong|Các|Sau khi|Muốn|Trường hợp|Tại|Đối với)\s+/i, '')
      .replace(/^(Phương tiện\s+(?:thuỷ\s+)?(?:có động cơ|không có động cơ|có người|của quân đội|của công an|cứu nạn|chữa cháy|chở hàng nguy hiểm|chở khách|loại A|bị nạn|bị mắc cạn|bị mất chủ động|yêu cầu|đang hành trình|đang chạy|vận tải)\s*)/i, '$1');
    // Take first 4 meaningful words
    const words = stripped.split(/\s+/).filter(Boolean);
    const candidate = words.slice(0, 4).join(' ').replace(/[,.:?!]+$/, '');
    const normed = norm(candidate);
    if (phraseCount[normed] <= 3) {
      phrase = restoreCase(vi, normed) || candidate;
    }
  }

  // Fallback: best rare ngram
  if (!phrase) {
    let best = null;
    let bestScore = -Infinity;
    for (const ph of ngrams(vi)) {
      const freq = phraseCount[ph] || 1;
      const wlen = ph.split(' ').length;
      const score = wlen * 2 - freq * 8;
      if (freq <= 3 && score > bestScore) { best = ph; bestScore = score; }
    }
    if (best) phrase = restoreCase(vi, best) || best;
  }

  if (phrase) {
    result['q' + q.id] = [{ phrase, translation: '' }];
  }
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf8');
console.log(`Wrote ${Object.keys(result).length} entries to question-highlights.json`);
