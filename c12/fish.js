/** Fish Nets: drag a fish into the hoop of its colour. The hoop is one spring, not a mesh. */

import {
  clamp,
  fishColors,
  inkWidth,
  makeSpring,
  mulberry32,
  sfx,
  shuffle,
  stepSpring,
} from "./util.js";
import { drawBubbles, drawCaustics, drawKelp, drawSea, drawSeaFar, drawSeaFront } from "./scenery.js";
import { drawFish, drawNet, drawSplashes, fishBox, netClip, splashBurst } from "./fishart.js";
import { drawSparkle, stepSparkles } from "./shapes.js";

const SPECIES = ["clown", "tang", "puffer", "angel", "gold", "flat"];

export function createFish(Q) {
  const seed = Number(new URLSearchParams(location.search).get("seed")) || 7;
  const rng = mulberry32((seed * 997 + (Q.fishPalette || 0) * 13 + (Q.fishCount || 2)) >>> 0);
  const count = Q.fishCount === 3 ? 3 : 2;
  const colors = fishColors(count, Q.fishPalette || 0);
  const species = shuffle(SPECIES, rng).slice(0, count);
  const game = {
    kind: "fish",
    count,
    colors,
    species,
    pattern: Q.paletteMode === "cb",
    rng,
    time: 0,
    round: 0,
    fish: [],
    nets: [],
    bubbles: [],
    splashes: [],
    sparkles: [],
    drag: null,
    bg: null,
    layoutKey: "",
  };
  return game;
}

function boxesOverlap(a, b, gap) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;
}

function layoutSignature(fish, nets) {
  const bin = (v) => Math.round(v / 40);
  const fishKey = fish.map((f) => `${bin(f.homeX)}:${bin(f.homeY)}`).sort().join(",");
  const netKey = nets.map((n) => `${bin(n.x)}:${bin(n.y)}`).sort().join(",");
  return `${fishKey}|${netKey}`;
}

function assignSpots(game, w, h, u) {
  const count = game.count;
  const btn = h < 520 ? 72 : 88;
  const len = (count === 3 ? 104 : 126) * Math.max(0.84, Math.min(u, 1.2));
  for (let attempt = 0; attempt < 80; attempt++) {
    const fishPos = [];
    const netPos = [];
    let ok = true;
    for (let i = 0; i < count; i++) {
      const species = game.fish[i]?.species || game.species[i];
      const box = fishBox(species, len);
      let spot = null;
      for (let t = 0; t < 40 && !spot; t++) {
        const x = 46 * u + game.rng() * Math.max(40, w * 0.34);
        const y = 58 * u + game.rng() * Math.max(40, h * 0.55);
        const rect = { x, y, w: box.w, h: box.h };
        if (fishPos.every((p) => !boxesOverlap(rect, p, 22))) spot = { x, y, box };
      }
      if (!spot) {
        ok = false;
        break;
      }
      fishPos.push(spot);
      const R = 46 * Math.max(u, 0.86);
      let net = null;
      for (let t = 0; t < 40 && !net; t++) {
        const x = w * 0.46 + game.rng() * w * 0.34;
        const y = 48 * u + game.rng() * h * 0.36;
        const rect = { x, y, w: R * 2.4, h: R * 3.3 };
        const underHome = x > w - btn - 24 && y > h - btn - 24;
        if (!underHome && netPos.every((p) => !boxesOverlap(rect, { x: p.x, y: p.y, w: p.R * 2.4, h: p.R * 3.3 }, 8))) {
          net = { x, y, R };
        }
      }
      if (!net) {
        ok = false;
        break;
      }
      netPos.push(net);
    }
    if (!ok) continue;
    const previewFish = fishPos.map((p) => ({ homeX: p.x, homeY: p.y }));
    const key = layoutSignature(previewFish, netPos);
    if (key === game.lastLayout && (game.layoutRun || 0) >= 3) continue;
    fishPos.forEach((p, i) => {
      const f = game.fish[i];
      if (!f) return;
      f.len = len;
      f.box = p.box;
      f.homeX = p.x;
      f.homeY = p.y;
      if (f.phase === "home") {
        f.x = p.x;
        f.y = p.y;
      }
    });
    netPos.forEach((p, i) => {
      const n = game.nets[i];
      if (!n) return;
      n.x = p.x;
      n.y = p.y;
      n.R = p.R;
    });
    game.layoutRun = key === game.lastLayout ? (game.layoutRun || 0) + 1 : 1;
    game.lastLayout = key;
    return;
  }
}

function place(game, w, h, u) {
  const count = game.count;
  game.fish = [];
  game.nets = [];
  for (let i = 0; i < count; i++) {
    const len = 120 * Math.max(u, 0.9);
    const box = fishBox(game.species[i], len);
    game.fish.push({
      id: i,
      color: game.colors[i],
      species: game.species[i],
      len,
      box,
      homeX: w * 0.2,
      homeY: h * (0.3 + i * 0.2),
      x: -len,
      y: h * (0.3 + i * 0.2),
      phase: "arrive",
      t: 0,
      tail: 0,
      blink: 1,
      blinkIn: 1.2 + game.rng() * 2.4,
      mood: "idle",
      moodT: 0,
      scale: 1,
      facing: 1,
      slot: i,
    });
    const R = 50 * Math.max(u, 0.88);
    game.nets.push({
      id: i,
      color: game.colors[i],
      x: w * (0.55 + i * 0.12),
      y: h * (0.28 + (i % 2) * 0.18),
      R,
      kx: makeSpring(1),
      ky: makeSpring(1),
      bulge: makeSpring(0),
      sway: game.rng() * 6,
    });
  }
  game.bubbles = [];
  for (let i = 0; i < 12; i++) {
    game.bubbles.push({
      x: game.rng() * w,
      y: game.rng() * h * 0.75,
      r: 5 + game.rng() * 9,
      s: 18 + game.rng() * 28,
    });
  }
  assignSpots(game, w, h, u);
  game.layoutKey = `${Math.round(w)}x${Math.round(h)}`;
  game.metrics = measure(game);
}

function measure(game) {
  return {
    fish: game.fish.map((f) => ({ id: f.id, color: f.color, species: f.species, w: f.box.w, h: f.box.h })),
    nets: game.nets.map((n) => ({ id: n.id, color: n.color, x: n.x, y: n.y, R: n.R })),
    layoutRun: game.layoutRun || 0,
  };
}

function relayout(game, w, h, u) {
  const key = `${Math.round(w)}x${Math.round(h)}`;
  if (game.layoutKey === key) return;
  const prev = game.fish.map((f) => ({ ...f }));
  const nets = game.nets.map((n) => ({ color: n.color }));
  place(game, w, h, u);
  game.fish.forEach((f, i) => {
    const old = prev[i];
    if (!old) return;
    f.phase = old.phase === "arrive" ? "home" : old.phase;
    f.x = f.phase === "drag" ? old.x : f.homeX;
    f.y = f.phase === "drag" ? old.y : f.homeY;
    f.t = old.t;
    f.color = old.color;
    f.species = old.species;
  });
  game.nets.forEach((n, i) => {
    if (nets[i]) n.color = nets[i].color;
  });
}

export function stepFish(game, dt, w, h, calm) {
  const u = Math.min(w / 844, h / 390);
  game.w = w;
  game.h = h;
  game.u = u;
  game.reshuffle = () => assignSpots(game, w, h, u);
  if (!game.fish.length) place(game, w, h, u);
  else relayout(game, w, h, u);
  game.time += dt;
  const dragFish = game.drag ? game.fish.find((f) => f.id === game.drag.id) : null;

  for (const b of game.bubbles) {
    b.y -= b.s * dt * (calm ? 0.45 : 1);
    b.x += Math.sin(game.time * 1.4 + b.r) * 8 * dt;
    if (b.y < -20) {
      b.y = h * 0.76;
      b.x = game.rng() * w;
    }
  }

  for (const f of game.fish) {
    f.tail = Math.sin(game.time * (f.phase === "drag" ? 14 : 7) + f.id) * (f.phase === "drag" ? 0.45 : 0.32);
    f.blinkIn -= dt;
    if (f.blinkIn < 0) {
      f.blink = f.blinkIn > -0.12 ? 0.12 : 1;
      if (f.blinkIn < -0.12) f.blinkIn = 2.2 + game.rng() * 2.6;
    } else f.blink = 1;
    if (f.moodT > 0) {
      f.moodT -= dt;
      if (f.moodT <= 0) f.mood = "idle";
    }
    const net = game.nets[f.slot];
    if (f.phase === "home") {
      f.dart = (f.dart ?? 1.2 + f.id) - dt;
      if (f.dart <= 0) {
        f.dart = 1.8 + game.rng() * 2.4;
        f.dash = calm ? 0 : 0.32;
        f.facing = game.rng() > 0.5 ? 1 : -1;
      }
      if ((f.dash || 0) > 0) {
        f.dash -= dt;
        f.x += f.facing * 110 * dt;
      }
      f.x += (f.homeX - f.x) * Math.min(1, dt * 2.4);
      f.y += (f.homeY + Math.sin(game.time * 1.6 + f.id) * 4 - f.y) * Math.min(1, dt * 4);
      for (const other of game.fish) {
        if (other === f || other.phase === "drag" || other.phase === "catch") continue;
        const dx = f.x - other.x;
        const dy = f.y - other.y;
        const needX = (f.box.w + other.box.w) / 2 + 8;
        const needY = (f.box.h + other.box.h) / 2 + 8;
        if (Math.abs(dx) < needX && Math.abs(dy) < needY) {
          f.x += Math.sign(dx || 1) * 40 * dt;
          f.y += Math.sign(dy || 1) * 40 * dt;
        }
      }
      f.scale += (1 - f.scale) * Math.min(1, dt * 10);
    } else if (f.phase === "arrive") {
      f.t += dt;
      const k = Math.min(1, f.t / 0.85);
      const e = 1 - (1 - k) ** 3;
      f.x = -f.len + (f.homeX + f.len) * e;
      f.y = f.homeY + Math.sin(k * Math.PI * 2) * 10;
      f.scale = 1;
      if (k >= 1) {
        f.phase = "home";
        f.x = f.homeX;
        f.y = f.homeY;
      }
    } else if (f.phase === "drag") {
      f.scale += (1.08 - f.scale) * Math.min(1, dt * 18);
      f.x = game.drag.x;
      f.y = game.drag.y;
      const hit = nearestNet(game, f.x, f.y);
      if (hit && hit.color === f.color) {
        const pull = 1 - Math.hypot(f.x - hit.x, f.y - hit.y) / (hit.R * 1.4);
        if (pull > 0) {
          f.x += (hit.x - f.x) * pull * dt * 3;
          f.y += (hit.y - f.y) * pull * dt * 3;
        }
      }
    } else if (f.phase === "return") {
      f.t += dt;
      const k = Math.min(1, f.t / 0.45);
      const e = 1 - (1 - k) ** 3;
      f.x = f.fromX + (f.homeX - f.fromX) * e;
      f.y = f.fromY + (f.homeY - f.fromY) * e + Math.sin(k * Math.PI) * 16;
      f.scale += (1 - f.scale) * Math.min(1, dt * 8);
      if (k >= 1) {
        f.phase = "home";
        f.x = f.homeX;
        f.y = f.homeY;
      }
    } else if (f.phase === "catch") {
      f.t += dt;
      const hop = 0.26;
      if (f.t < hop) {
        const k = f.t / hop;
        const e = k * k * (3 - 2 * k);
        f.x = f.fromX + (net.x - f.fromX) * e;
        f.y = f.fromY + (net.y - f.fromY) * e;
        f.scale = 1;
      } else {
        const k = Math.min(1, (f.t - hop) / 0.55);
        f.x = net.x;
        f.y = net.y + k * net.R * 1.85;
        f.scale = 1 - k * 0.15;
        if (!f.splashed) {
          f.splashed = true;
          sfx("netSplash");
          sfx("swimIn", f.color);
          splashBurst(game.splashes, net.x, net.y, game.rng);
        }
        if (k >= 1) finishCatch(game, f);
      }
    }
  }

  for (const net of game.nets) {
    const fish = game.fish.find((f) => f.slot === net.id && f.phase === "catch" && f.t < 0.26);
    let tx = 1;
    let ty = 1;
    let tb = 0;
    if (fish) {
      const need = stretchFor(fish, net.R);
      tx = need.x;
      ty = need.y;
    }
    const bagFish = game.fish.find((f) => f.slot === net.id && f.phase === "catch" && f.t >= 0.26);
    if (bagFish) tb = 1.8;
    stepSpring(net.kx, tx, dt);
    stepSpring(net.ky, ty, dt);
    stepSpring(net.bulge, tb, dt, 10, 0.6);
    net.kx.v = clamp(net.kx.v, 0.72, 2.6);
    net.ky.v = clamp(net.ky.v, 0.72, 2.6);
  }

  for (const p of game.splashes) {
    p.life -= dt * (p.ring ? 1.6 : 1.3);
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    if (!p.ring) p.vy += 40 * dt;
  }
  for (let i = game.splashes.length - 1; i >= 0; i--) if (game.splashes[i].life <= 0) game.splashes.splice(i, 1);
  stepSparkles(game.sparkles, dt);
  game.metrics = measure(game);
}

function stretchFor(fish, R) {
  const halfW = fish.box.w * 0.5;
  const halfH = fish.box.h * 0.5;
  const pad = 8;
  const x = clamp(Math.max(1.45, (halfW * 1.25 + pad) / (R * 0.82)), 1.45, 2.6);
  const y = clamp(Math.max(1.35, (halfH * 1.25 + pad) / (R * 0.82)), 1.35, 2.6);
  return { x, y };
}

function finishCatch(game, fish) {
  fish.phase = "arrive";
  fish.t = 0;
  fish.splashed = false;
  fish.mood = "joy";
  fish.moodT = 0.6;
  const si = (SPECIES.indexOf(fish.species) + 1 + Math.floor(game.rng() * 4)) % SPECIES.length;
  let species = SPECIES[si];
  if (game.fish.some((other) => other !== fish && other.species === species)) {
    species = SPECIES.find((name) => game.fish.every((other) => other === fish || other.species !== name)) || species;
  }
  fish.species = species;
  fish.box = fishBox(fish.species, fish.len);
  fish.x = -fish.len;
  sfx("arriveChime", fish.color);
  game.round += 1;
  if (game.w) assignSpots(game, game.w, game.h, game.u);
  fish.y = fish.homeY;
}

function nearestNet(game, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const n of game.nets) {
    const d = Math.hypot(x - n.x, y - n.y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

function hitFish(game, x, y) {
  let best = null;
  let bestD = Infinity;
  let bestI = -1;
  game.fish.forEach((f, i) => {
    if (f.phase !== "home" && f.phase !== "arrive") return;
    if (f.phase === "arrive" && f.t < 0.35) return;
    if (Math.abs(x - f.x) > f.box.w * 0.5 || Math.abs(y - f.y) > f.box.h * 0.55) return;
    const d = Math.hypot(x - f.x, y - f.y);
    if (d < bestD - 1 || (Math.abs(d - bestD) <= 1 && i > bestI)) {
      best = f;
      bestD = d;
      bestI = i;
    }
  });
  return best;
}

export function fishPointerDown(game, x, y) {
  const f = hitFish(game, x, y);
  if (!f) return false;
  f.phase = "drag";
  f.scale = 1.08;
  f.mood = "idle";
  game.drag = { id: f.id, x, y };
  sfx("liftWhoosh");
  return true;
}

export function fishPointerMove(game, x, y) {
  if (!game.drag) return;
  game.drag.x = x;
  game.drag.y = y;
}

export function fishPointerUp(game) {
  if (!game.drag) return;
  const finger = game.drag;
  const f = game.fish.find((fish) => fish.id === finger.id);
  game.drag = null;
  if (!f || f.phase !== "drag") return;
  f.x = finger.x;
  f.y = finger.y;
  const net = nearestNet(game, finger.x, finger.y);
  const reach = net ? Math.max(net.R * 1.35, 64) : 0;
  if (net && Math.hypot(finger.x - net.x, finger.y - net.y) <= reach) {
    if (net.color === f.color) {
      f.phase = "catch";
      f.t = 0;
      f.fromX = f.x;
      f.fromY = f.y;
      f.slot = net.id;
      f.splashed = false;
      return;
    }
    f.mood = "oh";
    f.moodT = 0.7;
    f.phase = "return";
    f.t = 0;
    f.fromX = f.x;
    f.fromY = f.y;
    sfx("softReturn");
    return;
  }
  f.phase = "return";
  f.t = 0;
  f.fromX = f.x;
  f.fromY = f.y;
  sfx("playfulMiss");
}

export function drawFishGame(game, bg, fg, w, h, calm) {
  const u = Math.min(w / 844, h / 390);
  const line = inkWidth(u);
  if (game.bgKey !== `${w}x${h}`) {
    bg.width = fg.width;
    bg.height = fg.height;
    const bctx = bg.getContext("2d");
    bctx.setTransform(fg.__dpr, 0, 0, fg.__dpr, 0, 0);
    drawSea(bctx, w, h);
    game.bgKey = `${w}x${h}`;
  }
  const ctx = fg.getContext("2d");
  ctx.setTransform(fg.__dpr, 0, 0, fg.__dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  drawSeaFar(ctx, w, h, game.time, calm);
  drawCaustics(ctx, w, h, game.time);
  const behind = game.fish.filter((f) => f.phase !== "drag" && f.y < h * 0.42);
  for (const f of behind) if (!(f.phase === "catch" && f.t >= 0.26)) paintFish(ctx, f, line, game.pattern);
  drawKelp(ctx, w, h, game.time, calm);
  drawBubbles(ctx, game.bubbles, u);

  const order = game.fish.filter((f) => f.phase !== "drag" && f.y >= h * 0.42);
  for (const net of game.nets) {
    drawNet(ctx, net.x, net.y, net.R, net.kx.v, net.ky.v, net.bulge.v, net.color, line, Math.sin(game.time * 1.2 + net.sway) * 0.04);
    const inside = game.fish.filter((f) => f.slot === net.id && f.phase === "catch" && f.t >= 0.26);
    if (inside.length) {
      ctx.save();
      ctx.translate(net.x, net.y);
      ctx.rotate(Math.sin(game.time * 1.2 + net.sway) * 0.04);
      netClip(ctx, net.R, net.kx.v, net.ky.v, net.bulge.v);
      ctx.translate(-net.x, -net.y);
      for (const f of inside) paintFish(ctx, f, line, game.pattern);
      ctx.restore();
    }
  }
  for (const f of order) if (!(f.phase === "catch" && f.t >= 0.26)) paintFish(ctx, f, line, game.pattern);
  const held = game.fish.find((f) => f.phase === "drag");
  if (held) {
    held.facing = 1;
    paintFish(ctx, held, line, game.pattern);
  }
  drawSeaFront(ctx, w, h, game.time, calm);
  drawSplashes(ctx, game.splashes, u);
  for (const s of game.sparkles) drawSparkle(ctx, s);
}

function paintFish(ctx, f, line, pattern) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.facing * f.scale, f.scale);
  drawFish(ctx, f.species, f.color, f.len, {
    tail: f.tail,
    blink: f.blink,
    mood: f.mood,
    pattern,
    line,
  });
  ctx.restore();
}
