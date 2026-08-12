import { CALENDAR_BOX, SAVE_THE_DATE, SEAM_BOUQUET, TIMER_BOX } from "../../data/layout";
import { CALENDAR, WEDDING_DATE } from "../../data/content";
import { useCountdown } from "../../hooks/useCountdown";
import { Art, ArtLayer } from "../ui/Art";
import { Reveal } from "../ui/Reveal";
import { Slide } from "../ui/Slide";

const UNITS = [
  { key: "days", label: "Hari" },
  { key: "hours", label: "Jam" },
  { key: "minutes", label: "Menit" },
  { key: "seconds", label: "Detik" },
] as const;

/**
 * Slide 4 — the countdown inside the lace frame, then Save The Date and the
 * October week.
 *
 * The frame is empty in the printed design because the numbers are live, so the
 * countdown is set in web type inside it. The calendar is web type too: the two
 * exported PNGs were re-laid-out at different scales, which knocked "24" out
 * from under "Sat" — a seven-column grid can't drift.
 *
 * `bleed` is on because the rose bouquet crosses the seam from the slide above.
 * It is rendered here, not there, so it paints *over* this section's paper
 * rather than being buried by it.
 */
export function SaveTheDateSection() {
  const left = useCountdown(WEDDING_DATE);

  return (
    <Slide id="save-the-date" bg="maroon" label="Save The Date" bleed>
      <Art piece={SEAM_BOUQUET} />
      <ArtLayer pieces={SAVE_THE_DATE} />

      {/* countdown, inside the lace frame */}
      <div className="absolute z-20 flex items-center justify-center" style={{ left: `${TIMER_BOX.x}%`, top: `${TIMER_BOX.y}%`, width: `${TIMER_BOX.w}%`, height: `${TIMER_BOX.h}%` }}>
        {left.done ? (
          <Reveal className="text-center">
            <p className="font-script text-[9cqw] leading-tight text-cream-100">Alhamdulillah</p>
            <p className="mt-[1cqw] font-serif text-[3.4cqw] tracking-[0.22em] text-cream-200/85 uppercase">24 Oktober 2026</p>
          </Reveal>
        ) : (
          <div className="flex w-full items-stretch justify-center">
            {UNITS.map((unit, i) => (
              <Reveal key={unit.key} delay={0.1 + i * 0.08} from="in" className="relative flex flex-1 flex-col items-center justify-center">
                {i > 0 && <span aria-hidden className="absolute top-[18%] bottom-[18%] left-0 w-px bg-linear-to-b from-transparent via-cream-200/35 to-transparent" />}
                <span className="font-serif text-[10.5cqw] leading-none font-light text-cream-50 [font-variant-numeric:lining-nums_tabular-nums]">{String(left[unit.key]).padStart(2, "0")}</span>
                <span className="mt-[1.4cqw] font-sans text-[2.5cqw] font-light tracking-[0.2em] text-cream-200/80 uppercase">{unit.label}</span>
              </Reveal>
            ))}
          </div>
        )}
        <span className="sr-only" aria-live="off">
          {left.done ? "Hari pernikahan telah tiba" : `${left.days} hari ${left.hours} jam ${left.minutes} menit menuju hari bahagia`}
        </span>
      </div>

      {/* the October week, with the wedding day marked */}
      <Reveal
        delay={0.4}
        className="absolute z-20"
        style={{
          left: `${CALENDAR_BOX.weekdays.x}%`,
          top: `${CALENDAR_BOX.weekdays.y}%`,
          width: `${CALENDAR_BOX.weekdays.w}%`,
        }}
      >
        <div className="grid grid-cols-7 text-center font-serif text-[4.5cqw] leading-none text-cream-50">
          {CALENDAR.weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </Reveal>

      {CALENDAR_BOX.rules.map((y) => (
        <span key={y} aria-hidden className="absolute z-20 h-[0.42cqw] bg-cream-50" style={{ left: `${CALENDAR_BOX.weekdays.x}%`, top: `${y}%`, width: `${CALENDAR_BOX.weekdays.w}%` }} />
      ))}

      <Reveal delay={0.5} className="absolute z-20" style={{ left: `${CALENDAR_BOX.days.x}%`, top: `${CALENDAR_BOX.days.y}%`, width: `${CALENDAR_BOX.days.w}%` }}>
        <div className="grid grid-cols-7 text-center font-script text-[6.6cqw] leading-none text-cream-50">
          {CALENDAR.days.map((day) => (
            <span key={day} className="relative inline-flex items-center justify-center py-[1cqw]">
              {day === CALENDAR.highlight && <HeartMark />}
              <span className="relative">{day}</span>
            </span>
          ))}
        </div>
      </Reveal>
    </Slide>
  );
}

/** The hand-drawn heart the design scribbles around the 24th. */
function HeartMark() {
  return (
    <svg aria-hidden viewBox="0 0 32 29" className="absolute z-0 h-[10.4cqw] w-[10.8cqw]" style={{ color: "#e2607a" }} fill="currentColor">
      <path d="M16 28.5S1.2 19.6 1.2 10.3C1.2 5.2 5 1.5 9.6 1.5c3 0 5.2 1.6 6.4 3.5 1.2-1.9 3.4-3.5 6.4-3.5 4.6 0 8.4 3.7 8.4 8.8C30.8 19.6 16 28.5 16 28.5z" />
      <g stroke="#ffffff" strokeOpacity="0.42" strokeWidth="0.7">
        <path d="M6 9l7 12M10 6l8 15M15 5l8 15M20 6l7 12M25 9l4 7" />
      </g>
    </svg>
  );
}
