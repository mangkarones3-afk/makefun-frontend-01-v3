// main.ts — Splitboard's hand-in program (Node 22, standard library only).
//
// The entry itself is the static frontend under app/. This program's whole
// job is to assemble the submission the grader scores: copy app/ and
// screenshots/ into the output directory, then write dossier.json there
// with the kit's vendored buildDossier, so the dossier on disk is byte for
// byte the one the scorer rebuilds from the same files. It runs twice in
// the grader and must write the same bytes both times, so nothing here
// depends on the clock, the network or the environment beyond the output
// directory's location.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts     (the grader's default is /output)

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Stage the two trees the dossier is built from.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (see the kit's RULES.txt, "The gate"): only
// text_max_bytes shapes the dossier's bytes; the rest make this program
// refuse exactly what the scorer would refuse — a fourth screenshot, one
// screenshot over 256 KiB, or an app/ past 993 entries or 16 MiB.
const dossier = buildDossier(out, {
  text_max_bytes: 163_840,
  screenshots: { max: 3, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 16_777_216,
});
writeFileSync(join(out, 'dossier.json'), dossier);
const staged = readdirSync(join(out, 'app')).length + readdirSync(join(out, 'screenshots')).length;
console.log(`dossier.json written to ${out} (${dossier.length} bytes, ${staged} staged files)`);
