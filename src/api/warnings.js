import api from "./axios";

// Thrown when the request never reached the server (offline, DNS, timeout) —
// keeps the { detail } contract pages already read instead of leaking a
// TypeError from accessing error.response on a network failure.
const networkError = () => ({ detail: "Can't reach the server. Check your connection and try again." });

// ===== CITIZEN SELF-SERVICE (read_own) =====

// GET /accounts/profile/warnings/
// -> { count, warnings: [{ warning_number, reason, report_number,
//                           warned_by_name, created_at }] }
// requires permission: user:read_own
export const getMyWarnings = async () => {
    try {
        const response = await api.get("accounts/profile/warnings/");
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/profile/moderation/
// -> { warning_count, is_active }
// requires permission: user:read_own
export const getMyModerationSummary = async () => {
    try {
        const response = await api.get("accounts/profile/moderation/");
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// ===== STAFF MODERATION =====

// GET /accounts/citizens/<user_number>/warnings/
// -> { count, warnings: [{ warning_number, reason, report_number,
//                           warned_by_name, created_at }] }
// requires permission: user:read_all
export const getCitizenWarnings = async (userNumber) => {
    try {
        const response = await api.get(
            `accounts/citizens/${encodeURIComponent(userNumber)}/warnings/`,
        );
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/citizens/<user_number>/warn/
// payload: { reason: string (min 10 chars), report_number?: string }
// -> 201 { warning_number, reason, report_number, warned_by_name, created_at }
// errors: USER_NOT_FOUND, WARN_TARGET_INACTIVE, LINKED_REPORT_NOT_INVALID,
//         LINKED_REPORT_NOT_OWNED, VALIDATION_ERROR
// requires permission: user:warn
export const warnCitizen = async (userNumber, payload) => {
    try {
        const response = await api.post(
            `accounts/citizens/${encodeURIComponent(userNumber)}/warn/`,
            payload,
        );
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/citizens/<user_number>/ban/
// payload: { reason: string (min 10 chars), report_number?: string }
//    report_number enables the fast-track path when the target has < 3 warnings;
//    it must be an INVALID report owned by the target.
// -> 200 { detail: "Operation completed successfully." }
// errors: USER_NOT_FOUND, BAN_NOT_ELIGIBLE, BAN_TARGET_INACTIVE,
//         FAST_TRACK_REPORT_NOT_INVALID, FAST_TRACK_REPORT_NOT_OWNED,
//         VALIDATION_ERROR
// requires permission: user:deactivate_any
export const banCitizen = async (userNumber, payload) => {
    try {
        const response = await api.post(
            `accounts/citizens/${encodeURIComponent(userNumber)}/ban/`,
            payload,
        );
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/citizens/<user_number>/unban/
// payload: { reason: string (min 10 chars) }
// -> 200 { detail: "Operation completed successfully." }
// errors: USER_NOT_FOUND, UNBAN_TARGET_NOT_INACTIVE, VALIDATION_ERROR
// requires permission: user:activate_any
export const unbanCitizen = async (userNumber, payload) => {
    try {
        const response = await api.post(
            `accounts/citizens/${encodeURIComponent(userNumber)}/unban/`,
            payload,
        );
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};
