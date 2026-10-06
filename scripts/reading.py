from html import escape
import re
def split_first(text):
 match=re.match(r'(.+?[.!?])(?:\s+|$)(.*)',text,re.S)
 return (match.group(1),match.group(2))if match else(text,'')
def reading_section(section,index,total,rich,slug):
 paragraphs=section['paragraphs'];opening,rest=split_first(paragraphs[0])
 summary=opening if len(opening)<190 else ' '.join(opening.split()[:27])+'…'
 result=f'<section class="reading-scene reveal" id="{slug(section["title"])}" data-scene-number="{index+1:02d}" data-scene-total="{total}" data-scene-title="{escape(section["title"],quote=True)}" data-scene-summary="{escape(summary,quote=True)}"><div class="scene-heading"><span class="scene-kicker">{index+1:02d} / {total:02d}</span><h2>{rich(section["title"])}</h2></div><p class="scene-opening">{rich(opening)}</p>'
 if rest:result+='<div class="scene-explanation"><p>'+rich(rest)+'</p></div>'
 further=paragraphs[1:]
 if further:
  main,remaining=split_first(further[0])
  result+='<div class="scene-thought"><span class="eyebrow">The connection</span><p>'+rich(main)+'</p></div>'
  deeper=([remaining]if remaining else [])+further[1:]
  if deeper:result+='<details class="story-deeper"><summary><span>Read the deeper context</span><span class="detail-glyph" aria-hidden="true">+</span></summary><div>'+''.join('<p>'+rich(t)+'</p>'for t in deeper)+'</div></details>'
 return result
def reading_panel(page,rich):
 first=page['sections'][0];summary,_=split_first(first['paragraphs'][0]);summary=summary if len(summary)<190 else ' '.join(summary.split()[:27])+'…'
 return f'<div class="reading-panel"><p class="eyebrow">Follow the chapter</p><div class="reading-position"><span class="reading-number">01</span><span class="reading-total">/ {len(page["sections"]):02d}</span></div><h2 class="reading-current">{escape(first["title"])}</h2><p class="reading-summary">{escape(summary)}</p><div class="reading-track" aria-hidden="true"><span></span></div><p class="reading-invitation">The picture unfolds as you scroll.</p></div>'
