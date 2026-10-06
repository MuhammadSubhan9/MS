"""Check the built site's routes, assets, fragments, semantics, and content depth."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json,re
ROOT=Path(__file__).resolve().parent.parent/'dist'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ids=[];self.h1=0;self.main=False;self.skip=0;self.words=[]
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='main':self.main=True
  if tag in ['script','style']:self.skip+=1
  if tag=='h1':self.h1+=1
  if 'id'in d:self.ids.append(d['id'])
  for key in ['href','src']:
   if d.get(key):self.refs.append(d[key])
 def handle_endtag(self,tag):
  if tag=='main':self.main=False
  if tag in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,data):
  if self.main and not self.skip:self.words.extend(re.findall(r'\b[\w’-]+\b',data))
pages={};errors=[]
for path in ROOT.rglob('*.html'):
 p=Page();p.feed(path.read_text(encoding='utf-8'));pages[path.resolve()]=p
 if p.h1!=1:errors.append(f'{path.name}: {p.h1} h1 headings')
 if len(p.ids)!=len(set(p.ids)):errors.append(f'{path.name}: duplicate IDs')
 if path.name!='404.html' and len(p.words)<300:errors.append(f'{path.name}: only {len(p.words)} words in main content')
for path,p in pages.items():
 for ref in p.refs:
  u=urlsplit(ref)
  if u.scheme or u.netloc:continue
  target=(ROOT/unquote(u.path.lstrip('/')) if u.path.startswith('/')else path.parent/unquote(u.path)).resolve()if u.path else path
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{path.relative_to(ROOT)}: missing {ref}')
  elif u.fragment and target in pages and unquote(u.fragment)not in pages[target].ids:errors.append(f'{path.relative_to(ROOT)}: missing fragment {ref}')
for path in ROOT.rglob('*'):
 if path.is_file()and path.suffix in ['.html','.js','.json']and 'subhan.ahmadbaqa@gmail.com'in path.read_text(encoding='utf-8'):errors.append('Old email remains: '+str(path))
report={'html_files':len(pages),'minimum_main_words':min(len(p.words)for path,p in pages.items()if path.name!='404.html'),'total_main_words':sum(len(p.words)for path,p in pages.items()),'errors':errors}
print(json.dumps(report,indent=2));raise SystemExit(1 if errors else 0)
