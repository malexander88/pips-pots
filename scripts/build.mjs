import { createHash } from "node:crypto";
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import * as esbuild from "esbuild";

// The main spa bundle is produced by the app source build (see review/combined-src.patch)
// and already has a content hash. This step only bundles the painted modes, under a fresh hash.
const result = await esbuild.build({
  entryPoints: ["c12/boot.js"],
  bundle: true,
  format: "esm",
  minify: true,
  target: "es2022",
  legalComments: "none",
  write: false,
});
const js = result.outputFiles[0].text;
const hash = createHash("sha256").update(js).digest("hex").slice(0, 8);
const name = `c12-${hash}.js`;
for (const file of readdirSync("assets")) {
  if (/^c12(-[A-Za-z0-9]+)?\.js$/.test(file)) unlinkSync(`assets/${file}`);
}
writeFileSync(`assets/${name}`, js);
for (const html of ["index.html", "spa.html"]) {
  const text = readFileSync(html, "utf8").replace(
    /\/pips-pots\/assets\/c12(?:-[A-Za-z0-9]+)?\.js/g,
    `/pips-pots/assets/${name}`,
  );
  writeFileSync(html, text);
}
console.log(`built assets/${name}`);
