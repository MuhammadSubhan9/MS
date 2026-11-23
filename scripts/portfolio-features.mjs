import {
  action, copySectionButton, escape, glossary, hasDetail, icon, image, paragraphs,
  publicationDate, safeLink, sectionIcons, sharedHeading, toggleIcon,
} from './components.mjs';

const topics = [
  ['technology', 'Technology', 'cpu'],
  ['business', 'Business', 'chart-line-up'],
  ['aviation', 'Aviation', 'airplane-tilt'],
  ['communication', 'Communication', 'chats-circle'],
];

export const portfolioAssets = `<link rel="stylesheet" href="/portfolio-features.css">
  <script src="/portfolio-features.js" defer></script>`;

export const journeyAssets = `<link rel="stylesheet" href="/journey.css">
  <script src="/journey.js" defer></script>`;

export const sectionLinkDialog = `<dialog class="section-link-dialog" aria-labelledby="section-link-title">
    <form method="dialog">
      <h2 id="section-link-title">Share this section</h2>
      <label for="section-link-url">Copy this address</label>
      <input id="section-link-url" type="text" readonly>
      <button class="button-link" type="submit">Done</button>
    </form>
  </dialog>`;

export function portfolioRecords(data, novel) {
  const records = new Map();
  for (const [type, items] of [
    ['work', data.projects], ['course', data.courses || []], ['education', data.education], ['writing', data.writing],
  ]) {
    for (const item of items) {
      const id = item.id || item.slug;
      if (!id) continue;
      const key = `${type}:${id}`;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || records.has(key)) throw new Error(`Invalid or duplicate record: ${key}`);
      const isAbout = type === 'course' || type === 'education';
      const destination = isAbout ? `/about/#${id}`
        : item === novel ? '/writing/#excerpt'
        : hasDetail(item) ? `/${type}/${id}/`
        : item.url || `/${type}/`;
      const description = item === novel ? data.writingPractice || item.description
        : item.description || item.details?.[0];
      records.set(key, {
        ...item, id, type, destination, description,
        context: item.institution || item.category || '',
        label: item.evidence?.label || item.title,
      });
    }
  }
  return records;
}

function recordLink(record) {
  const label = { work: 'Read the write-up', writing: 'Explore the writing', course: 'View course details', education: 'See my education' }[record.type];
  return action(record.destination, label, 'action-link', `for ${record.title}`);
}

function evidenceSummary(record, primaryTopic) {
  const metadata = [record.type === 'course' ? escape(record.institution) : '', publicationDate(record.date)].filter(Boolean).join(' · ');
  return `<p class="eyebrow">${escape(primaryTopic)} · ${record.type === 'course' ? 'Credential' : escape(record.kind === 'event' ? 'Event' : record.context || 'Experience')}</p>
    <h3>${escape(record.title)}</h3>
    ${metadata ? `<p class="meta">${metadata}</p>` : ''}
    ${record.workSummary || record.description ? `<p class="evidence-summary">${escape(record.workSummary || record.description)}</p>` : ''}
    <div class="evidence-record-links">
      ${recordLink(record)}
      ${record.certificateUrl ? action(record.certificateUrl, 'View certificate', 'action-link', `for ${record.title}`, 'certificate') : ''}
    </div>`;
}

export function evidenceMap(records) {
  const items = [...records.values()].filter(record => record.evidence?.topics?.length);
  if (!items.length) return '';
  const topicLabels = new Map(topics);
  for (const item of items) {
    if (item.evidence.topics.some(topic => !topicLabels.has(topic))) throw new Error(`Unknown topic on ${item.title}`);
  }
  const first = items[0];
  const available = topics.filter(([topic]) => items.some(item => item.evidence.topics.includes(topic)));
  const button = ([topic, label, symbol]) => `<button class="icon-label" type="button" data-evidence-filter="${topic}" aria-pressed="${topic === 'all'}">${icon(symbol)}${label}</button>`;
  return `<section class="evidence-section" id="evidence" aria-labelledby="evidence-title" tabindex="-1" data-share-section data-header-surface>
    ${sharedHeading('evidence', 'Evidence map')}
    <div class="evidence-filters" data-evidence-filters role="group" aria-label="Filter by subject" hidden>
      ${[['all', 'All subjects', 'squares-four'], ...available].map(button).join('')}
    </div>
    <div class="evidence-board">
      <div class="evidence-map" role="group" aria-label="Courses, events and projects by subject">
        ${available.map(([topic, title]) => {
          const branch = items.filter(item => item.evidence.topics[0] === topic);
          return branch.length ? `<div class="evidence-branch" data-evidence-branch="${topic}">
            <h3>${title}</h3>
            <ul>${branch.map(item => `<li><a href="${safeLink(item.destination)}" data-evidence-node="${item.id}" data-evidence-topics="${item.evidence.topics.join(' ')}">${escape(item.label)}</a></li>`).join('')}</ul>
          </div>` : '';
        }).join('')}
      </div>
      <article class="evidence-selection" data-evidence-selection aria-live="polite" tabindex="-1">
        ${evidenceSummary(first, topicLabels.get(first.evidence.topics[0]))}
      </article>
    </div>
    ${items.map(item => `<template data-evidence-record="${item.id}">${evidenceSummary(item, topicLabels.get(item.evidence.topics[0]))}</template>`).join('')}
  </section>`;
}

export function capabilitiesMatrix(capabilities = [], records) {
  return capabilities.map((capability, index) => {
    const evidence = capability.records.map(key => records.get(key)).filter(Boolean);
    if (!evidence.length) return '';
    return `<details class="capability"${index === 0 ? ' open' : ''}>
      <summary>${escape(capability.title)}${toggleIcon('plus', 'minus')}</summary>
      <dl class="capability-matrix">
        <div><dt>What I studied</dt><dd>${glossary(capability.learning)}</dd></div>
        <div><dt>Where I used it</dt><dd>${glossary(capability.application)}</dd></div>
        <div><dt>What I’m developing next</dt><dd>${glossary(capability.next)}</dd></div>
      </dl>
      <ul class="capability-evidence" aria-label="Related work and credentials">${evidence.map(record =>
        `<li>${action(record.destination, record.label)}</li>`).join('')}</ul>
    </details>`;
  }).join('');
}

function journeyMilestone({ record, date, logo }) {
  const id = `milestone-${record.id}`;
  const mark = logo || record.eventLogo;
  const category = { education: 'Education', course: 'Course' }[record.type]
    || (record.kind === 'event' ? 'Event' : record.category?.split(' · ')[0] || 'Experience');
  return `<li class="journey-milestone" id="${id}" data-share-section tabindex="-1">
    <span class="journey-point" aria-hidden="true"></span>
    <details class="journey-card" data-open-for-section-link>
      <summary>
        <span class="journey-label">
          <span class="journey-date">${publicationDate(date)}</span>
          <span class="journey-kind">${escape(category)}</span>
        </span>
        <span class="journey-title">${escape(record.title)}</span>
        ${toggleIcon('plus', 'minus', 'journey-switch')}
      </summary>
      <div class="journey-panel">
        <div class="journey-brief">
          <div class="journey-brief-text">
            ${mark ? `<div class="journey-mark" data-event="${record.id}">${image(mark)}</div>` : ''}
            ${record.context && record.context !== category ? `<p class="meta">${escape(record.context)}</p>` : ''}
            ${record.description ? paragraphs([record.description], glossary) : ''}
            ${record.subjects?.length ? `<p>Subjects included ${escape(new Intl.ListFormat('en-GB').format(record.subjects))}.</p>` : ''}
            <div class="journey-record-links">${recordLink(record)}${copySectionButton(id, record.title)}</div>
          </div>
        </div>
      </div>
    </details>
  </li>`;
}

function journeyTimeline(milestones, hasCurrentWork) {
  const displayedYears = new Set();
  return `<div class="journey-timeline" data-journey-timeline>
    <div class="journey-rail" aria-hidden="true"><span></span></div>
    <ol class="journey-list">${milestones.map(entry => {
      const { year } = entry;
      const divider = year && !displayedYears.has(year) ? `<li class="journey-year" id="journey-year-${year}">
        <h3>${year}</h3><span class="journey-point" aria-hidden="true"></span>
      </li>` : '';
      displayedYears.add(year);
      return divider + journeyMilestone(entry);
    }).join('')}</ol>
    <div class="journey-end">
      ${hasCurrentWork ? action('#in-progress', 'Present', 'journey-end-link', '– see what I’m working on') : '<span>Latest milestone</span>'}
    </div>
  </div>`;
}

function journeyYearOverview(years, milestones) {
  if (!years.length) return '';
  const months = 'January February March April May June July August September October November December'.split(' ');
  return `<nav class="journey-overview" aria-label="Milestones by year">
    <ol style="--journey-year-count: ${years.length}">
      ${years.map(year => {
        const entries = milestones.filter(entry => entry.year === year);
        const counts = Array(12).fill(0);
        for (const { date } of entries) {
          const isoMonth = date.match(/^\d{4}-(\d{2})(?:-\d{2})?$/)?.[1];
          const month = isoMonth ? Number(isoMonth) - 1 : months.findIndex(monthName => date.includes(monthName));
          if (month >= 0 && month < counts.length) counts[month]++;
        }
        const markers = counts.map((count, month) => count ? `<span class="journey-month-marker" style="--position: ${(month + .5) / 12 * 100}%">
          ${'<span></span>'.repeat(count)}
        </span>` : '').join('');
        return `<li><a class="journey-overview-year" href="#journey-year-${year}">
          <span class="journey-overview-label">
            <span class="journey-overview-date">${year}</span>
            <span class="journey-overview-count">${entries.length} ${entries.length === 1 ? 'milestone' : 'milestones'}</span>
          </span>
          <span class="journey-overview-plot" aria-hidden="true">${markers}</span>
          <span class="journey-overview-months" aria-hidden="true"><span>Jan</span><span>Dec</span></span>
          ${icon('arrow-down', 'journey-overview-arrow')}
        </a></li>`;
      }).join('')}
    </ol>
  </nav>`;
}

export function journeyPage(data, records) {
  if (!data.journey) return '';
  const current = data.journey.current.map(key => records.get(key)).filter(Boolean);
  const milestones = data.journey.milestones
    .filter(entry => records.has(entry.record))
    .map(({ record: key, date: milestoneDate, logo }) => {
      const record = records.get(key);
      const date = milestoneDate || record.date || '';
      return { record, date, logo, year: date.match(/\b\d{4}\b/g)?.at(-1) };
    });
  if (!current.length && !milestones.length) return '';

  const years = [...new Set(milestones.map(entry => entry.year).filter(Boolean))];
  const period = years.length > 1 ? `${years[0]}–${years.at(-1)}` : years[0];
  const sections = [
    ['milestones', 'Milestones', milestones.length],
    ['in-progress', 'In progress', current.length],
    ['looking-ahead', 'Looking ahead', data.futureDirection],
  ].filter(([, , show]) => show);
  return `<div class="journey-page">
    <header class="journey-hero" data-header-surface="journey">
      <div class="container journey-hero-inner">
        <div class="journey-intro">
          ${period ? `<p class="journey-period">${period}</p>` : ''}
          <h1>Journey</h1>
          <p class="lead">From my first aviation courses to my A&nbsp;Levels and the novel I’m writing now.</p>
        </div>
        ${journeyYearOverview(years, milestones)}
        <nav class="journey-jumps" aria-label="On this page">
          ${sections.map(([id, title]) => `<a href="#${id}">${icon(sectionIcons[id])}<span>${escape(title)}</span>${icon('arrow-down', 'journey-jump-arrow')}</a>`).join('')}
        </nav>
      </div>
    </header>
    ${milestones.length ? `<section class="container journey-history" id="milestones" aria-labelledby="milestones-title" tabindex="-1" data-share-section>
      <div class="journey-history-heading">
        ${sharedHeading('milestones', 'Milestones')}
      </div>
      ${journeyTimeline(milestones, current.length > 0)}
    </section>` : ''}
    ${current.length || data.futureDirection ? `<div class="journey-next" data-header-surface>
      <div class="container journey-next-inner${current.length && data.futureDirection ? ' journey-next-split' : ''}">
        ${current.length ? `<section class="journey-current" id="in-progress" aria-labelledby="in-progress-title" tabindex="-1" data-share-section>
          ${sharedHeading('in-progress', 'In progress')}
          <div class="journey-current-entries">${current.map(record => `<article>
            <div>
              <h3>${glossary(record.title)}</h3>
              ${record.date ? `<p class="meta">${publicationDate(record.date)}</p>` : ''}
              ${record.description ? paragraphs([record.description], glossary) : ''}
              ${recordLink(record)}
            </div>
            ${record.type === 'writing' && record.image ? image(record.image, { sizes: '80px' }) : ''}
          </article>`).join('')}</div>
        </section>` : ''}
        ${data.futureDirection ? `<section class="journey-future" id="looking-ahead" aria-labelledby="looking-ahead-title" tabindex="-1" data-share-section>
          ${sharedHeading('looking-ahead', 'Looking ahead')}
          ${data.journey.lookingAheadTitle ? `<h3>${escape(data.journey.lookingAheadTitle)}</h3>` : ''}
          <p>${glossary(data.futureDirection)}</p>
        </section>` : ''}
      </div>
    </div>` : ''}
  </div>`;
}

export function siteUpdateBrief(update) {
  if (!update?.items?.length) return '';
  return `<aside class="site-update container" id="site-updates" data-site-update="${escape(update.id)}" aria-label="Site updates">
    <div class="site-update-inner">
      <details>
        <summary>${toggleIcon('plus', 'minus')}<span>Site updates</span><span class="site-update-unread" data-site-update-unread hidden>New since your last visit</span></summary>
        <div class="site-update-content">
          <p class="meta">${publicationDate(update.date)}</p>
          <ul>${update.items.map(item => `<li>${action(item.href, item.label)}<p>${escape(item.description)}</p></li>`).join('')}</ul>
        </div>
      </details>
      <button class="site-update-dismiss" type="button" data-dismiss-site-update hidden>Dismiss</button>
    </div>
  </aside>`;
}
