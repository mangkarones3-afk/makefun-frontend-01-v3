// endpoints.js — the API's named answers, one wrapper per surface. Only
// the lazy views use these, so they live here with them; the board's own
// list walk stays in core.js, beside the cache it depends on.

import { get } from './core.js';

const enc = encodeURIComponent;
export const competition = (slug, o) => get(`/competitions/${enc(slug)}`, o);
export const leaderboard = (slug, o) => get(`/competitions/${enc(slug)}/leaderboard`, o);
export const submissions = (slug, o) => get(`/competitions/${enc(slug)}/submissions`, o);
export const profile = (handle, o) => get(`/profiles/${enc(handle)}`, o);
