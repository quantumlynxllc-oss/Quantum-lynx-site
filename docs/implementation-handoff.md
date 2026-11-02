# Website rebuild handoff

Prepared November 2, 2026. This is the Phase 1 rebuild described in `AGENTS.md`.

## Implementation

- Next.js App Router, strict TypeScript, service pages generated from `schema/services.json`.
- The supplied three CSS files are imported in the required order without editing them. A PostCSS filter removes prototype-only `.qs-doc` and `.qs-proto-bar` selectors from the delivered CSS.
- All 14 launch pages plus the not-found page are implemented. Assistant and inbox demos do not ship. Phase 2 privacy content stays hidden.
- Fonts are loaded and hosted by `next/font`. The production font variables use Inter Tight, Inter, and JetBrains Mono. No paid font is assumed.
- Triage and consult share priority. Selecting a different priority preserves entered form values. Service CTAs preselect the consult form with `?priority=`.
- Readiness uses the supplied six scored questions and unscored survey window, with live score, tier, exposures, and timeline mapping.
- One `POST /api/lead` endpoint validates the actual JSON Schema, rejects unknown fields and patient identifiers, checks Turnstile, rejects the honeypot, limits request size, and rate-limits submissions. No request bodies or visitor data are logged.
- HubSpot calls are isolated in `lib/server/hubspot.ts`. Contact creation sets lifecycle and lead status only on creation. Existing stages are preserved. Company association, form submission, scoring, routing fields, and follow-up tasks are implemented.
- Apollo enrichment is optional, skips personal email domains, and uses Next's persistent data cache with a 90-day lifetime. Company data is added in the background. Configured consult sequences are supported; missing sequences leave a manual HubSpot follow-up task.
- Formspree receives a validated backup if HubSpot is unavailable. The endpoint reports success only after a destination accepts the request. If both services fail, the form retains input and asks the visitor to retry.
- Crisis always routes to `call_now`, creates a high-priority task, and sends an owner backup notification. An optional HTTPS alert webhook can reach the owner's phone. It needs configuration and an actual after-hours owner before this can be treated as an operational crisis line.
- GA4, HubSpot, and Apollo tracking are gated by `ql-consent`. Decline keeps forms active. Revoking consent refreshes the page to unload trackers. No lead data is put in browser storage. Forms opt out of automatic HubSpot non-HubSpot form collection with `hs-skip`.
- Route metadata, escaped server-rendered JSON-LD, share image, favicon, sitemap, robots, and exact 301 legacy legal redirects are implemented. Preview deployments are noindex.

## Placeholders intentionally retained

`[HEADSHOT]`, `[CRISIS LINE]`, `[BUSINESS EMAIL]`, and `[HUBSPOT MEETINGS SCHEDULER]` remain visible where specified. The owner asked to continue without these. No replacement phone, email, headshot, domain, or unsupported claim was invented.

## Integration state

The Vercel project originally had no environment variables. Preview-only settings now contain the supplied canonical URL, existing GA4 and HubSpot IDs, Cloudflare test keys, and the supplied Formspree backup URL. No production environment variables were changed.

Missing configuration:

- `HUBSPOT_PRIVATE_APP_TOKEN`, `HUBSPOT_CONSULT_FORM_GUID`, custom `ql_` fields, and optionally `HUBSPOT_OWNER_ID`. Until these exist, leads go to Formspree.
- `APOLLO_API_KEY`, tracker ID, consult sequence ID, and sending account ID. Missing enrichment does not stop delivery.
- A real Turnstile key pair for production. Dummy keys are accepted only outside Vercel production. Production submissions fail closed when real verification is missing.
- Optional `NEXT_PUBLIC_HUBSPOT_MEETINGS_URL` and owner alert webhook. Placeholder scheduler remains until supplied.

Readiness summaries and nurture follow-up need an owner-managed HubSpot workflow, Formspree automation, or manual response. No newsletter audience is enrolled merely from cookie consent. The app captures the requested summary fields but does not claim to have configured an outbound mail workflow.

The in-app per-IP limiter is process-local. Configure a Vercel Firewall rate-limit rule on `POST /api/lead` before a public production launch for enforcement across server instances. This avoids adding a launch database.

## Verification

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

Run the supplied prototype with `python3 -m http.server 8741`. Run the production build with `npm start`. `npm run verify` checks the production app at 1440px, 390px, and 320px; use `CHROME` to select a local Chrome for Testing executable. Screenshots and machine-readable reports are written under ignored `reports/`.

- All prototype routes, including all seven services, were opened before porting.
- The unit suite checks all 729 scored Readiness combinations under every survey-window answer, contract validation, PHI patterns and business-language false positives, routing thresholds, crisis override, backup delivery, optional enrichment, and rate-limit expiry.
- API checks observed patient-detail rejection, unknown-key rejection, honeypot rejection, and a real synthetic lead accepted by the supplied Formspree backup. API acceptance was verified; receipt in the owner's email inbox was not independently checked.
- HubSpot creation and forced-failure behavior are tested with isolated dependencies. Live HubSpot fields and tasks cannot be verified until credentials and properties exist.
- Browser success-screen tests mock only the lead response to avoid duplicate notifications. This is separate from the real backup API acceptance check.

Local Lighthouse release-build results: phone 95 performance, 97 accessibility, 100 best practices, 100 SEO; desktop 100 performance, 97 accessibility, 100 best practices, 100 SEO. Preview SEO scores are lower because preview indexing is intentionally blocked. These are local production-build measurements, not Vercel measurements.

The browser suite checked 45 page/viewport combinations, ten interaction flows, no console errors, and no tracker requests with consent declined. The final local browser run passed all 45 page/viewport checks and ten interaction checks with zero automated accessibility violations, zero unexpected console errors, and zero tracker requests with consent declined. The owner-approved credential contrast correction is included.

## Approved design correction

The supplied `.ql-credentials .k` red has a measured contrast ratio of 3.7:1 against the paper background; WCAG AA requires 4.5:1 at that size. The existing `--fg-accent-light` token is an accessible substitute. The owner approved this substitution on November 2, 2026. The correction lives in app/globals.css; the supplied source CSS remains unchanged.

The reference screenshots include the prototype's assistant link and footer bar; those intentionally disappear in Phase 1 as required by `docs/page-spec.md`. The Readiness form gains the required no-PHI notice and anti-abuse controls.

## Deployment record

Repository: https://github.com/quantumlynxllc-oss/Quantum-lynx-site

Review branch: `codex/website-rebuild-2026-11-02`. Draft pull request: https://github.com/quantumlynxllc-oss/Quantum-lynx-site/pull/1

The existing production deployment `dpl_9arwQB3ehAEfBgYuRfEtX6fX5YyK` is retained. Review deployments use the existing project `prj_VXXnVCJSVUbBHyFylroS06IxZQoW` in team `team_uqDdDKFrXCV8dRGdQ17CxFB4`.

## Release

Publish a preview in the existing `quantum-lynx-site` project from the confirmed `quantumlynxllc-oss/Quantum-lynx-site` repository. Keep `main` and the current production deployment unchanged until the owner reviews the preview and approves release. Do not create a project or connect a domain.

Before production promotion, copy the approved public settings into production, install real Turnstile keys, verify the operational lead destination and crisis contact, review the legal pages, and rerun the live integration checks. Keep the prior production deployment available for rollback.

## API references checked during implementation

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [HubSpot Contacts](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/contacts/guide)
- [HubSpot Forms](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/guide)
- [Apollo enrichment](https://docs.apollo.io/reference/organization-enrichment)
- [Apollo sequence enrollment](https://docs.apollo.io/reference/add-contacts-to-sequence)
- [Cloudflare validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Formspree JSON submission](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/)

The Apollo tracking script was fetched successfully from the official `assets.apollo.io` host and its `trackingFunctions.onLoad({appId})` callback was checked before implementation.
