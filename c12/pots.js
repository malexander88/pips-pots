/** Colour sorting: pots standing on the lawn. No two identical toys at once. */

import {
  INK,
  LEVELS,
  SIG_SHAPE,
  inkWidth,
  levelForCount,
  mulberry32,
  sfx,
  shuffle,
} from "./util.js";
import { drawFace, drawPip, fillStroke, glossOval } from "./scenery.js";
import { burst, drawSparkle, drawToy, stepSparkles } from "./shapes.js";
import { paint } from "./util.js";

export function createPots(Q) {
  const seed = Number(new URLSearchParams(location.search).get("seed")) || 3;
  const endless = Q.mode === "endless";
  const levelIndex = endless ? LEVELS.length - 1 : levelForCount(Q.colorCount || 3);
  const rng = mulberry32((seed * 131 + levelIndex * 17) >>> 0);
  const game = {
    kind: "pots",
    endless,
    levelIndex,
    level: LEVELS[levelIndex],
    rng,
    time: 0,
    sorted: 0,
    roundSorted: 0,
    toys: [],
    pots: [],
    sparkles: [],
    drag: null,
    bgKey: "",
  };
  beginRound(game);
  return game;
}

function beginRound(game) {
  const level = game.level;
  game.pots = level.colors.map((color, i) => ({
    color,
    mood: "idle",
    moodT: 0,
    squash: 1,
  }));
  const n = Math.min(level.visible, level.colors.length * level.shapes.length);
  game.toys = deal(level, n, game.rng).map((toy, i) => ({
    ...toy,
    id: game.sorted + i + 1,
    phase: "idle",
    t: 0,
    wobble: 0,
    scale: 1,
  }));
  game.queue = deal(level, 12, game.rng);
}

function deal(level, n, rng) {
  const toys = [];
  const used = new Set();
  const add = (shape, color) => {
    const key = `${shape}:${color}`;
    if (used.has(key) || toys.length >= n) return false;
    used.add(key);
    toys.push({ shape, color, key });
    return true;
  };
  for (const color of shuffle(level.colors, rng)) add(SIG_SHAPE[color] || "ball", color);
  const shapes = shuffle(level.shapes, rng);
  const colors = level.colors;
  let guard = 0;
  while (toys.length < n && guard < 80) {
    add(shapes[guard % shapes.length], colors[guard % colors.length]);
    guard += 1;
  }
  return shuffle(toys, rng);
}

export function layoutPots(game, w, h) {
  const u = Math.min(w / 844, h / 390);
  const pots = game.pots.length;
  const gap = Math.max(12, 16 * u);
  const live = game.toys.filter((t) => t.phase !== "gone");
  const count = Math.max(1, live.length);
  const side = Math.max(112 * u, w * 0.13);
  const avail = Math.max(180, w - side * 2);
  const floor = w >= 820 && h >= 370 ? 64 : 58;
  const want = Math.max(floor, 70 * u);
  let toy = Math.min(want, (avail - (count - 1) * gap) / count);
  if (w >= 820 && h >= 370) toy = Math.max(64, toy);
  const rowW = count * toy + (count - 1) * gap;
  const potGap = Math.max(14, 16 * u);
  let potW = Math.min(104 * u, (avail - (pots - 1) * potGap) / Math.max(1, pots));
  potW = Math.max(potW, toy * 0.95);
  let potH = potW * 0.78;
  const potsW = pots * potW + (pots - 1) * potGap;
  const potBase = Math.min(h * 0.72, h - toy * 1.05 - 6);
  if (potBase - potH < h * 0.5) potH = Math.max(48 * u, potBase - h * 0.5);
  const potTop = potBase - potH;
  const toyY = Math.min(h - toy * 0.62, potBase + Math.max(24 * u, toy * 0.42));
  let x = (w - rowW) / 2 + toy / 2;
  for (const t of live) {
    t.homeX = x;
    t.homeY = toyY;
    t.size = toy;
    if (t.phase === "idle") {
      t.x = t.homeX;
      t.y = t.homeY;
    }
    x += toy + gap;
  }
  let px = (w - potsW) / 2 + potW / 2;
  let playLeft = px - potW / 2;
  let playRight = px - potW / 2;
  for (const p of game.pots) {
    p.x = px;
    p.base = potBase;
    p.w = potW;
    p.h = potH;
    playLeft = Math.min(playLeft, px - potW / 2);
    playRight = Math.max(playRight, px + potW / 2);
    px += potW + potGap;
  }
  const toyLeft = (w - rowW) / 2;
  playLeft = Math.min(playLeft, toyLeft) - 8;
  playRight = Math.max(playRight, toyLeft + rowW) + 8;
  const pip = Math.min(92, 78 * u);
  game.view = {
    u, w, h, toy, gap, potBase, potTop, potW, potH,
    playLeft, playRight, playTop: potTop - 10,
    pipX: Math.max(72, Math.min(side * 0.62, playLeft - pip * 0.7)),
    pipY: potBase,
    pip,
  };
  const boxes = live.filter((t) => t.phase === "idle").map((t) => t.size);
  game.metrics = {
    toy,
    gap,
    minToy: boxes.length ? Math.min(...live.map((t) => t.size)) : toy,
    pairs: live.map((t) => t.key),
    unique: new Set(live.map((t) => t.key)).size === live.length,
    pots: game.pots.map((p) => p.color),
    level: game.levelIndex,
  };
}

export function stepPots(game, dt, w, h) {
  game.time += dt;
  layoutPots(game, w, h);
  for (const p of game.pots) {
    if (p.moodT > 0) {
      p.moodT -= dt;
      if (p.moodT <= 0) p.mood = "idle";
    }
    p.squash += (1 - p.squash) * Math.min(1, dt * 8);
  }
  for (const t of game.toys) {
    if (t.phase === "drag" && game.drag) {
      t.x = game.drag.x;
      t.y = game.drag.y;
      t.scale += (1.08 - t.scale) * Math.min(1, dt * 18);
    } else if (t.phase === "return") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.35);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.homeX - t.fromX) * e;
      t.y = t.fromY + (t.homeY - t.fromY) * e;
      t.wobble = Math.sin(k * Math.PI * 3) * 0.2 * (1 - k);
      t.scale += (1 - t.scale) * Math.min(1, dt * 10);
      if (k >= 1) {
        t.phase = "idle";
        t.x = t.homeX;
        t.y = t.homeY;
        t.wobble = 0;
      }
    } else if (t.phase === "sink") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.42);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.toX - t.fromX) * e;
      t.y = t.fromY + (t.toY - t.fromY) * e - Math.sin(k * Math.PI) * (t.size || 64) * 0.7;
      t.scale = k < 0.62 ? 1 + k * 0.12 : 1.07 - ((k - 0.62) / 0.38) * 0.5;
      if (k >= 1) t.phase = "gone";
    } else if (t.phase === "idle") {
      t.x = t.homeX;
      t.y = t.homeY;
      t.scale += (1 - t.scale) * Math.min(1, dt * 10);
    }
  }
  if (game.toys.some((t) => t.phase === "gone")) {
    game.toys = game.toys.filter((t) => t.phase !== "gone");
    refill(game);
    layoutPots(game, w, h);
  }
  stepSparkles(game.sparkles, dt);
}

function refill(game) {
  const have = new Set(game.toys.map((t) => t.key));
  const want = Math.min(game.level.visible, game.level.colors.length * Math.max(1, game.level.shapes.length));
  while (game.toys.length < want) {
    let next = game.queue.find((q) => !have.has(q.key));
    if (!next) {
      game.queue = deal(game.level, 16, game.rng);
      next = game.queue.find((q) => !have.has(q.key));
    }
    if (!next) break;
    have.add(next.key);
    game.toys.push({
      ...next,
      id: game.sorted + game.toys.length + 3,
      phase: "idle",
      t: 0,
      wobble: 0,
      scale: 0.2,
    });
  }
}

function advance(game) {
  if (game.endless) {
    beginRound(game);
    return;
  }
  if (game.levelIndex < LEVELS.length - 1) game.levelIndex += 1;
  game.level = LEVELS[game.levelIndex];
  game.roundSorted = 0;
  beginRound(game);
  burst(game.sparkles, (game.view?.playLeft + game.view?.playRight) / 2 || 400, game.view?.potTop || 200, "yellow", game.rng, 16);
}

function hitToy(game, x, y) {
  for (let i = game.toys.length - 1; i >= 0; i--) {
    const t = game.toys[i];
    if (t.phase !== "idle" && t.phase !== "return") continue;
    if (Math.abs(x - t.x) <= t.size * 0.55 && Math.abs(y - t.y) <= t.size * 0.55) return t;
  }
  return null;
}

function hitPot(game, x, y) {
  for (const p of game.pots) {
    if (Math.abs(x - p.x) <= p.w * 0.5 && y >= p.base - p.h - 8 && y <= p.base + 12) return p;
  }
  return null;
}

export function potsPointerDown(game, x, y, w, h) {
  layoutPots(game, w, h);
  const t = hitToy(game, x, y);
  if (!t) return false;
  t.phase = "drag";
  t.scale = 1.08;
  game.drag = { id: t.id, x, y };
  sfx("liftWhoosh");
  return true;
}

export function potsPointerMove(game, x, y) {
  if (game.drag) {
    game.drag.x = x;
    game.drag.y = y;
  }
}

export function potsPointerUp(game, w, h) {
  if (!game.drag) return;
  const finger = game.drag;
  layoutPots(game, w, h);
  const t = game.toys.find((toy) => toy.id === finger.id);
  game.drag = null;
  if (!t || t.phase !== "drag") return;
  t.x = finger.x;
  t.y = finger.y;
  const pot = hitPot(game, finger.x, finger.y);
  if (pot && pot.color === t.color) {
    t.phase = "sink";
    t.t = 0;
    t.fromX = t.x;
    t.fromY = t.y;
    t.toX = pot.x;
    t.toY = pot.base - pot.h * 0.72;
    pot.mood = "joy";
    pot.moodT = 0.9;
    pot.squash = 1.12;
    game.sorted += 1;
    game.roundSorted += 1;
    sfx("colorChime", t.color);
    burst(game.sparkles, pot.x, pot.base - pot.h, t.color, game.rng, 10);
    if (game.sorted % 10 === 0) sfx("fanfare");
    if (game.roundSorted >= game.level.count) advance(game);
    return;
  }
  if (pot) {
    pot.mood = "oh";
    pot.moodT = 0.7;
  }
  t.phase = "return";
  t.t = 0;
  t.fromX = t.x;
  t.fromY = t.y;
}

function driftOf(time, calm, speed, amount) {
  return Math.sin(time * speed * (calm ? 0.45 : 1)) * (calm ? amount * 0.45 : amount);
}

function strokeInk(ctx, line) {
  ctx.lineWidth = line;
  ctx.strokeStyle = INK;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawPotsWorld(ctx, w, h, time, calm, view, part = "all") {
  const u = view?.u || Math.min(w / 844, h / 390);
  const line = inkWidth(u, "scene");
  const sway = part === "all" ? Math.sin(time * (calm ? 0.9 : 1.5)) : 0;
  if (part !== "mid") {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#58aef7");
  sky.addColorStop(0.42, "#9ed8fb");
  sky.addColorStop(1, "#b7e48a");
  ctx.fillStyle = sky;
  ctx.fillRect(-80, 0, w + 160, h);
  const sunX = w * 0.8;
  const sunY = h * 0.14;
  const sun = ctx.createRadialGradient(sunX, sunY, 4 * u, sunX, sunY, 78 * u);
  sun.addColorStop(0, "rgba(255, 244, 186, 0.95)");
  sun.addColorStop(1, "rgba(255, 244, 186, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 78 * u, 0, Math.PI * 2);
  ctx.fill();

  cloud(ctx, w * 0.18, h * 0.1, 46 * u, line);
  cloud(ctx, w * 0.46, h * 0.07, 34 * u, line);
  cloud(ctx, w * 0.68, h * 0.13, 52 * u, line);
  if (w > 1000) cloud(ctx, w * 0.32, h * 0.16, 28 * u, line);
  ctx.fillStyle = "#e7f6b8";
  ctx.beginPath();
  ctx.moveTo(-60, h * 0.4);
  ctx.quadraticCurveTo(w * 0.22, h * 0.24, w * 0.48, h * 0.36);
  ctx.quadraticCurveTo(w * 0.74, h * 0.22, w + 80, h * 0.38);
  ctx.lineTo(w + 80, h * 0.48);
  ctx.lineTo(-60, h * 0.48);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-60, h * 0.4);
  ctx.quadraticCurveTo(w * 0.22, h * 0.24, w * 0.48, h * 0.36);
  ctx.quadraticCurveTo(w * 0.74, h * 0.22, w + 80, h * 0.38);
  strokeInk(ctx, line);
  barn(ctx, w * 0.63, h * 0.33, 34 * u, line);
  farFence(ctx, w * 0.07, h * 0.3, w * 0.12, u);
  }
  if (part === "far") return;

  const lawn = ctx.createLinearGradient(0, h * 0.4, 0, h);
  lawn.addColorStop(0, "#8ed85f");
  lawn.addColorStop(1, "#3eae40");
  ctx.fillStyle = lawn;
  ctx.beginPath();
  ctx.moveTo(-80, h * 0.44);
  ctx.quadraticCurveTo(w * 0.28, h * 0.38, w * 0.55, h * 0.43);
  ctx.quadraticCurveTo(w * 0.82, h * 0.36, w + 80, h * 0.42);
  ctx.lineTo(w + 80, h);
  ctx.lineTo(-80, h);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-80, h * 0.44);
  ctx.quadraticCurveTo(w * 0.28, h * 0.38, w * 0.55, h * 0.43);
  ctx.quadraticCurveTo(w * 0.82, h * 0.36, w + 80, h * 0.42);
  strokeInk(ctx, line);

  const stop = view ? view.playTop - 12 : h * 0.48;
  drawPath(ctx, w, h, u, stop, line);
  const bushStep = w > 1100 ? 0.09 : 0.14;
  for (let i = 0; i < 1; i += bushStep) {
    const bx = w * (0.04 + i);
    const by = h * 0.45 + Math.sin(i * 12) * 8 * u;
    if (blocked(bx, by, 26 * u, view)) continue;
    bush(ctx, bx + sway * 3, by, (26 + (i * 40) % 16) * u, line);
  }
  tree(ctx, w * 0.05, h * 0.47, 48 * u, line, sway);
  tree(ctx, w * 0.93, h * 0.46, 62 * u, line, -sway);
  if (w > 1000) {
    tree(ctx, w * 0.16, h * 0.48, 40 * u, line, sway);
    tree(ctx, w * 0.84, h * 0.49, 44 * u, line, -sway);
  }
  const petals = ["#ff5d8f", "#ffd000", "#b06bff", "#ff8a3d", "#5cc8ff"];
  const flowers = w > 1100 ? 16 : 8;
  for (let i = 0; i < flowers; i++) {
    const col = i % 2 === 0 ? 0.06 + (i % 5) * 0.025 : 0.82 + (i % 4) * 0.03;
    const fy = h * (0.52 + (i % 4) * 0.09);
    const fx = w * col;
    if (blocked(fx, fy, 16 * u, view)) continue;
    flower(ctx, fx, fy, (11 + (i % 3) * 3) * u, petals[i % petals.length], line);
  }
  for (let i = 0; i < (w > 1000 ? 8 : 4); i++) {
    const fx = w * (0.2 + i * 0.08);
    const fy = h * 0.42 + (i % 3) * 6 * u;
    if (blocked(fx, fy, 14 * u, view)) continue;
    flower(ctx, fx, fy, 12 * u, petals[i % petals.length], line);
  }
  const sideSpots = w > 1000 ? [0.04, 0.1, 0.17, 0.24, 0.76, 0.83, 0.9, 0.96] : [0.05, 0.12, 0.88, 0.95];
  sideSpots.forEach((fx, i) => {
    const x = w * fx;
    for (const fy of [0.62, 0.76, 0.9]) {
      const y = h * fy;
      if (view && x > view.playLeft - 40 && x < view.playRight + 40) continue;
      if (fy < 0.7) bush(ctx, x, y, (22 + (i % 3) * 6) * u, line);
      else flower(ctx, x, y, (12 + (i % 2) * 3) * u, petals[(i + Math.round(fy * 10)) % petals.length], line);
    }
  });
  const blades = w > 1000 ? 18 : 10;
  for (let i = 0; i < blades; i++) {
    const gx = (w * (i + 0.4)) / blades;
    const gy = h * (0.9 + (i % 3) * 0.025);
    if (view && gx > view.playLeft && gx < view.playRight) continue;
    baseTuft(ctx, gx, gy, (7 + (i % 3)) * u, sway + i);
  }
}

function ensureGarden(game, dpr, w, h, view) {
  const key = `${w}x${h}@${dpr}:${Math.round(view?.playLeft || 0)}:${Math.round(view?.playTop || 0)}:${game.pots.length}`;
  if (game.cacheKey === key) return;
  game.cacheKey = key;
  const pad = 48;
  const make = (part) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil((w + pad * 2) * dpr);
    canvas.height = Math.ceil(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, 0);
    drawPotsWorld(ctx, w, h, 0, false, view, part);
    return canvas;
  };
  game.farCache = make("far");
  game.midCache = make("mid");
  game.cachePad = pad;
}

function blitGarden(ctx, canvas, shift, w, h, dpr, pad) {
  const sx = (pad + shift) * dpr;
  ctx.drawImage(canvas, sx, 0, w * dpr, h * dpr, 0, 0, w * dpr, h * dpr);
}

function blocked(x, y, r, view) {
  if (!view) return false;
  const pad = 28;
  return x + r > view.playLeft - pad && x - r < view.playRight + pad && y + r > view.playTop - pad;
}

function cloud(ctx, x, y, s, line) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y + s * 0.12);
  ctx.bezierCurveTo(x - s * 0.78, y - s * 0.08, x - s * 0.42, y - s * 0.38, x - s * 0.16, y - s * 0.2);
  ctx.bezierCurveTo(x - s * 0.08, y - s * 0.5, x + s * 0.28, y - s * 0.46, x + s * 0.34, y - s * 0.16);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 0.28, x + s * 0.78, y + s * 0.08, x + s * 0.46, y + s * 0.16);
  ctx.quadraticCurveTo(x, y + s * 0.3, x - s * 0.55, y + s * 0.12);
  ctx.closePath();
  ctx.fillStyle = "#f4f7fb";
  ctx.fill();
  strokeInk(ctx, line);
}

function bush(ctx, x, y, s, line) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.7, y + s * 0.2);
  ctx.quadraticCurveTo(x - s * 0.85, y - s * 0.25, x - s * 0.35, y - s * 0.32);
  ctx.quadraticCurveTo(x - s * 0.1, y - s * 0.62, x + s * 0.2, y - s * 0.28);
  ctx.quadraticCurveTo(x + s * 0.7, y - s * 0.4, x + s * 0.72, y + s * 0.16);
  ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.38, x - s * 0.7, y + s * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#3cba4e";
  ctx.fill();
  strokeInk(ctx, Math.max(2.2, line));
}

function tree(ctx, x, y, s, line, sway) {
  ctx.save();
  ctx.translate(sway * 4, 0);
  ctx.fillStyle = "#c47a3a";
  ctx.beginPath();
  ctx.rect(x - s * 0.06, y - s * 0.02, s * 0.12, s * 0.42);
  ctx.fill();
  strokeInk(ctx, line);
  ctx.beginPath();
  ctx.arc(x, y - s * 0.28, s * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = "#2fae46";
  ctx.fill();
  strokeInk(ctx, line);
  ctx.restore();
}

function flower(ctx, x, y, s, color, line) {
  ctx.strokeStyle = "#1f7a32";
  ctx.lineWidth = Math.max(1.4, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.2);
  ctx.lineTo(x, y - s * 0.2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.3, line * 0.55);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * s * 0.28, y - s * 0.35 + Math.sin(a) * s * 0.28, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#ffe14a";
  ctx.beginPath();
  ctx.arc(x, y - s * 0.35, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function barn(ctx, x, y, s, line) {
  ctx.fillStyle = "#f2c07a";
  ctx.beginPath();
  ctx.rect(x - s * 0.7, y - s * 0.55, s * 1.4, s * 0.7);
  ctx.fill();
  strokeInk(ctx, line);
  ctx.fillStyle = "#e25b4a";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.9, y - s * 0.5);
  ctx.lineTo(x, y - s * 1.15);
  ctx.lineTo(x + s * 0.9, y - s * 0.5);
  ctx.closePath();
  ctx.fill();
  strokeInk(ctx, line);
  ctx.fillStyle = "#8aa0c0";
  ctx.fillRect(x - s * 0.16, y - s * 0.28, s * 0.32, s * 0.42);
  ctx.strokeRect(x - s * 0.16, y - s * 0.28, s * 0.32, s * 0.42);
}

function farFence(ctx, x, y, width, u) {
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "rgba(120, 150, 110, 0.7)";
  ctx.fillStyle = "rgba(255, 253, 248, 0.45)";
  ctx.lineWidth = Math.max(1, u * 0.8);
  const posts = 4;
  const ph = 8 * u;
  for (let i = 0; i < posts; i++) {
    const px = x + (width * i) / (posts - 1);
    ctx.fillRect(px, y, 2.2 * u, ph);
    ctx.strokeRect(px, y, 2.2 * u, ph);
  }
  ctx.beginPath();
  ctx.moveTo(x, y + ph * 0.35);
  ctx.lineTo(x + width, y + ph * 0.35);
  ctx.moveTo(x, y + ph * 0.7);
  ctx.lineTo(x + width, y + ph * 0.7);
  ctx.stroke();
  ctx.restore();
}

function drawPath(ctx, w, h, u, stopY, line) {
  const y2 = Math.min(h * 0.46, stopY);
  const x0 = w * 0.6;
  const y0 = h * 0.33;
  const x1 = w * 0.44;
  const y1 = h * 0.39;
  const x2 = w * 0.52;
  ctx.beginPath();
  ctx.moveTo(x0 - 8 * u, y0);
  ctx.quadraticCurveTo(x1 - 18 * u, y1, x2 - 10 * u, y2);
  ctx.lineTo(x2 + 16 * u, y2);
  ctx.quadraticCurveTo(x1 + 22 * u, y1, x0 + 14 * u, y0);
  ctx.closePath();
  ctx.fillStyle = "#f3d7a2";
  ctx.fill();
  strokeInk(ctx, Math.max(2, line));
}

function baseTuft(ctx, x, y, s, sway) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#1c7a34";
  ctx.lineWidth = Math.max(1.6, s * 0.16);
  ctx.lineCap = "round";
  for (const lean of [-0.7, -0.1, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.quadraticCurveTo(Math.sin(lean + sway) * s * 0.4, -s * 0.45, Math.sin(lean) * s, -s);
    ctx.stroke();
  }
  ctx.restore();
}

function butterfly(ctx, x, y, s, flap, color, line) {
  ctx.save();
  ctx.translate(x, y);
  const wing = 0.35 + Math.abs(flap) * 0.65;
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, line * 0.6);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * s * 0.38, -s * 0.05, s * 0.42, s * 0.28 * wing, side * -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = "#2e4168";
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.08, s * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function butterflySpot(i, w, h, time, calm, view) {
  const speed = calm ? 0.4 : 0.85;
  const t = time * speed + i * 2.3;
  const onLeft = i % 2 === 0 && i !== 2;
  const u = view?.u || Math.min(w / 844, h / 390);
  // shooting-stars-3 polish: right-hand butterflies fly below the sun's glow (sun at 0.8w, 0.14h,
  // glow radius 78u) so a pale wing never washes out against it.
  const sunClear = h * 0.14 + 78 * u + 22 * u * 0.8 + 6 * u;
  const top = onLeft ? Math.max(h * 0.18, 108) : Math.max(h * 0.18, 108, sunClear);
  const low = Math.max(top + 28, (view?.playTop || h * 0.45) - 18);
  const spanY = low - top;
  const leftBand = Math.max(36, (view?.playLeft || 140) - 36);
  const right = (view?.playRight || w * 0.7) + 28;
  const x = onLeft
    ? 28 + (Math.sin(t) * 0.5 + 0.5) * Math.max(20, leftBand - 36)
    : right + (Math.sin(t * 0.9) * 0.5 + 0.5) * Math.max(24, w - 24 - right);
  let y = top + (Math.sin(t * 0.75 + i) * 0.5 + 0.5) * spanY;
  if (x < 130 && y < 120) y = 120;
  return { x, y, flap: Math.sin(time * (calm ? 5 : 8) + i) };
}

export function drawPots(game, bg, fg, w, h, calm) {
  const u = game.view?.u || Math.min(w / 844, h / 390);
  const line = inkWidth(u);
  const ctx = fg.getContext("2d");
  const dpr = fg.__dpr || 1;
  const v = game.view;
  if (v) ensureGarden(game, dpr, w, h, v);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w * dpr, h * dpr);
  if (game.farCache) {
    const far = driftOf(game.time, calm, 0.12, 12);
    const mid = driftOf(game.time, calm, 0.2, 18);
    blitGarden(ctx, game.farCache, far, w, h, dpr, game.cachePad);
    blitGarden(ctx, game.midCache, mid, w, h, dpr, game.cachePad);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!v) return;
  for (const p of game.pots) drawPot(ctx, p, line, false);
  for (const t of game.toys) if (t.phase === "sink" && Number.isFinite(t.size)) drawToy(ctx, t.shape, t.x, t.y, t.size * t.scale, t.color, line, { noShadow: true, alpha: 1 - t.t });
  for (const p of game.pots) drawPot(ctx, p, line, true);
  const sway = Math.sin(game.time * (calm ? 1.2 : 2));
  for (const p of game.pots) {
    baseTuft(ctx, p.x - p.w * 0.22, p.base, 11 * u, sway);
    baseTuft(ctx, p.x + p.w * 0.18, p.base, 9 * u, -sway);
  }
  for (const t of game.toys) {
    if (t.phase === "gone" || t.phase === "sink" || t.phase === "drag" || !Number.isFinite(t.size)) continue;
    drawToy(ctx, t.shape, t.x, t.y, t.size, t.color, line, { lift: t.scale, wobble: t.wobble });
  }
  const bugs = w > 1100 ? 3 : 2;
  const colors = ["#ff5d8f", "#ffd000", "#7ec8ff"];
  for (let i = 0; i < bugs; i++) {
    const b = butterflySpot(i, w, h, game.time, calm, v);
    if (b.x > v.playLeft - 12 && b.x < v.playRight + 12 && b.y > v.playTop - 8) continue;
    // shooting-stars-3 polish: a wider keep-clear box around Pip (body, head and tuft) plus the
    // butterfly's own half-span, so a fly-by stays well off him.
    const bugHalf = 22 * u * 0.8;
    const clearX = v.pip * 0.75 + bugHalf + 14 * u;
    const clearTop = v.pipY - v.pip * 1.75 - bugHalf - 14 * u;
    if (Math.abs(b.x - v.pipX) < clearX && b.y > clearTop) continue;
    butterfly(ctx, b.x, b.y, 22 * u, b.flap, colors[i % colors.length], line);
  }
  drawPip(ctx, v.pipX, v.pipY, v.pip, "idle", game.time, calm);
  const held = game.toys.find((t) => t.phase === "drag");
  if (held && Number.isFinite(held.size)) drawToy(ctx, held.shape, held.x, held.y, held.size, held.color, line, { lift: held.scale });
  for (const s of game.sparkles) drawSparkle(ctx, s);
}

function drawPot(ctx, p, line, front) {
  const { x, base, w, h } = p;
  const col = paint(p.color);
  const top = base - h;
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(p.squash, 1 / p.squash);
  ctx.translate(-x, -base);
  if (!front) {
    ctx.save();
    ctx.fillStyle = "rgba(28, 42, 36, 0.34)";
    ctx.beginPath();
    ctx.ellipse(x, base, w * 0.46, Math.max(5, h * 0.075), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.4, base);
    ctx.quadraticCurveTo(x - w * 0.48, top + h * 0.55, x - w * 0.44, top + h * 0.32);
    ctx.lineTo(x + w * 0.44, top + h * 0.32);
    ctx.quadraticCurveTo(x + w * 0.48, top + h * 0.55, x + w * 0.4, base);
    ctx.closePath();
    ctx.fillStyle = col.base;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = col.light;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x - w * 0.5, top, w * 0.35, h);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - w * 0.4, base);
    ctx.quadraticCurveTo(x - w * 0.48, top + h * 0.55, x - w * 0.44, top + h * 0.32);
    ctx.lineTo(x + w * 0.44, top + h * 0.32);
    ctx.quadraticCurveTo(x + w * 0.48, top + h * 0.55, x + w * 0.4, base);
    ctx.closePath();
    fillStroke(ctx, null, line);
    drawFace(ctx, x, top + h * 0.62, w * 0.62, p.mood, 1);
    glossOval(ctx, x - w * 0.16, top + h * 0.42, w * 0.1, h * 0.08);
  } else {
    ctx.beginPath();
    ctx.ellipse(x, top + h * 0.28, w * 0.46, h * 0.14, 0, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(x, top, x, top + h * 0.4);
    g.addColorStop(0, "#5c7394");
    g.addColorStop(1, "#3e5478");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(7, w * 0.1);
    ctx.strokeStyle = col.base;
    ctx.stroke();
    ctx.lineWidth = line * 0.8;
    ctx.strokeStyle = "#2e4168";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, top + h * 0.34, w * 0.46, h * 0.12, 0, 0, Math.PI);
    ctx.fillStyle = col.dark;
    ctx.fill();
    ctx.strokeStyle = "#2e4168";
    ctx.lineWidth = line * 0.7;
    ctx.stroke();
  }
  ctx.restore();
}
