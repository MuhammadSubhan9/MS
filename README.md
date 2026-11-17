# Muhammad Subhan — personal portfolio

Requires Node 22 or later. No package installation is needed.

Run `node scripts/build.mjs` to create the public static site in `dist`.
Run `node scripts/server.mjs` to inspect it at http://127.0.0.1:4173.
Run `node scripts/server.mjs --preview` for the local fixture preview, generated separately in `.preview`. Never deploy that directory.
Run `node --test` for content gating, routing, escaping and production isolation checks.

## Content integration

Edit `content/site.json` to update the live-ready copy. Home, About and Work draw on the existing portfolio, and Contact uses the supplied email. Empty sections automatically disappear. Add new projects, writing and other public contact methods as they are supplied.

Chronology entries accept `date`, `title`, `institution`, `status`, `role`, `description`, `outcome` and `details` (paragraph array). Set `current` on the qualification that should appear on Home. Projects and articles accept a unique lowercase hyphenated `slug`, `title`, `date`, `category`, `description`, optional `body` paragraphs and optional HTTPS `url`. Detailed pages appear when body paragraphs or structured `sections` exist. Each section has a `title` and `paragraphs` array. Optional `sources` contain a `label` and HTTPS `url`. ISO publication dates display as day, month and year. Put articles in reading order to control previous and next links. Set `selected` to true on projects to include them on Home. Work leads with the first selected project. Short projects remain readable directly in the index.

Use `workIntroduction` and `writingIntroduction` for approved index introductions. Contact accepts `introduction`, `email`, an optional approved `phone`, `links` with `label`, `url` and optional `display`, and an optional local PDF path in `cv`. Put approved assets in `public`. Missing linked local assets fail the build. Verify external destinations before publishing.

The contact form uses the verified SilentForms endpoint in `contact.formEndpoint`. The public email shown on the page uses `contact.email`. To replace the delivery service, use an activated HTTPS endpoint that accepts form data and returns a JSON acknowledgement after accepting the message. The form recognises `ok: true`, `status: "success"` or `success: true`.

The optional `portrait` and project `image` fields accept `src`, descriptive `alt`, integer `width` and `height`, optional `caption`, and optional `sources` entries with `src` and `width` for responsive delivery. Supply compressed WebP or AVIF assets at appropriate sizes. The Home portrait is framed in a 4:5 crop and the featured Work image uses 16:10. The photos in `public/images` are responsive WebP copies from the [existing portfolio](https://muhammadsubhan.pages.dev/).

The canonical domain is [muhammadsubhan.pages.dev](https://muhammadsubhan.pages.dev/). Add an approved absolute social image URL to `seo.image` if available. The local server binds to loopback only.

## Design decisions

Warm ivory, stone beige and charcoal form the base palette. Forest emerald (#285547) marks the active navigation item, keyboard focus and directional details. Muted text uses #62594F for contrast. Locally hosted DM Serif Text and Source Sans 3 use Latin WOFF2 subsets totalling 40,208 bytes. Their OFL licenses are in `public/fonts`. Native disclosures, static routes and an HTML navigation fallback keep the site usable without JavaScript.

## Verification and publication

Cloudflare Pages serves the committed `dist/` directory from the `main` branch. Run `node --test`, then include the rebuilt `dist/` alongside the source changes in each release commit. The repository contains the public portfolio copy and reading excerpt. Keep supporting documents, drafts and credentials out of it. Use `public/_redirects` to keep legacy URLs working.

To update Now, press Ctrl+K (or Cmd+K on Mac), type `edit now` and press Enter. In GitHub, edit `content/now.txt` and commit it to `main`. Keep the first line in YYYY-MM-DD format and separate each paragraph with a blank line. GitHub Actions rebuilds the page and commits its generated HTML for Cloudflare.
