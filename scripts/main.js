// =====================================================
// CANNON QUACK — game loop & state machine
// Phases: BETTING -> POWERING -> FIRING -> RESOLVING
// =====================================================

import { CONFIG } from './config.js';
import { renderFrame } from './render.js';
import { bindInput } from './input.js';
import {
  createProjectile, stepProjectile, checkLanding,
  getZoneAt, getBestAirHit, randomWind
} from './physics.js';
import {
  updateBalance, updateBetDisplay, updateAngleDisplay,
  updatePowerNeedle, updateWindIndicator,
  showPhase, showResult, showBigWin,
  setAutoBetButton, showAutoBetCountdown, hideAutoBetCountdown
} from './ui.js';
import { preload, play } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ----- Boot state -----
const savedBalance = parseInt(localStorage.getItem('cannonQuackBalance'), 10);
const initialBalance = !isNaN(savedBalance) && savedBalance >= CONFIG.MIN_BET
  ? savedBalance
  : CONFIG.START_BALANCE;

const state = {
  phase: 'BETTING',
  balance: initialBalance,
  bet: Math.min(50, initialBalance),
  angle: 45,
  powerMeterPos: 0,
  powerMeterDir: 1,
  lockedPower: 0,
  wind: 0,
  projectile: null,
  payout: 0,
  zoneHit: null,
  airHit: null,
  cameraX: 0,
  cameraTargetX: 0,
  autoBet: false
};

// ----- Auto-bet timer -----
let autoBetTimerId = null;
let autoBetCountdownId = null;

function cancelAutoBetTimer() {
  if (autoBetTimerId) { clearTimeout(autoBetTimerId); autoBetTimerId = null; }
  if (autoBetCountdownId) { clearInterval(autoBetCountdownId); autoBetCountdownId = null; }
  hideAutoBetCountdown();
}

function scheduleAutoBet() {
  cancelAutoBetTimer();
  let seconds = 5;
  showAutoBetCountdown(seconds);
  autoBetCountdownId = setInterval(() => {
    seconds--;
    if (seconds > 0) {
      showAutoBetCountdown(seconds);
    } else {
      clearInterval(autoBetCountdownId);
      autoBetCountdownId = null;
    }
  }, 1000);
  autoBetTimerId = setTimeout(() => {
    autoBetTimerId = null;
    autoStartRound();
  }, 5000);
}

function autoStartRound() {
  cancelAutoBetTimer();
  newRound();
  lockBet();
}

// ----- Camera helpers -----
function maxCameraX() {
  return Math.max(0, CONFIG.WORLD_W - CONFIG.CANVAS_W);
}

function resetCamera() {
  state.cameraX = 0;
  state.cameraTargetX = 0;
}

function updateCamera() {
  if (state.phase === 'FIRING' && state.projectile && !state.projectile.landed) {
    const duckX = state.projectile.x;
    const desired = duckX - CONFIG.CANVAS_W * 0.4;
    state.cameraTargetX = Math.max(0, Math.min(maxCameraX(), desired));
  } else if (state.phase === 'RESOLVING' && state.projectile) {
    const duckX = state.projectile.landX || state.projectile.x;
    const desired = duckX - CONFIG.CANVAS_W * 0.5;
    state.cameraTargetX = Math.max(0, Math.min(maxCameraX(), desired));
  } else {
    state.cameraTargetX = 0;
  }
  state.cameraX += (state.cameraTargetX - state.cameraX) * CONFIG.CAMERA_LERP;
}

// ----- Phase transitions -----

function newRound() {
  cancelAutoBetTimer();
  state.phase = 'BETTING';
  state.projectile = null;
  state.payout = 0;
  state.zoneHit = null;
  state.airHit = null;
  state.powerMeterPos = 0;
  state.powerMeterDir = 1;
  state.wind = randomWind();
  resetCamera();

  if (state.balance < CONFIG.MIN_BET) {
    state.balance = CONFIG.START_BALANCE;
    localStorage.setItem('cannonQuackBalance', String(state.balance));
  }

  state.bet = Math.max(CONFIG.MIN_BET, Math.min(state.bet, state.balance));

  showPhase('betting');
  updateBetDisplay(state);
  updateAngleDisplay(state);
  updateWindIndicator(state);
  updateBalance(state);
}

function lockBet() {
  if (state.phase !== 'BETTING') return;
  if (state.balance < state.bet) return;
  state.balance -= state.bet;
  localStorage.setItem('cannonQuackBalance', String(state.balance));
  updateBalance(state);
  state.phase = 'POWERING';
  showPhase('power');
}

function fire() {
  if (state.phase !== 'POWERING') return;
  state.lockedPower =
    CONFIG.POWER_MIN_VEL +
    state.powerMeterPos * (CONFIG.POWER_MAX_VEL - CONFIG.POWER_MIN_VEL);

  const rad = (state.angle * Math.PI) / 180;
  const sx = CONFIG.CANNON_BASE_X + Math.cos(rad) * CONFIG.MUZZLE_DIST;
  const sy = CONFIG.CANNON_BASE_Y - Math.sin(rad) * CONFIG.MUZZLE_DIST;

  state.projectile = createProjectile(sx, sy, state.angle, state.lockedPower, state.wind);
  state.phase = 'FIRING';
  showPhase('firing');
  play('fire');
}

function resolveLanding() {
  const zone = getZoneAt(state.projectile.x);
  state.zoneHit = zone;

  const airHit = getBestAirHit(state.projectile);
  state.airHit = airHit;

  const effectiveMult = airHit ? airHit.mult : zone.mult;
  state.payout = Math.round(state.bet * effectiveMult);
  state.balance += state.payout;
  localStorage.setItem('cannonQuackBalance', String(state.balance));

  showResult(state);
  showBigWin(state);

  if (airHit && airHit.mult >= 100) play('win');
  else if (effectiveMult >= 5) play('win');
  else if (effectiveMult >= 1) play('quack');
  else play('splash');

  state.phase = 'RESOLVING';
  showPhase('result');
  updateBalance(state);

  if (state.autoBet) scheduleAutoBet();
}

// ----- Update -----

function update() {
  if (state.phase === 'POWERING') {
    state.powerMeterPos += state.powerMeterDir * CONFIG.POWER_SPEED;
    if (state.powerMeterPos >= 1) {
      state.powerMeterPos = 1;
      state.powerMeterDir = -1;
    }
    if (state.powerMeterPos <= 0) {
      state.powerMeterPos = 0;
      state.powerMeterDir = 1;
    }
    updatePowerNeedle(state);
  }

  if (state.phase === 'FIRING' && state.projectile) {
    for (let i = 0; i < 2; i++) {
      stepProjectile(state.projectile, 0.5);
      if (checkLanding(state.projectile)) {
        resolveLanding();
        break;
      }
    }
  }

  updateCamera();
}

// ----- Main loop -----

function loop() {
  update();
  renderFrame(ctx, state);
  requestAnimationFrame(loop);
}

// ----- Wire up -----

bindInput(state, {
  onBetChange: () => updateBetDisplay(state),
  onAngleChange: () => updateAngleDisplay(state),
  onLockBet: lockBet,
  onFire: fire,
  onPlayAgain: () => {
    cancelAutoBetTimer();
    newRound();
  },
  onToggleAutoBet: () => {
    state.autoBet = !state.autoBet;
    setAutoBetButton(state.autoBet);
    if (!state.autoBet) cancelAutoBetTimer();
  },
  onCancelAutoBet: () => {
    cancelAutoBetTimer();
  }
});

preload();
newRound();
loop();
