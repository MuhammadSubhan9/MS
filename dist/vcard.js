export function contactCardWithNote(card, note) {
  const lines = card.trim().replace(/\r\n|\r/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  if (lines[0] !== 'BEGIN:VCARD' || lines.at(-1) !== 'END:VCARD') {
    throw new Error('Invalid contact card');
  }
  const text = note.replace(/\r\n|\r/g, '\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '')
    .replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const encoder = new TextEncoder();
  const folded = [];
  let line = 'NOTE:';
  let length = 5;
  for (const character of text) {
    const size = encoder.encode(character).length;
    if (length + size > 75) {
      folded.push(line);
      line = ' ';
      length = 1;
    }
    line += character;
    length += size;
  }
  folded.push(line);
  return [...lines.slice(0, -1).filter(value => !/^NOTE[;:]/i.test(value)), ...folded, 'END:VCARD', ''].join('\r\n');
}
