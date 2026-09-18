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

// GET /accounts/profile/
// -> { last_name, first_name, middle_name, email, contact_number, is_notified, profile_picture }
export const getProfile = async () => {
    try {
        const response = await api.get("accounts/profile/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// PATCH /accounts/profile/ — partial update; send only the fields you want to change.
// payload: any subset of { last_name, first_name, middle_name, email, contact_number, is_notified, profile_picture }
export const updateProfile = async (payload) => {
    try {
        const response = await api.patch("accounts/profile/", payload);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// POST /accounts/profile/change-password/
// payload: { current_password, new_password }
export const changePassword = async (payload) => {
    try {
        const response = await api.post("accounts/profile/change-password/", payload);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// POST /accounts/profile/deactivate/
export const deactivateAccount = async () => {
    try {
        const response = await api.post("accounts/profile/deactivate/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// GET /accounts/profile/image-signature/
// -> { api_key, upload_url, upload_preset, asset_folder, use_asset_folder_as_public_id_prefix, timestamp, public_id, signature }
export const getProfileImageUploadSignature = async () => {
    try {
        const response = await api.get("accounts/profile/image-signature/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Uploads a single profile picture file directly to Cloudinary using signed
// credentials from the backend. Returns the resulting secure_url.
export const uploadProfileImage = async (file) => {
    const signatureData = await getProfileImageUploadSignature();
    const {
        upload_url,
        api_key,
        asset_folder,
        upload_preset,
        use_asset_folder_as_public_id_prefix,
        timestamp,
        public_id,
        signature,
    } = signatureData;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", api_key);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("public_id", public_id);
    formData.append("asset_folder", asset_folder);
    formData.append(
        "use_asset_folder_as_public_id_prefix",
        String(use_asset_folder_as_public_id_prefix)
    );
    formData.append("upload_preset", upload_preset);

    const response = await fetch(upload_url, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data.secure_url;
};