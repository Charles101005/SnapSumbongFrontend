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
// Staff filters: q, category_id, status, exclude_closed, overdue, severity,
// from_date, to_date, page and page_size. `overdue=true` (staff-only) returns
// open reports past their response-time due date.
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
// The backend accepts status, severity, category_id, remarks and
// resolution_images.
// resolution_images is the photolog: [{ image_url, photo_type }]
// where photo_type is "DURING" or "AFTER" — at least one of each is
// required when transitioning to Resolved.
// category_id corrects the citizen's hazard category: only accepted while
// the report is Under Review, requires a remark in the same payload, and
// recalculates due_at from the report's created_at.
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

// POST /reports/:report_number/transfer/
// Supervisor handoff: reassigns an open report to another eligible officer.
// payload: { assigned_to: <user_number>, remarks?: string }
// Status is intentionally not part of the contract — a transfer is a
// handoff, not a workflow transition.
// requires permission: report:assign
export const transferReport = async (reportNumber, payload) => {
    try {
        const response = await api.post(
            `reports/${encodeURIComponent(reportNumber)}/transfer/`,
            payload
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

// POST /reports/:report_number/confirm-resolution/
// Citizen (reporter) confirmation: moves a RESOLVED report to CLOSED and
// stamps confirmed_at. Staff cannot use this endpoint; they force-close
// via PATCH with mandatory remarks instead.
export const confirmReportResolution = async (reportNumber) => {
    try {
        const response = await api.post(
            `reports/${encodeURIComponent(reportNumber)}/confirm-resolution/`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
