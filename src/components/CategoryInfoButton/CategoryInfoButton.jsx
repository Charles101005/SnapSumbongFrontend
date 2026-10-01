import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import "./CategoryInfoButton.css";

const EDGE_GAP = 8;
const ANCHOR_GAP = 6;

export default function CategoryInfoButton({ categoryName = "", description = "" }) {
  const [open, setOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const rootRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useId();

  const text = typeof description === "string" ? description.trim() : "";

  // Position the popover in its default spot first, then flip it up/left if it
  // would leave the viewport. Runs before paint so the flip is never visible.
  useLayoutEffect(() => {
    if (!open) return;
    const pop = popoverRef.current;
    const root = rootRef.current;
    if (!pop || !root) return;
    const popRect = pop.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const overflowsBottom = popRect.bottom > window.innerHeight - EDGE_GAP;
    const roomAbove = rootRect.top - popRect.height - ANCHOR_GAP > EDGE_GAP;
    if (overflowsBottom && roomAbove) setFlipUp(true);
    if (popRect.right > window.innerWidth - EDGE_GAP) setAlignRight(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!text) return null;

  const handleToggle = (e) => {
    // Never let the info click select/deselect the surrounding category card.
    e.stopPropagation();
    if (!open) {
      setFlipUp(false);
      setAlignRight(false);
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="cat-info" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`cat-info-btn${open ? " active" : ""}`}
        aria-label={`About ${categoryName}`}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={handleToggle}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <line x1="12" y1="7.5" x2="12.01" y2="7.5" />
        </svg>
      </button>

      {open && (
        <div
          id={popoverId}
          ref={popoverRef}
          role="note"
          className={`cat-info-popover${flipUp ? " flip-up" : ""}${alignRight ? " align-right" : ""}`}
        >
          <p className="cat-info-title">{categoryName}</p>
          <p className="cat-info-text">{text}</p>
        </div>
      )}
    </div>
  );
}
