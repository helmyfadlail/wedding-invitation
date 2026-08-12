import { motion } from "motion/react";
import { asset, COVER, dim } from "../lib/assets";
import { Petals } from "./ui/Petals";

/**
 * Page one of the printed design: the rose garden, the lace card, and the
 * "click to open" pill.
 *
 * Every position below is a percentage of the lace card, measured off the PDF
 * (tools/locate-layout.mjs works the same way for the inner pages). Because the
 * card is sized once — `--card-h` — the whole composition scales as one piece,
 * so a phone and a desktop show the same design rather than a reflowed version
 * of it. The button deliberately overflows the card, exactly as in the artwork.
 */
const PLACE = {
  invited: { x: 21.6, y: 16.8, w: 56.8 },
  helmy: { x: 22.7, y: 25.6, w: 46.6 },
  amp: { x: 46.4, y: 46.6, w: 7.3 },
  safira: { x: 27.3, y: 55.9, w: 44.3 },
  wedding: { x: 27.3, y: 76.9, w: 43.2 },
  button: { x: 5.7, y: 116.1, w: 88.6 },
} as const;

/**
 * The label inside the pill, re-expressed as a percentage of the pill itself.
 * Measured on the card as x 22.7%, y 117.9%, w 54.5%; the pill is 88.6% of the
 * card's width and — at the artwork's 960x165 aspect — 11.12% of its height.
 */
const BUTTON_LABEL = { left: 19.2, top: 16.2, width: 61.5 } as const;

const EASE_SILK = [0.16, 1, 0.3, 1] as const;

type CoverProps = {
  onOpen: () => void;
  /** From ?to= — shown only when the link carries a guest's name. */
  guestName: string | null;
};

export function Cover({ onOpen, guestName }: CoverProps) {
  return (
    <motion.div className="fixed inset-0 z-80 overflow-hidden bg-cream-200" exit={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }} transition={{ duration: 1.05, ease: EASE_SILK }}>
      <motion.img
        src={asset(COVER.garden)}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 3.2, ease: EASE_SILK }}
      />
      {/* lift the card off a busy photograph */}
      <div aria-hidden className="absolute inset-0 bg-linear-to-b from-cream-50/10 via-transparent to-wine-950/12" />

      <Petals />

      <div className="relative flex h-full items-center justify-center px-5">
        <motion.div
          className="relative"
          style={{
            ["--card-h" as string]: "min(58svh, 115vw)",
            height: "var(--card-h)",
            aspectRatio: "581 / 796",
            // the pill hangs below the card; this keeps the pair optically centred
            marginBottom: "calc(var(--card-h) * 0.3)",
          }}
          initial={{ opacity: 0, y: 26, scale: 0.965 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.2, ease: EASE_SILK }}
        >
          <Layer src={COVER.laceCard} className="absolute inset-0 size-full drop-shadow-[0_18px_34px_rgba(61,13,17,0.24)]" />

          <Line src={COVER.youreInvited} place={PLACE.invited} alt="You're Invited" delay={0.75} />
          <Line src={COVER.helmy} place={PLACE.helmy} alt="Helmy" delay={0.95} />
          <Line src={COVER.amp} place={PLACE.amp} alt="and" delay={1.1} />
          <Line src={COVER.safira} place={PLACE.safira} alt="Safira" delay={1.2} />
          <Line src={COVER.wedding} place={PLACE.wedding} alt="Wedding" delay={1.4} />

          <motion.button
            type="button"
            onClick={onOpen}
            className="absolute cursor-pointer transition-[filter,transform] duration-500 hover:scale-[1.035] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gilt-700"
            style={{
              left: `${PLACE.button.x}%`,
              top: `${PLACE.button.y}%`,
              width: `${PLACE.button.w}%`,
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.65, ease: EASE_SILK }}
          >
            <Layer src={COVER.button} className="w-full" />
            <img
              src={asset(COVER.clickToOpen)}
              alt="Click to open"
              width={dim(COVER.clickToOpen)?.w}
              height={dim(COVER.clickToOpen)?.h}
              className="absolute h-auto"
              style={{
                left: `${BUTTON_LABEL.left}%`,
                top: `${BUTTON_LABEL.top}%`,
                width: `${BUTTON_LABEL.width}%`,
              }}
            />
            {/* slow gold sheen, so the only tappable thing reads as tappable */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(100deg, transparent 38%, rgba(255,246,224,0.6) 50%, transparent 62%)" }}
              animate={{ x: ["-115%", "115%"] }}
              transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" }}
            />
          </motion.button>
        </motion.div>
      </div>

      {guestName && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] px-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.9 }}
        >
          <p className="font-serif text-[0.6rem] tracking-[0.34em] text-gilt-700/75 uppercase">Kepada</p>
          <p className="mt-1 font-serif text-lg text-wine-800 italic">{guestName}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function Layer({ src, className }: { src: string; className?: string }) {
  const size = dim(src);
  return <img src={asset(src)} alt="" aria-hidden width={size?.w} height={size?.h} className={className} draggable={false} />;
}

function Line({ src, place, alt, delay }: { src: string; place: { x: number; y: number; w: number }; alt: string; delay: number }) {
  const size = dim(src);
  return (
    <motion.img
      src={asset(src)}
      alt={alt}
      width={size?.w}
      height={size?.h}
      draggable={false}
      className="absolute h-auto select-none"
      style={{ left: `${place.x}%`, top: `${place.y}%`, width: `${place.w}%` }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, delay, ease: EASE_SILK }}
    />
  );
}
