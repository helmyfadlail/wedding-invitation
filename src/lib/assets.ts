import manifest from "../data/asset-manifest.json";

/**
 * Graphics live in /public/assets so they can be swapped without a rebuild.
 * Paths go through `asset()` so the bundle stays portable when Vite's `base`
 * changes (domain root, a GitHub Pages sub-folder, or the filesystem).
 */
const BASE: string = import.meta.env.BASE_URL;

const root = (): string => BASE.replace(/\/?$/, "/");

/** Anything else served straight out of /public — the music track, mainly. */
export const publicUrl = (path: string): string => `${root()}${path.replace(/^\//, "")}`;

type Entry = { w: number; h: number; v?: string };
const ENTRIES = manifest as Record<string, Entry>;

/**
 * Graphics carry a `?v=` stamp of their own bytes, written by the asset build.
 * Vite fingerprints the files it bundles, but /public is copied through as-is,
 * so without this a swapped photo keeps its old URL and guests who have already
 * opened the invitation go on seeing the previous one out of cache.
 */
export const asset = (path: string): string => {
  const v = ENTRIES[path]?.v;
  return `${root()}assets/${path}${v ? `?v=${v}` : ""}`;
};

/** Intrinsic size, so <img> can reserve the right box and avoid layout shift. */
export const dim = (path: string): { w: number; h: number } | undefined => ENTRIES[path];

export const BG = {
  cream: "bg/cream.webp",
  maroon: "bg/maroon.webp",
} as const;

export const COVER = {
  garden: "cover/bg-garden.webp",
  laceCard: "cover/lace-card.webp",
  youreInvited: "cover/txt-youre-invited.webp",
  helmy: "cover/txt-helmy.webp",
  amp: "cover/txt-amp.webp",
  safira: "cover/txt-safira.webp",
  wedding: "cover/txt-wedding.webp",
  clickToOpen: "cover/txt-click-to-open.webp",
  button: "cover/btn-open.webp",
} as const;

export const GALLERY_PHOTOS: readonly string[] = [1, 2, 3, 4, 5, 6].map((n) => `story/photo-${n}.webp`);

/**
 * The photobooth strip is a live one — all six cells move. It ships as a two
 * second loop in both codecs (iOS below 17.4 has no VP9), with the poster
 * covering the first paint and anyone who asked for reduced motion.
 */
export const PHOTOSTRIP_SRC = "story/photostrip.webp";
export const PHOTOSTRIP_VIDEO = [
  { src: "story/photostrip.webm", type: "video/webm" },
  { src: "story/photostrip.mp4", type: "video/mp4" },
] as const;

/**
 * Graphics the intro screen waits for: everything the cover paints, plus the
 * first slide the guest lands on. The rest stream in lazily behind them.
 */
export const CRITICAL: readonly string[] = [...Object.values(COVER), BG.cream, "hero/envelope.webp", "hero/name-badge.webp", "hero/vinyl.webp"];
