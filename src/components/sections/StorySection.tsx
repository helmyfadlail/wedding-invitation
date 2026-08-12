import { STORY } from "../../data/layout";
import { LOVE_STORY } from "../../data/content";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * Slide 6 — Our Love Story.
 *
 * The ornate badge ships with the story already set inside it, so it stays one
 * graphic; the same words go into a visually hidden paragraph so the story is
 * still readable by assistive tech and searchable.
 */
export function StorySection() {
  return (
    <Slide id="cerita" bg="cream" label="Our Love Story">
      <ArtLayer pieces={STORY} />
      <p className="sr-only">{LOVE_STORY}</p>
    </Slide>
  );
}
