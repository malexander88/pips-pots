/** Shared colour, motion and sound helpers for the three painted modes. */

export const INK = "#2e4168";
export const FACE = "#2c3d63";

export const PAL = {
  red: { base: "#ff2a2a", light: "#ffd0c8", dark: "#c41432" },
  blue: { base: "#2f6bff", light: "#d4e4ff", dark: "#1a3ec0" },
  yellow: { base: "#ffd000", light: "#fff3a8", dark: "#e09000" },
  green: { base: "#1ed15a", light: "#c8ffc0", dark: "#0c8a38" },
  orange: { base: "#ff7810", light: "#ffe0b8", dark: "#d24a00" },
  purple: { base: "#a64bff", light: "#ead0ff", dark: "#6a22d4" },
  pink: { base: "#ff4d93", light: "#ffd0e4", dark: "#d01868" },
  white: { base: "#f4f7fb", light: "#ffffff", dark: "#d5dbe6" },
};

export const SIG_SHAPE = {
  red: "ball",
  blue: "pyramid",
  yellow: "block",
  green: "star",
  orange: "ring",
  purple: "heart",
  pink: "button",
  white: "coin",
};

export const LEVELS = [
  { colors: ["red", "blue"], shapes: ["ball", "coin"], count: 8, visible: 4 },
  { colors: ["red", "blue", "yellow"], shapes: ["ball", "coin", "block"], count: 12, visible: 4 },
  { colors: ["red", "blue", "yellow", "green"], shapes: ["ball", "coin", "block", "star"], count: 16, visible: 5 },
  { colors: ["red", "blue", "yellow", "green", "orange"], shapes: ["ball", "coin", "block", "star", "ring"], count: 20, visible: 5 },
  { colors: ["red", "blue", "yellow", "green", "orange", "purple"], shapes: ["ball", "coin", "block", "star", "ring", "button"], count: 24, visible: 5 },
  { colors: ["red", "blue", "yellow", "green", "orange", "purple", "pink"], shapes: ["ball", "coin", "block", "star", "ring", "button", "heart"], count: 30, visible: 6 },
];

const PALETTES = [
  { pair: ["red", "blue"], third: "yellow" },
  { pair: ["yellow", "purple"], third: "green" },
  { pair: ["green", "orange"], third: "blue" },
  { pair: ["pink", "blue"], third: "yellow" },
  { pair: ["red", "green"], third: "purple" },
  { pair: ["orange", "purple"], third: "yellow" },
  { pair: ["yellow", "blue"], third: "pink" },
  { pair: ["pink", "green"], third: "orange" },
];

export function fishColors(count, paletteIndex) {
  const p = PALETTES[((paletteIndex % PALETTES.length) + PALETTES.length) % PALETTES.length];
  return count >= 3 ? [p.pair[0], p.pair[1], p.third] : [...p.pair];
}

export function levelForCount(colorCount) {
  if (colorCount <= 2) return 0;
  if (colorCount === 3) return 1;
  if (colorCount === 4) return 2;
  if (colorCount === 5) return 3;
  if (colorCount === 6) return 4;
  return 5;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smooth(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Underdamped spring. zeta 0.56 settles with about 12% overshoot. */
export function makeSpring(value) {
  return { v: value, vel: 0 };
}

export function stepSpring(s, target, dt, omega = 11, zeta = 0.56) {
  const accel = -2 * zeta * omega * s.vel - omega * omega * (s.v - target);
  s.vel += accel * dt;
  s.v += s.vel * dt;
  return s.v;
}

export function sfx(name, ...args) {
  const audio = window.__pipAudio;
  if (!audio || typeof audio[name] !== "function") return;
  try {
    audio[name](...args);
  } catch {
    /* a missing buffer should not break play */
  }
}

export function unit() {
  return Math.min(window.innerWidth / 844, window.innerHeight / 390);
}

export function inkWidth(u, kind = "prop") {
  const base = kind === "scene" ? 3.4 : kind === "thin" ? 2.6 : 4.6;
  return Math.max(kind === "thin" ? 2 : 3, base * Math.max(0.85, u));
}

export function paint(color) {
  return PAL[color] || PAL.red;
}

export function patternId(color) {
  const order = ["red", "blue", "yellow", "green", "orange", "purple", "pink", "white"];
  const i = order.indexOf(color);
  return i < 0 ? 0 : i % 6;
}
