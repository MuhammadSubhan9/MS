import {
  action, chronology, escape, glossary, hasDetail, icon, image, paragraphs, projectEntry,
  publicationDate, safeLink, section, sectionIcons, sharedHeading,
} from './components.mjs';
import { findNovel, novelContent, novelPath, oldNovelPath } from './novel.mjs';
import { contactPage } from './contact.mjs';
import { nowSection, parseNow, renderNowPreview } from './now.mjs';
import { capabilitiesCards, evidenceMap, journeyPage, portfolioRecords } from './portfolio-features.mjs';
import { searchLink } from './search-content.mjs';

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
        <dt class="icon-label">${icon('graduation-cap')}Education</dt>
        <dd><p class="home-fact-title">${escape(currentEducation.title)}</p>
        ${currentEducation.institution ? `<p>${escape(currentEducation.institution)}</p>` : ''}
        ${currentEducation.description ? `<p>${escape(currentEducation.description)}</p>` : ''}
        ${currentEducation.date ? `<p class="meta">${escape(currentEducation.date)}</p>` : ''}</dd>
      </div>` : data.currentFocus ? `<div><dt>Currently</dt><dd>${escape(data.currentFocus)}</dd></div>` : ''}
      ${data.futureDirection ? `<div><dt class="icon-label">${icon('signpost')}Looking ahead</dt><dd>${escape(data.futureDirection)}</dd></div>` : ''}
    </dl>` : ''}
  </section>` : '';
  const featuredWork = selected[0] || projects[0];
  const work = featuredWork ? `<section class="home-section home-work" id="selected-work" aria-labelledby="home-work-title" tabindex="-1" data-header-surface>
    <div class="container">
      <div class="home-section-heading" data-reveal>
        <h2 id="home-work-title">Selected experiences</h2>
        ${action('/work/', 'Browse experiences')}
      </div>
      ${projectEntry({ ...featuredWork, image: featuredWork.homeImage ?? featuredWork.image }, { heading: 'h3', featured: true, actionLabel: 'Read more' })}
      ${selected.length > 1 ? `<div class="home-work-list">
        ${selected.slice(1).map(item => projectEntry(item, { heading: 'h3', showSummary: !item.image, actionLabel: 'Read more' })).join('')}
      </div>` : ''}
    </div>
  </section>` : '';
  const book = writing.find(item => item.selected) || writing[0];
  const featuredNovel = findNovel(writing);
  const bookRoute = featuredNovel ? novelPath : book && hasDetail(book) ? safeLink(`/writing/${book.slug}/`) : '';
  const writingFeature = book ? `<section class="home-section home-writing${featuredNovel ? ' home-writing-novel' : ''}" id="writing" aria-labelledby="home-writing-title" tabindex="-1" data-header-surface="dark">
    <div class="container home-writing-layout"${bookRoute && !featuredNovel ? ` data-motion-route="${bookRoute}"` : ''}>
      <div class="home-writing-copy" data-reveal>
        <p class="eyebrow">Writing</p>
        <h2 id="home-writing-title">${escape(book.title)}</h2>
        ${book.category ? `<p class="meta">${escape(book.category)}</p>` : ''}
        ${featuredNovel && data.writingPractice ? `<p class="home-writing-practice">${escape(data.writingPractice)}</p>` : ''}
        <p class="home-writing-hook">${escape(book.description)}</p>
        ${paragraphs(book.body?.slice(0, 1))}
        ${action(bookRoute || '/writing/', featuredNovel ? 'Explore the novel' : 'Read the teaser', 'button-link', '', 'book-open-text')}
      </div>
      ${image(book.image, {
        sizes: '(max-width: 700px) 210px, 280px',
        link: { href: bookRoute || '/writing/', label: `Open ${book.title}` },
      })}
    </div>
  </section>` : '';
  const note = data.now ? parseNow(data.now) : null;
  const now = note ? nowSection(note) : '';
  const nextSection = profile ? '#background' : now ? '#now' : work ? '#selected-work' : writingFeature ? '#writing' : '';
  const contactFeature = hasContact ? `<section class="home-section home-contact container" aria-labelledby="home-contact-title">
    <div data-reveal>
      <h2 id="home-contact-title">Get in touch</h2>
      ${contact.introduction ? `<p>${escape(contact.introduction)}</p>` : ''}
    </div>
    <div class="home-contact-links" data-reveal>
      ${action('/contact/', 'Contact me', 'button-link', '', 'envelope-simple')}
    </div>
  </section>` : '';
  const actions = [
    hasAbout ? action('/about/', 'About me', 'button-link') : '',
    nextSection ? action(nextSection, 'Explore the portfolio', 'button-link button-outline') : '',
    !nextSection && hasContact ? action('/contact/', 'Get in touch') : '',
  ].join('');
  const nameLines = data.name.trim().split(/\s+(?=\S+$)/);
  return `
    <section class="home-opening" aria-labelledby="home-title" data-header-surface="opening">
    <div class="container home-masthead${portraitMarkup ? ' home-masthead-portrait' : ''}">
      <div class="home-intro">
        <div class="home-title">
          ${data.descriptor ? `<p class="eyebrow">${escape(data.descriptor)}</p>` : ''}
          <h1 id="home-title">${nameLines.map(line => `<span class="name-line"><span>${escape(line)}</span></span>`).join(' ')}</h1>
        </div>
        <div class="lead">${paragraphs(data.introduction)}</div>
        ${note ? renderNowPreview(note) : ''}
        ${actions ? `<nav class="text-actions" aria-label="Explore the portfolio">${actions}</nav>` : ''}
        ${searchLink(true)}
      </div>
      ${portraitMarkup}
    </div>
    </section>
    ${profile}${now}${work}${writingFeature}${contactFeature}
  `;
}

function aboutPage(data, background) {
  const portrait = image(data.aboutPortrait || data.portrait, { eager: true, sizes: '(max-width: 700px) 92vw, 55vw' });
  return `<div class="profile-page">
    <div class="about-opening${portrait ? ' about-opening-with-portrait" data-header-surface="about' : ''}">
      <header class="about-hero container${portrait ? ' about-hero-with-portrait' : ''}">
        <div class="about-hero-copy">
          <div class="about-hero-heading">
            <p class="eyebrow">About</p>
            <h1>${escape(data.name)}</h1>
          </div>
          ${data.biography.length ? `<div class="about-biography">${paragraphs(data.biography, glossary)}</div>` : ''}
        </div>
        ${portrait}
      </header>
    </div>
    ${background.length ? `<div class="container"><nav class="about-jumps" aria-label="On this page"><ul>
      ${background.map(([id, title]) => `<li>${action('#' + id, title, 'action-link', '', sectionIcons[id])}</li>`).join('')}
    </ul></nav>
    <div class="about-records">${background.map(([id, title, body]) => section(id, title, body, { share: id === 'courses' })).join('')}</div></div>` : ''}
    ${data.courses?.some(course => course.certificateUrl && course.certificatePreview) ? `<dialog class="certificate-dialog" aria-labelledby="certificate-dialog-title">
      <div class="certificate-dialog-header">
        <h2 id="certificate-dialog-title">Certificate preview</h2>
        <form method="dialog"><button type="submit" autofocus>Close</button></form>
      </div>
      <p class="meta">Excerpt from the issuer’s document</p>
      <div class="certificate-dialog-content"></div>
    </dialog>` : ''}
  </div>`;
}

function languageList(languages = [], scoresUpdated) {
  if (!languages.length) return '';
  const hasScores = languages.some(language => Number.isInteger(language.duolingoScore));
  const groups = [
    ['spoken', 'Languages I speak', languages.filter(language => !language.learning)],
    ['learning', 'Languages I’m learning', languages.filter(language => language.learning)],
  ];
  return `<div class="language-groups">${groups.filter(([, , entries]) => entries.length).map(([id, title, entries]) =>
    `<div class="language-group language-group-${id}">
      <h3>${title}</h3>
      <dl class="language-list">${entries.map(language => `<div>
        <dt>${escape(language.name)}</dt>
        <dd>${escape(language.description)}
          ${Number.isInteger(language.duolingoScore) ? `<span class="language-score">Duolingo score <strong>${language.duolingoScore}</strong></span>` : ''}
          ${language.certificateUrl ? action(language.certificateUrl, 'View credential', 'action-link', `for ${language.name}`, 'certificate') : ''}
        </dd>
      </div>`).join('')}</dl>
    </div>`).join('')}</div>
  ${hasScores && scoresUpdated ? `<p class="meta language-score-source">Duolingo scores shared on LinkedIn, updated ${publicationDate(scoresUpdated)}.</p>` : ''}`;
}

function educationRecord(education) {
  const groups = new Map();
  for (const item of education) {
    const key = item.institution || item;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].map(items => {
    if (items.length === 1) return chronology(items, { renderText: glossary });
    const stages = [...items].sort((left, right) => Number(Boolean(left.current)) - Number(Boolean(right.current)));
    return `<div class="education-school">
      <h3>${escape(items[0].institution)}</h3>
      <div class="education-school-stages">
        ${chronology(stages, { renderText: glossary, heading: 'h4', showInstitution: false })}
      </div>
    </div>`;
  }).join('');
}

function eventMark(item) {
  return item.eventLogo ? `<div class="work-event-mark" aria-hidden="true">${image(item.eventLogo, { sizes: '(max-width: 700px) 100px, 175px' })}</div>` : '';
}

function eventSpread(item, photo = item.image) {
  const destination = safeLink(`/work/${item.slug}/`);
  const artwork = photo || item.eventLogo;
  const summary = item.body?.[0] || item.sections?.[0]?.paragraphs?.[0] || item.description;
  return `<section class="work-event-spread" id="spread-${item.slug}" data-event="${item.slug}" data-motion-route="${destination}" aria-label="${escape(item.title)}" hidden>
    ${artwork ? `<div class="work-event-artwork${photo ? '' : ' work-event-mark'}">${image(artwork, { sizes: '(max-width: 700px) 90vw, 440px' })}</div>` : ''}
    <div class="work-event-summary">
      ${photo && item.eventLogo ? eventMark(item) : ''}
      ${paragraphs([summary], glossary)}
      ${action(destination, 'Read full write-up', 'button-link', `about ${item.title}`)}
    </div>
  </section>`;
}

function workEvent(item) {
  if (!hasDetail(item)) return projectEntry(item, { heading: 'h3', actionLabel: 'Read more' });
  const titleId = `event-${item.slug}`;
  const destination = safeLink(`/work/${item.slug}/`);
  const metadata = [escape(item.category), publicationDate(item.date)].filter(Boolean).join(' · ');
  return `<article class="work-event" data-event="${escape(item.slug)}" data-motion-route="${destination}">
    <a class="work-event-link" href="${destination}" data-event-toggle="spread-${item.slug}" aria-labelledby="${titleId} ${titleId}-action">
      <div class="work-event-copy">
        ${metadata ? `<p class="meta">${metadata}</p>` : ''}
        <h3 id="${titleId}">${escape(item.title)}</h3>
        <p class="work-event-description">${escape(item.description)}</p>
        <span class="work-event-action"><span id="${titleId}-action" data-event-toggle-label>Read event summary</span>${icon('caret-down', 'work-event-caret')}</span>
      </div>
      ${eventMark(item)}
    </a>
  </article>${eventSpread(item)}`;
}

function workIndex(items, label, introduction, evidence) {
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
  const jumps = [
    ...(evidence ? [['evidence', 'Evidence map']] : []),
    ...sections,
  ];
  const featureSpreads = feature.kind === 'event' && hasDetail(feature);
  const eventRows = [];
  for (let index = 0; index < events.length; index += 2) {
    eventRows.push(`<div class="work-event-row">${events.slice(index, index + 2).map(workEvent).join('')}</div>`);
  }

  return `<div class="work-page">
    <header class="work-heading">
      <div class="work-heading-copy">
        <h1>${escape(label)}</h1>
        ${introduction ? `<p class="lead">${escape(introduction)}</p>` : ''}
      </div>
      ${jumps.length ? `<nav class="work-jumps" aria-label="On this page">${jumps.map(([id, title]) =>
        action('#' + id, title, 'action-link', '', sectionIcons[id])).join('')}</nav>` : ''}
    </header>
    <div class="work-lead" data-header-surface${feature.slug === 'unesco-ai-forum' ? ' id="event-unesco"' : ''}${featureSpreads ? ` data-feature-spread="spread-${feature.slug}"` : ''}>
      ${projectEntry(feature, { featured: true, eagerImage: true, actionLabel: featureSpreads ? 'Read event summary' : 'Read more' })}
      ${featureSpreads ? eventSpread(feature, feature.homeImage ?? feature.image) : ''}
    </div>
    ${evidence}
    ${sections.map(([id, title, entries]) => `<section class="work-section work-${id}" id="${id}" aria-labelledby="work-${id}-title" tabindex="-1" data-share-section data-header-surface>
      ${sharedHeading(id, title, { headingId: `work-${id}-title`, share: id === 'events' })}
      <div class="work-entries">${id === 'events' ? eventRows.join('') : entries.map(item => projectEntry(item, {
        heading: 'h3', featured: Boolean(item.image), showSummary: true, actionLabel: 'Read more',
      })).join('')}</div>
    </section>`).join('')}
  </div>`;
}

function collectionPages(add, data, items, path, label, evidence = '') {
  if (!items.length) return;
  const slugs = new Set();
  for (const item of items) {
    if (typeof item.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) {
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
    const sources = item.sources?.length
      ? `<section class="article-section" id="sources" data-share-section tabindex="-1" aria-labelledby="sources-title">${sharedHeading('sources', 'Sources')}<ul>${item.sources.map(source =>
        `<li><a href="${safeLink(source.url)}">${escape(source.label)}</a></li>`).join('')}</ul></section>` : '';
    const renderText = isWriting ? escape : glossary;
    const parts = (item.sections || []).map(part => `<section class="article-section"><h2>${escape(part.title)}</h2>${paragraphs(part.paragraphs, renderText)}</section>`).join('');
    const photo = image(item.image, { eager: true, sizes: hasCover ? '(max-width: 650px) 190px, 240px' : '(max-width: 760px) 92vw, 640px' });
    const headline = `<h1>${escape(item.title)}</h1><p class="lead">${renderText(item.description)}</p>`;
    const mark = isWorkEvent ? eventMark(item) : '';
    const opening = isWriting
      ? `<header class="page-heading article-heading">${metadata ? `<p class="eyebrow">${metadata}</p>` : ''}${headline}</header>${photo}`
      : `<header class="experience-opening${photo ? ' experience-opening-with-photo' : ''}" data-event="${escape(item.slug)}">
        ${photo}
        <div class="experience-opening-copy">
          ${mark || metadata ? `<div class="experience-identity">${mark}${metadata ? `<p class="meta">${metadata}</p>` : ''}</div>` : ''}
          ${headline}
        </div>
      </header>`;
    const neighbours = isWriting ? [
      [detailed[index - 1], 'Previous article'],
      [detailed[index + 1], 'Next article'],
    ].filter(([entry]) => entry) : [];
    add(`/${path}/${item.slug}/`, item.title, item.description, `
      <p class="breadcrumb"><a href="/${path}/${isWorkEvent && !featuredReport ? '#events' : ''}">${icon('arrow-left', 'arrow arrow-left')}<span>${isWriting ? 'All writing' : isWorkEvent && !featuredReport ? 'All events' : 'All experiences'}</span></a></p>
      <article class="detail${hasCover ? ' detail-with-cover' : ''}${isWriting ? '' : ' work-detail'}" data-motion-route="/${path}/${item.slug}/">
        ${opening}
        <div class="reading article-body">${paragraphs(item.body, renderText)}
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
    add('/work/', label, description, workIndex(items, label, introduction, evidence));
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
  const novel = findNovel(data.writing);
  const records = portfolioRecords(data, novel);
  const journey = journeyPage(data, records);
  const education = educationRecord(data.education);
  const background = [
    ['education', 'Education', education && education + (journey ? action('/journey/', 'Explore my journey', 'action-link education-journey') : '')],
    ['experience', 'Experience', chronology(data.experience)],
    ['languages', 'Languages', languageList(data.languages, data.duolingoScoresUpdated)],
    ['capabilities', 'Capabilities', capabilitiesCards(data.capabilities, records)],
    ['courses', 'Independent courses', chronology(data.courses || [], { detailLabel: 'Course details', renderText: glossary })],
    ['achievements', 'Achievements', chronology(data.achievements)],
    ['interests', 'Interests', paragraphs(data.interests, glossary)],
  ].filter(([, , body]) => body);
  const hasAbout = data.biography.length || background.length;
  const contact = data.contact;
  const hasContact = contact.email || contact.phone || contact.links.length || contact.cv || contact.formEndpoint;
  const selected = data.projects.filter(item => item.selected);

  add('/', 'Home', data.seo.description, homePage(data, { hasAbout, hasContact, selected }));
  if (hasAbout) {
    add('/about/', 'About', data.seo.about || `Background, education and interests of ${data.name}.`, aboutPage(data, background));
  }
  if (journey) add('/journey/', 'Journey', `Education, work and milestones in ${data.name}’s journey.`, journey);
  collectionPages(add, data, data.projects, 'work', 'Experiences', evidenceMap(records));
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
    pages.push({ path: '/now/', label: 'Now', body: '', redirect: '/#now' });
  }
  return pages;
}
