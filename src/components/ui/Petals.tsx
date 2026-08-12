import { useMemo } from "react";
import { useMotionProfile } from "../../hooks/useMotionProfile";

const TONES = ["#e9b9b9", "#f0cccc", "#dda3a3", "#f6e0d6", "#e7c3b4"];

/**
 * Rose petals drifting over the cover, echoing the garden artwork behind them.
 * Pure CSS animation so it costs nothing on the main thread, and it disappears
 * entirely for guests who ask for reduced motion.
 *
 * Fourteen of them is a scatter across a laptop and a snowstorm across a phone,
 * so the count comes down with the screen — which also spares the battery on
 * the one device where fourteen composited layers actually cost something.
 */
export function Petals({ count = 14 }: { count?: number }) {
  const { reduced, phone } = useMotionProfile();
  const total = phone ? Math.round(count * 0.55) : count;

  const petals = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => {
        // Deterministic scatter: no hydration mismatch, no re-randomising.
        const seed = (i * 9301 + 49297) % 233280;
        const r = seed / 233280;
        const r2 = (((i + 1) * 4231) % 97) / 97;
        return {
          left: 4 + r * 92,
          size: 7 + r2 * 9,
          duration: 13 + r * 11,
          delay: -(r2 * 20),
          drift: (r - 0.5) * 16,
          spin: 180 + r2 * 320,
          tone: TONES[i % TONES.length],
          opacity: 0.45 + r2 * 0.4,
        };
      }),
    [total],
  );

  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.68}px`,
            background: `radial-gradient(circle at 30% 30%, #fff8, ${p.tone})`,
            borderRadius: "60% 40% 55% 45% / 60% 55% 45% 40%",
            opacity: p.opacity,
            filter: "blur(0.2px)",
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
            ["--drift" as string]: `${p.drift}vw`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}
