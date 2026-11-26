import { nowParagraphs } from '../../scripts/now.mjs';

export async function onRequestGet({ env }) {
  try {
    const note = await env.NOW_DB?.prepare('SELECT revision, text FROM now_page WHERE id = 1').first();
    if (note) return Response.json({ revision: note.revision, passages: nowParagraphs(note.text) });
  } catch {
    return Response.json({ passages: [] }, { status: 503 });
  }
  return Response.json({ passages: [] });
}
