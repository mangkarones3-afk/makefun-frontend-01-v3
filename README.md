# makefun-frontend-01-v3

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v3/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/mangkarones3-afk/makefun-frontend-01-v3/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Splitboard — a read-only make.fun client in plain static files, no build step and no framework. Its home view is a split pane: the live bounty board on the left (live pot, entry fee, time left and entry count for every open bounty, with search, category filter and sorting that cost no requests) and the selected bounty's page on the right (facts with the pot's breakdown, the rewards table at today's pot — prize now, base and fee share — a leaderboard preview and the brief). A bounty's full page, its leaderboard (windowed: 60 rows in the DOM at a time, appended in place) and public profiles each have their own hash route and are loaded on demand. Every view carries the same status strip — "this view: N API requests · X unchanged (ETag) · Y from cache · rows drawn · updated HH:MM:SS UTC" — because every read goes through one small cache that dedupes in-flight requests, serves fresh answers from memory and revalidates the rest with ETags (make.fun binds them to the minute, so an unchanged answer costs a 304). The first load is three files, under five kilobytes gzipped; whether a bounty still takes entries is judged by its deadline, never by its status flag alone.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. `node main.ts` (with `MAKEFUN_OUTPUT_DIR` set outside the grader) assembles the submission: `app/` and `screenshots/` copied to the output directory plus the `dossier.json` the judge reads.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ram1fzcx&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
