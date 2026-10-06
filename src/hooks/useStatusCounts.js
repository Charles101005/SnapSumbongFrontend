import { useEffect, useState } from "react";
import { getReportMetrics } from "../api/analytics";

// Sidebar "Status Views" entries. `status` is the API status value from
// HazardReports.Status (lowercase — the reports filter is case-insensitive)
// and is used as the ?status= query param for the shared reports table.
export const REPORT_STATUSES = ["new", "assigned", "under_review", "on_hold", "dispatched", "resolved", "closed"];

export const STATUS_VIEWS = [
  { key: "new", label: "New", status: "new" },
  { key: "on_hold", label: "Pending", status: "on_hold" },
  { key: "under_review", label: "Under Review", status: "under_review" },
  { key: "assigned", label: "Assigned", status: "assigned" },
  { key: "dispatched", label: "Dispatched", status: "dispatched" },
  { key: "resolved", label: "Resolved", status: "resolved" },
];

const REFRESH_INTERVAL_MS = 60000;

// One request for every status count: GET analytics/hazard-report/ returns
// { total_count, count_by_status: { new, assigned, ... } } for the current
// user's permission scope. Scope matches the sidebar's canAnalytics gate.
export function useStatusCounts() {
  const [counts, setCounts] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const data = await getReportMetrics();
        if (cancelled) return;
        const byStatus = data?.count_by_status || {};
        const next = {};
        for (const view of STATUS_VIEWS) {
          next[view.key] = Number(byStatus[view.key] || 0);
        }
        setCounts(next);
        setLoaded(true);
      } catch {
        // Keep the last known counts — badges just go stale on failure.
      }
    };

    (async () => {
      await refresh();
    })();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { counts, loaded };
}
