# Muhammad Subhan — personal portfolio

A dependency-free Python-generated static website. The deployable output is `dist/`; the current public site is https://muhammadsubhan.pages.dev/ and the Git remote is the existing GitHub repository used by Cloudflare Pages.

## Structure

Nine content pages plus a custom 404: Home, About, Journey, Education, Direction, two Direction details, Beyond the classroom, and Contact. The journal has been removed. Capabilities, seven courses, eight languages, volunteering, events, and the website project are together in a short `portfolio.html` overview.

`scripts/portfolio.py` builds the consolidated overview from the authored course and event data. It removes the retired generated HTML, rewrites related destinations, and writes Cloudflare Pages `_redirects` for old section URLs. The longer original source copy is retained locally; it does not create hidden public detail pages.

The menu has six equal main choices, a Home link, two Direction subpage links, and search. Shared templates are in `scripts/render.py`, `home.py`, `menu.py`, and `story.py`. Styles and browser scripts are in `dist/assets/`.

## Build and check

```powershell
python scripts/build.py
python scripts/validate.py
python scripts/release_check.py
node --check dist/assets/site.js
python scripts/preview.py
```

The preview runs on http://127.0.0.1:4173 with a real 404 response. Cloudflare handles `_redirects` in production; the local preview does not process those rules. Publish the rebuilt `dist` through the existing GitHub → Cloudflare Pages workflow. The old Sites configuration is historical and is not the current deployment destination.

## Assets and behaviour

The current portrait is the exact approved AI preview with tie and suit adjustments, before the rejected facial blemish edit. Its file is `assets/portrait-approved.png`. The original supplied photograph remains preserved. The UNESCO homepage PNG is retained without resizing or compression. Fonts are local, with licence files included.

Motion stays enabled as requested. Phone screens use a compact animated sticky story in portrait and landscape. Stable small-viewport units and the measured sticky height keep the scroll calculation aligned with the layout; only short desktop windows use the unpinned fallback. Intro-seen state is session-scoped. The contact composer prepares a draft for `ms@ahmadbaqa.com` in the visitor's email application; it sends and stores nothing itself. Existing Google Analytics and Microsoft Clarity integrations remain in the shared template. There is no application backend or npm dependency tree.

## Verification of the simplified structure

All ten generated pages were checked at 320, 375, 390, 430, 768, 1024, 1366, 1440, and 1920 pixels: 90 page/viewport checks, with no horizontal overflow, missing completed images, or journal wording in the page, menu, or footer. Build validation checks internal links, fragments, heading structure, asset paths, search/sitemap route completeness, metadata, and redirect destinations. Certificate links lead directly to the original providers; event links lead to the original posts.

The phone scroll repair was checked through all three chapters at 320×568, 375×667, 390×740, 390×844, 430×932, 844×390 landscape, 768×1024 tablet, and 1440×900 desktop: 24 phase/layout checks with no mobile copy clipping, evidence-board clipping, control overflow, or horizontal overflow. This is browser viewport testing, not a claim of physical-device Safari testing.
