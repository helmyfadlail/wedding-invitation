import { motion } from "motion/react";
import { MusicToggle } from "./MusicToggle";
import { ClosingSection } from "./sections/ClosingSection";
import { CoupleSection } from "./sections/CoupleSection";
import { GallerySection } from "./sections/GallerySection";
import { HeroSection } from "./sections/HeroSection";
import { RsvpSection } from "./sections/RsvpSection";
import { SaveTheDateSection } from "./sections/SaveTheDateSection";
import { ScheduleSection } from "./sections/ScheduleSection";
import { StorySection } from "./sections/StorySection";
import { VerseSection } from "./sections/VerseSection";

type InvitationProps = {
  playing: boolean;
  musicAvailable: boolean;
  onToggleMusic: () => void;
  guestName: string | null;
};

/**
 * The invitation itself: the nine slides of the printed design, in order, as one
 * continuous scroll.
 */
export function Invitation({ playing, musicAvailable, onToggleMusic, guestName }: InvitationProps) {
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
      <HeroSection playing={playing} musicAvailable={musicAvailable} onToggleMusic={onToggleMusic} />
      <VerseSection />
      <CoupleSection />
      <SaveTheDateSection />
      <ScheduleSection />
      <StorySection />
      <GallerySection />
      <RsvpSection guestName={guestName} />
      <ClosingSection />

      {musicAvailable && <MusicToggle playing={playing} onToggle={onToggleMusic} />}
    </motion.main>
  );
}
