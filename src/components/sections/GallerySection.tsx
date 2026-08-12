import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GALLERY, PHOTOSTRIP, PHOTOSTRIP_CELLS } from "../../data/layout";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { asset, dim, GALLERY_PHOTOS, PHOTOSTRIP_SRC, PHOTOSTRIP_VIDEO } from "../../lib/assets";
import { ArtLayer } from "../ui/Art";
import { Lightbox } from "../ui/Lightbox";
import { Slide } from "../ui/Slide";

/**
 * Slide 7 — Our Gallery, as the photobooth strip from the design.
 *
 * The strip is a *live* one: all six cells move together. The source is a 50 MB
 * GIF, which no guest on mobile data should ever be asked to download, so the
 * build re-encodes it to a 2s loop in mp4 and webm — the same animation at
 * ~130 KB — with the still frame as the poster. Each cell is also a tap target
 * that opens the full photo, the one thing the printed strip cannot do.
 */
export function GallerySection() {
  const [open, setOpen] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const motionProfile = useMotionProfile();
  const strip = dim(PHOTOSTRIP_SRC);
  const video = useRef<HTMLVideoElement | null>(null);

  const still = motionProfile.reduced || failed;

  /*
    Only run the loop while it is on screen. Left playing, a 30fps decode
    carries on eating battery for the whole of the rest of the page — and on
    iOS a video that is scrolled away can drop its decoder and come back frozen.
  */
  useEffect(() => {
    const element = video.current;
    if (!element || still) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void element.play().catch(() => undefined);
        else element.pause();
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [still]);

  return (
    <Slide id="galeri" bg="cream" label="Our Gallery">
      <ArtLayer pieces={GALLERY} />

      <motion.div
        className="absolute"
        style={{ left: `${PHOTOSTRIP.x}%`, top: `${PHOTOSTRIP.y}%`, width: `${PHOTOSTRIP.w}%`, zIndex: 10 }}
        initial={{ opacity: 0, y: 34 * motionProfile.travel }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: motionProfile.amount, margin: "0px 0px -6% 0px" }}
        transition={{ duration: motionProfile.duration, delay: 0.2 * motionProfile.stagger, ease: [0.16, 1, 0.3, 1] }}
      >
        {still ? (
          <img
            src={asset(PHOTOSTRIP_SRC)}
            alt="Photobooth Helmy & Safira"
            width={strip?.w}
            height={strip?.h}
            draggable={false}
            className="h-auto w-full select-none shadow-[0_10px_26px_rgba(61,13,17,0.18)]"
          />
        ) : (
          <video
            ref={video}
            // muted + playsInline is what lets iOS start it without a tap; the
            // poster covers the gap before the first frame decodes.
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={asset(PHOTOSTRIP_SRC)}
            width={strip?.w}
            height={strip?.h}
            aria-label="Photobooth Helmy & Safira"
            disablePictureInPicture
            onError={() => setFailed(true)}
            className="h-auto w-full select-none bg-cream-200 shadow-[0_10px_26px_rgba(61,13,17,0.18)]"
          >
            {PHOTOSTRIP_VIDEO.map(({ src, type }) => (
              <source key={src} src={asset(src)} type={type} />
            ))}
          </video>
        )}

        {PHOTOSTRIP_CELLS.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Perbesar foto ${i + 1}`}
            className="absolute cursor-pointer transition duration-300 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream-100"
            style={{ left: `${cell.x}%`, top: `${cell.y}%`, width: `${cell.w}%`, height: `${cell.h}%` }}
          />
        ))}
      </motion.div>

      <Lightbox photos={GALLERY_PHOTOS} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </Slide>
  );
}
