import api from "./axios";

// Thrown when the request never reached the server (offline, DNS, timeout) —
// keeps the { detail } contract pages already read instead of leaking a
// TypeError from accessing error.response on a network failure.
const networkError = () => ({ detail: "Can't reach the server. Check your connection and try again." });

// ===== EMPLOYEES (is_staff=true) =====

// GET /accounts/employees/
// query: q, is_active, role_id, page, page_size
// -> { count, total_pages, current_page, next, previous,
//      results: [{ user_number, full_name, email, role, is_active, last_active }] }
// requires permission: employee:read_all
export const getEmployees = async ({ q, is_active, role_id, page, page_size } = {}) => {
    try {
        const response = await api.get("accounts/employees/", {
            params: { q, is_active, role_id, page, page_size },
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// POST /accounts/employees/
// payload: { email, role_id, last_name, first_name, middle_name?, contact_number,
//            birth_date, gender, street_address, region_code, province_code, city_code, barangay_code }
// -> 201 { user_number, full_name, role, email, contact_number, birth_date, gender, street_address, ... }
// Note: a temp password is generated server-side but not returned yet (backend TODO: email it).
// requires permission: employee:create
export const createEmployee = async (payload) => {
    try {
        const response = await api.post("accounts/employees/", payload);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/employees/<user_number>/
// -> { user_number, first_name, last_name, middle_name, email, gender, profile_picture,
//      contact_number, birth_date, street_address, region_code, province_code, city_code,
//      barangay_code, role, role_id, is_active, last_active, created_at }
// requires permission: employee:read_all
export const getEmployee = async (userNumber) => {
    try {
        const response = await api.get(`accounts/employees/${encodeURIComponent(userNumber)}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// PATCH /accounts/employees/<user_number>/ — partial update; send only the fields you want to change.
// payload: any subset of { email, role_id, last_name, first_name, middle_name, contact_number,
//          birth_date, gender, street_address, region_code, province_code, city_code,
//          barangay_code, is_active }
// errors: SELF_UPDATE_DENIED (409, cannot patch your own account), USER_NOT_FOUND, ROLE_NOT_FOUND
// requires any of: employee:update_any, employee:assign_role, employee:activate_any, employee:deactivate_any
export const updateEmployee = async (userNumber, payload) => {
    try {
        const response = await api.patch(`accounts/employees/${encodeURIComponent(userNumber)}/`, payload);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// ===== CITIZENS (is_staff=false) =====

// GET /accounts/citizens/
// query: q, is_active, page, page_size
// -> { count, total_pages, current_page, next, previous,
//      results: [{ user_number, full_name, email, is_active, last_active }] }
// requires permission: user:read_all
export const getCitizens = async ({ q, is_active, page, page_size } = {}) => {
    try {
        const response = await api.get("accounts/citizens/", {
            params: { q, is_active, page, page_size },
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// GET /accounts/citizens/<user_number>/
// -> { user_number, first_name, last_name, middle_name, email, gender, profile_picture,
//      contact_number, birth_date, street_address, region_code, province_code, city_code,
//      barangay_code, role, role_id, is_active, last_active, created_at }
// requires permission: user:read_all
export const getCitizen = async (userNumber) => {
    try {
        const response = await api.get(`accounts/citizens/${encodeURIComponent(userNumber)}/`);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};

// PATCH /accounts/citizens/<user_number>/
// payload: only { is_active } survives server-side — all other fields are stripped.
// errors: USER_NOT_FOUND (404)
// requires any of: user:activate_any, user:deactivate_any
export const updateCitizen = async (userNumber, payload) => {
    try {
        const response = await api.patch(`accounts/citizens/${encodeURIComponent(userNumber)}/`, payload);
        return response.data;
    } catch (error) {
        if (error.response?.data) throw error.response.data;
        throw networkError();
    }
};
