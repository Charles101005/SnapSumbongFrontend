import api from "./axios";

// GET /analytics/hazard-report/
// Scoped by permission server-side — a citizen gets metrics for just their
// own reports, staff with broader permissions get assigned/all-system scope.
// -> { total_count, count_by_status: { resolved, under_review, dispatched } }
export const getReportMetrics = async () => {
    try {
        const response = await api.get("analytics/hazard-report/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
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
