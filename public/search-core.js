export const searchLimit = 240;
const filler = new Set('a about across am an and are as at be been by can could did do does for from had has have he her his how i in is it its me of on or s she so tell than that the their them there these they this to was we were what when where which who why will with would you your muhammad subhan main developed'.split(' '));
const aliases = new Map(Object.entries({
  university: 'education', schools: 'school', educated: 'education', learnings: 'learn', studying: 'study',
  qualifications: 'education', ambitions: 'ambition', careers: 'career',
  events: 'event', attended: 'event', experiences: 'experience', project: 'projects',
  course: 'courses', certificates: 'certificate', languages: 'language', capabilities: 'skills',
  interests: 'interest', presently: 'currently', doing: 'working', studyingnow: 'currently',
}));

export function words(value) {
  return (value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter(word => !filler.has(word)).map(word => aliases.get(word) || word);
}

export function looksPrivate(value) {
  return /[\p{L}\d._%+-]+@[\p{L}\d.-]+\.[\p{L}]{2,}|(?:\d[ ().+-]*){7,}|https?:\/\/|\b(?:password|api key|publishing code|token|secret)\b/iu.test(value);
}

export function searchQuestion(value) {
  return /\?|^(?:what|which|when|why|where|who|how|did|does|is|was|can|tell me|describe|explain|compare)\b/i.test(value);
}

export function matchPortfolio(records, query) {
  const terms = [...new Set(words(query))];
  if (!terms.length) return [];
  return records.map(record => {
    const title = words(record.title), topics = words(record.topics.join(' '));
    const body = words(record.passages.join(' '));
    const strength = terms.map(term => title.includes(term) ? 14 : topics.includes(term) ? 8 : body.includes(term) ? 3
      : term.length > 3 && title.some(word => word.startsWith(term)) ? 4 : 0);
    const hits = strength.filter(Boolean).length;
    const score = strength.reduce((sum, value) => sum + value, 0) + (hits > 1 ? 5 * hits : 0);
    return { record, score, hits };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
}

export function evidenceFor(matches, query) {
  const terms = words(query);
  const substantive = matches.filter(({ record }) => record.kind !== 'Page' && record.passages.length);
  const evidenced = substantive.filter(({ score, hits }) => score >= 8 || hits >= 2);
  if (!evidenced.length) return [];
  const requestedTogether = /\band\b|\brelat(?:e|es|ed|ionship)\b|\bconnect\w*\b|\bcompare\b/i.test(query);
  const highest = evidenced[0].score;
  return evidenced.filter(({ score }) => requestedTogether || score >= highest * .48).slice(0, 6).map(({ record }) => {
    const ranked = record.passages.slice(0, 16).map((passage, index) => ({
      passage, score: terms.filter(term => words(passage).includes(term)).length * 3 - index * .15,
    })).sort((a, b) => b.score - a.score);
    return { record, passages: ranked.slice(0, 3).map(({ passage }) => passage) };
  });
}

export function briefPassage(passage, maximum = 490) {
  if (passage.length <= maximum) return passage;
  const previousSentence = passage.lastIndexOf('. ', maximum - 1);
  if (previousSentence > maximum * .44) return passage.slice(0, previousSentence + 1);
  return passage.slice(0, passage.lastIndexOf(' ', maximum) > 0 ? passage.lastIndexOf(' ', maximum) : maximum) + '…';
}

export async function* streamLines(body, limit) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let line = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Response too large');
      const lines = (line + decoder.decode(value, { stream: true })).split('\n');
      line = lines.pop();
      for (const entry of lines) yield entry.trim();
    }
    line += decoder.decode();
    if (line.trim()) yield line.trim();
  } finally {
    reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
