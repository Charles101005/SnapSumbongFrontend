import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getReports } from "../api/reports";
import { getStatusCounts } from "../api/analytics";
import { useAuth } from "./authContext";
import { StatusCountsContext, STATUS_VIEWS } from "./statusCountsContext";
import { DATE_FILTER_PRESETS, resolveRange, sanitizeDateBounds } from "../utils/dates";

// Backstop only — the event triggers below (save, tab focus, date change) are
// what keep the numbers live in normal use.
const REFRESH_INTERVAL_MS = 60000;
// visibilitychange and focus usually fire together when you switch back to the
// tab; collapse them into one catch-up request (every rate-limited analytics
// endpoint shares a single per-user budget server-side).
const WAKE_DEDUPE_MS = 5000;

// Owns every status count the staff UI displays: the 9 sidebar Status Views
// badges, the Operations summary chips (Total/Active/Resolved/Invalid) and the
// overdue figure. Mounted once in App so it survives navigation — these used to
// live inside <Sidebar>, which DashboardLayout re-creates on every route
// change, so the data (and its "—" placeholder) restarted from scratch each
// time you moved between dashboard pages.
//
// Refresh triggers:
//   1. staff login (gated below — no requests on the login page or after logout)
//   2. the URL's date params change (Apply Filters / Reset / deep-link / back-forward)
//   3. a report changes (Operations bumps refresh() from its save callbacks)
//   4. the tab becomes visible again or regains focus
//   5. the interval above, and only while the tab is actually visible
export function StatusCountsProvider({ children }) {
  const { status, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Same rule the Operations table applies to a deep link: an explicit
  // ?range= wins, a bare ?from=/?to= means Custom, and a clean URL means
  // Today. Reduced to primitives so the effect can depend on values rather
  // than object identity (re-renders never re-fire a request).
  const rawRange = (searchParams.get("range") || "").trim();
  // Same sanitiser the Operations table applies to deep links — future dates
  // dropped, an inverted From → To pair repaired (From wins, To moves) — so
  // the badge counts and the table resolve any URL to the identical window
  // and can never disagree about what the badges count.
  const { from: rangeFrom, to: rangeTo } = sanitizeDateBounds(
    searchParams.get("from") || "",
    searchParams.get("to") || ""
  );
  const preset = DATE_FILTER_PRESETS.some((option) => option.key === rawRange)
    ? rawRange
    : rangeFrom || rangeTo
      ? "custom"
      : "today";

  // Event-handler refresh: bumping the tick is what re-runs the fetch effect,
  // so callers never reach into state directly.
  const refresh = useCallback(() => setRefreshTick((tick) => tick + 1), []);

  useEffect(() => {
    // Citizens never see these badges; the staff routes gate the same way.
    if (status !== "authenticated" || user?.is_staff !== true) return undefined;

    let cancelled = false;
    let lastWakeAt = 0;

    const load = async () => {
      try {
        // Resolve the preset at request time so "Today" stays correct across a
        // day boundary while the tab stays open (same rule as the tables).
        const range = resolveRange(preset, new Date(), { from: rangeFrom, to: rangeTo });
        const [countsResult, overdueResult] = await Promise.all([
          getStatusCounts(range),
          // Overdue is an as-of-now SLA figure, so it deliberately sits outside
          // the date range — and keeps its original source (the reports
          // endpoint) so it can never drift from the Analytics page's number.
          getReports({ overdue: true, exclude_closed: false, page: 1, page_size: 1 }),
        ]);
        if (cancelled) return;

        const next = {};
        for (const view of STATUS_VIEWS) {
          next[view.key] = Number(countsResult.byStatus[view.key] || 0);
        }
        setCounts(next);
        setTotal(Number(countsResult.total || 0));
        setOverdue(Number(overdueResult.count || 0));
        setLoaded(true);
      } catch {
        // Keep the last known numbers. Going stale is honest; showing "—"
        // forever (the old failure mode) or a fabricated 0 is not. Both values
        // also update together, so a partial failure can't desynchronise the
        // chips from each other.
      }
    };

    load();

    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_INTERVAL_MS);
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastWakeAt < WAKE_DEDUPE_MS) return;
      lastWakeAt = now;
      load();
    };
    // A hidden tab's timer is throttled by the browser, so coming back needs
    // an explicit catch-up instead of waiting for the next tick.
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [status, user, preset, rangeFrom, rangeTo, refreshTick]);

  const value = useMemo(
    () => ({ counts, total, overdue, loaded, refresh }),
    [counts, total, overdue, loaded, refresh]
  );

  return <StatusCountsContext.Provider value={value}>{children}</StatusCountsContext.Provider>;
}
