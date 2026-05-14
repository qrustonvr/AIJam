// =====================================================
// CANNON QUACK — config & tunable constants
// =====================================================

export const CONFIG = {
  // Canvas dimensions (viewport; the world is wider — see WORLD_W)
  CANVAS_W: 1280,
  CANVAS_H: 720,

  // World width — the playable area extends beyond the viewport
  // so the camera scrolls right as the duck flies. Max camera
  // offset is WORLD_W - CANVAS_W.
  WORLD_W: 1800,

  // How aggressively the camera follows the duck (0 = locked, 1 = snap).
  // 0.12 gives a smooth, slightly-lagging follow.
  CAMERA_LERP: 0.12,

  // Physics
  GRAVITY: 0.45,
  WIND_MAX: 0.12,

  // Cannon position (the pivot point) — world coordinates
  CANNON_BASE_X: 110,
  CANNON_BASE_Y: 540,

  // Where the ground line lives (zones sit on this y)
  GROUND_Y: 600,

  // Multiplier zones — left to right from the cannon
  // Tuned for ~8-15% house edge: bust pits are wider than wins,
  // partial-loss zones flank the better multipliers,
  // and the 100x lives in the sky (Golden Ring).
  ZONES: [
    { start: 165,  end: 240,  mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 240,  end: 290,  mult: 1.5,  label: '1.5x',    color: '#5b4a8a' },
    { start: 290,  end: 380,  mult: 0.5,  label: '0.5x',    color: '#6b3055' },
    { start: 380,  end: 435,  mult: 2,    label: '2x',      color: '#6f5cb0' },
    { start: 435,  end: 560,  mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 560,  end: 660,  mult: 0.75, label: '0.75x',   color: '#7a4072' },
    { start: 660,  end: 715,  mult: 3,    label: '3x',      color: '#7d3fc6' },
    { start: 715,  end: 840,  mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 840,  end: 885,  mult: 5,    label: '5x',      color: '#a8278d' },
    { start: 885,  end: 1000, mult: 0.5,  label: '0.5x',    color: '#6b3055' },
    { start: 1000, end: 1050, mult: 10,   label: '10x',     color: '#d72b78' },
    { start: 1050, end: 1500, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 1500, end: 1800, mult: 0,    label: 'VOID',    color: '#1a0a1f' }
  ],

  // Airborne targets — duck flying THROUGH these awards a bonus multiplier
  // The Golden Ring is the new jackpot (replaces the old 100x ground tile).
  // The Star is a smaller consolation jackpot mid-arc.
  AIR_TARGETS: [
    {
      id: 'ring',
      type: 'ring',
      x: 1380, y: 270,
      radius: 30,
      innerRadius: 18,
      mult: 100,
      label: 'GOLDEN RING',
      color: '#ffd33d'
    },
    {
      id: 'star',
      type: 'star',
      x: 720, y: 220,
      radius: 22,
      mult: 5,
      label: 'STAR BONUS',
      color: '#00e5ff'
    }
  ],

  // Air obstacles — interact with the duck mid-flight
  OBSTACLES: [
    {
      id: 'spike',
      type: 'spike',
      x: 540, y: 410,
      radius: 24,
      label: 'SPIKES',
      color: '#ff4d6d'
    },
    {
      id: 'bumper',
      type: 'bumper',
      x: 880, y: 320,
      radius: 28,
      label: 'BUMPER',
      color: '#00e5ff'
    },
    {
      id: 'cloud',
      type: 'cloud',
      x: 380, y: 290,
      w: 130, h: 56,
      label: 'STORM',
      color: '#7a4fb0'
    }
  ],

  // Betting
  MIN_BET: 10,
  MAX_BET: 500,
  START_BALANCE: 1000,

  // Power meter oscillation
  POWER_SPEED: 0.024,
  POWER_MIN_VEL: 8,
  POWER_MAX_VEL: 23,

  // Cannon muzzle distance from pivot (where the duck spawns)
  MUZZLE_DIST: 78
};
