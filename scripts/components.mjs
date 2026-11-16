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

export const paragraphs = (items = []) => items.map(item => `<p>${escape(item)}</p>`).join('');

export const arrow = '<span class="arrow arrow-external" aria-hidden="true"></span>';

export function action(href, label, className = 'action-link', context = '') {
  const anchor = /^#[a-z][a-z0-9-]*$/.test(href);
  const destination = anchor ? href : safeLink(href);
  const mark = href.startsWith('https:') ? arrow : `<span class="arrow${anchor ? ' arrow-down' : ''}" aria-hidden="true"></span>`;
  const accessibleContext = context ? `<span class="visually-hidden"> ${escape(context)}</span>` : '';
  return `<a class="${className}" href="${destination}"><span class="link-label">${escape(label)}${accessibleContext}</span>${mark}</a>`;
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
  return body ? `<section class="section" id="${id}" aria-labelledby="${id}-title" tabindex="-1">
    <h2 id="${id}-title">${escape(title)}</h2><div class="section-content">${body}</div>
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

export function chronology(items) {
  return items.map(item => `<article class="entry">
    <p class="meta entry-date">${escape(item.date)}</p>
    <div><h3>${escape(item.title)}</h3>
      ${item.role || item.institution || item.status ? `<p class="entry-context">${[item.role, item.institution, item.status].filter(Boolean).map(escape).join(' · ')}</p>` : ''}
      ${item.description ? `<p>${escape(item.description)}</p>` : ''}
      ${item.subjects?.length ? `<ul class="entry-subjects" aria-label="Subjects">${item.subjects.map(subject => `<li>${escape(subject)}</li>`).join('')}</ul>` : ''}
      ${item.outcome ? `<p>${escape(item.outcome)}</p>` : ''}
      ${item.certificateUrl ? action(item.certificateUrl, 'View certificate', 'action-link entry-certificate', `for ${item.title}`) : ''}
      ${item.details?.length ? `<details><summary>Details<span class="visually-hidden"> for ${escape(item.title)}</span></summary>${paragraphs(item.details)}</details>` : ''}
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
