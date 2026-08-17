import api from "./axios";

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
