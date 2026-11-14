import { createContext, useContext } from "react";

// Text-size preference for the Appearance card in Account Settings. It is a
// display-only preference stored on this device (localStorage) — it is never
// sent to the accounts API, since the backend profile has no field for it.
export const FONT_SCALE_STORAGE_KEY = "snapsumbong.font-scale";

// The slider runs 100%–150% in 5% steps. Scaling only affects font sizes (see
// globals.css / variables.css): spacing and layout widths stay at their 100%
// values, so this is a text-size setting rather than a zoom level.
export const FONT_SCALE_MIN = 1;
export const FONT_SCALE_MAX = 1.5;
export const FONT_SCALE_STEP = 0.05;
export const FONT_SCALE_PERCENT_MIN = Math.round(FONT_SCALE_MIN * 100);
export const FONT_SCALE_PERCENT_MAX = Math.round(FONT_SCALE_MAX * 100);
export const FONT_SCALE_PERCENT_STEP = Math.round(FONT_SCALE_STEP * 100);

export const DEFAULT_FONT_SCALE = 1;

// Preferences saved by older builds may be 0.9, 1.25, 1.5, corrupt, or hand
// edited. Clamp them into the current range and snap to the 5% grid.
export function normalizeFontScale(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_FONT_SCALE;

  const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, numeric));
  const stepped = Math.round(clamped / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.round(stepped * 100) / 100;
}

export const FontScaleContext = createContext(null);

export function useFontScale() {
  const context = useContext(FontScaleContext);
  if (!context) {
    throw new Error("useFontScale must be used within a FontScaleProvider");
  }
  return context;
}
