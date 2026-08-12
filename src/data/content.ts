/**
 * Single source of truth for everything written on the invitation.
 * Transcribed from "Helmy Safira.pdf" — edit here, not in the components.
 */

/**
 * `nameLines` and `parentLines` reproduce the line breaks of the printed
 * design. They are split here, not left to the browser, because where these
 * lines wrap is a design decision — the balance of the two blocks either side
 * of the rings depends on it.
 */
export const COUPLE = {
  bride: {
    name: "Safira Luthfiana Husodo, S.Pd",
    nameLines: ["Safira Luthfiana", "Husodo, S.Pd"],
    short: "Safira",
    parentLines: ["Putri dari Bapak Agus Setiyo Husodo,", "S.E & Ibu Dwi Kristiana A.Ma.Pd.S.D"],
  },
  groom: {
    name: "M. Helmy fadlail Albab S.Kom",
    nameLines: ["M. Helmy fadlail", "Albab S.Kom"],
    short: "Helmy",
    parentLines: ["Putra dari Bapak (Alm) Drs. H. Shobri", "& Ibu Hj. Siti Nur Arifah, S.AP"],
  },
} as const;

/** Akad — the moment the countdown runs to. WIB = UTC+7. */
export const WEDDING_DATE = new Date("2026-10-24T09:00:00+07:00");

export const VENUE = {
  label: "Lokasi : Joglo Jolali",
  name: "Joglo Jolali",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Joglo+Jolali+Nganjuk",
} as const;

/** The October 2026 week that holds the wedding day. */
export const CALENDAR = {
  monthLabel: "OKTOBER",
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  days: [19, 20, 21, 22, 23, 24, 25],
  highlight: 24,
} as const;

export const VERSE = {
  text: `"Dan diantara tanda-tanda (kebesaran)-Nya ialah, Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tentram kepadanya, Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir."`,
  source: "(QS. Ar-Rum : 21)",
  intro: "Dengan memohon Rahmat dan Ridho dari Allah SWT, Kami bermaksud menyelenggarakan pernikahan kami",
} as const;

export const LOVE_STORY = `Kisah kami dimulai
pada tahun 2016, ketika 2 siswa
SMP dipertemukan di SMPN 1 Nganjuk dan
memutuskan untuk bersama pada 11 Oktober 2016.
Dari bangku sekolah hingga meraih gelar sarjana di
Universitas Brawijaya, kami berjalan berdampingan,
saling mendukung dalam setiap langkah & mimpi.
Setelah 10 tahun tumbuh bersama, tahun 2026
menjadi momen kami mengucapkan
"selamanya" dalam ikatan
pernikahan.`;

export const CLOSING = {
  text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir memberikan doa restu kepada kami.",
  salam: "Wassalamualaikum Wr. Wb",
} as const;

export const MUSIC = {
  /** Drop your track at public/audio/song.mp3 — see README. */
  src: "audio/song.mp3",
  title: "click to play music",
} as const;

export const RSVP_COPY = {
  title: "RSVP",
  subtitle: "Konfirmasi kehadiran Anda",
  fields: {
    name: "Nama Tamu",
    phone: "No. Telp",
    guests: "Jumlah Kehadiran",
    message: "Wishes & Doa",
  },
  submit: "Kirim RSVP",
  sending: "Mengirim…",
  wishesTitle: "Wishes",
  wishesEmpty: "Belum ada wishes",
  thanks: "Terima kasih! Ucapan Anda sudah kami terima 🤍",
} as const;
