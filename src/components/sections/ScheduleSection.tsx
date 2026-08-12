import { motion } from "motion/react";
import { MAP_BUTTON, SCHEDULE } from "../../data/layout";
import { VENUE } from "../../data/content";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { asset, dim } from "../../lib/assets";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * Slide 5 — akad and resepsi in their lace ovals, then the venue.
 *
 * The dates and times stay as artwork: they are fixed text, and the exported
 * PNGs match the print layout exactly. "lihat lokasi" becomes a real link out
 * to Maps, opening in a new tab so the invitation is still there afterwards.
 */
export function ScheduleSection() {
  const button = dim(MAP_BUTTON.src);
  const motionProfile = useMotionProfile();

  return (
    <Slide id="acara" bg="maroon" label="Akad Nikah & Resepsi">
      <ArtLayer pieces={SCHEDULE} />

      <motion.a
        href={VENUE.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute block transition-transform duration-500 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gilt-300"
        style={{ left: `${MAP_BUTTON.x}%`, top: `${MAP_BUTTON.y}%`, width: `${MAP_BUTTON.w}%`, zIndex: MAP_BUTTON.z }}
        initial={{ opacity: 0, y: 26 * motionProfile.travel }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: motionProfile.phone ? 0.1 : 0.3, margin: "0px 0px -6% 0px" }}
        transition={{ duration: motionProfile.duration * 0.9, delay: (MAP_BUTTON.delay ?? 0) * motionProfile.stagger, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={asset(MAP_BUTTON.src)} alt={`Lihat lokasi ${VENUE.name} di Google Maps`} width={button?.w} height={button?.h} draggable={false} className="h-auto w-full select-none" />
      </motion.a>
    </Slide>
  );
}
