// =====================================================
// Projectile motion + wind + zone lookup + obstacles
// =====================================================

import { CONFIG } from './config.js';

export function createProjectile(x, y, angleDeg, power, wind, obstacles, airTargets) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x,
    y,
    vx: Math.cos(rad) * power,
    vy: -Math.sin(rad) * power,
    wind,
    rotation: 0,
    landed: false,
    landX: null,
    landY: null,
    trail: [],
    _obstacles: obstacles,
    _airTargets: airTargets,
    airHits: new Set(),
    obstacleHits: new Set()
  };
}

export function stepProjectile(p, dt = 1) {
  if (p.landed) return;
  p.vy += CONFIG.GRAVITY * dt;
  p.vx += p.wind * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rotation += 0.08 * dt;

  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 40) p.trail.shift();

  for (const t of p._airTargets) {
    if (p.airHits.has(t.id)) continue;
    const dx = p.x - t.x;
    const dy = p.y - t.y;
    if (dx * dx + dy * dy <= t.radius * t.radius) {
      p.airHits.add(t.id);
    }
  }

  for (const o of p._obstacles) {
    if (p.obstacleHits.has(o.id)) continue;
    if (o.type === 'cloud') {
      const left   = o.x - o.w / 2;
      const right  = o.x + o.w / 2;
      const top    = o.y - o.h / 2;
      const bottom = o.y + o.h / 2;
      if (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom) {
        p.vx *= 0.5;
        p.vy *= 0.5;
        p.obstacleHits.add(o.id);
      }
    } else {
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const r = o.radius;
      if (dx * dx + dy * dy <= r * r) {
        if (o.type === 'spike') {
          p.landed = true;
          p.landX = p.x;
          p.landY = p.y;
        } else if (o.type === 'bumper') {
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / len;
          const ny = dy / len;
          const dot = p.vx * nx + p.vy * ny;
          p.vx = (p.vx - 2 * dot * nx) * 0.7;
          p.vy = (p.vy - 2 * dot * ny) * 0.7;
          p.x = o.x + nx * (r + 1);
          p.y = o.y + ny * (r + 1);
        } else if (o.type === 'boost') {
          p.vx = Math.min(p.vx + 6, 28);
          p.vy = Math.min(p.vy - 5, -4);
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / len;
          const ny = dy / len;
          p.x = o.x + nx * (r + 1);
          p.y = o.y + ny * (r + 1);
        }
        p.obstacleHits.add(o.id);
      }
    }
  }
}

export function checkLanding(p) {
  if (p.landed) return true;
  if (p.y >= CONFIG.GROUND_Y) {
    p.landed = true;
    p.landX = p.x;
    p.landY = CONFIG.GROUND_Y;
    return true;
  }
  if (p.x < 0 || p.x > CONFIG.WORLD_W + 200 || p.y > CONFIG.CANVAS_H + 200) {
    p.landed = true;
    p.landX = p.x;
    p.landY = p.y;
    return true;
  }
  return false;
}

export function getZoneAt(x) {
  for (const z of CONFIG.ZONES) {
    if (x >= z.start && x < z.end) return z;
  }
  return CONFIG.ZONES[CONFIG.ZONES.length - 1];
}

export function getBestAirHit(p) {
  if (!p || !p.airHits || p.airHits.size === 0) return null;
  let best = null;
  for (const t of p._airTargets) {
    if (p.airHits.has(t.id)) {
      if (!best || t.mult > best.mult) best = t;
    }
  }
  return best;
}

export function randomWind() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const strength = Math.pow(Math.random(), 1.4);
  return sign * strength * CONFIG.WIND_MAX;
}

// =====================================================
// Round layout generators
// =====================================================

export function generateObstacles() {
  const placed = [];
  let uid = 0;

  function footprint(o) {
    return o.type === 'cloud'
      ? { cx: o.x, cy: o.y, r: Math.max(o.w, o.h) / 2 }
      : { cx: o.x, cy: o.y, r: o.radius };
  }

  function overlaps(candidate) {
    const cf = footprint(candidate);
    return placed.some(p => {
      const pf = footprint(p);
      const dx = cf.cx - pf.cx;
      const dy = cf.cy - pf.cy;
      return Math.sqrt(dx * dx + dy * dy) < cf.r + pf.r + 55;
    });
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function tryPlace(build, attempts = 40) {
    for (let i = 0; i < attempts; i++) {
      const o = build(uid++);
      if (!overlaps(o)) { placed.push(o); return true; }
    }
    uid++; // keep ids unique even on failure
    return false;
  }

  // --- Clouds (1–2) ---
  const numClouds = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numClouds; i++) {
    tryPlace(id => ({
      id: `cloud${id}`, type: 'cloud',
      x: rand(340, 1800), y: rand(190, 430),
      w: rand(90, 160),   h: rand(40, 70),
      label: 'STORM', color: '#7a4fb0'
    }));
  }

  // --- Spikes (1–3) ---
  const numSpikes = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numSpikes; i++) {
    tryPlace(id => ({
      id: `spike${id}`, type: 'spike',
      x: rand(400, 2100), y: rand(290, 530),
      radius: rand(18, 30),
      label: 'SPIKES', color: '#ff4d6d'
    }));
  }

  // --- Bumpers (0–2) ---
  const numBumpers = Math.floor(Math.random() * 3);
  for (let i = 0; i < numBumpers; i++) {
    tryPlace(id => ({
      id: `bumper${id}`, type: 'bumper',
      x: rand(500, 2000), y: rand(180, 490),
      radius: rand(22, 34),
      label: 'BUMPER', color: '#00e5ff'
    }));
  }

  // --- Boosts (1–2) ---
  const numBoosts = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numBoosts; i++) {
    tryPlace(id => ({
      id: `boost${id}`, type: 'boost',
      x: rand(900, 2100), y: rand(390, 540),
      radius: rand(20, 28),
      label: 'BOUNCE', color: '#5af0a0'
    }));
  }

  return placed;
}

export function generateAirTargets() {
  // Golden Ring — always deep/high, hardest to hit
  const ringRadius = 11 + Math.random() * 6;
  const ringInner  = 5  + Math.random() * 4;
  const ring = {
    id: 'ring', type: 'ring',
    x: 1600 + Math.random() * 550,
    y: 75  + Math.random() * 110,
    radius: ringRadius,
    innerRadius: Math.min(ringInner, ringRadius - 4),
    mult: 100,
    label: 'GOLDEN RING',
    color: '#ffd33d'
  };

  // Star Bonus — mid-range, worth 3–9×
  const starMults = [3, 5, 7, 9];
  const star = {
    id: 'star', type: 'star',
    x: 600  + Math.random() * 950,
    y: 150  + Math.random() * 150,
    radius: 12 + Math.random() * 8,
    mult: starMults[Math.floor(Math.random() * starMults.length)],
    label: 'STAR BONUS',
    color: '#00e5ff'
  };

  return [ring, star];
}
