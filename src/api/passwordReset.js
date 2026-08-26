import api from "./axios";

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post("accounts/password/forgot/", {
            "email": email
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const verifyResetPasswordCode = async (email, otp) => {
    try {
        const response = await api.post("accounts/password/verify/", {
            "email": email,
            "otp": otp
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const resendResetPasswordCode = async (email) => {
    try {
        const response = await api.post("accounts/password/resend/", {
            "email": email
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const resetPassword = async (email, otp, newPassword) => {
    try {
        const response = await api.post("accounts/password/reset/", {
            "email": email,
            "otp": otp,
            "new_password": newPassword
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}
