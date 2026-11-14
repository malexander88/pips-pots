/** Colour sorting: a delivery train of coloured wagons. One cargo at a time. */

import {
  INK,
  inkWidth,
  mulberry32,
  sfx,
  shuffle,
  paint,
} from "./util.js";
import { drawFace, drawPip, drawStump, fillStroke, glossOval, shadow } from "./scenery.js";
import { burst, drawSparkle, stepSparkles } from "./shapes.js";

const CARGO_OF = {
  red: ["apple", "ladybird"],
  yellow: ["duck", "banana"],
  blue: ["blueberry", "bird"],
  green: ["frog", "pear"],
};

function colorsFor(n) {
  if (n <= 2) return ["red", "blue"];
  if (n === 3) return ["red", "yellow", "blue"];
  return ["red", "yellow", "blue", "green"];
}

function startCountOf(Q) {
  const n = Number(Q.colorCount) || 3;
  return Math.min(4, Math.max(2, n));
}

export function createPots(Q) {
  const seed = Number(new URLSearchParams(location.search).get("seed")) || 3;
  const endless = Q.mode === "endless";
  const startCount = startCountOf(Q);
  const rng = mulberry32((seed * 131 + startCount * 17) >>> 0);
  const game = {
    kind: "pots",
    endless,
    startCount,
    stage: 0,
    trainsDone: 0,
    sorted: 0,
    rng,
    time: 0,
    toys: [],
    pots: [],
    sparkles: [],
    steam: [],
    drag: null,
    bgKey: "",
    nextId: 1,
    idleFor: 0,
    hint: null,
    pipMood: "idle",
    pipMoodT: 0,
    trainPhase: "enter",
    trainT: 0,
    trainHold: 0,
    wheelRot: 0,
    queue: [],
  };
  beginRound(game);
  return game;
}

function wagonsWanted(game) {
  return Math.min(4, game.startCount + game.stage);
}

function dealTrain(colors, rng) {
  const items = colors.map((color) => {
    const kinds = CARGO_OF[color] || ["apple"];
    const kind = kinds[Math.floor(rng() * kinds.length)];
    return { color, kind, shape: kind, key: `${kind}:${color}` };
  });
  return shuffle(items, rng);
}

function beginRound(game) {
  const colors = colorsFor(wagonsWanted(game));
  game.pots = colors.map((color) => ({
    color,
    mood: "idle",
    moodT: 0,
    squash: 1,
    wiggle: 0,
    cargo: null,
  }));
  game.queue = dealTrain(colors, game.rng);
  game.toys = [];
  game.drag = null;
  game.trainPhase = "enter";
  game.trainT = 0;
  game.trainHold = 0;
  game.idleFor = 0;
  game.hint = null;
  game.bgKey = "";
}

function advanceStage(game) {
  game.trainsDone += 1;
  if (wagonsWanted(game) < 4 && game.trainsDone >= 2) {
    game.stage += 1;
    game.trainsDone = 0;
  }
}

function safeInsets() {
  if (typeof document === "undefined") return { top: 0, right: 0, bottom: 0, left: 0 };
  let probe = safeInsets.probe;
  if (!probe || !probe.isConnected) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;inset:0;pointer-events:none;visibility:hidden;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
    document.body.append(probe);
    safeInsets.probe = probe;
  }
  const s = getComputedStyle(probe);
  return {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  };
}

function easeOut(t) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

function easeIn(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x;
}

export function layoutPots(game, w, h) {
  const inset = safeInsets();
  const u = Math.min(w / 844, h / 390);
  const left = inset.left + 8;
  const right = w - inset.right - 8;
  const bottom = h - Math.max(6, inset.bottom);
  const grassFront = Math.max(20, Math.min(h * 0.13, 52 * u));
  const railY = bottom - grassFront;
  const n = Math.max(1, game.pots.length);
  const pip = Math.min(96, Math.max(56, 74 * u));
  // Keep Pip clear of a left-edge notch, and of the top-left home button vertically by staying low.
  const pipX = Math.max(left + pip * 0.62, inset.left + 28 + pip * 0.45);
  const pipY = railY - 2;

  const gap = Math.max(4, 6 * u);
  let engineW = Math.min(120 * u, 132);
  let wagonW = Math.min(92 * u, 100);
  const trainInner = () => engineW + gap + n * wagonW + (n - 1) * gap;
  const startMin = pipX + pip * 0.85 + 16;
  let avail = Math.max(160, right - 8 - startMin);
  if (trainInner() > avail) {
    const scale = avail / trainInner();
    engineW *= scale;
    wagonW *= scale;
  }
  const trainW = trainInner();
  const startX = startMin + Math.max(0, (avail - trainW) * 0.5);

  const enterDur = 1.55;
  const departDur = 1.4;
  const off = trainW + startX + 40;
  let shift = 0;
  if (game.trainPhase === "enter") shift = -off * (1 - easeOut(game.trainT / enterDur));
  else if (game.trainPhase === "depart") shift = off * easeIn(game.trainT / departDur);

  const wheelR = Math.max(8, wagonW * 0.18);
  const wagonH = wagonW * 0.7;
  const base = railY - wheelR * 0.15;
  let x = startX + shift;
  const engine = {
    x: x + engineW / 2,
    w: engineW,
    h: engineW * 0.72,
    base,
    wheelR,
  };
  x += engineW + gap;
  for (const p of game.pots) {
    p.x = x + wagonW / 2;
    p.w = wagonW;
    p.h = wagonH;
    p.base = base;
    p.wheelR = wheelR;
    x += wagonW + gap;
  }

  const cargo = Math.max(36, Math.min(wagonW * 0.62, 64 * u));
  // Parked positions only — cache keys and the stump stay still while the train moves.
  const parkedEngineX = startX + engineW / 2;
  const platformX = (pipX + parkedEngineX - engineW * 0.55) / 2;
  const platformY = railY - cargo * 0.42;

  const playLeft = Math.min(pipX - pip * 0.7, startX - 8, platformX - cargo);
  const playRight = startX + trainW + 8;
  const playTop = base - Math.max(engine.h, wagonH) - cargo * 0.55;

  game.engine = engine;
  game.view = {
    u,
    w,
    h,
    railY,
    grassFront,
    pipX,
    pipY,
    pip,
    platformX,
    platformY,
    cargo,
    startX,
    trainW,
    shift,
    playLeft,
    playRight,
    playTop,
    potBase: base,
    potTop: playTop,
    inset,
    off,
    enterDur,
    departDur,
  };

  for (const t of game.toys) {
    if (t.phase === "seated") {
      const wagon = game.pots.find((p) => p.cargo === t);
      if (wagon) {
        t.x = wagon.x;
        t.y = wagon.base - wagon.h * 1.02;
        t.size = cargo * 0.85;
      }
    } else {
      t.size = cargo;
      t.homeX = platformX;
      t.homeY = platformY - cargo * 0.08;
      if (t.phase === "idle" || t.phase === "appear") {
        t.x = t.homeX;
        t.y = t.homeY;
      }
    }
  }

  game.metrics = {
    toy: cargo,
    gap,
    minToy: cargo,
    pairs: game.toys.map((t) => t.key),
    unique: true,
    pots: game.pots.map((p) => p.color),
    level: wagonsWanted(game),
    trainPhase: game.trainPhase,
  };
}

function liveToy(game) {
  return game.toys.find((t) => t.phase !== "seated" && t.phase !== "gone");
}

function spawnCargo(game) {
  if (game.trainPhase !== "play") return;
  if (liveToy(game)) return;
  if (game.pots.every((p) => p.cargo) || game.queue.length === 0) {
    game.trainHold = 0.35;
    game.trainPhase = "full";
    return;
  }
  const next = game.queue.shift();
  const t = {
    ...next,
    id: game.nextId++,
    phase: "appear",
    t: 0,
    wobble: 0,
    scale: 0.15,
    x: game.view?.platformX || 0,
    y: game.view?.platformY || 0,
    size: game.view?.cargo || 48,
  };
  game.toys.push(t);
  game.idleFor = 0;
  game.hint = null;
}

function startDepart(game) {
  game.trainPhase = "depart";
  game.trainT = 0;
  game.pipMood = "joy";
  game.pipMoodT = 1.2;
  toot();
  sfx("fanfare");
  const v = game.view;
  if (v) burst(game.sparkles, v.startX + v.trainW * 0.5, v.potBase - 40, "yellow", game.rng, 14);
}

function toot() {
  const audio = window.__pipAudio;
  const ctx = audio?.ctx;
  // Same AudioContext as the rest of the game, so it is suspended in the background; and no
  // new toots are scheduled while the app is backgrounded (0.12.8).
  if (!ctx || audio.enabled === false || audio.backgrounded) return;
  try {
    const dest = audio.sfx || ctx.destination;
    const t0 = ctx.currentTime;
    const beep = (when, freq, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, when);
      o.frequency.linearRampToValueAtTime(freq * 1.08, when + dur * 0.45);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.09, when + 0.03);
      g.gain.linearRampToValueAtTime(0.05, when + dur * 0.5);
      g.gain.linearRampToValueAtTime(0, when + dur);
      o.connect(g);
      g.connect(dest);
      o.start(when);
      o.stop(when + dur + 0.02);
    };
    beep(t0, 392, 0.2);
    beep(t0 + 0.18, 523.25, 0.32);
  } catch {
    /* missing audio graph should not break play */
  }
}

export function stepPots(game, dt, w, h) {
  game.time += dt;
  layoutPots(game, w, h);
  const v = game.view;
  const speed = game.trainPhase === "enter" || game.trainPhase === "depart" ? (game.trainPhase === "depart" ? 280 : 260) : 0;
  if (speed) game.wheelRot += (speed / Math.max(12, (game.pots[0]?.wheelR || 12) * 6)) * dt;

  if (game.trainPhase === "enter") {
    game.trainT += dt;
    if (game.trainT >= v.enterDur) {
      game.trainPhase = "play";
      game.trainT = v.enterDur;
      spawnCargo(game);
      layoutPots(game, w, h);
    }
  } else if (game.trainPhase === "full") {
    game.trainHold -= dt;
    if (game.trainHold <= 0) startDepart(game);
  } else if (game.trainPhase === "depart") {
    game.trainT += dt;
    if (game.trainT >= v.departDur) {
      advanceStage(game);
      beginRound(game);
      layoutPots(game, w, h);
    }
  }

  for (const p of game.pots) {
    if (p.moodT > 0) {
      p.moodT -= dt;
      if (p.moodT <= 0) p.mood = "idle";
    }
    p.squash += (1 - p.squash) * Math.min(1, dt * 8);
    p.wiggle += (0 - p.wiggle) * Math.min(1, dt * 6);
  }
  if (game.pipMoodT > 0) {
    game.pipMoodT -= dt;
    if (game.pipMoodT <= 0) game.pipMood = "idle";
  }

  for (const t of game.toys) {
    if (t.phase === "drag" && game.drag) {
      t.x = game.drag.x;
      t.y = game.drag.y;
      t.scale += (1.08 - t.scale) * Math.min(1, dt * 18);
    } else if (t.phase === "appear") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.32);
      t.scale = 0.2 + easeOut(k) * 0.8;
      t.x = t.homeX;
      t.y = t.homeY - (1 - k) * 10;
      if (k >= 1) {
        t.phase = "idle";
        t.scale = 1;
        t.x = t.homeX;
        t.y = t.homeY;
      }
    } else if (t.phase === "return") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.38);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.homeX - t.fromX) * e;
      t.y = t.fromY + (t.homeY - t.fromY) * e;
      t.wobble = Math.sin(k * Math.PI * 3) * 0.22 * (1 - k);
      t.scale += (1 - t.scale) * Math.min(1, dt * 10);
      if (k >= 1) {
        t.phase = "idle";
        t.x = t.homeX;
        t.y = t.homeY;
        t.wobble = 0;
        t.scale = 1;
      }
    } else if (t.phase === "hop") {
      t.t += dt;
      const k = Math.min(1, t.t / 0.42);
      const e = 1 - (1 - k) ** 3;
      t.x = t.fromX + (t.toX - t.fromX) * e;
      t.y = t.fromY + (t.toY - t.fromY) * e - Math.sin(k * Math.PI) * (t.size || 48) * 0.85;
      t.scale = k < 0.6 ? 1 + k * 0.1 : 1.06 - ((k - 0.6) / 0.4) * 0.21;
      if (k >= 1) {
        t.phase = "seated";
        t.scale = 0.95;
        t.wobble = 0;
        const wagon = game.pots.find((p) => p.cargo === t);
        if (wagon) {
          t.x = wagon.x;
          t.y = wagon.base - wagon.h * 1.02;
        }
        spawnCargo(game);
        layoutPots(game, w, h);
      }
    } else if (t.phase === "idle") {
      t.x = t.homeX;
      t.y = t.homeY;
      t.scale += (1 - t.scale) * Math.min(1, dt * 10);
    }
  }

  if (game.trainPhase === "play" && liveToy(game)?.phase === "idle" && !game.drag) {
    game.idleFor += dt;
    if (!game.hint && game.idleFor > 3.2) {
      const toy = liveToy(game);
      const wagon = game.pots.find((p) => p.color === toy.color);
      if (wagon) {
        // Hop into the grass in front of the matching wagon, not into the wagon itself.
        game.hint = {
          t: 0,
          fromX: v.pipX,
          toX: wagon.x,
          fromY: v.pipY,
          toY: v.railY + Math.max(16, v.grassFront * 0.5),
        };
      }
    }
  } else if (!game.hint) {
    game.idleFor = 0;
  }

  if (game.hint) {
    game.hint.t += dt;
    if (game.hint.t >= 2.2) {
      game.hint = null;
      game.idleFor = -1.6;
    }
  }

  stepSteam(game, dt);
  stepSparkles(game.sparkles, dt);
}

function pipPose(game) {
  const v = game.view;
  let x = v.pipX;
  let y = v.pipY;
  if (game.hint) {
    const t = game.hint.t;
    let k;
    if (t < 0.85) k = easeOut(t / 0.85);
    else if (t < 1.25) k = 1;
    else k = 1 - easeIn((t - 1.25) / 0.85);
    x = game.hint.fromX + (game.hint.toX - game.hint.fromX) * k;
    const baseY = game.hint.fromY + ((game.hint.toY ?? v.pipY) - game.hint.fromY) * k;
    const hops = t < 0.85 ? 3 : t > 1.25 ? 3 : 0;
    const local = t < 0.85 ? t / 0.85 : t > 1.25 ? (t - 1.25) / 0.85 : 0;
    y = baseY - Math.abs(Math.sin(local * Math.PI * hops)) * v.pip * 0.28;
  }
  return { x, y };
}

function hitToy(game, x, y) {
  for (let i = game.toys.length - 1; i >= 0; i--) {
    const t = game.toys[i];
    if (t.phase !== "idle" && t.phase !== "return" && t.phase !== "appear") continue;
    if (t.phase === "appear" && t.t < 0.18) continue;
    if (Math.abs(x - t.x) <= t.size * 0.6 && Math.abs(y - t.y) <= t.size * 0.6) return t;
  }
  return null;
}

function hitWagon(game, x, y) {
  for (const p of game.pots) {
    if (Math.abs(x - p.x) <= p.w * 0.62 && y >= p.base - p.h - (game.view?.cargo || 40) * 0.55 && y <= p.base + 18) return p;
  }
  return null;
}

export function potsPointerDown(game, x, y, w, h) {
  layoutPots(game, w, h);
  if (game.trainPhase !== "play") return false;
  const t = hitToy(game, x, y);
  if (!t) return false;
  t.phase = "drag";
  t.scale = 1.08;
  game.drag = { id: t.id, x, y };
  game.hint = null;
  game.idleFor = 0;
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
  const wagon = hitWagon(game, finger.x, finger.y);
  if (wagon && wagon.color === t.color && !wagon.cargo) {
    t.phase = "hop";
    t.t = 0;
    t.fromX = t.x;
    t.fromY = t.y;
    t.toX = wagon.x;
    t.toY = wagon.base - wagon.h * 1.02;
    wagon.cargo = t;
    wagon.mood = "joy";
    wagon.moodT = 0.95;
    wagon.squash = 1.16;
    wagon.wiggle = 0.22;
    game.sorted += 1;
    game.pipMood = "joy";
    game.pipMoodT = 0.9;
    game.idleFor = 0;
    game.hint = null;
    sfx("colorChime", t.color);
    burst(game.sparkles, wagon.x, wagon.base - wagon.h, t.color, game.rng, 10);
    return;
  }
  if (wagon) {
    wagon.mood = "oh";
    wagon.moodT = 0.7;
  }
  t.phase = "return";
  t.t = 0;
  t.fromX = t.x;
  t.fromY = t.y;
}

function stepSteam(game, dt) {
  const moving = game.trainPhase === "enter" || game.trainPhase === "depart";
  const engine = game.engine;
  if (engine && (moving || game.trainPhase === "play" || game.trainPhase === "full")) {
    game.steamTimer = (game.steamTimer || 0) - dt;
    if (game.steamTimer <= 0) {
      game.steamTimer = moving ? 0.09 : 0.28;
      const chimneyX = engine.x - engine.w * 0.18;
      const chimneyY = engine.base - engine.h * 1.02;
      game.steam.push({
        x: chimneyX + (game.rng() - 0.5) * 6,
        y: chimneyY,
        vx: (game.rng() - 0.3) * 16 + (moving ? 30 : 4),
        vy: -28 - game.rng() * 18,
        life: 1,
        s: 8 + game.rng() * 7,
      });
    }
  }
  for (const p of game.steam) {
    p.life -= dt * (moving ? 1.1 : 0.7);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 8 * dt;
    p.s += 10 * dt;
  }
  for (let i = game.steam.length - 1; i >= 0; i--) if (game.steam[i].life <= 0) game.steam.splice(i, 1);
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

  drawRails(ctx, w, v, line);
  drawTrainShadow(ctx, game);

  const engine = game.engine;
  if (engine) drawEngine(ctx, game, engine, line, false);
  for (const p of game.pots) drawWagon(ctx, game, p, line, false);
  for (const t of game.toys) {
    if (t.phase === "hop" && Number.isFinite(t.size)) {
      drawCargo(ctx, t.kind, t.x, t.y, t.size * (t.scale || 1), t.color, line, { noShadow: true });
    }
  }
  if (engine) drawEngine(ctx, game, engine, line, true);
  for (const p of game.pots) drawWagon(ctx, game, p, line, true);
  for (const t of game.toys) {
    if (t.phase === "seated" && Number.isFinite(t.size)) {
      drawCargo(ctx, t.kind, t.x, t.y, t.size * (t.scale || 0.95), t.color, line, { noShadow: true, lift: 0.96 });
    }
  }

  const sway = Math.sin(game.time * (calm ? 1.2 : 2));
  for (let i = 0; i < 8; i++) {
    const gx = (w * (i + 0.35)) / 8;
    if (gx > v.playLeft && gx < v.playRight) continue;
    baseTuft(ctx, gx, v.railY + v.grassFront * 0.55, (7 + (i % 3)) * u, sway + i);
  }

  const bugs = w > 1100 ? 3 : 2;
  const colors = ["#ff5d8f", "#ffd000", "#7ec8ff"];
  const pose = pipPose(game);
  for (let i = 0; i < bugs; i++) {
    const b = butterflySpot(i, w, h, game.time, calm, v);
    if (b.x > v.playLeft - 12 && b.x < v.playRight + 12 && b.y > v.playTop - 8) continue;
    const bugHalf = 22 * u * 0.8;
    const clearX = v.pip * 0.75 + bugHalf + 14 * u;
    const clearTop = pose.y - v.pip * 1.75 - bugHalf - 14 * u;
    if (Math.abs(b.x - pose.x) < clearX && b.y > clearTop) continue;
    butterfly(ctx, b.x, b.y, 22 * u, b.flap, colors[i % colors.length], line);
  }

  if (game.trainPhase === "play" || game.trainPhase === "full") {
    drawStump(ctx, v.platformX, v.railY - 2, v.cargo * 0.7);
  }

  drawPip(ctx, pose.x, pose.y, v.pip, game.pipMood, game.time, calm);

  for (const t of game.toys) {
    if (t.phase === "gone" || t.phase === "seated" || t.phase === "hop" || t.phase === "drag" || !Number.isFinite(t.size)) continue;
    drawCargo(ctx, t.kind, t.x, t.y, t.size * (t.scale || 1), t.color, line, { lift: t.scale, wobble: t.wobble });
  }
  const held = game.toys.find((t) => t.phase === "drag");
  if (held && Number.isFinite(held.size)) {
    drawCargo(ctx, held.kind, held.x, held.y, held.size * (held.scale || 1), held.color, line, { lift: held.scale || 1.08 });
  }
  drawSteam(ctx, game, line);
  for (const s of game.sparkles) drawSparkle(ctx, s);
}

function drawRails(ctx, w, v, line) {
  const y = v.railY;
  const inset = v.inset || { left: 0, right: 0 };
  const x0 = inset.left - 8;
  const x1 = w - inset.right + 8;
  ctx.save();
  ctx.fillStyle = "rgba(28, 42, 36, 0.18)";
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2, y + 6, (x1 - x0) * 0.48, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  const sleeper = Math.max(16, 22 * v.u);
  ctx.fillStyle = "#c47a3a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, line * 0.45);
  for (let x = x0 + 6; x < x1; x += sleeper) {
    ctx.beginPath();
    ctx.roundRect(x, y - 3, sleeper * 0.55, 14 * v.u, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(3, line * 0.9);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.moveTo(x0, y + 8 * v.u);
  ctx.lineTo(x1, y + 8 * v.u);
  ctx.stroke();
  ctx.restore();
}

function drawTrainShadow(ctx, game) {
  const engine = game.engine;
  if (!engine) return;
  const last = game.pots[game.pots.length - 1];
  const x0 = engine.x - engine.w * 0.5;
  const x1 = last ? last.x + last.w * 0.5 : engine.x + engine.w * 0.5;
  ctx.save();
  ctx.fillStyle = "rgba(28, 42, 36, 0.22)";
  ctx.beginPath();
  ctx.ellipse((x0 + x1) / 2, engine.base + 6, (x1 - x0) * 0.52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWheel(ctx, x, y, r, rot, line) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2e4168";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, line * 0.7);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.rotate(rot);
  ctx.strokeStyle = "#dce6f5";
  ctx.lineWidth = Math.max(1.4, line * 0.4);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
  ctx.moveTo(-r * 0.5, 0);
  ctx.lineTo(r * 0.5, 0);
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(0, r * 0.5);
  ctx.stroke();
  ctx.fillStyle = "#ffd000";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEngine(ctx, game, e, line, front) {
  const colY = paint("yellow");
  const colB = paint("blue");
  const x = e.x;
  const base = e.base;
  const w = e.w;
  const h = e.h;
  const rot = game.wheelRot || 0;
  if (!front) {
    drawWheel(ctx, x - w * 0.28, base + e.wheelR * 0.05, e.wheelR * 1.05, rot, line);
    drawWheel(ctx, x + w * 0.3, base + e.wheelR * 0.05, e.wheelR * 1.05, rot, line);
    // boiler + cowcatcher + cab back
    ctx.save();
    ctx.fillStyle = colY.base;
    ctx.beginPath();
    ctx.roundRect(x - w * 0.46, base - h * 0.78, w * 0.62, h * 0.7, h * 0.28);
    ctx.fill();
    fillStroke(ctx, null, line);
    ctx.fillStyle = colB.base;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.08, base - h * 0.98, w * 0.38, h * 0.9, 8);
    ctx.fill();
    fillStroke(ctx, null, line);
    ctx.restore();
    return;
  }
  // funnel
  ctx.save();
  ctx.fillStyle = colB.base;
  ctx.beginPath();
  ctx.roundRect(x - w * 0.28, base - h * 1.08, w * 0.16, h * 0.34, 4);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.beginPath();
  ctx.roundRect(x - w * 0.32, base - h * 1.14, w * 0.24, h * 0.1, 4);
  ctx.fill();
  fillStroke(ctx, null, line);
  // cab window
  ctx.fillStyle = "#d4e4ff";
  ctx.beginPath();
  ctx.roundRect(x + w * 0.14, base - h * 0.88, w * 0.22, h * 0.28, 5);
  ctx.fill();
  fillStroke(ctx, null, line);
  // bumper
  ctx.fillStyle = "#2e4168";
  ctx.beginPath();
  ctx.roundRect(x - w * 0.52, base - h * 0.28, w * 0.12, h * 0.22, 3);
  ctx.fill();
  fillStroke(ctx, null, line);
  // face on the boiler
  drawFace(ctx, x - w * 0.16, base - h * 0.48, w * 0.42, "idle", 1);
  glossOval(ctx, x - w * 0.28, base - h * 0.62, w * 0.08, h * 0.06);
  ctx.restore();
}

function drawWagon(ctx, game, p, line, front) {
  const { x, base, w, h } = p;
  const col = paint(p.color);
  const rot = game.wheelRot || 0;
  const top = base - h;
  ctx.save();
  ctx.translate(x, base);
  ctx.rotate(p.wiggle || 0);
  ctx.scale(p.squash || 1, 1 / Math.max(0.82, p.squash || 1));
  ctx.translate(-x, -base);
  if (!front) {
    drawWheel(ctx, x - w * 0.28, base + (p.wheelR || 8) * 0.05, p.wheelR || 8, rot, line);
    drawWheel(ctx, x + w * 0.28, base + (p.wheelR || 8) * 0.05, p.wheelR || 8, rot, line);
    ctx.beginPath();
    ctx.roundRect(x - w * 0.46, top + h * 0.08, w * 0.92, h * 0.86, 8);
    ctx.fillStyle = col.base;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = col.light;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x - w * 0.46, top, w * 0.28, h);
    ctx.restore();
    fillStroke(ctx, null, line);
    return ctx.restore();
  }
  // Open rim — a shallow dark ellipse so the wagon reads as a bucket, not a lid.
  ctx.beginPath();
  ctx.ellipse(x, top + h * 0.16, w * 0.4, h * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = col.dark;
  ctx.fill();
  ctx.lineWidth = Math.max(2, line * 0.7);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, top + h * 0.13, w * 0.4, h * 0.1, 0, Math.PI, Math.PI * 2, true);
  ctx.strokeStyle = col.light;
  ctx.lineWidth = Math.max(2, line * 0.55);
  ctx.stroke();
  drawFace(ctx, x, base - h * 0.42, w * 0.55, p.mood, 1);
  glossOval(ctx, x - w * 0.16, base - h * 0.55, w * 0.1, h * 0.07);
  ctx.restore();
}

function drawSteam(ctx, game, line) {
  for (const p of game.steam) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life) * 0.55;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCargo(ctx, kind, x, y, size, color, line, opts = {}) {
  const { lift = 1, wobble = 0, alpha = 1 } = opts;
  const col = paint(color);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(wobble || 0);
  ctx.scale(lift, 1 / Math.max(0.82, lift));
  if (!opts.noShadow) shadow(ctx, 0, size * 0.48, size * 0.36, size * 0.09);
  const k = kind || "apple";
  if (k === "apple") drawApple(ctx, size, col, line);
  else if (k === "ladybird") drawLadybird(ctx, size, col, line);
  else if (k === "duck") drawDuck(ctx, size, col, line);
  else if (k === "banana") drawBanana(ctx, size, col, line);
  else if (k === "blueberry") drawBlueberry(ctx, size, col, line);
  else if (k === "bird") drawBird(ctx, size, col, line);
  else if (k === "frog") drawFrog(ctx, size, col, line);
  else if (k === "pear") drawPear(ctx, size, col, line);
  else drawApple(ctx, size, col, line);
  ctx.restore();
}

function drawApple(ctx, size, col, line) {
  ctx.beginPath();
  ctx.arc(0, size * 0.04, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.strokeStyle = "#7a4a18";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.34);
  ctx.quadraticCurveTo(size * 0.08, -size * 0.5, size * 0.02, -size * 0.58);
  ctx.stroke();
  ctx.fillStyle = "#3cba4e";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, line * 0.55);
  ctx.beginPath();
  ctx.ellipse(size * 0.16, -size * 0.48, size * 0.14, size * 0.08, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  glossOval(ctx, -size * 0.14, -size * 0.08, size * 0.12, size * 0.08);
  drawFace(ctx, 0, size * 0.04, size * 0.55, "idle", 1);
}

function drawPear(ctx, size, col, line) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.46);
  ctx.bezierCurveTo(-size * 0.42, size * 0.42, -size * 0.46, size * 0.02, -size * 0.22, -size * 0.16);
  ctx.bezierCurveTo(-size * 0.16, -size * 0.46, size * 0.16, -size * 0.46, size * 0.22, -size * 0.16);
  ctx.bezierCurveTo(size * 0.46, size * 0.02, size * 0.42, size * 0.42, 0, size * 0.46);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.strokeStyle = "#7a4a18";
  ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.38);
  ctx.lineTo(0, -size * 0.56);
  ctx.stroke();
  ctx.fillStyle = "#3cba4e";
  ctx.beginPath();
  ctx.ellipse(size * 0.14, -size * 0.48, size * 0.13, size * 0.07, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, line * 0.55);
  ctx.stroke();
  glossOval(ctx, -size * 0.12, 0, size * 0.1, size * 0.08);
  drawFace(ctx, 0, size * 0.06, size * 0.5, "idle", 1);
}


function drawBlueberry(ctx, size, col, line) {
  ctx.beginPath();
  ctx.arc(0, size * 0.06, size * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = col.base;
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = "#5a3a18";
  ctx.beginPath();
  ctx.arc(0, -size * 0.28, size * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col.light;
  ctx.lineWidth = Math.max(1.6, line * 0.55);
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.28);
    ctx.lineTo(Math.cos(a) * size * 0.14, -size * 0.28 + Math.sin(a) * size * 0.14);
    ctx.stroke();
  }
  glossOval(ctx, -size * 0.14, -size * 0.02, size * 0.12, size * 0.08);
  drawFace(ctx, 0, size * 0.1, size * 0.55, "idle", 1);
}

function drawBanana(ctx, size, col, line) {
  ctx.beginPath();
  ctx.moveTo(-size * 0.38, -size * 0.08);
  ctx.quadraticCurveTo(-size * 0.1, size * 0.42, size * 0.4, size * 0.16);
  ctx.quadraticCurveTo(size * 0.48, size * 0.08, size * 0.36, 0);
  ctx.quadraticCurveTo(-size * 0.02, size * 0.2, -size * 0.28, -size * 0.16);
  ctx.closePath();
  ctx.fillStyle = col.base;
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = "#7a4a18";
  ctx.beginPath();
  ctx.ellipse(-size * 0.34, -size * 0.12, size * 0.07, size * 0.05, -0.6, 0, Math.PI * 2);
  ctx.fill();
  glossOval(ctx, -size * 0.04, size * 0.04, size * 0.12, size * 0.07);
  drawFace(ctx, size * 0.02, size * 0.1, size * 0.42, "idle", 1);
}


function drawDuck(ctx, size, col, line) {
  ctx.fillStyle = col.base;
  ctx.beginPath();
  ctx.ellipse(size * 0.02, size * 0.14, size * 0.36, size * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.beginPath();
  ctx.arc(-size * 0.02, -size * 0.14, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = "#ff8a3d";
  ctx.beginPath();
  ctx.ellipse(size * 0.2, -size * 0.12, size * 0.16, size * 0.07, 0.15, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = col.dark;
  ctx.beginPath();
  ctx.ellipse(size * 0.08, size * 0.14, size * 0.14, size * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();
  drawFace(ctx, -size * 0.06, -size * 0.16, size * 0.36, "idle", 1);
}

function drawBird(ctx, size, col, line) {
  ctx.fillStyle = col.base;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.36, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.beginPath();
  ctx.arc(-size * 0.02, -size * 0.16, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = col.light;
  ctx.beginPath();
  ctx.ellipse(size * 0.1, size * 0.12, size * 0.16, size * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8a3d";
  ctx.beginPath();
  ctx.moveTo(size * 0.16, -size * 0.16);
  ctx.lineTo(size * 0.38, -size * 0.1);
  ctx.lineTo(size * 0.16, -size * 0.06);
  ctx.closePath();
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = col.dark;
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, size * 0.12);
  ctx.quadraticCurveTo(-size * 0.48, size * 0.04, -size * 0.34, size * 0.22);
  ctx.closePath();
  ctx.fill();
  fillStroke(ctx, null, line);
  drawFace(ctx, -size * 0.06, -size * 0.18, size * 0.38, "idle", 1);
}

function drawFrog(ctx, size, col, line) {
  ctx.fillStyle = col.base;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.08, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * size * 0.2, -size * 0.2, size * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = col.base;
    ctx.fill();
    fillStroke(ctx, null, line);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(side * size * 0.2, -size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    fillStroke(ctx, null, Math.max(1.4, line * 0.6));
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(side * size * 0.2, -size * 0.18, size * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, line * 0.7);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, size * 0.1, size * 0.14, 0.15, Math.PI - 0.15);
  ctx.stroke();
  glossOval(ctx, -size * 0.12, 0, size * 0.1, size * 0.07);
}

function drawLadybird(ctx, size, col, line) {
  ctx.fillStyle = "#2e4168";
  ctx.beginPath();
  ctx.arc(0, -size * 0.22, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.fillStyle = col.base;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.1, size * 0.4, size * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  fillStroke(ctx, null, line);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, line * 0.7);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.18);
  ctx.lineTo(0, size * 0.4);
  ctx.stroke();
  ctx.fillStyle = INK;
  for (const [dx, dy] of [
    [-0.18, 0.0],
    [0.18, 0.02],
    [-0.16, 0.22],
    [0.16, 0.22],
  ]) {
    ctx.beginPath();
    ctx.arc(dx * size, dy * size, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fff";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * size * 0.08, -size * 0.26, size * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(side * size * 0.08, -size * 0.26, size * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.4, line * 0.5);
  ctx.beginPath();
  ctx.moveTo(-size * 0.08, -size * 0.4);
  ctx.quadraticCurveTo(-size * 0.2, -size * 0.55, -size * 0.18, -size * 0.62);
  ctx.moveTo(size * 0.08, -size * 0.4);
  ctx.quadraticCurveTo(size * 0.2, -size * 0.55, size * 0.18, -size * 0.62);
  ctx.stroke();
}

