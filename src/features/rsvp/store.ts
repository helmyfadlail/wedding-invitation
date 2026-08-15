/**
 * Guestbook storage.
 *
 * Out of the box the invitation is a static site with nowhere to POST, so
 * entries are kept in localStorage: the form works, the guest sees their wish
 * appear, and nothing silently vanishes into a dead endpoint.
 *
 * Point VITE_RSVP_ENDPOINT at an HTTP endpoint (Google Apps Script, Formspree,
 * a Worker, anything that accepts JSON) and the same UI writes there instead —
 * GET returns the list, POST accepts one entry. See README.
 */

/** Whether the guest is coming. The whole point of an RSVP. */
export type Attendance = "hadir" | "tidak-hadir";

export type Wish = {
  id: string;
  name: string;
  phone: string;
  attendance: Attendance;
  guests: number;
  message: string;
  /** Epoch milliseconds. */
  at: number;
};

export type NewWish = Omit<Wish, "id" | "at">;

const KEY = "helmy-safira.rsvp.v1";
const ENDPOINT: string | undefined = import.meta.env.VITE_RSVP_ENDPOINT;

const ATTENDANCE: readonly string[] = ["hadir", "tidak-hadir"];

const asTime = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  // A spreadsheet hands back an ISO string, not epoch milliseconds.
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

/**
 * Rows arrive from three places — this device's storage, whatever sheet or
 * worker the endpoint is backed by, and entries written before the attendance
 * column existed — so missing fields are filled in rather than the whole row
 * thrown away. Only a row with no id or no name is unusable.
 *
 * An entry from before this column is treated as "hadir": at the time, saying
 * you were not coming was not something the form could express.
 */
const toWish = (value: unknown): Wish | null => {
  if (typeof value !== "object" || value === null) return null;
  const w = value as Record<string, unknown>;
  if (typeof w.id !== "string" || typeof w.name !== "string") return null;

  const guests = Number(w.guests);
  const attendance = ATTENDANCE.includes(w.attendance as string) ? (w.attendance as Attendance) : "hadir";

  return {
    id: w.id,
    name: w.name,
    phone: typeof w.phone === "string" ? w.phone : "",
    attendance,
    guests: attendance === "tidak-hadir" ? 0 : Number.isFinite(guests) && guests > 0 ? guests : 1,
    message: typeof w.message === "string" ? w.message : "",
    at: asTime(w.at),
  };
};

const parseWishes = (rows: unknown): Wish[] => (Array.isArray(rows) ? rows.map(toWish).filter((w): w is Wish => w !== null) : []);

function readLocal(): Wish[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return parseWishes(JSON.parse(raw));
  } catch {
    return []; // private mode, quota, or hand-edited junk — start clean
  }
}

function writeLocal(wishes: Wish[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(wishes));
  } catch {
    /* storage unavailable: the wish still shows for this session */
  }
}

const newId = (): string => globalThis.crypto?.randomUUID?.() ?? `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function listWishes(): Promise<Wish[]> {
  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Gagal memuat wishes (${res.status})`);
    const data: unknown = await res.json();
    const rows = Array.isArray(data) ? data : (data as { wishes?: unknown }).wishes;
    return parseWishes(rows).sort((a, b) => b.at - a.at);
  }
  return readLocal().sort((a, b) => b.at - a.at);
}

export async function addWish(input: NewWish): Promise<Wish> {
  const wish: Wish = { ...input, id: newId(), at: Date.now() };

  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // avoids preflight
      },
      body: JSON.stringify(wish),
    });
    if (!res.ok) throw new Error(`Gagal mengirim RSVP (${res.status})`);
    return wish;
  }

  writeLocal([wish, ...readLocal()]);
  return wish;
}

/** True when wishes are only on this device, which the UI says out loud. */
export const isLocalOnly = (): boolean => !ENDPOINT;
