# Domain and Zoho migration — November 8, 2026

The owner purchased `quantumlynx.io` at Namecheap and requested Zoho CRM instead of HubSpot. The existing production project is `quantum-lynx-site`; its Git source is `quantumlynxllc-oss/Quantum-lynx-site`. This change preserves the page layout, service claims, PHI checks, Turnstile validation, consent controls, and Formspree fallback.

## Completed account changes

- Added `quantumlynx.io` to the existing Vercel project. Vercel reports ownership verified.
- Added `www.quantumlynx.io` with a permanent 308 redirect to `quantumlynx.io`.
- Set `NEXT_PUBLIC_SITE_URL=https://quantumlynx.io` for production and the migration preview. The next production build will use it for metadata and the sitemap.
- Updated Namecheap: two apex A records (`216.198.79.1`, `64.29.17.1`) and the `www` CNAME (`b8cb04870f3c473e.vercel-dns-017.com`). Kept BasicDNS nameservers, the original SPF TXT record, and all five forwarding MX records. Public DNS checks passed.
- Added both hostnames to the existing Turnstile widget while keeping the old Vercel hostname allowed.
- Issued an automatically renewing certificate for both names. Verified HTTPS 200 on the apex and HTTPS 308 to the apex from `www` using Vercel's current addresses. Some local DNS caches may take longer to update.
- After explicit owner approval, created a website-only Zoho OAuth self client for the Quantum Lynx production organization. Client ID, secret and refresh token are sensitive Vercel production/preview variables. The exchange used a temporary loopback-only helper and process memory; no credentials were saved to disk.
- Cleared the retired HubSpot portal environment setting. No new Zoho marketing tracker was installed.
- Confirmed Zoho connector access by creating a synthetic Lead, attaching a note, and creating and reading a completed test task linked to that Lead. Test Lead ID: `7668958000000706001`; note ID: `7668958000000707001`; completed task ID: `7668958000000708001`. Test email is `website-integration-test@example.org`. No email campaign or notification was sent through the connector.
- All eleven attempted custom fields returned `LIMIT_EXCEEDED`. No fields were created and no subscription was changed. The website stores the complete structured intake context in attached notes and task descriptions.

## Source changes

`lib/server/zoho.ts` replaces the HubSpot integration. It refreshes server-only OAuth tokens, matches exact primary email, upserts new Leads, appends intake notes, and creates linked follow-up tasks. An API response is accepted only when the individual record reports success. A failed primary delivery falls back to Formspree before the visitor sees success. Existing owner, lead status, description, and email preferences are not reset. Email-only readiness submissions preserve known names. Standard CRM field length limits are respected; notes keep the original submitted values.

The HubSpot tracking script and cookie collection are removed. GA4 and optional Apollo remain consent-gated. Privacy now identifies Zoho CRM. The scheduler uses optional `NEXT_PUBLIC_ZOHO_BOOKINGS_URL`; `[ZOHO BOOKINGS SCHEDULER]` remains visible until a link is supplied. `[HEADSHOT]`, `[CRISIS LINE]`, and `[BUSINESS EMAIL]` remain unchanged. Historical HubSpot data has not been migrated.

## Delivery verification and release

The owner signed in through the in-app browser after Chrome attachment continued to fail. The Zoho-enabled preview `dpl_2bwSkJUc9NDwJv6dKbQcCv4WU44t` reached READY.

A real preview consult submission with consent declined updated the synthetic Lead and created intake note `7668958000000712001`, routing note `7668958000000714001`, and task `7668958000000713001`. The stored route is `consult_sequence`, lead score 75, recommended service Survey Support.

A real preview Readiness Check scored 6/12, tier `exposed`. It updated the same Lead, preserved `Website Integration Test` as its name, stored all three exposures and the timeline, and created intake note `7668958000000716001`, routing note `7668958000000717001`, and follow-up task `7668958000000705005`. The stored lead score is 65 and route `consult_sequence`.

A separate synthetic request deliberately forced primary CRM failure and was accepted by the real Formspree fallback. Owner inbox receipt was not independently checked. Website OAuth delivery is verified independently of the chat connector.

Production release and public-domain form checks follow these preview checks. Existing production rollback remains the November 2 deployment listed below.

## Remaining owner configuration

- Supply the actual Zoho Bookings URL to replace `[ZOHO BOOKINGS SCHEDULER]`. No scheduler was invented or paid service purchased.
- `[HEADSHOT]`, `[CRISIS LINE]`, and `[BUSINESS EMAIL]` remain visible until supplied.
- Requested readiness-summary emails and marketing follow-up still require manual response or an owner-configured automation. Capturing the result in Zoho does not configure outbound summary mail or subscribe a visitor to a newsletter.
- Update the GA4 web stream URL and Google Search Console property/sitemap for the new domain. Existing GA4 measurement is retained and consent-gated.
- Historical HubSpot contacts were not migrated; the request covers website lead delivery.

## Validation and recovery

- TypeScript, lint, and all 14 unit/integration tests pass, including PHI rejection, readiness scoring, primary-destination failure, per-record Zoho errors, token refresh, existing-name preservation and crisis routing.
- The production build passes with `NEXT_PUBLIC_SITE_URL=https://quantumlynx.io`.
- The prototype data was rebuilt, and all 24 desktop/phone reference captures were regenerated. Earlier reference images and changed source instructions are preserved under ignored `reports/domain-crm-migration/`.
- Local browser verification passed 45 page/viewport checks and ten interactions, with zero console errors, tracker requests after Decline, or automated accessibility violations. Evidence is in `reports/browser/verification.json`.
- Review: https://github.com/quantumlynxllc-oss/Quantum-lynx-site/pull/2. The connector could not fetch the first protected preview, but authenticated in-app browser verification of both real capture surfaces succeeded after sign-in.
- Existing production rollback: `dpl_GYeNmL6dWZ694YQ1KvgYJvVDk68v`, commit `315d573df19b23a3cc04c8bd6f756e6643a30c16`.

For future deployment administration, install the Vercel CLI with `npm i -g vercel`. Marketplace discovery through a temporary CLI required a separate Vercel login; the connected Vercel tools were used for project changes.

## API references

- [Zoho upsert](https://www.zoho.com/crm/developer/docs/api/v8/upsert-records.html)
- [Zoho token refresh](https://www.zoho.com/crm/developer/docs/api/v8/refresh.html)
- [Zoho notes](https://www.zoho.com/crm/developer/docs/api/v8/create-notes.html)
- [Zoho records and tasks](https://www.zoho.com/crm/developer/docs/api/v8/insert-records.html)
- [Zoho booking URLs](https://help.zoho.com/portal/en/kb/bookings/general-setup/articles/bookings-booking-page-url)
