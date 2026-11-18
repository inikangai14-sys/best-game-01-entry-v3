// Neon Courier: Dawn Rush — the world: a courier drone catching parcels over a
// neon city at daybreak, with a rival courier, storm cells, storm drones and
// blackout towers. Fixed 1/60 s steps; every random choice comes from the
// seeded RNG, so a seed replays exactly.

import {
  COMBO,
  CUSTOMERS,
  DISTRICTS,
  DRONE,
  FIELD,
  KIND_EXPRESS,
  KIND_FRAGILE,
  KIND_GOLDEN,
  KIND_NORMAL,
  LEVEL,
  LIVES,
  PARCEL,
  PLAYER,
  RIVAL,
  SHIELD,
  STEP,
  STORM,
  TOWER,
} from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_CATCH = 4;
export const EVENT_LEVEL = 8;
export const EVENT_OVERTAKE = 16;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createWorld(rng) {
  const state = {
    time: 0,
    score: 0,
    deliveries: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    lives: LIVES,
    level: 1,
    district: 0,
    daybreak: 0,
    boost: 1,
    shield: false,
    invuln: 0,
    shake: 0,
    flash: 0,
    inStorm: false,
    player: { x: 320, y: 360, vx: 0, vy: 0 },
    parcels: [],
    drones: [],
    towers: [],
    shieldPickups: [],
    storm: { active: false, x: 640, y: 360, r: STORM.radius, t: 0, nextIn: 14 },
    rival: { x: 200, y: 200, vx: 0, vy: 0, score: 0, deliveries: 0, cool: 0 },
    playerAhead: true,
    banner: { text: '', sub: '', t: 0 },
    floats: [],
    particles: [],
    stars: [],
    buildingsFar: [],
    buildingsNear: [],
    parcelTimer: 0.4,
    shieldTimer: 18,
    customerIdx: 0,
  };

  function spawnParcel() {
    const roll = rng.next();
    let kind = KIND_NORMAL;
    if (roll < PARCEL.goldenChance) kind = KIND_GOLDEN;
    else if (roll < PARCEL.goldenChance + PARCEL.fragileChance) kind = KIND_FRAGILE;
    else if (roll < PARCEL.goldenChance + PARCEL.fragileChance + PARCEL.expressChance) kind = KIND_EXPRESS;
    const fromLeft = rng.next() < 0.5;
    const speed = PARCEL.drift + state.level * PARCEL.driftPerLevel + (kind === KIND_EXPRESS ? 90 : 0);
    const customer = CUSTOMERS[state.customerIdx % CUSTOMERS.length];
    state.customerIdx += 1;
    state.parcels.push({
      active: true,
      kind,
      x: fromLeft ? -30 : FIELD.width + 30,
      y: rng.range(90, 620),
      baseY: 0,
      vx: fromLeft ? speed : -speed,
      bob: rng.range(0, Math.PI * 2),
      bobSpeed: rng.range(1.2, 2.4),
      life: kind === KIND_FRAGILE ? PARCEL.fragileLife : kind === KIND_EXPRESS ? PARCEL.expressLife : 999,
      customer,
    });
    const p = state.parcels[state.parcels.length - 1];
    p.baseY = p.y;
  }

  function spawnDrone() {
    state.drones.push({
      active: true,
      anchorX: rng.range(200, FIELD.width - 200),
      anchorY: rng.range(140, 560),
      phase: rng.range(0, Math.PI * 2),
      ampX: rng.range(70, 170),
      ampY: rng.range(40, 110),
      speed: rng.range(0.5, 0.9),
      x: 0,
      y: 0,
      nearMissAt: -99,
    });
  }

  function spawnTower() {
    const h = rng.range(TOWER.minHeight, TOWER.maxHeight);
    state.towers.push({
      x: rng.range(80, FIELD.width - 80 - TOWER.width),
      w: TOWER.width,
      h,
      top: FIELD.height - h,
      seed: rng.next() * 100,
    });
  }

  function spawnShield() {
    state.shieldPickups.push({
      active: true,
      x: rng.range(120, FIELD.width - 120),
      y: rng.range(120, 600),
      bob: 0,
    });
  }

  function addFloat(x, y, text, color) {
    state.floats.push({ x, y, text, color, t: 1.4 });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const a = rng.range(0, Math.PI * 2);
      const s = rng.range(40, 190);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rng.range(0.3, 0.7), color });
    }
  }

  function showBanner(text, sub) {
    state.banner = { text, sub, t: 2.6 };
  }

  function hitPlayer() {
    if (state.invuln > 0 || state.lives === 0) return 0;
    if (state.shield) {
      state.shield = false;
      state.invuln = 1.2;
      addFloat(state.player.x, state.player.y - 30, 'SHIELD!', '#5df2ff');
      return EVENT_HIT;
    }
    state.lives -= 1;
    state.invuln = PLAYER.invulnerable;
    state.shake = 0.45;
    state.combo = 0;
    state.comboTimer = 0;
    burst(state.player.x, state.player.y, '#ff5d5d', 18);
    if (state.lives <= 0) return EVENT_HIT | EVENT_OVER;
    return EVENT_HIT;
  }

  function reset() {
    state.time = 0;
    state.score = 0;
    state.deliveries = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.maxCombo = 0;
    state.lives = LIVES;
    state.level = 1;
    state.district = 0;
    state.daybreak = 0;
    state.boost = 1;
    state.shield = false;
    state.invuln = 0;
    state.shake = 0;
    state.flash = 0;
    state.inStorm = false;
    state.player = { x: 320, y: 360, vx: 0, vy: 0 };
    state.parcels = [];
    state.drones = [];
    state.towers = [];
    state.shieldPickups = [];
    state.storm = { active: false, x: 640, y: 360, r: STORM.radius, t: 0, nextIn: 14 };
    state.rival = { x: 200, y: 200, vx: 0, vy: 0, score: 0, deliveries: 0, cool: 0 };
    state.playerAhead = true;
    state.banner = { text: 'NEON COURIER', sub: 'DAWN RUSH — shift dimulai di Pelabuhan Tua', t: 3 };
    state.floats = [];
    state.particles = [];
    state.parcelTimer = 0.4;
    state.shieldTimer = 18;
    state.customerIdx = 0;
    state.stars = [];
    for (let i = 0; i < 90; i += 1) {
      state.stars.push({ x: rng.range(0, FIELD.width), y: rng.range(0, 420), r: rng.range(0.6, 2.1), tw: rng.range(0, Math.PI * 2) });
    }
    state.buildingsFar = [];
    for (let x = 0; x < FIELD.width; x += 1) {
      if (rng.next() < 0.16) {
        state.buildingsFar.push({ x, w: rng.range(36, 90), h: rng.range(90, 260), lit: rng.next() < 0.5 });
      }
    }
    state.buildingsNear = [];
    for (let x = 0; x < FIELD.width; x += 1) {
      if (rng.next() < 0.1) {
        state.buildingsNear.push({ x, w: rng.range(50, 110), h: rng.range(140, 340), lit: rng.next() < 0.65 });
      }
    }
    const droneCount = DRONE.count + DRONE.perLevel * 1;
    for (let i = 0; i < droneCount; i += 1) spawnDrone();
    for (let i = 0; i < TOWER.count + TOWER.perLevel; i += 1) spawnTower();
  }

  function step(dt, steer, ambient) {
    state.time += dt;
    const p = state.player;

    // Ambient title-screen drift: the city lives even before the player starts.
    if (ambient) {
      if (state.banner.t > 0) state.banner.t -= dt;
      for (const parcel of state.parcels) {
        parcel.x += parcel.vx * dt;
        parcel.bob += parcel.bobSpeed * dt;
      }
      state.parcels = state.parcels.filter((parcel) => parcel.x > -60 && parcel.x < FIELD.width + 60);
      state.parcelTimer -= dt;
      if (state.parcelTimer <= 0) {
        spawnParcel();
        state.parcelTimer = 1.2;
      }
      for (const d of state.drones) {
        d.phase += d.speed * dt;
        d.x = d.anchorX + Math.cos(d.phase) * d.ampX;
        d.y = d.anchorY + Math.sin(d.phase * 1.3) * d.ampY;
      }
      p.x = 320 + Math.cos(state.time * 0.5) * 60;
      p.y = 360 + Math.sin(state.time * 0.8) * 40;
      return 0;
    }

    if (state.lives === 0) return EVENT_OVER;

    // --- player physics ---
    const inStormNow = state.storm.active
      && Math.hypot(p.x - state.storm.x, p.y - state.storm.y) < state.storm.r;
    state.inStorm = inStormNow;
    const boosting = steer.boost && state.boost > 0.02;
    const top = (boosting ? PLAYER.boostSpeed : PLAYER.maxSpeed) * (inStormNow ? STORM.slow : 1);
    p.vx += steer.x * PLAYER.accel * dt;
    p.vy += steer.y * PLAYER.accel * dt;
    const damp = Math.exp(-PLAYER.drag * dt);
    p.vx *= damp;
    p.vy *= damp;
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > top) {
      p.vx = (p.vx / spd) * top;
      p.vy = (p.vy / spd) * top;
    }
    p.x = clamp(p.x + p.vx * dt, PLAYER.radius, FIELD.width - PLAYER.radius);
    p.y = clamp(p.y + p.vy * dt, PLAYER.radius + 46, FIELD.height - PLAYER.radius);
    if (boosting) state.boost = Math.max(0, state.boost - 0.45 * dt);
    else state.boost = Math.min(1, state.boost + 0.22 * dt);

    // --- timers ---
    if (state.invuln > 0) state.invuln -= dt;
    if (state.shake > 0) state.shake -= dt;
    if (state.flash > 0) state.flash -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.banner.t > 0) state.banner.t -= dt;

    // --- storm cell ---
    const storm = state.storm;
    if (storm.active) {
      storm.t -= dt;
      storm.x += 26 * dt;
      if (rng.next() < dt * 0.5) state.flash = 0.12;
      if (storm.t <= 0 || storm.x - storm.r > FIELD.width + 40) storm.active = false;
    } else {
      storm.nextIn -= dt;
      if (storm.nextIn <= 0) {
        storm.active = true;
        storm.t = STORM.duration;
        storm.x = -STORM.radius;
        storm.y = rng.range(180, 560);
        storm.nextIn = STORM.interval + rng.range(0, 6);
        showBanner('BADAI DATANG', 'hujan deras — terbang lewat celahnya!');
      }
    }

    // --- parcels ---
    state.parcelTimer -= dt;
    if (state.parcelTimer <= 0) {
      spawnParcel();
      state.parcelTimer = Math.max(
        PARCEL.minInterval,
        PARCEL.interval * Math.pow(PARCEL.intervalScale, state.level - 1),
      ) * rng.range(0.8, 1.25);
    }
    let events = 0;
    for (const parcel of state.parcels) {
      parcel.x += parcel.vx * dt;
      parcel.bob += parcel.bobSpeed * dt;
      parcel.life -= dt;
      if (parcel.life <= 0 && (parcel.kind === KIND_FRAGILE || parcel.kind === KIND_EXPRESS)) {
        parcel.active = false;
        state.combo = 0;
        state.comboTimer = 0;
        continue;
      }
      const py = parcel.baseY + Math.sin(parcel.bob) * 14;
      const d = Math.hypot(p.x - parcel.x, p.y - py);
      if (d < PLAYER.radius + PARCEL.radius) {
        parcel.active = false;
        state.combo = Math.min(state.combo + 1, COMBO.max);
        state.comboTimer = COMBO.window;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        const mult = state.combo;
        let points = PARCEL.basePoints * mult;
        let label = `+${points}`;
        if (parcel.kind === KIND_GOLDEN) {
          points = PARCEL.goldenPoints * mult;
          label = `GOLDEN +${points}`;
        } else if (parcel.kind === KIND_FRAGILE) {
          points = PARCEL.fragilePoints * mult;
          label = `FRAGILE +${points}`;
        } else if (parcel.kind === KIND_EXPRESS) {
          points = PARCEL.expressPoints * mult;
          label = `EXPRESS +${points}`;
        }
        if (inStormNow) {
          points += PARCEL.stormBonus;
          label += '  STORM RUNNER!';
        }
        state.score += points;
        state.deliveries += 1;
        addFloat(parcel.x, py - 26, label, parcel.kind === KIND_GOLDEN ? '#fff3a0' : '#ffd166');
        burst(parcel.x, py, '#ffd166', 10);
        showBanner(`${parcel.customer.name.toUpperCase()}: “${parcel.customer.line}”`, `antar ${state.deliveries} paket — kombo ×${state.combo}`);
        events |= EVENT_CATCH;
        const newLevel = Math.min(LEVEL.max, 1 + Math.floor(state.deliveries / LEVEL.perLevel));
        if (newLevel > state.level) {
          state.level = newLevel;
          state.district = Math.min(DISTRICTS.length - 1, newLevel - 1);
          showBanner(DISTRICTS[state.district].tag, `level ${newLevel} — bahaya naik, fajar makin dekat`);
          events |= EVENT_LEVEL;
        }
      }
    }
    state.parcels = state.parcels.filter((parcel) => parcel.active && parcel.x > -70 && parcel.x < FIELD.width + 70);
    state.daybreak = clamp((state.level - 1) / (LEVEL.max - 1), 0, 1);

    // --- storm drones ---
    for (const d of state.drones) {
      d.phase += d.speed * dt * (1 + (state.level - 1) * 0.12);
      d.x = d.anchorX + Math.cos(d.phase) * d.ampX;
      d.y = d.anchorY + Math.sin(d.phase * 1.3) * d.ampY;
      const dist = Math.hypot(p.x - d.x, p.y - d.y);
      if (dist < PLAYER.radius + DRONE.radius) {
        events |= hitPlayer();
        if (state.lives === 0) return events | EVENT_OVER;
      } else if (dist < PLAYER.radius + DRONE.radius + DRONE.nearMiss && state.time - d.nearMissAt > 2) {
        d.nearMissAt = state.time;
        state.score += DRONE.nearMissPoints;
        addFloat(p.x, p.y - 30, `CLOSE! +${DRONE.nearMissPoints}`, '#ff8f8f');
      }
    }

    // --- blackout towers ---
    for (const t of state.towers) {
      if (p.x + PLAYER.radius > t.x && p.x - PLAYER.radius < t.x + t.w && p.y + PLAYER.radius > t.top) {
        events |= hitPlayer();
        if (state.lives === 0) return events | EVENT_OVER;
        break;
      }
    }

    // --- shield pickups ---
    state.shieldTimer -= dt;
    if (state.shieldTimer <= 0) {
      spawnShield();
      state.shieldTimer = SHIELD.interval;
    }
    for (const s of state.shieldPickups) {
      s.bob += dt;
      if (Math.hypot(p.x - s.x, p.y - s.y) < PLAYER.radius + 20) {
        s.active = false;
        state.shield = true;
        addFloat(s.x, s.y - 26, 'SHIELD!', '#5df2ff');
        showBanner('SHIELD AKTIF', 'satu tabrakan gratis');
      }
    }
    state.shieldPickups = state.shieldPickups.filter((s) => s.active);

    // --- rival courier ---
    const r = state.rival;
    if (r.cool > 0) {
      // After a catch the rival hovers to "drop off" — the player's window to pull ahead.
      r.cool -= dt;
      r.vx = 0;
      r.vy = 0;
    }
    let target = null;
    let bestD = Infinity;
    for (const parcel of state.parcels) {
      if (!parcel.active || parcel.kind === KIND_GOLDEN) continue;
      const d = Math.hypot(parcel.x - r.x, parcel.baseY - r.y);
      if (d < bestD) {
        bestD = d;
        target = parcel;
      }
    }
    if (target && r.cool <= 0) {
      const dx = target.x - r.x;
      const dy = target.baseY + Math.sin(target.bob) * 14 - r.y;
      const dist = Math.hypot(dx, dy) || 1;
      const gap = state.score - r.score;
      const rspeed = RIVAL.speed * (gap > 400 ? 0.82 : gap < -400 ? 1.12 : 1);
      r.vx = (dx / dist) * rspeed;
      r.vy = (dy / dist) * rspeed;
      r.x = clamp(r.x + r.vx * dt, 20, FIELD.width - 20);
      r.y = clamp(r.y + r.vy * dt, 70, FIELD.height - 20);
      if (dist < RIVAL.radius + PARCEL.radius) {
        target.active = false;
        r.score += 100;
        r.deliveries += 1;
        r.cool = RIVAL.catchPause;
        burst(target.x, target.baseY, '#ff5d8f', 6);
      }
    }
    const aheadNow = state.score >= r.score;
    if (aheadNow && !state.playerAhead) {
      state.score += RIVAL.overtakePoints;
      addFloat(p.x, p.y - 34, `OVERTAKE +${RIVAL.overtakePoints}`, '#ff5d8f');
      showBanner('KAMU NOMOR 1!', 'rival ketinggalan — jangan kasih kendor');
      events |= EVENT_OVERTAKE;
    }
    state.playerAhead = aheadNow;

    // --- floats + particles ---
    for (const f of state.floats) {
      f.y -= 34 * dt;
      f.t -= dt;
    }
    state.floats = state.floats.filter((f) => f.t > 0);
    for (const pt of state.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.t -= dt;
    }
    state.particles = state.particles.filter((pt) => pt.t > 0);

    return events;
  }

  reset();
  return { state, reset, step };
}
