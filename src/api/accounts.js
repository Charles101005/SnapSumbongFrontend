import api from "./axios";

// GET /accounts/auth/user/
// -> { email, first_name, last_name, middle_name, role, is_staff, permissions }
export const getCurrentUser = async () => {
    try {
        const response = await api.get("accounts/auth/user/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
