/** Shape box: front-on toy box, holes that match their toys, glass window on the front. */

import { inkWidth, mulberry32, sfx, shuffle } from "./util.js";
import { drawFace, drawMeadow, drawPip, drawStump, fillStroke, glossOval, shadow, traceRoundRect } from "./scenery.js";
import { burst, drawHole, drawSparkle, drawToy, holeOuter, stepSparkles } from "./shapes.js";

const SETS = {
  2: [
    ["ball", "star"],
    ["heart", "pyramid"],
    ["block", "ring"],
  ],
  3: [
    ["ball", "star", "heart"],
    ["block", "pyramid", "star"],
    ["heart", "ring", "block"],
  ],
  4: [
    ["ball", "block", "star", "heart"],
    ["pyramid", "star", "ring", "block"],
    ["heart", "ball", "pyramid", "star"],
  ],
};

const CANON = {
  ball: "red",
  block: "yellow",
  star: "green",
  heart: "purple",
  pyramid: "blue",
  ring: "orange",
  coin: "pink",
  button: "orange",
};

const RAINBOW = ["red", "blue", "yellow", "green", "orange", "purple", "pink"];

export function createBox(Q) {
  const seed = Number(new URLSearchParams(location.search).get("seed")) || 4;
  const holes = Q.shapeHoleCount === 3 || Q.shapeHoleCount === 4 ? Q.shapeHoleCount : 2;
  const mix = Q.shapeMix === 0.5 || Q.shapeMix === 1 ? Q.shapeMix : 0;
  const rng = mulberry32((seed * 89 + holes * 5) >>> 0);
  const game = {
    kind: "box",
    holesN: holes,
    mix,
    rng,
    time: 0,
    round: 0,
    shapes: [],
    colors: [],
    toys: [],
    pile: [],
    holes: [],
    sparkles: [],
    drag: null,
    mood: "idle",
    moodT: 0,
    bgKey: "",
    cheer: false,
  };
  dealRound(game);
  return game;
}

function dealRound(game) {
  const sets = SETS[game.holesN];
  game.shapes = sets[game.round % sets.length].slice();
  game.colors = colorsFor(game.shapes, game.mix, game.rng);
  game.toys = game.shapes.map((shape, i) => ({
    id: game.round * 10 + i,
    shape,
    color: game.colors[i],
    phase: "idle",
    t: 0,
    scale: 1,
    wobble: 0,
  }));
  game.pile = [];
  game.cheer = false;
}

function colorsFor(shapes, mix, rng) {
  if (mix === 0) return shapes.map((shape) => CANON[shape]);
  if (mix === 1) {
    const bag = shuffle(RAINBOW, rng);
    return shapes.map((_, i) => bag[i % bag.length]);
  }
  return shapes.map((shape, i) => (i % 2 ? RAINBOW[(RAINBOW.indexOf(CANON[shape]) + 3) % RAINBOW.length] : CANON[shape]));
}

export function layoutBox(game, w, h) {
  const u = Math.min(w / 844, h / 390);
  const line = inkWidth(u);
  const n = game.shapes.length;
  const boxW = Math.min(w * 0.66, 560 * u);
  const lidH = Math.min(h * 0.3, 124 * u);
  const frontH = Math.min(h * 0.28, 116 * u);
  const boxX = (w - boxW) / 2 + 24 * u;
  const boxY = Math.max(18 * u, h * 0.07);
  const pad = 4 + line;
  const gap = Math.max(12, 14 * u);
  const innerW = boxW - pad * 2;
  const innerH = lidH - pad * 2;
  let opening = Math.min(innerH, (innerW - (n - 1) * gap) / n) * 0.72;
  for (let i = 0; i < 8; i++) {
    const outer = holeOuter(opening, line) * 2;
    const row = n * outer + (n - 1) * gap;
    const margin = (boxW - row) / 2;
    const vMargin = (lidH - outer) / 2;
    if (margin >= pad && vMargin >= pad) break;
    opening *= 0.94;
  }
  const outer = holeOuter(opening, line) * 2;
  const row = n * outer + (n - 1) * gap;
  let cx = boxX + (boxW - row) / 2 + outer / 2;
  const cy = boxY + lidH / 2;
  game.holes = game.shapes.map((shape, i) => {
    const hole = {
      shape,
      color: CANON[shape],
      toyColor: game.colors[i],
      cx,
      cy,
      opening,
      outerR: holeOuter(opening, line),
      i,
    };
    cx += outer + gap;
    return hole;
  });
  const toy = opening * 0.82;
  const trayGap = Math.max(12, 16 * u);
  const trayPad = 16 * u;
  const trayW = Math.max(row + trayPad * 2, n * toy + (n - 1) * trayGap + trayPad * 2);
  const trayH = toy + 26 * u;
  const trayX = boxX + (boxW - trayW) / 2;
  const trayY = boxY + lidH + frontH + 10 * u;
  const live = game.toys.filter((t) => t.phase !== "in");
  const toysW = live.length * toy + Math.max(0, live.length - 1) * trayGap;
  let tx = trayX + (trayW - toysW) / 2 + toy / 2;
  const ty = trayY + trayH - 12 * u - toy / 2;
  for (const t of live) {
    t.homeX = tx;
    t.homeY = ty;
    t.size = toy;
    if (t.phase === "idle") {
      t.x = t.homeX;
      t.y = t.homeY;
    }
    tx += toy + trayGap;
  }
  const winR = Math.max(toy * 0.62, Math.min(frontH * 0.42, toy * 0.9));
  const win = {
    x: boxX + boxW * 0.72,
    y: boxY + lidH + frontH * 0.52,
    r: winR,
  };
  const posted = toy * 0.78;
  game.view = {
    u, line, boxX, boxY, boxW, lidH, frontH, trayX, trayY, trayW, trayH, toy, posted, opening, gap, trayGap, win,
    stumpX: Math.max(86 * u, boxX - 78 * u),
    stumpY: boxY + lidH + frontH * 0.55,
    stump: 54 * u,
    pip: 70 * u,
  };
  let minClear = Infinity;
  for (const hole of game.holes) {
    const c = Math.min(
      hole.cx - hole.outerR - boxX,
      boxX + boxW - (hole.cx + hole.outerR),
      hole.cy - hole.outerR - boxY,
      boxY + lidH - (hole.cy + hole.outerR),
    );
    hole.clearance = c;
    if (c < minClear) minClear = c;
  }
  game.metrics = {
    opening,
    toy,
    ratio: toy / opening,
    postedRatio: posted / toy,
    gap: trayGap,
    clearance: minClear,
    shapes: game.shapes.slice(),
    holes: game.holes.map((hole) => ({ shape: hole.shape, clearance: hole.clearance, cx: hole.cx, cy: hole.cy, outerR: hole.outerR })),
    lid: { x: boxX, y: boxY, w: boxW, h: lidH },
  };
}

export function stepBox(game, dt, w, h) {
  game.time += dt;
  layoutBox(game, w, h);
  if (game.moodT > 0) {
    game.moodT -= dt;
    if (game.moodT <= 0) game.mood = "idle";
  }
  for (const t of game.toys) {
    if (t.phase === "drag" && game.drag) {
      t.x = game.drag.x;
      t.y = game.drag.y;
      t.scale += (1.08 - t.scale) * Math.min(1, dt * 18);
    } else if (t.phase === "return") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.32);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.homeX - t.fromX) * e;
      t.y = t.fromY + (t.homeY - t.fromY) * e;
      t.wobble = Math.sin(k * Math.PI * 2) * 0.15 * (1 - k);
      if (k >= 1) {
        t.phase = "idle";
        t.x = t.homeX;
        t.y = t.homeY;
        t.scale = 1;
      }
    } else if (t.phase === "post") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.34);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.toX - t.fromX) * e;
      t.y = t.fromY + (t.toY - t.fromY) * e;
      t.scale = 1 - k * 0.4;
      if (k >= 1 && !t.posted) {
        t.posted = true;
        t.phase = "in";
        sfx("clunk", t.shape, t.color, false);
        game.pile.push({ shape: t.shape, color: t.color });
        burst(game.sparkles, t.toX, t.toY, t.color, game.rng, 8);
        if (game.toys.every((toy) => toy.phase === "in" || toy.posted)) finishRound(game);
      }
    }
  }
  stepSparkles(game.sparkles, dt);
}

function finishRound(game) {
  if (game.cheer) return;
  game.cheer = true;
  game.mood = "joy";
  game.moodT = 1.1;
  sfx("boxCheer", game.colors, false);
  const v = game.view;
  if (v) burst(game.sparkles, v.boxX + v.boxW / 2, v.boxY + v.lidH, "yellow", game.rng, 18);
  game.round += 1;
  window.setTimeout(() => {
    dealRound(game);
  }, 700);
}

function hitToy(game, x, y) {
  for (let i = game.toys.length - 1; i >= 0; i--) {
    const t = game.toys[i];
    if (t.phase !== "idle" && t.phase !== "return") continue;
    if (!t.size) continue;
    if (Math.abs(x - t.x) <= t.size * 0.55 && Math.abs(y - t.y) <= t.size * 0.55) return t;
  }
  return null;
}

function hitHole(game, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const hole of game.holes) {
    const d = Math.hypot(x - hole.cx, y - hole.cy);
    if (d < hole.outerR && d < bestD) {
      best = hole;
      bestD = d;
    }
  }
  return best;
}

export function boxPointerDown(game, x, y, w, h) {
  layoutBox(game, w, h);
  const t = hitToy(game, x, y);
  if (!t) return false;
  t.phase = "drag";
  t.scale = 1.08;
  game.drag = { id: t.id, x, y };
  sfx("liftWhoosh");
  return true;
}

export function boxPointerMove(game, x, y) {
  if (game.drag) {
    game.drag.x = x;
    game.drag.y = y;
  }
}

export function boxPointerUp(game, w, h) {
  if (!game.drag) return;
  layoutBox(game, w, h);
  const t = game.toys.find((toy) => toy.id === game.drag.id);
  game.drag = null;
  if (!t || t.phase !== "drag") return;
  const hole = hitHole(game, t.x, t.y);
  if (hole && hole.shape === t.shape && !game.pile.some((p) => p.shape === t.shape)) {
    t.phase = "post";
    t.t = 0;
    t.posted = false;
    t.fromX = t.x;
    t.fromY = t.y;
    t.toX = hole.cx;
    t.toY = hole.cy;
    sfx("slide");
    return;
  }
  if (hole) {
    game.mood = "oh";
    game.moodT = 0.6;
    sfx("softBonk");
  }
  t.phase = "return";
  t.t = 0;
  t.fromX = t.x;
  t.fromY = t.y;
  t.scale = 1;
}

export function drawBox(game, bg, fg, w, h, calm) {
  const v = game.view;
  if (!v) return;
  const { line } = v;
  if (game.bgKey !== `${w}x${h}`) {
    const bctx = bg.getContext("2d");
    bctx.setTransform(fg.__dpr, 0, 0, fg.__dpr, 0, 0);
    drawMeadow(bctx, w, h);
    game.bgKey = `${w}x${h}`;
  }
  const ctx = fg.getContext("2d");
  ctx.setTransform(fg.__dpr, 0, 0, fg.__dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  drawStump(ctx, v.stumpX, v.stumpY, v.stump);
  drawPip(ctx, v.stumpX, v.stumpY - v.stump * 0.78, v.pip, game.mood, game.time, calm);
  drawBoxBody(ctx, v, game, line);
  for (const hole of game.holes) drawHole(ctx, hole.shape, hole.cx, hole.cy, hole.opening, hole.color, line);
  drawWindow(ctx, v, game, line);
  drawTray(ctx, v, line);
  for (const t of game.toys) {
    if (t.phase === "in" || t.phase === "drag" || t.phase === "post") continue;
    drawToy(ctx, t.shape, t.x, t.y, t.size, t.color, line, { lift: t.scale, wobble: t.wobble });
  }
  for (const t of game.toys) if (t.phase === "post") drawToy(ctx, t.shape, t.x, t.y, t.size * t.scale, t.color, line, { noShadow: true });
  const held = game.toys.find((t) => t.phase === "drag");
  if (held) drawToy(ctx, held.shape, held.x, held.y, held.size, held.color, line, { lift: held.scale });
  for (const s of game.sparkles) drawSparkle(ctx, s);
}

function drawBoxBody(ctx, v, game, line) {
  const { boxX, boxY, boxW, lidH, frontH } = v;
  const h = lidH + frontH;
  shadow(ctx, boxX + boxW / 2, boxY + h + 6, boxW * 0.46, 12);
  traceRoundRect(ctx, boxX, boxY, boxW, h, 22);
  const wood = ctx.createLinearGradient(boxX, boxY, boxX, boxY + h);
  wood.addColorStop(0, "#f2c07a");
  wood.addColorStop(0.42, "#e8a25a");
  wood.addColorStop(1, "#d4893e");
  ctx.fillStyle = wood;
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = "rgba(255, 236, 196, 0.55)";
  ctx.fillRect(boxX + line, boxY + line, boxW - line * 2, lidH - line);
  ctx.strokeStyle = "#2e4168";
  ctx.lineWidth = line * 0.7;
  ctx.beginPath();
  ctx.moveTo(boxX + 8, boxY + lidH);
  ctx.lineTo(boxX + boxW - 8, boxY + lidH);
  ctx.stroke();
  drawFace(ctx, boxX + boxW * 0.32, boxY + lidH + frontH * 0.48, Math.min(boxW, frontH) * 0.7, game.mood, 1);
}

function drawWindow(ctx, v, game, line) {
  const { win, posted } = v;
  ctx.save();
  ctx.beginPath();
  ctx.arc(win.x, win.y, win.r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#e8c48a";
  ctx.fillRect(win.x - win.r, win.y - win.r, win.r * 2, win.r * 2);
  const n = game.pile.length;
  game.pile.forEach((toy, i) => {
    const spread = Math.min(win.r * 0.7, posted * 0.45);
    const x = win.x + (n <= 1 ? 0 : ((i / Math.max(1, n - 1)) - 0.5) * spread * 2);
    const y = win.y + win.r * 0.35 - posted / 2 - (n - 1 - i) * posted * 0.18;
    drawToy(ctx, toy.shape, x, y, posted, toy.color, line * 0.8, { noShadow: false });
  });
  const glass = ctx.createLinearGradient(win.x, win.y - win.r, win.x, win.y + win.r);
  glass.addColorStop(0, "rgba(186, 230, 255, 0.55)");
  glass.addColorStop(0.4, "rgba(255,255,255,0.2)");
  glass.addColorStop(1, "rgba(90, 170, 210, 0.28)");
  ctx.fillStyle = glass;
  ctx.fillRect(win.x - win.r, win.y - win.r, win.r * 2, win.r * 2);
  glossOval(ctx, win.x - win.r * 0.28, win.y - win.r * 0.32, win.r * 0.28, win.r * 0.14, -0.6);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(win.x, win.y, win.r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(5, line * 1.3);
  ctx.strokeStyle = "#f7f2e6";
  ctx.stroke();
  ctx.lineWidth = line;
  ctx.strokeStyle = "#2e4168";
  ctx.stroke();
}

function drawTray(ctx, v, line) {
  const { trayX, trayY, trayW, trayH } = v;
  shadow(ctx, trayX + trayW / 2, trayY + trayH + 3, trayW * 0.42, 8);
  traceRoundRect(ctx, trayX, trayY, trayW, trayH, 16);
  ctx.fillStyle = "#f6e7c4";
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = "#e7d3a4";
  traceRoundRect(ctx, trayX + 8, trayY + trayH - 12, trayW - 16, 8, 4);
  ctx.fill();
}
