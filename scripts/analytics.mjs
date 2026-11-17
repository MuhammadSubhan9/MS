import { escape } from './components.mjs';

export function clarityTag(data, origin, ready) {
  const project = data.analytics?.clarityProject;
  if (!ready || !origin || !project) return '';
  if (!/^[a-z0-9]+$/i.test(project)) throw new Error('Invalid Microsoft Clarity project ID');

  return `<script src="/clarity.js" data-clarity-project="${escape(project)}" data-analytics-origin="${escape(origin)}" defer></script>`;
}
