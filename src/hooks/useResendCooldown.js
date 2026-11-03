import { useCallback, useEffect, useState } from "react";

// Resend-cooldown countdown for OTP screens (register, forgot password,
// email change). Backed by an absolute deadline rather than a decremented
// counter so it can't drift or double-count, and so a deadline restored
// from sessionStorage keeps counting down correctly across a refresh.
//
//   const { secondsLeft, isCoolingDown, start } = useResendCooldown();
//   start(response.retry_after_seconds);   // from request/resend success
//   start(err.meta.retry_after_seconds);   // from a 429 cooldown error
//
// While `isCoolingDown` is true the resend button is disabled AND the
// handler should early-return, so the backend is never called during
// the cooldown.
export function useResendCooldown(initialSeconds = 0) {
  const [deadline, setDeadline] = useState(() =>
    initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : null
  );
  const [now, setNow] = useState(() => Date.now());

  // Tick only while a cooldown is running. Clearing the deadline happens
  // inside the interval callback (not the effect body), which both stops
  // this effect via its dependency and flips `isCoolingDown` to false.
  useEffect(() => {
    if (deadline === null) return;

    const id = setInterval(() => {
      const current = Date.now();

      if (current >= deadline) setDeadline(null);
      else setNow(current);
    }, 250);

    return () => clearInterval(id);
  }, [deadline]);

  const start = useCallback((seconds) => {
    if (typeof seconds !== "number" || seconds <= 0) {
      setDeadline(null);
      return;
    }

    setNow(Date.now());
    setDeadline(Date.now() + seconds * 1000);
  }, []);

  const startAt = useCallback((epochMs) => {
    if (typeof epochMs !== "number" || epochMs <= Date.now()) {
      setDeadline(null);
      return;
    }

    setNow(Date.now());
    setDeadline(epochMs);
  }, []);

  const clear = useCallback(() => setDeadline(null), []);

  const secondsLeft =
    deadline === null ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000));

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start, startAt, clear };
}
