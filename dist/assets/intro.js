'use strict';
(() => {
 const root=document.documentElement,intro=document.querySelector('.opening');
 if(!intro)return;intro.dataset.ready='true';
 const skip=intro.querySelector('[data-skip-intro]'),main=document.querySelector('main'),header=document.querySelector('.site-header'),footer=document.querySelector('.site-footer');
 let done=true,hold,cleanup,returnFocus;
 function finish(){if(done)return;done=true;clearTimeout(hold);try{sessionStorage.setItem('subhan-intro-seen','1');}catch{}
  intro.classList.add('leaving');[main,header,footer].forEach(e=>{if(e)e.inert=false;});document.body.classList.remove('intro-locked');root.classList.add('intro-complete');
  cleanup=setTimeout(()=>{root.classList.remove('intro-pending');intro.setAttribute('aria-hidden','true');intro.inert=true;if(document.activeElement===skip)(returnFocus||document.querySelector('.brand')).focus({preventScroll:true});},intro.classList.contains('quiet')?180:1150);
 }
 function start(){clearTimeout(hold);clearTimeout(cleanup);done=false;returnFocus=document.activeElement?.tagName==='BUTTON'?document.activeElement:null;root.classList.remove('intro-complete');intro.classList.remove('leaving');intro.inert=false;intro.removeAttribute('aria-hidden');
  const quiet=false;
  intro.classList.toggle('quiet',quiet);root.classList.add('intro-pending');window.scrollTo(0,0);[main,header,footer].forEach(e=>{if(e)e.inert=true;});document.body.classList.add('intro-locked');skip.focus({preventScroll:true});hold=setTimeout(finish,quiet?1200:3500);
 }
 skip.addEventListener('click',finish);intro.addEventListener('keydown',e=>{if(done)return;if(e.key==='Escape')finish();if(e.key==='Tab'){e.preventDefault();skip.focus();}});
 if(root.classList.contains('intro-pending'))start();else{intro.inert=true;intro.setAttribute('aria-hidden','true');}
})();
