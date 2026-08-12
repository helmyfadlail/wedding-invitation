import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect } from "react";
import { asset, dim } from "../../lib/assets";

type LightboxProps = {
  photos: readonly string[];
  /** Index of the open photo, or null when closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

/** Full-screen photo viewer for the gallery: tap outside, arrows, or Esc. */
export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;

  const step = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, onIndexChange, photos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // Keep the page behind from scrolling under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, step]);

  const src = index === null ? null : photos[index];
  const size = src ? dim(src) : undefined;

  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          /*
            dvh, not vh: on a phone `100vh` is the viewport with the browser
            chrome hidden, so a photo sized against it is cut off by the
            address bar. The horizontal padding leaves room for the arrows.
          */
          className="fixed inset-0 z-100 flex items-center justify-center bg-wine-950/92 px-16 py-[max(1.25rem,env(safe-area-inset-top))] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${index + 1} dari ${photos.length}`}
        >
          <motion.img
            key={src}
            src={asset(src)}
            width={size?.w}
            height={size?.h}
            alt={`Helmy & Safira — foto ${index + 1}`}
            className="max-h-[78dvh] w-auto max-w-full rounded-sm shadow-2xl ring-1 ring-gilt-300/25"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            /* Nobody hunts for a 48px arrow on a phone — they swipe. */
            drag={photos.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) step(1);
              else if (info.offset.x > 60) step(-1);
            }}
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 grid size-11 place-items-center rounded-full bg-cream-100/12 text-2xl leading-none text-cream-100 transition hover:bg-cream-100/25"
          >
            &times;
          </button>

          {photos.length > 1 && (
            <>
              <NavButton side="left" onClick={() => step(-1)} />
              <NavButton side="right" onClick={() => step(1)} />
            </>
          )}

          <p className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] font-sans text-xs tracking-[0.25em] text-cream-200/70">
            {index + 1} / {photos.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Foto sebelumnya" : "Foto berikutnya"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute ${side === "left" ? "left-2" : "right-2"} grid size-12 place-items-center rounded-full bg-wine-950/45 text-3xl text-cream-100/85 backdrop-blur-sm transition hover:bg-wine-950/70 hover:text-cream-100`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
