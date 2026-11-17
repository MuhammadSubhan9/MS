import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../public/google-analytics.js', import.meta.url), 'utf8');
const origin = 'https://portfolio.example';
const measurementId = 'G-TEST123';

function loadAnalytics({ pageOrigin = origin, hash = '', privacy = {}, savedChoice } = {}) {
  const scripts = [];
  const window = {};
  let storageReads = 0;
  const context = {
    window,
    location: { origin: pageOrigin, hash },
    navigator: privacy,
    document: {
      currentScript: { dataset: { ga4Id: measurementId, analyticsOrigin: origin } },
      createElement: () => ({}),
      head: { append: script => scripts.push(script) },
    },
    localStorage: {
      getItem() {
        storageReads++;
        return savedChoice;
      },
    },
  };
  runInNewContext(source, context);
  return { window, scripts, storageReads };
}

test('Google Analytics starts automatically without a saved choice or a preference control', () => {
  for (const savedChoice of [null, 'denied', 'granted']) {
    const { window, scripts, storageReads } = loadAnalytics({ savedChoice });
    assert.equal(storageReads, 0);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    assert.equal(scripts[0].async, true);
    assert.equal(window[`ga-disable-${measurementId}`], false);
    assert.equal(window.dataLayer.length, 3);
    assert.equal(window.dataLayer[0][2].analytics_storage, 'granted');
    assert.equal(window.dataLayer[0][2].ad_storage, 'denied');
    const config = window.dataLayer[2];
    assert.equal(config[0], 'config');
    assert.equal(config[1], measurementId);
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
  }
});

test('automatic analytics still excludes previews, direct editor links and browser privacy signals', () => {
  for (const options of [
    { pageOrigin: 'http://localhost:4173' },
    { pageOrigin: 'https://preview.example' },
    { hash: '#edit' },
    { privacy: { globalPrivacyControl: true } },
    { privacy: { doNotTrack: '1' } },
  ]) {
    const { window, scripts } = loadAnalytics(options);
    assert.equal(scripts.length, 0);
    assert.equal(window.gtag, undefined);
  }
});
