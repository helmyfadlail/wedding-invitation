import { motion } from "motion/react";
import type { Entrance, Piece } from "../../data/layout";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { asset, dim } from "../../lib/assets";
import { cn } from "../../lib/cn";

/** How far a piece travels before settling, in pixels on a full-size screen. */
const ENTRANCE: Record<Entrance, { x?: number; y?: number; scale?: number }> = {
  up: { y: 30 },
  down: { y: -30 },
  left: { x: -38 },
  right: { x: 38 },
  in: { scale: 0.9 },
  none: {},
};

/** The same entrance, scaled to the device (0 = no travel at all). */
const scaled = (from: Entrance, k: number) => {
  if (k === 0) return {};
  const offset = ENTRANCE[from];
  return {
    ...(offset.x === undefined ? {} : { x: offset.x * k }),
    ...(offset.y === undefined ? {} : { y: offset.y * k }),
    ...(offset.scale === undefined ? {} : { scale: 1 - (1 - offset.scale) * k }),
  };
};

const EASE_SILK = [0.16, 1, 0.3, 1] as const;

type ArtProps = {
  piece: Piece;
  /** Above the fold: load eagerly and skip the scroll trigger. */
  priority?: boolean | undefined;
  className?: string;
};

/**
 * One cut-out from the artwork, positioned by percentage inside a Slide.
 *
 * Two nested elements on purpose: the outer one owns placement and the
 * scroll-triggered entrance, the inner one owns the endless idle drift. Sharing
 * a single element would make those two animations fight over `y`.
 */
export function Art({ piece, priority = false, className }: ArtProps) {
  const motionProfile = useMotionProfile();
  const size = dim(piece.src);
  const offset = scaled(piece.from ?? "up", motionProfile.travel);
  const decorative = !piece.alt;

  const image = (
    <img
      src={asset(piece.src)}
      alt={piece.alt ?? ""}
      {...(decorative ? { "aria-hidden": true } : {})}
      width={size?.w}
      height={size?.h}
      loading={priority ? "eager" : "lazy"}
      // eslint-disable-next-line react/no-unknown-property -- valid HTML attribute
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className="h-auto w-full select-none"
    />
  );

  return (
    <motion.div
      className={cn("pointer-events-none absolute", className)}
      style={{ left: `${piece.x}%`, top: `${piece.y}%`, width: `${piece.w}%`, zIndex: piece.z ?? 0 }}
      initial={{ opacity: 0, ...offset }}
      {...(priority
        ? { animate: { opacity: 1, x: 0, y: 0, scale: 1 } }
        : { whileInView: { opacity: 1, x: 0, y: 0, scale: 1 }, viewport: { once: true, amount: motionProfile.amount, margin: "0px 0px -6% 0px" } })}
      transition={{ duration: motionProfile.duration, delay: (piece.delay ?? 0) * motionProfile.stagger, ease: EASE_SILK }}
    >
      {piece.float && !motionProfile.reduced ? (
        <motion.div animate={{ y: [0, -7 * motionProfile.travel, 0], rotate: [0, 0.5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
          {image}
        </motion.div>
      ) : (
        image
      )}
    </motion.div>
  );
}

/** Renders a whole slide's worth of artwork. */
export function ArtLayer({ pieces, priority }: { pieces: readonly Piece[]; priority?: boolean }) {
  return (
    <>
      {pieces.map((piece, i) => (
        <Art key={`${piece.src}-${i}`} piece={piece} priority={priority} />
      ))}
    </>
  );
}
