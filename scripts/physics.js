// =====================================================
// Projectile motion + wind + zone lookup
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
    trail: []
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
}

export function checkLanding(p) {
  if (p.landed) return true;
  if (p.y >= CONFIG.GROUND_Y) {
    p.landed = true;
    p.landX = p.x;
    p.landY = CONFIG.GROUND_Y;
    return true;
  }
  // Off-screen flies into the void (counts as a loss)
  if (p.x < 0 || p.x > CONFIG.CANVAS_W + 200 || p.y > CONFIG.CANVAS_H + 200) {
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

export function randomWind() {
  // Sign random, magnitude biased toward smaller values (more shots are playable)
  const sign = Math.random() < 0.5 ? -1 : 1;
  const strength = Math.pow(Math.random(), 1.4);
  return sign * strength * CONFIG.WIND_MAX;
}
