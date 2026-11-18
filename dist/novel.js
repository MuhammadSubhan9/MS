const hero = document.querySelector('.novel-hero');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 780px)');

function playEntrance() {
  if (document.documentElement.classList.contains('page-transitioning')) return;
  if (reduceMotion.matches || location.hash || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
  try {
    if (sessionStorage.getItem('rehearsal-library-entrance')) return;
    sessionStorage.setItem('rehearsal-library-entrance', '1');
  } catch {
    // A blocked storage setting still allows the entrance on this visit.
  }
  hero.setAttribute('data-entrance', '');
  const book = hero.querySelector('.shelf-book-object');
  function settleEntrance() {
    delete hero.dataset.entrance;
    book.removeEventListener('animationend', settleEntrance);
    book.removeEventListener('animationcancel', settleEntrance);
  }
  book.addEventListener('animationend', settleEntrance);
  book.addEventListener('animationcancel', settleEntrance);
}

function drawWaveform() {
  const canvas = document.querySelector('[data-waveform]');
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.parentElement.hidden = false;
  const { width, height } = canvas;
  const half = height / 2;
  context.fillStyle = '#5b4d3d';
  context.fillRect(0, half, width, 1);
  for (let x = 2; x < width; x += 6) {
    const time = x / width;
    const phase = Math.abs(Math.sin(time * 21) * Math.cos(time * 9));
    const spikes = .22 + .78 * Math.abs(Math.sin(x * 7.237));
    const signal = 3 + Math.sin(time * Math.PI) * phase * spikes * (half - 7);
    context.fillStyle = time > .44 && time < .51 ? '#e0ad89' : '#916a52';
    context.fillRect(x, half - signal, 2, signal * 2);
  }
}

const libraryPhoto = hero.querySelector('.shelf-image');
if (libraryPhoto.complete && libraryPhoto.naturalWidth) {
  playEntrance();
} else {
  hero.dataset.libraryLoading = '';
  libraryPhoto.decode().then(() => {
    if (!document.body.classList.contains('novel-scroll-locked')) playEntrance();
  }).catch(() => {
    // The cover and excerpt are still available if the room image fails to load.
  }).finally(() => { delete hero.dataset.libraryLoading; });
}
drawWaveform();

const reader = document.querySelector('[data-reader]');
const spread = reader.querySelector('[data-spread]');
const leaves = [...spread.querySelectorAll('[data-leaf]')];
const pageCount = leaves.length - 2;
const controls = reader.querySelector('.reader-controls');
const previous = controls.querySelector('[data-page-step="-1"]');
const next = controls.querySelector('[data-page-step="1"]');
const status = controls.querySelector('[data-page-status]');
const dialog = document.querySelector('.novel-reader-dialog');
const inlineSlot = document.querySelector('[data-inline-reader]');
const dialogSlot = document.querySelector('[data-dialog-reader]');
const closeButton = dialog.querySelector('[data-close-reader]');
const shelfCover = hero.querySelector('.shelf-book img');
const turnDuration = 380;
const ease = 'cubic-bezier(.38, .05, .22, 1)';
const animations = new Set();
let page = 1;
let opener = null;
let returnScroll = 0;
let revision = 0;

function spreadStarts() {
  if (narrow.matches) return Array.from({ length: pageCount }, (_, index) => index + 1);
  return leaves.filter((_, index) => index <= pageCount && index % 2 === 0)
    .map(leaf => Number(leaf.dataset.leaf));
}

function currentSpreadIndex(starts = spreadStarts()) {
  return starts.findLastIndex(start => start <= page);
}

function renderSpread() {
  const starts = spreadStarts();
  const index = currentSpreadIndex(starts);
  const first = starts[index];
  const last = first + (narrow.matches ? 0 : 1);

  for (const [number, leaf] of leaves.entries()) leaf.hidden = number < first || number > last;
  previous.setAttribute('aria-disabled', String(index === 0));
  next.setAttribute('aria-disabled', String(index === starts.length - 1));

  const from = Math.max(first, 1);
  const to = Math.min(last, pageCount);
  const label = from === to ? 'Page ' + from : 'Pages ' + from + '–' + to;
  const atEnd = narrow.matches && index === starts.length - 1;
  status.textContent = label + ' of ' + pageCount + (atEnd ? ' · End of excerpt' : '');
}

function cancelEffects() {
  revision++;
  for (const animation of animations) animation.cancel();
  for (const copy of document.querySelectorAll('[data-moving-copy]')) copy.remove();
  delete reader.dataset.travelling;
  delete dialog.dataset.sceneShift;
  reader.classList.remove('reader-opening', 'reader-closing');
}

async function animate(element, keyframes, timing) {
  const animation = element.animate(keyframes, timing);
  animations.add(animation);
  try {
    await animation.finished;
    return true;
  } catch {
    return false;
  } finally {
    animations.delete(animation);
  }
}

function coverImage() {
  const cover = document.createElement('img');
  cover.src = shelfCover.currentSrc || shelfCover.src;
  cover.alt = '';
  return cover;
}

function sheet(front, back, direction) {
  const overlay = document.createElement('div');
  overlay.className = 'reader-turn ' + direction;
  overlay.dataset.movingCopy = '';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.inert = true;
  for (const [face, item] of [['front', front], ['back', back]]) {
    if (!item) continue;
    const container = document.createElement('div');
    container.className = 'reader-turn-face ' + face;
    container.append(item);
    overlay.append(container);
  }
  spread.append(overlay);
  return overlay;
}

function copyLeaf(leaf) {
  const copy = leaf.cloneNode(true);
  copy.hidden = false;
  return copy;
}

function scrollToCurrentPage() {
  if (dialog.open) {
    dialog.scrollTop = 0;
  } else if (spread.getBoundingClientRect().top < 80) {
    spread.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

async function turnPage(step) {
  const starts = spreadStarts();
  const before = currentSpreadIndex(starts);
  const target = starts[before + step];
  if (target === undefined || reader.matches('.reader-opening, .reader-closing')) return;
  if (spread.querySelector('.reader-turn')) return;

  const narrowView = narrow.matches;
  const current = starts[before] + (step > 0 && !narrowView ? 1 : 0);
  const facing = target + (step < 0 ? 1 : 0);
  const direction = step > 0 ? 'next' : 'previous';
  const shouldTurn = !reduceMotion.matches && typeof Element.prototype.animate === 'function';
  const front = shouldTurn ? copyLeaf(leaves[current]) : null;
  const back = shouldTurn && !narrowView ? copyLeaf(leaves[facing]) : null;

  page = Math.max(1, target);
  renderSpread();
  scrollToCurrentPage();
  if (!shouldTurn) return;
  const layer = sheet(front, back, direction);
  const angle = (narrowView ? 96 : 180) * -step;
  await animate(layer, [
    { transform: 'rotateY(0deg)' },
    { transform: 'rotateY(' + angle + 'deg)' },
  ], { duration: narrowView ? 290 : turnDuration, easing: ease, fill: 'forwards' });
  layer.remove();
}

async function moveCover(source, target, returning = false) {
  const cover = coverImage();
  cover.className = 'reader-travel-cover';
  cover.dataset.movingCopy = '';
  const ratio = shelfCover.width / shelfCover.height;
  const width = Math.min(target.width, target.height * ratio);
  const height = width / ratio;
  const top = target.top + (target.height - height) / 2;
  cover.style.width = width + 'px';
  cover.style.height = height + 'px';
  dialog.append(cover);
  const shelfColour = getComputedStyle(shelfCover).filter;
  const scaleX = source.width / width;
  const scaleY = source.height / height;
  const from = 'translate(' + source.left + 'px,' + source.top + 'px) scale('
    + scaleX + ',' + scaleY + ')';
  const midX = (source.left + target.left) * .5;
  const midY = (source.top + top) * .5 - 24;
  const mid = 'translate(' + midX + 'px,' + midY + 'px) scale('
    + (.58 + scaleX * .42) + ',' + (.58 + scaleY * .42) + ') rotate(-2deg)';
  const to = 'translate(' + target.left + 'px,' + top + 'px)';
  const frames = [
    { transform: from, filter: shelfColour },
    { transform: mid, filter: 'brightness(.93) saturate(.94) sepia(.08)' },
    { transform: to, filter: 'brightness(1) saturate(1) sepia(0)' },
  ];
  const completed = await animate(cover, returning ? frames.reverse() : frames,
    { duration: returning ? 340 : 420, easing: ease, fill: 'forwards' });
  cover.remove();
  return completed;
}

async function openReader(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
      event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  if (dialog.open) return;

  opener = event.currentTarget;
  returnScroll = scrollY;
  delete hero.dataset.entrance;
  const source = shelfCover.getBoundingClientRect();
  const travel = !hero.hasAttribute('data-library-loading') &&
    source.top > 0 && source.bottom <= innerHeight && source.width > 0;
  const shouldAnimate = !reduceMotion.matches && typeof Element.prototype.animate === 'function';
  const currentRevision = ++revision;
  inlineSlot.style.minHeight = inlineSlot.offsetHeight + 'px';
  dialogSlot.append(reader);
  page = 1;
  renderSpread();
  document.body.style.setProperty('--novel-scroll-offset', -returnScroll + 'px');
  document.body.classList.add('novel-scroll-locked');
  dialog.showModal();
  dialog.scrollTop = 0;
  closeButton.focus({ preventScroll: true });
  if (!shouldAnimate) return;

  reader.classList.add('reader-opening');
  if (travel) {
    reader.dataset.travelling = '';
    dialog.dataset.sceneShift = 'enter';
    const arrived = await moveCover(source, leaves[1].getBoundingClientRect());
    if (!arrived || currentRevision !== revision) return;
    delete reader.dataset.travelling;
    delete dialog.dataset.sceneShift;
  }

  const front = coverImage();
  front.className = 'reader-cover-leaf';
  const back = narrow.matches ? null : copyLeaf(leaves[0]);
  const layer = sheet(front, back, 'next');
  await animate(layer, [
    { transform: 'rotateY(0deg)' },
    { transform: narrow.matches ? 'rotateY(-96deg)' : 'rotateY(-180deg)' },
  ], { duration: 400, easing: ease, fill: 'forwards' });
  layer.remove();
  if (currentRevision === revision) reader.classList.remove('reader-opening');
}

async function closeReader() {
  if (reader.classList.contains('reader-closing')) return;
  if (narrow.matches || reduceMotion.matches || dialog.scrollTop > 100 ||
      reader.classList.contains('reader-opening') || typeof Element.prototype.animate !== 'function') {
    dialog.close();
    return;
  }

  cancelEffects();
  const currentRevision = revision;
  reader.classList.add('reader-closing');
  const [left, right] = leaves.filter(leaf => !leaf.hidden);
  const front = coverImage();
  front.className = 'reader-cover-leaf';
  const layer = sheet(front, copyLeaf(left), 'next');
  const closed = await animate(layer, [
    { transform: 'rotateY(-180deg)' },
    { transform: 'rotateY(0deg)' },
  ], { duration: 300, easing: ease, fill: 'forwards' });
  if (!closed || currentRevision !== revision || !dialog.open) return;

  const shelf = shelfCover.getBoundingClientRect();
  if (shelf.top > 0 && shelf.bottom <= innerHeight) {
    reader.dataset.travelling = '';
    dialog.dataset.sceneShift = 'return';
    const returned = moveCover(shelf, right.getBoundingClientRect(), true);
    layer.remove();
    await returned;
  } else {
    layer.remove();
  }
  if (currentRevision === revision && dialog.open) dialog.close();
}

controls.hidden = false;
reader.dataset.enhanced = '';
renderSpread();

previous.addEventListener('click', () => turnPage(-1));
next.addEventListener('click', () => turnPage(1));
function readWithArrowKeys(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
      document.getSelection()?.type === 'Range') return;
  const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (!direction) return;
  event.preventDefault();
  turnPage(direction);
}
reader.addEventListener('keydown', readWithArrowKeys);
dialog.addEventListener('keydown', readWithArrowKeys);

for (const link of document.querySelectorAll('[data-open-reader]')) {
  if (typeof dialog.showModal === 'function') link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', openReader);
}

let touchStart = null;
spread.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) {
    touchStart = null;
    return;
  }
  touchStart = event.changedTouches[0];
}, { passive: true });
spread.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
spread.addEventListener('touchend', event => {
  const point = event.changedTouches[0];
  if (!touchStart || point.identifier !== touchStart.identifier) return;
  const dx = point.clientX - touchStart.clientX;
  const dy = point.clientY - touchStart.clientY;
  touchStart = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.7 &&
      document.getSelection()?.type !== 'Range') turnPage(dx < 0 ? 1 : -1);
}, { passive: true });

closeButton.addEventListener('click', closeReader);
dialog.addEventListener('close', () => {
  cancelEffects();
  inlineSlot.append(reader);
  inlineSlot.style.removeProperty('min-height');
  document.body.classList.remove('novel-scroll-locked');
  document.body.style.removeProperty('--novel-scroll-offset');
  scrollTo({ top: returnScroll, behavior: 'instant' });
  opener?.focus({ preventScroll: true });
  opener = null;
});

function updateReaderMotion() {
  const closing = reader.classList.contains('reader-closing');
  cancelEffects();
  if (closing) dialog.close();
}

narrow.addEventListener('change', () => {
  updateReaderMotion();
  renderSpread();
});
reduceMotion.addEventListener('change', () => {
  if (reduceMotion.matches) updateReaderMotion();
});
