import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cover } from "./components/Cover";
import { Intro } from "./components/Intro";
import { Invitation } from "./components/Invitation";
import { MUSIC } from "./data/content";
import { useBackgroundMusic } from "./hooks/useBackgroundMusic";
import { usePreload } from "./hooks/usePreload";
import { asset, CRITICAL, publicUrl } from "./lib/assets";

/** intro (names) -> cover (page 1) -> invitation (pages 2-10). */
type Stage = "intro" | "cover" | "open";

/** `?to=Nama%20Tamu` personalises the cover and pre-fills the RSVP. */
function readGuestName(): string | null {
  const raw = new URLSearchParams(window.location.search).get("to");
  if (!raw) return null;
  const name = raw.replace(/[+_]/g, " ").trim().slice(0, 60);
  return name.length ? name : null;
}

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");
  const guestName = useMemo(readGuestName, []);

  const sources = useMemo(() => CRITICAL.map(asset), []);
  const progress = usePreload(sources);

  // publicUrl, not asset(): the track sits at /audio/song.mp3, and asset()
  // would look for it under /assets/ — which is why it never played.
  const music = useBackgroundMusic(publicUrl(MUSIC.src));

  // Hold the intro until the cover artwork is decoded, with a floor of ~1.7s so
  // the names read as a title card rather than a flash on a fast connection.
  useEffect(() => {
    if (stage !== "intro") return;
    if (progress < 1) return;
    const timer = window.setTimeout(() => setStage("cover"), 600);
    return () => window.clearTimeout(timer);
  }, [progress, stage]);

  // Nothing scrolls until the invitation is open.
  useEffect(() => {
    const locked = stage !== "open";
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  const open = useCallback(() => {
    setStage("open");
    // Same gesture, so the browser lets the music start.
    music.play();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [music]);

  return (
    <>
      {/* Mounted from the start so the artwork is warm the moment the cover lifts. */}
      {stage === "open" && <Invitation playing={music.playing} musicAvailable={music.available} onToggleMusic={music.toggle} guestName={guestName} />}

      <AnimatePresence>{stage === "cover" && <Cover key="cover" onOpen={open} guestName={guestName} />}</AnimatePresence>

      <AnimatePresence>{stage === "intro" && <Intro key="intro" progress={progress} />}</AnimatePresence>
    </>
  );
}
