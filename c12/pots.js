/** Colour sorting: painted pots on a front-on mat. No two identical toys at once. */

import {
  LEVELS,
  SIG_SHAPE,
  inkWidth,
  levelForCount,
  mulberry32,
  sfx,
  shuffle,
} from "./util.js";
import { drawFace, drawGardenFar, drawGardenFront, drawGardenMid, drawPip, fillStroke, glossOval, shadow } from "./scenery.js";
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
  const n = game.toys.filter((t) => t.phase !== "gone").length || game.toys.length;
  const pots = game.pots.length;
  const gap = Math.max(12, 16 * u);
  const matW = Math.min(w * 0.72, Math.max(440 * u, w * 0.64));
  const matH = Math.min(h * 0.5, 210 * u);
  const matX = (w - matW) / 2 + 18 * u;
  const matY = h * 0.34;
  const floor = w >= 820 && h >= 370 ? 64 : 58;
  const want = Math.max(floor, 74 * u);
  const live = game.toys.filter((t) => t.phase !== "gone");
  const count = Math.max(1, live.length);
  const avail = matW - 36 * u;
  let toy = Math.min(want, (avail - (count - 1) * gap) / count);
  if (w >= 820 && h >= 370) toy = Math.max(64, toy);
  const rowW = count * toy + (count - 1) * gap;
  const toyY = matY + matH - 14 * u - toy / 2;
  const toyTop = toyY - toy / 2;
  let x = matX + (matW - rowW) / 2 + toy / 2;
  for (const t of live) {
    if (t.phase !== "drag" && t.phase !== "sink") {
      t.homeX = x;
      t.homeY = toyY;
      if (t.phase === "idle" || t.phase === "return") {
        if (t.phase === "idle") {
          t.x = t.homeX;
          t.y = t.homeY;
        }
      }
    } else {
      t.homeX = x;
      t.homeY = toyY;
    }
    t.size = toy;
    x += toy + gap;
  }
  const potGap = Math.max(12, 14 * u);
  let potW = Math.min(108 * u, (matW - 36 * u - (pots - 1) * potGap) / Math.max(1, pots));
  potW = Math.max(potW, toy * 0.95);
  const potH = Math.min(potW * 0.78, Math.max(48 * u, toyTop - matY - 28 * u));
  const potsW = pots * potW + (pots - 1) * potGap;
  let px = matX + (matW - potsW) / 2 + potW / 2;
  const potBase = toyTop - Math.max(20, 22 * u);
  for (const p of game.pots) {
    p.x = px;
    p.base = potBase;
    p.w = potW;
    p.h = potH;
    px += potW + potGap;
  }
  game.view = { u, w, h, matX, matY, matW, matH, toy, gap, pipX: Math.max(150, 140 * u), pipY: Math.min(h * 0.84, matY + matH - 6 * u), pip: 86 * u };
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
  burst(game.sparkles, game.view?.matX + game.view?.matW / 2 || 400, game.view?.matY || 200, "yellow", game.rng, 16);
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

export function drawPots(game, bg, fg, w, h, calm) {
  const u = game.view?.u || Math.min(w / 844, h / 390);
  const line = inkWidth(u);
  const ctx = fg.getContext("2d");
  ctx.setTransform(fg.__dpr, 0, 0, fg.__dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  drawGardenFar(ctx, w, h, game.time, calm);
  drawGardenMid(ctx, w, h, game.time, calm);
  const v = game.view;
  if (!v) return;
  for (const p of game.pots) drawPot(ctx, p, line, false);
  for (const t of game.toys) if (t.phase === "sink" && Number.isFinite(t.size)) drawToy(ctx, t.shape, t.x, t.y, t.size * t.scale, t.color, line, { noShadow: true, alpha: 1 - t.t });
  for (const p of game.pots) drawPot(ctx, p, line, true);
  for (const t of game.toys) {
    if (t.phase === "gone" || t.phase === "sink" || t.phase === "drag" || !Number.isFinite(t.size)) continue;
    drawToy(ctx, t.shape, t.x, t.y, t.size, t.color, line, { lift: t.scale, wobble: t.wobble });
  }
  drawPip(ctx, v.pipX, v.pipY, v.pip, "idle", game.time, calm);
  const held = game.toys.find((t) => t.phase === "drag");
  if (held && Number.isFinite(held.size)) drawToy(ctx, held.shape, held.x, held.y, held.size, held.color, line, { lift: held.scale });
  drawGardenFront(ctx, w, h, game.time, calm);
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
    shadow(ctx, x, base + 4, w * 0.42, h * 0.08);
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
