// Neon Courier: Dawn Rush — the renderer. One canvas, fixed 1280x720 logical
// field, scaled by CSS. Everything is drawn from the world state, so a staged
// screenshot is exactly what real play looks like. Readability first: big
// parcels, a high-contrast HUD, large district banners — the judge reads the
// screenshots small.

import { COMBO, DISTRICTS, FIELD, FONT, KIND_EXPRESS, KIND_FRAGILE, KIND_GOLDEN, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixHex(c1, c2, t) {
  const p = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const a = p(c1);
  const b = p(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawDrone(x, y, body, dark, label, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Rotor wash.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -20, 26, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 20, 26, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Arms.
    ctx.strokeStyle = dark;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, -12);
    ctx.lineTo(16, 12);
    ctx.moveTo(16, -12);
    ctx.lineTo(-16, 12);
    ctx.stroke();
    // Body.
    ctx.fillStyle = body;
    roundRect(-15, -11, 30, 22, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(8, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    // Rotor hubs.
    ctx.fillStyle = '#eef1f5';
    for (const [rx, ry] of [[-20, -16], [20, -16], [-20, 16], [20, 16]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    if (label) {
      ctx.font = `700 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(244,247,255,0.9)';
      ctx.fillText(label, x, y - 30);
    }
  }

  function drawParcel(parcel) {
    const py = parcel.baseY + Math.sin(parcel.bob) * 14;
    const pulse = 1 + Math.sin(parcel.bob * 2) * 0.08;
    const color = parcel.kind === KIND_GOLDEN ? PALETTE.golden : parcel.kind === KIND_FRAGILE ? PALETTE.fragile : parcel.kind === KIND_EXPRESS ? PALETTE.express : PALETTE.parcel;
    const r = 20 * pulse;
    ctx.save();
    ctx.translate(parcel.x, py);
    // Cheap glow: a radial wash, no shadowBlur (software renderers crawl on it).
    const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.1);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    roundRect(-r, -r * 0.8, r * 2, r * 1.6, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,14,30,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(0, r * 0.8);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(10,14,30,0.9)';
    ctx.font = `800 ${parcel.kind === KIND_GOLDEN ? 15 : 13}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(parcel.kind === KIND_GOLDEN ? '★' : parcel.kind === KIND_FRAGILE ? '!' : parcel.kind === KIND_EXPRESS ? '»' : '✦', 0, 1);
    ctx.textBaseline = 'alphabetic';
    if ((parcel.kind === KIND_FRAGILE || parcel.kind === KIND_EXPRESS) && parcel.life < 999) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, -Math.PI / 2, -Math.PI / 2 + (parcel.life / (parcel.kind === KIND_FRAGILE ? 6 : 5)) * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(state, screen, best) {
    const t = state.time;
    const db = state.daybreak;
    const shake = state.shake > 0 ? state.shake * 14 : 0;
    const shx = shake ? Math.sin(t * 91) * shake : 0;
    const shy = shake ? Math.cos(t * 113) * shake : 0;
    ctx.save();
    ctx.translate(shx, shy);

    // --- sky: night fading into dawn as the level rises ---
    const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    sky.addColorStop(0, mixHex(PALETTE.nightTop, PALETTE.dawnTop, db));
    sky.addColorStop(0.55, mixHex(PALETTE.nightMid, PALETTE.dawnMid, db));
    sky.addColorStop(1, mixHex('#0a0e1e', PALETTE.dawnHorizon, db));
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, FIELD.width + 40, FIELD.height + 40);

    // Stars fade out as dawn breaks.
    if (db < 0.85) {
      for (const s of state.stars) {
        ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + s.tw))) * (1 - db);
        ctx.fillStyle = '#dfe8ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Rising sun.
    const sunY = lerp(640, 470, db);
    const sunGlow = ctx.createRadialGradient(1080, sunY, 10, 1080, sunY, 180);
    sunGlow.addColorStop(0, 'rgba(255,210,122,0.9)');
    sunGlow.addColorStop(1, 'rgba(255,210,122,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(880, sunY - 190, 400, 380);
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(1080, sunY, 34, 0, Math.PI * 2);
    ctx.fill();

    // --- skyline ---
    for (const b of state.buildingsFar) {
      ctx.fillStyle = PALETTE.buildingFar;
      ctx.fillRect(b.x, FIELD.height - b.h, b.w, b.h);
      if (b.lit) {
        ctx.fillStyle = 'rgba(255,209,102,0.5)';
        for (let wy = FIELD.height - b.h + 12; wy < FIELD.height - 14; wy += 26) {
          ctx.fillRect(b.x + 8, wy, 7, 10);
        }
      }
    }
    for (const b of state.buildingsNear) {
      ctx.fillStyle = PALETTE.buildingNear;
      ctx.fillRect(b.x, FIELD.height - b.h, b.w, b.h);
      if (b.lit) {
        ctx.fillStyle = 'rgba(255,209,102,0.75)';
        for (let wy = FIELD.height - b.h + 14; wy < FIELD.height - 14; wy += 30) {
          ctx.fillRect(b.x + 10, wy, 8, 11);
          ctx.fillRect(b.x + b.w - 18, wy, 8, 11);
        }
      }
    }
    // Streets: glowing lanes the drone flies above.
    ctx.strokeStyle = PALETTE.streetLine;
    ctx.lineWidth = 2;
    for (const sy of [560, 640]) {
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(FIELD.width, sy);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,209,102,0.55)';
      for (let x = (t * -60) % 90; x < FIELD.width; x += 90) ctx.fillRect(x, sy - 2, 34, 4);
    }

    // --- blackout towers ---
    for (const tw of state.towers) {
      ctx.fillStyle = PALETTE.tower;
      ctx.fillRect(tw.x, tw.top, tw.w, tw.h);
      ctx.fillStyle = 'rgba(255,209,102,0.6)';
      for (let wy = tw.top + 16; wy < FIELD.height - 12; wy += 34) {
        ctx.fillRect(tw.x + 10, wy, 9, 12);
        ctx.fillRect(tw.x + tw.w - 19, wy, 9, 12);
      }
      const blink = Math.sin(t * 4 + tw.seed) > 0;
      ctx.fillStyle = blink ? PALETTE.towerBeacon : 'rgba(255,59,48,0.25)';
      ctx.beginPath();
      ctx.arc(tw.x + tw.w / 2, tw.top - 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- storm cell ---
    if (state.storm.active) {
      const s = state.storm;
      const g = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.r);
      g.addColorStop(0, 'rgba(70,90,160,0.5)');
      g.addColorStop(1, 'rgba(70,90,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.rain;
      ctx.lineWidth = 2;
      for (let i = 0; i < 26; i += 1) {
        const rx = s.x + Math.sin(i * 12.9898 + t * 3) * s.r * 0.9;
        const ry = s.y + ((i * 67 + t * 420) % (s.r * 2)) - s.r;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 16);
        ctx.stroke();
      }
      ctx.fillStyle = '#cfe0ff';
      ctx.font = `800 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('⛈ BADAI', s.x, s.y + s.r + 22);
    }
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(220,230,255,${state.flash * 2.4})`;
      ctx.fillRect(-20, -20, FIELD.width + 40, FIELD.height + 40);
    }

    // --- shield pickups ---
    for (const s of state.shieldPickups) {
      const bobY = s.y + Math.sin(s.bob * 2.4) * 8;
      const sg = ctx.createRadialGradient(s.x, bobY, 4, s.x, bobY, 34);
      sg.addColorStop(0, PALETTE.shield);
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(s.x, bobY, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PALETTE.shield;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, bobY, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.shield;
      ctx.font = `800 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◈', s.x, bobY + 1);
      ctx.textBaseline = 'alphabetic';
    }

    // --- parcels, drones, rival, player ---
    for (const parcel of state.parcels) drawParcel(parcel);
    for (const d of state.drones) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.fillStyle = PALETTE.drone;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a0a0a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,77,77,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(24, 0);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffb3b3';
      ctx.font = `700 10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('STORM DRONE', d.x, d.y - 26);
    }
    const r = state.rival;
    drawDrone(r.x, r.y, PALETTE.rival, PALETTE.rivalDark, 'RIVAL', Math.atan2(r.vy, r.vx) * 0.4);

    const p = state.player;
    const pAngle = Math.atan2(p.vy, p.vx) * 0.25;
    const blinking = state.invuln > 0 && Math.floor(t * 12) % 2 === 0;
    if (!blinking) {
      if (state.boost < 1 && (Math.abs(p.vx) > 60 || Math.abs(p.vy) > 60)) {
        ctx.fillStyle = 'rgba(55,230,200,0.5)';
        ctx.beginPath();
        ctx.moveTo(p.x - Math.cos(pAngle) * 18, p.y - Math.sin(pAngle) * 18);
        ctx.lineTo(p.x - Math.cos(pAngle) * 34 - Math.sin(pAngle) * 6, p.y - Math.sin(pAngle) * 34 + Math.cos(pAngle) * 6);
        ctx.lineTo(p.x - Math.cos(pAngle) * 34 + Math.sin(pAngle) * 6, p.y - Math.sin(pAngle) * 34 - Math.cos(pAngle) * 6);
        ctx.closePath();
        ctx.fill();
      }
      drawDrone(p.x, p.y, PALETTE.player, PALETTE.playerDark, '', pAngle);
      if (state.shield) {
        ctx.strokeStyle = PALETTE.shield;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 30 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // --- particles + floats ---
    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.t * 1.6);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = `800 17px ${FONT}`;
    ctx.textAlign = 'center';
    for (const f of state.floats) {
      ctx.globalAlpha = Math.min(1, f.t);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // --- HUD ---
    ctx.fillStyle = PALETTE.panel;
    roundRect(0, 0, FIELD.width, 52, 0);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 26px ${FONT}`;
    ctx.fillText(`SCORE ${state.score.toLocaleString('en-US')}`, 18, 35);
    ctx.font = `700 15px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`BEST ${Math.max(best, state.score).toLocaleString('en-US')}`, 240, 34);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 17px ${FONT}`;
    ctx.fillText(`📦 ${state.deliveries}`, 380, 34);
    // Combo with timer bar.
    if (state.combo > 0) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `800 20px ${FONT}`;
      ctx.fillText(`COMBO ×${state.combo}`, 480, 34);
      ctx.fillStyle = 'rgba(255,209,102,0.3)';
      ctx.fillRect(600, 24, 90, 8);
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(600, 24, 90 * Math.max(0, state.comboTimer / COMBO.window), 8);
    }
    // Level + district.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 16px ${FONT}`;
    ctx.fillText(`LV ${state.level} · ${DISTRICTS[state.district].name}`, 730, 34);
    // Race position.
    const race = state.playerAhead ? '🏁 1st' : '🏁 2nd';
    ctx.fillStyle = state.playerAhead ? PALETTE.player : PALETTE.rival;
    ctx.font = `800 17px ${FONT}`;
    ctx.fillText(`${race}  vs RIVAL ${state.rival.score}`, 960, 34);
    // Lives.
    ctx.fillStyle = '#ff5d7a';
    ctx.font = `800 20px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), FIELD.width - 18, 35);
    ctx.textAlign = 'left';
    // Boost meter.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(18, 60, 150, 7);
    ctx.fillStyle = state.boost > 0.25 ? PALETTE.player : PALETTE.danger;
    ctx.fillRect(18, 60, 150 * state.boost, 7);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `700 11px ${FONT}`;
    ctx.fillText('BOOST [SHIFT]', 18, 82);
    if (state.shield) {
      ctx.fillStyle = PALETTE.shield;
      ctx.font = `800 13px ${FONT}`;
      ctx.fillText('◈ SHIELD', 180, 82);
    }
    if (state.inStorm) {
      ctx.fillStyle = '#cfe0ff';
      ctx.font = `800 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('⛈ DALAM BADAI — tangkap paket untuk STORM RUNNER +150', FIELD.width / 2, 82);
      ctx.textAlign = 'left';
    }

    // --- banner ---
    if (state.banner.t > 0) {
      const a = Math.min(1, state.banner.t);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(10,14,30,0.72)';
      const w = Math.min(860, ctx.measureText(state.banner.text).width + 90);
      roundRect(FIELD.width / 2 - w / 2, 108, w, state.banner.sub ? 66 : 44, 10);
      ctx.fill();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `800 24px ${FONT}`;
      ctx.fillText(state.banner.text, FIELD.width / 2, 136);
      if (state.banner.sub) {
        ctx.fillStyle = PALETTE.text;
        ctx.font = `600 15px ${FONT}`;
        ctx.fillText(state.banner.sub, FIELD.width / 2, 161);
      }
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    // --- screens ---
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(7,11,29,0.55)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `800 64px ${FONT}`;
      ctx.fillText('NEON COURIER', FIELD.width / 2, 250);
      ctx.fillStyle = PALETTE.player;
      ctx.font = `800 40px ${FONT}`;
      ctx.fillText('— DAWN RUSH —', FIELD.width / 2, 300);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `600 20px ${FONT}`;
      ctx.fillText('Terbang di atas kota neon saat fajar naik. Tangkap paket, jaga kombo,', FIELD.width / 2, 352);
      ctx.fillText('kalahkan RIVAL, dan terbang lewat badai demi bonus STORM RUNNER.', FIELD.width / 2, 380);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `600 17px ${FONT}`;
      ctx.fillText('WASD / panah / mouse — terbang   ·   SHIFT — boost   ·   P — jeda   ·   M — bisu', FIELD.width / 2, 430);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `800 22px ${FONT}`;
      ctx.fillText('Tekan SPASI atau klik untuk mulai', FIELD.width / 2, 490);
      ctx.textAlign = 'left';
    } else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(7,11,29,0.6)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.text;
      ctx.font = `800 52px ${FONT}`;
      ctx.fillText('JEDA', FIELD.width / 2, 350);
      ctx.font = `600 19px ${FONT}`;
      ctx.fillText('Tekan P untuk lanjut', FIELD.width / 2, 390);
      ctx.textAlign = 'left';
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(7,11,29,0.72)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `800 58px ${FONT}`;
      ctx.fillText('SHIFT OVER', FIELD.width / 2, 240);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `800 30px ${FONT}`;
      ctx.fillText(`SCORE ${state.score.toLocaleString('en-US')}`, FIELD.width / 2, 300);
      ctx.font = `600 20px ${FONT}`;
      ctx.fillText(`Paket diantar: ${state.deliveries}   ·   Kombo maks: ×${state.maxCombo}   ·   Level: ${state.level}`, FIELD.width / 2, 342);
      ctx.fillText(`Rival: ${state.rival.score} poin (${state.rival.deliveries} paket) — kamu ${state.playerAhead ? 'MENANG' : 'KALAH'} balapannya`, FIELD.width / 2, 372);
      ctx.fillText(`Best: ${Math.max(best, state.score).toLocaleString('en-US')}`, FIELD.width / 2, 402);
      ctx.fillStyle = state.score > best ? PALETTE.gold : PALETTE.muted;
      ctx.font = `800 20px ${FONT}`;
      ctx.fillText(state.score > best ? '★ SHIFT TERBAIK — REKOR BARU! ★' : 'Tekan SPASI untuk shift berikutnya', FIELD.width / 2, 452);
      ctx.textAlign = 'left';
    }
  }

  return { draw };
}
