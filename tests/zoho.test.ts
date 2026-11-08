import test from 'node:test';
import assert from 'node:assert/strict';
import { captureZoho, routeTask } from '../lib/server/zoho';
import { deliverLead } from '../lib/server/pipeline';
import { failover } from '../lib/server/delivery';
import type { Lead } from '../lib/lead';

const lead: Lead = { channel: 'form', name: 'Website Test', email: 'website-test@example.org', company: 'Sample Facility', jobtitle: 'Quality director', priority: 'survey', consent_version: 'v1' };
const accepted = (id: string) => Response.json({ data: [{ status: 'success', code: 'SUCCESS', details: { id } }] });
let counter = 0;
function configure() {
  process.env.ZOHO_CLIENT_ID = `isolated-client-${++counter}`;
  process.env.ZOHO_CLIENT_SECRET = 'test-secret'; process.env.ZOHO_REFRESH_TOKEN = 'test-refresh';
  process.env.ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';
}

test('Formspree backup keeps a flat payload and the full attribution and intake values', async t => {
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    assert.ok(Object.values(body).every(value => typeof value === 'string' || typeof value === 'number'));
    assert.equal(body.utm_campaign, 'survey-support'); assert.equal(body.ql_landing_page, '/consult');
    assert.equal(body.ql_route, 'consult_sequence'); assert.equal(body.delivery_reason, 'zoho_unavailable');
    return Response.json({ ok: true });
  });
  await failover({ ...lead, attribution: { landing_page: '/consult', utm_campaign: 'survey-support' } }, 'zoho_unavailable');
});

test('new Zoho intake deduplicates by email and appends all context without custom fields', async t => {
  configure(); const paths: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    paths.push(url);
    if (url.endsWith('/oauth/v2/token')) {
      assert.ok(init.body instanceof URLSearchParams); assert.equal(init.body.get('refresh_token'), 'test-refresh');
      assert.equal(url.includes('test-secret'), false);
      return Response.json({ access_token: 'test-access', api_domain: 'https://www.zohoapis.com', expires_in: 3600 });
    }
    assert.equal((init.headers as Record<string, string>).Authorization, 'Zoho-oauthtoken test-access');
    if (url.includes('/search?')) return new Response(null, { status: 204 });
    const body = JSON.parse(String(init.body));
    if (url.endsWith('/Leads/upsert')) {
      assert.deepEqual(body.duplicate_check_fields, ['Email']);
      assert.equal(body.data[0].Last_Name, 'Test'); assert.equal(body.data[0].Company, lead.company);
      assert.equal(body.data[0].Lead_Status, undefined); assert.equal(body.data[0].Owner, undefined);
      return accepted('123');
    }
    assert.ok(url.endsWith('/Leads/123/Notes'));
    const context = JSON.parse(body.data[0].Note_Content);
    assert.equal(context.ql_route, 'consult_sequence'); assert.equal(context.ql_lead_score, 75);
    assert.equal(context.name, lead.name); assert.equal(context.turnstile_token, undefined);
    return accepted('456');
  });
  assert.deepEqual(await captureZoho(lead), { id: '123' }); assert.equal(paths.length, 4);
});

test('readiness update matches primary email exactly and preserves names, stages and descriptions', async t => {
  configure(); const readiness: Lead = { channel: 'readiness', email: lead.email, consent_version: 'v1', readiness: { score: 6, tier: 'exposed', exposures: ['Review surveillance'] } };
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    if (url.endsWith('/token')) return Response.json({ access_token: 'access', api_domain: 'https://www.zohoapis.com' });
    if (url.includes('/search?')) return Response.json({ data: [{ id: 'wrong', Email: 'other@example.org' }, { id: '123', Email: lead.email, Last_Name: 'Existing person' }] });
    const body = JSON.parse(String(init.body));
    if (init.method === 'PUT') {
      assert.ok(url.endsWith('/Leads/123')); assert.deepEqual(body.data, [{ Email: lead.email }]); return accepted('123');
    }
    assert.equal(JSON.parse(body.data[0].Note_Content).ql_readiness_score, 6); return accepted('456');
  });
  assert.deepEqual(await captureZoho(readiness), { id: '123' });
});

test('Zoho per-record error inside HTTP 200 delivers through failover', async t => {
  configure(); let backup = false;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('/token')) return Response.json({ access_token: 'access', api_domain: 'https://www.zohoapis.com' });
    if (url.includes('/search?')) return new Response(null, { status: 204 });
    return Response.json({ data: [{ status: 'error', code: 'INVALID_DATA', details: {} }] });
  });
  const result = await deliverLead(lead, { capture: captureZoho, backup: async (_lead, reason) => { backup = true; assert.equal(reason, 'zoho_unavailable'); }, alert: async () => {}, enrich: async () => undefined, company: async () => {}, update: async () => {}, task: async () => {}, sequence: async () => false });
  assert.equal(result.destination, 'failover'); assert.equal(backup, true);
});

test('missing intake note does not report complete Zoho delivery', async t => {
  configure();
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('/token')) return Response.json({ access_token: 'access', api_domain: 'https://www.zohoapis.com' });
    if (url.includes('/search?')) return new Response(null, { status: 204 });
    return url.endsWith('/Notes') ? Response.json({ data: [{ status: 'error', code: 'NO_PERMISSION' }] }) : accepted('123');
  });
  await assert.rejects(captureZoho(lead), /zoho_record_rejected/);
});

test('expired token refreshes once and crisis creates a high-priority task linked to the lead', async t => {
  configure(); let tokens = 0; let attempts = 0;
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    if (url.endsWith('/token')) { tokens++; return Response.json({ access_token: `access-${tokens}`, api_domain: 'https://www.zohoapis.com' }); }
    if (++attempts === 1) return new Response(null, { status: 401 });
    const task = JSON.parse(String(init.body)).data[0];
    assert.equal(task.Priority, 'High'); assert.deepEqual(task.What_Id, { id: '123' });
    assert.match(task.Subject, /^CRISIS:/); assert.equal(JSON.parse(task.Description).ql_route, 'call_now');
    return accepted('789');
  });
  await routeTask('123', { ...lead, priority: 'crisis' }, 'call_now'); assert.equal(tokens, 2); assert.equal(attempts, 2);
});
