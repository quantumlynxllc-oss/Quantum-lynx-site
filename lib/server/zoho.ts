import 'server-only';
import type { Lead } from '@/lib/lead';
import { leadNote, type Enrichment } from '@/lib/server/lead-context';
import type { Route } from '@/lib/server/scoring';

const regions: Record<string, string> = {
  'https://accounts.zoho.com': 'https://www.zohoapis.com',
  'https://accounts.zoho.eu': 'https://www.zohoapis.eu',
  'https://accounts.zoho.in': 'https://www.zohoapis.in',
  'https://accounts.zoho.com.au': 'https://www.zohoapis.com.au',
  'https://accounts.zoho.jp': 'https://www.zohoapis.jp',
  'https://accounts.zohocloud.ca': 'https://www.zohoapis.ca',
  'https://accounts.zoho.com.cn': 'https://www.zohoapis.com.cn'
};
type Session = { token: string; api: string; expires: number; credentials: string };
type RecordResult = { status?: string; code?: string; details?: { id?: string } };
type ZohoLead = { id: string; Email?: string; First_Name?: string; Last_Name?: string };
let session: Session | undefined;
let refreshing: Promise<Session> | undefined;

async function accessToken(): Promise<Session> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accounts = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
  const api = regions[accounts];
  if (!clientId || !clientSecret || !refreshToken || !api) throw new Error('zoho_unconfigured');
  const credentials = JSON.stringify([accounts, clientId, clientSecret, refreshToken]);
  if (session && session.credentials === credentials && session.expires > Date.now()) return session;
  if (!refreshing) refreshing = (async () => {
    const response = await fetch(`${accounts}/oauth/v2/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }),
      signal: AbortSignal.timeout(8000), cache: 'no-store'
    });
    const data = await response.json() as { access_token?: string; expires_in?: number; api_domain?: string };
    if (!response.ok || !data.access_token || data.api_domain !== api) throw new Error('zoho_authorization_failed');
    session = { token: data.access_token, api, credentials, expires: Date.now() + (Math.max(60, Number(data.expires_in) || 3600) - 60) * 1000 };
    return session;
  })().finally(() => { refreshing = undefined; });
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T | undefined> {
  const auth = await accessToken();
  const response = await fetch(`${auth.api}/crm/v8${path}`, {
    ...init, headers: { 'Content-Type': 'application/json', Authorization: `Zoho-oauthtoken ${auth.token}` },
    signal: AbortSignal.timeout(8000), cache: 'no-store'
  });
  if (response.status === 401 && retry) { session = undefined; return request<T>(path, init, false); }
  if (!response.ok) throw new Error(`zoho_${response.status}`);
  if (response.status === 204) return undefined;
  return response.json() as Promise<T>;
}

async function write(path: string, data: Record<string, unknown>, method = 'POST', extra: Record<string, unknown> = {}) {
  const result = await request<{ data?: RecordResult[] }>(path, { method, body: JSON.stringify({ data: [data], trigger: [], ...extra }) });
  const record = result?.data?.[0];
  // Zoho can return HTTP 200/207 with a per-record error. Never call that delivery.
  if (record?.status !== 'success' || record.code !== 'SUCCESS' || !record.details?.id) throw new Error('zoho_record_rejected');
  return record.details.id;
}

function identity(lead: Lead, current?: ZohoLead) {
  const parts = lead.name?.trim().split(/\s+/);
  // Preserve existing contact names for the email-only Readiness Check.
  // The full submitted name is retained in the intake note if a CRM field is shorter.
  return {
    Email: lead.email,
    ...(parts?.length ? { First_Name: parts.length > 1 ? parts[0].slice(0, 40) : '', Last_Name: (parts.length > 1 ? parts.slice(1).join(' ') : parts[0]).slice(0, 80) } : current ? {} : { Last_Name: lead.email.slice(0, 80) }),
    ...(lead.company ? { Company: lead.company } : {}), ...(lead.jobtitle ? { Designation: lead.jobtitle.slice(0, 100) } : {}),
    ...(lead.phone ? { Phone: lead.phone.slice(0, 30) } : {})
  };
}

export async function captureZoho(lead: Lead) {
  const found = await request<{ data?: ZohoLead[] }>(`/Leads/search?email=${encodeURIComponent(lead.email)}`);
  // Search includes secondary email fields: only update an exact primary-email match.
  const current = found?.data?.find(record => record.Email?.toLowerCase() === lead.email.toLowerCase());
  const id = current
    ? await write(`/Leads/${encodeURIComponent(current.id)}`, identity(lead, current), 'PUT')
    : await write('/Leads/upsert', identity(lead), 'POST', { duplicate_check_fields: ['Email'] });
  // No custom fields are available on the connected account. Append context without
  // replacing owner, stage, marketing preferences, or a person's existing notes.
  await write(`/Leads/${encodeURIComponent(id)}/Notes`, { Parent_Id: { module: { api_name: 'Leads' }, id }, Note_Title: 'Quantum Lynx website intake', Note_Content: leadNote(lead), '$is_shared_to_client': false });
  return { id };
}

export async function updateCompany(leadId: string, lead: Lead, enrichment?: Enrichment) {
  if (enrichment) await write(`/Leads/${encodeURIComponent(leadId)}/Notes`, { Parent_Id: { module: { api_name: 'Leads' }, id: leadId }, Note_Title: 'Website company enrichment', Note_Content: leadNote(lead, enrichment), '$is_shared_to_client': false });
}
export async function updateLead(leadId: string, lead: Lead) {
  await write(`/Leads/${encodeURIComponent(leadId)}/Notes`, { Parent_Id: { module: { api_name: 'Leads' }, id: leadId }, Note_Title: 'Website routing', Note_Content: leadNote(lead), '$is_shared_to_client': false });
}
export async function routeTask(leadId: string, lead: Lead, route: Route) {
  const titles: Record<Route, string> = { call_now: 'CRISIS: contact a person now', call_today: 'Contact this website lead today', consult_sequence: 'Follow up with consult scheduler', nurture: 'Send requested summary and review follow-up' };
  await write('/Tasks', {
    Subject: titles[route], Description: leadNote(lead), Due_Date: new Date().toISOString().slice(0, 10),
    Status: 'Not Started', Priority: route === 'call_now' ? 'High' : 'Normal',
    What_Id: { id: leadId }, '$se_module': 'Leads',
    ...(process.env.ZOHO_OWNER_ID ? { Owner: { id: process.env.ZOHO_OWNER_ID } } : {})
  });
}
