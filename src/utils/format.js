const TIME_INTERVALS = [
    { singular: "year", plural: "years", seconds: 31536000 },
    { singular: "month", plural: "months", seconds: 2592000 },
    { singular: "week", plural: "weeks", seconds: 604800 },
    { singular: "day", plural: "days", seconds: 86400 },
    { singular: "hour", plural: "hours", seconds: 3600 },
    { singular: "min", plural: "mins", seconds: 60 },
];

// Formats an ISO timestamp as a relative "time ago" string
// ("2 mins ago", "3 days ago"). Returns "—" for missing/invalid values.
export const formatLastActive = (iso) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    for (const { singular, plural, seconds: unit } of TIME_INTERVALS) {
        const value = Math.floor(seconds / unit);
        if (value >= 1) return `${value} ${value > 1 ? plural : singular} ago`;
    }
    return "Just now";
};

// Formats an ISO date (e.g. created_at, birth_date) as "Jan 10, 2026".
export const formatDate = (iso) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// The list API returns status as a display label ("Under Review"); the app's
// filters and badge classes use the raw value (under_review).
export const normalizeStatusKey = (value) =>
    String(value || "").toLowerCase().replace(/[\s-]+/g, "_");

// "under_review" -> "Under Review" (with the product's "On-Hold" spelling).
export const prettifyStatus = (value) =>
    normalizeStatusKey(value)
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .replace(/^On Hold$/i, "On-Hold");

// Integer percentage of a part out of a whole (0 when the whole is empty).
export const pctOf = (part, whole) =>
    Number(whole) > 0 ? Math.round((Number(part) / Number(whole)) * 100) : 0;

// One-decimal rounding used by averages/ratios (5.34 -> 5.3).
export const round1 = (value) => Math.round(value * 10) / 10;
