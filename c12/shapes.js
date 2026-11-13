/** One outline per toy and its hole, so the silhouette the child matches is the same drawing. */

import { INK, paint } from "./util.js";
import { drawFace, fillStroke, glossOval, shadow } from "./scenery.js";

export function shapePath(ctx, shape, size) {
  const r = size / 2;
  ctx.beginPath();
  if (shape === "ball") {
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  } else if (shape === "coin") {
    ctx.ellipse(0, 0, r * 0.98, r * 0.68, 0, 0, Math.PI * 2);
  } else if (shape === "block") {
    const m = r * 0.9;
    const rad = r * 0.16;
    ctx.moveTo(-m + rad, -m);
    ctx.arcTo(m, -m, m, m, rad);
    ctx.arcTo(m, m, -m, m, rad);
    ctx.arcTo(-m, m, -m, -m, rad);
    ctx.arcTo(-m, -m, m, -m, rad);
    ctx.closePath();
  } else if (shape === "star") {
    const inner = r * 0.4;
    for (let i = 0; i < 10; i++) {
      const R = i % 2 === 0 ? r * 0.98 : inner;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const x = Math.cos(a) * R;
      const y = Math.sin(a) * R;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  } else if (shape === "heart") {
    ctx.moveTo(0, r * 0.82);
    ctx.bezierCurveTo(-r * 0.2, r * 0.35, -r * 1.05, r * 0.05, -r * 0.72, -r * 0.42);
    ctx.bezierCurveTo(-r * 0.45, -r * 0.95, -r * 0.05, -r * 0.72, 0, -r * 0.28);
    ctx.bezierCurveTo(r * 0.05, -r * 0.72, r * 0.45, -r * 0.95, r * 0.72, -r * 0.42);
    ctx.bezierCurveTo(r * 1.05, r * 0.05, r * 0.2, r * 0.35, 0, r * 0.82);
    ctx.closePath();
  } else if (shape === "pyramid") {
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(r * 0.96, r * 0.82);
    ctx.lineTo(-r * 0.96, r * 0.82);
    ctx.closePath();
  } else if (shape === "ring") {
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
    ctx.moveTo(r * 0.46, 0);
    ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2, true);
  } else if (shape === "button") {
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  } else {
    ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  }
}

function holeFill(ctx, size) {
  const g = ctx.createRadialGradient(-size * 0.08, -size * 0.12, size * 0.04, 0, 0, size * 0.62);
  g.addColorStop(0, "#4d6488");
  g.addColorStop(1, "#3a4e72");
  return g;
}

/**
 * Hole opening. `size` is the opening's bounding box.
 * The coloured rim and navy ink sit outside that box by stroke/2.
 */
export function drawHole(ctx, shape, x, y, size, color, line) {
  const col = paint(color);
  const stroke = Math.max(6, size * 0.13);
  ctx.save();
  ctx.translate(x, y);
  shapePath(ctx, shape, size);
  ctx.fillStyle = holeFill(ctx, size);
  if (shape === "ring") ctx.fill("evenodd");
  else ctx.fill();
  ctx.lineWidth = stroke;
  ctx.strokeStyle = col.base;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineWidth = Math.max(2.5, line * 0.85);
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (shape === "button") {
    ctx.fillStyle = "#2a3d62";
    for (const [dx, dy] of [
      [-0.28, -0.22],
      [0.28, -0.22],
      [-0.28, 0.28],
      [0.28, 0.28],
    ]) {
      ctx.beginPath();
      ctx.arc(dx * size, dy * size, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, line * 0.45);
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  if (shape === "coin") {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28);
    ctx.lineTo(0, size * 0.28);
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeStyle = col.light;
    ctx.stroke();
  }
  ctx.restore();
}

/** Outer radius of ink around a hole of the given opening size. */
export function holeOuter(size, line) {
  const stroke = Math.max(6, size * 0.13);
  const ink = Math.max(2.5, line * 0.85);
  return size / 2 + stroke / 2 + ink / 2;
}

export function drawToy(ctx, shape, x, y, size, color, line, opts = {}) {
  const { mood = "idle", lift = 1, wobble = 0, alpha = 1 } = opts;
  const col = paint(color);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(wobble);
  ctx.scale(lift, 1 / Math.max(0.82, lift));
  if (!opts.noShadow) shadow(ctx, 0, size * 0.48, size * 0.36, size * 0.09);
  shapePath(ctx, shape, size);
  ctx.fillStyle = col.base;
  if (shape === "ring") ctx.fill("evenodd");
  else ctx.fill();
  ctx.save();
  if (shape === "ring") ctx.clip("evenodd");
  else ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.55 * alpha;
  ctx.beginPath();
  ctx.ellipse(-size * 0.08, size * 0.12, size * 0.32, size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = alpha;
  glossOval(ctx, -size * 0.18, -size * 0.22, size * 0.16, size * 0.1);
  if (shape === "button") {
    ctx.fillStyle = col.dark;
    for (const [dx, dy] of [
      [-0.28, -0.22],
      [0.28, -0.22],
      [-0.28, 0.28],
      [0.28, 0.28],
    ]) {
      ctx.beginPath();
      ctx.arc(dx * size, dy * size, size * 0.065, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (shape === "coin") {
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.34, size * 0.22, 0, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.strokeStyle = col.dark;
    ctx.stroke();
  }
  if (shape !== "ring" && size > 36) drawFace(ctx, 0, -size * 0.02, size * 0.62, mood, opts.blink ?? 1);
  shapePath(ctx, shape, size);
  fillStroke(ctx, null, line);
  ctx.restore();
}

export function drawSparkle(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = Math.max(0, p.life);
  ctx.fillStyle = p.color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const R = i % 2 ? p.r * 0.35 : p.r;
    const a = (i * Math.PI) / 4;
    const x = Math.cos(a) * R;
    const y = Math.sin(a) * R;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function burst(list, x, y, color, rng, n = 12) {
  const cols = ["#ffd000", "#ffffff", "#ff6fae", "#5cc8ff", "#7be36b", paint(color).base];
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const sp = 40 + rng() * 90;
    list.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 30,
      life: 1,
      r: 6 + rng() * 7,
      rot: rng() * 6,
      color: cols[i % cols.length],
    });
  }
}

export function stepSparkles(list, dt) {
  for (const p of list) {
    p.life -= dt * 1.4;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt;
    p.rot += dt * 4;
  }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].life <= 0) list.splice(i, 1);
}
