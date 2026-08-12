# Background music

Put the track here as **`song.mp3`**:

```
public/audio/song.mp3
```

That is the only step. The record on the opening slide ("click to play music") and
the floating button in the corner both appear automatically once the file is
there, and both disappear if it is missing — so the invitation never shows a
control that cannot work.

The path is set in [`src/data/content.ts`](../../src/data/content.ts) if you want
a different filename or format:

```ts
export const MUSIC = {
  src: "audio/song.mp3",
  title: "click to play music",
};
```

Notes:

- **Keep it small.** Guests open this on mobile data. Aim for under ~3 MB —
  a 2-3 minute clip at 128 kbps is about right. It streams, so it does not hold
  up the rest of the page.
- **Format.** `.mp3` plays everywhere. `.m4a`/`.aac` also work; `.ogg` does not
  play on iOS Safari.
- **Playback starts on the guest's tap** of "click to open", because browsers do
  not allow audio to start on its own. That is intended, not a bug. If the
  browser refuses even that — iOS Low Power Mode does — the next thing the guest
  touches starts it instead.
- Music pauses when the guest switches tabs, and picks up again on return.
- The controls are hidden only when the server says the file is not there. They
  are *not* hidden just because the browser has yet to fetch it: iOS Safari does
  not touch media until the guest interacts, so waiting for a `canplay` event
  would hide a perfectly good track on every iPhone.
- **Licensing.** Use a track you have the right to use — something you own, or
  from a royalty-free library. A public wedding invitation is a public
  performance, so a commercial pop song is not automatically fine.
