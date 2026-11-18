import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPages, escape, build } from '../scripts/build.mjs';
import { createSiteServer } from '../scripts/server.mjs';
import { renderPage } from '../scripts/layout.mjs';
import { formatDate, image } from '../scripts/components.mjs';
const source = JSON.parse(await readFile(new URL('../content/site.json',import.meta.url)));
const fixtures = JSON.parse(await readFile(new URL('./fixtures.json',import.meta.url)));
test('unpopulated content produces only home', () => {
  const empty = {
    ...source,
    biography: [],
    interests: [],
    education: [],
    languages: [],
    courses: [],
    experience: [],
    achievements: [],
    projects: [],
    writing: [],
    contact: { links: [] },
  };
  assert.deepEqual(createPages(empty).map(page => page.path), ['/']);
});
test('populated content generates indexes and detail routes', () => {
  const pages = createPages({...source,...fixtures});
  assert.equal(pages.length, 9);
  assert.ok(pages.find(page => page.path === '/about/').body.includes('<details>'));
});
test('content is escaped and unsafe URLs fail the build', () => {
  assert.equal(escape('<script>'), '&lt;script&gt;');
  assert.throws(() => createPages({...source,contact:{email:'',links:[{label:'Bad',url:'javascript:alert(1)'}]}}), /Unsupported URL/);
});
test('duplicate detail slugs fail before publishing', () => {
  assert.throws(() => createPages({...source,projects:[fixtures.projects[0],fixtures.projects[0]]}), /duplicate/);
});
test('public build excludes fixture data and includes production SEO', async () => {
  const {output} = await build();
  const html = await readFile(`${output}/index.html`, 'utf8');
  assert.ok(html.includes('href="/about/"'));
  assert.ok(html.includes('href="/work/"'));
  assert.ok(html.includes('href="/journey/"'));
  assert.match(html, /class="footer-link" href="\/#now">Now<\/a>/);
  const legacyNow = await readFile(`${output}/now/index.html`, 'utf8');
  assert.match(legacyNow, /http-equiv="refresh" content="0;url=\/#now"/);
  const sourceNow = await readFile(new URL('../content/now.txt', import.meta.url), 'utf8');
  const [nowDate] = sourceNow.trim().split(/\r?\n/, 1);
  assert.ok(html.includes(`<time datetime="${nowDate}">${formatDate(nowDate)}</time>`));
  assert.match(html, /class="reading now-copy"><p>\S/);
  assert.match(html, /class="command-result" href="\/#edit"/);
  assert.match(html, /id="now-editor-code" type="password"/);
  assert.ok(!html.includes('Private design preview'));
  const contact = await readFile(`${output}/contact/index.html`, 'utf8');
  assert.ok(contact.includes('href="mailto:ms@ahmadbaqa.com"'));
  assert.ok(contact.includes(`href="${source.contact.vcard}" download`));
  const vcard = await readFile(output + source.contact.vcard, 'utf8');
  assert.ok(vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(vcard.includes(`FN:${source.name}\r\n`));
  assert.ok(vcard.includes(`EMAIL;TYPE=INTERNET:${source.contact.email}\r\n`));
  const novel = await readFile(`${output}/writing/index.html`, 'utf8');
  const journey = await readFile(`${output}/journey/index.html`, 'utf8');
  assert.match(journey, /id="milestone-igcses"/);
  assert.match(journey, /href="\/about\/#igcses"/);
  for (const page of [html, contact, novel]) {
    assert.equal(page.split(`data-clarity-project="${source.analytics.clarityProject}"`).length, 2);
    assert.equal(page.split(`data-ga4-id="${source.analytics.googleMeasurementId}"`).length, 2);
    assert.ok(page.includes(`data-analytics-origin="${source.seo.origin}"`));
    assert.ok(page.includes('Website analytics'));
    assert.ok(!page.includes('data-ga4-choice'));
  }
  assert.match(contact, /<form class="contact-form"[^>]*data-clarity-mask="true"/);
  assert.match(novel, /<h1[^>]*><span>The Eleventh<\/span> <em>Rehearsal<\/em><\/h1>/);
  assert.match(novel, /id="synopsis"/);
  assert.match(novel, /The woman on the screen said she had never been afraid of her husband/);
  assert.match(novel, /Then somebody knows/);
  assert.match(novel, /action="\/api\/novel\/subscribe" method="post"/);
  assert.match(novel, /name="consent" type="checkbox" value="yes" required/);
  const legacyNovel = await readFile(`${output}/writing/the-eleventh-rehearsal/index.html`, 'utf8');
  assert.match(legacyNovel, /http-equiv="refresh" content="0;url=\/writing\/"/);
  await assert.rejects(readFile(`${output}/writing/sample-article/index.html`), { code: 'ENOENT' });
  assert.ok(html.includes('content="index,follow"'));
  assert.ok(html.includes(`rel="canonical" href="${source.seo.origin}/"`));
  const sitemap = await readFile(`${output}/sitemap.xml`, 'utf8');
  assert.ok(sitemap.includes(`${source.seo.origin}/work/unesco-ai-forum/`));
  assert.ok(sitemap.includes(`${source.seo.origin}/journey/`));
  assert.ok((await readFile(`${output}/404.html`, 'utf8')).includes('Return home'));
});

test('article dates and required image metadata are validated', () => {
  assert.equal(formatDate('2026-11-15'), '15 November 2026');
  assert.throws(() => formatDate('2026-02-30'), /Invalid publication/);
  assert.throws(() => image({src:'/portrait.webp'}), /alt text/);
});

test('nested pages mark their parent navigation and 404 omits canonical', () => {
  const data = {...source,...fixtures};
  const pages = createPages(data);
  const page = pages.find(page => page.path === '/work/layout-study/');
  const navigation = pages.filter(page => ['/','/work/'].includes(page.path));
  const html = renderPage({data,page,navigation,origin:'https://example.com',ready:true,preview:false});
  assert.ok(html.includes('href="/work/" aria-current="page"'));
  assert.ok(html.includes('https://example.com/work/layout-study/'));
  const missing = renderPage({data,page:{...page,path:'/404/'},navigation,origin:'https://example.com',ready:true,preview:false});
  assert.ok(!missing.includes('rel="canonical"'));
  assert.ok(missing.includes('noindex,nofollow'));
});

test('preview routes, local links, redirects and HTTP errors work', async () => {
  const {output,pages} = await build({preview:true});
  const server = createSiteServer(output);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const page of pages) {
      const response = await fetch(origin + page.path);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.ok(!html.includes('data-clarity-project'), 'Preview builds should not load Clarity');
      assert.ok(!html.includes('data-ga4-id'), 'Preview builds should not load Google Analytics');
      for (const [,href] of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)) {
        assert.equal((await fetch(origin + href)).status, 200, href);
      }
    }
    assert.equal((await fetch(origin+'/about',{redirect:'manual'})).status,308);
    const queryRedirect = await fetch(origin+'/about?from=work', {redirect:'manual'});
    assert.equal(queryRedirect.headers.get('Location'), '/about/?from=work');
    const uncompressed = await fetch(origin+'/', {headers:{'Accept-Encoding':'gzip;q=0'}});
    assert.equal(uncompressed.headers.get('Content-Encoding'), null);
    assert.equal((await fetch(origin+'/missing')).status,404);
    assert.equal((await fetch(origin+'/%zz')).status,400);
    assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
    assert.equal(await (await fetch(origin+'/',{method:'HEAD'})).text(),'');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
