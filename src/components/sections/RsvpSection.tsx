import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { RSVP_COPY } from "../../data/content";
import { isLocalOnly } from "../../features/rsvp/store";
import { useGuestbook } from "../../features/rsvp/useGuestbook";
import { Reveal } from "../ui/Reveal";
import { Slide } from "../ui/Slide";

const MAX_GUESTS = 10;

/**
 * Slide 8 — RSVP.
 *
 * The design shows a mock form on a maroon mat; this is the working version,
 * with the same four fields and the wishes list beneath. `mode="flow"` because
 * the card grows as wishes come in, unlike the fixed artwork slides.
 *
 * With no backend configured, entries live in localStorage and the card says so
 * rather than pretending they were sent. See features/rsvp/store.ts.
 */
export function RsvpSection({ guestName }: { guestName: string | null }) {
  const { wishes, loading, status, error, submit } = useGuestbook();
  const [name, setName] = useState(guestName ?? "");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");

  // A link with ?to= should arrive with the name already filled in.
  useEffect(() => {
    if (guestName) setName(guestName);
  }, [guestName]);

  const sending = status === "sending";
  const sent = status === "sent";

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || sending) return;
    const ok = await submit({ name: name.trim(), phone: phone.trim(), guests, message: message.trim() });
    if (ok) setMessage("");
  };

  return (
    <Slide id="rsvp" bg="maroon" mode="flow" label="RSVP" className="py-[9cqw]">
      {/* the maroon mat from the design */}
      <div aria-hidden className="absolute inset-x-[6%] top-[3cqw] bottom-[3cqw] rounded-[1.5cqw]" style={{ backgroundColor: "#7d3232" }} />

      {/* Wider on a phone: at 74% the form sits in a 266px box, and a card that
          narrow is what pushes the fields down to unreadable sizes. The maroon
          mat still shows either side. */}
      <Reveal className="relative mx-auto w-[80%] sm:w-[74%]" from="in">
        <div className="rounded-[1.2cqw] bg-cream-50 px-[6cqw] py-[7cqw] shadow-[0_14px_38px_rgba(37,6,7,0.35)]">
          <h2 className="text-center font-serif text-[8cqw] leading-none tracking-[0.06em] text-wine-800">{RSVP_COPY.title}</h2>
          <p className="mt-[1.6cqw] text-center font-serif text-[max(0.8rem,3.3cqw)] tracking-wider text-wine-600/70">{RSVP_COPY.subtitle}</p>
          <div aria-hidden className="mx-auto mt-[4cqw] h-px w-[38%] rule-gilt" />

          <form onSubmit={onSubmit} className="mt-[5cqw] space-y-[3.4cqw]">
            <Field label={RSVP_COPY.fields.name} htmlFor="rsvp-name">
              <input id="rsvp-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={INPUT} />
            </Field>

            <Field label={RSVP_COPY.fields.phone} htmlFor="rsvp-phone">
              <input id="rsvp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" className={INPUT} />
            </Field>

            <Field label={RSVP_COPY.fields.guests} htmlFor="rsvp-guests">
              <select
                id="rsvp-guests"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className={`${INPUT} appearance-none bg-size-[1.2em] bg-position-[right_0.6rem_center] bg-no-repeat pr-8`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237b2a2a' stroke-width='1.6'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                }}
              >
                {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} orang
                  </option>
                ))}
              </select>
            </Field>

            <Field label={RSVP_COPY.fields.message} htmlFor="rsvp-message">
              <textarea id="rsvp-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} className={`${INPUT} resize-none leading-normal`} />
            </Field>

            <button
              type="submit"
              disabled={sending || !name.trim()}
              className="mt-[1.5cqw] w-full cursor-pointer rounded-[0.8cqw] bg-wine-800 py-[3.2cqw] font-sans text-[max(0.8125rem,3.4cqw)] font-medium tracking-[0.16em] text-cream-50 uppercase transition duration-300 hover:bg-wine-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sending ? RSVP_COPY.sending : RSVP_COPY.submit}
            </button>

            <AnimatePresence>
              {sent && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-center font-serif text-[max(0.8125rem,3.2cqw)] text-wine-600"
                >
                  {RSVP_COPY.thanks}
                </motion.p>
              )}
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="alert" className="text-center font-sans text-[max(0.78rem,3cqw)] text-wine-700">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          <div aria-hidden className="mx-auto mt-[6cqw] h-px w-full bg-cream-300" />

          <h3 className="mt-[5cqw] text-center font-serif text-[max(1.05rem,5.2cqw)] font-semibold tracking-[0.04em] text-wine-600">{RSVP_COPY.wishesTitle}</h3>

          {loading ? (
            <p className="mt-[3cqw] text-center font-serif text-[max(0.8rem,3.1cqw)] text-wine-600/45 italic">Memuat…</p>
          ) : wishes.length === 0 ? (
            <p className="mt-[3cqw] text-center font-serif text-[max(0.8rem,3.1cqw)] text-wine-600/45 italic">{RSVP_COPY.wishesEmpty}</p>
          ) : (
            <ul className="mt-[3.4cqw] max-h-[74cqw] space-y-[2.4cqw] overflow-y-auto pr-[1cqw] scrollbar-none">
              <AnimatePresence initial={false}>
                {wishes.map((wish) => (
                  <motion.li key={wish.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[0.8cqw] bg-blush-400/22 px-[3.4cqw] py-[2.8cqw]">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-serif text-[max(0.8125rem,3.5cqw)] font-semibold text-wine-800">{wish.name}</p>
                      <p className="font-sans text-[max(0.6875rem,2.5cqw)] whitespace-nowrap text-wine-600/50">{formatWhen(wish.at)}</p>
                    </div>
                    {wish.message && <p className="mt-[1.2cqw] font-serif text-[max(0.8125rem,3.2cqw)] leading-[1.45] text-wine-800/80">{wish.message}</p>}
                    <p className="mt-[1.2cqw] font-sans text-[max(0.6875rem,2.5cqw)] tracking-widest text-wine-600/45">{wish.guests} orang</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {isLocalOnly() && <p className="mt-[4cqw] text-center font-sans text-[max(0.66rem,2.4cqw)] leading-normal text-wine-600/40">Ucapan tersimpan di perangkat ini.</p>}
        </div>
      </Reveal>
    </Slide>
  );
}

/**
 * The 16px floor is not cosmetic: iOS Safari zooms the whole page in when a
 * field smaller than that takes focus, and it does not zoom back out. On a
 * 360px phone 3.6cqw is 13px, which is exactly how the form ends up throwing
 * the guest into a scaled-up, sideways-scrolling page mid-RSVP.
 */
const INPUT =
  "w-full rounded-[0.7cqw] border border-cream-300 bg-white px-[3cqw] py-[2.6cqw] font-serif text-[max(1rem,3.6cqw)] text-wine-900 outline-none [font-variant-numeric:lining-nums] transition duration-200 focus:border-wine-600 focus:ring-2 focus:ring-wine-600/15";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-[1.2cqw] block font-sans text-[max(0.75rem,3.1cqw)] font-light text-wine-800/75">
        {label}
      </label>
      {children}
    </div>
  );
}

const formatWhen = (at: number): string => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(at));
