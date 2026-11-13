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

function cloud(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y + s * 0.12);
  ctx.bezierCurveTo(x - s * 0.78, y - s * 0.08, x - s * 0.42, y - s * 0.38, x - s * 0.16, y - s * 0.2);
  ctx.bezierCurveTo(x - s * 0.08, y - s * 0.5, x + s * 0.28, y - s * 0.46, x + s * 0.34, y - s * 0.16);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 0.28, x + s * 0.78, y + s * 0.08, x + s * 0.46, y + s * 0.16);
  ctx.quadraticCurveTo(x, y + s * 0.3, x - s * 0.55, y + s * 0.12);
  ctx.closePath();
  ctx.fillStyle = "#f4f7fb";
  ctx.fill();
  ctx.lineWidth = inkWidth(s / 46, "scene");
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function bush(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y + s * 0.2);
  ctx.quadraticCurveTo(x - s * 0.85, y - s * 0.25, x - s * 0.35, y - s * 0.32);
  ctx.quadraticCurveTo(x - s * 0.1, y - s * 0.62, x + s * 0.2, y - s * 0.28);
  ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.4, x + s * 0.72, y + s * 0.16);
  ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.38, x - s * 0.7, y + s * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#3cba4e";
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2.4, s * 0.05);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.ellipse(x - s * 0.16, y - s * 0.12, s * 0.16, s * 0.08, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function tree(ctx, x, y, s) {
  const line = inkWidth(s / 50, "scene");
  ctx.fillStyle = "#c47a3a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = line;
  traceRoundRect(ctx, x - s * 0.07, y - s * 0.05, s * 0.14, s * 0.48, s * 0.04);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y - s * 0.32, s * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = "#2fae46";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.ellipse(x - s * 0.1, y - s * 0.42, s * 0.12, s * 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function flower(ctx, x, y, s, color) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.6, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - s);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * s * 0.28, y - s + Math.sin(a) * s * 0.28, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ffe14a";
  ctx.beginPath();
  ctx.arc(x, y - s, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawMeadow(ctx, w, h) {
  const u = Math.min(w / 844, h / 390);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#58aef7");
  sky.addColorStop(0.55, "#8ed4fb");
  sky.addColorStop(1, "#d7f3c8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#b7e6f6";
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.62, w * 0.7, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c6ee8a";
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.58, w * 0.42, h * 0.16, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.78, h * 0.56, w * 0.4, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "scene");
  ctx.stroke();

  const ground = ctx.createLinearGradient(0, h * 0.5, 0, h);
  ground.addColorStop(0, "#7ed45a");
  ground.addColorStop(1, "#49b844");
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.quadraticCurveTo(w * 0.25, h * 0.52, w * 0.5, h * 0.6);
  ctx.quadraticCurveTo(w * 0.75, h * 0.68, w, h * 0.56);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "scene");
  ctx.stroke();

  for (let i = 0; i < 9; i++) {
    const x = w * (0.06 + i * 0.11);
    bush(ctx, x, h * 0.58 + (i % 2) * 8 * u, 46 * u + (i % 3) * 8 * u);
  }
  tree(ctx, w * 0.12, h * 0.5, 70 * u);
  tree(ctx, w * 0.9, h * 0.48, 84 * u);
  tree(ctx, w * 0.78, h * 0.5, 58 * u);

  cloud(ctx, w * 0.18, h * 0.12, 54 * u);
  cloud(ctx, w * 0.42, h * 0.08, 40 * u);
  cloud(ctx, w * 0.72, h * 0.14, 62 * u);
  cloud(ctx, w * 0.9, h * 0.07, 34 * u);

  const petals = ["#ff5d8f", "#ffd000", "#b06bff", "#ff8a3d"];
  for (let i = 0; i < 7; i++) {
    flower(ctx, w * (0.08 + i * 0.13), h * 0.78 + (i % 2) * 16 * u, 16 * u, petals[i % petals.length]);
  }
}

export function drawSea(ctx, w, h) {
  const u = Math.min(w / 844, h / 390);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#b8f4ff");
  g.addColorStop(0.35, "#7fe0f2");
  g.addColorStop(0.72, "#3eb6d8");
  g.addColorStop(1, "#1f8eb8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#fff6d0";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(w * (0.18 + i * 0.14), 0);
    ctx.lineTo(w * (0.08 + i * 0.14), h);
    ctx.lineTo(w * (0.22 + i * 0.14), h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const sandTop = h * 0.78;
  ctx.fillStyle = "#f2cf86";
  ctx.beginPath();
  ctx.moveTo(0, sandTop);
  ctx.quadraticCurveTo(w * 0.3, sandTop - 16 * u, w * 0.6, sandTop + 6 * u);
  ctx.quadraticCurveTo(w * 0.85, sandTop + 18 * u, w, sandTop - 4 * u);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "scene");
  ctx.stroke();

  drawRock(ctx, w * 0.18, sandTop + 8 * u, 54 * u, 28 * u);
  drawRock(ctx, w * 0.62, sandTop + 14 * u, 70 * u, 26 * u);
  drawRock(ctx, w * 0.84, sandTop + 6 * u, 40 * u, 20 * u);
  drawCoral(ctx, w * 0.3, sandTop, 36 * u, "#ff7aa2");
  drawCoral(ctx, w * 0.48, sandTop + 4 * u, 28 * u, "#ffb15a");
  drawCoral(ctx, w * 0.72, sandTop - 2 * u, 32 * u, "#d98bff");

  ctx.strokeStyle = INK;
  ctx.fillStyle = "#f6d7a2";
  ctx.lineWidth = inkWidth(u, "thin");
  starFish(ctx, w * 0.4, h * 0.9, 14 * u);
  shell(ctx, w * 0.55, h * 0.88, 12 * u);
}

function drawRock(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w, y + h * 0.2);
  ctx.quadraticCurveTo(x - w * 0.8, y - h, x, y - h * 1.05);
  ctx.quadraticCurveTo(x + w * 0.9, y - h * 0.7, x + w, y + h * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#8fd0c8";
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2.5, w * 0.08);
  ctx.stroke();
  glossOval(ctx, x - w * 0.25, y - h * 0.45, w * 0.28, h * 0.22);
}

function drawCoral(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, s * 0.08);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * s * 0.35, y);
    ctx.quadraticCurveTo(x + i * s * 0.55, y - s * 0.8, x + i * s * 0.2, y - s * 1.3);
    ctx.lineWidth = s * 0.28;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + i * s * 0.2, y - s * 1.3, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function starFish(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const b = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * r * 0.42, y + Math.sin(b) * r * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function shell(ctx, x, y, r) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.7, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff1d4";
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function drawKelp(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const sand = h * 0.78;
  const speed = calm ? 0.6 : 1.3;
  const spots = [0.06, 0.18, 0.33, 0.47, 0.63, 0.76, 0.9];
  spots.forEach((p, i) => {
    const x = w * p;
    const tall = (78 + (i % 3) * 26) * u;
    const sway = Math.sin(time * speed + i) * 14 * u;
    for (const side of [-1, 0, 1]) {
      const lean = sway + side * 10 * u;
      const bladeW = (16 + (i % 2) * 6) * u;
      ctx.beginPath();
      ctx.moveTo(x - bladeW * 0.35, sand + 4);
      ctx.quadraticCurveTo(x + lean - bladeW, sand - tall * 0.55, x + lean * 0.6, sand - tall);
      ctx.quadraticCurveTo(x + lean + bladeW, sand - tall * 0.5, x + bladeW * 0.35, sand + 4);
      ctx.closePath();
      ctx.fillStyle = side === 0 ? "#1fa86a" : "#178a56";
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = inkWidth(u, "thin");
      ctx.stroke();
    }
  });
}

export function drawBubbles(ctx, bubbles, u) {
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(226, 250, 255, 0.45)";
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, 1.6 * u);
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.3, b.r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCaustics(ctx, w, h, time) {
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = "#f3fffd";
  for (let i = 0; i < 6; i++) {
    const x = ((w * (0.1 + i * 0.16) + Math.sin(time * 0.35 + i) * 30) % (w + 80)) - 40;
    const y = h * (0.28 + (i % 3) * 0.14) + Math.cos(time * 0.4 + i) * 8;
    ctx.beginPath();
    ctx.ellipse(x, y, 70 + (i % 3) * 20, 16, Math.sin(time * 0.2 + i) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Pip stands on y (feet). */
export function drawPip(ctx, x, y, s, mood, time, calm) {
  const bob = Math.sin(time * (calm ? 1.4 : 2.4)) * s * 0.03;
  const yy = y + bob;
  shadow(ctx, x, y + 2, s * 0.36, s * 0.09);
  ctx.save();
  ctx.translate(x, yy);
  ctx.lineWidth = Math.max(2.6, s * 0.05);
  ctx.strokeStyle = INK;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-s * 0.1, -s * 0.12);
  ctx.lineTo(-s * 0.2, s * 0.08);
  ctx.lineTo(-s * 0.02, s * 0.08);
  ctx.moveTo(s * 0.08, -s * 0.12);
  ctx.lineTo(s * 0.02, s * 0.08);
  ctx.lineTo(s * 0.22, s * 0.08);
  ctx.stroke();
  ctx.fillStyle = "#ffe14a";
  ctx.beginPath();
  ctx.arc(0, -s * 0.5, s * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(s * 0.24, -s * 0.42, s * 0.13, s * 0.09, 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd23a";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ff9a2a";
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, -s * 0.84);
  ctx.quadraticCurveTo(0.01, -s * 1.08, s * 0.1, -s * 0.82);
  ctx.quadraticCurveTo(0, -s * 0.78, -s * 0.05, -s * 0.84);
  ctx.fill();
  ctx.stroke();
  drawFace(ctx, -s * 0.02, -s * 0.52, s * 0.52, mood === "idle" ? "beak" : mood, 1);
  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.46);
  ctx.lineTo(s * 0.32, -s * 0.4);
  ctx.lineTo(s * 0.08, -s * 0.34);
  ctx.closePath();
  ctx.fillStyle = "#ff8a2a";
  ctx.fill();
  ctx.stroke();
  glossOval(ctx, -s * 0.12, -s * 0.64, s * 0.1, s * 0.055);
  ctx.restore();
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
