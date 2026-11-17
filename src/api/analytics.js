import api from "./axios";

// GET /analytics/hazard-report/ — scoped server-side: citizens see their own
// reports, staff with broader permissions see assigned/all-system scope.
export const getReportMetrics = async () => {
    try {
        const response = await api.get("analytics/hazard-report/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// One request for every status count the staff UI shows. The sidebar Status
// Views badges call this with no range for live, current counts; the Operations
// summary strip passes the table's date window so its chips stay aligned with
// the rows. The requested range picks the cheaper backend lens:
//  - bounded range -> GET /analytics/overview/ reads intake.by_status: reports
//    CREATED in the window grouped by current status. That is the same date
//    semantics as GET /reports/?from_date=&to_date=&status=, so a summary chip
//    matches the row count it drills into. Cheap because the window is small.
//  - unbounded     -> GET /analytics/hazard-report/ (the light endpoint). An
//    unbounded overview walks every delivery/SLA row server-side, so it is the
//    wrong thing to poll for the live badges.
// -> { total, byStatus }
export const getStatusCounts = async ({ from = "", to = "" } = {}) => {
    if (from || to) {
        const overview = await getAnalyticsOverview({ from, to });
        return {
            total: Number(overview?.intake?.total || 0),
            byStatus: overview?.intake?.by_status || {},
        };
    }
    const metrics = await getReportMetrics();
    return {
        total: Number(metrics?.total_count || 0),
        byStatus: metrics?.count_by_status || {},
    };
};

// GET /analytics/overview/?from=&to=
// Period aggregates in four lenses (scoped like getReportMetrics):
//   intake   — reports filed in the range (volume, severity, daily series)
//   delivery — reports resolved in the range (avg time, daily/weekly, slowest)
//   sla      — reports DUE in the range judged on response time
//   live     — unscoped as-of-now backlog + overdue
// Both dates are optional ("" = unbounded = All Time).
// -> { range, span, intake, delivery, sla, live }
export const getAnalyticsOverview = async ({ from = "", to = "" } = {}) => {
    try {
        const response = await api.get("analytics/overview/", {
            params: { from: from || undefined, to: to || undefined },
        });
        return response.data;
    } catch (error) {
        const data = error.response?.data || {};
        throw { ...data, status: error.response?.status };
    }
};

// GET /analytics/handlers/?from=&to=
// Per-handler workload over reports whose DEADLINE falls in the range
// (all-time when unbounded). Every analytics role may read it, scoped
// server-side like the overview — it describes the team, no scoring.
// -> { handlers: [{ user_number, handler_name, handled, resolved }] }
export const getHandlerWorkload = async ({ from = "", to = "" } = {}) => {
    try {
        const response = await api.get("analytics/handlers/", {
            params: { from: from || undefined, to: to || undefined },
        });
        return response.data;
    } catch (error) {
        const data = error.response?.data || {};
        throw { ...data, status: error.response?.status };
    }
};
