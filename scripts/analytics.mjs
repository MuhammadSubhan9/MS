import { escape } from './components.mjs';

export function clarityTag(data, origin, ready) {
  const project = data.analytics?.clarityProject;
  if (!ready || !origin || !project) return '';
  if (!/^[a-z0-9]+$/i.test(project)) throw new Error('Invalid Microsoft Clarity project ID');

  return `<script src="/clarity.js" data-clarity-project="${escape(project)}" data-analytics-origin="${escape(origin)}" defer></script>`;
}

export function googleAnalytics(data, origin, ready) {
  const measurementId = data.analytics?.googleMeasurementId;
  if (!ready || !origin || !measurementId) return { head: '', controls: '' };
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) throw new Error('Invalid GA4 measurement ID');

  return {
    head: `<link rel="stylesheet" href="/analytics.css">
  <script src="/google-analytics.js" data-ga4-id="${escape(measurementId)}" data-analytics-origin="${escape(origin)}" defer></script>`,
    controls: `<details class="analytics-preferences" hidden>
      <summary>Analytics preferences</summary>
      <div class="analytics-options">
        <p>Google Analytics uses cookies to measure visits when you allow it. <a href="https://policies.google.com/technologies/partner-sites">How Google uses this data</a></p>
        <div class="analytics-choices" role="group" aria-label="Google Analytics">
          <button type="button" data-ga4-choice="granted" aria-pressed="false">Allow analytics</button>
          <button type="button" data-ga4-choice="denied" aria-pressed="true">Keep analytics off</button>
        </div>
      </div>
    </details>`,
  };
}
