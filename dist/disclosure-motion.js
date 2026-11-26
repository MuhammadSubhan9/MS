const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const moving = new Map();

export function disclosureTiming(open, distance, size) {
  return {
    duration: Math.round((open ? 235 : 185) + Math.min(size, 450) * .27 *
      Math.max(.3, Math.min(1, distance / Math.max(1, size)))),
    easing: open ? 'cubic-bezier(.18,.75,.24,1)' : 'cubic-bezier(.38,0,.7,.48)',
    fill: 'both',
  };
}

// Set the final visibility separately from the animation so a second press can reverse from the current height.
export function revealPanel(panel, open, instant = false) {
  const previous = moving.get(panel);
  const startHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  const startOpacity = previous ? Number(getComputedStyle(panel).opacity) : panel.hidden ? .45 : 1;
  previous?.animation.cancel();
  moving.delete(panel);

  function settle() {
    panel.hidden = !open;
    panel.inert = false;
    delete panel.dataset.revealMotion;
  }
  if (instant || reducedMotion.matches || typeof panel.animate !== 'function' || panel.hidden && !open) {
    settle();
    return;
  }
  panel.hidden = false;
  panel.inert = !open;
  const fullHeight = panel.getBoundingClientRect().height;
  const endHeight = open ? fullHeight : 0;
  if (Math.abs(endHeight - startHeight) < 1) {
    settle();
    return;
  }
  panel.dataset.revealMotion = open ? 'opening' : 'closing';
  const animation = panel.animate([
    { height: startHeight + 'px', opacity: startOpacity },
    { height: endHeight + 'px', opacity: open ? 1 : .45 },
  ], disclosureTiming(open, Math.abs(endHeight - startHeight), fullHeight));
  moving.set(panel, { animation, open });
  animation.finished.then(() => {
    if (moving.get(panel)?.animation !== animation) return;
    moving.delete(panel);
    settle();
    animation.cancel();
  }, () => {});
}

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    for (const [panel, { open }] of moving) revealPanel(panel, open, true);
  }
});
