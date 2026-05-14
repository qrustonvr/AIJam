// =====================================================
// HUD updates — balance, bet, angle, power, wind, results
// =====================================================

import { CONFIG } from './config.js';

const $ = (id) => document.getElementById(id);

export function updateBalance(state) {
  $('balance-value').textContent = state.balance.toLocaleString();
}

export function updateBetDisplay(state) {
  $('bet-value').textContent = state.bet.toLocaleString();
}

export function updateAngleDisplay(state) {
  $('angle-value').textContent = `${state.angle}°`;
  const slider = $('angle-slider');
  if (slider && parseInt(slider.value, 10) !== state.angle) {
    slider.value = state.angle;
  }
}

export function updatePowerNeedle(state) {
  const needle = $('power-needle');
  if (!needle) return;
  needle.style.left = `${state.powerMeterPos * 100}%`;
}

export function updateWindIndicator(state) {
  const arrow = $('wind-arrow');
  const value = $('wind-value');
  const normalized = state.wind / CONFIG.WIND_MAX; // -1 to 1
  const strength = Math.round(Math.abs(normalized) * 5);

  if (normalized > 0.1) arrow.textContent = '→';
  else if (normalized < -0.1) arrow.textContent = '←';
  else arrow.textContent = '·';

  arrow.style.opacity = Math.max(0.4, Math.abs(normalized));
  value.textContent = strength === 0 ? 'CALM' : `${strength}/5`;
}

export function showPhase(name) {
  ['betting', 'aiming', 'power', 'firing', 'result'].forEach(p => {
    const el = $(`phase-${p}`);
    if (el) el.hidden = (p !== name);
  });
}

export function showResult(state) {
  const zoneText = state.zoneHit ? state.zoneHit.label : 'OUT';
  $('result-zone').textContent = `Landed: ${zoneText}`;
  const payoutEl = $('result-payout');
  if (state.payout > 0) {
    payoutEl.textContent = `+${state.payout.toLocaleString()}`;
    payoutEl.className = 'result-payout win';
  } else {
    payoutEl.textContent = `−0 (bet lost)`;
    payoutEl.className = 'result-payout loss';
  }
}

export function showBigWin(state) {
  const banner = $('result-banner');
  if (!banner) return;
  if (state.zoneHit && state.zoneHit.mult >= 10) {
    $('result-title').textContent = state.zoneHit.mult >= 100 ? 'JACKPOT!' : 'BIG WIN!';
    $('result-subtitle').textContent = `+${state.payout.toLocaleString()} CHIPS`;
    banner.hidden = false;
    setTimeout(() => { banner.hidden = true; }, 2400);
  }
}
