// leaderboard.js — a bounty's full leaderboard (route
// #/bounty/<slug>/leaderboard). Boards run to hundreds of ranked entries,
// so the table is windowed: 60 rows live in the DOM at a time and the next
// window is appended in place — the whole list is never built at once.
// The note under the heading states that strategy on the page itself.

import { competition, leaderboard } from './endpoints.js';
import { esc, num } from './core.js';
import { imgUrl, winRate } from './viewfmt.js';
import { viewCss } from './viewcss.js';

const WINDOW = 60;

function rowHtml(e) {
  const j = e.judge || {};
  const av = imgUrl(e.image);
  const rec = j.wins != null ? `${j.wins}W · ${j.draws || 0}D · ${j.losses || 0}L` : '—';
  const iv = e.interval ? `${winRate(e.interval.low)} – ${winRate(e.interval.high)}` : '—';
  return `<tr>
    <td class="n"><b>${e.rank}</b></td>
    <td>${av ? `<img class="avatar" crossorigin="anonymous" src="${esc(av)}" alt="" width="22" height="22" loading="lazy">` : ''}<a href="#/u/${esc(e.handle)}">@${esc(e.handle)}</a>
      <div class="note">${esc(e.title || '')}</div></td>
    <td class="n"><b>${winRate(e.values?.judge)}</b></td>
    <td class="n">${iv}</td>
    <td class="n">${rec}</td>
    <td class="n">${e.values?.bytes ? (Number(e.values.bytes) / 1024).toFixed(1) + ' KB' : '—'}</td></tr>`;
}

export async function renderLeaderboard(el, slug) {
  viewCss();
  window.__shotReady = false;
  el.innerHTML = `<p class="note">Loading the leaderboard…</p>`;
  const [lb, c] = await Promise.all([leaderboard(slug), competition(slug).catch(() => null)]);
  const entries = lb.entries || [];
  let shown = 0;
  el.innerHTML = `
    <p class="sub"><a href="#/bounty/${esc(slug)}">← ${esc(c?.title || slug)}</a> · Leaderboard</p>
    <section class="pane">
      <h1>${esc(c?.title || slug)} — leaderboard</h1>
      <p class="sub">${num(entries.length)} ranked entries · ${esc(lb.phase?.title || 'Development')} phase, provisional until the final heat · places pay the top 20</p>
      <p class="note" id="lb-note"></p>
      <table><tr><th class="n">#</th><th>Entrant · entry</th><th class="n">Win rate</th><th class="n">90% interval</th><th class="n">Record</th><th class="n">Dossier</th></tr>
      <tbody id="lb-body"></tbody></table>
      <p class="more"><button class="ghost" id="lb-more" type="button">Show more rows</button></p>
    </section>`;
  const body = el.querySelector('#lb-body');
  const note = el.querySelector('#lb-note');
  const more = el.querySelector('#lb-more');
  const paint = () => {
    const next = Math.min(shown + WINDOW, entries.length);
    body.insertAdjacentHTML('beforeend', entries.slice(shown, next).map(rowHtml).join(''));
    shown = next;
    window.__domNote = `${shown} of ${num(entries.length)} rows drawn`;
    window.__paintStrip?.();
    note.textContent = `Windowed list · ${shown} of ${num(entries.length)} rows in the DOM · rows are appended in place, never the whole table at once · this view's requests are counted in the strip above`;
    more.style.display = shown < entries.length ? '' : 'none';
  };
  more.addEventListener('click', paint);
  paint();
  window.__shotReady = true;
}
