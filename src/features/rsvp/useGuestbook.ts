import { useCallback, useEffect, useState } from "react";
import { addWish, listWishes, type NewWish, type Wish } from "./store";

type Status = "idle" | "sending" | "sent" | "error";

export function useGuestbook() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listWishes()
      .then((rows) => alive && setWishes(rows))
      .catch(() => alive && setWishes([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const submit = useCallback(async (input: NewWish) => {
    setStatus("sending");
    setError(null);
    try {
      const wish = await addWish(input);
      // Show it straight away rather than waiting on a round trip.
      setWishes((prev) => [wish, ...prev]);
      setStatus("sent");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
      setStatus("error");
      return false;
    }
  }, []);

  return { wishes, loading, status, error, submit };
}
