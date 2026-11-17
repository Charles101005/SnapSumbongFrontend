import { createContext, useContext } from "react";
import {
  REPORT_STATUS_KEYS,
  REPORT_STATUS_META,
  REPORT_STATUS_ORDER,
} from "../shared/reportStatuses";

// Sidebar "Status Views" entries. `status` is the API status value from
// HazardReports.Status (lowercase — the reports filter is case-insensitive)
// and is used as the ?status= query param for the shared reports table.
// `key` is the field name both count payloads use
// (GET analytics/hazard-report/ -> count_by_status,
//  GET analytics/overview/      -> intake.by_status).
export const REPORT_STATUSES = REPORT_STATUS_KEYS;

export const STATUS_VIEWS = REPORT_STATUS_ORDER.map((status) => ({
  key: status.toLowerCase(),
  label: REPORT_STATUS_META[status].label,
  status: status.toLowerCase(),
}));

// One shared store for the live sidebar Status View badges. The Operations
// summary strip reads its own date-scoped copy of the same shape so its chips
// can stay aligned with the table's Date filter; the sidebar deliberately
// shows current, unscoped counts. See StatusCountsProvider for the fetching
// and refresh rules; this file stays context + constants only (mirrors
// authContext.js) so StatusCountsProvider.jsx can export a component alone and
// keep react-refresh happy.
export const StatusCountsContext = createContext(null);

export function useStatusCounts() {
  const context = useContext(StatusCountsContext);
  if (!context) {
    throw new Error("useStatusCounts must be used within a StatusCountsProvider");
  }
  return context;
}
