from html import escape
def menu_html(pages,current,prefix):
 E=lambda s:escape(str(s),quote=True)
 def link(path,label,cls=''):
  return f'<a class="{cls}" href="{E(prefix+path)}"'+(' aria-current="page"'if path==current else '')+f'>{E(label)}</a>'
 primary=[('index.html','Home'),('about.html','About me'),('journey.html','My journey'),('education.html','Education'),('contact.html','Contact')]
 groups=[('direction','Direction','The work I’m building towards'),('skills','Capabilities','Evidence behind the skill'),('learning','Learning','The complete course record'),('languages','Languages','Different levels, clear context'),('experience','Experience','Participation and responsibility'),('events','Events','Places that changed my questions'),('journal','Journal','Reflections and the complete archive'),('projects','Projects','Making the thinking visible')]
 child_html=''
 for key,title,note in groups:
  entries=[p for p in pages.values()if p['path'].startswith(key+'/')]
  child_html+=f'<details class="menu-group"><summary><span>{title}<small>{note}</small></span><span class="menu-count">{len(entries)+1:02d}</span></summary><div class="menu-subpages">'+link(key+'.html','Overview · '+title)
  child_html+=''.join(link(p['path'],p['title'])for p in entries)+'</div></details>'
 return '<div class="menu-layout"><div class="menu-intro"><p class="eyebrow">Every part of the story</p><h2>Follow<br>your <em>curiosity.</em></h2><p>Start with the person. Follow a question. Find the evidence behind it.</p><div class="menu-utilities"><button data-search>Search the portfolio <span>Ctrl / ⌘ K</span></button><a href="mailto:ms@ahmadbaqa.com">ms@ahmadbaqa.com</a></div></div><div class="menu-directory"><nav class="menu-primary" aria-label="Main chapters">'+''.join(link(path,label)for path,label in primary)+'</nav><div class="menu-groups">'+child_html+'</div></div></div>'
