/** Full-screen painted stage for Fish Nets, colour sorting and Shape Box. */

import { createBox, boxPointerDown, boxPointerMove, boxPointerUp, drawBox, stepBox } from "./box.js";
import { createFish, drawFishGame, fishPointerDown, fishPointerMove, fishPointerUp, stepFish } from "./fish.js";
import { createPots, drawPots, potsPointerDown, potsPointerMove, potsPointerUp, stepPots } from "./pots.js";

const MODES = new Set(["fish", "levels", "endless", "shapebox"]);

function ours(Q) {
  return Q && Q.phase === "play" && MODES.has(Q.mode);
}

function signature(Q) {
  return [
    Q.mode,
    Q.phase,
    Q.fishCount,
    Q.fishPalette,
    Q.paletteMode,
    Q.colorCount,
    Q.shapeHoleCount,
    Q.shapeMix,
    Q.shapeMixPick,
  ].join("|");
}

function makeGame(Q) {
  if (Q.mode === "fish") return createFish(Q);
  if (Q.mode === "shapebox") return createBox(Q);
  return createPots(Q);
}

export function startHost() {
  const stage = document.createElement("div");
  stage.id = "c12-stage";
  const bg = document.createElement("canvas");
  const fg = document.createElement("canvas");
  bg.id = "c12-bg";
  fg.id = "c12-fg";
  stage.append(bg, fg);
  stage.style.display = "none";

  let game = null;
  let sig = "";
  let last = performance.now();
  let pointer = null;

  function root() {
    return document.querySelector(".game-root");
  }

  function mount() {
    const parent = root();
    if (!parent || !window.__pip) {
      requestAnimationFrame(mount);
      return;
    }
    parent.append(stage);
    const gl = parent.querySelector("canvas:not(#c12-bg):not(#c12-fg)");
    if (gl && gl.parentElement && gl.parentElement !== parent) gl.parentElement.style.zIndex = "0";
    requestAnimationFrame(frame);
  }

  function resize() {
    const parent = root();
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    for (const canvas of [bg, fg]) {
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        if (game) game.bgKey = "";
      }
      canvas.__dpr = dpr;
    }
    stage.__w = w;
    stage.__h = h;
    stage.__dpr = dpr;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const Q = window.__pip;
    const on = ours(Q);
    stage.style.display = on ? "block" : "none";
    if (!on) {
      game = null;
      sig = "";
      return;
    }
    const next = signature(Q);
    if (!game || next !== sig) {
      game = makeGame(Q);
      sig = next;
      game.bgKey = "";
    }
    resize();
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const w = stage.__w;
    const h = stage.__h;
    const calm = !!(Q.calmMotion || Q.calm);
    const t0 = performance.now();
    if (game.kind === "fish") {
      stepFish(game, dt, w, h, calm);
      drawFishGame(game, bg, fg, w, h, calm);
    } else if (game.kind === "box") {
      stepBox(game, dt, w, h);
      drawBox(game, bg, fg, w, h, calm);
    } else {
      stepPots(game, dt, w, h);
      drawPots(game, bg, fg, w, h, calm);
    }
    const work = performance.now() - t0;
    game.workMs = work;
    const actors = game.kind === "fish"
      ? { fish: game.fish.map((f) => ({ x: f.x, y: f.y, phase: f.phase, color: f.color, id: f.id })), nets: game.nets.map((n) => ({ x: n.x, y: n.y, color: n.color, id: n.id })) }
      : game.kind === "box"
        ? { toys: game.toys.map((t) => ({ x: t.x, y: t.y, phase: t.phase, shape: t.shape, id: t.id })), holes: game.holes.map((h) => ({ x: h.cx, y: h.cy, shape: h.shape })), pile: game.pile.length }
        : { toys: game.toys.map((t) => ({ x: t.x, y: t.y, phase: t.phase, color: t.color, shape: t.shape, id: t.id })), pots: game.pots.map((p) => ({ x: p.x, y: p.base - p.h * 0.5, color: p.color })) };
    const times = (window.__c12times ||= []);
    times.push(work);
    if (times.length > 1200) times.shift();
    window.__c12 = {
      kind: game.kind,
      metrics: game.metrics || null,
      actors,
      workMs: work,
      dpr: stage.__dpr,
      css: [w, h],
      backing: [fg.width, fg.height],
    };
  }

  function point(event) {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  stage.addEventListener("pointerdown", (event) => {
    if (!game || event.button !== 0 && event.pointerType === "mouse") return;
    const Q = window.__pip;
    if (Q?.grownUp) return;
    if (pointer !== null) return;
    pointer = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    const p = point(event);
    const w = stage.__w;
    const h = stage.__h;
    if (game.kind === "fish") fishPointerDown(game, p.x, p.y);
    else if (game.kind === "box") boxPointerDown(game, p.x, p.y, w, h);
    else potsPointerDown(game, p.x, p.y, w, h);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!game || event.pointerId !== pointer) return;
    const p = point(event);
    if (game.kind === "fish") fishPointerMove(game, p.x, p.y);
    else if (game.kind === "box") boxPointerMove(game, p.x, p.y);
    else potsPointerMove(game, p.x, p.y);
  });

  function end(event) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    if (!game) return;
    const w = stage.__w;
    const h = stage.__h;
    if (game.kind === "fish") fishPointerUp(game);
    else if (game.kind === "box") boxPointerUp(game, w, h);
    else potsPointerUp(game, w, h);
  }

  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  mount();
}
