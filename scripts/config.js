// =====================================================
// CANNON QUACK — config & tunable constants
// =====================================================

export const CONFIG = {
  // Canvas dimensions (logical units; CSS scales the display)
  CANVAS_W: 1280,
  CANVAS_H: 720,

  // Physics
  GRAVITY: 0.45,
  WIND_MAX: 0.12,

  // Cannon position (the pivot point)
  CANNON_BASE_X: 110,
  CANNON_BASE_Y: 540,

  // Where the ground line lives (zones sit on this y)
  GROUND_Y: 600,

  // Multiplier zones — left to right from the cannon
  // start/end are x-pixel boundaries
  ZONES: [
    { start: 165, end: 250,  mult: 0,   label: 'BUST PIT',  color: '#3a1d2e' },
    { start: 250, end: 420,  mult: 1.5, label: '1.5x',       color: '#5b4a8a' },
    { start: 420, end: 580,  mult: 2,   label: '2x',         color: '#6f5cb0' },
    { start: 580, end: 780,  mult: 4,   label: '4x VALLEY',  color: '#7d3fc6' },
    { start: 780, end: 950,  mult: 10,  label: '10x CLIFF',  color: '#a8278d' },
    { start: 950, end: 1080, mult: 25,  label: '25x LEDGE',  color: '#d72b78' },
    { start: 1080, end: 1175, mult: 100, label: '100x ★', color: '#ffd33d' },
    { start: 1175, end: 1280, mult: 0,  label: 'VOID',       color: '#1a0a1f' }
  ],

  // Betting
  MIN_BET: 10,
  MAX_BET: 500,
  START_BALANCE: 1000,

  // Power meter oscillation
  POWER_SPEED: 0.024,      // fraction of track per frame
  POWER_MIN_VEL: 8,        // velocity when needle is far left
  POWER_MAX_VEL: 23,       // velocity when needle is far right

  // Cannon muzzle distance from pivot (where the duck spawns)
  MUZZLE_DIST: 78
};
