from html import escape

def menu_html(pages,current,prefix):
 E=lambda s:escape(str(s),quote=True)
 choices=[('about.html','About me','The person behind the direction'),('journey.html','My journey','How my interests developed'),('education.html','Education','The academic foundation'),('direction.html','Direction','The work I want to build towards'),('portfolio.html','Beyond the classroom','Capabilities, learning, and experiences'),('contact.html','Contact','Start a conversation')]
 def link(path,label,cls=''):
  return f'<a class="{cls}" href="{E(prefix+path)}"'+(' aria-current="page"'if path==current else '')+f'>{label}</a>'
 cards=''.join(link(path,f'<span class="menu-choice-number">{i+1:02d}</span><span class="menu-choice-copy"><strong>{E(title)}</strong><small>{E(note)}</small></span><span class="menu-choice-arrow" aria-hidden="true">↗</span>','menu-choice')for i,(path,title,note)in enumerate(choices))
 return '<div class="menu-layout clean-menu"><div class="menu-intro"><p class="eyebrow">A few ways in</p><h2>Take a look<br><em>around.</em></h2><p>The person, the direction, and the experiences along the way.</p>'+link('index.html','Back to the beginning <span aria-hidden="true">↗</span>','menu-home')+'</div><div class="menu-directory"><nav class="menu-choice-grid" aria-label="Main chapters">'+cards+'</nav><div class="menu-extra"><span>Explore the direction</span>'+link('direction/transactions.html','M&A & private equity')+link('direction/technology.html','Technology & responsibility')+'</div><div class="menu-utilities"><button data-search>Find something specific <span>Ctrl / ⌘ K</span></button></div></div></div>'
