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

export function sfx(name, ...args) {
  const audio = window.__pipAudio;
  if (!audio || typeof audio[name] !== "function") return;
  try {
    audio[name](...args);
  } catch {
    /* a missing buffer should not break play */
  }
}

export function inkWidth(u, kind = "prop") {
  const base = kind === "scene" ? 3.4 : kind === "thin" ? 2.6 : 4.6;
  return Math.max(kind === "thin" ? 2 : 3, base * Math.max(0.85, u));
}

export function paint(color) {
  return PAL[color] || PAL.red;
}

