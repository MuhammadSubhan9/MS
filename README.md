# Muhammad Subhan — personal portfolio

Requires Node 22.13 or later. No package installation is needed.

Run `node scripts/build.mjs` to create the public static site in `dist`.
Run `node scripts/server.mjs` to inspect it at http://127.0.0.1:4173.
Run `node scripts/server.mjs --preview` for the local fixture preview, generated separately in `.preview`. Never deploy that directory.
Run `node --test` for content gating, routing, escaping and production isolation checks.

## Content integration

Edit `content/site.json` to update the live-ready copy. Home, About and Work draw on the existing portfolio, and Contact uses the supplied email. Empty sections automatically disappear. Add new projects, writing and other public contact methods as they are supplied.

Chronology entries accept `date`, `title`, `institution`, `status`, `role`, `description`, `outcome` and `details` (paragraph array). Set `current` on the qualification that should appear on Home. Projects and articles accept a unique lowercase hyphenated `slug`, `title`, `date`, `category`, `description`, optional `body` paragraphs and optional HTTPS `url`. Detailed pages appear when body paragraphs or structured `sections` exist. Each section has a `title` and `paragraphs` array. Optional `sources` contain a `label` and HTTPS `url`. ISO publication dates display as day, month and year. Put articles in reading order to control previous and next links. Set `selected` to true on projects to include them on Home. Work leads with the first selected project. Short projects remain readable directly in the index.

Use `workIntroduction` and `writingIntroduction` for approved index introductions. Contact accepts `introduction`, `email`, an optional approved `phone`, `links` with `label`, `url` and optional `display`, and an optional local PDF path in `cv`. Put approved assets in `public`. Missing linked local assets fail the build. Verify external destinations before publishing.

The contact form uses the verified SilentForms endpoint in `contact.formEndpoint`. The public email shown on the page uses `contact.email`. To replace the delivery service, use an activated HTTPS endpoint that accepts form data and returns a JSON acknowledgement after accepting the message. The form recognises `ok: true`, `status: "success"` or `success: true`.

The evidence map uses the subject tags on projects and courses. The capabilities and Journey sections refer to the same records by keys such as `work:global-airports-forum` and `education:igcses`. Keep IDs stable so shared links keep working. Enter Journey milestones oldest first and use date labels that match the source records. Event briefs use the record's logo or an optional milestone-specific logo.

For a major site update, replace `siteUpdate` in `content/site.json` with a new ID, date and a few links to the changes. Returning visitors using the same browser can see the notice after the ID changes, and the homepage footer always links to the latest briefing.

The optional `portrait` and project `image` fields accept `src`, descriptive `alt`, integer `width` and `height`, optional `caption`, and optional `sources` entries with `src` and `width` for responsive delivery. Supply compressed WebP or AVIF assets at appropriate sizes. The Home portrait is framed in a 4:5.8 crop and the featured Work image uses 16:10. The image directory includes WebP, JPEG and PNG assets.

The canonical domain is [muhammadsubhan.pages.dev](https://muhammadsubhan.pages.dev/). Add an approved absolute social image URL to `seo.image` if available. The local server binds to loopback only.

Google Analytics starts automatically on the configured public origin. The footer explains the analytics services. The site has no analytics preference buttons and ignores older saved site preferences. Local previews, direct editing links and browser privacy signals continue to be excluded.

## Design decisions

Warm ivory, stone beige and charcoal form the base palette. Forest emerald (#285547) marks the active navigation item, keyboard focus and directional details. Muted text uses #62594F for contrast. Locally hosted DM Serif Text and Source Sans 3 use Latin WOFF2 subsets totalling 40,208 bytes. Their OFL licenses are in `public/fonts`. Native disclosures, static routes and an HTML navigation fallback keep the site usable without JavaScript.

## Verification and publication

Cloudflare Pages serves the committed `dist/` directory from the `main` branch. Run `node --test`, then include the rebuilt `dist/` alongside the source changes in each release commit. The repository contains the public portfolio copy and reading excerpt. Keep supporting documents, drafts and credentials out of it. Use `public/_redirects` to keep legacy URLs working.

To update the Now section on the homepage, go to `/#edit`. Edit the text, enter the publishing code and select **Publish update**. Saving updates the date in Riyadh time. The same publishing code unlocks Ctrl+K for 30 minutes across tabs in that browser. After the session expires, Ctrl+K opens the Now editor so the owner can unlock again.

The production Pages project needs a D1 binding named `NOW_DB` provisioned with `scripts/now-schema.sql`, and an encrypted secret named `NOW_EDITOR_CODE`. The editor accepts 8 to 128 printable ASCII characters without whitespace. Prefer a long random code and keep it out of the repository. Short codes also require a separate `NOVEL_SIGNUP_SECRET` of at least 24 characters to sign Ctrl+K sessions. The build uses `content/now.txt` for the initial page. The deployed editor stores later updates in D1.

The novel release form stores opt-ins in the same D1 database, using `scripts/novel-subscriptions.sql`. It requires an encrypted `NOVEL_SIGNUP_SECRET` for the signup limits. Apply both SQL files before deploying any Functions changes, including upgrades of existing databases.

Signup saves a pending request. Before release, the author sends each pending reader an individual confirmation request from the public contact address. Only an affirmative reply from that same address verifies ownership. Mark that specific row with a bound update setting `consent_version = 'novel-release-confirmed-v1'`. Existing unverified requests follow the same process. Send the announcement only on the author's instruction and only to rows in `novel_release_recipients`. Include the recipient's private unsubscribe URL (`/api/novel/unsubscribe?token=...`) and set that row's `notified_at` after successful delivery. Delete all subscriber rows within 30 days of release, including unconfirmed requests. Confirmation, dispatch and final deletion are operator tasks. Keep addresses and tokens out of public artifacts and Git.
