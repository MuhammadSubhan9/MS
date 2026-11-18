import {
  action, copySectionButton, escape, glossary, hasDetail, paragraphs,
  publicationDate, safeLink, sharedHeading,
} from './components.mjs';

const topics = [
  ['technology', 'Technology'],
  ['business', 'Business'],
  ['aviation', 'Aviation'],
  ['communication', 'Communication'],
];

export const portfolioAssets = `<link rel="stylesheet" href="/portfolio-features.css">
  <script src="/portfolio-features.js" defer></script>`;

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
      ${record.certificateUrl ? action(record.certificateUrl, 'View certificate', 'action-link', `for ${record.title}`) : ''}
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
  const button = ([topic, label]) => `<button type="button" data-evidence-filter="${topic}" aria-pressed="${topic === 'all'}">${label}</button>`;
  return `<section class="evidence-section" id="evidence" aria-labelledby="evidence-title" tabindex="-1" data-share-section>
    ${sharedHeading('evidence', 'Evidence map')}
    <div class="evidence-filters" data-evidence-filters role="group" aria-label="Filter by subject" hidden>
      ${[['all', 'All subjects'], ...available].map(button).join('')}
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
      <summary>${escape(capability.title)}</summary>
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

function journeyMilestone({ record, date }, older, newer) {
  const id = `milestone-${record.id}`;
  return `<li class="journey-milestone" id="${id}" data-share-section tabindex="-1">
    <p class="meta journey-date">${publicationDate(date || record.date)}</p>
    <details name="journey-milestones" data-open-for-section-link>
      <summary><span>${escape(record.title)}</span></summary>
      <div class="journey-brief">
        ${record.context ? `<p class="meta">${escape(record.context)}</p>` : ''}
        ${record.description ? paragraphs([record.description], glossary) : ''}
        ${record.subjects?.length ? `<p>Subjects included ${escape(new Intl.ListFormat('en-GB').format(record.subjects))}.</p>` : ''}
        <div class="journey-record-links">${recordLink(record)}${copySectionButton(id, record.title)}</div>
        ${older || newer ? `<nav class="journey-step" aria-label="Other milestones">
          ${newer ? `<a href="#milestone-${newer.record.id}"><span aria-hidden="true">↑</span> Newer milestone<span class="visually-hidden">: ${escape(newer.record.title)}</span></a>` : ''}
          ${older ? `<a href="#milestone-${older.record.id}"><span aria-hidden="true">↓</span> Older milestone<span class="visually-hidden">: ${escape(older.record.title)}</span></a>` : ''}
        </nav>` : ''}
      </div>
    </details>
  </li>`;
}

export function journeyPage(data, records) {
  if (!data.journey) return '';
  const current = data.journey.current.map(key => records.get(key)).filter(Boolean);
  const milestones = data.journey.milestones
    .map(({ record, date }) => ({ record: records.get(record), date }))
    .filter(({ record }) => record);
  if (!current.length && !milestones.length) return '';

  const sections = [
    ['in-progress', 'In progress', current.length],
    ['milestones', 'Milestones', milestones.length],
    ['looking-ahead', 'Looking ahead', data.futureDirection],
  ].filter(([, , show]) => show);
  return `<div class="journey-page">
    <header class="journey-hero">
      <div>
        <h1>Journey</h1>
        <p class="lead">What I’ve worked on, what I’m studying and where I hope to go next.</p>
      </div>
      <nav class="journey-jumps" aria-label="On this page">${sections.map(([id, title]) => action('#' + id, title)).join('')}</nav>
    </header>
    ${current.length ? `<section class="journey-current" id="in-progress" aria-labelledby="in-progress-title" tabindex="-1" data-share-section>
      ${sharedHeading('in-progress', 'In progress')}
      <div class="journey-current-grid">${current.map(record => `<article>
        <h3>${glossary(record.title)}</h3>
        ${record.date ? `<p class="meta">${publicationDate(record.date)}</p>` : ''}
        ${record.description ? paragraphs([record.description], glossary) : ''}
        ${recordLink(record)}
      </article>`).join('')}</div>
    </section>` : ''}
    ${milestones.length ? `<section class="journey-history" id="milestones" aria-labelledby="milestones-title" tabindex="-1" data-share-section>
      ${sharedHeading('milestones', 'Milestones')}
      <ol class="journey-list">${milestones.map((entry, index) => journeyMilestone(entry, milestones[index + 1], milestones[index - 1])).join('')}</ol>
    </section>` : ''}
    ${data.futureDirection ? `<section class="journey-future" id="looking-ahead" aria-labelledby="looking-ahead-title" tabindex="-1" data-share-section>
      ${sharedHeading('looking-ahead', 'Looking ahead')}
      ${data.journey.lookingAheadTitle ? `<h3>${escape(data.journey.lookingAheadTitle)}</h3>` : ''}
      <p>${glossary(data.futureDirection)}</p>
    </section>` : ''}
  </div>`;
}

export function siteUpdateBrief(update) {
  if (!update?.items?.length) return '';
  return `<aside class="site-update container" id="site-updates" data-site-update="${escape(update.id)}" aria-label="Site updates">
    <div class="site-update-inner">
      <details>
        <summary><span>Site updates</span><span class="site-update-unread" data-site-update-unread hidden>New since your last visit</span></summary>
        <div class="site-update-content">
          <p class="meta">${publicationDate(update.date)}</p>
          <ul>${update.items.map(item => `<li>${action(item.href, item.label)}<p>${escape(item.description)}</p></li>`).join('')}</ul>
        </div>
      </details>
      <button class="site-update-dismiss" type="button" data-dismiss-site-update hidden>Dismiss</button>
    </div>
  </aside>`;
}
