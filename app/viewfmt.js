// viewfmt.js — formatters only the lazy views need (dates, win rates,
// images, wallets), kept out of format.js so the first load stays small.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dateUtc(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm} UTC`;
}

// Win rates travel as micro-percents: 956066 means 95.6066%.
export const winRate = (micro) => (Number(micro) / 10000).toFixed(1) + '%';

// Image paths the API names: relative ones ("/api/avatars/…") become
// absolute on make.fun. Anything pointing at another origin is dropped —
// the app loads only its own files and https://make.fun, nothing else.
export const imgUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('/')) return 'https://make.fun' + p;
  return p.startsWith('https://make.fun/') ? p : '';
};

export const shortWallet = (a) => (a ? a.slice(0, 4) + '…' + a.slice(-4) : '—');
