import { CLOSING as CLOSING_ART } from "../../data/layout";
import { COUPLE, WEDDING_DATE } from "../../data/content";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * Slide 9 — the closing words and the salam, then a quiet credit line.
 *
 * The paragraph and the salam ship as artwork with the text already set, so both
 * carry their words as alt text.
 */
export function ClosingSection() {
  const year = WEDDING_DATE.getFullYear();

  return (
    <Slide id="penutup" bg="maroon" label="Penutup">
      <ArtLayer pieces={CLOSING_ART} />

      <p className="absolute inset-x-0 bottom-[2.5cqw] z-30 text-center font-serif text-[2.6cqw] tracking-[0.24em] text-cream-200/35 uppercase">
        {COUPLE.groom.short} &amp; {COUPLE.bride.short} &middot; {year}
      </p>
    </Slide>
  );
}
