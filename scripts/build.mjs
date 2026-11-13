import * as esbuild from "esbuild";

// combined-preview: the c12 wiring (Fish Nets, pots and Shape Box on the painted 2D stage) now
// lives in the app source (see review/combined-src.patch), so the main bundle is built by Vite
// from that source and is no longer string-patched here. This script only bundles c12/.
await esbuild.build({
  entryPoints: ["c12/boot.js"],
  outfile: "assets/c12.js",
  bundle: true,
  format: "esm",
  minify: true,
  target: "es2022",
  legalComments: "none",
});

console.log("built assets/c12.js");
