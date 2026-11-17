// main.js — shell: status strip, router, split board.
// Other views load by import().
import { boardList, clockUtc, esc, feeLabel, money, net, num, timeLeft } from './core.js';

const view = document.getElementById('view');
const stripText = document.getElementById('strip-text');
let route;
let baseline = { ...net };
let boardItems = null;
let boardUi = { q: '', cat: 'All', sort: 'closing' };

function paintStrip() {
  const r = net.requests - baseline.requests;
  const u = net.unchanged - baseline.unchanged;
  const c = net.cached - baseline.cached;
  const at = net.updatedAt ? clockUtc(net.updatedAt) : '—';
  const dom = window.__domNote ? ` · ${window.__domNote}` : '';
  stripText.innerHTML = `this view: <b>${r} API request${r === 1 ? '' : 's'}</b> · ${u} unchanged (ETag) · ${c} from cache${dom} · updated ${at} UTC`;
}
// The leaderboard repaints the strip via this.
window.__paintStrip = paintStrip;

function parseRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') return { name: 'leaderboard', slug: parts[1] };
  if (parts[0] === 'bounty' && parts[1]) return { name: 'bounty', slug: parts[1] };
  if (parts[0] === 'u' && parts[1]) return { name: 'profile', handle: parts[1] };
  if (parts[0] === 'board' && parts[1]) return { name: 'board', slug: parts[1] };
  return { name: 'board', slug: null };
}

const SORTS = {
  // Live first, nearest deadline first; ended sink.
  closing: (a, b) => (timeLeft(a.deadline).live ? 0 : 1) - (timeLeft(b.deadline).live ? 0 : 1)
    || new Date(a.deadline) - new Date(b.deadline),
  pot: (a, b) => Number(b.potUsd) - Number(a.potUsd),
  entries: (a, b) => (b.submissionCount || 0) - (a.submissionCount || 0),
};

function visibleItems() {
  const q = boardUi.q.trim().toLowerCase();
  return boardItems
    .filter((c) => (boardUi.cat === 'All' || c.category === boardUi.cat)
      && (!q || (c.title + ' ' + c.slug).toLowerCase().includes(q)))
    .sort(SORTS[boardUi.sort]);
}

function rowHtml(c, sel) {
  const left = timeLeft(c.deadline);
  return `<a class="brow${c.slug === sel ? ' sel' : ''}" href="#/board/${esc(c.slug)}"><span class="t">${esc(c.title)}</span><span class="m"><span class="pot">${money(c.potUsd ?? c.rewardAmount)}</span> <span>${esc(feeLabel(c.entryFeeUsd))}</span> <span class="${left.live ? 'live' : 'ended'}" data-left="${esc(c.deadline)}">${left.text}</span> <span><b>${num(c.submissionCount || 0)}</b> entries</span></span></a>`;
}

async function renderBoard() {
  window.__shotReady = false;
  const { viewCss } = await import('./viewcss.js');
  viewCss(); // board CSS, in place before paint
  view.innerHTML = `<p class="note">Loading the live board…</p>`;
  boardItems = await boardList();
  const cats = ['All', ...new Set(boardItems.map((c) => c.category).filter(Boolean))];
  if (!cats.includes(boardUi.cat)) boardUi.cat = 'All';
  const sel = route.slug && boardItems.some((c) => c.slug === route.slug)
    ? route.slug
    : (boardItems.some((c) => c.slug === 'makefun-frontend-01') ? 'makefun-frontend-01' : boardItems[0]?.slug);
  const live = boardItems.filter((c) => timeLeft(c.deadline).live);
  const pot = live.reduce((s, c) => s + Number(c.potUsd || 0), 0);
  const catOpts = cats.map((c) => '<option' + (c === boardUi.cat ? ' selected' : '') + '>' + esc(c) + '</option>').join('');
  view.innerHTML = `<p class="stats"><span><b>${live.length}</b> live bounties</span>·<span><b>${money(pot)}</b> in live pots</span></p><div class="tools"><input type="search" id="q" placeholder="Filter bounties by name" value="${esc(boardUi.q)}" aria-label="Filter bounties"><select id="cat" aria-label="Category">${catOpts}</select><select id="sort" aria-label="Sort"><option value="closing"${boardUi.sort === 'closing' ? ' selected' : ''}>Closing soon</option><option value="pot"${boardUi.sort === 'pot' ? ' selected' : ''}>Biggest pot</option><option value="entries"${boardUi.sort === 'entries' ? ' selected' : ''}>Most entries</option></select></div><div class="split"><div class="board" id="rows"></div><section class="pane" id="pane">Loading the selected bounty…</section></div>`;
  const rows = view.querySelector('#rows');
  const paintRows = () => {
    const items = visibleItems();
    rows.innerHTML = items.map((c) => rowHtml(c, sel)).join('') || '<p class="note">No bounty matches that filter.</p>';
    window.__domNote = `${items.length} of ${boardItems.length} rows drawn`;
    paintStrip();
  };
  paintRows();
  view.querySelector('#q').addEventListener('input', (e) => { boardUi.q = e.target.value; paintRows(); });
  view.querySelector('#cat').addEventListener('change', (e) => { boardUi.cat = e.target.value; paintRows(); });
  view.querySelector('#sort').addEventListener('change', (e) => { boardUi.sort = e.target.value; paintRows(); });
  const { renderPane } = await import('./detail.js');
  const item = boardItems.find((c) => c.slug === sel);
  const fresh = await renderPane(view.querySelector('#pane'), sel, item);
  // Sync the pane's fresher entry count into its row.
  if (item && fresh?.submissionCount != null && item.submissionCount !== fresh.submissionCount) {
    item.submissionCount = fresh.submissionCount;
    paintRows();
  }
  paintStrip();
  window.__shotReady = true;
}

async function render() {
  route = parseRoute();
  window.__shotReady = false; // flag drops at route start
  window.__domNote = '';
  baseline = { requests: net.requests, unchanged: net.unchanged, cached: net.cached };
  paintStrip();
  try {
    if (route.name === 'board') await renderBoard();
    else if (route.name === 'bounty') { const m = await import('./detail.js'); await m.renderBountyPage(view, route.slug); }
    else if (route.name === 'leaderboard') { const m = await import('./leaderboard.js'); await m.renderLeaderboard(view, route.slug); }
    else if (route.name === 'profile') { const m = await import('./profile.js'); await m.renderProfile(view, route.handle); }
  } catch (err) {
    view.innerHTML = `<div class="err">This view could not load: ${esc(err.message)}. <a href="#/">Back to the board</a></div>`;
  }
  paintStrip();
}

document.getElementById('lookup').addEventListener('submit', (e) => {
  e.preventDefault();
  const h = document.getElementById('lookup-handle').value.trim().replace(/^@/, '');
  if (h) location.hash = `#/u/${encodeURIComponent(h)}`;
});
document.getElementById('refresh').addEventListener('click', async () => {
  if (route.name === 'board') boardItems = await boardList({ force: true });
  render();
});
window.addEventListener('hashchange', render);
window.__shotReady = false;
render();
