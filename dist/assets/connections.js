'use strict';
// Hover, keyboard and touch share one state, without intercepting card navigation.
document.querySelectorAll('.connection-lens').forEach((lens,index)=>{
 const toggle=lens.querySelector('.connection-toggle');
 const thought=lens.querySelector('.connection-thought');
 const card=lens.closest('.connection-card');
 const id='connection-thought-'+index;
 thought.id=id;toggle.setAttribute('aria-controls',id);toggle.hidden=false;
 lens.classList.add('lens-ready');
 let pinned=false,hovering=false,dismissed=false;
 const setOpen=open=>{lens.classList.toggle('lens-open',open);toggle.setAttribute('aria-expanded',String(open));thought.setAttribute('aria-hidden',String(!open));};
 const update=()=>setOpen(!dismissed&&(pinned||hovering||card.contains(document.activeElement)));
 setOpen(false);
 card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;dismissed=false;update();}});
 card.addEventListener('pointerleave',()=>{hovering=false;update();});
 card.addEventListener('focusin',()=>{dismissed=false;update();});
 card.addEventListener('focusout',()=>queueMicrotask(update));
 toggle.addEventListener('click',()=>{pinned=!pinned;dismissed=!pinned;setOpen(pinned);});
 card.addEventListener('keydown',event=>{if(event.key==='Escape'){pinned=false;hovering=false;dismissed=true;setOpen(false);}});
});
const portrait=document.querySelector('.hero-portrait');
if(portrait){
 const light=document.createElement('span');light.className='portrait-light';light.setAttribute('aria-hidden','true');portrait.append(light);portrait.classList.add('portrait-lit');
 let frame=0,point=null;
 const move=event=>{point={x:event.clientX,y:event.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!point)return;const box=portrait.getBoundingClientRect();portrait.style.setProperty('--light-x',((point.x-box.left)/box.width*100).toFixed(2)+'%');portrait.style.setProperty('--light-y',((point.y-box.top)/box.height*100).toFixed(2)+'%');});};
 portrait.addEventListener('pointerenter',event=>{portrait.classList.add('light-active');move(event);});
 portrait.addEventListener('pointermove',move,{passive:true});
 const finish=()=>{portrait.classList.remove('light-active');point=null;if(frame){cancelAnimationFrame(frame);frame=0;}};
 portrait.addEventListener('pointerleave',finish);portrait.addEventListener('pointercancel',finish);
 portrait.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')finish();});
}
