'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const motionOff=false;
const story=$('.story-scroll');
document.documentElement.classList.add('motion-on');
function fitStory(){const staticLayout=innerWidth<360||innerHeight<660||(innerWidth<600&&innerHeight<790);story?.classList.toggle('static-story',staticLayout);if(staticLayout){$$('.story-chapter').forEach(e=>e.removeAttribute('aria-hidden'));$$('.scene-panel').forEach(e=>{e.inert=false;e.removeAttribute('aria-hidden');});}}
fitStory();
const menu=$('[data-menu]'),mobile=$('#mobile-nav');
if(mobile)mobile.inert=true;
function closeMenu(){mobile?.classList.remove('open');if(mobile)mobile.inert=true;menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Open navigation');const label=$('.menu-label');if(label)label.textContent='Explore';document.body.style.overflow='';$('main').inert=false;$('.site-footer').inert=false;}
menu?.addEventListener('click',()=>{const open=!mobile.classList.contains('open');if(!open){closeMenu();return;}mobile.inert=false;mobile.classList.add('open');menu.setAttribute('aria-expanded','true');menu.setAttribute('aria-label','Close navigation');$('.menu-label').textContent='Close';document.body.style.overflow='hidden';$('main').inert=true;$('.site-footer').inert=true;$('.menu-primary a',mobile)?.focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile?.classList.contains('open')){closeMenu();menu.focus();}if(e.key==='Tab'&&mobile?.classList.contains('open')){const focusable=[menu,...$$('a,button,summary',mobile).filter(el=>el.getClientRects().length>0&&!el.closest('details:not([open]) .menu-subpages'))];const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
mobile?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});window.addEventListener('resize',()=>{fitStory();onScroll();});
if('IntersectionObserver'in window&&!motionOff){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});$$('.reveal').forEach(e=>{e.classList.add('js-reveal');observer.observe(e);});}
const progressBar=$('.progress'), storyChapters=$$('.story-chapter'), storyMarkers=$$('.story-markers button'), scenePanels=$$('.scene-panel'), sceneLabel=$('.scene-label');
const motionSections=$$('main>section,.article-body section,.related,.chapter-row,.feature-image,.pullquote,.card');
let ticking=false,activeScene=-1;
function onScroll(){
 if(ticking)return;ticking=true;
 requestAnimationFrame(()=>{
  const available=document.documentElement.scrollHeight-innerHeight;
  const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav'));
  const rect=story?.getBoundingClientRect();
  const frames=motionSections.map(section=>({section,rect:section.getBoundingClientRect()}));
  progressBar?.style.setProperty('transform',`scaleX(${available>0?Math.max(0,Math.min(1,scrollY/available)):0})`);
  if(story&&!story.classList.contains('static-story')){
   const total=Math.max(1,rect.height-innerHeight+nav),p=Math.max(0,Math.min(1,(nav-rect.top)/total));
   story.style.setProperty('--scene',String(p));
   story.style.setProperty('--story-exit',String(Math.max(0,Math.min(1,(p-.9)/.1))));
   const scene=Math.min(2,Math.floor(p*3));
   if(scene!==activeScene||!scenePanels[scene]?.classList.contains('active')||scenePanels.some(p=>!p.hasAttribute('aria-hidden'))){
    activeScene=scene;
    storyChapters.forEach((e,i)=>{e.classList.toggle('active',i===scene);e.setAttribute('aria-hidden',String(i!==scene));});
    storyMarkers.forEach((e,i)=>{e.classList.toggle('active',i===scene);e.setAttribute('aria-pressed',String(i===scene));});
    scenePanels.forEach((panel,i)=>{const active=i===scene;panel.classList.toggle('active',active);panel.inert=!active;panel.setAttribute('aria-hidden',String(!active));});
    if(sceneLabel)sceneLabel.textContent=scenePanels[scene].dataset.label;
   }
  }
  frames.forEach(({section,rect})=>{if(rect.bottom>0&&rect.top<innerHeight){
   const p=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
   section.style.setProperty('--section-progress',p.toFixed(4));
   section.style.setProperty('--section-reveal',Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight*.65))).toFixed(4));
  }});
  ticking=false;
 });
}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
document.fonts?.ready.then(()=>{fitStory();onScroll();});
$$('.story-markers button').forEach((b,i)=>b.addEventListener('click',()=>{const nav=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav'));const top=story.offsetTop-nav;const span=Math.max(1,story.offsetHeight-innerHeight+nav);window.scrollTo({top:top+span*((i+.35)/3),behavior:motionOff?'auto':'smooth'});}));
$$('[data-filter-group]').forEach(group=>{const container=$(`[data-filter-items="${group.dataset.filterGroup}"]`), items=$$('[data-category]',container), status=$('[data-filter-status]',group);$$('[data-filter]',group).forEach(b=>b.addEventListener('click',()=>{const value=b.dataset.filter;$$('[data-filter]',group).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));let n=0;items.forEach(item=>{const show=value==='all'||item.dataset.category.split(',').includes(value);item.hidden=!show;if(show){n++;item.classList.add('visible');}});if(status)status.textContent=`${n} ${n===1?'entry':'entries'}`;}));});
$$('[data-reading]').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.reading;document.body.classList.toggle('scan-mode',mode==='scan');document.body.classList.toggle('guided-mode',mode==='guided');document.body.classList.toggle('essay-mode',mode==='full');$$('.story-deeper').forEach(d=>d.open=mode==='full');$$('[data-reading]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
const tabButtons=$$('[role=tab]');tabButtons.forEach((b,i)=>{const activate=()=>{const group=b.closest('.evidence-tabs');$$('[role=tab]',group).forEach(x=>{const active=x===b;x.setAttribute('aria-selected',String(active));x.tabIndex=active?0:-1;$('#'+x.getAttribute('aria-controls')).hidden=!active;});};b.addEventListener('click',activate);b.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const tabs=$$('[role=tab]',b.closest('.evidence-tabs'));let idx=tabs.indexOf(b);idx=e.key==='Home'?0:e.key==='End'?tabs.length-1:(idx+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[idx].click();tabs[idx].focus();}});});
function toast(message){let e=$('.toast');if(!e){e=document.createElement('div');e.className='toast';e.setAttribute('role','status');document.body.append(e);}e.textContent=message;clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.remove(),3500);}
const dialog=$('#site-search'), searchInput=$('#search-input'), results=$('#search-results');let searchIndex=[];let searchPromise;
async function openSearch(){if(document.body.classList.contains('intro-locked'))return;closeMenu();if(!dialog.open)dialog.showModal();searchInput.focus();if(!searchPromise){results.textContent='Loading the page index…';}if(!searchPromise)searchPromise=fetch(new URL('search.json?v='+document.querySelector('script[data-index-version]').dataset.indexVersion,document.querySelector('script[src*="assets/site.js"]').src)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{searchIndex=data;renderSearch();}).catch(()=>{searchPromise=null;results.replaceChildren();const message=document.createElement('p');message.className='search-hint';message.textContent='Search could not load. Retry, or close search and use Explore to browse every chapter.';const retry=document.createElement('button');retry.className='button search-retry';retry.textContent='Retry search';retry.addEventListener('click',openSearch);results.append(message,retry);});await searchPromise;}
function renderSearch(){const query=searchInput.value.trim().toLowerCase();const score=p=>!query?1:(p.title.toLowerCase().includes(query)?8:0)+(p.description.toLowerCase().includes(query)?4:0)+(p.category.toLowerCase().includes(query)?3:0)+(p.keywords.toLowerCase().includes(query)?1:0);const found=searchIndex.map(p=>({p,s:score(p)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,18).map(x=>x.p);results.replaceChildren();if(!found.length){const p=document.createElement('p');p.className='search-hint';p.textContent='No matching pages. Try “business”, “English”, “AI” or “aviation”.';results.append(p);}found.forEach(p=>{const a=document.createElement('a');a.href=new URL('../'+p.path,document.querySelector('script[src*="assets/site.js"]').src).href;a.textContent=p.title;const span=document.createElement('span');span.textContent=p.category+' · '+p.description;a.append(span);results.append(a);});}
$$('[data-search]').forEach(b=>b.addEventListener('click',openSearch));$('[data-close-search]')?.addEventListener('click',()=>dialog.close());searchInput?.addEventListener('input',()=>{if(searchIndex.length)renderSearch();});dialog?.addEventListener('close',()=>menu?.focus({preventScroll:true}));dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}});
const contact=$('#contact-form');let topic='A professional introduction';$$('[data-topic]').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;$$('[data-topic]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#contact-topic').textContent=topic;$('#message').placeholder=b.dataset.prompt;}));
const contactFields=contact?[$('#name'),$('#message')]:[];
contactFields.forEach(field=>field.addEventListener('input',()=>field.setCustomValidity('')));
contact?.addEventListener('submit',e=>{
 e.preventDefault();
 contactFields.forEach(field=>field.setCustomValidity(field.value.trim()?'':'Please enter text, rather than only spaces.'));
 if(!contact.reportValidity())return;
 const name=$('#name').value.trim(),message=$('#message').value.trim();
 const subject=`${topic} — ${name}`,body=`Hello Subhan,\n\n${message}\n\nKind regards,\n${name}`;
 const mailto=`mailto:ms@ahmadbaqa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
 $('#draft-text').value=`To: ms@ahmadbaqa.com\nSubject: ${subject}\n\n${body}`;
 $('#draft-result').hidden=false;$('#draft-link').href=mailto;
 const longDraft=mailto.length>1800;
 $('#draft-status').textContent=longDraft?'Your draft is ready. This message is long; copy it into your email app to avoid truncation.':'Your draft is ready. If your email app did not open, use the link below or copy the draft. Nothing has been sent.';
 $('#draft-link').hidden=longDraft;
 if(!longDraft)location.href=mailto;
});
$('[data-copy-draft]')?.addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText($('#draft-text').value);toast('Draft copied. Paste it into your email app and review it before sending.');}
 catch{$('#draft-text').focus();$('#draft-text').select();toast('Select and copy the draft with your keyboard or touch menu.');}
});
$('[data-copy-email]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('ms@ahmadbaqa.com');toast('Email address copied.');}catch{toast('Email: ms@ahmadbaqa.com');}});let printStates=null;
window.addEventListener('beforeprint',()=>{if(printStates)return;printStates=$$('.story-deeper').map(d=>({element:d,open:d.open}));printStates.forEach(({element})=>element.open=true);});
window.addEventListener('afterprint',()=>{printStates?.forEach(({element,open})=>element.open=open);printStates=null;});
$$('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
