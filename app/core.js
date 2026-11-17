// core.js — shared network layer and formatters. GETs on
// make.fun/api behind a memory cache, ETag revalidation (a 304
// past the freshness window) and in-flight dedupe. The counters
// below are the status strip's raw numbers.

const BASE = 'https://make.fun/api';

export const net = { requests: 0, unchanged: 0, cached: 0, updatedAt: null };
const memory = new Map();   // url -> {etag, body, at}
const flying = new Map();   // url -> Promise

export async function get(path, { force = false } = {}) {
  const url = BASE + path;
  const hit = memory.get(url);
  if (!force && hit && Date.now() - hit.at < 20000) { net.cached += 1; return hit.body; }
  if (flying.has(url)) return flying.get(url);
  const job = (async () => {
    net.requests += 1;
    const res = await fetch(url, { headers: hit?.etag ? { 'If-None-Match': hit.etag } : {} });
    net.updatedAt = new Date();
    if (res.status === 304 && hit) { hit.at = Date.now(); net.unchanged += 1; return hit.body; }
    if (!res.ok) throw new Error(`make.fun answered ${res.status} on ${path}`);
    const body = await res.json();
    memory.set(url, { etag: res.headers.get('etag'), body, at: Date.now() });
    return body;
  })();
  flying.set(url, job);
  try { return await job; } finally { flying.delete(url); }
}

// Cursor-paginated; a repeated cursor ends the walk.
export async function boardList(opts) {
  const items = [], seen = new Set();
  let cursor = null;
  for (let page = 0; page < 5; page += 1) {
    const q = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
    const body = await get(`/competitions?status=open&activity=times${q}`, opts);
    if (Array.isArray(body?.items)) items.push(...body.items);
    if (!body?.next_cursor || seen.has(body.next_cursor)) break;
    seen.add(body.next_cursor);
    cursor = body.next_cursor;
  }
  return items;
}

// Formatters. (Dates and win rates live in viewfmt.js.)

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const grp = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const num = (v) => grp(String(Math.trunc(Number(v) || 0)));

// Money: number or string; whole dollars when whole.
export function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '$0';
  return '$' + (Number.isInteger(n) ? grp(String(n)) : grp(n.toFixed(2)));
}

export const feeLabel = (usd) => (Number(usd) > 0 ? money(usd) + ' entry' : 'Free entry');

// The deadline decides "live", not the reported status.
export function timeLeft(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return { text: 'Ended', live: false };
  const m = Math.floor(ms / 60000);
  if (m < 60) return { text: `${m}m left`, live: true };
  const h = Math.floor(m / 60);
  if (h < 48) return { text: `${h}h ${m % 60}m left`, live: true };
  return { text: `${Math.floor(h / 24)}d ${h % 24}h left`, live: true };
}

export function clockUtc(d = new Date()) {
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()]
    .map((n) => String(n).padStart(2, '0')).join(':');
}
