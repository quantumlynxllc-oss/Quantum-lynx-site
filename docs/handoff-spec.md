# Handoff spec: Quantum Lynx marketing site

## Overview

A marketing site with one job: move a hospital leader from "I have a problem" to a conversation with a CIC. Three capture surfaces feed one endpoint: the consult form, the Readiness Check, and the intake assistant.

The visitor usually arrives with a specific problem, not a wish to browse. That is why the hero opens with a triage desk instead of a service list.

## Layout

- Container: max width 1240px, 32px side padding, 20px on phones (`.ql-container`).
- Section rhythm: 96px vertical, 56px on phones (`.ql-section`).
- Grids use `repeat(auto-fit, minmax(min(<min>, 100%), 1fr))`, so they collapse without breakpoints.
- Home section order: Hero, Service lines, How it works, Readiness Check, Field record, Client voices, Principal, Consult, Footer.

## Design tokens

Use the variables. Do not copy hex values into components.

| Token | Value | Usage |
|---|---|---|
| `--ql-slate-900` | #0B0F14 | Hero, dark bands, primary text |
| `--ql-paper` | #F7F7F5 | Page background |
| `--ql-bone` | #EEEEEA | Quiet panels, chat bubbles |
| `--ql-hairline` | #E2E2DE | 1px borders |
| `--ql-gradient` | Magenta to crimson to orange, 120deg | Logo, rules, accent word |
| `--ql-gradient-cta` | Deeper ramp | Primary buttons. White text passes AA |
| `--fg-caption` | #5B6470 | Small text on light. Replaces `--fg-3`, which fails contrast |
| `--fg-accent-light` | #B0136A | Small accent text on light. Crimson fails contrast |
| `--font-display` | Inter Tight | Headings |
| `--font-sans` | Inter | Body and UI |
| `--font-mono` | JetBrains Mono | Numbers, labels, data |
| `--dur-base`, `--ease-standard` | 200ms, cubic-bezier(.2,.7,.2,1) | Default motion |

Neue Haas Grotesk is first in the font stack but is a paid face. Inter Tight and Inter are what ship unless the owner buys a license.

## Logo

- `assets/ql-helix.svg` is a vector trace of the owner's PNG. Use it for the header, favicon, and footer.
- The words are set in Inter Tight in the header. The serif wordmark in `assets/ql-logo-original.png` stays on documents.
- Minimum height 32px. Never recolor, stretch, or rotate it.

## Components

| Component | Variant | Props | Notes |
|---|---|---|---|
| Nav | Sticky on desktop, static on phones | `current` | Blur only on this surface |
| Footer | None | None | Services, Company, and Legal columns. See `docs/page-spec.md` |
| ConsentBanner | open, closed | `onAccept`, `onDecline` | Accept and Decline are the same size and style |
| LegalPage | sla, privacy | `page` | Renders from `schema/legal.json`. Hides `phase: 2` sections until Phase 2 |
| ProofNote | None | `text` | One line under the hero stats, from `proofNote` |
| Button | primary, secondary, ghost, ghost-dark | `href` or `onClick` | One primary per viewport |
| TriageDesk | None | `value`, `onChange` | Shares its value with the consult form priority |
| RungLedger | None | `services[]` | A table in spirit. Never turn it into cards |
| ProofRow | None | `proof[]` | Numbers use the display face, not mono |
| ConsultForm | form, sent | `priority`, `channel` | Five required fields, see below |
| ReadinessCheck | empty, partial, complete, sent | `questions[]` | Panel updates on each answer |
| AssistantPanel | closed, open, handoff | None | Phase 2. Always shows the Automated tag |
| QuoteCard | None | `text`, `role`, `org` | No star ratings |
| Placeholder | None | `label` | Dashed box for missing content |

## Consult form

Required: name, work email, facility, role, priority.
Hidden: honeypot `website`, Turnstile token, attribution fields.

Do not add fields. Apollo fills in the company data, and every extra field costs conversions.

Show the "Do not include patient information" line under the button. Render Turnstile in managed mode with `appearance: "interaction-only"` directly above the button, so most visitors never see it.

| Field | Error message |
|---|---|
| Name | Enter your name. |
| Work email | Enter a valid work email. |
| Facility | Enter your facility. |
| Role | Enter your role. |
| Priority | Select a priority. |

## States and interactions

| Element | State | Behavior |
|---|---|---|
| Primary button | Hover | Shadow accent, lift 1px |
| Primary button | Press | Scale .98, 80ms |
| Primary button | Loading | Disabled, label "Sending" |
| Triage option | Selected | Slate fill, gradient tick, `aria-pressed="true"` |
| Triage option | Change | Result, CTA label, and form priority update together |
| Ledger row | Hover and focus | Gradient rule draws left to right, 360ms |
| Form field | Focus | Crimson border and 3px ring |
| Form field | Invalid | `--ql-alert` border, message below, `aria-describedby` |
| Form | Sending | Inputs disabled, button loading |
| Form | Success | Replaced by confirmation and the scheduler |
| Form | Server error | Keep the entered values, show "Try again, or email [BUSINESS EMAIL]" |
| Crisis priority | Selected | CTA becomes "Request crisis response", first response shows "Priority response" |
| Crisis priority | Sent | Confirmation shows `[CRISIS LINE]` first |
| Readiness chip | Selected | Slate fill, score recalculates at once |
| Readiness panel | Empty | Score 0, no exposures or email form |
| Assistant | Patient details detected | Message dropped, guard message shown, nothing stored |
| Consent banner | First visit | Shows bottom right. Does not block the page or take focus |
| Consent banner | Accept | Saves `accepted`, closes, then loads trackers |
| Consent banner | Decline | Saves `declined`, closes. No tracker loads. Forms still work |
| Consent banner | Cookie settings | The footer link reopens the banner |
| Cookie settings | Choice changes to Decline | Stops trackers from loading on the next page view |

## Responsive behavior

| Breakpoint | Changes |
|---|---|
| Over 860px | Ledger is 5 columns. Score panel is sticky |
| Up to 860px | Ledger stacks. Score panel is static |
| Up to 700px | Nav is static, brand subtitle hides, links take their own row, footer links grow to 44px targets |
| 320px | No horizontal scroll |

Why the nav goes static on phones: it wraps to two rows and would take 15% of the screen on every scroll.

## Edge cases

- **Long facility names**: wrap. Never truncate lead data.
- **Free email domains**: accept them, score lower, no Apollo lookup.
- **Repeat visitor**: updates the same Zoho Lead.
- **Slow connection**: the page works without JS for reading. Forms show a loading state after 200ms.
- **Fonts fail**: system stack holds the layout.
- **Scheduler fails to load**: show "We will email you times instead."
- **Consent declined**: forms still work. Trackers stay off.
- **Storage blocked**: the consent choice lasts for that visit, and the banner returns on the next one.
- **Unknown route**: show the not-found page from `pages.missing`, with a link to Home.

## Animation

| Element | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Ledger rule | Hover or focus | scaleX 0 to 1 | 360ms | standard |
| Button | Hover | Lift and glow | 200ms | standard |
| Score bar | Answer | Width | 360ms | standard |
| Page | Route change | Fade, 8px rise | 200ms | entrance |

No bounces, springs, or parallax. Honor `prefers-reduced-motion`.

## Accessibility

- Focus order follows reading order. In the hero: CTAs, then triage options, then the triage CTA.
- Focus ring: 2px `--ql-accent`, 2px offset, on every interactive element.
- Triage and Readiness choices are real buttons with `aria-pressed`.
- `aria-live="polite"` on the triage result, score panel, and chat log.
- Every input has a visible `<label>`. Errors link with `aria-describedby`.
- Decorative helix images use `alt=""`.
- Add a skip link to main content.
- After a triage change, focus stays on the selected option.
- Each page has one `h1`. The consult heading is the `h1` on `/consult` and an `h2` on Home.
- Tables on the SLA page use `th scope="col"`.
- The consent banner is an `aside` with `aria-label="Cookie choices"`. Do not trap focus in it.
