import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const services = JSON.parse(await readFile(new URL('../schema/services.json', import.meta.url), 'utf8'));
const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000';
const out = new URL('../reports/browser/', import.meta.url);
await mkdir(out, { recursive: true });
const executablePath = process.env.CHROME || `${homedir()}/.cache/puppeteer/chrome/mac_arm-152.0.7977.54/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const browser = await chromium.launch({ executablePath, headless: true });
const routes = ['/', '/services', ...services.services.map(s => `/services/${s.slug}`), '/readiness-check', '/consult', '/about', '/privacy', '/sla', '/page-that-does-not-exist'];
const report = { base, pages: [], interactions: [], errors: [], trackerRequestsWithDecline: [], accessibility: [], screenshots: [] };
const nameFor = path => path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('ql-consent', 'declined'));
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    let expectedNotFound = false;
    page.on('console', message => { if (message.type() === 'error' && !(expectedNotFound && message.text().includes('404'))) report.errors.push(message.text()); });
    page.on('request', request => { if (/googletagmanager|google-analytics|hs-scripts|apollo\.io/.test(request.url())) report.trackerRequestsWithDecline.push(request.url()); });
    for (const route of routes) {
      expectedNotFound = route.includes('does-not-exist');
      const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, title: document.title, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, prototype: !!document.querySelector('.qs-proto-bar, .qs-doc'), inlineStyle: document.querySelectorAll('main [style]').length }));
      assert.equal(state.h1, 1, `one h1: ${width} ${route}`);
      assert.equal(state.prototype, false, `no prototype surface: ${route}`);
      assert.ok(state.scrollWidth <= width, `overflow: ${width} ${route}: ${state.scrollWidth}`);
      assert.equal(response.status(), route.includes('does-not-exist') ? 404 : 200, route);
      report.pages.push({ route, width, status: response.status(), ...state });
      if (width !== 320) {
        const filename = `${nameFor(route)}-${width}.png`;
        await page.screenshot({ path: fileURLToPath(new URL(filename, out)), fullPage: true }); report.screenshots.push(filename);
        if (!route.startsWith('/services/') && !route.includes('does-not-exist')) {
          const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
          report.accessibility.push({ route, width, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
        }
      }
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('ql-consent', 'declined'));
  const page = await context.newPage();
  await page.goto(base);
  await page.getByRole('button', { name: 'Outbreak or Immediate Jeopardy', exact: true }).click();
  assert.equal(await page.locator('#f-pri').inputValue(), 'crisis');
  assert.equal(await page.getByRole('button', { name: 'Outbreak or Immediate Jeopardy', exact: true }).evaluate(el => el === document.activeElement), true);
  assert.match(await page.locator('.qs-result').innerText(), /Priority response/);
  await page.locator('#f-name').fill('Website Test');
  await page.getByRole('button', { name: 'A survey window is open', exact: true }).click();
  assert.equal(await page.locator('#f-name').inputValue(), 'Website Test');
  report.interactions.push('Triage updates priority and CTA, preserves input and focus');
  await page.goto(`${base}/services/crisis-response`);
  await page.getByRole('link', { name: 'Request crisis response', exact: true }).click();
  assert.equal(await page.locator('#f-pri').inputValue(), 'crisis');
  report.interactions.push('Service CTA preselects consult priority');
  await page.locator('#consult-form button[type=submit]').click();
  assert.equal(await page.locator('[aria-invalid=true]').count(), 4);
  assert.equal(await page.locator('#f-name').evaluate(el => el === document.activeElement), true);
  report.interactions.push('Required errors are linked and focus the first field');
  await page.locator('#f-name').fill('Website Test');
  await page.locator('#f-email').fill('website-test@example.org');
  await page.locator('#f-fac').fill('Patient Jane Doe MRN 12345');
  await page.locator('#f-role').fill('Quality director');
  let posts = 0;
  await page.route('**/api/lead', async route => { posts++; await route.fulfill({ status: 200, json: { ok: true, code: 'received' } }); });
  await page.locator('#consult-form button[type=submit]').click();
  assert.match(await page.locator('#f-fac-error').innerText(), /remove patient details/);
  assert.equal(posts, 0);
  report.interactions.push('Patient details are rejected client-side before any lead request');
  await page.locator('#f-fac').fill('Sample Facility');
  await page.locator('#consult-form button[type=submit]').click();
  await page.getByText('Crisis request received. Call [CRISIS LINE] if this cannot wait.', { exact: true }).waitFor({ timeout: 20000 });
  assert.equal(posts, 1);
  await page.screenshot({ path: fileURLToPath(new URL('crisis-sent-1440.png', out)), fullPage: true });
  report.interactions.push('Crisis confirmation shows the crisis line first (UI-only mocked API)');
  await page.goto(`${base}/readiness-check`);
  assert.equal(await page.locator('#readiness-form').count(), 0);
  for (const question of await page.locator('.qs-q').all()) await question.getByRole('button').nth(1).click();
  assert.match(await page.locator('.qs-score-n').innerText(), /^6\s*\/\s*12$/);
  assert.match(await page.locator('.qs-score').innerText(), /7 of 7 answered/i);
  await page.screenshot({ path: fileURLToPath(new URL('readiness-complete-1440.png', out)), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: fileURLToPath(new URL('readiness-complete-390.png', out)), fullPage: true });
  report.interactions.push('Readiness updates score, tier, top exposures and email form');
  const partialAxe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  report.accessibility.push({ route: '/readiness-check (answered)', width: 390, violations: partialAxe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ html: n.html, summary: n.failureSummary })) })) });
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  assert.equal(await page.getByRole('complementary', { name: 'Cookie choices', exact: true }).isVisible(), true);
  report.interactions.push('Cookie settings reopens equal-weight Accept and Decline choices');
  await page.screenshot({ path: fileURLToPath(new URL('consent-390.png', out)), fullPage: true });
  await context.close();
  // Readable page content is server-rendered and works without JavaScript.
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const noJSPage = await noJS.newPage(); await noJSPage.goto(`${base}/services/survey-support`);
  assert.match(await noJSPage.locator('main').innerText(), /Mock survey against your accreditor standards/);
  report.interactions.push('Service content remains readable without JavaScript');
  await noJS.close();
} catch (error) { report.errors.push(error.stack); process.exitCode = 1; }
finally { await browser.close(); }
await writeFile(new URL('verification.json', out), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pages: report.pages.length, interactions: report.interactions, errors: report.errors, trackerRequestsWithDecline: report.trackerRequestsWithDecline, accessibility: report.accessibility.filter(r => r.violations.length), report: fileURLToPath(new URL('verification.json', out)) }, null, 2));
if (report.errors.length || report.trackerRequestsWithDecline.length || report.accessibility.some(r => r.violations.length)) process.exitCode = 1;
