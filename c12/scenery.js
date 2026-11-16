/** Painted meadow, sea, Pip and the little faces shared by the three modes. */

import { FACE, INK, inkWidth } from "./util.js";

export function traceRoundRect(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillStroke(ctx, fill, line, join = "round") {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (line) {
    ctx.lineWidth = line;
    ctx.strokeStyle = INK;
    ctx.lineJoin = join;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

export function glossOval(ctx, x, y, rx, ry, rot = -0.5) {
  if (![x, y, rx, ry].every(Number.isFinite) || rx <= 0 || ry <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, "rgba(255,255,255,0.78)");
  g.addColorStop(0.42, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function shadow(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.fillStyle = "rgba(28, 42, 36, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** mood: idle | joy | oh */
export function drawFace(ctx, x, y, s, mood = "idle", blink = 1) {
  const eye = s * 0.16;
  ctx.save();
  ctx.translate(x, y);
  if (mood === "joy" || blink < 0.45) {
    ctx.strokeStyle = FACE;
    ctx.lineWidth = Math.max(2, s * 0.045);
    ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * eye * 1.15 - eye * 0.55, -s * 0.02);
      ctx.quadraticCurveTo(side * eye * 1.15, -s * 0.16, side * eye * 1.15 + eye * 0.55, -s * 0.02);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      const ex = side * eye * 1.2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(ex, 0, eye * 0.62, eye * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = Math.max(1.6, s * 0.035);
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = FACE;
      ctx.beginPath();
      ctx.arc(ex + eye * 0.08, eye * 0.08, eye * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ex + eye * 0.2, -eye * 0.12, eye * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255, 120, 150, 0.8)";
  ctx.beginPath();
  ctx.ellipse(-eye * 1.7, s * 0.12, eye * 0.38, eye * 0.24, 0, 0, Math.PI * 2);
  ctx.ellipse(eye * 1.7, s * 0.12, eye * 0.38, eye * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = FACE;
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (mood === "oh") {
    ctx.beginPath();
    ctx.ellipse(0, s * 0.22, eye * 0.34, eye * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#5a1f36";
    ctx.fill();
  } else if (mood === "joy") {
    ctx.beginPath();
    ctx.moveTo(-eye * 0.7, s * 0.16);
    ctx.quadraticCurveTo(0, s * 0.48, eye * 0.7, s * 0.16);
    ctx.quadraticCurveTo(0, s * 0.28, -eye * 0.7, s * 0.16);
    ctx.fillStyle = "#5a1f36";
    ctx.fill();
    ctx.stroke();
  } else if (mood !== "beak") {
    ctx.beginPath();
    ctx.moveTo(-eye * 0.62, s * 0.18);
    ctx.quadraticCurveTo(0, s * 0.38, eye * 0.62, s * 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

function inkEllipse(ctx, x, y, rx, ry, rot, fill, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

/** House Pip from Colouring and Balloon Pop. `y` is the head centre. */
export function paintHousePip(ctx, x, y, r, lineScale = 844, opts = {}) {
  if (![x, y, r].every(Number.isFinite) || r <= 0) return;
  const cheer = opts.cheer ?? 0;
  const lw = Math.max(2.4, lineScale * 0.0032);
  const bodyY = y + r * 1.42;
  for (const side of [-1, 1]) {
    inkEllipse(ctx, x + side * r * 0.36, bodyY + r * 0.7, r * 0.24, r * 0.13, side * 0.15, "#ff8a3d", lw);
  }
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(x + side * r * 1.02, bodyY - r * (0.12 + cheer * 0.2));
    ctx.rotate(side * (0.7 + cheer * 0.4));
    const g = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.3);
    g.addColorStop(0, "#ffe27a");
    g.addColorStop(1, "#f0b429");
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.36, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }
  const body = ctx.createRadialGradient(x - r * 0.28, bodyY - r * 0.3, r * 0.05, x, bodyY, r);
  body.addColorStop(0, "#fff1a8");
  body.addColorStop(0.6, "#ffd23a");
  body.addColorStop(1, "#f0b429");
  ctx.beginPath();
  ctx.ellipse(x, bodyY, r * 0.98, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = "#ffc9a8";
  ctx.beginPath();
  ctx.ellipse(x, y + r * 1.6, r * 0.6, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  const tuft = (i, tip, drop, half) => {
    ctx.beginPath();
    ctx.moveTo(x + r * (i - half), y - r * 0.82);
    ctx.quadraticCurveTo(x + r * (i - half * 0.9), y + r * (drop + 0.22), x + r * tip, y + r * drop);
    ctx.quadraticCurveTo(x + r * (i + half * 0.6), y + r * (drop + 0.3), x + r * (i + half), y - r * 0.84);
    ctx.closePath();
    ctx.lineWidth = lw;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "#ffb703";
    ctx.fill();
  };
  tuft(-0.16, -0.34, -1.3, 0.16);
  tuft(0.04, 0.2, -1.42, 0.18);
  const head = ctx.createRadialGradient(x - r * 0.28, y - r * 0.4, r * 0.05, x, y, r);
  head.addColorStop(0, "#fff6c4");
  head.addColorStop(0.6, "#ffd23a");
  head.addColorStop(1, "#f0b429");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();
  ctx.stroke();
  for (const side of [-1, 1]) {
    const ex = x + side * r * 0.4;
    const ey = y - r * 0.2;
    ctx.fillStyle = "#fffdfb";
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.fillStyle = "#2a2140";
    ctx.beginPath();
    ctx.arc(ex, ey + r * 0.03, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex - r * 0.04, ey - r * 0.02, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x - r * 0.24, y + r * 0.1);
  ctx.quadraticCurveTo(x, y - r * 0.02, x + r * 0.24, y + r * 0.1);
  ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.3, x, y + r * 0.4);
  ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.3, x - r * 0.24, y + r * 0.1);
  ctx.closePath();
  ctx.fillStyle = "#ff8a3d";
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.strokeStyle = "rgba(190, 80, 20, 0.7)";
  ctx.lineWidth = Math.max(1.6, lw * 0.55);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.16, y + r * 0.17);
  ctx.quadraticCurveTo(x, y + r * 0.24, x + r * 0.16, y + r * 0.17);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 140, 150, 0.45)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.62, y + r * 0.2, r * 0.13, r * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.62, y + r * 0.2, r * 0.13, r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Pip stands on y (the ground under the feet). */
export function drawPip(ctx, x, y, s, mood, time, calm) {
  const bob = Math.sin(time * (calm ? 1.4 : 2.2)) * s * 0.025;
  const r = s * 0.34;
  shadow(ctx, x, y + 2, r * 0.9, r * 0.22);
  const cheer = mood === "joy" ? 0.85 : 0;
  // release-1: one Pip everywhere. The app exposes its master painter (house/pip.ts, the menu
  // Pip) as window.__housePip; this local copy is only the fallback if it is missing.
  const master = typeof window !== "undefined" ? window.__housePip : null;
  if (typeof master === "function") master(ctx, x, y - r * 2.2 + bob, r, 0, { cheer });
  else paintHousePip(ctx, x, y - r * 2.12 + bob, r, Math.max(640, s * 12), { cheer });
}

export function drawStump(ctx, x, y, s) {
  shadow(ctx, x, y + 4, s * 0.62, s * 0.14);
  ctx.fillStyle = "#d08a45";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, s * 0.07);
  traceRoundRect(ctx, x - s * 0.42, y - s * 0.78, s * 0.84, s * 0.82, s * 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.78, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#f0c48a";
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y - s * 0.78, s * 0.18, s * 0.06, 0, 0, Math.PI * 2);
  ctx.stroke();
}

