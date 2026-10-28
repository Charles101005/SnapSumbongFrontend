import { useEffect, useRef, useState } from "react";
import "./SearchableSelect.css";

// Searchable dropdown (combobox) used for the PSGC address fields.
// Displays the selected option's label when closed; while focused it filters
// the option list as the user types.
export default function SearchableSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "",
  disabled = false,
  clearable = false,
  inputClassName = "",
  emptyMessage = "No matching entries",
  ...inputProps
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedLabel = options.find((option) => option.value === value)?.label || "";

  const query = touched ? draft.trim().toLowerCase() : "";
  const filtered = query
    ? options.filter((option) => option.label.toLowerCase().includes(query))
    : options;
  const activeIndex = filtered.length > 0 ? Math.min(highlight, filtered.length - 1) : -1;

  const listboxId = id ? `${id}-listbox` : undefined;
  const optionId = (index) => (id ? `${id}-option-${index}` : undefined);

  const openMenu = () => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    setDraft(selectedLabel);
    setTouched(false);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setTouched(false);
  };

  // Close when a click lands outside the widget (the input and menu are
  // both inside rootRef, so their clicks never trigger this).
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

  // Keep the highlighted option visible while navigating a long list.
  useEffect(() => {
    if (!open || activeIndex < 0 || filtered.length === 0) return;
    const active = listRef.current ? listRef.current.children[activeIndex] : null;
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex, filtered]);

  const handleFocus = () => {
    openMenu();
    inputRef.current?.select();
  };

  const handleChange = (event) => {
    setDraft(event.target.value);
    setTouched(true);
    setHighlight(0);
    setOpen(true);
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setDraft(option.label);
    setTouched(false);
    setOpen(false);
  };

  // Optional clear affordance — lets the caller's value be reset to "" (used
  // by the optional address fields in Account Settings).
  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeMenu();
    setDraft("");
    onChange("");
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "Escape") {
      if (open) {
        // Stop here so the enclosing modal doesn't close with the dropdown.
        event.stopPropagation();
        closeMenu();
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      if (filtered.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlight((current) => {
        const base = Math.min(Math.max(current, 0), filtered.length - 1);
        return Math.min(Math.max(base + step, 0), filtered.length - 1);
      });
      return;
    }

    if (event.key === "Enter") {
      // Never let Enter submit the form from this field.
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      const option = activeIndex >= 0 ? filtered[activeIndex] : null;
      if (option) handleSelect(option);
      return;
    }

    if (event.key === "Tab") closeMenu();
  };

  const showClear = clearable && Boolean(value) && !disabled;

  return (
    <div className="ss-root" ref={rootRef}>
      <div className={`ss-wrap${showClear ? " ss-wrap-clearable" : ""}`}>
        <input
          id={id}
          ref={inputRef}
          className={`ss-input${inputClassName ? ` ${inputClassName}` : ""}`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          value={open ? draft : selectedLabel}
          disabled={disabled}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          {...inputProps}
        />
        {showClear && (
          <button type="button" className="ss-clear" aria-label="Clear selection" onClick={handleClear} tabIndex={-1}>
            &times;
          </button>
        )}
        {!disabled && (
          <span className="ss-caret" aria-hidden="true">
            &#9662;
          </span>
        )}
      </div>

      {open && (
        <ul
          className="ss-menu"
          id={listboxId}
          role="listbox"
          ref={listRef}
          onMouseDown={(event) => event.preventDefault()}
        >
          {filtered.length === 0 ? (
            <li className="ss-empty" role="presentation">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={option.value === value}
                className={`ss-option${index === activeIndex ? " ss-option-active" : ""}`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
