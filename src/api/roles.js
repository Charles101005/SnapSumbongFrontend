import api from "./axios";

// Thrown when the request never reached the server (offline, DNS, timeout) —
// keeps the { detail } contract pages already read instead of leaking a
// TypeError from accessing error.response on a network failure.
const networkError = () => ({ detail: "Can't reach the server. Check your connection and try again." });

// GET /accounts/roles/
// query: page, page_size, q, is_active ("true" | "false" | undefined for all)
// -> { count, total_pages, current_page, next, previous,
//      results: [{ role_id, role_name, description, is_protected, is_active }] }
// requires permission: role:read_all
export const getRoles = async ({ q, is_active, page, page_size } = {}) => {
    try {
        const response = await api.get("accounts/roles/", {
            params: { q, is_active, page, page_size },
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/roles/<role_id>/
// -> { role_id, role_name, description, is_protected, permissions: [permission_name], created_at, updated_at }
// Quirk: an unknown role_id returns 200 with { detail } instead of 404 — check for role_id.
// requires permission: role:read_all
export const getRole = async (roleId) => {
    try {
        const response = await api.get(`accounts/roles/${roleId}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/roles/
// payload: { role_name, description, permission_names: [permission_name] (min 1) }
// -> 201 { role_name, created_at, permissions }
// errors: ROLE_ALREADY_EXISTS (400), PERMISSION_NOT_FOUND (404)
// requires permission: role:create
export const createRole = async (payload) => {
    try {
        const response = await api.post("accounts/roles/", payload);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// PATCH /accounts/roles/<role_id>/ — partial update; send only the fields you want to change.
// payload: any subset of { role_name, description, permission_names }
// errors: ROLE_NOT_FOUND, ROLE_ALREADY_EXISTS, PERMISSION_NOT_FOUND,
//         SYSTEM_PROTECTED_ROLE_MODIFICATION_DENIED (400 for is_protected roles)
// requires permission: role:update_any
export const updateRole = async (roleId, payload) => {
    try {
        const response = await api.patch(`accounts/roles/${roleId}/`, payload);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/roles/duplicate/<role_id>/
// -> 201 { role_name, created_at, permissions } — name becomes "<Name>_1", "_2", ...
// requires permission: role:create
export const duplicateRole = async (roleId) => {
    try {
        const response = await api.post(`accounts/roles/duplicate/${roleId}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/roles/deactivate/<role_id>/ — one-way: there is no reactivate endpoint.
// -> 200 { detail: "Operation completed successfully." } (idempotent if already inactive)
// errors: ROLE_NOT_FOUND (400), SYSTEM_PROTECTED_ROLE_MODIFICATION_DENIED (400),
//         ROLE_IN_USE (400 — users are still assigned to the role)
// requires permission: role:deactivate_any
export const deactivateRole = async (roleId) => {
    try {
        const response = await api.post(`accounts/roles/deactivate/${roleId}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/lookup/roles/
// -> [{ role_id, role_name }] (plain array, not paginated)
// requires any of: employee:create, employee:read_all, employee:assign_role
export const getRoleLookup = async () => {
    try {
        const response = await api.get("accounts/lookup/roles/");
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/lookup/permissions/
// -> { USERS: [{ permission_name, description }], EMPLOYEES: [...], ROLES: [...],
//      REPORTS: [...], ANALYTICS: [...], AUDITS: [...] } — keyed by module
// requires any of: role:create, role:update_any
export const getPermissionLookup = async () => {
    try {
        const response = await api.get("accounts/lookup/permissions/");
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};
