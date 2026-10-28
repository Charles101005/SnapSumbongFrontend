import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../../../utils/leafletHelpers";
import "./AddressSuggest.css";

const DEBOUNCE_MS = 450;
const MIN_CHARS = 3;

// Address auto-suggest for the PinLocation editor. The dropdown only starts
// searching once the user actually edits the text (not merely opens the
// editor), debounces keystrokes, and queries Nominatim with a Philippines-only
// filter. Picking a suggestion yields the full { label, lat, lon } so the
// caller can fill the text and move the map marker together.
export default function AddressSuggest({
  value,
  onChange,
  onSelectOption,
  onBlur,
  placeholder = "",
  inputClassName = "",
  autoFocus = false,
}) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);

  const query = value.trim();
  const isShort = query.length < MIN_CHARS;
  const activeIndex =
    suggestions.length > 0 ? Math.min(highlight, suggestions.length - 1) : -1;

  const listboxId = "address-suggest-listbox";
  const optionId = (index) => `address-suggest-option-${index}`;

  // Schedule the debounced search for the current query. Results and loading
  // state are only set from the timer callback (never synchronously here) to
  // satisfy the React Compiler's setState-in-effect rule; display logic below
  // gates on isShort so stale results never show for a too-short query.
  useEffect(() => {
    if (!open || !touched || isShort) return undefined;

    const requestId = ++requestIdRef.current;
    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      try {
        const results = await searchPlaces(query, { signal: controller.signal });
        if (requestId !== requestIdRef.current) return;
        setSuggestions(results);
        setHighlight(0);
        setStatus("done");
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [query, open, touched, isShort]);

  // Abort any in-flight search when the widget unmounts (not a state update,
  // so it is safe to do synchronously here).
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  // Close when a click lands outside the widget.
  useEffect(() => {
    if (!open) return undefined;
    const handleMouseDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setTouched(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Keep the highlighted option visible while navigating the list.
  useEffect(() => {
    if (!open || activeIndex < 0 || suggestions.length === 0) return;
    const active = listRef.current ? listRef.current.children[activeIndex] : null;
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex, suggestions]);

  const handleChange = (event) => {
    const next = event.target.value;
    onChange(next);
    setTouched(true);
    setHighlight(0);
    setOpen(true);
    // Optimistically show the loading state for queries that will search;
    // the effect's timer replaces it with real results.
    if (next.trim().length >= MIN_CHARS) {
      setStatus("loading");
    } else {
      setStatus("idle");
      setSuggestions([]);
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setTouched(false);
  };

  const handleSelect = (option) => {
    onChange(option.label);
    setOpen(false);
    setTouched(false);
    setSuggestions([]);
    setStatus("idle");
    onSelectOption(option);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      if (open) {
        // Stop here so the enclosing page doesn't react to Escape.
        event.stopPropagation();
        setOpen(false);
        setTouched(false);
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (suggestions.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlight((current) => {
        const base = Math.min(Math.max(current, 0), suggestions.length - 1);
        return Math.min(Math.max(base + step, 0), suggestions.length - 1);
      });
      return;
    }

    if (event.key === "Enter") {
      // Never let Enter submit from this field; pick the active suggestion.
      event.preventDefault();
      const option = activeIndex >= 0 ? suggestions[activeIndex] : null;
      if (option) handleSelect(option);
    }
  };

  // All display states derive from the current query so stale results from a
  // previous keystroke are never rendered.
  const showMenu = open && touched;
  const showTooShort = showMenu && isShort;
  const showLoading = showMenu && !isShort && status === "loading";
  const showError = showMenu && !isShort && status === "error";
  const showEmpty = showMenu && !isShort && status === "done" && suggestions.length === 0;
  const showOptions =
    showMenu && !isShort && status === "done" && suggestions.length > 0;

  return (
    <div className="as-root" ref={rootRef}>
      <input
        ref={inputRef}
        className={`as-input${inputClassName ? ` ${inputClassName}` : ""}`}
        type="text"
        role="combobox"
        aria-expanded={showMenu}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          showMenu && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
      />

      {showMenu && (
        <ul
          className="as-menu"
          id={listboxId}
          role="listbox"
          ref={listRef}
          onMouseDown={(event) => event.preventDefault()}
        >
          {showTooShort && (
            <li className="as-status" role="presentation">
              Keep typing to search...
            </li>
          )}
          {showLoading && (
            <li className="as-status" role="presentation">
              Searching...
            </li>
          )}
          {showError && (
            <li className="as-status" role="presentation">
              Couldn&apos;t fetch suggestions.
            </li>
          )}
          {showEmpty && (
            <li className="as-status" role="presentation">
              No suggestions found
            </li>
          )}
          {showOptions &&
            suggestions.map((option, index) => (
              <li
                key={option.id}
                id={optionId(index)}
                role="option"
                aria-selected={false}
                className={`as-option${index === activeIndex ? " as-option-active" : ""}`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
