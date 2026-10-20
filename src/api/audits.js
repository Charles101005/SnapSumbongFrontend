import api from "./axios";

// Thrown when the request never reached the server (offline, DNS, timeout) —
// keeps the { detail } contract pages already read instead of leaking a
// TypeError from accessing error.response on a network failure.
const networkError = () => ({ detail: "Can't reach the server. Check your connection and try again." });

// GET /audits/
// query: q (matches audit_log_number or user_number only — not names),
//        module (enum code: USER | EMPLOYEE | ROLE | REPORT), role_id (0 =
//        system-generated logs with no actor), from_date (YYYY-MM-DD),
//        to_date (YYYY-MM-DD), page, page_size (default 5, max 50)
// -> { count, total_pages, current_page, next, previous,
//      results: [{ audit_log_number, actor_name, actor_role, action, module, created_at }] }
// action/module come back as human labels (e.g. "Report"), not enum codes.
// Ordering is fixed newest-first. The list rows carry no `description` —
// fetch getAuditLog() for that plus the payload.
// requires any of: audit:read_system_logs, audit:read_report_logs
export const getAuditLogs = async ({ q, module, role_id, from_date, to_date, page, page_size } = {}) => {
    try {
        const response = await api.get("audits/", {
            params: { q, module, role_id, from_date, to_date, page, page_size },
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /audits/<audit_log_number>/
// -> { audit_log_number, actor_name, actor_role, action, module,
//      description, payload, created_at }
// errors: AUDIT_LOG_NOT_FOUND (404 — unknown log number or outside the
//         modules your permissions allow)
// requires any of: audit:read_system_logs, audit:read_report_logs
export const getAuditLog = async (auditLogNumber) => {
    try {
        const response = await api.get(`audits/${encodeURIComponent(auditLogNumber)}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /audits/lookup/modules/
// -> [{ value, label }] (plain array, not paginated) — `value` is the enum
//    code the module query param on getAuditLogs expects; `label` is for
//    display in filter dropdowns.
// requires any of: audit:read_system_logs, audit:read_report_logs
export const getAuditModuleLookup = async () => {
    try {
        const response = await api.get("audits/lookup/modules/");
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};
