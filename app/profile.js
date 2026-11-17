// profile.js — an account's public profile (route #/u/<handle>): its
// record as stat tiles and every entry it has made, each row linking back
// to that entry's bounty. Avatar images are make.fun's own and are loaded
// with crossorigin="anonymous", as their CORP header requires.

import { profile } from './endpoints.js';
import { esc, money, num } from './core.js';
import { dateUtc, imgUrl, shortWallet, winRate } from './viewfmt.js';
import { viewCss } from './viewcss.js';

function scoreText(sol) {
  if (!sol?.score) return '—';
  const { column, value } = sol.score;
  return column?.key === 'judge' ? winRate(value) : esc(sol.score.display ?? value);
}

export async function renderProfile(el, handle) {
  viewCss();
  window.__shotReady = false;
  el.innerHTML = `<p class="note">Loading the profile…</p>`;
  const p = await profile(handle);
  const r = p.record || {};
  const avatar = imgUrl(p.avatar?.url || p.image);
  const tiles = [
    ['Entered', num(r.competitions_entered || 0), 'bounties'],
    ['Placed', num(r.competitions_placed || 0), 'in paid places'],
    ['Won', num(r.competitions_won || 0), 'first places'],
    ['Podiums', num(r.podium_finishes || 0), 'top-three finishes'],
    ['Best place', r.best_placement ? '#' + r.best_placement : '—', 'so far'],
    ['Prizes', money(r.prize_usd || 0), 'won on make.fun'],
  ];
  const rows = (p.solutions || []).map((s) => `<tr>
    <td><a href="#/bounty/${esc(s.competition.slug)}">${esc(s.competition.title)}</a>
      <div class="note">${esc(s.title || '')}</div></td>
    <td class="n">${scoreText(s)}</td>
    <td class="n">${s.placement ? '#' + s.placement : '—'}</td>
    <td class="n">${s.prize_usd ? money(s.prize_usd) : '—'}</td>
    <td>${dateUtc(s.entered_at)}</td></tr>`).join('');
  const facts = tiles.map(([k, v, s]) => `<div class="fact"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join('');
  el.innerHTML = `
    <p class="sub"><a href="#/">← Board</a> · Profile</p>
    <section class="pane">
      <div class="prof-head">
        ${avatar ? `<img crossorigin="anonymous" src="${esc(avatar)}" alt="" width="56" height="56">` : ''}
        <div><h1>@${esc(p.handle)}${p.display_name ? ` · ${esc(p.display_name)}` : ''}</h1>
        <p class="sub">${esc(p.bio || '')}</p>
        <p class="note">Joined ${dateUtc(p.joined_at)} · wallet ${esc(shortWallet(p.wallet?.address))}${p.github_login ? ` · GitHub @${esc(p.github_login)}` : ''}</p></div>
      </div>
      <div class="facts">${facts}</div>
      <h2>Entries (${(p.solutions || []).length})</h2>
      ${rows ? `<table><tr><th>Bounty · entry</th><th class="n">Score</th><th class="n">Place</th><th class="n">Prize</th><th>Entered</th></tr>${rows}</table>` : '<p class="note">No entries yet.</p>'}
    </section>`;
  window.__shotReady = true;
}
