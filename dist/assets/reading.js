'use strict';
(() => {
 const scenes=[...document.querySelectorAll('.reading-scene')],panel=document.querySelector('.reading-panel');
 if(!panel||!scenes.length)return;
 let current=-1,queued=false;
 function update(){queued=false;const target=innerHeight*.42;let best=0,bestDistance=Infinity;scenes.forEach((scene,i)=>{const r=scene.getBoundingClientRect();const distance=r.top<=target&&r.bottom>=target?0:Math.min(Math.abs(r.top-target),Math.abs(r.bottom-target));if(distance<bestDistance){bestDistance=distance;best=i;}});
  const active=scenes[best],r=active.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(target-r.top)/Math.max(1,r.height)));panel.style.setProperty('--reading-progress',progress.toFixed(4));
  if(best!==current){current=best;panel.querySelector('.reading-number').textContent=active.dataset.sceneNumber;panel.querySelector('.reading-current').textContent=active.dataset.sceneTitle;panel.querySelector('.reading-summary').textContent=active.dataset.sceneSummary;panel.classList.remove('changing');requestAnimationFrame(()=>panel.classList.add('changing'));document.querySelectorAll('.toc a').forEach(a=>{const isActive=a.hash==='#'+active.id;a.classList.toggle('active',isActive);if(isActive)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
 document.querySelectorAll('.chapter-jump a').forEach(a=>a.addEventListener('click',()=>{if(innerWidth<=820)a.closest('details').open=false;}));
})();
