# Page spec

What to build on each route, in what order, and where each piece comes from. Use the copy exactly as written. Do not rewrite it, shorten it, or add sections.

## Where the copy lives

| Copy | Source |
|---|---|
| Service lines, triage options, stats, proof note, steps, field record, quotes, principal | `schema/services.json` |
| Readiness questions, scoring, tiers, disclaimer | `schema/readiness.json` |
| SLA and Privacy | `schema/legal.json` |
| Page titles and meta descriptions | `schema/site.json` |
| Hero text, section headings, button labels, confirmations | The named function in `prototype/app.js`. Copy each string as is |

## Routes

Reference images are in `design/reference/`, named `<page>-desktop.png` (1440px) and `<page>-phone.png` (390px).

| Path | Prototype route | Function in `app.js` | Reference image | Phase |
|---|---|---|---|---|
| `/` | `#/` | `pages.home` | `home` | 1 |
| `/services` | `#/services` | `pages.services` | `services` | 1 |
| `/services/[slug]` | `#/services/<slug>` | `pages.service` | `service-survey-support` | 1 |
| `/readiness-check` | `#/readiness-check` | `pages.readiness` | `readiness-empty`, `readiness-complete` | 1 |
| `/consult` | `#/consult` | `pages.consultPage` | `consult`, `consult-sent` | 1 |
| `/about` | `#/about` | `pages.about` | `about` | 1 |
| `/sla` | `#/sla` | `pages.legal('sla')` | `sla` | 1 |
| `/privacy` | `#/privacy` | `pages.legal('privacy')` | `privacy` | 1 |
| Not found | Any other hash | `pages.missing` | None | 1 |
| Assistant panel | `#/assistant` | `pages.assistant` | `assistant` | 2 |

`/consult` and `/about` drop the section numbers from their eyebrows. The numbers run in order on Home only. On `/consult`, the main heading is the page's `h1`.

## Every page

**Header:** `nav()`. Brand link, Services, Readiness Check, About, and a "Schedule a consult" button linking to `/consult`. Set `aria-current="page"` on the current section.

**Footer:** `footer()`. Three link columns:

- Services: All service lines, Readiness Check
- Company: About, LinkedIn
- Legal: Privacy and HIPAA/BAA, Service Level Agreement, Cookie settings

The bottom line reads "© 2026 Quantum Lynx LLC" and "NO PHI IN FORMS OR CHAT."

**Consent banner:** `consentBanner()`. See `docs/handoff-spec.md`. Reference image: `consent-banner`.

## Home

| Order | Section | Function | Data |
|---|---|---|---|
| 1 | Hero, triage desk, stats, proof note | `hero()`, `triagePanel()` | `triage`, `proof`, `proofNote` |
| 2 | 01 / Service lines | `ledger()` | `services` |
| 3 | 02 / How it works | `steps()` | `steps` |
| 4 | 03 / Readiness Check teaser | `readinessTeaser()` | Fixed sample result, labeled as a sample |
| 5 | 04 / Field record | `record()` | `record`, plus the 12,000 callout |
| 6 | 05 / Client voices | `quotes()` | `quotes`, 2 by 2 |
| 7 | 06 / Principal | `principal()` | `principal` |
| 8 | 07 / Engagement | `consult()`, `consultBody()` | `triage` |

The triage desk and the consult form share one value. On Home, the triage button scrolls to `#consult` and keeps the selected priority.

## Services and service pages

`/services` is the page head plus the service ledger. Each row links to `/services/<slug>`.

Each service page has the page head, a left tab list of all seven services, and an article with "Use it when," "You get," and two buttons. The primary button links to `/consult?priority=<priority>`, and the form preselects that priority. Generate all seven pages with `generateStaticParams`.

## Readiness Check

Follow `pages.readiness` and `scorePanel()`. The panel updates on every answer. The email form appears after the first scored answer. The `window` question is not scored. It sets `timeline` on the lead.

## Consult

`/consult` shows the same section as Home step 8. After submit, the form is replaced by the confirmation and the scheduler. Crisis requests show `[CRISIS LINE]` first.

## About

Page head, then Principal, Field record, and Client voices, in that order.

## SLA and Privacy

Use one `LegalPage` template for both:

1. Dark page head from `head()`, showing `eyebrow`, `title`, and `lede`.
2. "Last updated" date in `.qs-legal-date`.
3. One `section` per entry in `sections`. Show the heading, then `table`, `paragraphs`, and `items`, in that order, if present.

Hide any section with `"phase": 2` until Phase 2 ships. Do not add a call to action to these pages.

## Prototype only: do not ship

- The bar under the footer (`.qs-proto-bar`).
- `#/inbox`, and the "See the lead record" and "Send another" buttons on the consult confirmation.
- `#/assistant` as a page. The real assistant is `AssistantPanel`, in Phase 2.
- The "Talk it through with the intake assistant" link in the triage panel (`.qs-alt`). Add it back in Phase 2.
- `localStorage` lead storage. Real leads go to `POST /api/lead`.
- The `noindex` tag in `prototype/index.html`.
- The `.qs-doc` and `.qs-proto-bar` styles.

## Saved originals

`docs/source-site/` holds the existing site's Home, SLA, and Privacy pages for reference. Do not publish from those files.
