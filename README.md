# Muhammad Subhan — personal portfolio

An original, static, multi-page website built for Muhammad Subhan. No previous website code or assets were copied. Profile facts were read from the supplied LinkedIn profile on 6 October 2026. The current portrait is the user's supplied `Me.jpeg`.

## Edit and rebuild

The complete deployable website is in `dist/`. It works on any static HTTP host.

Authored content lives in `scripts/build.py`, `scripts/details.py`, and `scripts/experiences.py`. Layout rendering lives in `scripts/render.py` and `scripts/home.py`. Shared styles and interaction code are in `dist/assets/`.

Run `python scripts/build.py` after editing copy or templates. Run `python scripts/validate.py` to check local references, anchors, heading structure, content depth, and the replaced email. Start a local preview with `python -m http.server 4173 --bind 127.0.0.1 --directory dist`.

There are no npm dependencies, remote font calls, tracking scripts, or backend services. Fonts and supplied/source photographs are served locally.

## Features

- 48 content routes plus a custom not-found page.
- A first-visit intro with skip, Escape handling, focus management, and a smooth exit.
- A three-chapter homepage sequence controlled by scroll, with linked evidence records, changing layouts, and drawn connections.
- An animated, collapsible directory containing every page, and portfolio-wide search (Ctrl/Cmd K).
- Course/event/journal topic filters and related-page links.
- Guided reading on every information page, with a changing section panel, expandable context, full essay, quick scan, and print styles.
- Eight language levels displayed individually; the scores recorded on LinkedIn are not labelled formal test qualifications.
- A contact composer that opens an editable email draft to `ms@ahmadbaqa.com`. It does not send messages or store form data.

## Editorial and evidence boundaries

Seven course entries were read from the certification section. The same Alison courses in honours were consolidated, not counted as separate awards. Event announcements are marked separately from attendance reflections. The Black Hat CPD claim is attributed to the user's post, rather than independently audited.

Long-form copy is an AI-assisted editorial expansion of profile facts and public posts. Source links remain on the detail pages. The user is framed as a student aspiring towards corporate law, not practising counsel. Future academic and professional milestones are prospective.

The site starts with private Sites access. Public sharing is a separate access choice. Keep `.openai/hosting.json` so later edits publish to the same Site.

## Source material

- Profile: https://www.linkedin.com/in/ms910/
- Specific credential and post links are recorded on each detailed page.
- School, subjects, and expected A-level completion were confirmed by the user's own details in a recent chat.
- New event images were acquired from the supplied LinkedIn profile; no prior portfolio assets were used.

## Preferences

Motion is permanently enabled, with no off switch, as explicitly requested. No motion preference is read or written. Intro-seen state is stored for the browser tab session; storage access is guarded so blocked storage does not prevent the website from working. Very short phone viewports use an unpinned layout to keep the content readable while retaining entry and progress animations.

## Verification

All 48 content routes were checked in the actual browser at 390 px phone, 768 px tablet, and 1440 px laptop widths. A 320 px check found two layout issues, repaired and rechecked. Local route, asset, anchor, duplicate-ID, heading, and content-depth validation passes. Menu, search, story phases, journal archive, reading modes, and form controls were inspected directly. The supplied portrait and UNESCO homepage image are in place, and the old email is absent from the rendered website.
