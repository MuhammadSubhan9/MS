import { readFile, mkdir, writeFile, cp, rm, access } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { escape } from './components.mjs';
import { createPages } from './pages.mjs';
import { renderPage } from './layout.mjs';
export { escape, createPages };

async function verifyLocalFiles(pages) {
  const paths = new Set();
  const routes = new Set(pages.map(page => page.path));
  for (const page of pages) {
    for (const match of page.body.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const path = match[1];
      if (path.endsWith('/')) {
        if (!routes.has(path)) throw new Error(`Missing internal page: ${path}`);
      } else {
        paths.add(path);
      }
    }
    for (const [, sources] of page.body.matchAll(/srcset="([^"]+)"/g)) {
      for (const source of sources.split(', ')) {
        const [path] = source.split(' ');
        if (path.startsWith('/')) paths.add(path);
      }
    }
  }
  const root = resolve('public');
  for (const path of paths) {
    const asset = resolve(root, decodeURIComponent(path.slice(1)));
    if (!asset.startsWith(root + sep)) {
      throw new Error(`Asset outside its directory: ${path}`);
    }
    await access(asset);
  }
}

export async function build({ preview = false } = {}) {
  const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
  data.now = await readFile(new URL('../content/now.txt', import.meta.url), 'utf8');
  if (preview) {
    Object.assign(data, JSON.parse(await readFile(new URL('../tests/fixtures.json', import.meta.url), 'utf8')));
  }
  const pages = createPages(data);
  await verifyLocalFiles(pages);
  const navigation = ['/', '/about/', '/journey/', '/work/', '/writing/', '/contact/']
    .map(path => pages.find(page => page.path === path)).filter(Boolean);
  let origin = '';
  if (data.seo.origin) {
    const url = new URL(data.seo.origin);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an HTTPS public origin');
    origin = url.origin;
  }
  const ready = !preview && Boolean(origin && data.introduction.length);
  const missing = {
    path: '/404/', label: 'Page not found', description: 'The requested page could not be found.',
    body: '<section class="error-page"><p class="eyebrow">404</p><h1>Page not found</h1><p class="lead">The address may have changed or the page may have been removed.</p><a class="button-link" href="/">Return home<span class="arrow" aria-hidden="true"></span></a></section>',
  };
  // Render and validate before replacing generated output.
  const rendered = [...pages, missing].map(page => ({
    path: page.path,
    html: renderPage({ data, page, navigation, origin, ready, preview }).replace(/^[\t ]+$/gm, ''),
  }));
  const output = resolve(preview ? '.preview' : 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp('public', output, { recursive: true });
  for (const page of rendered) {
    const destination = page.path === '/404/' ? `${output}/404.html` : `${output}${page.path}index.html`;
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, page.html);
  }
  await writeFile(`${output}/robots.txt`, ready
    ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n');
  if (ready) {
    const urls = pages.filter(page => !page.redirect).map(page => `<url><loc>${escape(origin + page.path)}</loc></url>`).join('');
    await writeFile(`${output}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  }
  return { output, pages };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await build({ preview: process.argv.includes('--preview') });
  console.log(`Built ${result.pages.length} pages in ${result.output}`);
}
