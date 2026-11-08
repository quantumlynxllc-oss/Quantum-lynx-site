> November 8, 2026: the owner changed the CRM to Zoho and purchased quantumlynx.io. See `docs/domain-crm-migration.md` for the current migration and cutover status. The HubSpot configuration below describes the previous release.

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

Production is live at https://quantum-lynx-site.vercel.app. Its settings contain the canonical URL, existing GA4 and HubSpot portal IDs, supplied Formspree backup URL, and a real Cloudflare Turnstile pair. The secret is stored as a sensitive, non-revealable Vercel environment variable. Preview test keys remain preview-only.

Missing configuration:

- `HUBSPOT_PRIVATE_APP_TOKEN`, `HUBSPOT_CONSULT_FORM_GUID`, custom `ql_` fields, and optionally `HUBSPOT_OWNER_ID`. Until these exist, leads go to Formspree.
- `APOLLO_API_KEY`, tracker ID, consult sequence ID, and sending account ID. Missing enrichment does not stop delivery.
- Optional `NEXT_PUBLIC_HUBSPOT_MEETINGS_URL` and owner alert webhook. Placeholder scheduler remains until supplied.

Readiness summaries and nurture follow-up need an owner-managed HubSpot workflow, Formspree automation, or manual response. No newsletter audience is enrolled merely from cookie consent. The app captures the requested summary fields but does not claim to have configured an outbound mail workflow.

The in-app per-IP limiter is process-local. No distributed firewall rate-limit policy was configured. A Vercel Firewall rule on `POST /api/lead` would strengthen enforcement across server instances without adding a database.

## Verification

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

Run the supplied prototype with `python3 -m http.server 8741`. Run the production build with `npm start`. `npm run verify` checks the production app at 1440px, 390px, and 320px; use `CHROME` to select a local Chrome for Testing executable. Screenshots and machine-readable reports are written under ignored `reports/`.

- All prototype routes, including all seven services, were opened before porting.
- The unit suite checks all 729 scored Readiness combinations under every survey-window answer, contract validation, PHI patterns and business-language false positives, routing thresholds, crisis override, backup delivery, optional enrichment, and rate-limit expiry.
- API checks observed patient-detail rejection, unknown-key rejection, honeypot rejection, and a real synthetic lead accepted by the supplied Formspree backup. API acceptance was verified; receipt in the owner's email inbox was not independently checked.
- HubSpot creation and forced-failure behavior are tested with isolated dependencies. Live HubSpot fields and tasks cannot be verified until credentials and properties exist.
- Browser success-screen tests mock only the lead response to avoid duplicate notifications. This is separate from the real backup API acceptance check.

Initial local Lighthouse release-build results (before the owner-approved contrast correction): phone 95 performance, 97 accessibility, 100 best practices, 100 SEO; desktop 100 performance, 97 accessibility, 100 best practices, 100 SEO. Preview SEO scores are lower because preview indexing is intentionally blocked. These are local production-build measurements, not Vercel measurements.

The browser suite checked 45 page/viewport combinations, ten interaction flows, no console errors, and no tracker requests with consent declined. The final local browser run passed all 45 page/viewport checks and ten interaction checks with zero automated accessibility violations, zero unexpected console errors, and zero tracker requests with consent declined. The owner-approved credential contrast correction is included.

## Approved design correction

The supplied `.ql-credentials .k` red has a measured contrast ratio of 3.7:1 against the paper background; WCAG AA requires 4.5:1 at that size. The existing `--fg-accent-light` token is an accessible substitute. The owner approved this substitution on November 2, 2026. The correction lives in app/globals.css; the supplied source CSS remains unchanged.

The reference screenshots include the prototype's assistant link and footer bar; those intentionally disappear in Phase 1 as required by `docs/page-spec.md`. The Readiness form gains the required no-PHI notice and anti-abuse controls.

## Deployment record

Repository: https://github.com/quantumlynxllc-oss/Quantum-lynx-site

Review branch: `codex/website-rebuild-2026-11-02`. Merged pull request: https://github.com/quantumlynxllc-oss/Quantum-lynx-site/pull/1

Current production deployment: `dpl_GYeNmL6dWZ694YQ1KvgYJvVDk68v`, built from merged main commit `315d573df19b23a3cc04c8bd6f756e6643a30c16`. Vercel reports READY, production, and the public alias points to this deployment. The prior deployment `dpl_9arwQB3ehAEfBgYuRfEtX6fX5YyK` is retained for rollback. The existing project is `prj_VXXnVCJSVUbBHyFylroS06IxZQoW` in team `team_uqDdDKFrXCV8dRGdQ17CxFB4`.

## Release

The owner approved the preview and production release. The PR was merged after installing real production Turnstile keys. Vercel built a new production deployment with production environment values and indexable metadata. No new project or domain was created.

Future releases should use a fresh production build after reviewing a preview. Do not promote a preview built with test keys and noindex metadata. Keep the prior deployment available for rollback. The Vercel CLI is not installed; installing it with `npm i -g vercel` is strongly recommended for future maintenance with `vercel env pull`, `vercel deploy`, and `vercel logs`.

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

## Final hosted verification

The final application commit is `c986c48c22f7b7c75370f7f7e567d84b7fdfd261`. Verified deployment: `dpl_21SGKssuwrZcrgQCZXTQfybiJneE`.

Preview: https://quantum-lynx-site-g5mogxq7i-travaughns-projects.vercel.app

The complete hosted browser run passed 45 page/viewport checks and ten interaction checks. Automated accessibility checks found no violations. No unexpected console errors or tracker requests occurred with consent declined. A real synthetic hosted consult submission reached the received confirmation through Formspree while HubSpot was unconfigured. The hosted API rejected patient identifiers, unknown fields, and the honeypot with HTTP 400. Preview robots block indexing, and `/privacy.html` returns the required 301. Reports and the final review screenshot are under ignored `reports/hosted/`.

## Production verification

- All 14 public pages return HTTP 200 and are indexable. The sitemap contains 14 URLs. Both legacy legal URLs return 301 to their matching pages. Evidence: `reports/production/http-verification.json`.
- A synthetic consultation submission on the public production URL, with tracking consent declined, reached “Received. Expect a reply within 1 business day.” This exercised the real Turnstile keys, server validation, and Formspree delivery. Acceptance by the backup service was verified; receipt in the owner's inbox was not independently checked.
- The live Readiness Check produced the expected 6/12 score and three exposures. The automated browser encountered Cloudflare challenge code 300010 and retained the form fields. The owner then tested in a regular browser and confirmed that submission succeeded and displayed “Summary on its way.” Production readiness capture is verified by the owner's report. This confirms intake acceptance, not receipt of an outbound summary email; summary automation remains pending as described above.
- Cloudflare iframe diagnostics were observed during production testing. No first-party application console errors were identified. Local Lighthouse results above must not be represented as production measurements.
- Automatic approval review rejected an additional production test containing synthetic patient-like details before execution. No such payload was sent to production. Patient-detail rejection was verified locally and on preview.
- Screenshot: `reports/production/home-live.jpg`. Source checks (`typecheck`, lint, eight unit tests) passed again during release. HubSpot acceptance and outbound summary automation remain pending the configuration listed above.

This local handoff and the ignored release reports include post-release operational notes. The deployed source is pinned to the merged commit above; later local documentation edits have not triggered another deployment.
