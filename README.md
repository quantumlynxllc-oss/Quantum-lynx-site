# Quantum Lynx website

Design, working prototype, and build instructions for the new site. Nothing here is live, and your existing site at https://quantum-lynx-site.vercel.app has not been changed.

## See the demo

Design canvas: https://claude.ai/artifact/UWKNczTbQ3QHxNLMnGKnxc

To run the working prototype on your Mac, use these two commands.

```bash
cd ~/Desktop/" Projects"/Websites/"Quantum Lynx"
```

```bash
python3 -m http.server 8741
```

Then open http://localhost:8741/prototype/

Try the triage desk, submit the consult form, finish the Readiness Check, and open the lead inbox at http://localhost:8741/prototype/#/inbox to see the record each one creates. Nothing leaves your browser.

## Build it

Open this folder in Claude Code or Codex and paste:

> Read AGENTS.md, then build Phase 1. Treat `prototype/` as the behavior reference, `design/reference/` as the visual target, and `schema/` as the data source. Keep the work on Vercel previews, and do not buy or connect a domain.

## What you need to provide

The build can start without these, but the site cannot launch until they are done.

1. A crisis phone number that someone answers, including after hours. The SLA says crisis requests are handled after hours.
2. A headshot.
3. The items under "Fix before the build" in `docs/connector-map.md`.
4. A lawyer's review of the SLA and Privacy pages in `schema/legal.json`.
5. A domain, once you are happy with the final build. The steps for connecting it are at the end of `docs/seo-schema.md`.
6. A business email on that domain. A Gmail address is weak for hospital buyers.

## What is in this folder

| Path | What it is |
|---|---|
| `AGENTS.md` | Build brief for Codex and Claude Code. `CLAUDE.md` points to it |
| `prototype/` | Working demo in plain HTML and JS |
| `schema/` | Services, Readiness Check, legal pages, routes, lead contract, HubSpot fields |
| `design/` | Tokens and styles, ready to reuse |
| `design/reference/` | Images of every page at desktop and phone width |
| `assets/` | Your logo, the vector helix, icons, and the share image |
| `tools/` | Scripts that rebuild the prototype data and the reference images |
| `docs/page-spec.md` | What goes on each page, and what not to ship |
| `docs/handoff-spec.md` | Components, states, responsive rules, accessibility |
| `docs/integrations.md` | HubSpot, Apollo, scoring, routing, AI, analytics, consent |
| `docs/seo-schema.md` | Metadata, structured data, and launch SEO |
| `docs/claims-ledger.md` | Every public claim and its status |
| `docs/connector-map.md` | Which of your tools fit, and what the check found |
| `docs/source-site/` | Saved copies of your existing Home, SLA, and Privacy pages |
| `.env.example` | Keys the build will need |
