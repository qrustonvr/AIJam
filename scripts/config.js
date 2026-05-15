// =====================================================
// CANNON QUACK — config & tunable constants
// =====================================================

export const CONFIG = {
  // Canvas dimensions (viewport; the world is much wider — see WORLD_W)
  CANVAS_W: 1280,
  CANVAS_H: 720,

  // World width — most of the multiplier strip starts past the viewport,
  // so the camera has to scroll to reveal what's out there.
  WORLD_W: 2400,

  // How aggressively the camera follows the duck (0 = locked, 1 = snap).
  CAMERA_LERP: 0.12,

  // Physics
  GRAVITY: 0.45,
  WIND_MAX: 0.12,

  // Cannon position (the pivot point) — world coordinates
  CANNON_BASE_X: 110,
  CANNON_BASE_Y: 540,

  // Where the ground line lives (zones sit on this y)
  GROUND_Y: 600,

  // Multiplier zones — left to right from the cannon.
  // Roughly half (zones starting at x >= 1280) live off-screen at the start
  // of the round and only come into view as the camera follows the duck.
  ZONES: [
    // ----- ON-SCREEN (cannon area, x < 1280) -----
    { start: 165,  end: 220,  mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 220,  end: 310,  mult: 1.5,  label: '1.5x',    color: '#5b4a8a' },
    { start: 310,  end: 440,  mult: 0.5,  label: '0.5x',    color: '#6b3055' },
    { start: 440,  end: 505,  mult: 2,    label: '2x',      color: '#6f5cb0' },
    { start: 505,  end: 720,  mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 720,  end: 820,  mult: 0.75, label: '0.75x',   color: '#7a4072' },
    { start: 820,  end: 870,  mult: 3,    label: '3x',      color: '#7d3fc6' },
    { start: 870,  end: 1100, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 1100, end: 1130, mult: 5,    label: '5x',      color: '#a8278d' },
    { start: 1130, end: 1280, mult: 0.5,  label: '0.5x',    color: '#6b3055' },

    // ----- OFF-SCREEN at round start (x >= 1280) -----
    { start: 1280, end: 1400, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 1400, end: 1500, mult: 0.75, label: '0.75x',   color: '#7a4072' },
    { start: 1500, end: 1600, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 1600, end: 1635, mult: 10,   label: '10x',     color: '#d72b78' },
    { start: 1635, end: 1850, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 1850, end: 1895, mult: 3,    label: '3x',      color: '#7d3fc6' },
    { start: 1895, end: 2050, mult: 0.5,  label: '0.5x',    color: '#6b3055' },
    { start: 2050, end: 2150, mult: 0,    label: 'BUST',    color: '#3a1d2e' },
    { start: 2150, end: 2230, mult: 1.5,  label: '1.5x',    color: '#5b4a8a' },
    { start: 2230, end: 2400, mult: 0,    label: 'VOID',    color: '#1a0a1f' }
  ],

  // Airborne targets — Star is mid-air over the on-screen zone, Ring sits
  // high and deep, threadable only by powerful well-angled shots.
  AIR_TARGETS: [
    {
      id: 'ring',
      type: 'ring',
      x: 2080, y: 110,
      radius: 13,
      innerRadius: 7,
      mult: 100,
      label: 'GOLDEN RING',
      color: '#ffd33d'
    },
    {
      id: 'star',
      type: 'star',
      x: 950, y: 195,
      radius: 14,
      mult: 5,
      label: 'STAR BONUS',
      color: '#00e5ff'
    }
  ],

  // Air obstacles — spread along the trajectory so a high shot has to
  // contend with one of them.
  OBSTACLES: [
    {
      id: 'cloud',
      type: 'cloud',
      x: 420, y: 290,
      w: 130, h: 56,
      label: 'STORM',
      color: '#7a4fb0'
    },
    {
      id: 'spike',
      type: 'spike',
      x: 700, y: 410,
      radius: 24,
      label: 'SPIKES',
      color: '#ff4d6d'
    },
    {
      id: 'bumper',
      type: 'bumper',
      x: 1180, y: 320,
      radius: 28,
      label: 'BUMPER',
      color: '#00e5ff'
    },
    {
      id: 'spike2',
      type: 'spike',
      x: 1740, y: 380,
      radius: 24,
      label: 'SPIKES',
      color: '#ff4d6d'
    },
    // Lucky bounce pads — send the duck forward + up. Placed low so only
    // shallow trajectories trigger them; if you're lucky enough to clip one
    // you might reach the far zones (or even the Golden Ring).
    {
      id: 'boost1',
      type: 'boost',
      x: 1300, y: 480,
      radius: 24,
      label: 'BOUNCE',
      color: '#5af0a0'
    },
    {
      id: 'boost2',
      type: 'boost',
      x: 1880, y: 470,
      radius: 24,
      label: 'BOUNCE',
      color: '#5af0a0'
    }
  ],

  // Betting
  MIN_BET: 10,
  MAX_BET: 500,
  START_BALANCE: 1000,

  // Power meter oscillation
  POWER_SPEED: 0.024,
  // Power range bumped up so even low power lands in a useful zone and full
  // power can reach the deep off-screen zones and the Golden Ring.
  POWER_MIN_VEL: 14,
  POWER_MAX_VEL: 33,

  // Cannon muzzle distance from pivot (where the duck spawns)
  // Matches the sprite muzzle tip: (0.82W, -0.18H) from breech anchor = ~95px
  MUZZLE_DIST: 95
};
