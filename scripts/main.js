// =====================================================
// CANNON QUACK — game loop & state machine
// Phases: BETTING -> AIMING -> POWERING -> FIRING -> RESOLVING
// =====================================================

import { CONFIG } from './config.js';
import { renderFrame } from './render.js';
import { bindInput } from './input.js';
import {
  createProjectile, stepProjectile, checkLanding,
  getZoneAt, randomWind
} from './physics.js';
import {
  updateBalance, updateBetDisplay, updateAngleDisplay,
  updatePowerNeedle, updateWindIndicator,
  showPhase, showResult, showBigWin
} from './ui.js';
import { preload, play } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ----- Boot state (with persistent balance) -----
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
  zoneHit: null
};

// ----- Phase transitions -----

function newRound() {
  state.phase = 'BETTING';
  state.projectile = null;
  state.payout = 0;
  state.zoneHit = null;
  state.powerMeterPos = 0;
  state.powerMeterDir = 1;
  state.wind = randomWind();

  // If somehow out of chips, refill (jam-friendly)
  if (state.balance < CONFIG.MIN_BET) {
    state.balance = CONFIG.START_BALANCE;
    localStorage.setItem('cannonQuackBalance', String(state.balance));
  }

  // Clamp bet to current balance
  state.bet = Math.max(CONFIG.MIN_BET, Math.min(state.bet, state.balance));

  showPhase('betting');
  updateBetDisplay(state);
  updateAngleDisplay(state);
  updateWindIndicator(state);
  updateBalance(state);
}

function lockBet() {
  if (state.balance < state.bet) return;
  state.balance -= state.bet;
  localStorage.setItem('cannonQuackBalance', String(state.balance));
  updateBalance(state);
  state.phase = 'AIMING';
  showPhase('aiming');
}

function lockAngle() {
  state.phase = 'POWERING';
  showPhase('power');
}

function fire() {
  // Map power meter (0..1) to velocity range
  state.lockedPower =
    CONFIG.POWER_MIN_VEL +
    state.powerMeterPos * (CONFIG.POWER_MAX_VEL - CONFIG.POWER_MIN_VEL);

  // Spawn projectile at the cannon muzzle
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
  state.payout = Math.round(state.bet * zone.mult);
  state.balance += state.payout;
  localStorage.setItem('cannonQuackBalance', String(state.balance));

  showResult(state);
  showBigWin(state);
  if (zone.mult >= 10) play('win');
  else if (zone.mult > 0) play('quack');
  else play('splash');

  state.phase = 'RESOLVING';
  showPhase('result');
  updateBalance(state);
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
    // Several physics substeps per frame for smoother arc
    for (let i = 0; i < 2; i++) {
      stepProjectile(state.projectile, 0.5);
      if (checkLanding(state.projectile)) {
        resolveLanding();
        break;
      }
    }
  }
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
  onLockAngle: lockAngle,
  onFire: fire,
  onPlayAgain: newRound
});

preload();
newRound();
loop();
