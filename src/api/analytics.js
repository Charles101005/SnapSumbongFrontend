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

// GET /analytics/compliance/
// DO 47-aligned per-handler compliance score (Supervisor+ only — gated on
// analytic:read_handler_performance).
// -> { weights: {...}, handlers: [{ handler_name, sla_on_time_pct, ... }] }
export const getHandlerCompliance = async () => {
    try {
        const response = await api.get("analytics/compliance/");
        return response.data;
    } catch (error) {
        const data = error.response?.data || {};
        throw { ...data, status: error.response?.status };
    }
};
