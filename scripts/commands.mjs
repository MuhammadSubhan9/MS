import { escape, hasDetail, icon, pageIcons, safeLink, sectionIcons } from './components.mjs';
import { portfolioRecords } from './portfolio-features.mjs';

export const commandAssets = `<link rel="stylesheet" href="/commands.css">
  <script src="/commands.js" defer></script>`;

const sectionCommands = [
  ['/', 'now', 'Now', 'clock', 'current focus'],
  ['/about/', 'education', 'Education', sectionIcons.education, 'school qualifications'],
  ['/about/', 'languages', 'Languages', sectionIcons.languages, 'German Latin Arabic'],
  ['/about/', 'courses', 'Independent courses', sectionIcons.courses, 'courses certificates'],
  ['/journey/', 'milestones', 'Milestones', sectionIcons.milestones, 'timeline history'],
  ['/journey/', 'in-progress', 'In progress', sectionIcons['in-progress'], 'current'],
  ['/journey/', 'looking-ahead', 'Looking ahead', sectionIcons['looking-ahead'], 'future plans'],
  ['/work/', 'evidence', 'Evidence map', sectionIcons.evidence, 'subjects'],
  ['/work/', 'events', 'Events & conferences', sectionIcons.events, 'events conferences'],
  ['/writing/', 'synopsis', 'Novel synopsis', 'text-align-left', 'plot summary synopsis'],
  ['/writing/', 'excerpt', 'Read the excerpt', 'book-open-text', 'book read novel excerpt'],
  ['/writing/', 'release-updates', 'Novel release updates', 'bell-simple', 'subscribe notify newsletter'],
  ['/contact/', 'contact-form-title', 'Contact form', 'paper-plane-right', 'send message email'],
  ['/contact/', 'save-contact', 'Save contact card', 'identification-card', 'vcf vcard download'],
];

function commandRow({ label, iconName, href, action, context, keywords = '' }) {
  const copy = `${icon(iconName)}<span class="command-result-copy"><span data-command-label>${escape(label)}</span>${context ? `<small>${escape(context)}</small>` : ''}</span>${icon('arrow-right', 'command-result-arrow')}`;
  const control = href
    ? `<a class="command-result" href="${safeLink(href)}">${copy}</a>`
    : `<button class="command-result" type="button" data-command-action="${escape(action)}">${copy}</button>`;
  return `<li data-command-entry data-keywords="${escape(keywords)}">${control}</li>`;
}

export function commandPalette(data, navigation) {
  const pages = new Map(navigation.map(page => [page.path, page]));
  const hasSection = (path, id) => pages.get(path)?.body.includes(`id="${id}"`);
  const records = pages.has('/journey/') ? portfolioRecords(data, null) : new Map();
  const commands = [
    ...navigation.map(page => ({
      label: page.path === '/writing/' ? 'Writing' : page.label,
      iconName: pageIcons[page.path],
      href: page.path,
      keywords: page.path === '/work/' ? 'work portfolio experiences'
        : page.path === '/writing/' ? `novel book ${page.label}` : '',
    })),
    { label: 'Copy page link', iconName: 'copy-simple', action: 'copy', keywords: 'copy url share link' },
    { label: 'Back to top', iconName: 'arrow-up', action: 'top', keywords: 'top scroll beginning' },
    ...sectionCommands.filter(([path, id]) => hasSection(path, id))
      .map(([path, id, label, iconName, keywords]) => ({
        label, iconName, keywords, href: `${path}#${id}`, context: path === '/writing/' ? 'Writing' : pages.get(path).label,
      })),
    ...(pages.has('/work/') ? data.projects.filter(hasDetail).map(item => ({
      label: item.title, iconName: item.kind === 'event' ? 'calendar-blank' : 'notebook',
      href: `/work/${item.slug}/`, context: 'Experiences', keywords: `${item.slug} ${item.category || ''}`,
    })) : []),
    ...(data.journey?.milestones || []).map(({ record }) => records.get(record))
      .filter(item => item && hasSection('/journey/', `milestone-${item.id}`))
      .map(item => ({
        label: item.title, iconName: 'clock-counter-clockwise', href: `/journey/#milestone-${item.id}`,
        context: 'Journey milestone', keywords: 'milestone timeline',
      })),
  ];

  return `<dialog class="command-palette" aria-labelledby="command-title">
    <form class="command-form">
      <div class="command-heading">
        <h2 id="command-title">Commands</h2>
        <button type="button" data-close-commands>Close</button>
      </div>
      <label class="command-label" for="command-input">Search pages, experiences and commands</label>
      <input id="command-input" type="search" placeholder="Search or type a command…" autocomplete="off" autocapitalize="none" spellcheck="false" aria-controls="command-results" autofocus>
      <ul class="command-results" id="command-results" aria-label="Commands">${commands.map(commandRow).join('')}</ul>
      ${data.now ? `<a class="command-result" href="/#edit" hidden data-edit-command>Edit Now ${icon('arrow-right')}</a>` : ''}
      <p class="command-label" data-command-selection role="status"></p>
      <p class="command-feedback" role="status"></p>
      <input type="url" data-command-copy aria-label="Page link to copy" readonly hidden>
      <p class="command-keys"><kbd>↑</kbd><kbd>↓</kbd> Choose <kbd>Enter</kbd> Run</p>
      <button type="submit" hidden>Run command</button>
    </form>
  </dialog>`;
}
