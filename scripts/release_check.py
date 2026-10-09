"""Dependency-free release assertions for generated output and source hygiene."""
import ast
import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist'
errors = []
def check(condition, message):
    if not condition:
        errors.append(message)

class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.tags = []
        self.title = ''
        self.in_title = False
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'title':
            self.in_title = True
        if tag not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:
            self.stack.append(tag)
        if tag == 'img':
            check('alt' in attrs, f'{self.path}: image missing alt')
            check(all(attrs.get(x, '').isdigit() for x in ['width','height']), f'{self.path}: image has no dimensions')
        if attrs.get('target') == '_blank':
            check('noopener' in attrs.get('rel', '').split(), f'{self.path}: unsafe external target')
        for name, value in attrs.items():
            check(not name.startswith('on'), f'{self.path}: inline event handler')
            if name in {'href','src','action'}:
                check(not value.startswith(('javascript:', 'http:')), f'{self.path}: unsafe URL scheme')

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        if not self.stack or self.stack[-1] != tag:
            errors.append(f'{self.path}: invalid nesting near </{tag}>')
        else:
            self.stack.pop()

    def handle_data(self, data):
        if self.in_title:
            self.title += data

documents = {}
external = set()
for path in sorted(OUT.rglob('*.html')):
    rel = path.relative_to(OUT).as_posix()
    doc = Document(rel)
    content = path.read_text(encoding='utf-8')
    doc.feed(content)
    check(not doc.stack, f'{rel}: unclosed elements')
    documents[rel] = doc
    check(any(t == 'html' and a.get('lang') == 'en' for t,a in doc.tags), f'{rel}: missing language')
    metadata = {a.get('name',a.get('property')):a.get('content') for t,a in doc.tags if t=='meta'}
    for field in ['description','og:title','og:description','og:image','og:image:alt','twitter:card','twitter:image']:
        check(bool(metadata.get(field)), f'{rel}: missing {field}')
    canonicals = [a.get('href') for t,a in doc.tags if t=='link' and a.get('rel')=='canonical']
    if rel == '404.html':
        check(metadata.get('robots') == 'noindex,follow', '404 must be noindex')
        check(not canonicals, '404 must not canonicalise a nonexistent route')
    else:
        check(len(canonicals) == 1 and canonicals[0].startswith('https://'), f'{rel}: invalid canonical')
        check('noindex' not in metadata.get('robots',''), f'{rel}: accidental noindex')
    for tag,attrs in doc.tags:
        refs = [attrs[k] for k in ['href','src'] if attrs.get(k)]
        if 'srcset' in attrs:
            refs += [x.strip().split()[0] for x in attrs['srcset'].split(',')]
        for ref in refs:
            url = urlsplit(ref)
            if url.scheme in ['http','https']:
                if tag=='a': external.add(ref)
                continue
            if url.scheme or not url.path:continue
            relative = unquote(url.path)
            target = OUT / relative.lstrip('/') if relative.startswith('/') else path.parent / relative
            target = target.resolve()
            check(target.is_relative_to(OUT.resolve()), f'{rel}: path outside output')
            check(target.exists(), f'{rel}: missing {ref}')
            if target.is_relative_to(OUT.resolve()):
                current = OUT
                for part in target.relative_to(OUT).parts:
                    if current.is_dir():
                        check(part in [p.name for p in current.iterdir()], f'{rel}: case mismatch {ref}')
                    current /= part
    check(not re.search(r'lorem ipsum|TODO|FIXME|localhost|127\.0\.0\.1|example\.com',content,re.I), f'{rel}: development content')

for label,values in [('title',[p.title for p in documents.values()]),('description',[next(a['content'] for t,a in p.tags if t=='meta' and a.get('name')=='description') for p in documents.values()])]:
    duplicates=[value for value,count in Counter(values).items() if count>1]
    check(not duplicates, f'duplicate {label}: {duplicates}')

index = json.loads((OUT/'assets/search.json').read_text(encoding='utf-8'))
expected = {p['path'] for p in index}
release_routes={'index.html','about.html','journey.html','education.html','direction.html','direction/technology.html','direction/transactions.html','portfolio.html','contact.html'}
check(expected==release_routes, 'Search must contain precisely the current nine content routes')
check(set(documents)==expected|{'404.html'}, 'Generated route set differs from search index')
for line in (OUT/'_redirects').read_text(encoding='utf-8').splitlines():
    source, target, status = line.split()
    url = urlsplit(target)
    rel = url.path.lstrip('/')
    check(status == '301' and rel in expected, f'Invalid consolidation redirect: {source}')
    if url.fragment and rel in documents:
        ids = {attrs.get('id') for _,attrs in documents[rel].tags}
        check(url.fragment in ids, f'Missing redirect section: {target}')
urls = ET.parse(OUT/'sitemap.xml').getroot()
sitemap = [e.text for e in urls.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
check(len(sitemap)==len(release_routes) and len(set(sitemap))==len(release_routes),'Sitemap must contain each current route exactly once')
for rel,doc in documents.items():
    if rel!='404.html':
        canonical=next(a['href'] for t,a in doc.tags if t=='link' and a.get('rel')=='canonical')
        check(canonical in sitemap,f'{rel}: canonical absent from sitemap')

for path in (ROOT/'scripts').glob('*.py'):
    ast.parse(path.read_text(encoding='utf-8'), filename=str(path))
for path in OUT.rglob('*'):
    if not path.is_file(): continue
    check(path.suffix not in ['.py','.map','.tar','.gz','.env'],f'Development file in output: {path.name}')
    if path.suffix in ['.html','.js','.css','.json','.txt']:
        content=path.read_text(encoding='utf-8')
        check(not re.search(r'console\.log\(|debugger\s*;|-----BEGIN .*PRIVATE KEY-----|sk-[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}',content),f'Debug/credential pattern: {path.name}')

check(not list(ROOT.glob('.env*')), 'Review environment files before release')
check((OUT/'assets/licenses/manrope-OFL.txt').is_file(),'Missing Manrope licence')
check((OUT/'assets/licenses/cormorant-garamond-OFL.txt').is_file(),'Missing Cormorant licence')
report={'html_pages':len(documents),'search_routes':len(index),'sitemap_routes':len(sitemap),'external_links':len(external),'output_bytes':sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file()),'errors':errors}
print(json.dumps(report,indent=2))
if '--external-list' in sys.argv:
    print(json.dumps(sorted(external),indent=2))
raise SystemExit(1 if errors else 0)
