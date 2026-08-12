import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

/** Below this the invitation column fills the screen edge to edge. */
const PHONE = "(max-width: 640px)";

const track = (query: string) => {
  const subscribe = (notify: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", notify);
    return () => mq.removeEventListener("change", notify);
  };
  return [subscribe, () => window.matchMedia(query).matches] as const;
};

const [subscribePhone, isPhone] = track(PHONE);

/** True on phone-sized screens. Live: it follows a rotation or a resize. */
function useIsPhone(): boolean {
  // Assume a phone before hydration — that is what most guests arrive on, and
  // guessing small means the first frame is never the heavier animation.
  return useSyncExternalStore(subscribePhone, isPhone, () => true);
}

type MotionProfile = {
  /** Multiplier on entrance travel: how far a piece slides before it settles. */
  travel: number;
  /** Base entrance duration, in seconds. */
  duration: number;
  /** Multiplier on staggered delays. */
  stagger: number;
  /** How much of an element must be visible before it animates in. */
  amount: number;
  reduced: boolean;
  phone: boolean;
};

/**
 * One place that decides how much the invitation moves.
 *
 * The artwork was tuned on a laptop, where a 38px slide is a small gesture
 * beside a 480px column. On a 360px phone that same 38px is a tenth of the
 * screen, the piece arrives from noticeably off-frame, and a second-long
 * entrance on every one of nine slides turns scrolling into waiting. Phones
 * therefore get shorter travel, quicker settling, and a lower visibility
 * threshold so artwork is already in place by the time it is read.
 */
export function useMotionProfile(): MotionProfile {
  const reduced = useReducedMotion() ?? false;
  const phone = useIsPhone();

  if (reduced) return { travel: 0, duration: 0.3, stagger: 0.35, amount: 0.02, reduced: true, phone };
  if (phone) return { travel: 0.5, duration: 0.72, stagger: 0.55, amount: 0.05, reduced: false, phone: true };
  return { travel: 1, duration: 1.05, stagger: 1, amount: 0.12, reduced: false, phone: false };
}
