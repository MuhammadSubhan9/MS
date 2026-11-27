import Lenis from './vendor/lenis-1.1.20.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');
const nativeScroll = 'dialog, .header-nav, textarea, select, input, [contenteditable="true"]';
const scrollKeys = [' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'Tab'];
let scroll;
let frame = 0;
let pinching = false;

function animate(time) {
  frame = 0;
  scroll?.raf(time);
  if (scroll?.isScrolling === 'smooth') frame = requestAnimationFrame(animate);
}

function settle() {
  if (scroll?.isScrolling !== 'smooth') return;
  // Let clicks, anchors, keyboard scrolling and browser history take over immediately.
  scroll.stop();
  scroll.start();
  cancelAnimationFrame(frame);
  frame = 0;
}

function enable() {
  cancelAnimationFrame(frame);
  frame = 0;
  scroll?.destroy();
  scroll = undefined;
  pinching = false;
  if (reducedMotion.matches || !('ResizeObserver' in window)) return;

  const touch = coarsePointer.matches;
  scroll = new Lenis({
    // Two26's public homepage scroll settings, applied to the browser window.
    duration: touch ? 1.1 : 1.7,
    wheelMultiplier: .9,
    syncTouch: true,
    touchMultiplier: touch ? 1.6 : 2.6,
    touchInertiaMultiplier: touch ? 18 : 50,
    syncTouchLerp: touch ? .09 : .35,
    virtualScroll({ event, deltaX, deltaY }) {
      if (event.touches?.length > 1) pinching = true;
      if (pinching) {
        if (!event.touches?.length) pinching = false;
        settle();
        return false;
      }
      if (event.defaultPrevented || event.ctrlKey || event.shiftKey || (window.visualViewport?.scale || 1) > 1.01 ||
          Math.abs(deltaX) > Math.abs(deltaY) || event.target.closest?.(nativeScroll) || document.querySelector('dialog[open]')) {
        settle();
        return false;
      }
      if (deltaY && !frame) {
        scroll.raf(performance.now());
        frame = requestAnimationFrame(animate);
      }
      return true;
    },
  });
}

addEventListener('pointerdown', settle, { capture: true, passive: true });
addEventListener('touchcancel', () => {
  pinching = false;
  settle();
}, { passive: true });
addEventListener('keydown', event => {
  if (scrollKeys.includes(event.key)) settle();
}, true);
addEventListener('pagehide', settle);
addEventListener('pageshow', () => scroll?.resize());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) settle();
});
reducedMotion.addEventListener('change', enable);
coarsePointer.addEventListener('change', enable);
enable();
