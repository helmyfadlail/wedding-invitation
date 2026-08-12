import { motion, type MotionStyle } from "motion/react";
import type { ReactNode } from "react";
import { useMotionProfile } from "../../hooks/useMotionProfile";
import { cn } from "../../lib/cn";

const EASE_SILK = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  /** Seconds added to the reveal, for staggering siblings. */
  delay?: number;
  from?: "up" | "down" | "left" | "right" | "in";
  className?: string;
  style?: MotionStyle | undefined;
  as?: "div" | "p" | "h2" | "li" | "span";
};

const OFFSET = {
  up: { y: 26 },
  down: { y: -26 },
  left: { x: -30 },
  right: { x: 30 },
  in: { scale: 0.94 },
} as const;

/** Fades live text and UI into view the same way Art brings in the artwork. */
export function Reveal({ children, delay = 0, from = "up", className, style = {}, as = "div" }: RevealProps) {
  const motionProfile = useMotionProfile();
  const Tag = motion[as];

  const offset = OFFSET[from];
  const travel = motionProfile.travel;
  const shifted =
    travel === 0
      ? {}
      : {
          ...("x" in offset ? { x: offset.x * travel } : {}),
          ...("y" in offset ? { y: offset.y * travel } : {}),
          ...("scale" in offset ? { scale: 1 - (1 - offset.scale) * travel } : {}),
        };

  return (
    <Tag
      className={cn(className)}
      style={style}
      initial={{ opacity: 0, ...shifted }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      // A tall block — the RSVP card is most of a screen — never reaches a 30%
      // threshold on a phone until it is halfway past, so the bar comes down.
      viewport={{ once: true, amount: motionProfile.phone ? 0.08 : 0.3, margin: "0px 0px -6% 0px" }}
      transition={{ duration: motionProfile.duration * 0.9, delay: delay * motionProfile.stagger, ease: EASE_SILK }}
    >
      {children}
    </Tag>
  );
}
