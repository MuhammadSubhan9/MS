import { escape } from './components.mjs';

export function clarityTag(data, origin, ready) {
  const project = data.analytics?.clarityProject;
  if (!ready || !origin || !project) return '';
  if (!/^[a-z0-9]+$/i.test(project)) throw new Error('Invalid Microsoft Clarity project ID');

  return `<script src="/clarity.js" data-clarity-project="${escape(project)}" data-analytics-origin="${escape(origin)}" defer></script>`;
}

export function googleAnalytics(data, origin, ready) {
  const measurementId = data.analytics?.googleMeasurementId;
  if (!ready || !origin || !measurementId) return { head: '', notice: '' };
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) throw new Error('Invalid GA4 measurement ID');

  return {
    head: `<link rel="stylesheet" href="/analytics.css">
  <script src="/google-analytics.js" data-ga4-id="${escape(measurementId)}" data-analytics-origin="${escape(origin)}" defer></script>`,
    notice: `<details class="analytics-notice">
      <summary>Website analytics</summary>
      <div class="analytics-options">
        <p>Google Analytics uses cookies to measure visits automatically. Microsoft Clarity measures page interactions with cookie storage disabled. Cloudflare measures visits and performance. <a href="https://policies.google.com/technologies/partner-sites">How Google uses this data</a></p>
      </div>
    </details>`,
  };
}
