import { readFile, readdir, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { action, escape } from './components.mjs';
import { createPages } from './pages.mjs';
import { renderPage } from './layout.mjs';
export { escape, createPages };

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = resolve(projectRoot, 'public');

async function publicFiles(dir = publicRoot, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) throw new Error(`Unexpected hidden or linked public asset: ${name}`);
    if (entry.isDirectory()) {
      files.push(...await publicFiles(resolve(dir, entry.name), name + '/'));
      continue;
    }
    if (!entry.isFile() || !(/^(?:_headers|_redirects|_routes\.json)$/.test(name) ||
        /\.(?:avif|css|ico|jpe?g|js|pdf|png|svg|vcf|webp|woff2)$/i.test(name) || /(?:^|[-/])LICENSE\.txt$/i.test(name))) {
      throw new Error(`Unexpected public asset: ${name}`);
    }
    files.push(name);
  }
  return files;
}

async function verifyLocalFiles(pages, assets) {
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
  for (const path of paths) {
    const name = decodeURIComponent(path.slice(1));
    const asset = resolve(publicRoot, name);
    if (!asset.startsWith(publicRoot + sep)) {
      throw new Error(`Asset outside its directory: ${path}`);
    }
    if (!assets.has(name)) throw new Error(`Missing public asset: ${path}`);
  }
}

export async function build({ preview = false } = {}) {
  const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
  data.now = await readFile(new URL('../content/now.txt', import.meta.url), 'utf8');
  if (preview) {
    Object.assign(data, JSON.parse(await readFile(new URL('../tests/fixtures.json', import.meta.url), 'utf8')));
  }
  const pages = createPages(data);
  const assets = new Set(await publicFiles());
  await verifyLocalFiles(pages, assets);
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
    body: `<section class="error-page"><p class="eyebrow">404</p><h1>Page not found</h1><p class="lead">The address may have changed or the page may have been removed.</p>${action('/', 'Return home', 'button-link', '', 'house-line')}</section>`,
  };
  // Render and validate before replacing generated output.
  const rendered = [...pages, missing].map(page => ({
    path: page.path,
    html: renderPage({ data, page, navigation, origin, ready, preview }).replace(/^[\t ]+$/gm, ''),
  }));
  const output = resolve(projectRoot, preview ? '.preview' : 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const name of assets) {
    const target = resolve(output, name);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(publicRoot, name), target);
  }
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
