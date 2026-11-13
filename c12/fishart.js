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
  ctx.translate(-L * 0.22, 0);
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
  ctx.translate(-L * 0.26, 0);
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
  ctx.translate(-L * 0.28, 0);
  ctx.rotate(tail);
  ctx.beginPath();
  ctx.moveTo(L * 0.08, -L * 0.04);
  ctx.quadraticCurveTo(-L * 0.08, -L * 0.16, -L * 0.2, -L * 0.1);
  ctx.quadraticCurveTo(-L * 0.06, 0, -L * 0.2, L * 0.1);
  ctx.quadraticCurveTo(-L * 0.08, L * 0.16, L * 0.08, L * 0.04);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  strokeInk(ctx, line);
  ctx.restore();
  fin(ctx, -L * 0.08, -L * 0.28, L * 0.16, L * 0.12, -1.15, col, line * 0.75);
  fin(ctx, -L * 0.06, L * 0.26, L * 0.14, L * 0.1, 1.15, col, line * 0.75);
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
  const ry = R * Math.max(0.55, ky * 0.78);
  const bagH = R * (2.35 + bulge * 0.85);
  const belly = rx * (1.05 + bulge * 0.85);
  const hem = rx * (0.34 + bulge * 0.2);
  const rim = Math.max(5, R * 0.16);
  // Far half of the hoop, behind the mesh.
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
  ctx.lineWidth = rim;
  ctx.strokeStyle = col.dark;
  ctx.stroke();
  ctx.lineWidth = line * 0.8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // Bag mouth is the whole ellipse, so the mesh meets the rim all the way round.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.96, ry * 0.96, 0, 0, Math.PI * 2);
  ctx.moveTo(-rx, ry * 0.15);
  ctx.quadraticCurveTo(-belly, bagH * 0.5, -hem, bagH);
  ctx.quadraticCurveTo(0, bagH + R * 0.28, hem, bagH);
  ctx.quadraticCurveTo(belly, bagH * 0.5, rx, ry * 0.15);
  ctx.clip();
  ctx.fillStyle = col.light;
  ctx.globalAlpha = 0.42;
  ctx.fillRect(-rx * 1.4, -ry, rx * 2.8, bagH + ry + R);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = col.dark;
  ctx.lineWidth = Math.max(1.25, line * 0.38);
  for (let i = 0; i <= 9; i++) {
    const yy = -ry + ((bagH + ry) * i) / 9;
    ctx.beginPath();
    ctx.moveTo(-rx * 1.3, yy);
    ctx.quadraticCurveTo(0, yy + R * 0.05, rx * 1.3, yy);
    ctx.stroke();
  }
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i / 4) * rx, -ry);
    ctx.quadraticCurveTo((i / 4) * belly, bagH * 0.45, (i / 4) * hem, bagH);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-rx, ry * 0.15);
  ctx.quadraticCurveTo(-belly, bagH * 0.5, -hem, bagH);
  ctx.quadraticCurveTo(0, bagH + R * 0.28, hem, bagH);
  ctx.quadraticCurveTo(belly, bagH * 0.5, rx, ry * 0.15);
  strokeInk(ctx, line);
  // Near half of the hoop, in front of the bag.
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI * 0.05, Math.PI * 0.95);
  ctx.lineWidth = rim;
  ctx.strokeStyle = col.base;
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.save();
  ctx.translate(rx * 0.9, ry * 0.45);
  ctx.rotate(0.9);
  tracePole(ctx, R * 1.2, line);
  ctx.restore();
  ctx.restore();
}

function tracePole(ctx, len, line) {
  ctx.fillStyle = "#e8a25a";
  ctx.beginPath();
  ctx.moveTo(0, -line * 0.7);
  ctx.lineTo(len, -line * 0.45);
  ctx.lineTo(len, line * 0.45);
  ctx.lineTo(0, line * 0.7);
  ctx.closePath();
  ctx.fill();
  strokeInk(ctx, line * 0.75);
  ctx.beginPath();
  ctx.arc(len, 0, line * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/** Clip to the hoop opening plus the bag, in the net's local space. Caller translates. */
export function netClip(ctx, R, kx, ky, bulge) {
  const rx = R * kx * 0.9;
  const ry = R * Math.max(0.5, ky * 0.72);
  const bagH = R * (2.2 + bulge * 0.7);
  const belly = rx * (1.02 + bulge * 0.6);
  const hem = rx * 0.32;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.moveTo(-rx, ry * 0.1);
  ctx.quadraticCurveTo(-belly, bagH * 0.5, -hem, bagH);
  ctx.quadraticCurveTo(0, bagH + R * 0.2, hem, bagH);
  ctx.quadraticCurveTo(belly, bagH * 0.5, rx, ry * 0.1);
  ctx.clip();
}

export function splashBurst(list, x, y, rng) {
  list.push({ x, y, r: 26, life: 1, crown: true });
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * 0.15 - (i / 7) * Math.PI * 0.7;
    const sp = 40 + rng() * 80;
    list.push({
      x: x + (rng() - 0.5) * 16,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 5 + rng() * 7,
      life: 1,
      drop: true,
    });
  }
  for (let i = 0; i < 6; i++) {
    list.push({
      x: x + (rng() - 0.5) * 28,
      y: y + rng() * 8,
      vx: (rng() - 0.5) * 20,
      vy: -20 - rng() * 40,
      r: 3 + rng() * 5,
      life: 1,
      bubble: true,
    });
  }
}

export function drawSplashes(ctx, list, u) {
  for (const p of list) {
    const life = Math.max(0, p.life);
    if (p.crown) {
      const grow = 1 + (1 - life) * 0.8;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = life * 0.55;
      ctx.fillStyle = "#8fe4f6";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 1.5 * grow, p.r * 0.72 * grow, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = life * 0.9;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 5 * u;
      ctx.beginPath();
      ctx.ellipse(0, 2 * u, p.r * 1.35 * grow, p.r * 0.48 * grow, 0, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      ctx.restore();
    } else if (p.drop) {
      ctx.save();
      ctx.globalAlpha = life * 0.8;
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
      ctx.fillStyle = "#b7f3ff";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 0.55, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-p.r * 0.15, -p.r * 0.25, p.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.globalAlpha = life * 0.75;
      ctx.fillStyle = "rgba(232, 251, 255, 0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = life;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 1.5 * u;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
