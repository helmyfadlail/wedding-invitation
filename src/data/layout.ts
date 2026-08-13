/**
 * Where every piece of artwork sits.
 *
 * The printed design is nine 1434x806 slides, each holding a portrait column
 * 494px wide. On the web that column is `max-width: 480px` with a locked
 * 494:806 aspect ratio, so a position measured off the PDF can be expressed
 * once, as a percentage, and stay correct at every screen size.
 *
 * The numbers were measured, not eyeballed: `tools/locate-layout.mjs`
 * template-matches each cut-out against a render of the PDF. After changing
 * anything here run `npm run layout:preview` — it stacks each slide next to the
 * original and shows the pixel difference.
 */

/** Entrance direction for a piece of artwork as it scrolls into view. */
export type Entrance = "up" | "down" | "left" | "right" | "in" | "none";

export type Piece = {
  /** Path under /public/assets. */
  src: string;
  /** Left edge, as a % of the column width. */
  x: number;
  /** Top edge, as a % of the slide height. */
  y: number;
  /** Width, as a % of the column width. Height follows the aspect ratio. */
  w: number;
  /** Paint order inside the slide. */
  z?: number;
  from?: Entrance;
  /** Seconds added to the reveal, for staggering. */
  delay?: number;
  /** Omit for purely decorative artwork. */
  alt?: string;
  /** Gentle idle drift — for flowers and things that hang. */
  float?: boolean;
};

/** The design's column geometry, in the original artwork's pixels. */
export const SLIDE = { w: 494, h: 806 } as const;

export const HERO: Piece[] = [
  { src: "hero/envelope.webp", x: 2.4, y: 3.2, w: 57.7, z: 10, from: "down" },
  { src: "hero/name-badge.webp", x: 3.2, y: 24.6, w: 58.1, z: 20, from: "in", delay: 0.15, alt: "Helmy & Safira" },
  { src: "hero/photo-small.webp", x: 66.0, y: 43.2, w: 28.6, z: 25, from: "right", delay: 0.3 },
  { src: "hero/photo-large.webp", x: 5.3, y: 62.3, w: 62.2, z: 35, from: "left", delay: 0.4 },
];

/** The record is the music button, not decoration, so it is placed separately. */
export const HERO_VINYL: Piece = { src: "hero/vinyl.webp", x: 47.8, y: 14.6, w: 47.6, z: 30, from: "in", delay: 0.5 };

export const VERSE: Piece[] = [
  { src: "verse/ar-rum-21.webp", x: 3.6, y: 1.4, w: 84.5, z: 10, from: "in", alt: "QS. Ar-Rum ayat 21" },
  { src: "verse/bismillah.webp", x: 9.0, y: 67.6, w: 79.0, z: 20, from: "up", delay: 0.15, alt: "Bismillahirrahmanirrahim" },
  {
    src: "verse/txt-memohon-rahmat.webp",
    x: 3.5,
    y: 80.0,
    w: 90.0,
    z: 20,
    from: "up",
    delay: 0.3,
    alt: "Dengan memohon Rahmat dan Ridho dari Allah SWT, Kami bermaksud menyelenggarakan pernikahan kami",
  },
];

export const COUPLE: Piece[] = [
  { src: "couple/pill-frame.webp", x: 6.5, y: 5.1, w: 84.1, z: 10, from: "down" },
  { src: "couple/txt-bride-and-groom.webp", x: 21.0, y: 9.2, w: 55.0, z: 15, from: "in", delay: 0.2, alt: "Bride and Groom" },

  { src: "couple/flower-bride.webp", x: -4.5, y: 18.0, w: 20.0, z: 12, from: "left", float: true },
  { src: "couple/photo-bride.webp", x: 0, y: 22.0, w: 43.2, z: 20, from: "left", delay: 0.1, alt: "Safira Luthfiana Husodo" },

  { src: "couple/rings.webp", x: 41.3, y: 46.8, w: 24.2, z: 25, from: "in", delay: 0.2 },

  { src: "couple/flower-groom.webp", x: 81.8, y: 48.3, w: 21.4, z: 12, from: "right", float: true },
  { src: "couple/photo-groom.webp", x: 53.4, y: 57.0, w: 43.1, z: 20, from: "right", delay: 0.1, alt: "M. Helmy Fadlail Albab" },
];

/**
 * The rose bouquet straddles the seam between the couple slide and the wine one
 * below. It lives in the *lower* slide at a negative offset so it paints over
 * the section it bleeds into rather than under it.
 */
export const SEAM_BOUQUET: Piece = { src: "couple/flower-bottom.webp", x: -5.7, y: -10.5, w: 44.3, z: 40, from: "left" };

export const SAVE_THE_DATE: Piece[] = [
  { src: "date/frame-timer.webp", x: 3.2, y: 11.8, w: 91.9, z: 10, from: "in" },
  { src: "date/garland-white.webp", x: 0, y: 41.8, w: 96.7, z: 15, from: "down", delay: 0.1, float: true },
  { src: "date/txt-save-the-date.webp", x: 8.9, y: 53.9, w: 80.9, z: 15, from: "in", delay: 0.2, alt: "Save The Date" },
  { src: "date/txt-oktober.webp", x: 28.5, y: 70.8, w: 41.0, z: 15, from: "up", delay: 0.3, alt: "Oktober" },
];

/** Countdown readout, inside the lace frame (which spans y 11.8% – 37.6%). */
export const TIMER_BOX = { x: 10.0, y: 15.5, w: 80.0, h: 18.0 } as const;

/**
 * The calendar is live text rather than artwork: the two exported PNGs were
 * re-laid-out at different scales, so "Sat" no longer sits above "24". A
 * seven-column grid guarantees the alignment the design intends.
 */
export const CALENDAR_BOX = {
  weekdays: { x: 2.0, y: 77.4, w: 96.0 },
  rules: [83.1, 91.2],
  days: { x: 2.0, y: 84.6, w: 96.0 },
} as const;

export const SCHEDULE: Piece[] = [
  { src: "date/frame-oval.webp", x: 1.6, y: 4.1, w: 93.1, z: 10, from: "in" },
  { src: "date/txt-akad-nikah.webp", x: 21.9, y: 12.0, w: 52.9, z: 20, from: "in", delay: 0.2, alt: "Akad Nikah" },
  { src: "date/txt-akad-date.webp", x: 18.2, y: 20.4, w: 60.6, z: 20, from: "up", delay: 0.3, alt: "Sabtu, 24 Oktober 2026" },
  { src: "date/txt-akad-time.webp", x: 26.5, y: 26.6, w: 45.0, z: 20, from: "up", delay: 0.4, alt: "Pukul : 09.00 WIB" },

  { src: "date/frame-oval.webp", x: 2.0, y: 43.0, w: 93.5, z: 10, from: "in", delay: 0.1 },
  { src: "date/txt-resepsi.webp", x: 37.2, y: 50.9, w: 23.3, z: 20, from: "in", delay: 0.3, alt: "Resepsi" },
  { src: "date/txt-resepsi-date.webp", x: 19.0, y: 59.4, w: 60.1, z: 20, from: "up", delay: 0.4, alt: "Sabtu, 24 Oktober 2026" },
  { src: "date/txt-resepsi-time.webp", x: 27.9, y: 65.6, w: 42.8, z: 20, from: "up", delay: 0.5, alt: "Pukul : 12.00 WIB" },

  { src: "date/txt-lokasi.webp", x: 17.5, y: 82.8, w: 62.0, z: 20, from: "up", delay: 0.2, alt: "Lokasi : Joglo Jolali" },
];

/** The "lihat lokasi" pill is a link, so it is placed on its own. */
export const MAP_BUTTON: Piece = { src: "date/btn-lihat-lokasi.webp", x: 21.5, y: 90.1, w: 54.6, z: 25, from: "up", delay: 0.35 };

export const STORY: Piece[] = [
  { src: "story/txt-our-love-story.webp", x: 12.6, y: 7.0, w: 72.3, z: 20, from: "in", alt: "Our Love Story" },
  { src: "story/badge-story.webp", x: 1.2, y: 57.3, w: 94.6, z: 15, from: "up", delay: 0.3, alt: "" },
];

/**
 * The framed photo on slide 6 is two files layered in the markup, not one
 * merged graphic: the lace frame — transparent wherever the source JPEG painted
 * black — sitting over the photograph, which shows through its opening.
 *
 * Keeping them apart means either can be swapped on its own: a new photo needs
 * no new frame, and the couple can drop a different frame around the same
 * photograph. StorySection puts them together.
 */
export const STORY_FRAME: Piece = { src: "story/frame-story.webp", x: 2.8, y: 16.7, w: 93.8, z: 10, from: "in", delay: 0.15 };

export const STORY_PHOTO = "story/photo-story.webp";

/**
 * The frame's opening, as a share of the frame image. Measured by
 * tools/build-assets.mjs, which prints these four numbers — re-run
 * `npm run assets` and paste them back if the frame ever changes.
 */
export const STORY_WINDOW = { x: 16.15, y: 18.42, w: 65.83, h: 63.49 } as const;

export const GALLERY: Piece[] = [
  { src: "story/txt-our-gallery.webp", x: 24.3, y: 2.2, w: 48.9, z: 20, from: "in", alt: "Our Gallery" },
  { src: "story/garland-maroon.webp", x: 0, y: 8.9, w: 96.7, z: 15, from: "down", delay: 0.15, float: true },
];

/** The photobooth strip; the six stills sit inside its mount. */
export const PHOTOSTRIP = { x: 15.8, y: 19.1, w: 65.1 } as const;

/**
 * Photo cells as a fraction of the strip image, from the mount detected in
 * tools/build-assets.mjs. Used to place tap targets over the strip.
 */
export const PHOTOSTRIP_CELLS = [
  { x: 3.4, y: 1.4, w: 45.8, h: 29.8 },
  { x: 51.7, y: 1.4, w: 45.8, h: 29.8 },
  { x: 3.4, y: 32.7, w: 45.8, h: 29.6 },
  { x: 51.7, y: 32.7, w: 45.8, h: 29.6 },
  { x: 3.4, y: 63.7, w: 45.8, h: 29.6 },
  { x: 51.7, y: 63.7, w: 45.8, h: 29.6 },
] as const;

export const CLOSING: Piece[] = [
  { src: "closing/photo-frame.webp", x: 9.3, y: 2.9, w: 78.4, z: 10, from: "in", alt: "Helmy & Safira" },
  {
    src: "closing/txt-kata-penutup.webp",
    x: 9.5,
    y: 64.4,
    w: 78.0,
    z: 20,
    from: "up",
    delay: 0.2,
    alt: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir memberikan doa restu kepada kami.",
  },
  { src: "closing/txt-wassalam.webp", x: 6.5, y: 85.6, w: 84.0, z: 20, from: "up", delay: 0.4, alt: "Wassalamualaikum Wr. Wb" },
];

/**
 * Live text on the couple slide. The artwork has no cut-out for the names, and
 * the exported parent-name PNGs break their lines differently from the print
 * design, so both are set in web type instead.
 */
export const COUPLE_TEXT = {
  brideName: { x: 42.0, y: 28.4, w: 56.0 },
  brideParents: { x: 44.0, y: 40.2, w: 54.0 },
  groomName: { x: 2.0, y: 63.4, w: 56.0 },
  groomParents: { x: 0, y: 76.2, w: 54.0 },
} as const;

