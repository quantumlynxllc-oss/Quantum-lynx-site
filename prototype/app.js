/* Quantum Lynx prototype. Plain JS on purpose: reference for behavior, not production code.
   Nothing leaves the browser. Leads go to localStorage and show at #/inbox. */
(function () {
  'use strict';

  var D = window.QL_DATA;
  var app = document.getElementById('app');
  var LOGO = '../assets/ql-helix.svg';
  var STORE = 'ql-prototype-leads';
  var CONSENT = 'ql-consent';
  var FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|aol|icloud|proton)\./i;
  var memory = [];
  var state = { priority: 'survey', answers: {}, readinessSent: false, consultSent: false, chat: null, consent: readConsent(), consentOpen: false };

  var ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Storage can be unavailable in private windows, so fall back to memory. */
  function readLeads() {
    try { return JSON.parse(localStorage.getItem(STORE)) || memory; } catch (e) { return memory; }
  }
  function writeLeads(list) {
    memory = list;
    try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { /* memory only */ }
  }

  /* Consent. Analytics and marketing tools load only after Accept. */
  function readConsent() {
    try { return localStorage.getItem(CONSENT); } catch (e) { return null; }
  }
  function writeConsent(value) {
    state.consent = value;
    state.consentOpen = false;
    try { localStorage.setItem(CONSENT, value); } catch (e) { /* this visit only */ }
  }

  function attribution() {
    var q = new URLSearchParams(location.search);
    var out = { landing_page: location.pathname + location.hash };
    ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'].forEach(function (k) {
      if (q.get(k)) out[k] = q.get(k);
    });
    return out;
  }

  /* Same rules as docs/integrations.md. Keep them in one server module in the real build. */
  function scoreLead(l) {
    var s = l.priority === 'crisis' ? 70 : (!l.priority || l.priority === 'other') ? 15 : 30;
    if (l.facility_type === 'physician_owned_hospital' || l.facility_type === 'surgical_center') s += 25;
    else if (l.facility_type) s += 10;
    s += ({ under_90_days: 25, under_12_months: 15, unknown: 5 })[l.timeline] || 0;
    if (l.email && !FREE_MAIL.test(l.email)) s += 15;
    s += ({ form: 30, readiness: 10 })[l.channel] || 0;
    if (l.readiness) s += ({ at_risk: 15, exposed: 10 })[l.readiness.tier] || 0;
    return Math.min(s, 100);
  }
  function routeLead(l, score) {
    if (l.priority === 'crisis') return 'call_now';
    if (score >= 80) return 'call_today';
    if (score >= 50) return 'consult_sequence';
    return 'nurture';
  }
  function saveLead(payload) {
    var lead = Object.assign({ consent_version: 'v1', attribution: attribution() }, payload);
    var score = scoreLead(lead);
    var record = { at: new Date().toISOString(), payload: lead, ql_lead_score: score, ql_route: routeLead(lead, score) };
    writeLeads([record].concat(readLeads()));
    return record;
  }

  function triage(id) {
    return D.triage.filter(function (t) { return t.id === id; })[0] ||
      { id: 'other', service: 'Infection Control Consulting', response: '1 business day', first: '', cta: 'Schedule a consult' };
  }

  /* Shared chrome */
  function nav(current) {
    function link(href, label, key) {
      return '<a href="' + href + '"' + (current === key ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }
    return '<header class="qs-nav"><div class="qs-nav-in">' +
      '<a class="qs-brand" href="#/" aria-label="Quantum Lynx home"><img src="' + LOGO + '" alt=""><div><b>Quantum Lynx</b><span>Infection Control Solutions</span></div></a>' +
      '<nav class="qs-links" aria-label="Primary">' + link('#/services', 'Services', 'services') + link('#/readiness-check', 'Readiness Check', 'readiness') + link('#/about', 'About', 'about') + '</nav>' +
      '<a class="ql-btn ql-btn-secondary" href="#/consult">Schedule a consult</a></div></header>';
  }
  function footer() {
    return '<footer class="ql-footer"><div class="ql-container"><div class="ql-footer-grid">' +
      '<div><img src="' + LOGO + '" alt="" style="height:56px;width:auto"><div class="ql-footer-name">Quantum Lynx LLC</div><p class="ql-caption" style="color:#B4BAC1;margin-top:8px;max-width:280px">Infection control for physician-owned hospitals and surgical centers.</p></div>' +
      '<div class="ql-footer-col"><div class="ql-label">Services</div><a href="#/services">All service lines</a><a href="#/readiness-check">Readiness Check</a></div>' +
      '<div class="ql-footer-col"><div class="ql-label">Company</div><a href="#/about">About</a><a href="https://www.linkedin.com/company/quantum-lynx-llc/">LinkedIn</a></div>' +
      '<div class="ql-footer-col"><div class="ql-label">Legal</div><a href="#/privacy">Privacy and HIPAA/BAA</a><a href="#/sla">Service Level Agreement</a><button class="qs-linkbtn" type="button" data-action="consent-open">Cookie settings</button></div>' +
      '</div><div class="ql-footer-legal"><span>© 2026 Quantum Lynx LLC</span><span class="ql-mono">NO PHI IN FORMS OR CHAT</span></div></div></footer>' +
      '<div class="qs-proto-bar">Prototype only, not part of the site: <a href="#/assistant">Intake assistant</a> · <a href="#/inbox">Lead inbox</a> · Nothing leaves this browser.</div>';
  }
  function consentBanner() {
    if (state.consent && !state.consentOpen) return '';
    return '<aside class="qs-consent" id="consent" aria-label="Cookie choices"><p>We use cookies to measure site traffic and follow up on requests. They load only if you accept. See our <a href="#/privacy">privacy page</a>.</p>' +
      '<div class="qs-consent-actions"><button class="ql-btn ql-btn-ghost-dark" type="button" data-action="consent-accept">Accept</button><button class="ql-btn ql-btn-ghost-dark" type="button" data-action="consent-decline">Decline</button></div></aside>';
  }
  function updateConsent() {
    var old = document.getElementById('consent');
    if (old) old.remove();
    app.insertAdjacentHTML('beforeend', consentBanner());
  }
  function head(eyebrow, title, sub) {
    return '<section class="qs-band qs-pagehead"><div class="ql-container"><div class="ql-eyebrow on-dark">' + eyebrow + '</div>' +
      '<h1 class="ql-h1" style="color:#fff;margin-top:16px;max-width:760px">' + title + '</h1>' +
      (sub ? '<p class="ql-body-lg" style="color:#B4BAC1;margin-top:20px;max-width:560px">' + sub + '</p>' : '') + '</div></section>';
  }
  function secHead(eyebrow, title) {
    return '<div class="ql-sec-head"><div class="ql-eyebrow">' + eyebrow + '</div><h2 class="ql-h2" style="margin-top:16px">' + title + '</h2></div>';
  }
  /* Section numbers run in order on Home only. Other pages drop them. */
  function numbered(n, label, showNumber) {
    return showNumber === false ? label : n + ' / ' + label;
  }

  /* Sections */
  function triagePanel() {
    var sel = triage(state.priority);
    var opts = D.triage.map(function (t) {
      return '<button class="qs-opt" type="button" data-triage="' + t.id + '" aria-pressed="' + (t.id === state.priority) + '"><span class="qs-tick" aria-hidden="true"></span><span>' + esc(t.label) + '</span></button>';
    }).join('');
    return '<div class="ql-eyebrow">Triage desk</div><h2>What is on your desk right now?</h2><div class="qs-opts">' + opts + '</div>' +
      '<div class="qs-result" aria-live="polite"><div><div class="qs-kicker">Start with</div><strong>' + esc(sel.service) + '</strong></div>' +
      '<div><div class="qs-kicker">First response</div><strong>' + esc(sel.response) + '</strong></div><p>' + esc(sel.first) + '</p></div>' +
      '<a class="ql-btn ql-btn-primary" href="#/consult" data-jump="consult">' + esc(sel.cta) + '</a>' +
      '<a class="qs-alt" href="#/assistant">Talk it through with the intake assistant</a>';
  }
  function hero() {
    var stats = D.proof.map(function (p) {
      return '<div class="qs-stat"><b>' + esc(p.value) + '</b><span style="color:#B4BAC1">' + esc(p.label) + '</span></div>';
    }).join('');
    return '<section class="qs-hero" style="background:#0B0F14;color:#fff"><div class="ql-hero-grain" aria-hidden="true"></div><img class="qs-hero-mark" src="' + LOGO + '" alt="" aria-hidden="true">' +
      '<div class="ql-container"><div class="qs-hero-grid"><div><div class="ql-eyebrow" style="color:#F2697B">CIC-led · BAA on day one · Houston-based, nationwide</div>' +
      '<h1 class="qs-h1">Infection control that holds up <span class="ql-accent-text">under survey</span></h1>' +
      '<p class="qs-sub" style="color:#B4BAC1">Remote surveillance, survey support, and crisis response for physician-owned hospitals and surgical centers, with one named CIC accountable.</p>' +
      '<div class="qs-cta"><a class="ql-btn ql-btn-primary" href="#/consult" data-jump="consult">Schedule a 20-minute consult</a><a class="ql-btn ql-btn-ghost-dark" href="#/readiness-check">Take the Readiness Check</a></div></div>' +
      '<div class="qs-triage" id="triage-slot">' + triagePanel() + '</div></div>' +
      '<div class="qs-stats" style="border-top-color:rgba(255,255,255,.14)">' + stats + '</div>' +
      '<p class="qs-proof-note" style="color:#B4BAC1">' + esc(D.proofNote) + '</p></div></section>';
  }
  function ledger() {
    return '<div class="qs-ledger">' + D.services.map(function (s) {
      return '<a class="qs-row" href="#/services/' + s.slug + '"><span class="qs-row-n">' + s.n + '</span><span class="qs-row-t">' + esc(s.title) + '</span><span class="qs-row-d">' + esc(s.ledger) + '</span><span class="qs-row-m">' + esc(s.delivery.join(' · ')) + '</span>' + ARROW + '</a>';
    }).join('') + '</div>';
  }
  function steps() {
    return '<section class="ql-section" style="background:var(--ql-white)"><div class="ql-container">' + secHead('02 / How it works', 'One call to a program you can defend.') +
      '<div class="qs-steps">' + D.steps.map(function (s) {
        return '<div class="qs-step"><div class="qs-step-n">' + s.n + '</div><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>';
      }).join('') + '</div></div></section>';
  }
  function readinessTeaser() {
    return '<section class="ql-section qs-band"><div class="ql-container qs-split"><div><div class="ql-eyebrow on-dark">03 / Readiness Check</div><h2 class="ql-h2" style="color:#fff;margin-top:16px">Find your exposure in 3 minutes.</h2>' +
      '<p class="ql-body-lg" style="color:#B4BAC1;margin-top:20px;max-width:480px">Seven questions. A readiness score and your top three exposures. No patient data, no login.</p>' +
      '<div class="qs-cta"><a class="ql-btn ql-btn-primary" href="#/readiness-check">Start the Readiness Check</a></div></div>' +
      '<div class="qs-sample"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="ql-label" style="color:#B4BAC1">Sample result</span><span class="qs-tag warn">Exposed</span></div>' +
      '<ol><li><b>01</b><span>No mock survey in the last 12 months</span></li><li><b>02</b><span>One person owns NHSN, with no backup</span></li><li><b>03</b><span>Infection control plan review overdue</span></li></ol></div></div></section>';
  }
  function record(showNumber) {
    return '<section class="ql-section"><div class="ql-container">' + secHead(numbered('04', 'Field record', showNumber), 'Harvey. Outbreaks. Surveyors on site.') +
      '<div class="qs-record"><div><div class="qs-big">12,000</div><div class="ql-label" style="color:var(--fg-2);margin-top:16px">Patients tested in 8 days</div><p class="ql-body-sm" style="margin:12px 0 0;max-width:340px">Set up, ran, and reported cases for a drive-up COVID-19 testing center in Liberty County.</p></div>' +
      '<div class="qs-facts">' + D.record.map(function (r) {
        return '<div class="qs-fact"><b>' + esc(r.title) + '</b><span>' + esc(r.text) + '</span></div>';
      }).join('') + '</div></div></div></section>';
  }
  function quotes(showNumber) {
    return '<section class="ql-section" style="background:var(--ql-bone)"><div class="ql-container">' + secHead(numbered('05', 'Client voices', showNumber), 'From the people accountable for the result.') +
      '<div class="qs-quotes">' + D.quotes.map(function (q) {
        return '<figure class="qs-quote"><blockquote>' + esc(q.text) + '</blockquote><figcaption><b>' + esc(q.role) + '</b>' + esc(q.org) + '</figcaption></figure>';
      }).join('') + '</div></div></section>';
  }
  function principal(showNumber) {
    return '<section class="ql-section"><div class="ql-container ql-about-grid"><div><div class="ql-eyebrow">' + numbered('06', 'Principal', showNumber) + '</div><h2 class="ql-h2" style="margin-top:16px">Run by a CIC. Reached by name.</h2>' +
      '<p class="ql-body-lg" style="margin-top:20px;color:var(--fg-2)">' + esc(D.principal.name) + ' leads every engagement as ' + esc(D.principal.title) + ', with a background in clinical microbiology and hospital program oversight.</p>' +
      '<ul class="ql-credentials">' + D.principal.credentials.map(function (c) {
        return '<li><span class="k">' + esc(c.k) + '</span><span class="v">' + esc(c.v) + '</span></li>';
      }).join('') + '</ul></div><div style="display:flex;justify-content:center"><div class="qs-portrait">[HEADSHOT]</div></div></div></section>';
  }
  function consultBody() {
    var sel = triage(state.priority);
    if (state.consultSent) {
      var crisis = state.priority === 'crisis';
      return '<div><div class="ql-eyebrow">Received</div><div class="ql-h3" style="margin-top:12px">' +
        (crisis ? 'Crisis request received. Call [CRISIS LINE] if this cannot wait.' : 'Received. Expect a reply within 1 business day.') + '</div>' +
        '<div class="qs-portrait" style="aspect-ratio:auto;height:200px;max-width:none;margin-top:20px">[HUBSPOT MEETINGS SCHEDULER]</div>' +
        '<div class="qs-cta" style="margin-top:16px"><button class="ql-btn ql-btn-ghost" type="button" data-action="consult-reset">Send another</button><a class="ql-btn ql-btn-ghost" href="#/inbox">See the lead record</a></div></div>';
    }
    var options = D.triage.concat([{ id: 'other', label: 'Something else' }]).map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === state.priority ? ' selected' : '') + '>' + esc(t.label) + '</option>';
    }).join('');
    function field(id, name, label, type, ac) {
      return '<div class="ql-field"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" type="' + type + '" autocomplete="' + ac + '" required></div>';
    }
    return '<form class="ql-cta-form" id="consult-form"><div class="ql-eyebrow">Schedule a consult</div>' +
      field('f-name', 'name', 'Your name', 'text', 'name') + field('f-email', 'email', 'Work email', 'email', 'email') +
      field('f-fac', 'company', 'Facility', 'text', 'organization') + field('f-role', 'jobtitle', 'Your role', 'text', 'organization-title') +
      '<div class="ql-field"><label for="f-pri">Priority</label><select id="f-pri" name="priority">' + options + '</select></div>' +
      '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
      '<button class="ql-btn ql-btn-primary ql-btn-full" type="submit">' + esc(sel.cta) + '</button>' +
      '<div class="ql-caption" style="margin-top:12px">Do not include patient information. This form is not for PHI.</div></form>';
  }
  function consult(showNumber) {
    /* On /consult this is the page heading, so it becomes the h1. */
    var tag = showNumber === false ? 'h1' : 'h2';
    return '<section class="ql-cta-section" id="consult"><div class="ql-container ql-cta-grid"><div><div class="ql-eyebrow on-dark">' + numbered('07', 'Engagement', showNumber) + '</div>' +
      '<' + tag + ' class="ql-h1" style="color:#fff;margin-top:16px;max-width:520px">A <span class="ql-accent-text">20-minute</span> consult. Decide from there.</' + tag + '>' +
      '<p class="ql-body-lg" style="color:#B4BAC1;margin-top:24px;max-width:480px">Get a review of your current program, your top three exposures, and a scope if it fits. No obligation.</p>' +
      '<ul class="ql-cta-list"><li>Reply within 1 business day</li><li>Priority response for crisis requests</li><li>BAA signed before any PHI changes hands</li></ul></div>' +
      '<div class="ql-cta-form-wrap" id="consult-slot">' + consultBody() + '</div></div></section>';
  }

  /* Pages */
  var pages = {
    home: function () {
      return nav('') + '<main>' + hero() + '<section class="ql-section" id="services"><div class="ql-container">' + secHead('01 / Service lines', 'Seven service lines. One accountable team.') + ledger() + '</div></section>' +
        steps() + readinessTeaser() + record() + quotes() + principal() + consult() + '</main>' + footer();
    },
    services: function () {
      return nav('services') + '<main>' + head('Service lines', 'Start from the problem on your desk.', 'Each service line opens with a named CIC. Pick one line, or run several as one program.') +
        '<section class="ql-section"><div class="ql-container">' + ledger() + '</div></section></main>' + footer();
    },
    service: function (slug) {
      var cur = D.services.filter(function (s) { return s.slug === slug; })[0];
      if (!cur) return pages.missing();
      var tabs = D.services.map(function (s) {
        return '<a class="qs-svc-tab" href="#/services/' + s.slug + '"' + (s.slug === slug ? ' aria-current="page"' : '') + '><span>' + s.n + '</span>' + esc(s.title) + '</a>';
      }).join('');
      function list(items) {
        return '<ul class="qs-list">' + items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      }
      return nav('services') + '<main>' + head('Service lines', 'Start from the problem on your desk.', '') +
        '<section class="ql-section" style="padding-top:64px"><div class="ql-container qs-svc-layout"><nav class="qs-svc-tabs" aria-label="Service lines">' + tabs + '</nav>' +
        '<article class="qs-svc-body"><div class="ql-eyebrow">' + cur.n + ' / ' + esc(cur.delivery.join(' · ')) + '</div><h2 class="ql-h2">' + esc(cur.title) + '</h2>' +
        '<p class="ql-body-lg" style="color:var(--fg-2);margin-top:16px;max-width:640px">' + esc(cur.lede) + '</p>' +
        '<div class="qs-svc-cols"><div><h3 class="ql-label" style="color:var(--fg-2);margin:0">Use it when</h3>' + list(cur.when) + '</div><div><h3 class="ql-label" style="color:var(--fg-2);margin:0">You get</h3>' + list(cur.get) + '</div></div>' +
        '<div class="qs-cta"><a class="ql-btn ql-btn-primary" href="#/consult" data-priority="' + cur.priority + '">' + esc(cur.cta) + '</a><a class="ql-btn ql-btn-ghost" href="#/readiness-check">Take the Readiness Check</a></div></article></div></section></main>' + footer();
    },
    readiness: function () {
      var qs = D.readiness.questions.map(function (q, i) {
        var chips = q.options.map(function (o, idx) {
          return '<button class="qs-chip" type="button" data-q="' + q.id + '" data-a="' + idx + '" aria-pressed="' + (state.answers[q.id] === idx) + '">' + esc(o) + '</button>';
        }).join('');
        return '<fieldset class="qs-q" style="border-left:0;border-right:0;border-bottom:0;margin:0;padding-left:0;padding-right:0"><legend class="qs-q-t" style="float:left;width:100%;padding:0"><span>0' + (i + 1) + '</span>' + esc(q.text) + '</legend><div class="qs-choices" style="clear:both">' + chips + '</div></fieldset>';
      }).join('');
      return nav('readiness') + '<main><section class="ql-section" style="padding-top:64px"><div class="ql-container"><div class="ql-sec-head" style="margin-bottom:40px"><div class="ql-eyebrow">Readiness Check</div><h1 class="ql-h1" style="margin-top:16px">Find your exposure in 3 minutes.</h1><p class="ql-body-lg" style="color:var(--fg-2);margin-top:16px">Seven questions about your program. Do not enter patient data.</p></div>' +
        '<div class="qs-check"><div>' + qs + '</div><aside class="qs-score" aria-live="polite" id="score-slot">' + scorePanel() + '</aside></div></div></section></main>' + footer();
    },
    assistant: function () {
      return nav('') + '<main><section class="ql-section" style="padding-top:64px"><div class="ql-container"><div class="ql-sec-head" style="margin-bottom:40px"><div class="ql-eyebrow">Intake assistant · Scripted demo</div><h1 class="ql-h1" style="margin-top:16px">Every conversation becomes a clean lead.</h1><p class="ql-body-lg" style="color:var(--fg-2);margin-top:16px">Pick replies on the left. The record on the right fills in the way it will in HubSpot.</p></div>' +
        '<div class="qs-lab" id="chat-slot">' + chatPanels() + '</div></div></section></main>' + footer();
    },
    consultPage: function () { return nav('') + '<main>' + consult(false) + '</main>' + footer(); },
    about: function () { return nav('about') + '<main>' + head('About', 'From the microbiology lab to the survey room.', 'Serving hospitals since 2016.') + principal(false) + record(false) + quotes(false) + '</main>' + footer(); },
    legal: function (key) {
      var page = D.legal[key];
      var sections = page.sections.filter(function (s) { return !s.phase || s.phase === 1; }).map(function (s) {
        var table = s.table ? '<div class="qs-scroll"><table class="qs-table"><thead><tr>' + s.table.columns.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          s.table.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '';
        var paragraphs = (s.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
        var items = s.items ? '<ul>' + s.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '';
        return '<section><h2>' + esc(s.heading) + '</h2>' + table + paragraphs + items + '</section>';
      }).join('');
      return nav('') + '<main>' + head(esc(page.eyebrow), esc(page.title), esc(page.lede)) + '<div class="ql-section" style="padding-top:64px"><div class="ql-container"><article class="qs-legal"><p class="qs-legal-date">Last updated ' + esc(page.updated) + '</p>' + sections + '</article></div></div></main>' + footer();
    },
    inbox: function () {
      var leads = readLeads();
      var body = leads.length
        ? '<div class="qs-scroll"><table class="qs-table"><thead><tr><th>Received</th><th>Channel</th><th>Email</th><th>Facility</th><th>Priority</th><th>Score</th><th>Route</th></tr></thead><tbody>' +
          leads.map(function (l) {
            var p = l.payload;
            return '<tr><td class="m">' + esc(new Date(l.at).toLocaleString()) + '</td><td>' + esc(p.channel) + '</td><td>' + esc(p.email) + '</td><td>' + esc(p.company) + '</td><td>' + esc(p.priority) + '</td><td class="m">' + esc(l.ql_lead_score) + '</td><td class="m">' + esc(l.ql_route) + '</td></tr>';
          }).join('') + '</tbody></table></div><h2 style="margin-top:40px">Latest payload</h2><pre class="ql-mono" style="background:#fff;border:1px solid var(--border-1);border-radius:8px;padding:20px;overflow:auto;white-space:pre-wrap">' + esc(JSON.stringify(leads[0], null, 2)) + '</pre>' +
          '<button class="ql-btn ql-btn-ghost" type="button" data-action="clear-leads" style="margin-top:16px">Clear prototype leads</button>'
        : '<div class="qs-card"><h3>No leads yet</h3><p style="margin:0">Submit the consult form or the Readiness Check, then come back.</p></div>';
      return nav('') + '<main><div class="qs-doc"><div class="ql-eyebrow">Prototype inbox</div><h1 class="ql-h1" style="margin:16px 0 24px">What /api/lead would receive</h1>' + body + '</div></main>' + footer();
    },
    missing: function () {
      return nav('') + '<main><div class="qs-doc"><h1 class="ql-h1" style="margin-bottom:24px">Page not found</h1><a class="ql-btn ql-btn-primary" href="#/">Back to home</a></div></main>' + footer();
    }
  };

  /* Readiness */
  function scorePanel() {
    var R = D.readiness, a = state.answers;
    var scored = R.questions.filter(function (q) { return q.scored !== false; });
    var done = scored.filter(function (q) { return a[q.id] !== undefined; });
    var score = done.reduce(function (sum, q) { return sum + (2 - a[q.id]); }, 0);
    var answered = R.questions.filter(function (q) { return a[q.id] !== undefined; }).length;
    var tier = R.tiers.filter(function (t) { return score >= t.min; })[0];
    var weak = done.filter(function (q) { return a[q.id] > 0; }).sort(function (x, y) { return a[y.id] - a[x.id]; });
    var top = weak.slice(0, 3);
    var next = a.window === 2 ? 'Survey Support' : (weak[0] ? weak[0].service : 'Program review');
    state.result = { score: score, tier: tier.id, exposures: top.map(function (q) { return q.weak; }) };
    var out = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="ql-label" style="color:#B4BAC1">' + answered + ' of 7 answered</span>' +
      (done.length ? '<span class="qs-tag ' + tier.tone + '">' + tier.label + '</span>' : '') + '</div>' +
      '<div class="qs-score-n" style="margin-top:20px">' + score + '<span style="font-size:28px;letter-spacing:-.02em;color:#B4BAC1"> / ' + R.maxScore + '</span></div>' +
      '<div class="qs-bar" role="img" aria-label="Readiness score ' + score + ' of ' + R.maxScore + '"><i style="width:' + Math.round(score / R.maxScore * 100) + '%"></i></div>';
    if (done.length) {
      out += '<div class="qs-sample" style="padding:0;background:none;margin-top:20px"><span class="ql-label" style="color:#B4BAC1">Top exposures</span><ol>' +
        (top.length ? top.map(function (q, i) { return '<li><b>0' + (i + 1) + '</b><span>' + esc(q.weak) + '</span></li>'; }).join('') : '<li><span>None flagged so far</span></li>') + '</ol></div>' +
        '<div style="margin-top:8px;font-size:15px;color:#B4BAC1">Start with <b style="color:#fff">' + esc(next) + '</b></div>';
      out += state.readinessSent
        ? '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.14)"><div style="font:600 18px/1.3 var(--font-display)">Summary on its way.</div><a class="ql-btn ql-btn-primary ql-btn-full" href="#/consult" style="margin-top:16px">Review it with a CIC</a></div>'
        : '<form id="readiness-form" style="margin-top:20px"><div class="ql-field"><label for="r-email">Work email</label><input id="r-email" name="email" type="email" autocomplete="email" required></div><div class="ql-field"><label for="r-fac">Facility</label><input id="r-fac" name="company" type="text" autocomplete="organization" required></div><button class="ql-btn ql-btn-primary ql-btn-full" type="submit">Email my summary</button></form>';
    }
    return out + '<p class="qs-fine">' + esc(R.disclaimer) + '</p>';
  }

  /* Scripted assistant. The real one is Claude behind /api/assistant. */
  function freshChat() {
    return { step: 'start', crm: {}, log: [{ who: 'bot', t: 'I can point you to the right service line and set up a consult. What is going on?' }] };
  }
  function flow() {
    var email = [{ l: 'Share sample work email', set: { email: 'you@facility.org' }, to: 'done' }];
    function pick(l, key, val, to) { var set = {}; set[key] = val; return { l: l, set: set, to: to }; }
    return {
      start: { replies: [pick('We have a survey coming', 'priority', 'survey', 'type'), pick('NHSN reporting is behind', 'priority', 'nhsn', 'type'), pick('We have an outbreak', 'priority', 'crisis', 'crisis'), { l: 'Test: paste a patient name', phi: true }] },
      type: { bot: 'What type of facility are you with?', replies: [pick('Physician-owned hospital', 'facility_type', 'physician_owned_hospital', 'when'), pick('Surgical center', 'facility_type', 'surgical_center', 'when'), pick('Long-term acute care', 'facility_type', 'ltac', 'when'), pick('Something else', 'facility_type', 'other', 'when')] },
      when: { bot: 'When does this need to be resolved?', replies: [pick('Within 90 days', 'timeline', 'under_90_days', 'email'), pick('Within 12 months', 'timeline', 'under_12_months', 'email'), pick('Not sure yet', 'timeline', 'unknown', 'email')] },
      email: { bot: 'A CIC should see this. Share your work email and a 20-minute consult link follows.', replies: email },
      crisis: { bot: 'This needs a person now. Call [CRISIS LINE], or share a work email for a priority callback.', replies: email },
      done: { bot: 'Sent. Check your inbox for the consult link.', replies: [{ l: 'Start over', reset: true }] }
    };
  }
  function chatPanels() {
    if (!state.chat) state.chat = freshChat();
    var c = state.chat, crm = c.crm;
    var log = c.log.map(function (m) { return '<div class="qs-msg ' + m.who + '">' + esc(m.t) + '</div>'; }).join('');
    var replies = flow()[c.step].replies.map(function (r, i) {
      return '<button class="qs-chip" type="button" data-reply="' + i + '">' + esc(r.l) + '</button>';
    }).join('');
    var lead = Object.assign({ channel: 'assistant' }, crm);
    var started = !!crm.priority;
    var score = started ? scoreLead(lead) : 0;
    var route = started ? routeLead(lead, score) : '';
    var svc = { survey: 'Survey Support', nhsn: 'Surveillance Support', crisis: 'Crisis Response' }[crm.priority];
    var tone = { call_now: ['alert', 'Call now'], call_today: ['warn', 'Call today'], consult_sequence: ['ok', 'Consult sequence'], nurture: ['ok', 'Nurture'] }[route] || ['ok', 'Collecting'];
    var brief = crm.email ? svc + ' request. ' + (crm.timeline ? 'Timeline ' + crm.timeline.replace(/_/g, ' ') + '. ' : '') + 'Open with the top three exposures.' : '';
    var rows = [['email', crm.email], ['ql_priority', crm.priority], ['ql_recommended_service', svc], ['ql_facility_type', crm.facility_type], ['ql_timeline', crm.timeline], ['ql_lead_score', score ? String(score) : ''], ['ql_route', route], ['ql_ai_brief', brief]];
    return '<div class="qs-chat"><div class="qs-chat-h"><img src="' + LOGO + '" alt=""><span>Quantum Lynx intake</span><span class="qs-tag">Automated</span></div><div class="qs-chat-b" aria-live="polite">' + log + '</div><div class="qs-replies">' + replies + '</div><div class="qs-disclose">Automated assistant, not clinical advice. Do not share patient information.</div></div>' +
      '<div class="qs-crm"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px"><span class="ql-label" style="color:#B4BAC1">HubSpot contact record</span><span class="qs-tag ' + tone[0] + '">' + tone[1] + '</span></div><div class="qs-kv">' +
      rows.map(function (r) { return '<div class="k">' + r[0] + '</div><div class="v' + (r[1] ? '' : ' off') + '">' + esc(r[1] || 'Waiting') + '</div>'; }).join('') +
      '</div><p class="qs-fine" style="margin-top:16px">Apollo adds company data after submit. The form never asks for it.</p></div>';
  }
  function reply(i) {
    var f = flow(), c = state.chat, r = f[c.step].replies[i];
    if (r.reset) { state.chat = freshChat(); }
    else if (r.phi) {
      c.log.push({ who: 'you', t: '[Message with patient details]' }, { who: 'bot', t: 'Please remove patient details. I cannot take PHI here, and that message was not saved.' });
    } else {
      Object.assign(c.crm, r.set);
      c.log.push({ who: 'you', t: r.l }, { who: 'bot', t: f[r.to].bot });
      c.step = r.to;
      if (r.to === 'done') saveLead(Object.assign({ channel: 'assistant' }, c.crm));
    }
    document.getElementById('chat-slot').innerHTML = chatPanels();
  }

  /* Events */
  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-triage],[data-jump],[data-priority],[data-q],[data-reply],[data-action]');
    if (!t) return;
    if (t.dataset.triage) {
      state.priority = t.dataset.triage;
      document.getElementById('triage-slot').innerHTML = triagePanel();
      var slot = document.getElementById('consult-slot');
      if (slot && !state.consultSent) slot.innerHTML = consultBody();
      var again = document.querySelector('[data-triage="' + state.priority + '"]');
      if (again) again.focus();
    } else if (t.dataset.jump) {
      var el = document.getElementById(t.dataset.jump);
      if (el) { e.preventDefault(); el.scrollIntoView(); }
    } else if (t.dataset.priority) {
      state.priority = t.dataset.priority;
      state.consultSent = false;
    } else if (t.dataset.q) {
      state.answers[t.dataset.q] = Number(t.dataset.a);
      state.readinessSent = false;
      document.querySelectorAll('[data-q="' + t.dataset.q + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === t));
      });
      document.getElementById('score-slot').innerHTML = scorePanel();
    } else if (t.dataset.reply !== undefined) {
      reply(Number(t.dataset.reply));
    } else if (t.dataset.action === 'consult-reset') {
      state.consultSent = false;
      document.getElementById('consult-slot').innerHTML = consultBody();
    } else if (t.dataset.action === 'clear-leads') {
      writeLeads([]);
      render();
    } else if (t.dataset.action === 'consent-accept') {
      writeConsent('accepted');
      updateConsent();
    } else if (t.dataset.action === 'consent-decline') {
      writeConsent('declined');
      updateConsent();
    } else if (t.dataset.action === 'consent-open') {
      state.consentOpen = true;
      updateConsent();
    }
  });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'f-pri') {
      state.priority = e.target.value;
      var btn = document.querySelector('#consult-form button[type=submit]');
      if (btn) btn.textContent = triage(state.priority).cta;
      var panel = document.getElementById('triage-slot');
      if (panel) panel.innerHTML = triagePanel();
    }
  });
  app.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(e.target);
    if (d.get('website')) return; /* honeypot */
    if (e.target.id === 'consult-form') {
      saveLead({ channel: 'form', name: d.get('name'), email: d.get('email'), company: d.get('company'), jobtitle: d.get('jobtitle'), priority: d.get('priority') });
      state.priority = d.get('priority');
      state.consultSent = true;
      document.getElementById('consult-slot').innerHTML = consultBody();
    } else if (e.target.id === 'readiness-form') {
      var timeline = ({ 0: 'unknown', 1: 'under_12_months', 2: 'under_90_days' })[state.answers.window];
      var lead = { channel: 'readiness', email: d.get('email'), company: d.get('company'), readiness: state.result };
      if (timeline) lead.timeline = timeline;
      saveLead(lead);
      state.readinessSent = true;
      document.getElementById('score-slot').innerHTML = scorePanel();
    }
  });

  /* Router */
  function render() {
    var parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
    var html;
    if (!parts[0]) html = pages.home();
    else if (parts[0] === 'services' && parts[1]) html = pages.service(parts[1]);
    else if (parts[0] === 'services') html = pages.services();
    else if (parts[0] === 'readiness-check') html = pages.readiness();
    else if (parts[0] === 'assistant') html = pages.assistant();
    else if (parts[0] === 'consult') html = pages.consultPage();
    else if (parts[0] === 'about') html = pages.about();
    else if (parts[0] === 'sla') html = pages.legal('sla');
    else if (parts[0] === 'privacy') html = pages.legal('privacy');
    else if (parts[0] === 'inbox') html = pages.inbox();
    else html = pages.missing();
    app.innerHTML = '<div style="background:var(--ql-paper);color:var(--fg-1);font-family:var(--font-sans)">' + html + '</div>' + consentBanner();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  render();
})();
