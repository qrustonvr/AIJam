// =====================================================
// DOM input wiring — bet, angle, fire, replay, auto-bet
// =====================================================

import { CONFIG } from './config.js';

export function bindInput(state, callbacks) {
  // ----- Bet deltas (+/- 10, +/- 50) -----
  document.querySelectorAll('[data-bet-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.phase !== 'BETTING') return;
      const delta = parseInt(btn.dataset.betDelta, 10);
      state.bet = clampBet(state.bet + delta, state.balance);
      callbacks.onBetChange();
    });
  });

  // ----- Bet quick-set (MIN / 100 / MAX) -----
  document.querySelectorAll('[data-bet-set]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.phase !== 'BETTING') return;
      const v = parseInt(btn.dataset.betSet, 10);
      state.bet = clampBet(v, state.balance);
      callbacks.onBetChange();
    });
  });

  // ----- Lock bet / Start round -----
  document.getElementById('btn-lock-bet').addEventListener('click', () => {
    if (state.phase !== 'BETTING') return;
    callbacks.onLockBet();
  });

  // ----- Angle slider (active during POWERING) -----
  const slider = document.getElementById('angle-slider');
  slider.addEventListener('input', (e) => {
    state.angle = parseInt(e.target.value, 10);
    callbacks.onAngleChange();
  });

  // ----- Fire button -----
  document.getElementById('btn-fire').addEventListener('click', () => {
    if (state.phase !== 'POWERING') return;
    callbacks.onFire();
  });

  // ----- Spacebar: fire or advance -----
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.phase === 'POWERING') callbacks.onFire();
      else if (state.phase === 'RESOLVING') callbacks.onPlayAgain();
    }
  });

  // ----- Play again -----
  document.getElementById('btn-play-again').addEventListener('click', () => {
    if (state.phase !== 'RESOLVING') return;
    callbacks.onPlayAgain();
  });

  // ----- Auto-bet toggle -----
  document.getElementById('btn-auto-bet').addEventListener('click', () => {
    callbacks.onToggleAutoBet();
  });

  // ----- Cancel auto-bet countdown -----
  document.getElementById('btn-cancel-auto').addEventListener('click', () => {
    callbacks.onCancelAutoBet();
  });
}

function clampBet(v, balance) {
  const max = Math.min(CONFIG.MAX_BET, balance);
  return Math.max(CONFIG.MIN_BET, Math.min(max, v));
}
