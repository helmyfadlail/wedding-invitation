/**
 * Turns the raw artwork in ./reference into web-ready graphics in ./public/assets.
 *
 *   node tools/build-assets.mjs          (or: npm run assets)
 *
 * What it does, and why:
 *  - trims the transparent margin off every cut-out, so a graphic's image box
 *    equals what you actually see. Layout percentages in src/data/layout.ts are
 *    therefore the real positions of the artwork, not of invisible padding.
 *  - downscales to at most MAX_W (the invitation column is <=480 CSS px, so
 *    960px covers a 2x display) and re-encodes to WebP.
 *  - re-encodes the 50 MB photobooth GIF as a looping mp4/webm, plus a poster
 *    frame and the six stills the lightbox opens.
 *  - writes src/data/asset-manifest.json (intrinsic sizes -> no layout shift).
 *
 * Re-run it any time the couple swaps a photo in ./reference.
 */
import { createCanvas, loadImage } from "@napi-rs/canvas";
import ffmpeg from "ffmpeg-static";
import { parseGIF, decompressFrames } from "gifuct-js";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REF = path.join(ROOT, "reference");
const OUT = path.join(ROOT, "public", "assets");
const MANIFEST = path.join(ROOT, "src", "data", "asset-manifest.json");

/** dest (without extension) -> source, plus per-asset overrides. */
const ASSETS = [
  // ---------- cover: PDF page 1 ----------
  ["cover/bg-garden", "cover/background depan.jpeg", { trim: false, maxW: 1600, q: 78 }],
  // The lace card ships as flat greyscale; the printed design warms it to cream.
  ["cover/lace-card", "cover/bg text cover.png", { tint: [1.171, 1.142, 1.071] }],
  ["cover/txt-youre-invited", "cover/youre invited cover(text).png"],
  ["cover/txt-helmy", "cover/helmy (text).png"],
  ["cover/txt-amp", "cover/& (text).png"],
  ["cover/txt-safira", "cover/Safira cover (text).png"],
  ["cover/txt-wedding", "cover/wedding cover (text).png"],
  ["cover/txt-click-to-open", "cover/click to open (text).png"],
  ["cover/btn-open", "cover/button click.png"],

  // ---------- section backgrounds ----------
  ["bg/cream", "main/background putih.png", { trim: false, maxW: 1400, q: 74 }],
  ["bg/maroon", "main/background merah.png", { trim: false, maxW: 1400, q: 74 }],

  // ---------- 1. opening collage ----------
  ["hero/envelope", "main/slide 1/amplop .png"],
  ["hero/name-badge", "main/slide 1/helmy & safira.png"],
  ["hero/vinyl", "main/slide 1/play music.png"],
  ["hero/photo-small", "main/slide 1/foto kecil HS.png"],
  ["hero/photo-large", "main/slide 1/foto besar.png"],

  // ---------- 2. Ar-Rum 21 ----------
  ["verse/ar-rum-21", "main/slide 2/Ar-Rum  21.png"],
  ["verse/bismillah", "main/slide 2/bismillah.png"],
  ["verse/txt-memohon-rahmat", "main/slide 2/dengan memohon rahmat (text).png"],

  // ---------- 3. bride & groom ----------
  ["couple/txt-bride-and-groom", "main/slide 3/bride & groom (text) (1).png"],
  ["couple/pill-frame", "main/slide 3/frame bride & groom.png"],
  ["couple/photo-bride", "main/slide 3/foto fira cantik.png"],
  ["couple/photo-groom", "main/slide 3/foto helmy sayang.png"],
  // The exported parent-name PNGs break their lines differently from the print
  // layout, so CoupleSection sets those two blocks as web type instead. Nothing
  // consumes the graphics, so they are not built.
  ["couple/rings", "main/slide 3/cincin  icon.png"],
  ["couple/flower-bride", "main/slide 3/bunga bride.png"],
  ["couple/flower-groom", "main/slide 3/bunga groom.png"],
  ["couple/flower-bottom", "main/slide 3/bunga bawah.png"],

  // ---------- 4/5. save the date + schedule ----------
  ["date/frame-timer", "main/slide 4/frame timer.png"],
  ["date/garland-white", "main/slide 4/love line.png"],
  ["date/txt-save-the-date", "main/slide 4/save the date (text).png"],
  ["date/txt-oktober", "main/slide 4/oktober (text).png"],
  // The two calendar-row PNGs were re-laid-out at different scales, which knocks
  // "24" out from under "Sat"; SaveTheDateSection uses a seven-column grid of
  // web type instead, so they are not built either.
  ["date/frame-oval", "main/slide 4/frame jadwal.png"],
  ["date/txt-akad-nikah", "main/slide 4/akad nikah (text).png"],
  ["date/txt-akad-date", "main/slide 4/akad jadwal (text).png"],
  ["date/txt-akad-time", "main/slide 4/jam akad (text).png"],
  ["date/txt-resepsi", "main/slide 4/resepsi (text).png"],
  ["date/txt-resepsi-date", "main/slide 4/resepsi jadwal (text).png"],
  ["date/txt-resepsi-time", "main/slide 4/resepsi jam (text).png"],
  ["date/txt-lokasi", "main/slide 4/lokasi (text).png"],
  ["date/btn-lihat-lokasi", "main/slide 4/lihat lokasi button.png"],

  // ---------- 6/7. story + gallery ----------
  // story/photo-story is composited from a frame + a photo — see processStoryPhoto.
  ["story/txt-our-love-story", "main/slide 5/our love story (text).png"],
  ["story/badge-story", "main/slide 5/story (text).png"],
  ["story/txt-our-gallery", "main/slide 5/our gallery (text).png"],
  ["story/garland-maroon", "main/slide 5/love curtain.png"],

  // ---------- 9. closing ----------
  ["closing/photo-frame", "main/slide 6/foto penutup.png"],
  ["closing/txt-kata-penutup", "main/slide 6/kata penutup.png"],
  ["closing/txt-wassalam", "main/slide 6/wassalam.png"],
];

const GIF_SRC = "main/slide 5/Helmy & Safira (1).gif";
const MAX_W = 960;
const QUALITY = 86;
/** The strip is drawn ~312 CSS px wide, so 600 covers a 2x screen. */
const STRIP_VIDEO_W = 600;

const manifest = {};
let bytesIn = 0;
let bytesOut = 0;

const ctxOf = (w, h) => {
  const cv = createCanvas(w, h);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return [cv, ctx];
};

/** Bounding box of pixels with alpha above `threshold`. */
function alphaBounds(ctx, w, h, threshold = 8) {
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Short content hash, recorded in the manifest and appended to the URL as `?v=`.
 *
 * Vite fingerprints what it bundles, but /public is copied through verbatim —
 * so swapping a photo leaves the URL identical and every guest who has already
 * opened the invitation keeps seeing the old one out of cache. Hashing the
 * bytes here means a changed file is a changed URL, and an unchanged file still
 * caches for as long as the host allows.
 */
const version = (buffer) => createHash("sha256").update(buffer).digest("hex").slice(0, 8);

async function emit(dest, buffer, w, h) {
  const file = path.join(OUT, `${dest}.webp`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
  manifest[`${dest}.webp`] = { w, h, v: version(buffer) };
  bytesOut += buffer.length;
  return buffer.length;
}

/** Per-channel multiply, used to warm greyscale artwork to the design's cream. */
function applyTint(ctx, w, h, [tr, tg, tb]) {
  const frame = ctx.getImageData(0, 0, w, h);
  const d = frame.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = Math.min(255, Math.round(d[i] * tr));
    d[i + 1] = Math.min(255, Math.round(d[i + 1] * tg));
    d[i + 2] = Math.min(255, Math.round(d[i + 2] * tb));
  }
  ctx.putImageData(frame, 0, 0);
}

async function processAsset([dest, src, opts = {}]) {
  const { trim = true, maxW = MAX_W, q = QUALITY, tint } = opts;
  const from = path.join(REF, src);
  bytesIn += (await fs.stat(from)).size;

  const img = await loadImage(from);
  const [full, fctx] = ctxOf(img.width, img.height);
  fctx.drawImage(img, 0, 0);

  const box = trim ? alphaBounds(fctx, img.width, img.height) : { x: 0, y: 0, w: img.width, h: img.height };

  const scale = Math.min(1, maxW / box.w);
  const w = Math.max(1, Math.round(box.w * scale));
  const h = Math.max(1, Math.round(box.h * scale));
  const [cv, ctx] = ctxOf(w, h);
  ctx.drawImage(full, box.x, box.y, box.w, box.h, 0, 0, w, h);
  if (tint) applyTint(ctx, w, h, tint);

  const size = await emit(dest, cv.toBuffer("image/webp", q), w, h);
  console.log(
    `${dest.padEnd(30)} ${String(img.width).padStart(4)}x${String(img.height).padEnd(4)}` +
      ` -> ${String(w).padStart(4)}x${String(h).padEnd(4)} ${(size / 1024).toFixed(0).padStart(4)} KB` +
      (trim && (box.w !== img.width || box.h !== img.height) ? "  (trimmed)" : ""),
  );
}

/**
 * Rebuilds the photobooth strip as a looping video.
 *
 * The strip is a *live* photo booth: all six cells move at once, and a single
 * still throws that away. The GIF itself cannot ship — 50 MB for two seconds —
 * so the frames are re-encoded as H.264 and VP9 at the size the strip is
 * actually drawn (~312 CSS px wide, so 600px covers a 2x screen). That is the
 * same motion at roughly a two-hundredth of the bytes.
 *
 * Both codecs are written because iOS below 17.4 has no VP9: the <video> tag
 * offers WebM first and falls back to MP4.
 */
async function encodeStripVideo(dir, count, fps) {
  const input = path.join(dir, "f-%03d.jpg");
  const common = ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", input, "-an"];

  const runs = [
    {
      dest: "story/photostrip.webm",
      // VP9 at crf 34 keeps the studio backdrop clean without banding.
      args: [...common, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-pix_fmt", "yuv420p"],
    },
    {
      dest: "story/photostrip.mp4",
      // yuv420p + faststart: the two things iOS refuses to play without.
      args: [...common, "-c:v", "libx264", "-preset", "slow", "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    },
  ];

  for (const { dest, args } of runs) {
    const file = path.join(OUT, dest);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await new Promise((resolve, reject) => {
      const child = spawn(ffmpeg, [...args, file], { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      child.stderr.on("data", (chunk) => (stderr += chunk));
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg (${dest}) exited ${code}\n${stderr}`))));
    });
    const bytes = (await fs.stat(file)).size;
    bytesOut += bytes;
    console.log(`${dest.padEnd(30)} ${count} frames @ ${fps}fps  ${(bytes / 1024).toFixed(0).padStart(4)} KB`);
  }
}

/**
 * The photobooth GIF is 60 frames of 900x1800 — 50 MB, unusable on mobile data.
 * It becomes a looping video (the animation the design intends), a poster frame
 * for the first paint, and the six stills the lightbox opens.
 */
async function processGif() {
  const from = path.join(REF, GIF_SRC);
  const raw = await fs.readFile(from);
  bytesIn += raw.byteLength;

  const gif = parseGIF(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  const frames = decompressFrames(gif, true);
  const frame = frames[0];
  const W = gif.lsd.width;
  const H = gif.lsd.height;

  const [strip, sctx] = ctxOf(W, H);
  const bitmap = sctx.createImageData(frame.dims.width, frame.dims.height);
  bitmap.data.set(frame.patch);
  sctx.putImageData(bitmap, frame.dims.left, frame.dims.top);

  // ---- the animation ----
  // Every frame repaints the whole canvas, so compositing is a straight
  // overwrite; each one is scaled down and handed to ffmpeg as a JPEG.
  const vw = STRIP_VIDEO_W;
  const vh = Math.round((H / W) * vw / 2) * 2; // H.264 needs even dimensions
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "photostrip-"));
  try {
    const [full, fctx] = ctxOf(W, H);
    const [small, mctx] = ctxOf(vw, vh);
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const patch = fctx.createImageData(f.dims.width, f.dims.height);
      patch.data.set(f.patch);
      fctx.putImageData(patch, f.dims.left, f.dims.top);
      mctx.drawImage(full, 0, 0, W, H, 0, 0, vw, vh);
      await fs.writeFile(path.join(dir, `f-${String(i + 1).padStart(3, "0")}.jpg`), small.toBuffer("image/jpeg", 93));
    }
    // Delays run 30/40/30 ms, i.e. three frames per 100 ms — exactly 30 fps.
    const mean = frames.reduce((sum, f) => sum + f.delay, 0) / frames.length;
    const fps = Math.max(1, Math.round(1000 / mean));
    await encodeStripVideo(dir, frames.length, fps);
    for (const dest of ["story/photostrip.webm", "story/photostrip.mp4"]) {
      manifest[dest] = { w: vw, h: vh, v: version(await fs.readFile(path.join(OUT, dest))) };
    }
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }

  await emit("story/photostrip", strip.toBuffer("image/webp", 84), W, H);
  console.log(`story/photostrip              ${W}x${H} (from ${(raw.byteLength / 1024 / 1024).toFixed(1)} MB GIF)`);

  // The maroon mount is strongly red-dominant; the studio backdrop is not.
  // Columns/rows of *low* mount coverage are therefore the photo cells.
  const d = sctx.getImageData(0, 0, W, H).data;
  const isMount = (x, y) => {
    const i = (y * W + x) * 4;
    const r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    return r > 45 && r < 120 && r > g * 2 && r > b * 1.9;
  };
  const lowBands = (len, coverage, minRun) => {
    const out = [];
    let start = -1;
    for (let i = 0; i < len; i++) {
      if (coverage(i) < 0.55) {
        if (start < 0) start = i;
      } else {
        if (start >= 0 && i - start >= minRun) out.push([start, i]);
        start = -1;
      }
    }
    if (start >= 0 && len - start >= minRun) out.push([start, len]);
    return out;
  };
  const colCoverage = (x) => {
    let k = 0,
      n = 0;
    for (let y = 120; y < H - 200; y += 4, n++) if (isMount(x, y)) k++;
    return k / n;
  };
  const rowCoverage = (y) => {
    let k = 0,
      n = 0;
    for (let x = 40; x < W - 40; x += 4, n++) if (isMount(x, y)) k++;
    return k / n;
  };
  const cols = lowBands(W, colCoverage, 200);
  const rows = lowBands(H, rowCoverage, 200);

  let n = 0;
  for (const [y0, y1] of rows) {
    for (const [x0, x1] of cols) {
      n++;
      const w = x1 - x0,
        h = y1 - y0;
      const [cv, ctx] = ctxOf(w, h);
      ctx.drawImage(strip, x0, y0, w, h, 0, 0, w, h);
      await emit(`story/photo-${n}`, cv.toBuffer("image/webp", QUALITY), w, h);
    }
  }
  console.log(`story/photo-1..${n}            ${cols.length} x ${rows.length} cells detected`);
  if (n !== 6) console.warn(`  ! expected 6 photo cells, got ${n} — check the GIF layout`);
}

/**
 * Slide 6's photo, built from two pieces the couple supplied separately: a lace
 * frame and the photograph that goes in it.
 *
 * The frame arrived as a JPEG, so its transparency is painted black — the
 * surround, the eyelet holes punched through the lace, and the window itself.
 * Keying every black pixel out gives the frame back its alpha; the *window*
 * then has to be told apart from the rest, and it is simply the largest black
 * region that does not touch the edge of the canvas. The photograph is clipped
 * to exactly that region, so it fills the window without leaking through the
 * eyelets or past the scalloped edge.
 */
const STORY_PHOTO = {
  frame: "frame-photo-story.jpeg",
  photo: "photo-story.jpg",
  /** Below this a pixel counts as "painted black", i.e. meant to be see-through. */
  black: 34,
  /**
   * The point of the photograph that lands in the middle of the window. The
   * source is portrait and the window is landscape, so only the vertical share
   * really matters: 0.63 keeps the couple whole, with the watermark below the
   * crop and a little headroom above.
   */
  focus: { x: 0.5, y: 0.63 },
};

/** Luma, as a 0..255 grey. */
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Every black pixel reachable from the canvas edge — the surround, but not the
 * window and not the eyelets. Iterative flood fill: the frame is 1.4M pixels
 * and a recursive one blows the stack.
 */
function outsideMask(dark, w, h) {
  const outside = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) {
    stack.push(x, x + (h - 1) * w);
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    if (outside[i] || !dark[i]) continue;
    outside[i] = 1;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  return outside;
}

/** The largest black region that is not the surround: the photo window. */
function windowMask(dark, outside, w, h) {
  const seen = new Uint8Array(w * h);
  let best = null;
  for (let start = 0; start < dark.length; start++) {
    if (!dark[start] || outside[start] || seen[start]) continue;
    const region = [];
    const stack = [start];
    seen[start] = 1;
    let x0 = w,
      y0 = h,
      x1 = -1,
      y1 = -1;
    while (stack.length) {
      const i = stack.pop();
      region.push(i);
      const x = i % w;
      const y = (i - x) / w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && dark[j] && !outside[j] && !seen[j]) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (!best || region.length > best.pixels.length) best = { pixels: region, box: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } };
  }
  return best;
}

async function processStoryPhoto() {
  const framePath = path.join(REF, STORY_PHOTO.frame);
  const photoPath = path.join(REF, STORY_PHOTO.photo);
  bytesIn += (await fs.stat(framePath)).size + (await fs.stat(photoPath)).size;

  const frameImg = await loadImage(framePath);
  const W = frameImg.width;
  const H = frameImg.height;
  const [frame, fctx] = ctxOf(W, H);
  fctx.drawImage(frameImg, 0, 0);

  const px = fctx.getImageData(0, 0, W, H);
  const dark = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < px.data.length; i += 4, p++) {
    if (luma(px.data[i], px.data[i + 1], px.data[i + 2]) < STORY_PHOTO.black) dark[p] = 1;
  }

  const region = windowMask(dark, outsideMask(dark, W, H), W, H);
  if (!region) throw new Error("story photo: no window found inside the frame");
  const box = region.box;

  // ---- the frame: painted black becomes alpha again, on a short ramp so the
  // lace keeps a soft edge instead of a stair-stepped one ----
  for (let i = 0; i < px.data.length; i += 4) {
    const value = luma(px.data[i], px.data[i + 1], px.data[i + 2]);
    px.data[i + 3] = Math.round(255 * Math.min(1, Math.max(0, (value - 6) / (STORY_PHOTO.black - 6))));
  }
  fctx.putImageData(px, 0, 0);

  const trim = alphaBounds(fctx, W, H);
  const scale = Math.min(1, MAX_W / trim.w);
  const fw = Math.round(trim.w * scale);
  const fh = Math.round(trim.h * scale);
  const [framed, framedCtx] = ctxOf(fw, fh);
  framedCtx.drawImage(frame, trim.x, trim.y, trim.w, trim.h, 0, 0, fw, fh);
  const frameBytes = await emit("story/frame-story", framed.toBuffer("image/webp", QUALITY), fw, fh);

  // ---- the photograph, cropped to the window's shape but kept as its own file
  // so the two can be layered (and swapped) in the markup ----
  const photoImg = await loadImage(photoPath);
  const cover = Math.max(box.w / photoImg.width, box.h / photoImg.height);
  const sw = box.w / cover;
  const sh = box.h / cover;
  const sx = Math.min(Math.max(0, photoImg.width * STORY_PHOTO.focus.x - sw / 2), photoImg.width - sw);
  const sy = Math.min(Math.max(0, photoImg.height * STORY_PHOTO.focus.y - sh / 2), photoImg.height - sh);
  const [photo, photoCtx] = ctxOf(box.w, box.h);
  photoCtx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, box.w, box.h);
  const photoBytes = await emit("story/photo-story", photo.toBuffer("image/webp", QUALITY), box.w, box.h);

  // ---- where the window sits, as a share of the trimmed frame ----
  // These four numbers are what STORY_WINDOW in src/data/layout.ts holds; the
  // photo is positioned against them in CSS rather than baked into the frame.
  const pct = (n) => Number(n.toFixed(2));
  const window = {
    x: pct(((box.x - trim.x) / trim.w) * 100),
    y: pct(((box.y - trim.y) / trim.h) * 100),
    w: pct((box.w / trim.w) * 100),
    h: pct((box.h / trim.h) * 100),
  };
  const rectangular = region.pixels.length === box.w * box.h;

  console.log(`story/frame-story             ${W}x${H} -> ${fw}x${fh}  ${(frameBytes / 1024).toFixed(0)} KB  (black keyed to alpha)`);
  console.log(`story/photo-story             ${photoImg.width}x${photoImg.height} -> ${box.w}x${box.h}  ${(photoBytes / 1024).toFixed(0)} KB`);
  console.log(`  window ${JSON.stringify(window)}  ${rectangular ? "rectangular" : "NOT rectangular — CSS box will not match exactly"}`);
  console.log(`  -> paste into STORY_WINDOW in src/data/layout.ts`);
}

/**
 * The record on slide 1 is one image: flowers *and* disc. Spinning it would
 * spin the flowers, so we also emit the disc on its own — a circle taken from
 * inside the record, feathered at the rim — to rotate on top of the original.
 * The grooves are concentric, so the join is invisible.
 *
 * Geometry measured on hero/vinyl.webp (925x891): the disc is 648px across,
 * centred at (496, 582), and its bottom touches the trimmed edge. We take
 * r = 300 so the crop stays fully inside the artwork.
 */
const VINYL_DISC = { cx: 496, cy: 582, r: 300, feather: 4 };

async function processVinylDisc() {
  const vinyl = await loadImage(path.join(OUT, "hero/vinyl.webp"));
  const { cx, cy, r, feather } = VINYL_DISC;
  const size = r * 2;

  const [cv, ctx] = ctxOf(size, size);
  ctx.drawImage(vinyl, cx - r, cy - r, size, size, 0, 0, size, size);

  // Feathered circular mask, so the rotating copy melts into the static disc.
  const frame = ctx.getImageData(0, 0, size, size);
  const d = frame.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - r + 0.5, y - r + 0.5);
      const edge = r - dist;
      const k = edge >= feather ? 1 : edge <= 0 ? 0 : edge / feather;
      const i = (y * size + x) * 4;
      d[i + 3] = Math.round(d[i + 3] * k);
    }
  }
  ctx.putImageData(frame, 0, 0);

  const bytes = await emit("hero/vinyl-disc", cv.toBuffer("image/webp", 88), size, size);
  console.log(`hero/vinyl-disc               ${size}x${size}  ${(bytes / 1024).toFixed(0)} KB  (spins on top of the record)`);
}

/** Favicon + WhatsApp share image, both derived from the artwork. */
async function processSocial() {
  // Favicon: the HS wax seal from the envelope flap, on a wine disc.
  const env = await loadImage(path.join(OUT, "hero/envelope.webp"));
  const seal = { x: 392, y: 375, w: 190, h: 190 };
  const [fav, fctx] = ctxOf(256, 256);
  fctx.fillStyle = "#3b0d11";
  fctx.fillRect(0, 0, 256, 256);
  fctx.drawImage(env, seal.x, seal.y, seal.w, seal.h, 0, 0, 256, 256);
  const favBuf = fav.toBuffer("image/png");
  await fs.writeFile(path.join(ROOT, "public", "favicon.png"), favBuf);
  bytesOut += favBuf.length;
  console.log(`favicon.png                   256x256  ${(favBuf.length / 1024).toFixed(0)} KB`);

  // Share card: the cover artwork, letterboxed to 1200x630. Built from the
  // processed assets so it picks up the cream tint on the lace card.
  const garden = await loadImage(path.join(OUT, "cover/bg-garden.webp"));
  const card = await loadImage(path.join(OUT, "cover/lace-card.webp"));
  const [og, octx] = ctxOf(1200, 630);
  const cover = Math.max(1200 / garden.width, 630 / garden.height);
  octx.drawImage(garden, (1200 - garden.width * cover) / 2, (630 - garden.height * cover) / 2, garden.width * cover, garden.height * cover);
  const ch = 520;
  const cw = (card.width / card.height) * ch;
  octx.drawImage(card, (1200 - cw) / 2, (630 - ch) / 2, cw, ch);
  for (const [name, y, h] of [
    ["cover/txt-youre-invited.webp", 176, 30],
    ["cover/txt-helmy.webp", 218, 78],
    ["cover/txt-amp.webp", 300, 32],
    ["cover/txt-safira.webp", 336, 86],
    ["cover/txt-wedding.webp", 428, 30],
  ]) {
    const t = await loadImage(path.join(OUT, name));
    const tw = (t.width / t.height) * h;
    octx.drawImage(t, (1200 - tw) / 2, y, tw, h);
  }
  const ogBuf = og.toBuffer("image/jpeg", 84);
  await fs.writeFile(path.join(ROOT, "public", "og-image.jpg"), ogBuf);
  bytesOut += ogBuf.length;
  console.log(`og-image.jpg                  1200x630 ${(ogBuf.length / 1024).toFixed(0)} KB`);
}

await fs.rm(OUT, { recursive: true, force: true });
for (const entry of ASSETS) await processAsset(entry);
await processGif();
await processStoryPhoto();
await processVinylDisc();
await processSocial();

await fs.writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `\n${Object.keys(manifest).length} graphics · ` +
    `${(bytesIn / 1024 / 1024).toFixed(1)} MB source -> ${(bytesOut / 1024 / 1024).toFixed(2)} MB web ` +
    `(${(100 - (bytesOut / bytesIn) * 100).toFixed(1)}% smaller)`,
);
console.log(`manifest -> ${path.relative(ROOT, MANIFEST)}`);
