import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FONT_SCALE,
  FONT_SCALE_STORAGE_KEY,
  FontScaleContext,
  normalizeFontScale,
} from "./fontScaleContext";

// Reads the device-local text size before first paint. Storage can throw
// (private mode, blocked cookies), in which case 100% is used for the session.
function readStoredScale() {
  try {
    return normalizeFontScale(window.localStorage.getItem(FONT_SCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

// Applies the saved text size to the document root. Only font-size rules read
// --font-scale (see variables.css and the per-component CSS); layout spacing
// stays at 100% so the page skeleton does not move. data-text-scale lets CSS
// reflow dense grids before the larger type starts to crowd them.
export function FontScaleProvider({ children }) {
  const [scale, setScale] = useState(readStoredScale);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-scale", String(scale));
    root.dataset.textScale = scale >= 1.5 ? "xl" : scale >= 1.2 ? "lg" : "md";
  }, [scale]);

  const saveScale = useCallback((next) => {
    const value = normalizeFontScale(next);
    setScale(value);
    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(value));
    } catch {
      // Write failure isn't fatal — the choice still applies for this session.
    }
  }, []);

  const value = useMemo(() => ({ scale, saveScale }), [scale, saveScale]);

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
}
