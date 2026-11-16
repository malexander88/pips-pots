/** Sparkle bursts for the train (the toy and hole shapes of the retired games were removed). */

import { INK, paint } from "./util.js";

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
