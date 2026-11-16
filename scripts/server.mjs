import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from './build.mjs';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
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
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400);
      return response.end('Invalid address');
    }
    try {
      let file = resolve(output, '.' + pathname);
      if (file !== output && !file.startsWith(output + sep)) throw new Error('Invalid path');
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(308, { Location: encodeURI(pathname) + '/' });
          return response.end();
        }
        file = resolve(file, 'index.html');
      }
      let body = await readFile(file);
      const extension = extname(file);
      response.setHeader('Content-Type', types[extension] || 'application/octet-stream');
      response.setHeader('Cache-Control', extension === '.woff2' ? 'public, max-age=86400' : 'no-cache');
      if (['.html', '.css', '.js', '.svg', '.xml'].includes(extension)) {
        response.setHeader('Vary', 'Accept-Encoding');
        if (/\bgzip\b/.test(request.headers['accept-encoding'] || '')) {
          body = gzipSync(body);
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
