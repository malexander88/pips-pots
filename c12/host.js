/** Full-screen painted stage for the train (colour sorting). */

import { createPots, drawPots, potsPointerDown, potsPointerMove, potsPointerUp, stepPots } from "./pots.js";

const MODES = new Set(["levels", "endless"]);

function ours(Q) {
  return Q && Q.phase === "play" && MODES.has(Q.mode);
}

function signature(Q) {
  return [Q.mode, Q.phase, Q.colorCount].join("|");
}

function makeGame(Q) {
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
    // App in the background (window.__pipPaused, lifecycle.ts): the pots stand still, so the
    // game is exactly as it was when the player comes back.
    if (window.__pipPaused) {
      last = now;
      return;
    }
    resize();
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000 || 0.016));
    last = now;
    const w = stage.__w;
    const h = stage.__h;
    const calm = !!(Q.calmMotion || Q.calm);
    const t0 = performance.now();
    stepPots(game, dt, w, h);
    drawPots(game, bg, fg, w, h, calm);
    const work = performance.now() - t0;
    game.workMs = work;
    const actors = { toys: game.toys.map((t) => ({ x: t.x, y: t.y, phase: t.phase, color: t.color, shape: t.shape, id: t.id })), pots: game.pots.map((p) => ({ x: p.x, y: p.base - p.h * 0.5, color: p.color })) };
    const times = (window.__c12times ||= []);
    times.push(work);
    if (times.length > 1200) times.shift();
    window.__c12game = game;
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
    potsPointerDown(game, p.x, p.y, w, h);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!game || event.pointerId !== pointer) return;
    const p = point(event);
    potsPointerMove(game, p.x, p.y);
  });

  function end(event) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    if (!game) return;
    const w = stage.__w;
    const h = stage.__h;
    potsPointerUp(game, w, h);
  }

  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  mount();
}
