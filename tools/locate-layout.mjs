/**
 * Measures where each cut-out belongs by template-matching it against a render
 * of the source PDF, and prints the numbers in the shape src/data/layout.ts
 * wants. Use it when the artwork changes; use tools/preview-layout.mjs to check
 * the result.
 *
 *   node tools/locate-layout.mjs tools/.preview/pdf-page2.png
 *
 * How it works: an asset placed correctly covers pixels identical to itself, so
 * the mean |difference| over its opaque pixels bottoms out at the true spot. A
 * 3-level pyramid keeps the search affordable, and candidates must sit almost
 * entirely inside the column — without that, a tile hanging off the edge wins
 * by comparing almost nothing.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "public", "assets");
const PAGE = process.argv[2] ?? path.join(ROOT, "tools", ".preview", "pdf-page2.png");

/** The portrait column inside the 1434px-wide artwork. */
const COL_X = 478;
const COL_W = 494;
const SLIDES = 9;

/** [asset, slide (0-based), minW%, maxW%, yFrom, yTo]  — y in slide fractions. */
const SPEC = [
  ["hero/envelope.webp", 0, 45, 70, -0.05, 0.3],
  ["hero/vinyl.webp", 0, 38, 58, 0.05, 0.4],
  ["hero/name-badge.webp", 0, 48, 70, 0.15, 0.45],
  ["hero/photo-small.webp", 0, 22, 38, 0.32, 0.6],
  ["hero/photo-large.webp", 0, 52, 74, 0.5, 0.8],

  ["verse/ar-rum-21.webp", 1, 78, 95, -0.02, 0.15],
  ["verse/bismillah.webp", 1, 70, 95, 0.58, 0.8],
  ["verse/txt-memohon-rahmat.webp", 1, 80, 100, 0.72, 0.92],

  ["couple/pill-frame.webp", 2, 76, 95, 0.0, 0.15],
  ["couple/txt-bride-and-groom.webp", 2, 42, 62, 0.05, 0.2],
  ["couple/flower-bride.webp", 2, 12, 28, 0.12, 0.3],
  ["couple/photo-bride.webp", 2, 36, 50, 0.15, 0.3],
  ["couple/rings.webp", 2, 18, 32, 0.4, 0.56],
  ["couple/flower-groom.webp", 2, 16, 30, 0.4, 0.6],
  ["couple/photo-groom.webp", 2, 36, 50, 0.5, 0.68],
  ["couple/flower-bottom.webp", 2, 36, 54, 0.82, 1.0],

  ["date/frame-timer.webp", 3, 84, 100, 0.05, 0.22],
  ["date/garland-white.webp", 3, 88, 100, 0.34, 0.5],
  ["date/txt-save-the-date.webp", 3, 72, 92, 0.48, 0.62],
  ["date/txt-oktober.webp", 3, 34, 52, 0.63, 0.78],

  ["date/frame-oval.webp", 4, 86, 100, -0.02, 0.14, "akad"],
  ["date/txt-akad-nikah.webp", 4, 44, 62, 0.08, 0.22],
  ["date/txt-akad-date.webp", 4, 52, 72, 0.16, 0.3],
  ["date/txt-akad-time.webp", 4, 38, 56, 0.22, 0.38],
  ["date/frame-oval.webp", 4, 86, 100, 0.38, 0.52, "resepsi"],
  ["date/txt-resepsi.webp", 4, 14, 30, 0.46, 0.6],
  ["date/txt-resepsi-date.webp", 4, 52, 72, 0.54, 0.68],
  ["date/txt-resepsi-time.webp", 4, 38, 56, 0.6, 0.75],
  ["date/txt-lokasi.webp", 4, 54, 74, 0.76, 0.9],
  ["date/btn-lihat-lokasi.webp", 4, 46, 66, 0.84, 0.98],

  ["story/txt-our-love-story.webp", 5, 62, 86, 0.0, 0.16],
  ["story/photo-story.webp", 5, 86, 100, 0.1, 0.26],
  ["story/badge-story.webp", 5, 86, 100, 0.5, 0.68],

  ["story/txt-our-gallery.webp", 6, 40, 60, -0.02, 0.12],
  ["story/garland-maroon.webp", 6, 88, 100, 0.02, 0.18],
  ["story/photostrip.webp", 6, 58, 76, 0.12, 0.3],

  ["closing/photo-frame.webp", 8, 68, 90, -0.02, 0.14],
  ["closing/txt-kata-penutup.webp", 8, 70, 92, 0.56, 0.74],
  ["closing/txt-wassalam.webp", 8, 78, 98, 0.8, 0.95],
];

const ctxOf = (w, h) => {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return [cv, ctx];
};

const page = await loadImage(PAGE);
const SLIDE_H = page.height / SLIDES;

const levels = [8, 4, 2].map((div) => {
  const w = Math.round(COL_W / div);
  const h = Math.round(page.height / div);
  const [, ctx] = ctxOf(w, h);
  ctx.drawImage(page, COL_X, 0, COL_W, page.height, 0, 0, w, h);
  return { div, w, h, data: ctx.getImageData(0, 0, w, h).data };
});

const cache = new Map();
async function tile(src, pxW) {
  const key = `${src}@${pxW}`;
  if (!cache.has(key)) {
    if (!cache.has(src)) cache.set(src, await loadImage(path.join(ASSETS, src)));
    const img = cache.get(src);
    const w = Math.max(1, pxW);
    const h = Math.max(1, Math.round((img.height / img.width) * pxW));
    const [, ctx] = ctxOf(w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let ink = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 200) ink++;
    cache.set(key, { w, h, data, ink });
  }
  return cache.get(key);
}

/**
 * Alpha-weighted mean |difference| over the tile's opaque pixels.
 * Returns Infinity unless most of that ink actually lands on the page — a tile
 * hanging off the edge must not win by comparing a handful of pixels.
 */
function score(level, t, ox, oy) {
  let sum = 0;
  let seen = 0;
  for (let y = 0; y < t.h; y++) {
    const py = oy + y;
    if (py < 0 || py >= level.h) continue;
    for (let x = 0; x < t.w; x++) {
      const ti = (y * t.w + x) * 4;
      const a = t.data[ti + 3];
      if (a <= 200) continue;
      const px = ox + x;
      if (px < 0 || px >= level.w) continue;
      const pi = (py * level.w + px) * 4;
      sum += Math.abs(t.data[ti] - level.data[pi]) + Math.abs(t.data[ti + 1] - level.data[pi + 1]) + Math.abs(t.data[ti + 2] - level.data[pi + 2]);
      seen++;
    }
  }
  if (seen < t.ink * 0.85 || seen < 24) return Infinity;
  return sum / (seen * 3);
}

async function locate([src, slide, minW, maxW, yFrom, yTo]) {
  const yTop = (slide + yFrom) * SLIDE_H;
  const yBot = (slide + yTo) * SLIDE_H;
  let best = [];

  for (const [li, level] of levels.entries()) {
    const next = [];
    const seeds = li === 0 ? [null] : best;
    for (const seed of seeds) {
      const wLo = seed ? seed[1] - 1.8 : minW;
      const wHi = seed ? seed[1] + 1.8 : maxW;
      const wStep = li === 0 ? 1.5 : li === 1 ? 0.5 : 0.15;
      for (let pct = wLo; pct <= wHi + 1e-9; pct += wStep) {
        const t = await tile(src, Math.round((pct / 100) * level.w));
        // Coarse pass sweeps the whole window; refinement nudges around a seed.
        const xs = seed ? span(Math.round((seed[2] / 100) * level.w) - 3, Math.round((seed[2] / 100) * level.w) + 3) : span(Math.round(-0.2 * level.w), Math.round(1.2 * level.w));
        const ys = seed ? span(Math.round(seed[3] / level.div) - 3, Math.round(seed[3] / level.div) + 3) : span(Math.round(yTop / level.div), Math.round(yBot / level.div));
        for (const oy of ys) {
          for (const ox of xs) {
            const s = score(level, t, ox, oy);
            if (s < Infinity) next.push([s, pct, (ox / level.w) * 100, oy * level.div]);
          }
        }
      }
    }
    next.sort((a, b) => a[0] - b[0]);
    best = next.slice(0, li === 0 ? 14 : 6);
    if (!best.length) return null;
  }

  const [err, pct, xPct, yAbs] = best[0];
  return {
    src,
    slide,
    err: +err.toFixed(1),
    w: +pct.toFixed(1),
    x: +xPct.toFixed(1),
    y: +(((yAbs - slide * SLIDE_H) / SLIDE_H) * 100).toFixed(1),
  };
}

/** Inclusive integer run from `a` to `b`. */
function span(a, b) {
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, k) => a + k);
}

console.log("asset                              slide      x        y        w     err");
console.log("-".repeat(76));
for (const spec of SPEC) {
  const r = await locate(spec);
  const tag = spec[6] ? ` [${spec[6]}]` : "";
  if (!r) {
    console.log(`${(spec[0] + tag).padEnd(36)} ${spec[1] + 1}   no candidate fit the window`);
    continue;
  }
  const flag = r.err > 40 ? "  <-- check: artwork may differ from the PDF" : "";
  console.log(`${(r.src + tag).padEnd(36)} ${r.slide + 1}  ${String(r.x).padStart(6)}%  ` + `${String(r.y).padStart(6)}%  ${String(r.w).padStart(5)}%  ${String(r.err).padStart(6)}${flag}`);
}
