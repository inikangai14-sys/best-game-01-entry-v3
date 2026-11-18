// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by a simple autopilot (chase the nearest parcel, keep clear of storm drones
// and towers, boost when lined up), so the frame is what a short game really
// looks like and the same seed always gives the same frame.

import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const RUSH_SECONDS = 20;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/** Is (x, y) inside a blackout tower's column? Parcels there are unreachable. */
function inTowerColumn(state, x, y) {
  for (const t of state.towers) {
    if (x > t.x - 34 && x < t.x + t.w + 34 && y > t.top - 40) return true;
  }
  return false;
}

/** Steer toward the nearest reachable parcel, with a dodge push away from hazards. */
function autopilot(state, cautious) {
  const p = state.player;
  let target = null;
  let bestCost = Infinity;
  for (const parcel of state.parcels) {
    if (!parcel.active) continue;
    const py = parcel.baseY + Math.sin(parcel.bob) * 14;
    let cost = Math.hypot(parcel.x - p.x, py - p.y);
    if (inTowerColumn(state, parcel.x, py)) cost += 10000;
    for (const d of state.drones) {
      if (Math.hypot(d.x - parcel.x, d.y - py) < 120) cost += 500;
    }
    if (cost < bestCost) {
      bestCost = cost;
      target = { x: parcel.x, y: py };
    }
  }
  let tx = FIELD.width / 2;
  let ty = FIELD.height / 2;
  if (target) {
    // Aim ahead of the parcel's drift.
    tx = target.x + (target.x > p.x ? 30 : -30);
    ty = target.y;
  }
  if (cautious) {
    for (const d of state.drones) {
      const dist = Math.hypot(d.x - p.x, d.y - p.y);
      if (dist < 220) {
        const push = (220 - dist) / 220;
        ty += (p.y > d.y ? 1 : -1) * push * 380;
        tx += (p.x > d.x ? 1 : -1) * push * 200;
      }
    }
    for (const t of state.towers) {
      const cx = t.x + t.w / 2;
      if (p.x > t.x - 110 && p.x < t.x + t.w + 110 && p.y > t.top - 140) {
        ty = Math.min(ty, t.top - 190);
        tx += (p.x < cx ? -1 : 1) * 120;
      }
    }
    // Never dive into the tower band while chasing: stay above the rooftops.
    if (ty > 560) {
      let blocked = false;
      for (const t of state.towers) {
        if (tx > t.x - 60 && tx < t.x + t.w + 60) blocked = true;
      }
      if (blocked) ty = 480;
    }
  }
  const dx = tx - p.x;
  const dy = ty - p.y;
  const dist = Math.hypot(dx, dy) || 1;
  const pull = Math.min(1, dist / 200);
  return { x: (dx / dist) * pull, y: (dy / dist) * pull, boost: dist > 320 };
}

function runSteps(world, seconds, cautious) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    if (world.step(STEP, autopilot(world.state, cautious), false) & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    runSteps(world, PLAY_SECONDS, true);
    return { screen: world.state.lives === 0 ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'rush') {
    // Jump the world into district 3 with a storm already overhead: force the
    // level, arm a storm cell, then play through it. The storm is re-armed
    // for the final frame so the captured scene shows it, as the play did.
    world.state.deliveries = 16;
    world.state.level = 3;
    world.state.district = 2;
    world.state.daybreak = 0.4;
    world.state.storm = { active: true, x: 500, y: 360, r: 150, t: 9, nextIn: 20 };
    world.state.banner = { text: 'BADAI DATANG', sub: 'hujan deras — terbang lewat celahnya!', t: 2.6 };
    runSteps(world, RUSH_SECONDS, true);
    world.state.storm = { active: true, x: 640, y: 340, r: 150, t: 9, nextIn: 20 };
    world.state.banner = { text: 'BADAI DATANG', sub: 'hujan deras — terbang lewat celahnya!', t: 2.6 };
    return { screen: world.state.lives === 0 ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
      if (world.step(STEP, autopilot(world.state, false), false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, { x: 0, y: 0, boost: false }, true);
  return { screen: SCREEN_TITLE, best: 0 };
}
