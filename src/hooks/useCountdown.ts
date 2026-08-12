import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True once the target moment has passed. */
  done: boolean;
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const split = (target: number, now: number): Remaining => {
  const left = target - now;
  if (left <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / SECOND),
    done: false,
  };
};

/**
 * Ticks down to `target`. The interval realigns to the wall clock each tick, so
 * the display does not drift after the tab has been backgrounded.
 */
export function useCountdown(target: Date): Remaining {
  const ms = target.getTime();
  const [remaining, setRemaining] = useState(() => split(ms, Date.now()));

  useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = Date.now();
      setRemaining(split(ms, now));
      if (now >= ms) return;
      timer = window.setTimeout(tick, SECOND - (now % SECOND));
    };
    timer = window.setTimeout(tick, SECOND - (Date.now() % SECOND));
    return () => window.clearTimeout(timer);
  }, [ms]);

  return remaining;
}
