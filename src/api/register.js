import api from "./axios";

// POST /accounts/register/ — starts registration and emails a 4-digit OTP.
// payload: { email, password, last_name, first_name, middle_name }
// -> { email, expires_at, retry_after_seconds } (retry_after = secs until a
//    resend is allowed; seed the resend countdown from it immediately)
export const registerUser = async (email, password, last_name, first_name, middle_name) => {
    try {
        const response = await api.post("accounts/register/", { 
            "email": email, 
            "password": password, 
            "last_name": last_name, 
            "first_name": first_name, 
            "middle_name": middle_name 
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

export const verifyEmail = async (email, otp) => {
    try {
        const response = await api.post("accounts/register/verify/", {
            "email": email,
            "otp": otp
        });
        return response.data;
    }   
    catch (error) {
        throw error.response.data;
    }
}

// POST /accounts/register/resend/ — re-sends the registration OTP.
// payload: { email } -> { email, expires_at, retry_after_seconds }
// 429 OTP_RESEND_COOLDOWN_ACTIVE -> meta.retry_after_seconds (remaining).
export const resendOTP = async (email) => {
    try {
        const response = await api.post("accounts/register/resend/", {
            "email": email
        });
        return response.data;
    }   
    catch (error) {
        throw error.response.data;
    }
}
