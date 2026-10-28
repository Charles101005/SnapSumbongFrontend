import { useEffect, useRef, useState } from "react";
import "./Toast.css";

const DISMISS_MS = 4500;

// Lightweight auto-dismissing toast. The parent controls it: render the
// region once, pass a `message` to show it, and clear the message through
// `onDismiss`. The timer pauses while the toast is hovered or focused so
// the message stays readable, and announcements go through aria-live.
export default function Toast({ message, variant = "success", onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(DISMISS_MS);
  const startedRef = useRef(0);
  const onDismissRef = useRef(onDismiss);

  // Keep the latest callback without re-arming the timer each render.
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  // A new message always gets the full display time.
  useEffect(() => {
    remainingRef.current = DISMISS_MS;
  }, [message]);

  // Countdown; interrupted (not reset) by pause/resume via hover or focus.
  useEffect(() => {
    if (!message || paused) return undefined;
    startedRef.current = Date.now();
    const id = setTimeout(() => onDismissRef.current?.(), remainingRef.current);
    return () => {
      clearTimeout(id);
      remainingRef.current = Math.max(
        0,
        remainingRef.current - (Date.now() - startedRef.current)
      );
    };
  }, [message, paused]);

  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {message && (
        <div
          className={`toast toast-${variant}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <span className="toast-icon" aria-hidden="true">
            {variant === "error" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
          </span>
          <span className="toast-message">{message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => onDismissRef.current?.()}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
