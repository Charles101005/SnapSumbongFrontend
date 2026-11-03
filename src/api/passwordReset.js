import api from "./axios";

// POST /accounts/forgot-password/ — emails a 4-digit reset code.
// payload: { email } -> { detail, email, retry_after_seconds }
// (identical body whether or not the email exists; retry_after seeds the
// resend countdown immediately)
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

// POST /accounts/forgot-password/resend/ — re-sends the reset code.
// payload: { email } -> { email, expires_at, retry_after_seconds }
// 429 OTP_RESEND_COOLDOWN_ACTIVE -> meta.retry_after_seconds (remaining).
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