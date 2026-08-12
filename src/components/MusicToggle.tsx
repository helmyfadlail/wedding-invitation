import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

type MusicToggleProps = {
  playing: boolean;
  onToggle: () => void;
};

/**
 * The floating control that stays with the guest all the way down the page —
 * the record on slide 1 scrolls away, and music you cannot stop is rude.
 */
export function MusicToggle({ playing, onToggle }: MusicToggleProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? "Hentikan musik" : "Putar musik"}
      title={playing ? "Hentikan musik" : "Putar musik"}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-70 grid size-12 cursor-pointer place-items-center rounded-full border border-gilt-300/45 bg-wine-900/85 text-cream-100 shadow-[0_6px_18px_rgba(37,6,7,0.35)] backdrop-blur-sm transition-colors duration-300 hover:bg-wine-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gilt-300"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.92 }}
    >
      <motion.span
        className="grid place-items-center"
        animate={playing && !reduced ? { rotate: 360 } : { rotate: 0 }}
        transition={playing && !reduced ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
      >
        {playing ? <DiscIcon /> : <MutedIcon />}
      </motion.span>
    </motion.button>
  );
}

function DiscIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="12" cy="12" r="9.2" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 2.8v2.4M21.2 12h-2.4M12 21.2v-2.4M2.8 12h2.4" strokeOpacity="0.5" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" strokeLinejoin="round" />
      <path d="M16.4 9.6l4 4.8M20.4 9.6l-4 4.8" strokeLinecap="round" />
    </svg>
  );
}
