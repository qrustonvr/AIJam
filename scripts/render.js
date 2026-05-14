// =====================================================
// Canvas rendering — sky, terrain, zones, cannon, ducky
// Camera follows the duck during flight (state.cameraX).
// =====================================================

import { CONFIG } from './config.js';

export function renderFrame(ctx, state) {
  ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

  // Background (no camera offset — sky is "infinite")
  drawSky(ctx);
  drawStars(ctx, state);

  // Everything from here on lives in world-space and is shifted by camera.
  const cam = state.cameraX || 0;
  ctx.save();
  ctx.translate(-cam, 0);

  drawSkyline(ctx);
  drawWindStreaks(ctx, state);
  drawGround(ctx);
  drawZones(ctx);
  drawObstacles(ctx, state);
  drawAirTargets(ctx, state);
  drawCannon(ctx, state);

  if (state.projectile) {
    drawTrail(ctx, state.projectile);
    if (!state.projectile.landed) drawDucky(ctx, state.projectile);
    else drawLandingMarker(ctx, state.projectile);
  }

  if (state.phase === 'AIMING' || state.phase === 'POWERING') {
    drawAimPreview(ctx, state);
  }

  ctx.restore();
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
  if (!ctx._skylineCache) {
    ctx._skylineCache = [];
    let x = 0;
    while (x < CONFIG.WORLD_W) {
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
  if (!state._clouds) {
    state._clouds = [];
    for (let i = 0; i < 12; i++) {
      state._clouds.push({
        x: Math.random() * CONFIG.WORLD_W,
        y: 60 + Math.random() * 280,
        w: 60 + Math.random() * 140,
        alpha: 0.05 + Math.random() * 0.08
      });
    }
  }
  const speed = state.wind * 12;
  for (const c of state._clouds) {
    c.x += speed;
    if (c.x > CONFIG.WORLD_W + 100) c.x = -c.w;
    if (c.x < -c.w - 100) c.x = CONFIG.WORLD_W;
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
  ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.WORLD_W, CONFIG.CANVAS_H - CONFIG.GROUND_Y);

  ctx.strokeStyle = 'rgba(255, 211, 61, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.GROUND_Y);
  ctx.lineTo(CONFIG.WORLD_W, CONFIG.GROUND_Y);
  ctx.stroke();
}

function drawZones(ctx) {
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  for (const z of CONFIG.ZONES) {
    ctx.fillStyle = z.color;
    ctx.fillRect(z.start, CONFIG.GROUND_Y, z.end - z.start, 8);

    if (z.mult >= 5) {
      const g = ctx.createLinearGradient(0, CONFIG.GROUND_Y - 4, 0, CONFIG.GROUND_Y + 8);
      g.addColorStop(0, z.color + '00');
      g.addColorStop(1, z.color);
      ctx.fillStyle = g;
      ctx.fillRect(z.start, CONFIG.GROUND_Y - 4, z.end - z.start, 12);
    }

    const cx = (z.start + z.end) / 2;
    if (z.mult >= 1) {
      const labelColor = z.mult >= 10 ? '#ffd33d' : '#00e5ff';
      ctx.fillStyle = labelColor;
      ctx.shadowColor = labelColor;
      ctx.shadowBlur = z.mult >= 10 ? 12 : 6;
      ctx.fillText(z.label, cx, CONFIG.GROUND_Y - 10);
      ctx.shadowBlur = 0;
    } else if (z.mult > 0) {
      ctx.fillStyle = 'rgba(255, 160, 80, 0.85)';
      ctx.fillText(z.label, cx, CONFIG.GROUND_Y - 10);
    } else {
      ctx.fillStyle = 'rgba(255, 80, 80, 0.75)';
      ctx.fillText(z.label, cx, CONFIG.GROUND_Y - 10);
    }
  }
  ctx.textAlign = 'left';
}

function drawAirTargets(ctx, state) {
  const t = Date.now() * 0.003;
  for (const target of CONFIG.AIR_TARGETS) {
    const hit = state.projectile && state.projectile.airHits && state.projectile.airHits.has(target.id);
    if (target.type === 'ring') {
      drawRing(ctx, target, t, hit);
    } else if (target.type === 'star') {
      drawStarTarget(ctx, target, t, hit);
    }
  }
}

function drawRing(ctx, target, t, hit) {
  const pulse = 1 + Math.sin(t) * 0.04;
  const outer = target.radius * pulse;
  const inner = target.innerRadius * pulse;

  const glow = ctx.createRadialGradient(target.x, target.y, inner, target.x, target.y, outer + 14);
  glow.addColorStop(0, 'rgba(255, 211, 61, 0.0)');
  glow.addColorStop(0.6, 'rgba(255, 211, 61, 0.4)');
  glow.addColorStop(1, 'rgba(255, 211, 61, 0.0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(target.x, target.y, outer + 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = hit ? '#fff5b3' : target.color;
  ctx.beginPath();
  ctx.arc(target.x, target.y, outer, 0, Math.PI * 2);
  ctx.arc(target.x, target.y, inner, 0, Math.PI * 2, true);
  ctx.fill('evenodd');

  ctx.strokeStyle = '#a87c00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(target.x, target.y, outer, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(target.x, target.y, inner, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd33d';
  ctx.shadowColor = '#ffd33d';
  ctx.shadowBlur = 10;
  ctx.fillText(`${target.mult}x`, target.x, target.y - outer - 8);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function drawStarTarget(ctx, target, t, hit) {
  drawStarShape(ctx, target.x, target.y, target.radius, hit ? '#b3f4ff' : target.color, t);
  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = target.color;
  ctx.shadowColor = target.color;
  ctx.shadowBlur = 8;
  ctx.fillText(`${target.mult}x`, target.x, target.y - target.radius - 6);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function drawStarShape(ctx, x, y, r, color, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.5);

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 12);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r + 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#003a4d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawObstacles(ctx, state) {
  const t = Date.now() * 0.004;
  for (const o of CONFIG.OBSTACLES) {
    const hit = state.projectile && state.projectile.obstacleHits && state.projectile.obstacleHits.has(o.id);
    if (o.type === 'spike') drawSpikes(ctx, o, t, hit);
    else if (o.type === 'bumper') drawBumper(ctx, o, t, hit);
    else if (o.type === 'boost') drawBoost(ctx, o, t, hit);
    else if (o.type === 'cloud') drawStormCloud(ctx, o, t, hit);
  }
}

function drawSpikes(ctx, o, t, hit) {
  const sway = Math.sin(t) * 2;
  ctx.save();
  ctx.translate(o.x, o.y + sway);

  ctx.fillStyle = '#2a0a18';
  ctx.beginPath();
  ctx.arc(0, 0, o.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();

  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const ax = Math.cos(a) * o.radius * 0.55;
    const ay = Math.sin(a) * o.radius * 0.55;
    const tx = Math.cos(a) * o.radius;
    const ty = Math.sin(a) * o.radius;
    const px = -Math.sin(a) * 4;
    const py = Math.cos(a) * 4;
    ctx.fillStyle = hit ? '#ffb3b3' : o.color;
    ctx.beginPath();
    ctx.moveTo(ax + px, ay + py);
    ctx.lineTo(ax - px, ay - py);
    ctx.lineTo(tx, ty);
    ctx.closePath();
    ctx.fill();
  }

  if (hit) {
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, o.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoost(ctx, o, t, hit) {
  // Spring-loaded green disc with up-arrow chevrons. Hint that hitting this
  // sends the duck forward and up.
  ctx.save();
  ctx.translate(o.x, o.y);

  // Outer green glow
  const glow = ctx.createRadialGradient(0, 0, o.radius * 0.4, 0, 0, o.radius + 14);
  glow.addColorStop(0, 'rgba(90, 240, 160, 0.55)');
  glow.addColorStop(1, 'rgba(90, 240, 160, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, o.radius + 14, 0, Math.PI * 2);
  ctx.fill();

  // Body — green sphere
  const bodyGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, o.radius);
  bodyGrad.addColorStop(0, hit ? '#ffffff' : '#c8ffd9');
  bodyGrad.addColorStop(0.6, '#5af0a0');
  bodyGrad.addColorStop(1, '#1e6a3e');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
  ctx.fill();

  // Two up-arrow chevrons that bob up and down
  const bob = Math.sin(t * 2) * 3;
  ctx.strokeStyle = hit ? '#ffffff' : '#0d3a22';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const yOff = (i * 7) - 4 + bob;
    ctx.beginPath();
    ctx.moveTo(-7, yOff + 4);
    ctx.lineTo(0, yOff - 3);
    ctx.lineTo(7, yOff + 4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBumper(ctx, o, t, hit) {
  ctx.save();
  ctx.translate(o.x, o.y);

  const glow = ctx.createRadialGradient(0, 0, o.radius * 0.5, 0, 0, o.radius + 14);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, o.radius + 14, 0, Math.PI * 2);
  ctx.fill();

  const bodyGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, o.radius);
  bodyGrad.addColorStop(0, hit ? '#ffffff' : '#a0f0ff');
  bodyGrad.addColorStop(0.6, '#00e5ff');
  bodyGrad.addColorStop(1, '#005c66');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, o.radius, 0, Math.PI * 2);
  ctx.fill();

  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + pulse * 0.5})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, o.radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawStormCloud(ctx, o, t, hit) {
  ctx.save();
  ctx.translate(o.x, o.y);

  const drift = Math.sin(t * 0.5) * 3;

  ctx.fillStyle = hit ? '#9a6fd0' : o.color;
  const puffs = [
    { dx: -o.w * 0.35, dy: drift,     rx: o.w * 0.28, ry: o.h * 0.55 },
    { dx: -o.w * 0.1,  dy: -4 + drift, rx: o.w * 0.32, ry: o.h * 0.6 },
    { dx:  o.w * 0.18, dy: drift,     rx: o.w * 0.3,  ry: o.h * 0.55 },
    { dx:  o.w * 0.38, dy: 2 + drift, rx: o.w * 0.25, ry: o.h * 0.5 }
  ];
  for (const p of puffs) {
    ctx.beginPath();
    ctx.ellipse(p.dx, p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if ((Math.floor(t * 4) % 6) === 0) {
    ctx.strokeStyle = '#ffd33d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, o.h * 0.35);
    ctx.lineTo(2, o.h * 0.6);
    ctx.lineTo(-4, o.h * 0.7);
    ctx.lineTo(6, o.h * 0.95);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCannon(ctx, state) {
  const cx = CONFIG.CANNON_BASE_X;
  const cy = CONFIG.CANNON_BASE_Y;

  ctx.fillStyle = '#2a1140';
  ctx.fillRect(cx - 42, cy + 16, 84, 44);
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 42, cy + 16, 84, 44);

  ctx.fillStyle = '#3a1a55';
  ctx.beginPath();
  ctx.arc(cx, cy + 38, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffd33d';
  ctx.beginPath();
  ctx.arc(cx, cy + 38, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd33d';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 38);
    ctx.lineTo(cx + Math.cos(a) * 22, cy + 38 + Math.sin(a) * 22);
    ctx.stroke();
  }

  const angleRad = (state.angle * Math.PI) / 180;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-angleRad);

  const grad = ctx.createLinearGradient(0, -14, 0, 14);
  grad.addColorStop(0, '#ffe66e');
  grad.addColorStop(0.5, '#ffd33d');
  grad.addColorStop(1, '#a87c00');
  ctx.fillStyle = grad;
  ctx.fillRect(-4, -14, 78, 28);

  ctx.strokeStyle = '#5a3d00';
  ctx.lineWidth = 2;
  ctx.strokeRect(-4, -14, 78, 28);

  ctx.fillStyle = '#a87c00';
  ctx.fillRect(48, -16, 8, 32);
  ctx.strokeStyle = '#5a3d00';
  ctx.strokeRect(48, -16, 8, 32);

  ctx.fillStyle = '#1a0a2a';
  ctx.fillRect(68, -10, 8, 20);

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

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c79400';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(8, -8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.lineTo(22, -6);
  ctx.lineTo(14, -4);
  ctx.closePath();
  ctx.fill();

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
