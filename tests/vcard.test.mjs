import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contactCardWithNote } from '../public/vcard.js';

const original = await readFile(new URL('../public/muhammad-subhan.vcf', import.meta.url), 'utf8');
const unfold = value => value.replace(/\r\n /g, '');

test('contact notes preserve contact details and escape newlines and delimiters', () => {
  const card = contactCardWithNote(original, 'Met at an event, Riyadh; follow up\\later\r\nTEL:+1000');
  assert.ok(card.includes('TEL;TYPE=CELL:+966591496707\r\n'));
  assert.ok(card.includes('EMAIL;TYPE=INTERNET:ms@ahmadbaqa.com\r\n'));
  assert.ok(unfold(card).includes('NOTE:Met at an event\\, Riyadh\\; follow up\\\\later\\nTEL:+1000\r\n'));
  assert.equal(card.split('\r\n').filter(line => line.startsWith('TEL:')).length, 0);
  assert.ok(card.endsWith('\r\nEND:VCARD\r\n'));
});

test('long Unicode notes fold within vCard byte limits and replace earlier notes', () => {
  const note = 'ملاحظة 🙂 für später '.repeat(25);
  const card = contactCardWithNote(contactCardWithNote(original, 'Old note'), note);
  for (const line of card.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.ok(unfold(card).includes(`NOTE:${note}\r\n`));
  assert.ok(!card.includes('Old note'));
  assert.throws(() => contactCardWithNote('Not a card', note), /Invalid contact card/);
});
