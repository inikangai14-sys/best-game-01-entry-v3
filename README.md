# best-game-01-entry-v3

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/inikangai14-sys/best-game-01-entry-v3/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/inikangai14-sys/best-game-01-entry-v3/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Neon Courier: Dawn Rush — fly a courier drone over a neon city at daybreak. Catch glowing parcels, chain them into combos, beat a rival courier to the top of the race, dodge storm drones and blackout towers, and fly through storm cells for STORM RUNNER bonuses, while the sky lightens from night into dawn as you level up through 3 districts.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `game/` over any local HTTP server and open `game/index.html`.

## How to play

- **WASD / arrow keys / mouse** — steer the drone (it chases the pointer)
- **SHIFT** — boost (drains the boost meter, refills when you ease off)
- **P / Esc** — pause · **M** — mute · **Space / click** — start / restart

Catch parcels to deliver them: normal parcels score 100 × combo, golden parcels 500 × combo, fragile parcels 250 × combo (deliver before the ring runs out), express parcels 200 × combo (fast, short window). Every catch within 3 seconds raises the combo (max ×5); a missed fragile/express parcel or a hit breaks it. Near-misses past storm drones pay +25, overtaking the rival pays +50, and catching a parcel inside a storm cell pays a +150 STORM RUNNER bonus. Every 8 deliveries levels you up into the next district — Pelabuhan Tua, Kota Neon, Menara Badai, and on toward Golden Hour. Three lives; a shield pickup absorbs one hit free.

## What is in this repo

- `main.ts` — the entry program (Node 22, standard library only): copies `game/` and `screenshots/` to `/output` and writes `dossier.json`. It fails fast when the game or a screenshot is missing or oversized.
- `game/` — the game itself, plain static files a desktop browser loads offline: `index.html` plus ES modules under `game/src/` (config, seeded RNG, input, synthesised WebAudio, world, renderer, screenshot scenes, boot loop). No libraries, no network requests.
- `screenshots/` — four real gameplay frames from the game's own `?shot=` scenes: title, play, storm rush, and shift over.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ze97ra9z&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
