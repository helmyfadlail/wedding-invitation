# Helmy &amp; Safira — Undangan Pernikahan Digital

A web version of the printed invitation in `reference/Helmy Safira.pdf`, built from the
artwork in `reference/`. Sabtu, 24 Oktober 2026 · Joglo Jolali.

```
npm install
npm run assets     # build web graphics from ./reference (already done once)
npm run dev        # http://localhost:5173
```

---

## What the guest sees

1. **Title card** — "Helmy & Safira" in gold on cream, held while the cover
   artwork decodes. It is drawn twice: once as plain HTML inside `index.html`, so
   it paints before the JavaScript arrives, and again by `Intro.tsx`, which adds
   the loading bar. Same words in the same place, so the handover is invisible.
2. **Cover** — page 1 of the PDF: the rose garden, the lace card, and
   "click to open". That tap also starts the music, because browsers only allow
   audio to begin from a real gesture.
3. **The invitation** — the nine slides of page 2, as one continuous scroll:
   opening collage · QS. Ar-Rum 21 · Bride and Groom · countdown &amp; Save The
   Date · akad and resepsi · Our Love Story · Our Gallery · RSVP · closing.

Extras the paper cannot do: a live countdown, a working RSVP and guestbook, a
tappable photo gallery, a Maps link, and background music.

---

## How the design is reproduced

The printed design is nine **1434 × 806** slides, each holding a portrait column
**494 px** wide. On the web that column is `max-width: 480px` with a locked
`494 / 806` aspect ratio, and every piece of artwork is placed as a **percentage**
of it. One set of numbers is therefore correct at every screen size — a phone and
a laptop show the same composition, not a reflowed version of it.

Those numbers live in [`src/data/layout.ts`](src/data/layout.ts) and were
**measured, not eyeballed**: `tools/locate-layout.mjs` template-matches each
cut-out against a render of the PDF, because a graphic sitting in the right place
covers pixels identical to itself.

Type inside the column is sized in **container query units** (`cqw`), so it
scales with the artwork instead of drifting away from it as the screen changes.

### Fonts

The artwork's own faces are not licensed for the web, so the closest Google Fonts
stand in — picked by rendering candidates side by side against the PDF, not by
guesswork:

| Role | Font | Used for |
| --- | --- | --- |
| Serif | **Cormorant Garamond** | body text, dates, the calendar, RSVP |
| Signature script | **Marck Script** | the couple's names, calendar numerals |
| Copperplate | **Pinyon Script** | "Helmy & Safira" on the title card |
| Sans | **Jost** | form labels, small UI |

### Artwork vs. web type

Fixed text that ships as artwork stays artwork, so the design is exact; anything
live or missing is set in web type. Two deliberate exceptions:

- **The couple's names** have no cut-out in the source at all.
- **The calendar** ships as two PNGs that were exported at different scales, so
  "Sat" no longer sits above "24". A seven-column CSS grid cannot drift.
- **The parents' names** ship as PNGs whose lines break differently from the
  print layout, so they are re-set with the printed breaks.

Every graphic that carries words passes them along as `alt` text, so the
invitation still reads correctly with a screen reader.

---

## Editing the content

Almost everything a couple would want to change is in **one file**:
[`src/data/content.ts`](src/data/content.ts) — names, parents, dates, times,
venue and Maps link, the verse, the love story, and all RSVP copy.

The countdown target is `WEDDING_DATE` in that file (WIB / UTC+7).

### Music

Drop the track at **`public/audio/song.mp3`**. See
[`public/audio/README.md`](public/audio/README.md). The record on slide 1 and the
floating button both appear only when the file exists, so the invitation never
shows a control that cannot work.

### Per-guest links

Append `?to=` and the invitation greets that guest on the cover and pre-fills the
RSVP name:

```
https://your-domain.com/?to=Bapak%20Budi%20Santoso
```

Without it, the cover is exactly the printed design.

### Replacing photos

Put the new file in `reference/` under the same name and run `npm run assets`.
The pipeline trims, resizes, re-encodes and re-writes the manifest. Then check
the composition still lines up:

```bash
npm run layout:render     # PDF -> tools/.preview/pdf-page{1,2}.png  (once)
npm run layout:preview    # proof sheets: design | reconstruction | difference
npm run layout:locate     # re-measure positions, if a graphic moved
```

`tools/.preview/` is gitignored, so run `layout:render` once after cloning if you
intend to touch `src/data/layout.ts`.

---

## RSVP and the guestbook

Out of the box this is a static site with nowhere to POST, so entries are kept in
**localStorage**: the form works, the guest sees their wish appear, and the card
says so rather than pretending the message was sent.

To collect RSVPs for real, point one environment variable at any endpoint that
speaks JSON — Google Apps Script, a Cloudflare Worker, Formspree, Supabase:

```bash
cp .env.example .env
```

```bash
# .env  (gitignored)
VITE_RSVP_ENDPOINT=https://script.google.com/macros/s/AKfy.../exec
```

Restart `npm run dev` afterwards — Vite reads env files at startup, so the
change will not hot-reload.

The contract is two calls, in [`src/features/rsvp/store.ts`](src/features/rsvp/store.ts):

- `GET` → an array of wishes (or `{ "wishes": [...] }`)
- `POST` → one wish: `{ id, name, phone, attendance, guests, message, at }`

`attendance` is `"hadir"` or `"tidak-hadir"`, and `guests` is `0` whenever the
guest is not coming. Entries written before the attendance column existed are
read back as `"hadir"` rather than being dropped.

The UI, validation and optimistic update stay the same either way.

### Getting a Google Apps Script URL

[`tools/rsvp-apps-script.gs`](tools/rsvp-apps-script.gs) is the backend, ready to
paste. It writes each RSVP as a row and reads them back out.

1. Create a Google Sheet — this is where the guest list lives.
2. In that sheet: **Extensions → Apps Script**. Delete the sample `myFunction`.
3. Paste the whole of `tools/rsvp-apps-script.gs` in, and save (💾).
4. **Deploy → New deployment**. Click the gear next to "Select type" and choose
   **Web app**.
5. Set:
   - **Execute as** — *Me*. The script needs your permission to write to the sheet.
   - **Who has access** — ***Anyone***. Not "Anyone with Google account": your
     guests will not be signed in, and that setting turns every RSVP into a
     login page.
6. **Deploy**, then authorise it. Google will warn that the app is unverified —
   *Advanced → Go to (project name)* → *Allow*. That warning is expected for
   your own script.
7. Copy the **Web app URL**. It ends in `/exec`:

   ```
   https://script.google.com/macros/s/AKfycb...../exec
   ```

8. Put it in `.env` as `VITE_RSVP_ENDPOINT`, restart the dev server, and submit
   a test RSVP. A row should appear in the sheet within a second or two.

**Re-deploying after an edit.** Apps Script pins each deployment to a snapshot of
the code, so editing the script does not change what the live URL serves. Use
**Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. That keeps
the same `/exec` URL. Picking "New deployment" instead gives you a *different*
URL and leaves the old one running the old code.

**Checking it without the site:** open the `/exec` URL in a browser tab. A
working deployment returns `[]` (or your rows) as JSON. If you get a login
screen, step 5's access setting is wrong; if you get an error page, open
**Executions** in the Apps Script editor to see what threw.

---

## Deploying

It is a static bundle — any host works.

```bash
npm run build      # -> dist/
```

`vite.config.ts` sets `base: "./"`, so `dist/` is portable: serve it from a
domain root, a sub-folder (GitHub Pages), or open it from disk.

Vercel / Netlify / Cloudflare Pages: build `npm run build`, publish `dist`.

The `og:image` and `theme-color` are already set, so the link previews as the
cover artwork when it is shared on WhatsApp.

---

## Performance

The source artwork is **70 MB**, including a 50 MB animated GIF of the photobooth
strip — unusable on the mobile data most guests will open this on. The strip is a
*live* one, so it is re-encoded rather than flattened: `npm run assets` runs the
60 frames through ffmpeg into a 2-second H.264 + VP9 loop, which is the same
animation at roughly a two-hundredth of the bytes. A poster frame covers the
first paint and anyone browsing with reduced motion turned on.
`npm run assets` brings it to **3.9 MB**:

| | before | after |
| --- | --- | --- |
| Artwork | 20 MB PNG/JPEG | 3.4 MB WebP, transparent margins trimmed |
| Love-story photo | 5.4 MB JPEG + frame | 71 KB frame + 29 KB photo, layered in the markup |
| Photobooth GIF | 50 MB, 60 frames | 129 KB mp4 + 115 KB webm loop, 128 KB poster, six 20 KB stills |
| **Total** | **70 MB** | **3.9 MB** |

The intro screen only waits on the graphics the cover needs; the rest stream in
lazily as the guest scrolls. Every `<img>` carries its intrinsic size, so nothing
shifts as it loads.

---

## Project layout

```
reference/                  original artwork (source of truth, not shipped)
  Helmy Safira.pdf          the printed design

tools/
  build-assets.mjs          reference/ -> public/assets/ + manifest, favicon, og-image
  render-pdf.mjs            the PDF -> PNG reference the two layout tools read
  locate-layout.mjs         measures where each cut-out belongs, by template matching
  preview-layout.mjs        proof sheets: design | reconstruction | difference

public/
  assets/                   generated web graphics — do not hand-edit
  audio/                    put song.mp3 here

src/
  data/
    content.ts              ALL wording, dates, venue, links
    layout.ts               measured positions of every graphic
    asset-manifest.json     generated: intrinsic sizes
  lib/assets.ts             asset paths + sizes
  hooks/                    useCountdown, useBackgroundMusic, usePreload
  features/rsvp/            guestbook store (localStorage or your endpoint) + hook
  components/
    Intro.tsx               title card
    Cover.tsx               PDF page 1
    Invitation.tsx          the nine slides, in order
    MusicToggle.tsx         floating control
    ui/                     Slide, Art, Reveal, Petals, Lightbox
    sections/               one file per slide
```

`Slide` owns a band of the page: full-bleed paper texture, the centred column,
and the container-query context. `Art` places one cut-out and animates it in.
Between them, a section file is mostly a list of positions.

---

## Notes

- **Motion** ([`motion`](https://motion.dev), Framer Motion's successor) drives
  the reveals, the cover, the spinning record and the lightbox. Everything
  honours `prefers-reduced-motion` — animations shorten and the petals and drift
  stop entirely.
- **Accessibility**: real buttons and links, visible focus rings, labelled form
  fields, `alt` text on every graphic that carries words, and the love story and
  closing text also present as real text for screen readers.
- The record only spins while the track is playing, so the artwork itself is the
  play/pause state. Music pauses when the tab is hidden.
- No horizontal scroll at any width from 320 px up.

Built with React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 and Motion.
