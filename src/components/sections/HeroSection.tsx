import { motion } from "motion/react";
import { HERO, HERO_VINYL } from "../../data/layout";
import { MUSIC } from "../../data/content";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { asset, dim } from "../../lib/assets";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * The spinning disc, expressed as a share of hero/vinyl.webp (925x891): the
 * record is centred at (496, 582) and the crop radius is 300px. See the
 * matching geometry in tools/build-assets.mjs.
 */
const DISC = { left: 21.19, top: 31.65, size: 64.86 } as const;

type HeroSectionProps = {
  playing: boolean;
  onToggleMusic: () => void;
  musicAvailable: boolean;
};

/**
 * Slide 1 — the opening collage: envelope, name badge, two photo mounts, and
 * the record. The artwork labels the record "click to play music", so it is the
 * actual control, and its disc turns while the track plays.
 */
export function HeroSection({ playing, onToggleMusic, musicAvailable }: HeroSectionProps) {
  const { reduced, duration, stagger, travel } = useMotionProfile();
  const vinyl = dim(HERO_VINYL.src);
  const disc = dim("hero/vinyl-disc.webp");

  return (
    <Slide id="pembuka" bg="cream" label="Helmy & Safira">
      <ArtLayer pieces={HERO} priority />

      <motion.div
        className="absolute"
        style={{
          left: `${HERO_VINYL.x}%`,
          top: `${HERO_VINYL.y}%`,
          width: `${HERO_VINYL.w}%`,
          zIndex: HERO_VINYL.z,
        }}
        initial={{ opacity: 0, scale: 1 - 0.1 * travel }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration, delay: (HERO_VINYL.delay ?? 0) * stagger, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          onClick={onToggleMusic}
          disabled={!musicAvailable}
          aria-pressed={playing}
          title={musicAvailable ? MUSIC.title : "Musik belum tersedia"}
          className="relative block w-full cursor-pointer transition-transform duration-500 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gilt-700 disabled:cursor-default disabled:hover:scale-100"
        >
          <span className="sr-only">{playing ? "Hentikan musik" : "Putar musik"}</span>

          <img src={asset(HERO_VINYL.src)} alt="" aria-hidden width={vinyl?.w} height={vinyl?.h} draggable={false} className="h-auto w-full select-none" />

          {/* Only the record turns — the flowers around it belong to the paper. */}
          <motion.img
            src={asset("hero/vinyl-disc.webp")}
            alt=""
            aria-hidden
            width={disc?.w}
            height={disc?.h}
            draggable={false}
            className="absolute select-none"
            style={{ left: `${DISC.left}%`, top: `${DISC.top}%`, width: `${DISC.size}%` }}
            animate={playing && !reduced ? { rotate: 360 } : { rotate: 0 }}
            transition={playing && !reduced ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.8, ease: "easeOut" }}
          />
        </button>
      </motion.div>
    </Slide>
  );
}
