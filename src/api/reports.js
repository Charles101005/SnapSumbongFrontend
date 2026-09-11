import api from "./axios";

// GET /reports/hazard-category/ -> [{ hazard_id, hazard_name, description }]
export const getHazardCategories = async () => {
    try {
        const response = await api.get("reports/hazard-category/");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// GET /reports/image-signature/?image_count=N
// -> { api_key, upload_url, upload_preset, asset_folder, use_asset_folder_as_public_id_prefix, timestamp, image_signatures: [{ public_id, signature }] }
export const getImageUploadSignature = async (imageCount) => {
    try {
        const response = await api.get("reports/image-signature/", {
            params: { image_count: imageCount },
        });
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Uploads files directly to Cloudinary using signed credentials from the backend.
// Returns an array of secure_url strings in the same order as `files`.
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

        if (!response.ok) {
            throw data;
        }

        return data.secure_url;
    };

    return Promise.all(files.map((file, index) => uploadOne(file, index)));
};

// Convenience helper: request a signature for `files.length` images and upload them all.
export const uploadHazardImageFiles = async (files) => {
    if (!files || files.length === 0) return [];

    const signatureData = await getImageUploadSignature(files.length);
    return uploadHazardImages(files, signatureData);
};

// POST /reports/
// payload: { category_ids, latitude, longitude, address, description, is_anonymous, image_urls }
// -> { report_number, reported_by, created_at }
export const createHazardReport = async (payload) => {
    try {
        const response = await api.post("reports/", payload);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
