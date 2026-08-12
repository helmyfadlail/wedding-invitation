import { motion } from "motion/react";

/**
 * The first thing a guest sees: the couple's names, while the cover artwork
 * decodes behind it. It holds until `progress` reaches 1 so the cover never
 * appears half-painted.
 */
export function Intro({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);

  return (
    <motion.div
      className="fixed inset-0 z-90 flex flex-col items-center justify-center bg-cream-100 px-8"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* faint warm vignette so the flat cream has some depth */}
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 42%, #fffdf8 0%, #f4f3ee 55%, #e8e2d6 100%)" }} />

      {/*
        The names are deliberately NOT animated in. index.html has already
        painted them at this exact position, so sliding them in would make the
        handover visible — the one thing this screen must not do. Only the rule
        and the progress bar, which the splash cannot show meaningfully, move.
      */}
      <div className="relative flex flex-col items-center">
        <p className="m-0 font-serif text-[0.62rem] tracking-[0.5em] text-gilt-700/70 uppercase">The Wedding Of</p>

        <h1 className="mt-3 text-center font-copper text-[clamp(2.9rem,13vw,4.6rem)] leading-[1.05] text-gilt-700">
          Helmy <span className="font-serif text-[0.62em] align-middle">&</span> Safira
        </h1>

        <motion.div
          aria-hidden
          className="mt-6 h-px w-40 rule-gilt"
          initial={{ scaleX: 0.25, opacity: 0.5 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        <p className="mt-5 font-serif text-sm tracking-[0.3em] text-wine-800/70">24 . 10 . 2026</p>

        {/* progress hairline, doubling as the loading state */}
        <div className="mt-10 h-0.5 w-44 overflow-hidden rounded-full bg-gilt-700/12" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Memuat undangan">
          <motion.div className="h-full rounded-full bg-gilt-500" initial={{ width: "8%" }} animate={{ width: `${Math.max(8, pct)}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
        </div>
      </div>
    </motion.div>
  );
}
