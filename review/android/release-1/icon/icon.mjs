// icon.mjs: 1.0.2 Android launcher icon layers, painted with the app's own master Pip (same art as play_store/icon_512.png).
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire("/workspace/ss6/s5src/game/package.json");
const { chromium } = require("playwright-core");
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
const p = await ctx.newPage(); await p.goto("http://localhost:8775/pips-pots/?test=1"); await p.waitForTimeout(2500);
const out = await p.evaluate(async () => {
  const NAVY = "#2e4168";
  const pip = window.__housePip;
  const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  function sky(c, w, h) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#58aef7"); g.addColorStop(0.6, "#8ccaf9"); g.addColorStop(1, "#bfe3fb"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function sun(c, x, y, r, lw) { const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, "rgba(255,244,186,0.9)"); g.addColorStop(1, "rgba(255,244,186,0)"); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = "#ffe066"; c.fill(); c.lineWidth = lw; c.strokeStyle = NAVY; c.stroke(); }
  function cloud(c, x, y, s, lw) { const parts = [[0, 0, 1], [-0.9, 0.25, 0.7], [0.95, 0.25, 0.72], [0.4, -0.35, 0.75], [-0.4, -0.25, 0.6]]; c.save(); c.beginPath(); for (const [dx, dy, r] of parts) { c.moveTo(x + dx * s + r * s, y + dy * s); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); } c.lineWidth = lw * 2; c.strokeStyle = NAVY; c.stroke(); c.fillStyle = "#fff"; c.fill(); c.restore(); }
  function hill(c, w, h, top, amp, phase, light, dark, lw) { c.beginPath(); c.moveTo(-10, h + 10); c.lineTo(-10, top); for (let x = -10; x <= w + 10; x += 8) c.lineTo(x, top - Math.sin(x / w * Math.PI * 1.2 + phase) * amp); c.lineTo(w + 10, h + 10); c.closePath(); const g = c.createLinearGradient(0, top - amp, 0, h); g.addColorStop(0, light); g.addColorStop(1, dark); c.fillStyle = g; c.fill(); c.lineWidth = lw; c.strokeStyle = NAVY; c.lineJoin = "round"; c.stroke(); }
  function flower(c, x, y, s, col, lw) { c.save(); c.lineWidth = lw; c.strokeStyle = NAVY; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.42, 0, 7); c.fillStyle = col; c.fill(); c.stroke(); } c.beginPath(); c.arc(x, y, s * 0.36, 0, 7); c.fillStyle = "#ffd000"; c.fill(); c.stroke(); c.restore(); }
  function balloon(c, x, y, rx, col, lw) { c.save(); const ry = rx * 1.18; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); const g = c.createRadialGradient(x - rx * 0.35, y - ry * 0.4, rx * 0.1, x, y, rx * 1.2); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); c.fillStyle = g; c.fill(); c.lineWidth = lw; c.strokeStyle = NAVY; c.stroke(); c.beginPath(); c.moveTo(x - rx * 0.16, y + ry + rx * 0.16); c.lineTo(x, y + ry - 2); c.lineTo(x + rx * 0.16, y + ry + rx * 0.16); c.closePath(); c.fillStyle = col[1]; c.fill(); c.stroke(); c.beginPath(); c.ellipse(x - rx * 0.38, y - ry * 0.42, rx * 0.16, rx * 0.26, -0.5, 0, 7); c.fillStyle = "rgba(255,255,255,0.75)"; c.fill(); c.restore(); return { x, y: y + ry + rx * 0.16 }; }
  function sparkle(c, x, y, s, col, lw) { c.save(); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? s * 0.38 : s; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = NAVY; c.lineJoin = "round"; c.stroke(); c.restore(); }
  function cardTile(c, img, x, y, w, rot, lw) { const h = w * img.height / img.width; c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = "rgba(46,65,104,0.25)"; c.beginPath(); c.roundRect(-w / 2 + 3, -h / 2 + 7, w, h, w * 0.12); c.fill(); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, w * 0.1); c.save(); c.clip(); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore(); c.lineWidth = lw; c.strokeStyle = NAVY; c.stroke(); c.restore(); }

  const res = {};
  // The 512 store-icon layout, painted 4x (2048) so the layers can be cut and scaled cleanly.
  const K = 4, S = 512 * K, lw = 7 * K;
  // 1) foreground group alone (balloons, Pip, top sparkle) on transparent
  const g = document.createElement("canvas"); g.width = g.height = S; const gc = g.getContext("2d");
  const k1 = balloon(gc, 118 * K, 190 * K, 48 * K, ["#ff8a8a", "#ff2a2a"], lw * 0.8);
  const k2 = balloon(gc, 394 * K, 176 * K, 44 * K, ["#8fb4ff", "#2f6bff"], lw * 0.8);
  pip(gc, 256 * K, 236 * K, 96 * K, 0, { cheer: 0.85, strings: [k1, k2] });
  sparkle(gc, 254 * K, 74 * K, 22 * K, "#fff6b0", 3.5 * K);
  // tightest circle around every opaque pixel (centre = bbox middle, then a few refining steps)
  const d = gc.getImageData(0, 0, S, S).data; const pts = [];
  let x0 = S, y0 = S, x1 = 0, y1 = 0;
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (d[(y * S + x) * 4 + 3] > 8) { pts.push(x, y); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const far = () => { let m = 0, fx = 0, fy = 0; for (let i = 0; i < pts.length; i += 2) { const dd = (pts[i] - cx) ** 2 + (pts[i + 1] - cy) ** 2; if (dd > m) { m = dd; fx = pts[i]; fy = pts[i + 1]; } } return [Math.sqrt(m), fx, fy]; };
  for (let it = 0; it < 400; it++) { const [r, fx, fy] = far(); const step = 0.02 * (1 - it / 400); cx += (fx - cx) * step; cy += (fy - cy) * step; }
  const [R] = far();
  // 2) layers on a 108 dp canvas, master size 1080 px (10 px per dp). Safe zone: 66 dp circle (r 330 px).
  const M = 1080, SAFE = 33 * 10 - 6; // a 0.6 dp margin inside the safe circle
  const sc = SAFE / R, ox = M / 2 - cx * sc, oy = M / 2 - cy * sc; // temp -> layer
  const T = (x, y) => [ox + x * sc, oy + y * sc];
  const fg = document.createElement("canvas"); fg.width = fg.height = M; const fc = fg.getContext("2d");
  fc.imageSmoothingQuality = "high"; fc.drawImage(g, ox, oy, S * sc, S * sc);
  res.fg = fg.toDataURL("image/png");
  // background: sky, the hill at the same height under Pip as in the store icon, flowers and two sparkles
  const bg = document.createElement("canvas"); bg.width = bg.height = M; const bc = bg.getContext("2d");
  const u = sc * K; // store-icon px -> layer px
  sky(bc, M, M);
  const [, hy] = T(0, 420 * K);
  hill(bc, M, M, hy, 26 * u, 0.6, "#7ad35c", "#36a83e", 7 * u);
  const fl = (x, y, s, col) => { const [X, Y] = T(x * K, y * K); flower(bc, X, Y, s * u, col, 3.5 * u); };
  fl(150, 436, 15, "#ff4d93"); fl(364, 442, 14, "#a64bff");
  const sp = (x, y, s) => { const [X, Y] = T(x * K, y * K); sparkle(bc, X, Y, s * u, "#ffffff", 3 * u); };
  sp(70, 330, 13); sp(446, 320, 12);
  res.bg = bg.toDataURL("image/png");
  res.info = { R, cx, cy, sc, hy, safePx: SAFE };
  return res;
});
for (const k of ["fg", "bg"]) writeFileSync(`_raw/layer_${k}.png`, Buffer.from(out[k].split(",")[1], "base64"));
console.log(JSON.stringify(out.info));
await b.close();
