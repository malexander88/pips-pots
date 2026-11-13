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

function fence(ctx, x, y, width, u) {
  const posts = 6;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, 2.4 * u);
  ctx.fillStyle = "#fffdf8";
  for (let i = 0; i < posts; i++) {
    const px = x + (width * i) / (posts - 1);
    traceRoundRect(ctx, px - 3 * u, y - 22 * u, 6 * u, 26 * u, 2 * u);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x, y - 8 * u);
  ctx.lineTo(x + width, y - 8 * u);
  ctx.moveTo(x, y - 16 * u);
  ctx.lineTo(x + width, y - 16 * u);
  ctx.stroke();
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

  for (let i = 0; i < 8; i++) {
    const x = w * (0.04 + i * 0.13);
    bush(ctx, x, h * 0.56 + (i % 3) * 6 * u, (34 + (i * 7) % 22) * u);
  }
  tree(ctx, w * 0.06, h * 0.46, 48 * u);
  tree(ctx, w * 0.94, h * 0.44, 62 * u);
  tree(ctx, w * 0.82, h * 0.47, 40 * u);
  fence(ctx, w * 0.18, h * 0.6, w * 0.28, u);

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
  const pebbles = [[0.12, 0.86, 5], [0.22, 0.92, 7], [0.33, 0.84, 4], [0.47, 0.93, 6], [0.58, 0.86, 5], [0.7, 0.91, 8], [0.88, 0.87, 5]];
  for (const [px, py, pr] of pebbles) {
    ctx.beginPath();
    ctx.ellipse(w * px, h * py, pr * u, pr * 0.7 * u, px, 0, Math.PI * 2);
    ctx.fillStyle = px > 0.5 ? "#e7c48a" : "#f7e2b4";
    ctx.fill();
    ctx.stroke();
  }
  starFish(ctx, w * 0.4, h * 0.9, 14 * u);
  shell(ctx, w * 0.55, h * 0.88, 12 * u);
  shell(ctx, w * 0.16, h * 0.9, 9 * u);
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
  ctx.lineWidth = Math.max(2, s * 0.07);
  const blobs = [
    [0, -0.2, 0.55],
    [-0.45, -0.55, 0.38],
    [0.4, -0.7, 0.42],
    [0.05, -1.05, 0.32],
  ];
  for (const [dx, dy, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
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
  const spots = [0.05, 0.16, 0.28, 0.41, 0.57, 0.71, 0.86, 0.95];
  const greens = ["#147a52", "#1fa86a", "#2f8f4a", "#0e6b48"];
  spots.forEach((p, i) => {
    const x = w * p;
    const leaves = 2 + (i % 3);
    const tall = (64 + ((i * 17) % 40)) * u;
    const sway = Math.sin(time * speed + i * 1.3) * (10 + (i % 4) * 3) * u;
    for (let leaf = 0; leaf < leaves; leaf++) {
      const side = leaf - (leaves - 1) / 2;
      const lean = sway + side * (12 + (i % 3) * 4) * u;
      const bladeW = (12 + ((i + leaf) % 3) * 5) * u;
      const tip = tall * (0.72 + (leaf % 2) * 0.28);
      ctx.beginPath();
      ctx.moveTo(x - bladeW * 0.3, sand + 4);
      ctx.quadraticCurveTo(x + lean - bladeW, sand - tip * 0.55, x + lean * 0.55, sand - tip);
      ctx.quadraticCurveTo(x + lean + bladeW * 0.8, sand - tip * 0.45, x + bladeW * 0.3, sand + 4);
      ctx.closePath();
      ctx.fillStyle = greens[(i + leaf) % greens.length];
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
  paintHousePip(ctx, x, y - r * 2.12 + bob, r, Math.max(640, s * 12), { cheer: mood === "joy" ? 0.85 : 0 });
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

function drift(time, calm, speed) {
  return Math.sin(time * speed * (calm ? 0.45 : 1)) * (calm ? 8 : 16);
}

/** Far garden: sky, clouds and hills. Drawn full-bleed, then the hills shift. */
export function drawGardenFar(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#58aef7");
  sky.addColorStop(0.45, "#9ed8fb");
  sky.addColorStop(1, "#c6efb0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const far = drift(time, calm, 0.12);
  ctx.save();
  ctx.translate(far, 0);
  cloud(ctx, w * 0.16, h * 0.1, 50 * u);
  cloud(ctx, w * 0.42, h * 0.07, 36 * u);
  cloud(ctx, w * 0.7, h * 0.12, 58 * u);
  cloud(ctx, w * 0.92, h * 0.06, 30 * u);
  ctx.fillStyle = "#d7f3a4";
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.52, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.78, h * 0.5, w * 0.42, h * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "scene");
  ctx.stroke();
  ctx.restore();
}

export function drawGardenMid(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const mid = drift(time, calm, 0.2);
  const ground = ctx.createLinearGradient(0, h * 0.48, 0, h);
  ground.addColorStop(0, "#8ed85f");
  ground.addColorStop(1, "#3eae40");
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.58);
  ctx.quadraticCurveTo(w * 0.3, h * 0.5, w * 0.55, h * 0.58);
  ctx.quadraticCurveTo(w * 0.8, h * 0.66, w, h * 0.52);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "scene");
  ctx.stroke();
  ctx.save();
  ctx.translate(mid, 0);
  for (let i = 0; i < 7; i++) bush(ctx, w * (0.02 + i * 0.15), h * 0.55 + (i % 3) * 5 * u, (30 + (i * 9) % 24) * u);
  tree(ctx, w * 0.08, h * 0.42, 46 * u);
  tree(ctx, w * 0.9, h * 0.4, 58 * u);
  fence(ctx, w * 0.22, h * 0.57, w * 0.22, u);
  ctx.restore();
}

/** Flowers and grass along the bottom edge. Avoids the top-left home button. */
export function drawGardenFront(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const front = drift(time, calm, 0.32) * 0.35;
  const petals = ["#ff5d8f", "#ffd000", "#b06bff", "#ff8a3d", "#5cc8ff"];
  ctx.save();
  ctx.translate(front, 0);
  for (let i = 0; i < 14; i++) {
    const x = w * (0.02 + (i * 0.075) % 0.96);
    if (x < 120 && h - 28 * u < 120) continue;
    ctx.strokeStyle = "#1f7a32";
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + Math.sin(time + i) * 6 * u, h - 18 * u, x + (i % 2 ? 6 : -6) * u, h - 28 * u);
    ctx.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = w * (0.08 + i * 0.12);
    if (x < 130) continue;
    flower(ctx, x, h * 0.9 + (i % 2) * 8 * u, (12 + (i % 3) * 3) * u, petals[i % petals.length]);
  }
  ctx.restore();
}

export function drawSeaFar(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const far = drift(time, calm, 0.1);
  ctx.save();
  ctx.translate(far, 0);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#1a7eab";
  ctx.beginPath();
  ctx.moveTo(-40, h * 0.62);
  for (let i = 0; i < 8; i++) {
    const x = -40 + ((w + 120) * i) / 7;
    ctx.quadraticCurveTo(x + 30 * u, h * (0.42 + (i % 3) * 0.04), x + 70 * u, h * 0.62);
  }
  ctx.lineTo(w + 80, h * 0.78);
  ctx.lineTo(-40, h * 0.78);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = inkWidth(u, "thin");
  ctx.stroke();
  const glide = ((time * (calm ? 18 : 28)) % (w + 220)) - 160;
  ctx.save();
  ctx.translate(glide, h * 0.34);
  ctx.fillStyle = "#2f8f9a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 54 * u, 16 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(36 * u, -6 * u, 16 * u, 8 * u, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-40 * u, 0);
  ctx.quadraticCurveTo(-62 * u, -14 * u, -48 * u, 8 * u);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#fff6d0";
  for (let i = 0; i < 5; i++) {
    const x = ((w * (0.12 + i * 0.18) + time * 8) % (w + 40)) - 20;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 18 * u, h * 0.7);
    ctx.lineTo(x + 26 * u, h * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawSeaFront(ctx, w, h, time, calm) {
  const u = Math.min(w / 844, h / 390);
  const sand = h * 0.78;
  const spots = [0.02, 0.97];
  spots.forEach((p, i) => {
    const x = w * p;
    const sway = Math.sin(time * (calm ? 0.8 : 1.4) + i) * 12 * u;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + sway, sand + 10 * u, x + sway * 0.4, sand - 20 * u);
    ctx.quadraticCurveTo(x + sway + 16 * u, sand + 20 * u, x + 10 * u, h);
    ctx.closePath();
    ctx.fillStyle = "#0e6b48";
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = inkWidth(u, "thin");
    ctx.stroke();
  });
}
