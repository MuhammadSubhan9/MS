import {
  action, arrow, chronology, escape, formatDate, hasDetail, image, paragraphs, projectEntry,
  publicationDate, safeLink, section,
} from './components.mjs';
import { findNovel, novelContent, novelPath, oldNovelPath } from './novel.mjs';
import { contactPage } from './contact.mjs';

function nowPage(content) {
  const [date, ...lines] = content.trim().split(/\r?\n/);
  const copy = lines.join('\n').trim().split(/\n\s*\n/).filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !copy.length) {
    throw new Error('Start content/now.txt with a YYYY-MM-DD date followed by at least one paragraph.');
  }
  return `<article class="now-page">
    <header class="now-heading">
      <h1>Now</h1>
      <p class="meta">Last updated <time datetime="${date}">${formatDate(date)}</time></p>
    </header>
    <div class="reading now-copy">${paragraphs(copy)}</div>
  </article>`;
}

function homePage(data, { hasAbout, hasContact, selected }) {
  const { education, projects, portrait, writing, contact } = data;
  const portraitMarkup = image(portrait, {
    eager: true,
    sizes: '(max-width: 700px) min(100vw - 1.5rem, 336px), 352px',
  });
  const currentEducation = education.find(item => item.current) || education[0];
  const profile = hasAbout ? `<section class="home-section home-profile container" id="background" aria-labelledby="profile-title" tabindex="-1">
    <div class="home-profile-story" data-reveal>
      <p class="eyebrow">Background</p>
      <h2 id="profile-title">${escape(data.homeProfileTitle || 'About me')}</h2>
      <div class="reading">${paragraphs(data.homeProfile || data.biography.slice(0, 1))}</div>
      ${action('/about/', 'More about me')}
    </div>
    ${currentEducation || data.currentFocus || data.futureDirection ? `<dl class="home-facts" data-reveal>
      ${currentEducation ? `<div>
        <dt>Education</dt>
        <dd><p class="home-fact-title">${escape(currentEducation.title)}</p>
        ${currentEducation.institution ? `<p>${escape(currentEducation.institution)}</p>` : ''}
        ${currentEducation.description ? `<p>${escape(currentEducation.description)}</p>` : ''}
        ${currentEducation.date ? `<p class="meta">${escape(currentEducation.date)}</p>` : ''}</dd>
      </div>` : data.currentFocus ? `<div><dt>Currently</dt><dd>${escape(data.currentFocus)}</dd></div>` : ''}
      ${data.futureDirection ? `<div><dt>Looking ahead</dt><dd>${escape(data.futureDirection)}</dd></div>` : ''}
    </dl>` : ''}
  </section>` : '';
  const featuredWork = selected[0] || projects[0];
  const work = featuredWork ? `<section class="home-section home-work" id="selected-work" aria-labelledby="home-work-title" tabindex="-1">
    <div class="container">
      <div class="home-section-heading" data-reveal>
        <h2 id="home-work-title">Selected work &amp; experience</h2>
        ${action('/work/', 'See all work')}
      </div>
      ${projectEntry({ ...featuredWork, image: featuredWork.homeImage ?? featuredWork.image }, { heading: 'h3', featured: true, actionLabel: 'Read more' })}
      ${selected.length > 1 ? `<div class="home-work-list">
        ${selected.slice(1).map(item => projectEntry(item, { heading: 'h3', showImage: false, actionLabel: 'Read more' })).join('')}
      </div>` : ''}
    </div>
  </section>` : '';
  const book = writing.find(item => item.selected) || writing[0];
  const featuredNovel = findNovel(writing);
  const bookRoute = featuredNovel ? novelPath : book && hasDetail(book) ? safeLink(`/writing/${book.slug}/`) : '';
  const writingFeature = book ? `<section class="home-section home-writing${featuredNovel ? ' home-writing-novel' : ''}" id="writing" aria-labelledby="home-writing-title" tabindex="-1">
    <div class="container home-writing-layout"${bookRoute && !featuredNovel ? ` data-motion-route="${bookRoute}"` : ''}>
      <div class="home-writing-copy" data-reveal>
        <p class="eyebrow">Writing</p>
        <h2 id="home-writing-title">${escape(book.title)}</h2>
        ${book.category ? `<p class="meta">${escape(book.category)}</p>` : ''}
        ${featuredNovel && data.writingPractice ? `<p class="home-writing-practice">${escape(data.writingPractice)}</p>` : ''}
        <p class="home-writing-hook">${escape(book.description)}</p>
        ${paragraphs(book.body?.slice(0, 1))}
        ${action(bookRoute || '/writing/', featuredNovel ? 'Explore the novel' : 'Read the teaser', 'button-link')}
      </div>
      ${image(book.image, {
        sizes: '(max-width: 700px) 210px, 280px',
        link: { href: bookRoute || '/writing/', label: `Open ${book.title}` },
      })}
    </div>
  </section>` : '';
  const nextSection = profile ? '#background' : work ? '#selected-work' : writingFeature ? '#writing' : '';
  const contactFeature = hasContact ? `<section class="home-section home-contact container" aria-labelledby="home-contact-title">
    <div data-reveal>
      <h2 id="home-contact-title">Get in touch</h2>
      ${contact.introduction ? `<p>${escape(contact.introduction)}</p>` : ''}
    </div>
    <div class="home-contact-links" data-reveal>
      ${contact.email ? `<a class="button-link" href="mailto:${escape(contact.email)}">${escape(contact.email)}${arrow}</a>` : ''}
      ${action('/contact/', 'Contact details')}
    </div>
  </section>` : '';
  const actions = [
    hasAbout ? action('/about/', 'About me', 'button-link') : '',
    nextSection ? action(nextSection, 'Explore the portfolio', 'button-link button-outline') : '',
    !nextSection && hasContact ? action('/contact/', 'Get in touch') : '',
  ].join('');
  const nameLines = data.name.trim().split(/\s+(?=\S+$)/);
  return `
    <section class="home-opening" aria-labelledby="home-title">
    <div class="container home-masthead${portraitMarkup ? ' home-masthead-portrait' : ''}">
      <div class="home-intro">
        <div class="home-title">
          ${data.descriptor ? `<p class="eyebrow">${escape(data.descriptor)}</p>` : ''}
          <h1 id="home-title">${nameLines.map(line => `<span class="name-line"><span>${escape(line)}</span></span>`).join(' ')}</h1>
        </div>
        <div class="lead">${paragraphs(data.introduction)}</div>
        ${actions ? `<nav class="text-actions" aria-label="Explore the portfolio">${actions}</nav>` : ''}
      </div>
      ${portraitMarkup}
    </div>
    </section>
    ${profile}${work}${writingFeature}${contactFeature}
  `;
}

function aboutPage(data, background) {
  const portrait = image(data.aboutPortrait || data.portrait, { eager: true, sizes: '(max-width: 700px) 92vw, 55vw' });
  return `<div class="profile-page">
    <div class="about-opening${portrait ? ' about-opening-with-portrait' : ''}">
      <header class="about-hero container${portrait ? ' about-hero-with-portrait' : ''}">
        <div class="about-hero-copy">
          <div class="about-hero-heading">
            <p class="eyebrow">About</p>
            <h1>${escape(data.name)}</h1>
          </div>
          ${data.biography.length ? `<div class="about-biography">${paragraphs(data.biography)}</div>` : ''}
        </div>
        ${portrait}
      </header>
    </div>
    ${background.length ? `<div class="container"><nav class="about-jumps" aria-label="On this page"><ul>
      ${background.map(([id, title]) => `<li>${action('#' + id, title)}</li>`).join('')}
    </ul></nav>
    <div class="about-records">${background.map(([id, title, body]) => section(id, title, body)).join('')}</div></div>` : ''}
  </div>`;
}

function languageList(languages = [], scoresUpdated) {
  if (!languages.length) return '';
  const hasScores = languages.some(language => Number.isInteger(language.duolingoScore));
  return `<dl class="language-list">${languages.map(language => `<div>
    <dt>${escape(language.name)}</dt>
    <dd>${escape(language.description)}
      ${Number.isInteger(language.duolingoScore) ? `<span class="language-score">Duolingo score <strong>${language.duolingoScore}</strong></span>` : ''}
      ${language.certificateUrl ? action(language.certificateUrl, 'View credential', 'action-link', `for ${language.name}`) : ''}
    </dd>
  </div>`).join('')}</dl>
  ${hasScores && scoresUpdated ? `<p class="meta language-score-source">Duolingo scores shared on LinkedIn, updated ${publicationDate(scoresUpdated)}.</p>` : ''}`;
}

function eventMark(item) {
  return item.eventLogo ? `<div class="work-event-mark" aria-hidden="true">${image(item.eventLogo)}</div>` : '';
}

function workEvent(item) {
  if (!hasDetail(item)) return projectEntry(item, { heading: 'h3', actionLabel: 'Read more' });
  const titleId = `event-${item.slug}`;
  const destination = safeLink(`/work/${item.slug}/`);
  const metadata = [escape(item.category), publicationDate(item.date)].filter(Boolean).join(' · ');
  return `<article class="work-event" data-event="${escape(item.slug)}" data-motion-route="${destination}">
    <a class="work-event-link" href="${destination}" aria-labelledby="${titleId}">
      <div class="work-event-copy">
        ${metadata ? `<p class="meta">${metadata}</p>` : ''}
        <h3 id="${titleId}">${escape(item.title)}</h3>
        <p class="work-event-description">${escape(item.description)}</p>
        <span class="work-event-action">Read event summary<span class="arrow" aria-hidden="true"></span></span>
      </div>
      ${eventMark(item)}
    </a>
  </article>`;
}

function workIndex(items, introduction) {
  const feature = items.find(item => item.selected && item.image)
    || items.find(item => item.selected)
    || items[0];
  const remaining = items.filter(item => item !== feature);
  const events = remaining.filter(item => item.kind === 'event' || (!item.selected && !hasDetail(item)));
  const experiences = remaining.filter(item => !events.includes(item));
  const sections = [
    ['experiences', 'Selected experiences', experiences],
    ['events', 'Events & conferences', events],
  ].filter(([, , entries]) => entries.length);

  return `<div class="work-page">
    <header class="work-heading">
      <div class="work-heading-copy">
        <h1>Work &amp; experience</h1>
        ${introduction ? `<p class="lead">${escape(introduction)}</p>` : ''}
      </div>
      ${sections.length ? `<nav class="work-jumps" aria-label="On this page">${sections.map(([id, title]) =>
        action('#' + id, title)).join('')}</nav>` : ''}
    </header>
    <div class="work-lead"${feature.slug === 'unesco-ai-forum' ? ' id="event-unesco"' : ''}>
      ${projectEntry(feature, { featured: true, eagerImage: true, actionLabel: 'Read more' })}
    </div>
    ${sections.map(([id, title, entries]) => `<section class="work-section work-${id}" id="${id}" aria-labelledby="work-${id}-title" tabindex="-1">
      <h2 id="work-${id}-title">${escape(title)}</h2>
      <div class="work-entries">${entries.map(item => id === 'events' ? workEvent(item) : projectEntry(item, {
        heading: 'h3', featured: Boolean(item.image), showSummary: true, actionLabel: 'Read more',
      })).join('')}</div>
    </section>`).join('')}
  </div>`;
}

function collectionPages(add, data, items, path, label) {
  if (!items.length) return;
  const slugs = new Set();
  for (const item of items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) {
      throw new Error('Invalid or duplicate content slug');
    }
    slugs.add(item.slug);
  }
  const isWriting = path === 'writing';
  const detailed = items.filter(hasDetail);
  for (const [index, item] of detailed.entries()) {
    const metadata = [escape(item.category), publicationDate(item.date)].filter(Boolean).join(' · ');
    const hasCover = isWriting && item.image && item.image.height > item.image.width;
    const isWorkEvent = !isWriting && item.kind === 'event';
    const featuredReport = isWorkEvent && item.selected;
    const mark = isWorkEvent ? eventMark(item) : '';
    const sources = item.sources?.length
      ? `<section class="article-section"><h2>Sources</h2><ul>${item.sources.map(source =>
        `<li><a href="${safeLink(source.url)}">${escape(source.label)}</a></li>`).join('')}</ul></section>` : '';
    const parts = (item.sections || []).map(part => `<section class="article-section"><h2>${escape(part.title)}</h2>${paragraphs(part.paragraphs)}</section>`).join('');
    const neighbours = isWriting ? [
      [detailed[index - 1], 'Previous article'],
      [detailed[index + 1], 'Next article'],
    ].filter(([entry]) => entry) : [];
    add(`/${path}/${item.slug}/`, item.title, item.description, `
      <p class="breadcrumb"><a href="/${path}/${isWorkEvent && !featuredReport ? '#events' : ''}"><span class="arrow arrow-left" aria-hidden="true"></span><span>${isWriting ? 'All writing' : isWorkEvent && !featuredReport ? 'All events' : 'All work'}</span></a></p>
      <article class="detail${hasCover ? ' detail-with-cover' : ''}${isWriting ? '' : ' work-detail'}${featuredReport ? ' work-feature-report' : ''}" data-motion-route="/${path}/${item.slug}/">
        <header class="page-heading article-heading${mark ? ' work-event-heading' : ''}"${mark ? ` data-event="${escape(item.slug)}"` : ''}>
          <div>
            ${metadata ? `<p class="eyebrow">${metadata}</p>` : ''}
            <h1>${escape(item.title)}</h1><p class="lead">${escape(item.description)}</p>
          </div>
          ${mark}
        </header>
        ${image(item.image, { eager: true, sizes: hasCover ? '(max-width: 650px) 190px, 240px' : '(max-width: 700px) calc(100vw - 40px), 780px' })}
        <div class="reading article-body">${paragraphs(item.body)}
          ${parts && !isWriting ? `<div class="work-detail-parts">${parts}</div>` : parts}
          ${item.url ? action(item.url, 'View supporting material') : ''}${sources}
        </div>
        ${neighbours.length ? `<nav class="article-nav" aria-label="More writing">${neighbours.map(([entry, direction]) =>
          `<div><span class="eyebrow">${direction}</span>${action(`/${path}/${entry.slug}/`, entry.title)}</div>`).join('')}</nav>` : ''}
      </article>`, isWriting ? 'article' : 'website');
  }

  const introduction = data[`${path}Introduction`];
  const description = data.seo[path] || `${label} by ${data.name}.`;
  if (!isWriting) {
    add('/work/', label, description, workIndex(items, introduction));
    return;
  }

  const featured = items.find(item => item.selected);
  const remaining = items.filter(item => item !== featured);
  add(`/${path}/`, label, description, `
    <header class="page-heading index-heading"><h1>${label}</h1>
      ${introduction ? `<p class="lead">${escape(introduction)}</p>` : ''}
    </header>
    ${featured ? projectEntry(featured, { collection: path, featured: true }) : ''}
    ${remaining.length ? `<div class="project-index${isWriting ? ' writing-index' : ''}">
      ${remaining.map(item => projectEntry(item, { collection: path })).join('')}
    </div>` : ''}
  `);
}

export function createPages(data) {
  const pages = [];
  function add(path, label, description, body, type = 'website') {
    pages.push({ path, label, description, body, type });
  }
  const background = [
    ['education', 'Education', chronology(data.education)],
    ['experience', 'Experience', chronology(data.experience)],
    ['languages', 'Languages', languageList(data.languages, data.duolingoScoresUpdated)],
    ['courses', 'Independent courses', chronology(data.courses || [])],
    ['achievements', 'Achievements', chronology(data.achievements)],
    ['interests', 'Interests', paragraphs(data.interests)],
  ].filter(([, , body]) => body);
  const hasAbout = data.biography.length || background.length;
  const contact = data.contact;
  const hasContact = contact.email || contact.phone || contact.links.length || contact.cv || contact.formEndpoint;
  const selected = data.projects.filter(item => item.selected);

  add('/', 'Home', data.seo.description, homePage(data, { hasAbout, hasContact, selected }));
  if (hasAbout) {
    add('/about/', 'About', data.seo.about || `Background, education and interests of ${data.name}.`, aboutPage(data, background));
  }
  collectionPages(add, data, data.projects, 'work', 'Work');
  const novel = findNovel(data.writing);
  if (novel) {
    pages.push({
      path: novelPath, label: novel.title, description: novel.description,
      body: novelContent(novel, data.name), layout: 'novel', cover: novel.image.src,
    }, { path: oldNovelPath, label: novel.title, body: '', redirect: novelPath });
  } else {
    collectionPages(add, data, data.writing, 'writing', 'Writing');
  }
  if (hasContact) {
    add('/contact/', 'Contact', data.seo.contact || `Contact ${data.name}.`, contactPage(contact, data.name));
  }
  if (data.now) {
    add('/now/', 'Now', `What ${data.name} is doing now.`, nowPage(data.now));
  }
  return pages;
}
