export function escape(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}

export function safeLink(value) {
  if (typeof value !== 'string' || /[\s\\\u0000-\u001f]/.test(value)) {
    throw new Error(`Unsupported URL: ${value}`);
  }
  if (value.startsWith('/') && !value.startsWith('//')) return escape(value);
  if (!URL.canParse(value)) throw new Error(`Unsupported URL: ${value}`);
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`Unsupported URL: ${value}`);
  }
  return escape(value);
}

export const paragraphs = (items = [], renderText = escape) => items.map(item => `<p>${renderText(item)}</p>`).join('');

export function icon(name, className = '') {
  return `<svg class="site-icon${className ? ` ${escape(className)}` : ''}" width="16" height="16" aria-hidden="true" focusable="false"><use href="/icons/phosphor-regular.svg#${escape(name)}"></use></svg>`;
}

export function toggleIcon(closed, open, className = '') {
  return `<span class="toggle-icon${className ? ` ${escape(className)}` : ''}" aria-hidden="true">${icon(closed, 'icon-closed')}${icon(open, 'icon-open')}</span>`;
}

export const pageIcons = {
  '/': 'house-line', '/about/': 'user-circle', '/journey/': 'path',
  '/work/': 'briefcase', '/writing/': 'pen-nib', '/contact/': 'envelope-simple',
};

export const headerAssets = `<link rel="stylesheet" href="/header-surface.css">
  <script src="/header-surface.js" defer blocking="render"></script>`;

export const sectionIcons = {
  education: 'graduation-cap', experience: 'briefcase', languages: 'translate',
  capabilities: 'list-checks', courses: 'notebook', achievements: 'trophy', interests: 'compass',
  evidence: 'tree-structure', experiences: 'briefcase', events: 'calendar-blank', sources: 'books',
  milestones: 'clock-counter-clockwise', 'in-progress': 'hourglass-simple', 'looking-ahead': 'signpost',
};

const definitions = {
  igcse: 'International General Certificate of Secondary Education. A secondary school qualification typically taken before A Levels.',
  ial: 'International A Level. An advanced school qualification commonly taken before university.',
  cpd: 'Continuing professional development. Activities that help people keep developing knowledge and skills in their field.',
  'agentic commerce': 'Shopping in which software acts on someone’s behalf, such as finding a product or placing an order within agreed limits.',
  'private equity': 'Investment in privately held companies, often with the aim of growing or restructuring them over several years.',
  airworthiness: 'The condition of an aircraft being safe and fit to fly under applicable standards.',
};

export function glossary(text) {
  const terms = /\b(IGCSEs?|IAL|International A Levels?|CPD|continuing professional development|agentic commerce|private equity|airworthiness)\b/gi;
  return String(text ?? '').split(terms).map((part, index) => {
    if (index % 2 === 0) return escape(part);
    const key = part.toLowerCase()
      .replace(/^igcses$/, 'igcse')
      .replace(/^international a levels?$/, 'ial')
      .replace(/^continuing professional development$/, 'cpd');
    return `<abbr data-glossary title="${escape(definitions[key])}">${escape(part)}</abbr>`;
  }).join('');
}

export function copySectionButton(id, title) {
  return `<button class="section-copy" type="button" data-copy-section="${escape(id)}" aria-label="Copy link to ${escape(title)}" hidden>
    ${icon('link-simple')}<span data-section-copy-label>Copy link</span>
  </button>`;
}

export function sharedHeading(id, title, { level = 2, headingId = `${id}-title`, renderText = escape } = {}) {
  const symbol = sectionIcons[id];
  const label = renderText(title);
  return `<div class="share-heading"><h${level} id="${escape(headingId)}"${symbol ? ' class="icon-heading"' : ''}>${symbol ? `${icon(symbol)}<span>${label}</span>` : label}</h${level}>${copySectionButton(id, title)}</div>`;
}

export function action(href, label, className = 'action-link', context = '', symbol = '') {
  const anchor = /^#[a-z][a-z0-9-]*$/.test(href);
  const destination = anchor ? href : safeLink(href);
  const mark = symbol ? icon(symbol) : href.startsWith('https:') ? icon('arrow-up-right', 'arrow arrow-external')
    : anchor ? icon('arrow-down', 'arrow arrow-down') : icon('arrow-right', 'arrow');
  const accessibleContext = context ? `<span class="visually-hidden"> ${escape(context)}</span>` : '';
  const text = `<span class="link-label">${escape(label)}${accessibleContext}</span>`;
  return `<a class="${className}" href="${destination}">${symbol ? mark + text : text + mark}</a>`;
}

export function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid publication date: ${value}`);
  }
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export function section(id, title, body) {
  return body ? `<section class="section" id="${id}" aria-labelledby="${id}-title" tabindex="-1" data-share-section>
    ${sharedHeading(id, title)}<div class="section-content">${body}</div>
  </section>` : '';
}

export function image(asset, { eager = false, sizes = '(max-width: 700px) calc(100vw - 40px), 720px', link } = {}) {
  if (!asset) return '';
  if (!asset.alt?.trim() || !Number.isInteger(asset.width) || asset.width < 1 ||
      !Number.isInteger(asset.height) || asset.height < 1) {
    throw new Error('Images require descriptive alt text and positive integer dimensions');
  }
  const sources = asset.sources?.map(source => {
    if (!Number.isInteger(source.width) || source.width < 1 || source.src.includes(',')) {
      throw new Error('Responsive images require a valid URL and positive integer width');
    }
    return `${safeLink(source.src)} ${source.width}w`;
  }).join(', ');
  const photo = `<div class="media-window"><img src="${safeLink(asset.src)}" alt="${escape(asset.alt)}"
    width="${asset.width}" height="${asset.height}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}
    ${sources ? `srcset="${sources}" sizes="${sizes}"` : ''}></div>`;
  return `<figure>${link ? `<a class="media-link" href="${safeLink(link.href)}" aria-label="${escape(link.label)}" tabindex="-1">${photo}</a>` : photo}
    ${asset.caption ? `<figcaption>${escape(asset.caption)}</figcaption>` : ''}</figure>`;
}

export function chronology(items, { detailLabel, renderText = escape } = {}) {
  return items.map(item => `<article class="entry"${item.id ? ` id="${escape(item.id)}" data-share-section tabindex="-1"` : ''}>
    <p class="meta entry-date">${escape(item.date)}</p>
    <div><h3>${renderText(item.title)}</h3>
      ${item.role || item.institution || item.status ? `<p class="entry-context">${[item.role, item.institution, item.status].filter(Boolean).map(escape).join(' · ')}</p>` : ''}
      ${item.description ? `<p>${renderText(item.description)}</p>` : ''}
      ${item.subjects?.length ? `<ul class="entry-subjects" aria-label="Subjects">${item.subjects.map(subject => `<li>${escape(subject)}</li>`).join('')}</ul>` : ''}
      ${item.outcome ? `<p>${renderText(item.outcome)}</p>` : ''}
      ${item.details?.length ? `<details${detailLabel ? ' class="entry-details" data-open-for-section-link' : ''}><summary>${escape(detailLabel || 'Details')}<span class="visually-hidden"> for ${escape(item.title)}</span></summary><div class="entry-detail-copy">${paragraphs(item.details, renderText)}</div></details>` : ''}
      ${item.certificateUrl || item.id ? `<div class="entry-actions">
        ${item.certificateUrl ? action(item.certificateUrl, 'View certificate', 'action-link entry-certificate', `for ${item.title}`, 'certificate') : ''}
        ${item.id ? copySectionButton(item.id, item.title) : ''}
      </div>` : ''}
    </div>
  </article>`).join('');
}

export const hasDetail = item => Boolean(item.body?.length || item.sections?.length);

export function publicationDate(value) {
  const label = escape(formatDate(value));
  return /^\d{4}(?:-\d{2}-\d{2})?$/.test(value || '') ? `<time datetime="${value}">${label}</time>` : label;
}

export function projectEntry(item, {
  collection = 'work', heading = 'h2', featured = false, showImage = true, eagerImage = false, showSummary = false, actionLabel,
} = {}) {
  const destination = hasDetail(item) ? `/${collection}/${item.slug}/` : item.url;
  const motionRoute = hasDetail(item) ? ` data-motion-route="${safeLink(destination)}"` : '';
  const metadata = [escape(item.category), publicationDate(item.date)].filter(Boolean).join(' · ');
  const projectAction = destination && actionLabel
    ? action(destination, actionLabel, featured ? 'button-link project-action' : 'action-link project-action', `about ${item.title}`)
    : '';
  const title = destination && !projectAction ? action(destination, item.title, 'project-link') : escape(item.title);
  const summary = showSummary && item.workSummary ? `<p class="project-summary">${escape(item.workSummary)}</p>` : '';
  const isCover = collection === 'writing' && item.image && item.image.height > item.image.width;
  const sizes = isCover ? '(max-width: 700px) 190px, 230px' : '(max-width: 700px) 90vw, (max-width: 1200px) 48vw, 560px';
  const imageMarkup = showImage ? image(item.image, {
    eager: eagerImage,
    link: destination ? { href: destination, label: `Open ${item.title}` } : undefined,
    sizes: featured ? sizes : undefined,
  }) : '';
  if (featured && imageMarkup) {
    return `<article class="project-entry featured-project featured-with-image${isCover ? ' featured-with-cover' : ''}"${motionRoute}>
      <div class="feature-copy">
        ${metadata ? `<p class="meta">${metadata}</p>` : ''}
        <${heading}>${title}</${heading}><p>${escape(item.description)}</p>
        ${isCover && item.body?.length ? `<p>${escape(item.body[0])}</p>` : summary}
        ${projectAction}
      </div>
      ${imageMarkup}
    </article>`;
  }
  return `<article class="project-entry${featured ? ' featured-project' : ''}"${motionRoute}>
    ${metadata ? `<p class="meta">${metadata}</p>` : ''}
    <div><${heading}>${title}</${heading}><p>${escape(item.description)}</p>
      ${summary}
      ${imageMarkup}
      ${projectAction}
    </div>
  </article>`;
}
