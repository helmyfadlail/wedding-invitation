import { useCallback, useEffect, useRef, useState } from "react";

type Music = {
  playing: boolean;
  /** False only once we know the file is missing — see the probe below. */
  available: boolean;
  toggle: () => void;
  play: () => void;
};

/** Gestures that count as "the guest touched the page", for a retried start. */
const GESTURES = ["pointerdown", "touchend", "keydown"] as const;

/**
 * One looping background track for the whole invitation.
 *
 * Browsers only allow audio to start from a user gesture, which suits the
 * design: the guest taps "click to open", and that same tap starts the music.
 *
 * Availability is deliberately *not* inferred from `canplay`. iOS Safari does
 * not fetch media at all until the guest interacts, so on a phone that event
 * may never arrive and a working track would look missing — which is exactly
 * how the controls came to be hidden. Instead the file is probed over HTTP and
 * the answer is only ever negative when the server says the track is not there.
 */
export function useBackgroundMusic(src: string, volume = 0.6): Music {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(true);
  /** Set when the guest wants music but the browser has not allowed it yet. */
  const wanted = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.src = src;
    audio.loop = true;
    // "auto" would pull the whole track down on cellular before anyone asks
    // for it; the tap that starts playback streams the rest.
    audio.preload = "metadata";
    audio.volume = volume;
    ref.current = audio;

    const onPlay = () => {
      wanted.current = true;
      setPlaying(true);
      setAvailable(true);
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      setAvailable(false);
      setPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("error", onError);

    // Ask the server directly rather than waiting on the media element. A 404
    // (the track was never added) hides the controls; anything else leaves them.
    const abort = new AbortController();
    fetch(src, { method: "HEAD", signal: abort.signal })
      .then((response) => {
        if (!response.ok) setAvailable(false);
      })
      .catch(() => {
        /* offline, file://, or HEAD refused — trust the media element instead */
      });

    return () => {
      abort.abort();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      ref.current = null;
    };
  }, [src, volume]);

  const play = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    wanted.current = true;
    const started = audio.play();
    if (started) void started.catch(() => undefined);
  }, []);

  /*
    If the browser refused that first attempt — iOS Low Power Mode, or a
    desktop autoplay block that swallowed the gesture — try again on the very
    next thing the guest touches, once. Without this the music simply never
    starts and nothing on screen explains why.
  */
  useEffect(() => {
    if (playing || !available) return;

    const retry = () => {
      if (!wanted.current) return;
      const audio = ref.current;
      if (!audio || !audio.paused) return;
      const started = audio.play();
      if (started) void started.catch(() => undefined);
    };

    for (const type of GESTURES) window.addEventListener(type, retry, { passive: true });
    return () => {
      for (const type of GESTURES) window.removeEventListener(type, retry);
    };
  }, [playing, available]);

  // A tab switch should not leave music playing over whatever comes next — but
  // coming back should pick it up again, not leave the guest with silence.
  useEffect(() => {
    const onVisibility = () => {
      const audio = ref.current;
      if (!audio) return;
      if (document.hidden) audio.pause();
      else if (wanted.current) {
        const started = audio.play();
        if (started) void started.catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const toggle = useCallback(() => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) play();
    else {
      wanted.current = false;
      audio.pause();
    }
  }, [play]);

  return { playing, available, toggle, play };
}
