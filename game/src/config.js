// Neon Courier: Dawn Rush — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 17,
  accel: 3000,
  maxSpeed: 460,
  boostSpeed: 680,
  drag: 2.4,
  invulnerable: 1.6,
};

export const LIVES = 3;

/** Parcel kinds. */
export const KIND_NORMAL = 0;
export const KIND_GOLDEN = 1;
export const KIND_FRAGILE = 2;
export const KIND_EXPRESS = 3;

export const PARCEL = {
  radius: 20,
  interval: 0.8,
  intervalScale: 0.9,
  minInterval: 0.5,
  drift: 95,
  driftPerLevel: 12,
  goldenChance: 0.08,
  fragileChance: 0.14,
  expressChance: 0.12,
  fragileLife: 6,
  expressLife: 5,
  basePoints: 100,
  goldenPoints: 500,
  fragilePoints: 250,
  expressPoints: 200,
  stormBonus: 150,
};

export const COMBO = { window: 4, max: 5 };

export const DRONE = {
  radius: 20,
  count: 1,
  perLevel: 1,
  speed: 135,
  speedPerLevel: 18,
  nearMiss: 26,
  nearMissPoints: 25,
};

export const TOWER = {
  count: 2,
  perLevel: 1,
  width: 64,
  minHeight: 130,
  maxHeight: 290,
};

export const SHIELD = { interval: 26 };

export const STORM = {
  interval: 20,
  duration: 9,
  radius: 150,
  slow: 0.55,
};

export const RIVAL = {
  radius: 17,
  speed: 310,
  overtakePoints: 50,
  catchPause: 1.4,
};

/** Deliveries per level; districts rise with the level. */
export const LEVEL = { perLevel: 8, max: 6 };

export const DISTRICTS = [
  { name: 'PELABUHAN TUA', tag: 'SHIFT DIMULAI — PELABUHAN TUA' },
  { name: 'KOTA NEON', tag: 'LEVEL 2 — KOTA NEON' },
  { name: 'MENARA BADAI', tag: 'LEVEL 3 — MENARA BADAI' },
  { name: 'FAJAR NAIK', tag: 'LEVEL 4 — FAJAR NAIK' },
  { name: 'PUNCAK FAJAR', tag: 'LEVEL 5 — PUNCAK FAJAR' },
  { name: 'GOLDEN HOUR', tag: 'LEVEL 6 — GOLDEN HOUR' },
];

/** Named customers: one-line story stakes shown when their parcel is caught. */
export const CUSTOMERS = [
  { name: 'Maya', line: 'obat buat nenek, cepat!' },
  { name: 'Budi', line: 'kopi panas buat ronda malam' },
  { name: 'Sari', line: 'kado ultah buat anakku' },
  { name: 'Dewi', line: 'bunga buat ibu' },
  { name: 'Andi', line: 'laptop buat kerja shift' },
  { name: 'Rina', line: 'nasi hangat buat ayah' },
  { name: 'Joko', line: 'sparepart buat bengkel' },
  { name: 'Lina', line: 'buku buat ujian besok' },
  { name: 'Pak RT', line: 'surat buat warga' },
  { name: 'Nadia', line: 'kue buat hajatan' },
];

export const PALETTE = {
  nightTop: '#070b1d',
  nightMid: '#101736',
  dawnTop: '#2b1e4d',
  dawnMid: '#b34a6e',
  dawnHorizon: '#ff9a5a',
  sun: '#ffd27a',
  buildingFar: '#141a30',
  buildingNear: '#0d1226',
  windowLit: '#ffd166',
  windowDim: '#2c3a5e',
  street: '#0a0e1e',
  streetLine: '#22304f',
  player: '#37e6c8',
  playerDark: '#0e8f7d',
  rival: '#ff5d8f',
  rivalDark: '#a11e4e',
  parcel: '#ffd166',
  golden: '#fff3a0',
  fragile: '#ff9ecf',
  express: '#7dd8ff',
  drone: '#ff4d4d',
  tower: '#1c2440',
  towerBeacon: '#ff3b30',
  shield: '#5df2ff',
  storm: 'rgba(70, 90, 160, 0.35)',
  rain: 'rgba(160, 190, 255, 0.5)',
  text: '#f4f7ff',
  muted: '#9aa7c7',
  panel: 'rgba(10, 14, 30, 0.78)',
  danger: '#ff5d5d',
  gold: '#ffd166',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'neon-courier-dawn-rush.best';
