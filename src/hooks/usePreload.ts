import { useEffect, useState } from "react";

/**
 * Decodes a list of images and reports progress 0..1.
 *
 * A failed image still counts as done — a missing graphic must never strand the
 * guest on the intro screen — and the whole thing gives up after `timeoutMs` so
 * a slow connection sees the invitation rather than a spinner.
 */
export function usePreload(sources: readonly string[], timeoutMs = 9000): number {
  const [loaded, setLoaded] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let done = 0;

    const step = () => {
      done += 1;
      if (!cancelled) setLoaded(done);
    };

    const images = sources.map((src) => {
      const img = new Image();
      img.onload = step;
      img.onerror = step;
      img.src = src;
      return img;
    });

    const timer = window.setTimeout(() => {
      if (!cancelled) setExpired(true);
    }, timeoutMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      for (const img of images) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [sources, timeoutMs]);

  if (expired || sources.length === 0) return 1;
  return Math.min(1, loaded / sources.length);
}
