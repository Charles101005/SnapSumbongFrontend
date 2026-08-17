import api from "./axios";

export const loginUser = async (email, password) => {
    try {
        const response = await api.post("accounts/auth/login/", {
            "email": email,
            "password": password
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const refreshToken = async (refresh) => {
    try {
        const response = await api.post("accounts/auth/refresh/", {
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const logoutUser = async (refresh) => {
    try {
        const response = await api.post("accounts/auth/logout/", {
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}
