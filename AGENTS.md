# Quantum Lynx website: build brief

Read this file first. It applies to Claude Code, Codex, and any other agent.

## What this is

A lead-generation marketing site for Quantum Lynx LLC, an infection control consulting firm. It replaces the existing site at https://quantum-lynx-site.vercel.app. The owner has not bought a domain yet and will do that after approving the final build.

Audience: administrators, CNOs, and quality leaders at physician-owned hospitals and surgical centers.

Success: a qualified visitor reaches a person. Every design choice serves two jobs: list the services, and generate leads.

## Start here

1. Read this file, `docs/page-spec.md`, and `docs/handoff-spec.md`.
2. Run the prototype and open every route. From this folder, run `python3 -m http.server 8741`, then open http://localhost:8741/prototype/.
3. Keep `design/reference/` open while you build. Those images are the visual target.

Build the prototype as a production site, with the same layout, copy, and behavior. Do not redesign it, rewrite the copy, or add sections. If something looks wrong, flag it instead of changing it.

## Sources of truth

| Need | File |
|---|---|
| What goes on each page | `docs/page-spec.md` |
| Visual target | `design/reference/` |
| Behavior and exact fixed copy | `prototype/` |
| Service copy and proof | `schema/services.json` |
| Readiness Check logic | `schema/readiness.json` |
| SLA and Privacy text | `schema/legal.json` |
| Routes, titles, redirects | `schema/site.json` |
| Lead API contract | `schema/lead.schema.json` |
| HubSpot custom fields | `schema/hubspot-properties.json` |
| Tokens and styles | `design/tokens.css`, `design/kit.css`, `design/site.css` |
| Component and state spec | `docs/handoff-spec.md` |
| HubSpot, Apollo, Claude, routing, analytics | `docs/integrations.md` |
| Structured data and metadata | `docs/seo-schema.md` |
| Which claims are cleared | `docs/claims-ledger.md` |
| Logos, icons, and share image | `assets/` |

If two files disagree, the JSON in `schema/` wins for data, `docs/handoff-spec.md` wins for behavior, and `docs/page-spec.md` wins for page structure. Flag the conflict instead of guessing.

The owner also has a private design canvas at https://claude.ai/artifact/UWKNczTbQ3QHxNLMnGKnxc. You do not need it. This folder holds everything required, and this folder wins if the two differ.

After any change in `schema/`, run `python3 tools/build-prototype-data.py`. After any visual change to the prototype, run `node tools/capture-reference.mjs` with the prototype server running.

## Stack

- Next.js App Router, TypeScript, strict mode. Create the app in the root of this folder and leave the existing folders where they are.
- Import content from `schema/` directly. Do not copy it into components.
- Deploy to the existing Vercel project `quantum-lynx-site`. Ask the owner which Git repository it deploys from before you push anything.
- MDX for Insights in Phase 3. No CMS and no database at launch. HubSpot is the system of record.
- Render service pages from `schema/services.json` with `generateStaticParams`.

## Keep the design exact

- Import `design/tokens.css`, `design/kit.css`, and `design/site.css` as global CSS, in that order and unchanged.
- Reuse the `ql-` and `qs-` classes and the markup structure in `prototype/app.js`. Move inline styles into stylesheets without changing their values.
- Add Tailwind only for new utilities, and map its theme to the CSS variables in `design/tokens.css`. Do not hardcode colors or restyle existing components.
- Load Inter Tight (400 to 700), Inter (400 to 600), and JetBrains Mono (400 to 600) with `next/font`. Neue Haas Grotesk stays first in the font stack only if the owner buys a license.
- Use `assets/ql-helix.svg` in the header and `assets/ql-helix-white.svg` where a white mark is needed. Use `assets/ql-helix.svg` as the favicon.

## Build order

### Phase 1: launch
1. Scaffold the app and import the styles.
2. Build the shell: nav, footer, consent banner, focus states, phone behavior.
3. Build Home, Services, service pages, About, Consult, Readiness Check, Privacy, SLA, and the not-found page.
4. Build `POST /api/lead` from `schema/lead.schema.json`, with validation, Turnstile, a honeypot, and rate limiting.
5. Connect HubSpot, then Apollo, then routing, in that order.
6. Add consent-gated GA4, HubSpot tracking, and the Apollo tracker, plus the events in `docs/integrations.md`.
7. Add metadata, JSON-LD, sitemap, robots, share image, and the redirects in `schema/site.json`.
8. Test on a Vercel preview. Compare each page with `design/reference/` at 1440px and 390px. Promote to production only after the owner approves.

### Phase 2: AI intake
Build `POST /api/assistant` and the assistant panel. Show the `phase: 2` section of the Privacy page and the triage panel's assistant link. See `docs/integrations.md`.

### Phase 3: growth
Insights articles, audience landing pages, voice intake.

## When something is missing

Keep building. Do not invent the missing item or stop the work.

| Missing | What to do |
|---|---|
| Domain | None has been bought. Work on Vercel previews and build every absolute URL from `NEXT_PUBLIC_SITE_URL`. Never hardcode a domain, and do not buy or connect one |
| `[HEADSHOT]`, `[CRISIS LINE]`, `[BUSINESS EMAIL]`, `[HUBSPOT MEETINGS SCHEDULER]` | Leave the placeholder visible and list it in your handoff |
| HubSpot token, form GUID, or custom fields | Put all HubSpot calls in one module. Until the values exist, send leads to `FORMSPREE_FAILOVER_URL` |
| Apollo key | Skip enrichment when `APOLLO_API_KEY` is empty. The lead still routes |
| Turnstile keys | Use Cloudflare's test keys on previews |
| Vercel access | Ask the owner. Do not create a new project |
| Capabilities PDF | Skip it. No page links to it |

## Rules that cannot bend

1. **No PHI.** Forms, chat, voice, analytics, and logs must never collect patient information. Show the notice on every input surface. Filter on the client and again on the server. Never log request bodies.
2. **No new claims.** Only publish numbers and statements marked cleared in `docs/claims-ledger.md`. Never invent a statistic, client, credential, or testimonial. Never publish a survey success rate or a crisis response time.
3. **Never lose a lead.** If HubSpot fails, send to the Formspree failover and alert the owner. The visitor still sees success.
4. **Crisis goes to a person.** Crisis priority always routes to `call_now`, whatever the score. AI never tries to resolve a crisis or give clinical advice.
5. **Secrets stay on the server.** No key reaches the client bundle. Use `.env.example` names.
6. **Keep the placeholders visible.** `[HEADSHOT]`, `[CRISIS LINE]`, `[BUSINESS EMAIL]`, and `[HUBSPOT MEETINGS SCHEDULER]` stay until the owner supplies the real thing.
7. **Do not touch the Google Drive folder `Business Elements`.** It is the owner's read-only source.

## Voice

Calm, exact, no adjectives you did not earn. Lead with the verb, then the number. Second person. Sentence case for UI. Title Case for service names. No emoji, no exclamation points. Sample: "Find your exposure in 3 minutes."

## Definition of done

- Each page matches `design/reference/` at 1440px and 390px.
- Nothing listed under "Prototype only" in `docs/page-spec.md` ships.
- Lighthouse 90+ on performance, accessibility, best practices, and SEO on phone and desktop.
- WCAG 2.2 AA: keyboard path through every flow, visible focus, 4.5:1 text contrast, 44px targets.
- No horizontal scroll at 320px.
- A test lead appears in HubSpot with the right `ql_` fields and route.
- A forced HubSpot failure still delivers the lead.
- A message containing patient details is rejected and not stored.
- With consent declined, no tracker loads and every form still works.
- No console errors. `tsc` and lint pass.
