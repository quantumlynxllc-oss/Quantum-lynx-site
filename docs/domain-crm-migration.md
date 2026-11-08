# Domain and Zoho migration — November 8, 2026

The owner purchased `quantumlynx.io` at Namecheap and requested Zoho CRM instead of HubSpot. The existing production project is `quantum-lynx-site`; its Git source is `quantumlynxllc-oss/Quantum-lynx-site`. This change preserves the page layout, service claims, PHI checks, Turnstile validation, consent controls, and Formspree fallback.

## Completed account changes

- Added `quantumlynx.io` to the existing Vercel project. Vercel reports ownership verified.
- Added `www.quantumlynx.io` with a permanent 308 redirect to `quantumlynx.io`.
- Set the canonical URL for the migration branch's Vercel preview to `https://quantumlynx.io`.
- Confirmed Zoho connector access by creating a synthetic Lead, attaching a note, and creating and reading a completed test task linked to that Lead. Test Lead ID: `7668958000000706001`; note ID: `7668958000000707001`; completed task ID: `7668958000000708001`. Test email is `website-integration-test@example.org`. No email campaign or notification was sent through the connector.
- All eleven attempted custom fields returned `LIMIT_EXCEEDED`. No fields were created and no subscription was changed. The website stores the complete structured intake context in attached notes and task descriptions.

## Source changes

`lib/server/zoho.ts` replaces the HubSpot integration. It refreshes server-only OAuth tokens, matches exact primary email, upserts new Leads, appends intake notes, and creates linked follow-up tasks. An API response is accepted only when the individual record reports success. A failed primary delivery falls back to Formspree before the visitor sees success. Existing owner, lead status, description, and email preferences are not reset. Email-only readiness submissions preserve known names. Standard CRM field length limits are respected; notes keep the original submitted values.

The HubSpot tracking script and cookie collection are removed. GA4 and optional Apollo remain consent-gated. Privacy now identifies Zoho CRM. The scheduler uses optional `NEXT_PUBLIC_ZOHO_BOOKINGS_URL`; `[ZOHO BOOKINGS SCHEDULER]` remains visible until a link is supplied. `[HEADSHOT]`, `[CRISIS LINE]`, and `[BUSINESS EMAIL]` remain unchanged. Historical HubSpot data has not been migrated.

## Account steps still required

Chrome could not be attached through the available browser connection on two attempts. Namecheap, Cloudflare, and the Zoho API console could not be opened. These steps require reconnecting the browser or owner action.

1. **Namecheap DNS:** open the domain's Advanced DNS. Replace only the conflicting website parking/URL redirect records. Vercel's current rank-one recommendations are A records on `@` with values `216.198.79.1` and `64.29.17.1`, and a CNAME on `www` with value `b8cb04870f3c473e.vercel-dns-017.com`. Recheck Vercel's domain-specific recommendations immediately before editing. Keep nameservers, MX, email-verification TXT, and other unrelated records. The latest check still showed Namecheap parking/redirect DNS, so the custom domain is not serving the site yet.
2. **Cloudflare Turnstile:** add `quantumlynx.io` and `www.quantumlynx.io` to the existing Quantum Lynx widget's hostname allowlist. Keep `quantum-lynx-site.vercel.app` allowed during transition. Keep production verification enabled; do not use test keys in production.
3. **Zoho website OAuth:** authorize a website-specific client for the intended organization. The chat connector cannot pass its authorization to Vercel. Required scopes are `ZohoCRM.modules.leads.READ,ZohoCRM.modules.leads.CREATE,ZohoCRM.modules.leads.UPDATE,ZohoCRM.modules.notes.CREATE,ZohoCRM.modules.tasks.CREATE,ZohoSearch.securesearch.READ`. Store `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, and `ZOHO_REFRESH_TOKEN` directly as sensitive Vercel variables, with `ZOHO_ACCOUNTS_URL` matching the account's region. Do not put tokens in chat, source, logs, URLs, or the client bundle.
4. **Formspree:** confirm the new domain is permitted if domain restrictions are enabled. Keep the existing failover endpoint.
5. **Release:** verify a real preview form submission reaches Zoho with its note and task, and verify forced primary failure reaches Formspree. After DNS, HTTPS, and Turnstile work, set production `NEXT_PUBLIC_SITE_URL=https://quantumlynx.io`, remove the retired HubSpot environment variables, merge and deploy this branch, and verify both hostnames, canonical links, sitemap, robots and the old legal redirects. Update the GA4 web stream and Search Console property/sitemap for the new domain.

The existing production deployment and its canonical URL have not been changed by this migration. Leads there continue to use the existing Formspree delivery path. Until website OAuth is configured, the migration code also falls back to Formspree; connector verification alone is not proof of unattended website delivery.

## Validation and recovery

- TypeScript, lint, and all 14 unit/integration tests pass, including PHI rejection, readiness scoring, primary-destination failure, per-record Zoho errors, token refresh, existing-name preservation and crisis routing.
- The production build passes with `NEXT_PUBLIC_SITE_URL=https://quantumlynx.io`.
- The prototype data was rebuilt, and all 24 desktop/phone reference captures were regenerated. Earlier reference images and changed source instructions are preserved under ignored `reports/domain-crm-migration/`.
- Local browser verification passed 45 page/viewport checks and ten interactions, with zero console errors, tracker requests after Decline, or automated accessibility violations. Evidence is in `reports/browser/verification.json`.
- Draft review: https://github.com/quantumlynxllc-oss/Quantum-lynx-site/pull/2. The first Git-triggered migration preview reached READY. The connector could not fetch its protected content: Vercel Authentication rejected the temporary share link. Hosted form verification remains pending authenticated browser access.
- Existing production rollback: `dpl_GYeNmL6dWZ694YQ1KvgYJvVDk68v`, commit `315d573df19b23a3cc04c8bd6f756e6643a30c16`.

For future deployment administration, install the Vercel CLI with `npm i -g vercel`. Marketplace discovery through a temporary CLI required a separate Vercel login; the connected Vercel tools were used for project changes.

## API references

- [Zoho upsert](https://www.zoho.com/crm/developer/docs/api/v8/upsert-records.html)
- [Zoho token refresh](https://www.zoho.com/crm/developer/docs/api/v8/refresh.html)
- [Zoho notes](https://www.zoho.com/crm/developer/docs/api/v8/create-notes.html)
- [Zoho records and tasks](https://www.zoho.com/crm/developer/docs/api/v8/insert-records.html)
- [Zoho booking URLs](https://help.zoho.com/portal/en/kb/bookings/general-setup/articles/bookings-booking-page-url)
