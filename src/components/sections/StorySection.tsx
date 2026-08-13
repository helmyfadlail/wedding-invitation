import { motion } from "motion/react";
import { STORY, STORY_FRAME, STORY_PHOTO, STORY_WINDOW } from "../../data/layout";
import { LOVE_STORY } from "../../data/content";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { asset, dim } from "../../lib/assets";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * Slide 6 — Our Love Story.
 *
 * The ornate badge ships with the story already set inside it, so it stays one
 * graphic; the same words go into a visually hidden paragraph so the story is
 * still readable by assistive tech and searchable.
 *
 * The framed photo is assembled here rather than flattened into a single file.
 * The frame is the element in flow, so it sets the box; the photograph is
 * absolutely positioned behind it, at the window measured in STORY_WINDOW. The
 * lace then paints over the photograph's edges, which is what gives the scallop
 * its shape — no clipping needed. Either file can be replaced on its own.
 */
export function StorySection() {
  const { travel, duration, stagger, amount } = useMotionProfile();
  const frame = dim(STORY_FRAME.src);
  const photo = dim(STORY_PHOTO);

  return (
    <Slide id="cerita" bg="cream" label="Our Love Story">
      <ArtLayer pieces={STORY} />

      <motion.div
        className="absolute"
        style={{
          left: `${STORY_FRAME.x}%`,
          top: `${STORY_FRAME.y}%`,
          width: `${STORY_FRAME.w}%`,
          zIndex: STORY_FRAME.z,
        }}
        initial={{ opacity: 0, scale: 1 - 0.1 * travel }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount, margin: "0px 0px -6% 0px" }}
        transition={{ duration, delay: (STORY_FRAME.delay ?? 0) * stagger, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={asset(STORY_PHOTO)}
          alt="Helmy & Safira"
          width={photo?.w}
          height={photo?.h}
          loading="lazy"
          decoding="async"
          draggable={false}
          // The file is already cropped to the window's shape; object-cover is
          // here so a differently proportioned replacement still fills it
          // rather than stretching.
          className="absolute z-0 object-cover select-none"
          style={{
            left: `${STORY_WINDOW.x}%`,
            top: `${STORY_WINDOW.y}%`,
            width: `${STORY_WINDOW.w}%`,
            height: `${STORY_WINDOW.h}%`,
          }}
        />

        <img
          src={asset(STORY_FRAME.src)}
          alt=""
          aria-hidden
          width={frame?.w}
          height={frame?.h}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="relative z-10 block h-auto w-full select-none"
        />
      </motion.div>

      <p className="sr-only">{LOVE_STORY}</p>
    </Slide>
  );
}
