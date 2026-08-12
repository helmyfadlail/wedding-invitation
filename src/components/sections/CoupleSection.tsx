import { COUPLE, COUPLE_TEXT } from "../../data/layout";
import { COUPLE as PEOPLE } from "../../data/content";
import { ArtLayer } from "../ui/Art";
import { Reveal } from "../ui/Reveal";
import { Slide } from "../ui/Slide";

/**
 * Slide 3 — Bride and Groom.
 *
 * The names and the parents' lines are web type, not artwork: the design has no
 * cut-out for the names at all, and the exported parent-name PNGs break their
 * lines differently from the print layout. Marck Script stands in for the
 * signature hand; Cormorant Garamond matches the serif underneath it.
 *
 * Both are set line by line with `nowrap`, so the blocks keep the printed
 * shape instead of rewrapping and colliding on narrow screens.
 */
export function CoupleSection() {
  return (
    <Slide id="mempelai" bg="cream" label="Bride and Groom">
      <ArtLayer pieces={COUPLE} />

      <NamePlate box={COUPLE_TEXT.brideName} lines={PEOPLE.bride.nameLines} full={PEOPLE.bride.name} from="right" />
      <Parents box={COUPLE_TEXT.brideParents} lines={PEOPLE.bride.parentLines} from="right" />

      <NamePlate box={COUPLE_TEXT.groomName} lines={PEOPLE.groom.nameLines} full={PEOPLE.groom.name} from="left" />
      <Parents box={COUPLE_TEXT.groomParents} lines={PEOPLE.groom.parentLines} from="left" />
    </Slide>
  );
}

type Box = { x: number; y: number; w: number };
type Side = "left" | "right";

function NamePlate({ box, lines, full, from }: { box: Box; lines: readonly string[]; full: string; from: Side }) {
  return (
    <Reveal delay={0.25} from={from} className="absolute z-30 text-center" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%` }}>
      <h3 className="font-script text-[7.1cqw] leading-[1.32] tracking-[0.01em] text-wine-600">
        <span className="sr-only">{full}</span>
        {lines.map((line) => (
          <span key={line} aria-hidden className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </h3>
    </Reveal>
  );
}

function Parents({ box, lines, from }: { box: Box; lines: readonly string[]; from: Side }) {
  return (
    <Reveal delay={0.45} from={from} className="absolute z-30 text-center" style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%` }}>
      <p className="font-serif text-[3.15cqw] leading-normal text-wine-600">
        {lines.map((line) => (
          <span key={line} className="block whitespace-nowrap">
            {line}
          </span>
        ))}
      </p>
    </Reveal>
  );
}
