// Neon Courier: Dawn Rush — a best-game-01 entry (Node 22, standard library
// only). The game is this directory's game/ folder: plain static files a
// desktop browser loads offline (game/index.html and its ES modules, no
// library, no network request). This program hands it in: it copies game/
// and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// The game: fly a courier drone over a neon city at daybreak. Catch glowing
// parcels, chain them into combos, beat a rival courier, dodge storm drones
// and blackout towers, and fly through storm cells for STORM RUNNER bonuses.
// Title screen, score, lives and levels, pause, game over and restart,
// synthesised WebAudio sound, 3 districts that rise with the level while the
// sky lightens from night into dawn.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything, when the entry is incomplete: a
// missing game or a missing/oversized screenshot is a broken entry, and a
// silent half-copy would only surface as a failed grade.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('entry incomplete: game/index.html is missing');
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) throw new Error('entry incomplete: screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort();
if (shots.length === 0) throw new Error('entry incomplete: no screenshots in screenshots/');
if (shots.length > 4) throw new Error(`entry incomplete: ${shots.length} screenshots, at most 4 allowed`);
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 262144) throw new Error(`entry incomplete: screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
