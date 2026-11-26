import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { build } from './build.mjs';

const compress = promisify(gzip);

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.vcf': 'text/vcard; charset=utf-8',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.webp': 'image/webp',
  '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
};

export function createSiteServer(output) {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      return response.end();
    }
    let url;
    let pathname;
    try {
      url = new URL(request.url, 'http://localhost');
      pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('//') || pathname.includes('\\')) throw new Error('Invalid path');
    } catch {
      response.writeHead(400);
      return response.end('Invalid address');
    }
    try {
      let file = resolve(output, '.' + pathname);
      if (file !== output && !file.startsWith(output + sep)) throw new Error('Invalid path');
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(308, { Location: url.pathname + '/' + url.search });
          return response.end();
        }
        file = resolve(file, 'index.html');
      }
      const canonical = await realpath(file);
      if (!canonical.startsWith((await realpath(output)) + sep)) throw new Error('Invalid path');
      let body = await readFile(canonical);
      const extension = extname(file);
      response.setHeader('Content-Type', types[extension] || 'application/octet-stream');
      response.setHeader('Cache-Control', extension === '.woff2' ? 'public, max-age=86400' : 'no-cache');
      if (['.html', '.css', '.js', '.svg', '.xml'].includes(extension)) {
        response.setHeader('Vary', 'Accept-Encoding');
        if ((request.headers['accept-encoding'] || '').split(',').some(item => /^\s*gzip\s*(?:;\s*q=(?:1(?:\.0*)?|0\.\d*[1-9]\d*))?\s*$/i.test(item))) {
          body = await compress(body);
          response.setHeader('Content-Encoding', 'gzip');
        }
      }
      response.setHeader('Content-Length', body.length);
      response.writeHead(200);
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      const body = await readFile(`${output}/404.html`).catch(() => 'Page not found');
      response.end(request.method === 'HEAD' ? undefined : body);
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { output } = await build({ preview: process.argv.includes('--preview') });
  createSiteServer(output).listen(4173, '127.0.0.1', () => console.log('Local site at http://127.0.0.1:4173'));
}
