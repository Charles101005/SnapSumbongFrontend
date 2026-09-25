import api from "./axios";

// GET /reports/hazard-category/
export const getHazardCategories = async () => {
    try {
        const response = await api.get("reports/hazard-category/");
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// GET /reports/lookup/ -> { categories, statuses, severities }
export const getReportLookups = async () => {
    try {
        const response = await api.get("reports/lookup/");
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// GET /reports/image-signature/?image_count=N
export const getImageUploadSignature = async (imageCount) => {
    try {
        const response = await api.get("reports/image-signature/", {
            params: { image_count: imageCount },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// Upload files directly to Cloudinary using signed credentials from the API.
export const uploadHazardImages = async (files, signatureData) => {
    const {
        upload_url,
        api_key,
        asset_folder,
        upload_preset,
        use_asset_folder_as_public_id_prefix,
        timestamp,
        image_signatures,
    } = signatureData;

    if (files.length !== image_signatures.length) {
        throw new Error("Mismatch between number of files and image signatures.");
    }

    const uploadOne = async (file, index) => {
        const { public_id, signature } = image_signatures[index];
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

        if (!response.ok) throw data;
        return data.secure_url;
    };

    return Promise.all(files.map((file, index) => uploadOne(file, index)));
};

export const uploadHazardImageFiles = async (files) => {
    if (!files || files.length === 0) return [];
    const signatureData = await getImageUploadSignature(files.length);
    return uploadHazardImages(files, signatureData);
};

// POST /reports/
export const createHazardReport = async (payload) => {
    try {
        const response = await api.post("reports/", payload);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// GET /reports/
// Staff filters: q, category_id, status, exclude_closed, severity, from_date, to_date,
// page and page_size.
export const getReports = async (params = {}) => {
    try {
        const response = await api.get("reports/", { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// GET /reports/:report_number/
export const getReportDetail = async (reportNumber) => {
    try {
        const response = await api.get(`reports/${encodeURIComponent(reportNumber)}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// GET /reports/history/:report_number/
export const getReportHistoryDetail = async (reportNumber) => {
    try {
        const response = await api.get(`reports/history/${encodeURIComponent(reportNumber)}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// PATCH /reports/:report_number/
// The backend accepts status, severity, remarks and resolution_image_urls.
export const updateReport = async (reportNumber, payload) => {
    try {
        const response = await api.patch(
            `reports/${encodeURIComponent(reportNumber)}/`,
            payload
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// The same signed-image endpoint is used by staff for resolution evidence.
export const uploadResolutionImages = async (files) => {
    return uploadHazardImageFiles(files);
};
