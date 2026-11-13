import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

const spaPath = new URL("../assets/spa-B15tDkVP.js", import.meta.url);
let spa = readFileSync(spaPath, "utf8");

const patches = [
  [
    "function Qw(e,t){let n=Math.min(.05,t);",
    "function Qw(e,t){return;let n=Math.min(.05,t);",
  ],
  [
    "return(Q.mode===`piano`||Q.mode===`colouring`)&&Q.phase!==`menu`",
    "return(Q.mode===`piano`||Q.mode===`colouring`||Q.mode===`fish`||Q.mode===`levels`||Q.mode===`endless`||Q.mode===`shapebox`)&&Q.phase!==`menu`",
  ],
  [
    "dpr:l?1:u?tk():t",
    "dpr:l?1:(u||(Q.phase!==`menu`&&(Q.mode===`fish`||Q.mode===`levels`||Q.mode===`endless`||Q.mode===`shapebox`)))?tk():t",
  ],
  ["window.__pip=Q", "window.__pip=Q,window.__pipAudio=X"],
];

for (const [from, to] of patches) {
  if (spa.includes(to)) continue;
  if (!spa.includes(from)) {
    console.error("Patch target missing:\n" + from);
    process.exit(1);
  }
  spa = spa.replace(from, to);
}

writeFileSync(spaPath, spa);

await esbuild.build({
  entryPoints: ["c12/boot.js"],
  outfile: "assets/c12.js",
  bundle: true,
  format: "esm",
  minify: true,
  target: "es2022",
  legalComments: "none",
});

console.log("built assets/c12.js and patched the play shell");
