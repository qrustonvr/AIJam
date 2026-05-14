// =====================================================
// Projectile motion + wind + zone lookup + obstacles
// =====================================================

import { CONFIG } from './config.js';

export function createProjectile(x, y, angleDeg, power, wind) {
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
    // Bonus tracking — set when the duck hits an air target this flight.
    // Cleared each new round. Only highest-mult hit is paid.
    airHits: new Set(),
    // Per-obstacle interaction state so each obstacle only triggers once
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

  // Track trail for visual streak
  p.trail.push({ x: p.x, y: p.y });
  if (p.trail.length > 40) p.trail.shift();

  // Air-target hit detection (rings / stars)
  for (const t of CONFIG.AIR_TARGETS) {
    if (p.airHits.has(t.id)) continue;
    const dx = p.x - t.x;
    const dy = p.y - t.y;
    if (dx * dx + dy * dy <= t.radius * t.radius) {
      p.airHits.add(t.id);
    }
  }

  // Obstacle interaction
  for (const o of CONFIG.OBSTACLES) {
    if (p.obstacleHits.has(o.id)) continue;
    if (o.type === 'cloud') {
      // Rectangular bounds
      const left = o.x - o.w / 2;
      const right = o.x + o.w / 2;
      const top = o.y - o.h / 2;
      const bottom = o.y + o.h / 2;
      if (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom) {
        p.vx *= 0.5;
        p.vy *= 0.5;
        p.obstacleHits.add(o.id);
      }
    } else {
      // Circular obstacles (spike, bumper)
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const r = o.radius;
      if (dx * dx + dy * dy <= r * r) {
        if (o.type === 'spike') {
          // Instant landing where the duck currently is — no bounce
          p.landed = true;
          p.landX = p.x;
          p.landY = p.y;
        } else if (o.type === 'bumper') {
          // Reflect velocity along the normal from obstacle center
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / len;
          const ny = dy / len;
          const dot = p.vx * nx + p.vy * ny;
          p.vx = (p.vx - 2 * dot * nx) * 0.7;
          p.vy = (p.vy - 2 * dot * ny) * 0.7;
          // Nudge duck just outside the bumper so we don't keep colliding
          p.x = o.x + nx * (r + 1);
          p.y = o.y + ny * (r + 1);
        } else if (o.type === 'boost') {
          // Lucky bounce — fling the duck forward and upward. Adds horizontal
          // speed and ensures upward velocity. Cap to avoid runaway.
          p.vx = Math.min(p.vx + 6, 28);
          p.vy = Math.min(p.vy - 5, -4);
          // Push duck out of the boost pad so it doesn't retrigger
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
  // Off-world: bigger bounds now that the world is wider
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
  // Beyond all zones: same as void
  return CONFIG.ZONES[CONFIG.ZONES.length - 1];
}

// Returns the highest-mult air target that was hit this flight, or null.
export function getBestAirHit(p) {
  if (!p || !p.airHits || p.airHits.size === 0) return null;
  let best = null;
  for (const t of CONFIG.AIR_TARGETS) {
    if (p.airHits.has(t.id)) {
      if (!best || t.mult > best.mult) best = t;
    }
  }
  return best;
}

export function randomWind() {
  // Sign random, magnitude biased toward smaller values (more shots are playable)
  const sign = Math.random() < 0.5 ? -1 : 1;
  const strength = Math.pow(Math.random(), 1.4);
  return sign * strength * CONFIG.WIND_MAX;
}
