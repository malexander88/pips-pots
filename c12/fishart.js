/** Six painted fish and a flat hoop-and-bag net. */

import { INK, paint, patternId } from "./util.js";
import { glossOval } from "./scenery.js";

function strokeInk(ctx, w) {
  ctx.lineWidth = w;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function eye(ctx, x, y, s, blink) {
  const ry = Math.max(0.15, blink) * s;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(x, y, s, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  strokeInk(ctx, Math.max(1.7, s * 0.22));
  if (blink > 0.4) {
    ctx.fillStyle = "#2c3d63";
    ctx.beginPath();
    ctx.arc(x + s * 0.12, y + s * 0.08, s * 0.48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + s * 0.28, y - s * 0.18, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function smile(ctx, x, y, s, mood) {
  ctx.strokeStyle = "#2c3d63";
  ctx.lineWidth = Math.max(1.8, s * 0.16);
  ctx.lineCap = "round";
  if (mood === "oh") {
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.28, s * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#5a1f36";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.45, y);
    ctx.quadraticCurveTo(x, y + s * 0.55, x + s * 0.5, y - s * 0.05);
    ctx.stroke();
  }
}

function bands(ctx, colorName, bodyW, bodyH) {
  const id = patternId(colorName);
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(3, bodyH * 0.08);
  if (id === 0) {
    for (const dx of [-0.22, 0.05, 0.32]) {
      ctx.beginPath();
      ctx.moveTo(dx * bodyW, -bodyH * 0.46);
      ctx.quadraticCurveTo(dx * bodyW + bodyH * 0.08, 0, dx * bodyW, bodyH * 0.46);
      ctx.stroke();
    }
  } else if (id === 1) {
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-bodyW * 0.2 + i * bodyW * 0.12, ((i % 2) - 0.5) * bodyH * 0.3, bodyH * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 2) {
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.3, bodyH * 0.1);
    ctx.quadraticCurveTo(0, -bodyH * 0.2, bodyW * 0.3, bodyH * 0.05);
    ctx.stroke();
  } else if (id === 3) {
    for (const dx of [-0.15, 0.12]) {
      ctx.beginPath();
      ctx.moveTo(dx * bodyW, -bodyH * 0.4);
      ctx.lineTo(dx * bodyW + bodyH * 0.12, bodyH * 0.4);
      ctx.stroke();
    }
  } else if (id === 4) {
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyW * 0.22, bodyH * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(-bodyW * 0.25 + i * bodyW * 0.16, -bodyH * 0.08, bodyW * 0.08, bodyH * 0.16);
    }
  }
  ctx.restore();
}

function fin(ctx, x, y, w, h, rot, col, line) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.7, -h * 0.2, w, h * 0.15);
  ctx.quadraticCurveTo(w * 0.45, h * 0.55, 0, h * 0.2);
  ctx.closePath();
  ctx.fillStyle = col.light;
  ctx.fill();
  strokeInk(ctx, line);
  ctx.restore();
}

/**
 * Draw a fish facing +x, centred on the origin.
 * len is the full length including the tail.
 */
export function drawFish(ctx, species, colorName, len, opts = {}) {
  const { tail = 0, blink = 1, mood = "idle", pattern = false, line = 4 } = opts;
  const col = paint(colorName);
  const L = len;
  ctx.save();
  if (species === "clown") clown(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  else if (species === "tang") tang(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  else if (species === "puffer") puffer(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  else if (species === "angel") angel(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  else if (species === "gold") gold(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  else flat(ctx, col, colorName, L, tail, blink, mood, pattern, line);
  ctx.restore();
}

function clown(ctx, col, name, L, tail, blink, mood, pattern, line) {
  const bodyW = L * 0.34;
  const bodyH = L * 0.26;
  ctx.save();
  ctx.translate(-L * 0.46, 0);
  ctx.rotate(tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.08, -L * 0.16, -L * 0.2, -L * 0.12);
  ctx.quadraticCurveTo(-L * 0.08, 0, -L * 0.2, L * 0.12);
  ctx.quadraticCurveTo(-L * 0.08, L * 0.16, 0, 0);
  ctx.fillStyle = col.base;
  ctx.fill();
  strokeInk(ctx, line);
  ctx.restore();
  fin(ctx, -L * 0.02, -bodyH * 0.7, L * 0.16, L * 0.1, -0.6, col, line * 0.8);
  ctx.beginPath();
  ctx.ellipse(L * 0.04, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.ellipse(0, bodyH * 0.35, bodyW * 0.7, bodyH * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (pattern) bands(ctx, name, bodyW, bodyH);
  else {
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    for (const dx of [-0.35, 0.05, 0.4]) {
      ctx.beginPath();
      ctx.ellipse(dx * bodyW, 0, bodyW * 0.1, bodyH * 0.92, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(L * 0.04, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
  strokeInk(ctx, line);
  glossOval(ctx, -bodyW * 0.2, -bodyH * 0.35, bodyW * 0.28, bodyH * 0.16);
  eye(ctx, L * 0.22, -bodyH * 0.15, L * 0.07, blink);
  smile(ctx, L * 0.26, bodyH * 0.18, L * 0.09, mood);
  fin(ctx, L * 0.02, bodyH * 0.15, L * 0.12, L * 0.08, 0.8, col, line * 0.7);
}

function tang(ctx, col, name, L, tail, blink, mood, pattern, line) {
  ctx.save();
  ctx.translate(-L * 0.42, 0);
  ctx.rotate(tail * 0.6);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-L * 0.16, -L * 0.05);
  ctx.lineTo(-L * 0.22, 0);
  ctx.lineTo(-L * 0.16, L * 0.05);
  ctx.closePath();
  ctx.fillStyle = col.dark;
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(L * 0.42, 0);
  ctx.quadraticCurveTo(L * 0.1, -L * 0.28, -L * 0.22, -L * 0.16);
  ctx.quadraticCurveTo(-L * 0.34, 0, -L * 0.22, L * 0.16);
  ctx.quadraticCurveTo(L * 0.1, L * 0.28, L * 0.42, 0);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (pattern) bands(ctx, name, L * 0.3, L * 0.22);
  ctx.fillStyle = col.dark;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(-L * 0.02, 0, L * 0.08, L * 0.16, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(L * 0.42, 0);
  ctx.quadraticCurveTo(L * 0.1, -L * 0.28, -L * 0.22, -L * 0.16);
  ctx.quadraticCurveTo(-L * 0.34, 0, -L * 0.22, L * 0.16);
  ctx.quadraticCurveTo(L * 0.1, L * 0.28, L * 0.42, 0);
  ctx.closePath();
  strokeInk(ctx, line);
  fin(ctx, -L * 0.05, -L * 0.18, L * 0.18, L * 0.08, -1.1, col, line * 0.75);
  fin(ctx, -L * 0.05, L * 0.16, L * 0.16, L * 0.08, 1.1, col, line * 0.75);
  glossOval(ctx, L * 0.02, -L * 0.08, L * 0.1, L * 0.05);
  eye(ctx, L * 0.2, -L * 0.04, L * 0.055, blink);
  smile(ctx, L * 0.28, L * 0.05, L * 0.07, mood);
}

function puffer(ctx, col, name, L, tail, blink, mood, pattern, line) {
  const r = L * 0.3;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + tail * 0.2;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(L * 0.07, -L * 0.025);
    ctx.lineTo(L * 0.07, L * 0.025);
    ctx.closePath();
    ctx.fillStyle = col.dark;
    ctx.fill();
    strokeInk(ctx, line * 0.65);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.35, r * 0.7, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (pattern) bands(ctx, name, r, r);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  strokeInk(ctx, line);
  fin(ctx, -r * 0.2, r * 0.55, L * 0.1, L * 0.06, 1.2, col, line * 0.7);
  fin(ctx, r * 0.15, -r * 0.7, L * 0.1, L * 0.05, -0.8, col, line * 0.7);
  ctx.save();
  ctx.translate(-r * 0.85, 0);
  ctx.rotate(tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-L * 0.1, -L * 0.06);
  ctx.lineTo(-L * 0.1, L * 0.06);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  glossOval(ctx, -r * 0.25, -r * 0.28, r * 0.28, r * 0.16);
  eye(ctx, r * 0.28, -r * 0.12, L * 0.07, blink);
  smile(ctx, r * 0.32, r * 0.18, L * 0.08, mood);
}

function angel(ctx, col, name, L, tail, blink, mood, pattern, line) {
  ctx.beginPath();
  ctx.moveTo(L * 0.22, 0);
  ctx.bezierCurveTo(L * 0.05, -L * 0.42, -L * 0.28, -L * 0.38, -L * 0.34, 0);
  ctx.bezierCurveTo(-L * 0.28, L * 0.38, L * 0.05, L * 0.42, L * 0.22, 0);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (pattern) bands(ctx, name, L * 0.24, L * 0.34);
  else {
    ctx.fillStyle = col.light;
    ctx.globalAlpha = 0.75;
    for (const dx of [-0.08, 0.06]) {
      ctx.fillRect(dx * L, -L * 0.36, L * 0.035, L * 0.72);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(L * 0.22, 0);
  ctx.bezierCurveTo(L * 0.05, -L * 0.42, -L * 0.28, -L * 0.38, -L * 0.34, 0);
  ctx.bezierCurveTo(-L * 0.28, L * 0.38, L * 0.05, L * 0.42, L * 0.22, 0);
  ctx.closePath();
  strokeInk(ctx, line);
  ctx.save();
  ctx.translate(-L * 0.2, -L * 0.05);
  ctx.rotate(-0.4 + tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.16, -L * 0.28, -L * 0.05, -L * 0.46);
  ctx.quadraticCurveTo(L * 0.02, -L * 0.16, 0, 0);
  ctx.fillStyle = col.light;
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  ctx.save();
  ctx.translate(-L * 0.18, L * 0.08);
  ctx.rotate(0.5 + tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-L * 0.14, L * 0.26, 0, L * 0.42);
  ctx.quadraticCurveTo(L * 0.04, L * 0.14, 0, 0);
  ctx.fillStyle = col.light;
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  glossOval(ctx, -L * 0.02, -L * 0.16, L * 0.08, L * 0.05);
  eye(ctx, L * 0.08, -L * 0.06, L * 0.055, blink);
  smile(ctx, L * 0.12, L * 0.06, L * 0.07, mood);
}

function gold(ctx, col, name, L, tail, blink, mood, pattern, line) {
  ctx.save();
  ctx.translate(-L * 0.16, 0);
  ctx.rotate(tail);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-L * 0.16, side * L * 0.02, -L * 0.26, side * L * 0.16);
    ctx.quadraticCurveTo(-L * 0.08, side * L * 0.08, 0, 0);
    ctx.fillStyle = col.base;
    ctx.fill();
    strokeInk(ctx, line);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(L * 0.06, 0, L * 0.28, L * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(0, L * 0.08, L * 0.18, L * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (pattern) bands(ctx, name, L * 0.24, L * 0.2);
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(L * 0.06, 0, L * 0.28, L * 0.24, 0, 0, Math.PI * 2);
  strokeInk(ctx, line);
  fin(ctx, -L * 0.02, -L * 0.2, L * 0.16, L * 0.08, -0.7, col, line * 0.75);
  glossOval(ctx, -L * 0.02, -L * 0.08, L * 0.1, L * 0.055);
  eye(ctx, L * 0.18, -L * 0.04, L * 0.06, blink);
  smile(ctx, L * 0.22, L * 0.08, L * 0.075, mood);
}

function flat(ctx, col, name, L, tail, blink, mood, pattern, line) {
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.42, L * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(0, L * 0.06, L * 0.28, L * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = col.dark;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(-L * 0.2 + i * L * 0.14, (i % 2) * L * 0.04, L * 0.04, L * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (pattern) bands(ctx, name, L * 0.36, L * 0.16);
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.42, L * 0.2, 0, 0, Math.PI * 2);
  strokeInk(ctx, line);
  ctx.save();
  ctx.translate(-L * 0.38, 0);
  ctx.rotate(tail);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-L * 0.1, -L * 0.06);
  ctx.lineTo(-L * 0.1, L * 0.06);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  fin(ctx, L * 0.05, -L * 0.16, L * 0.14, L * 0.05, -0.4, col, line * 0.7);
  glossOval(ctx, -L * 0.08, -L * 0.06, L * 0.1, L * 0.04);
  eye(ctx, L * 0.12, -L * 0.05, L * 0.045, blink);
  eye(ctx, L * 0.26, -L * 0.06, L * 0.04, blink);
  smile(ctx, L * 0.3, L * 0.04, L * 0.06, mood);
}

export function fishBox(species, len) {
  if (species === "puffer") return { w: len * 0.78, h: len * 0.78 };
  if (species === "angel") return { w: len * 0.7, h: len * 0.92 };
  if (species === "flat") return { w: len * 0.96, h: len * 0.48 };
  if (species === "tang") return { w: len * 0.92, h: len * 0.58 };
  if (species === "gold") return { w: len * 0.96, h: len * 0.56 };
  return { w: len * 0.92, h: len * 0.58 };
}

export function drawNet(ctx, x, y, R, kx, ky, bulge, colorName, line, sway = 0) {
  const col = paint(colorName);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  const rx = R * kx;
  const ry = R * ky;
  const mouth = rx * 0.86;
  const bagH = R * 1.7;
  const belly = mouth * (0.72 + bulge * 0.55);
  const hem = mouth * 0.38;
  ctx.beginPath();
  ctx.moveTo(-mouth, ry * 0.15);
  ctx.quadraticCurveTo(-belly, ry * 0.15 + bagH * 0.55, -hem, ry * 0.15 + bagH);
  ctx.quadraticCurveTo(0, ry * 0.15 + bagH + R * 0.18, hem, ry * 0.15 + bagH);
  ctx.quadraticCurveTo(belly, ry * 0.15 + bagH * 0.55, mouth, ry * 0.15);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.globalAlpha = 0.38;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col.dark;
  ctx.lineWidth = Math.max(1.4, line * 0.45);
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const yy = ry * 0.15 + bagH * t;
    const half = mouth + (belly - mouth) * Math.sin(t * Math.PI) * 0.85 + (hem - mouth) * t * t;
    ctx.beginPath();
    ctx.moveTo(-half, yy);
    ctx.lineTo(half, yy);
    ctx.stroke();
  }
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * mouth * 0.38, ry * 0.2);
    ctx.quadraticCurveTo(i * belly * 0.45, ry + bagH * 0.5, i * hem * 0.7, ry * 0.15 + bagH);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-mouth, ry * 0.15);
  ctx.quadraticCurveTo(-belly, ry * 0.15 + bagH * 0.55, -hem, ry * 0.15 + bagH);
  ctx.quadraticCurveTo(0, ry * 0.15 + bagH + R * 0.18, hem, ry * 0.15 + bagH);
  ctx.quadraticCurveTo(belly, ry * 0.15 + bagH * 0.55, mouth, ry * 0.15);
  strokeInk(ctx, line);

  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(8, R * 0.22);
  ctx.strokeStyle = col.base;
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
  glossOval(ctx, -rx * 0.35, -ry * 0.35, rx * 0.28, ry * 0.16);

  ctx.save();
  ctx.translate(rx * 0.75, ry * 0.15);
  ctx.rotate(0.7);
  ctx.fillStyle = "#e8a25a";
  ctx.beginPath();
  ctx.moveTo(0, -line);
  ctx.lineTo(R * 0.85, -line * 0.8);
  ctx.lineTo(R * 0.85, line * 0.8);
  ctx.lineTo(0, line);
  ctx.closePath();
  ctx.fill();
  strokeInk(ctx, line * 0.8);
  ctx.restore();
  ctx.restore();
}

/** Clip to the hoop opening plus the bag, in the net's local space. Caller translates. */
export function netClip(ctx, R, kx, ky, bulge) {
  const rx = R * kx * 0.78;
  const ry = R * ky * 0.78;
  const mouth = R * kx * 0.8;
  const bagH = R * 1.65;
  const belly = mouth * (0.68 + bulge * 0.5);
  const hem = mouth * 0.34;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.moveTo(-mouth, ry * 0.2);
  ctx.quadraticCurveTo(-belly, bagH * 0.55, -hem, bagH);
  ctx.quadraticCurveTo(0, bagH + R * 0.12, hem, bagH);
  ctx.quadraticCurveTo(belly, bagH * 0.55, mouth, ry * 0.2);
  ctx.clip();
}

export function splashBurst(list, x, y, rng) {
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (rng() - 0.5) * 1.6;
    const sp = 30 + rng() * 70;
    list.push({
      x: x + (rng() - 0.5) * 20,
      y: y + (rng() - 0.5) * 10,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 4 + rng() * 8,
      life: 1,
    });
  }
  list.push({ x, y, vx: 0, vy: 0, r: 18, life: 1, ring: true });
}

export function drawSplashes(ctx, list, u) {
  for (const p of list) {
    ctx.globalAlpha = Math.max(0, p.life) * 0.85;
    if (p.ring) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1.4 - p.life * 0.4), 0, Math.PI * 2);
      ctx.strokeStyle = "#d8fbff";
      ctx.lineWidth = 4 * u;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#e7fbff";
      ctx.fill();
      ctx.lineWidth = Math.max(1.4, 1.6 * u);
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
