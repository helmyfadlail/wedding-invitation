import type { ReactNode } from "react";
import { asset, BG } from "../../lib/assets";
import { cn } from "../../lib/cn";

type SlideProps = {
  id?: string;
  /** Which of the two paper textures backs this section. */
  bg: keyof typeof BG;
  children: ReactNode;
  /**
   * "art" locks the design's 494:806 column so percentage positions land
   * exactly. "flow" lets the section grow past it — used by the RSVP card,
   * whose height depends on how many wishes have come in.
   */
  mode?: "art" | "flow";
  /** Let artwork spill past the section edge (the bouquet on the seam). */
  bleed?: boolean;
  label?: string;
  className?: string;
};

/**
 * One of the nine bands of the invitation: paper texture bleeding the full
 * viewport width, with the design's portrait column centred on top.
 *
 * The column is a container-query context, so type inside can be sized in `cqw`
 * and scale with the artwork instead of drifting away from it.
 */
export function Slide({ id, bg, children, mode = "art", bleed = false, label, className }: SlideProps) {
  // A dark fade reads on cream but vanishes on wine, and a dark hairline is
  // invisible there too, so each texture gets its own pair.
  const fade = bg === "maroon" ? "rgba(14,2,3,0.34)" : "rgba(37,6,7,0.12)";
  const edge = bg === "maroon" ? "rgba(255,246,232,0.06)" : "rgba(37,6,7,0.07)";

  return (
    <section id={id} aria-label={label} className={cn("relative w-full", bleed ? "overflow-visible" : "overflow-hidden")}>
      <div aria-hidden className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${asset(BG[bg])})` }} />

      {/*
        Past the column's own width the design leaves bare paper. Rather than
        stretch the artwork, the margins fall away into shadow and the column
        keeps a hairline edge, so on a laptop the invitation reads as a card
        lying on the textured surface. Both are inert below `sm`, where the
        column already fills the screen.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 right-[calc(50%+240px)] hidden sm:block" style={{ background: `linear-gradient(to left, transparent, ${fade})` }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[calc(50%+240px)] right-0 hidden sm:block" style={{ background: `linear-gradient(to right, transparent, ${fade})` }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-120 -translate-x-1/2 border-x sm:block" style={{ borderColor: edge }} />

      <div className="relative mx-auto w-full max-w-120 @container">
        <div className={cn("relative w-full", mode === "art" ? "aspect-494/806" : "min-h-[163.16cqw]", className)}>{children}</div>
      </div>
    </section>
  );
}
