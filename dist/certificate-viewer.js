const dialog = document.querySelector('.certificate-dialog');

if (typeof dialog?.showModal === 'function') {
  const preview = dialog.querySelector('.certificate-dialog-content');
  const zoomIn = dialog.querySelector('[data-certificate-zoom-in]');
  const zoomOut = dialog.querySelector('[data-certificate-zoom-out]');
  const level = dialog.querySelector('[data-certificate-level]');
  const maxScale = 4;
  const pointers = new Map();
  let viewport;
  let image;
  let scale = 1;
  let x = 0;
  let y = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function setView(nextScale, nextX, nextY) {
    const { clientWidth: width, clientHeight: height } = viewport;
    const fit = image.naturalWidth ? Math.min(width / image.naturalWidth, height / image.naturalHeight) : 0;
    const edgeX = Math.max(0, (image.naturalWidth * fit * nextScale - width) / 2);
    const edgeY = Math.max(0, (image.naturalHeight * fit * nextScale - height) / 2);
    scale = nextScale;
    x = clamp(nextX, -edgeX, edgeX);
    y = clamp(nextY, -edgeY, edgeY);
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    viewport.toggleAttribute('data-zoomed', scale > 1);
    const text = Math.round(scale * 100) + '%';
    if (level.value !== text) level.value = text;
    zoomOut.setAttribute('aria-disabled', String(scale === 1));
    zoomIn.setAttribute('aria-disabled', String(scale === maxScale));
  }

  function zoomAt(amount, before, after = before) {
    const bounds = viewport.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const next = clamp(amount, 1, maxScale);
    const ratio = next / scale;
    const start = before || { x: centerX, y: centerY };
    const end = after || start;
    setView(next,
      end.x - centerX - (start.x - centerX - x) * ratio,
      end.y - centerY - (start.y - centerY - y) * ratio);
  }

  function step(direction, point) {
    zoomAt(Math.round((scale + direction * .5) * 100) / 100, point);
  }

  function gesture() {
    const [first, second] = pointers.values();
    if (!second) return { center: first, distance: 0 };
    return {
      center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      distance: Math.hypot(first.x - second.x, first.y - second.y),
    };
  }

  function bindViewport() {
    const surface = viewport;
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Certificate image. Use plus and minus to zoom, and arrow keys to pan.');
    image.draggable = false;
    image.addEventListener('load', () => {
      if (surface === viewport && dialog.open) setView(scale, x, y);
    }, { once: true });
    viewport.addEventListener('pointerdown', event => {
      if (event.button !== 0 || pointers.size >= 2) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      viewport.setPointerCapture(event.pointerId);
      viewport.setAttribute('data-panning', '');
    });
    viewport.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      const before = gesture();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const after = gesture();
      const next = before.distance > 4 ? scale * after.distance / before.distance : scale;
      if (scale > 1 || next > 1) zoomAt(next, before.center, after.center);
    });
    function release(event) {
      if (surface !== viewport) return;
      pointers.delete(event.pointerId);
      if (!pointers.size) viewport.removeAttribute('data-panning');
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(event, release);
    viewport.addEventListener('dblclick', event => {
      zoomAt(scale > 1 ? 1 : 2, { x: event.clientX, y: event.clientY });
    });
    viewport.addEventListener('wheel', event => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      zoomAt(scale * Math.exp(-event.deltaY / 220), { x: event.clientX, y: event.clientY });
    }, { passive: false });
    viewport.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      switch (event.key) {
        case '+': case '=': step(1); break;
        case '-': step(-1); break;
        case '0': setView(1, 0, 0); break;
        case 'ArrowLeft': setView(scale, x + 35, y); break;
        case 'ArrowRight': setView(scale, x - 35, y); break;
        case 'ArrowUp': setView(scale, x, y + 35); break;
        case 'ArrowDown': setView(scale, x, y - 35); break;
        default: return;
      }
      event.preventDefault();
    });
  }

  const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (dialog.open) setView(scale, x, y);
  }) : null;
  for (const button of document.querySelectorAll('.entry-preview')) {
    const template = button.nextElementSibling;
    button.hidden = false;
    button.addEventListener('click', () => {
      if (dialog.open) return;
      preview.replaceChildren(template.content.cloneNode(true));
      viewport = preview.querySelector('.media-window');
      image = viewport.querySelector('img');
      viewport.toggleAttribute('data-wide-excerpt', Number(image.getAttribute('width')) > 2.7 * Number(image.getAttribute('height')));
      pointers.clear();
      bindViewport();
      dialog.showModal();
      dialog.scrollTop = 0;
      setView(1, 0, 0);
      resized?.observe(viewport);
    });
  }
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    resized?.disconnect();
    pointers.clear();
  });
  zoomIn.addEventListener('click', () => step(1));
  zoomOut.addEventListener('click', () => step(-1));
  dialog.querySelector('[data-certificate-fit]').addEventListener('click', () => setView(1, 0, 0));
}
