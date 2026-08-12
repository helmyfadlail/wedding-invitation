/**
 * Renders src/data/layout.ts as flat images and stacks each one next to the
 * matching slide from the PDF, so layout drift is visible at a glance.
 *
 *   node tools/preview-layout.mjs         (or: npm run layout:preview)
 *
 * Output: tools/.preview/slide-N.png  (design | reconstruction)
 *
 * It only draws artwork — live text, the countdown and the RSVP form are the
 * app's job — so expect gaps where those belong.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SLIDE, HERO, HERO_VINYL, VERSE, COUPLE, SEAM_BOUQUET, SAVE_THE_DATE, SCHEDULE, MAP_BUTTON, STORY, GALLERY, PHOTOSTRIP, CLOSING } from "../src/data/layout.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "public", "assets");
const REFPAGE = process.argv[2] ?? path.join(ROOT, "tools", ".preview", "pdf-page2.png");
const OUTDIR = path.join(ROOT, "tools", ".preview");

/** slide index (0-based) -> [background, pieces] */
const SLIDES = [
  ["cream", HERO.concat(HERO_VINYL)],
  ["maroon", VERSE],
  ["cream", COUPLE],
  ["maroon", SAVE_THE_DATE.concat(SEAM_BOUQUET)],
  ["maroon", SCHEDULE.concat(MAP_BUTTON)],
  ["cream", STORY],
  ["cream", GALLERY.concat({ src: "story/photostrip.webp", ...PHOTOSTRIP, z: 10 })],
  ["maroon", []], // RSVP is built from live markup
  ["maroon", CLOSING],
];

const SCALE = 1.6;
const W = Math.round(SLIDE.w * SCALE);
const H = Math.round(SLIDE.h * SCALE);

const load = (() => {
  const cache = new Map();
  return async (rel) => {
    if (!cache.has(rel)) cache.set(rel, await loadImage(path.join(ASSETS, rel)));
    return cache.get(rel);
  };
})();

async function renderSlide(bg, pieces) {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  const tex = await load(`bg/${bg}.webp`);
  const cover = Math.max(W / tex.width, H / tex.height);
  ctx.drawImage(tex, (W - tex.width * cover) / 2, (H - tex.height * cover) / 2, tex.width * cover, tex.height * cover);

  for (const p of [...pieces].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))) {
    const img = await load(p.src);
    const w = (p.w / 100) * W;
    const h = (img.height / img.width) * w;
    ctx.drawImage(img, (p.x / 100) * W, (p.y / 100) * H, w, h);
  }
  return cv;
}

await fs.mkdir(OUTDIR, { recursive: true });

let page = null;
try {
  page = await loadImage(REFPAGE);
} catch {
  console.warn(`(no reference render at ${path.relative(ROOT, REFPAGE)} — writing reconstructions only)`);
}

/** |a - b|, gained up so a few pixels of drift are impossible to miss. */
function differenceOf(a, b) {
  const cv = createCanvas(W, H);
  const ctx = cv.getContext("2d");
  const da = a.getContext("2d").getImageData(0, 0, W, H);
  const db = b.getContext("2d").getImageData(0, 0, W, H);
  const out = ctx.createImageData(W, H);
  for (let i = 0; i < out.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      out.data[i + c] = Math.min(255, Math.abs(da.data[i + c] - db.data[i + c]) * 3);
    }
    out.data[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return cv;
}

for (const [i, [bg, pieces]] of SLIDES.entries()) {
  const mine = await renderSlide(bg, pieces);
  const pad = 24;
  const panels = [];

  if (page) {
    const slideH = page.height / SLIDES.length;
    const ref = createCanvas(W, H);
    ref.getContext("2d").imageSmoothingQuality = "high";
    ref.getContext("2d").drawImage(page, 478, i * slideH, 494, slideH, 0, 0, W, H);
    panels.push(["design (PDF)", ref], ["reconstruction", mine], ["difference x3", differenceOf(ref, mine)]);
  } else {
    panels.push(["reconstruction", mine]);
  }

  const out = createCanvas(W * panels.length + pad * (panels.length + 1), H + pad * 2 + 30);
  const o = out.getContext("2d");
  o.fillStyle = "#101010";
  o.fillRect(0, 0, out.width, out.height);
  panels.forEach(([label, cv], k) => {
    const x = pad + k * (W + pad);
    o.drawImage(cv, x, pad);
    o.fillStyle = "#aaa";
    o.font = "16px sans-serif";
    o.fillText(label, x, pad + H + 20);
  });

  await fs.writeFile(path.join(OUTDIR, `slide-${i + 1}.png`), out.toBuffer("image/png"));
  console.log(`slide-${i + 1}.png  ${bg.padEnd(6)} ${pieces.length} pieces`);
}
console.log(`\n-> ${path.relative(ROOT, OUTDIR)}`);
