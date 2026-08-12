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

export type Wish = {
  id: string;
  name: string;
  phone: string;
  guests: number;
  message: string;
  /** Epoch milliseconds. */
  at: number;
};

export type NewWish = Omit<Wish, "id" | "at">;

const KEY = "helmy-safira.rsvp.v1";
const ENDPOINT: string | undefined = import.meta.env.VITE_RSVP_ENDPOINT;

const isWish = (value: unknown): value is Wish => {
  if (typeof value !== "object" || value === null) return false;
  const w = value as Record<string, unknown>;
  return typeof w.id === "string" && typeof w.name === "string" && typeof w.message === "string";
};

function readLocal(): Wish[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isWish) : [];
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
    return (Array.isArray(rows) ? rows.filter(isWish) : []).sort((a, b) => b.at - a.at);
  }
  return readLocal().sort((a, b) => b.at - a.at);
}

export async function addWish(input: NewWish): Promise<Wish> {
  const wish: Wish = { ...input, id: newId(), at: Date.now() };

  if (ENDPOINT) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
