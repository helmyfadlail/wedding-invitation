import { VERSE } from "../../data/layout";
import { ArtLayer } from "../ui/Art";
import { Slide } from "../ui/Slide";

/**
 * Slide 2 — QS. Ar-Rum 21, then the bismillah and the couple's intention.
 *
 * The lace frame ships with the verse already set inside it, so it stays a
 * single graphic; its alt text carries the words for anyone reading with a
 * screen reader.
 */
export function VerseSection() {
  return (
    <Slide id="ayat" bg="maroon" label="QS. Ar-Rum 21">
      <ArtLayer pieces={VERSE} />
    </Slide>
  );
}
