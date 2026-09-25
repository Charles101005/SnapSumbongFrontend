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
