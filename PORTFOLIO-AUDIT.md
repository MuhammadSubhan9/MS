# Portfolio audit and repair report
**Muhammad Subhan · 18 November 2026 · Local release candidate**

## What this means for you

[Certain] The repaired portfolio builds successfully. A visitor can browse the five main sections at phone width, open the novel reader, turn pages with the keyboard and return to the page. The biggest changes concern what happens behind those screens. A failed database read now tells visitors that your latest update is unavailable. Repeat book signups no longer use up places meant for new readers. Your writing draft survives a refresh in the same tab. The contact form still uses SilentForms.

[Certain] These repairs are in the workspace. The live website and its database have not been updated during this repair pass. The release list now distinguishes people who asked to join from people who confirmed that they own the email address. Confirmation and final list deletion require action by the author or an authorized operator.

## Repair register

The numbers match the original audit. “Medium” and “low” describe the original impact. “Negligible” covers small presentation or documentation defects.

| ID | Original impact | What went wrong | What changed |
|---|---|---|---|
| 01 | Medium | An address entered by somebody else could appear on the release the mailing list. | The database provides a separate send list containing only confirmed, unnotified readers. A new or existing unverified signup stays pending. The author asks for an affirmative reply from that address before marking it confirmed. This is a manual process. |
| 02 | Medium | Repeated signups for one email could exhaust the daily allowance. | The database counts actual new rows. It enforces the daily cap in the same operation that saves the address. |
| 03 | Medium | Turning Google Analytics off in one tab could leave it active in another. | Following the author's subsequent instruction, Google Analytics now starts automatically. The site preference controls and saved-choice logic have been removed. Browser privacy signals continue to be respected. |
| 04 | Medium | Another site could frame the publishing screen. | Static pages and server responses tell browsers to refuse framing. |
| 05 | Medium | Visitors lacked a full explanation of which services handled visits or contact messages. | The site identifies Google Analytics, Microsoft Clarity, Cloudflare and SilentForms. The footer explains automatic visit measurement. |
| 06 | Medium | A database failure could show your original Now text as though it were current. | The rest of the homepage remains available and the Now section displays an explicit availability message. |
| 07 | Low | When the list was already full, rejected requests could still create extra tracking records. | The daily-cap check runs first. Expired counters are cleaned up during eligible requests. |
| 08 | Low | Publishing and unsubscribe requests had no application-level frequency limit. | Each action has its own hourly limit. Publishing enforces it before checking the code and pauses if the limiter is unavailable. |
| 09 | Low | There were few browser restrictions on where scripts and data could come from. | A content security policy permits the local site and its configured providers. Browsers also receive a file-type protection header. Production provider compatibility still needs a live check. |
| 10 | Low | Publishing read the entire request before checking its size. | Reading stops at 32 KiB. The separate text-length and revision checks still apply. |
| 11 | Low | An update to the source could ship alongside an outdated built site. | A GitHub workflow tests, rebuilds and checks for differences in the release directory. It also runs the browser checks. Its first hosted run is pending. |
| 12 | Low | The documented minimum Node version was too old for the test setup. | Package and setup instructions specify Node 22.13 or later. Local verification used Node 24.22.3. |
| 13 | Low | The checked-in tests missed important browser interactions. | A repeatable Chrome check covers mobile page width, large text spacing, editor draft recovery, page turns, closing the reader and browser errors. |
| 14 | Low | Extra text spacing could cut off the contact address on a narrow phone. | The address can wrap when necessary. The narrow-screen spacing check passed. |
| 15 | Low | The signup form could still display success while someone entered another address. | Editing clears old feedback. A response arriving while the visitor is typing preserves those newer values. |
| 16 | Low | Refreshing could discard an unpublished Now draft. | The current tab saves draft text against the version being edited. Successful publication clears it. When tab storage is unavailable the editor uses a leave-page warning. The publishing code is excluded from draft storage. |
| 17 | Low | An incorrectly formatted unsubscribe request could produce a misleading server error. | The server checks the token type and format before using it and gives an invalid-request response. |
| 18 | Low | A daily signup limit could tell visitors to retry too early. | The retry time matches the hourly or daily limit that actually applied. |
| 19 | Low | There was no plan for removing reader addresses after publication. | The signup notice and operator instructions specify deletion within 30 days after release, including pending requests. Final deletion is manual. |
| 20 | Low, local preview | Some unusual directory paths could produce the wrong redirect. | Ambiguous separators are rejected. Ordinary directory redirects retain the visitor's query string. |
| 21 | Low, local preview | The preview server compressed files even when the browser refused gzip. | It respects an explicit refusal and uses asynchronous compression so the compression work can run off the main JavaScript thread. No production speedup was measured. |
| 22 | Low | A failed backend operation left too little information for diagnosis. | Logs identify the operation and, when available, a recognized database error category and the Cloudflare request identifier. Addresses, drafts, codes and raw error messages are excluded. |
| 23 | Negligible | Requests for homepage headers alone could disagree with normal page requests. | Both paths now use the same response logic, including freshness rules for live updates. |
| 24 | Negligible | The main portfolio lacked a configured social preview image. | Added a default image for links shared from the site. Individual platforms control when cached previews refresh. |
| 25 | Negligible | A manuscript formatting marker appeared as a literal asterisk. | The reader renders paired emphasis markers as italics after escaping the text. |
| 26 | Negligible | Photo documentation described an earlier crop and asset set. | Updated the portrait proportions and supported asset descriptions. |

[Certain] The tests also caught an encoding error during the repair. The signup result page now uses a clear heading and a correctly encoded title separator.

## Verification

| Check | Result in this pass |
|---|---|
| Production build | Passed. Generated 15 pages. |
| Automated tests | 17 passed, zero failed or skipped. Coverage includes automatic analytics startup and its exclusions, page generation, content validation, local navigation, HTTP responses, database-backed updates, subscriber eligibility, repeat signups, limits, unsubscribe handling and response headers. Backend tests used local SQLite. |
| Chrome interaction checks | Passed on the rebuilt site. Five main pages at a 320-pixel viewport, contact text spacing, draft recovery after navigation, keyboard reader controls and zero uncaught JavaScript exceptions in those flows. |
| Automated accessibility | 14 URLs at 390 and 1440 pixels, including the 404 page and eight Work detail pages. Zero reported violations in 28 reduced-motion scans. This tests selected rules and page states. |
| Syntax and whitespace | All 34 application, script and test JavaScript files passed Node's syntax check. Git's tracked-diff whitespace check passed. The project has no configured standalone linter. |

## Release and remaining checks

1. Apply the updated subscription SQL to the existing Cloudflare D1 database before publishing the Functions. It adds a daily-limit trigger and a confirmed-recipient list. Verify both exist and the existing Now table is present.
2. Deploy the Functions and rebuilt site together. Verify the live homepage, publishing, browser headers, automatic analytics and contact delivery. The author previously confirmed contact delivery. No new live email was sent during this audit.
3. Before the book release, verify ownership by email, send only to confirmed readers, mark successful deliveries and delete the list within the stated period. Signup itself sends no email. Automated confirmation or delivery would need a configured sender.
4. Physical iPhone/Safari, screen-reader use and real-device performance remain unverified. The original external-link check also left three inconclusive destinations: a UNESCO report, the Saudi LEAP listing and LinkedIn. Access restrictions or timeouts prevented a conclusion about those destinations. Third-party image licences, platform account settings, backups and third-party service internals were outside the code review.

## File inventory

The list below includes every changed source file and every changed built file from this repair. The pre-existing QA.md was left untouched.
- `.github/workflows/verify.yml`
- `content/site.json`
- `dist/_headers`
- `dist/404.html`
- `dist/about/index.html`
- `dist/analytics.css`
- `dist/contact.css`
- `dist/contact/index.html`
- `dist/google-analytics.js`
- `dist/index.html`
- `dist/novel-subscription.js`
- `dist/now-editor.js`
- `dist/work/black-hat-mea/index.html`
- `dist/work/global-airports-forum/index.html`
- `dist/work/graduation-volunteering/index.html`
- `dist/work/index.html`
- `dist/work/layout-study/index.html`
- `dist/work/lead-influence-workshop/index.html`
- `dist/work/leap-riyadh/index.html`
- `dist/work/money2020-middle-east/index.html`
- `dist/work/unesco-ai-forum/index.html`
- `dist/writing/index.html`
- `functions/_middleware.js`
- `functions/api/novel/subscribe.js`
- `functions/api/novel/unsubscribe.js`
- `functions/api/now.js`
- `functions/index.js`
- `package.json`
- `PORTFOLIO-AUDIT.md`
- `public/_headers`
- `public/analytics.css`
- `public/contact.css`
- `public/google-analytics.js`
- `public/novel-subscription.js`
- `public/now-editor.js`
- `README.md`
- `scripts/analytics.mjs`
- `scripts/browser-client.mjs`
- `scripts/check-browser.mjs`
- `scripts/contact.mjs`
- `scripts/layout.mjs`
- `scripts/novel-subscriptions.sql`
- `scripts/novel.mjs`
- `scripts/server.mjs`
- `scripts/storage-errors.mjs`
- `scripts/subscriptions.mjs`
- `tests/build.test.mjs`
- `tests/analytics.test.mjs`
- `tests/edge.test.mjs`
- `tests/now.test.mjs`
- `tests/subscriptions.test.mjs`
