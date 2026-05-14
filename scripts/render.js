// =====================================================
// Canvas rendering — sky, terrain, zones, cannon, ducky
// All placeholder geometry; swap in AI sprites in hour 4.
// =====================================================

import { CONFIG } from './config.js';

export function renderFrame(ctx, state) {
  ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  drawSky(ctx);
  drawStars(ctx, state);
  drawSkyline(ctx);
  drawWindStreaks(ctx, state);
  drawGround(ctx);
  drawZones(ctx);
  drawCannon(ctx, state);

  if (state.projectile) {
    drawTrail(ctx, state.projectile);
    if (!state.projectile.landed) drawDucky(ctx, state.projectile);
    else drawLandingMarker(ctx, state.projectile);
  }

  if (state.phase === 'AIMING' || state.phase === 'POWERING') {
    drawAimPreview(ctx, state);
  }
}

function drawSky(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_H);
  grad.addColorStop(0, '#1a0633');
  grad.addColorStop(0.45, '#4a1361');
  grad.addColorStop(0.85, '#7a1e6e');
  grad.addColorStop(1, '#2a0a3d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
}

function drawStars(ctx, state) {
  if (!state._stars) {
    state._stars = [];
    for (let i = 0; i < 140; i++) {
      state._stars.push({
        x: Math.random() * CONFIG.CANVAS_W,
        y: Math.random() * CONFIG.CANVAS_H * 0.55,
        r: Math.random() * 1.6 + 0.2,
        twinkle: Math.random() * 10
      });
    }
  }
  const t = Date.now() * 0.001;
  ctx.fillStyle = '#ffffff';
  for (const s of state._stars) {
    const alpha = 0.35 + 0.5 * Math.abs(Math.sin(t + s.twinkle));
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSkyline(ctx) {
  // Distant glowing city silhouette
  if (!ctx._skylineCache) {
    ctx._skylineCache = [];
    let x = 0;
    while (x < CONFIG.CANVAS_W) {
      const w = 40 + Math.random() * 60;
      const h = 40 + Math.random() * 80;
      ctx._skylineCache.push({ x, w, h, hasSpire: Math.random() > 0.7 });
      x += w + 2;
    }
  }
  const baseY = CONFIG.GROUND_Y - 30;
  ctx.fillStyle = 'rgba(15, 4, 30, 0.85)';
  for (const b of ctx._skylineCache) {
    ctx.fillRect(b.x, baseY - b.h, b.w, b.h);
    if (b.hasSpire) {
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2 - 4, baseY - b.h);
      ctx.lineTo(b.x + b.w / 2, baseY - b.h - 20);
      ctx.lineTo(b.x + b.w / 2 + 4, baseY - b.h);
      ctx.fill();
    }
  }
  // Windows
  ctx.fillStyle = 'rgba(255, 200, 70, 0.45)';
  for (const b of ctx._skylineCache) {
    for (let wy = baseY - b.h + 10; wy < baseY - 6; wy += 12) {
      for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 10) {
        if (((wx + wy) % 17) < 8) ctx.fillRect(wx, wy, 3, 4);
      }
    }
  }
}

function drawWindStreaks(ctx, state) {
  // Drifting horizontal clouds that move at wind speed
  if (!state._clouds) {
    state._clouds = [];
    for (let i = 0; i < 8; i++) {
      state._clouds.push({
        x: Math.random() * CONFIG.CANVAS_W,
        y: 60 + Math.random() * 280,
        w: 60 + Math.random() * 140,
        alpha: 0.05 + Math.random() * 0.08
      });
    }
  }
  // Wind only "blows" cloud particles while not firing (during fire, ducky uses wind)
  const speed = state.wind * 12;
  for (const c of state._clouds) {
    c.x += speed;
    if (c.x > CONFIG.CANVAS_W + 100) c.x = -c.w;
    if (c.x < -c.w - 100) c.x = CONFIG.CANVAS_W;
    ctx.fillStyle = `rgba(220, 180, 255, ${c.alpha})`;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.w, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx) {
  const grad = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.CANVAS_H);
  grad.addColorStop(0, '#2a0a3d');
  grad.addColorStop(1, '#0d0218');
  ctx.fillStyle = grad;
  ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_W, CONFIG.CANVAS_H - CONFIG.GROUND_Y);

  // Top edge highlight
  ctx.strokeStyle = 'rgba(255, 211, 61, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.GROUND_Y);
  ctx.lineTo(CONFIG.CANVAS_W, CONFIG.GROUND_Y);
  ctx.stroke();
}

function drawZones(ctx) {
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  for (const z of CONFIG.ZONES) {
    // Zone strip on the ground
    ctx.fillStyle = z.color;
    ctx.fillRect(z.start, CONFIG.GROUND_Y, z.end - z.start, 8);

    // Glow on top
    if (z.mult >= 10) {
      const g = ctx.createLinearGradient(0, CONFIG.GROUND_Y - 4, 0, CONFIG.GROUND_Y + 8);
      g.addColorStop(0, z.color + '00');
      g.addColorStop(1, z.color);
      ctx.fillStyle = g;
      ctx.fillRect(z.start, CONFIG.GROUND_Y - 4, z.end - z.start, 12);
    }

    // Label
    const cx = (z.start + z.end) / 2;
    if (z.mult > 0) {
      const labelColor = z.mult >= 25 ? '#ffd33d' : '#00e5ff';
      ctx.fillStyle = labelColor;
      ctx.shadowColor = labelColor;
      ctx.shadowBlur = z.mult >= 25 ? 12 : 6;
      ctx.fillText(z.label, cx, CONFIG.GROUND_Y - 10);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(255, 80, 80, 0.7)';
      ctx.fillText(z.label, cx, CONFIG.GROUND_Y - 10);
    }
  }
  ctx.textAlign = 'left';
}

function drawCannon(ctx, state) {
  const cx = CONFIG.CANNON_BASE_X;
  const cy = CONFIG.CANNON_BASE_Y;

  // Base / platform
  ctx.fillStyle = '#2a1140';
  ctx.fillRect(cx - 42, cy + 16, 84, 44);
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 42, cy + 16, 84, 44);

  // Wheel
  ctx.fillStyle = '#3a1a55';
  ctx.beginPath();
  ctx.arc(cx, cy + 38, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Wheel hub
  ctx.fillStyle = '#ffd33d';
  ctx.beginPath();
  ctx.arc(cx, cy + 38, 6, 0, Math.PI * 2);
  ctx.fill();
  // Spokes
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 38);
    ctx.lineTo(cx + Math.cos(a) * 22, cy + 38 + Math.sin(a) * 22);
    ctx.stroke();
  }

  // Cannon barrel (rotated)
  const angleRad = (state.angle * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-angleRad);

  // Barrel body — gold gradient
  const grad = ctx.createLinearGradient(0, -14, 0, 14);
  grad.addColorStop(0, '#ffe66e');
  grad.addColorStop(0.5, '#ffd33d');
  grad.addColorStop(1, '#a87c00');
  ctx.fillStyle = grad;
  ctx.fillRect(-4, -14, 78, 28);

  // Outline
  ctx.strokeStyle = '#5a3d00';
  ctx.lineWidth = 2;
  ctx.strokeRect(-4, -14, 78, 28);

  // Decorative band
  ctx.fillStyle = '#a87c00';
  ctx.fillRect(48, -16, 8, 32);
  ctx.strokeStyle = '#5a3d00';
  ctx.strokeRect(48, -16, 8, 32);

  // Muzzle interior
  ctx.fillStyle = '#1a0a2a';
  ctx.fillRect(68, -10, 8, 20);

  // Subtle glow on muzzle while powering
  if (state.phase === 'POWERING') {
    const glowAlpha = 0.3 + 0.3 * Math.sin(Date.now() * 0.01);
    ctx.fillStyle = `rgba(255, 100, 0, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(74, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDucky(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  // Body
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c79400';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Head
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(8, -8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Beak
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.lineTo(22, -6);
  ctx.lineTo(14, -4);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(10, -10, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(10.6, -10.6, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTrail(ctx, p) {
  if (p.trail.length < 2) return;
  ctx.lineWidth = 3;
  for (let i = 1; i < p.trail.length; i++) {
    const alpha = (i / p.trail.length) * 0.6;
    ctx.strokeStyle = `rgba(255, 215, 70, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
    ctx.lineTo(p.trail[i].x, p.trail[i].y);
    ctx.stroke();
  }
}

function drawLandingMarker(ctx, p) {
  // Pulsing splash circle where the duck landed
  const t = Date.now() * 0.005;
  const r = 12 + 8 * Math.abs(Math.sin(t));
  ctx.strokeStyle = 'rgba(255, 211, 61, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.landX, Math.min(p.landY, CONFIG.GROUND_Y + 4), r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawAimPreview(ctx, state) {
  const cx = CONFIG.CANNON_BASE_X;
  const cy = CONFIG.CANNON_BASE_Y;
  const angleRad = (state.angle * Math.PI) / 180;
  ctx.strokeStyle = 'rgba(255, 215, 70, 0.4)';
  ctx.setLineDash([4, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(angleRad) * 80, cy - Math.sin(angleRad) * 80);
  ctx.lineTo(cx + Math.cos(angleRad) * 220, cy - Math.sin(angleRad) * 220);
  ctx.stroke();
  ctx.setLineDash([]);
}
