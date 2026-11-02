#!/usr/bin/env node
/* Rebuilds design/reference/ from the prototype. Needs Node and Google Chrome.

   Start the prototype server in one terminal:
     python3 -m http.server 8741
   Then run this in another:
     node tools/capture-reference.mjs

   Set CHROME to use a different browser path. If Google Chrome stops with "Not allowed,"
   install Chrome for Testing with `npx @puppeteer/browsers install chrome@stable` and point
   CHROME at its binary. */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design', 'reference');
const BASE = 'http://localhost:8741/prototype/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true }
];

const ANSWER_READINESS = `document.querySelectorAll('.qs-q').forEach(function (q) { q.querySelectorAll('.qs-chip')[1].click(); });`;
const SEND_CONSULT = `(function () {
  var f = document.getElementById('consult-form');
  f.elements.name.value = 'Sample Name';
  f.elements.email.value = 'name@example.org';
  f.elements.company.value = 'Sample Facility';
  f.elements.jobtitle.value = 'Infection Preventionist';
  f.requestSubmit();
})();`;

const SHOTS = [
  { name: 'home', hash: '#/' },
  { name: 'services', hash: '#/services' },
  { name: 'service-survey-support', hash: '#/services/survey-support' },
  { name: 'readiness-empty', hash: '#/readiness-check' },
  { name: 'readiness-complete', hash: '#/readiness-check', run: ANSWER_READINESS },
  { name: 'consult', hash: '#/consult' },
  { name: 'consult-sent', hash: '#/consult', run: SEND_CONSULT },
  { name: 'about', hash: '#/about' },
  { name: 'sla', hash: '#/sla' },
  { name: 'privacy', hash: '#/privacy' },
  { name: 'assistant', hash: '#/assistant' },
  { name: 'consent-banner', hash: '#/', showConsent: true, viewportOnly: true }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Talks to Chrome over --remote-debugging-pipe: fd 3 in, fd 4 out, one JSON message per NUL. */
async function connect(chrome) {
  const [input, output] = [chrome.stdio[3], chrome.stdio[4]];
  const pending = new Map();
  let id = 0;
  let buffer = '';
  output.setEncoding('utf8');
  output.on('data', (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      if (!message.id || !pending.has(message.id)) continue;
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  });
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    id += 1;
    pending.set(id, { resolve, reject });
    input.write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  return { send: (method, params) => call(method, params, sessionId) };
}

async function capture(cdp, viewport, shot) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile
  });
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await wait(100);
  const consent = shot.showConsent ? `localStorage.removeItem('ql-consent');` : `localStorage.setItem('ql-consent', 'declined');`;
  const { identifier } = await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: `try { ${consent} } catch (e) {}` });
  await cdp.send('Page.navigate', { url: BASE + shot.hash });
  await wait(700);
  await cdp.send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  if (shot.run) {
    await cdp.send('Runtime.evaluate', { expression: shot.run });
    await wait(250);
  }
  await cdp.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
  await wait(100);
  const params = { format: 'png' };
  if (!shot.viewportOnly) {
    const { cssContentSize } = await cdp.send('Page.getLayoutMetrics');
    params.captureBeyondViewport = true;
    params.clip = { x: 0, y: 0, width: viewport.width, height: Math.ceil(cssContentSize.height), scale: 1 };
  }
  const { data } = await cdp.send('Page.captureScreenshot', params);
  await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  writeFileSync(join(OUT, `${shot.name}-${viewport.name}.png`), Buffer.from(data, 'base64'));
  console.log(`${shot.name}-${viewport.name}.png`);
}

mkdirSync(OUT, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'ql-capture-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-pipe', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'
], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });

try {
  const cdp = await connect(chrome);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  for (const viewport of VIEWPORTS) {
    for (const shot of SHOTS) await capture(cdp, viewport, shot);
  }
} finally {
  chrome.kill();
  await wait(300);
  rmSync(profile, { recursive: true, force: true });
}
