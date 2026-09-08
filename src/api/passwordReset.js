import api from "./axios";

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post("accounts/forgot-password/", {
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
        const response = await api.post("accounts/forgot-password/verify/", {
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
        const response = await api.post("accounts/forgot-password/resend/", {
            "email": email
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}

export const resetPassword = async (email, resetToken, newPassword) => {
    try {
        const response = await api.post("accounts/forgot-password/reset/", {
            "email": email,
            "reset_token": resetToken,
            "new_password": newPassword
        });
        return response.data;
    }
    catch (error) {
        throw error.response.data;
    }
}