import { useCallback, useEffect, useMemo, useState } from "react";
import { getReports } from "../api/reports";
import { getStatusCounts } from "../api/analytics";
import { useAuth } from "./authContext";
import { StatusCountsContext, STATUS_VIEWS } from "./statusCountsContext";
import { foldStatusCounts } from "../shared/reportStatuses";

// Backstop only — the event triggers below (save, tab focus) are what keep the
// numbers live in normal use.
const REFRESH_INTERVAL_MS = 60000;
// visibilitychange and focus usually fire together when you switch back to the
// tab; collapse them into one catch-up request (every rate-limited analytics
// endpoint shares a single per-user budget server-side).
const WAKE_DEDUPE_MS = 5000;

// Owns the live status counts shown in the staff sidebar. These are a current
// snapshot of every report the signed-in staff member may see, not a date-
// window slice: "In Progress 22" means 22 reports are in that status right now.
// The Operations summary strip keeps its own date-scoped copy so it can stay
// aligned with the table underneath it.
//
// Refresh triggers:
//   1. staff login (gated below — no requests on the login page or after logout)
//   2. a report changes (Operations bumps refresh() from its save callbacks)
//   3. the tab becomes visible again or regains focus
//   4. the interval above, and only while the tab is actually visible
export function StatusCountsProvider({ children }) {
  const { status, user } = useAuth();
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

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
        // Unscoped on purpose: the sidebar badges are a live current-state
        // snapshot. getStatusCounts() with no range uses the light
        // analytics/hazard-report/ endpoint and keeps the same permission
        // scoping as every other analytics read.
        const [countsResult, overdueResult] = await Promise.all([
          getStatusCounts(),
          // Overdue is an as-of-now SLA figure and keeps its original source
          // (the reports endpoint) so it can never drift from Analytics.
          getReports({ overdue: true, exclude_closed: false, page: 1, page_size: 1 }),
        ]);
        if (cancelled) return;

        const next = {};
        // Fold retired status keys into In Progress before reading the seven
        // canonical buckets. Some historical payloads still carry
        // under_review/dispatched/ongoing; dropping those keys would make a
        // badge undercount.
        const byStatus = foldStatusCounts(countsResult.byStatus);
        for (const view of STATUS_VIEWS) {
          next[view.key] = Number(byStatus[view.key] || 0);
        }
        setCounts(next);
        setTotal(Number(countsResult.total || 0));
        setOverdue(Number(overdueResult.count || 0));
        setLoaded(true);
      } catch {
        // Keep the last known numbers. Going stale is honest; showing "—"
        // forever (the old failure mode) or a fabricated 0 is not. Both values
        // also update together, so a partial failure can't desynchronise the
        // badges from each other.
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
  }, [status, user, refreshTick]);

  const value = useMemo(
    () => ({ counts, total, overdue, loaded, refresh }),
    [counts, total, overdue, loaded, refresh]
  );

  return <StatusCountsContext.Provider value={value}>{children}</StatusCountsContext.Provider>;
}
