def story_board():
 phases=[
  ('Learning began with a question.','01 / Foundations',[
   ('JANUARY 2024','Crew management','Communication within a shared operation.','learning/crew-management.html'),
   ('DECEMBER 2024','Business administration','The organisation behind the outcome.','learning/business-administration.html'),
   ('OCTOBER 2025','Business finance','A first look at the commercial perspective.','learning/business-finance.html')]),
  ('The connections became clearer.','02 / A wider lens',[
   ('AVIATION','Global Airports Forum','What makes complex coordination feel simple?','events/airports.html'),
   ('FINANCE & TECHNOLOGY','Money20/20','What makes an action authorised?','events/money2020.html'),
   ('GOVERNANCE','UNESCO AI forum','Who takes responsibility after capability?','events/unesco.html')]),
  ('A direction, grounded in work.','03 / The present chapter',[
   ('THE FOUNDATION','International A Levels','Mathematics, Physics, Computer Science.','education.html'),
   ('THE INTEREST','Corporate & commercial law','M&A and private equity as areas to explore.','direction.html'),
   ('THE PRACTICE','Writing & participation','Clearer questions. More useful experience.','experience.html')])]
 result='<div class="story-board"><div class="board-caption"><span>HOW THE INTERESTS CONNECT</span><span class="scene-label">01 / Foundations</span></div><div class="evidence-canvas"><svg class="evidence-route" viewBox="0 0 24 290" aria-hidden="true"><path d="M12 8v274M12 47h12M12 145h12M12 241h12" fill="none" stroke="currentColor" stroke-width="1" pathLength="1"/></svg>'
 for i,(title,label,entries)in enumerate(phases):
  result+=f'<div class="scene-panel scene-{i}'+(' active'if i==0 else '')+'"'+(' inert aria-hidden="true"'if i else '')+f' data-label="{label}"><h3>{title}</h3><div class="evidence-records">'
  for j,(date,name,desc,path)in enumerate(entries):
   result+=f'<a class="evidence-record" href="{path}" style="--record-index:{j}"><span class="record-meta">{date}</span><strong>{name}</strong><span class="record-note">{desc}</span><span class="record-open">Read the story</span></a>'
  result+='</div></div>'
 result+='</div><div class="board-footer"><span>Explore the experience behind each idea.</span><span class="board-drawn-line" aria-hidden="true"></span></div></div>'
 return result
