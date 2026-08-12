/**
 * Renders "Helmy Safira.pdf" to PNG. The two layout tools compare the artwork
 * against this render, so it is the reference they both read.
 *
 *   node tools/render-pdf.mjs            (or: npm run layout:render)
 *
 * Writes tools/.preview/pdf-page1.png (the cover) and pdf-page2.png (the nine
 * stacked slides). That directory is gitignored — it holds generated proofs —
 * so run this once after cloning if you intend to touch src/data/layout.ts.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "Helmy Safira.pdf");
const OUTDIR = path.join(ROOT, "tools", ".preview");

let pdf;
try {
  ({ pdf } = await import("pdf-to-img"));
} catch {
  console.error("This tool needs pdf-to-img:\n\n  npm install -D pdf-to-img\n");
  process.exit(1);
}

try {
  await fs.access(SRC);
} catch {
  console.error(`Cannot find ${path.relative(ROOT, SRC)} — keep the source PDF at the project root.`);
  process.exit(1);
}

await fs.mkdir(OUTDIR, { recursive: true });

// scale 1.4 puts page 2 at 1434px wide, which is the artwork's own resolution:
// matching it 1:1 keeps template matching honest.
const doc = await pdf(SRC, { scale: 1.4 });
let page = 0;
for await (const image of doc) {
  page += 1;
  const file = path.join(OUTDIR, `pdf-page${page}.png`);
  await fs.writeFile(file, image);
  console.log(`pdf-page${page}.png  ${(image.length / 1024 / 1024).toFixed(1)} MB`);
}
console.log(`\n${page} page(s) -> ${path.relative(ROOT, OUTDIR)}`);
