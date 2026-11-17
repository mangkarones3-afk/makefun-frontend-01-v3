// detail.js — one bounty's detail, in two sizes: renderPane fills the
// split board's right pane in place; renderBountyPage is the bounty's own
// full page (route #/bounty/<slug>). Both read the same competition
// answer, so opening the full page after the pane costs no new request.

import { competition, leaderboard, submissions } from './endpoints.js';
import { esc, feeLabel, money, num, timeLeft } from './core.js';
import { dateUtc, winRate } from './viewfmt.js';
import { viewCss } from './viewcss.js';
import { md } from './md.js';

function rewardsRows(c, limit) {
  const rows = Array.isArray(c.rewardsNow) && c.rewardsNow.length
    ? c.rewardsNow
    : Object.entries(c.rewards || {}).map(([place, base]) => ({ place: Number(place), baseUsd: base, feeShareUsd: 0, amountUsd: base }));
  return rows.slice(0, limit).map((r) => `<tr>
    <td class="n">${r.place}</td><td class="n"><b>${money(r.amountUsd)}</b></td>
    <td class="n">${money(r.baseUsd)}</td><td class="n">${money(r.feeShareUsd)}</td></tr>`).join('');
}

const rewardsHead = `<table><tr><th class="n">Place</th><th class="n">Prize now</th><th class="n">Base</th><th class="n">Fee share</th></tr>`;

function timelineHtml(c) {
  const open = new Date(c.opensAt || c.publishedAt).getTime();
  const end = new Date(c.deadline).getTime();
  const pct = Math.min(100, Math.max(0, ((Date.now() - open) / (end - open)) * 100));
  const left = timeLeft(c.deadline);
  return `<div class="tl"><div class="tl-track"><div class="tl-fill" style="width:${pct.toFixed(1)}%"></div></div>
    <div class="tl-labels"><span>Opened ${dateUtc(c.opensAt || c.publishedAt)}</span>
    <span>${left.live ? `Now — ${left.text}` : 'Now — ended'}</span>
    <span>Deadline ${dateUtc(c.deadline)}</span></div></div>`;
}

function factsHtml(c) {
  const left = timeLeft(c.deadline);
  const status = left.live ? 'Taking entries' : 'Ended — awaiting results';
  return `<div class="facts">
    <div class="fact"><div class="k">Live pot</div><div class="v">${money(c.potUsd)}</div>
      <div class="s">${money(c.rewardAmount)} pool + ${money(c.entryFeesUsd || 0)} fees</div></div>
    <div class="fact"><div class="k">Entry fee</div><div class="v">${Number(c.entryFeeUsd) > 0 ? money(c.entryFeeUsd) : 'Free'}</div>
      <div class="s">${c.entryFeePayers ? `paid by ${num(c.entryFeePayers)} entrants` : 'no fee on this bounty'}</div></div>
    <div class="fact"><div class="k">Status</div><div class="v" style="font-size:14.5px">${status}</div>
      <div class="s">by its deadline, not its status flag</div></div>
    <div class="fact"><div class="k">Time left</div><div class="v" data-left="${esc(c.deadline)}">${left.text}</div>
      <div class="s">deadline ${dateUtc(c.deadline)}</div></div>
    <div class="fact"><div class="k">Entries</div><div class="v">${num(c.submissionCount || 0)}</div>
      <div class="s">opened ${dateUtc(c.opensAt || c.publishedAt)}</div></div>
    <div class="fact"><div class="k">Category</div><div class="v" style="font-size:14.5px">${esc(c.category || '—')}</div>
      <div class="s">${esc(feeLabel(c.entryFeeUsd))} · escrowed on Solana</div></div>
  </div>${timelineHtml(c)}`;
}

async function previewHtml(slug) {
  try {
    const lb = await leaderboard(slug);
    const top = (lb.entries || []).slice(0, 5);
    if (!top.length) return '<p class="note">No ranked entries yet.</p>';
    return `<table><tr><th class="n">#</th><th>Entrant</th><th class="n">Win rate</th></tr>${top.map((e) => `<tr>
      <td class="n">${e.rank}</td><td><a href="#/u/${esc(e.handle)}">@${esc(e.handle)}</a></td>
      <td class="n">${winRate(e.values?.judge)}</td></tr>`).join('')}</table>`;
  } catch { return '<p class="note">Leaderboard preview unavailable right now.</p>'; }
}

export async function renderPane(el, slug, stub) {
  viewCss();
  if (!slug) { el.innerHTML = '<p class="note">No bounty selected.</p>'; return; }
  el.innerHTML = `<h1>${esc(stub?.title || slug)}</h1><p class="note">Loading its page…</p>`;
  const c = await competition(slug);
  el.innerHTML = `
    <h1>${esc(c.title)}</h1>
    <p class="sub">${esc(c.summary || '')}</p>
    ${factsHtml(c)}
    <h2>Rewards at the live pot</h2>
    ${rewardsHead}${rewardsRows(c, 10)}</table>
    <div class="cols">
      <div><h2>Leaderboard preview</h2><div id="pane-lb"></div>
        <p><a href="#/bounty/${esc(slug)}/leaderboard">Full leaderboard →</a></p></div>
      <div><h2>About this bounty</h2><div class="md">${md((c.description || '').slice(0, 1200))}</div>
        <p><a href="#/bounty/${esc(slug)}">Open the full bounty page →</a></p></div>
    </div>`;
  el.querySelector('#pane-lb').innerHTML = await previewHtml(slug);
  return c;
}

export async function renderBountyPage(el, slug) {
  viewCss();
  window.__shotReady = false;
  el.innerHTML = `<p class="note">Loading the bounty…</p>`;
  const c = await competition(slug);
  let latest = '';
  try {
    const s = await submissions(slug);
    latest = (s.items || []).slice(0, 6).map((it) => `<tr>
      <td><a href="#/u/${esc(it.handle)}">@${esc(it.handle)}</a></td><td>${esc(it.title || '')}</td>
      <td>${esc(it.status || '')}</td><td>${dateUtc(it.created_at)}</td></tr>`).join('');
  } catch { latest = ''; }
  el.innerHTML = `
    <p class="sub"><a href="#/board/${esc(slug)}">← Board</a> · Bounty</p>
    <section class="pane">
      <h1>${esc(c.title)}</h1>
      <p class="sub">${esc(c.summary || '')}</p>
      ${factsHtml(c)}
      <h2>Rewards at the live pot</h2>
      ${rewardsHead}${rewardsRows(c, 20)}</table>
      <div class="cols">
        <div><h2>Leaderboard preview</h2><div id="page-lb"></div>
          <p><a href="#/bounty/${esc(slug)}/leaderboard">Full leaderboard →</a></p></div>
        <div><h2>Latest entries</h2>${latest
          ? `<table><tr><th>Entrant</th><th>Entry</th><th>Status</th><th>Received</th></tr>${latest}</table>`
          : '<p class="note">No entries yet.</p>'}</div>
      </div>
      <h2>The brief</h2><div class="md">${md(c.description)}</div>
      <h2>Rules</h2><div class="md">${md(c.rules || c.description)}</div>
    </section>`;
  el.querySelector('#page-lb').innerHTML = await previewHtml(slug);
  window.__shotReady = true;
}
