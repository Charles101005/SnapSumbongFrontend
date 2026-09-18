import React, { useState, useRef } from "react";
import "./PersonalDetails.css";
import { updateProfile, uploadProfileImage } from "../../../api/accounts";

// Flattens DRF-style field errors ({ field: ["msg", ...] }) into one string.
const formatApiError = (err) => {
  if (!err) return "Something went wrong. Please try again.";
  if (typeof err.detail === "string") return err.detail;
  const messages = Object.values(err)
    .flat()
    .filter((v) => typeof v === "string");
  return messages.length > 0 ? messages.join(" ") : "Something went wrong. Please try again.";
};

export default function PersonalDetails({ profile, onSaved, onBack }) {
  const [formData, setFormData] = useState({
    lastName: profile?.last_name || "",
    firstName: profile?.first_name || "",
    middleName: profile?.middle_name || "",
    email: profile?.email || "",
    contactNumber: profile?.contact_number || "",
  });

  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setPhotoError("");
    setIsUploadingPhoto(true);
    try {
      const url = await uploadProfileImage(file);
      setProfilePicture(url);
    } catch {
      setPhotoError("Couldn't upload that photo. Please try a different image.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");

    // Only send fields that actually changed, matching the endpoint's
    // partial-update contract and avoiding needless re-validation (e.g. the
    // email-uniqueness check) on fields the person didn't touch.
    const payload = {};
    if (formData.lastName !== profile?.last_name) payload.last_name = formData.lastName;
    if (formData.firstName !== profile?.first_name) payload.first_name = formData.firstName;
    if (formData.middleName !== (profile?.middle_name || "")) payload.middle_name = formData.middleName;
    if (formData.email !== profile?.email) payload.email = formData.email;
    if (formData.contactNumber && formData.contactNumber !== (profile?.contact_number || "")) {
      payload.contact_number = formData.contactNumber;
    }
    if (profilePicture !== profile?.profile_picture) payload.profile_picture = profilePicture;

    if (Object.keys(payload).length === 0) {
      onBack();
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(payload);
      onSaved({ ...profile, ...payload });
    } catch (err) {
      setSaveError(formatApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="personal-details-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav">
        <span className="breadcrumb-link" onClick={onBack}>
          Portal
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Edit Personal Details</span>
      </nav>

      {/* Header */}
      <header className="page-header">
        <h1>Personal Details</h1>
        <p className="page-subtitle">
          Manage your personal information and how we can reach you.
        </p>
      </header>

      {/* Main Card Form */}
      <div className="details-card">
        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <section className="photo-section">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="#cfd8dc" width="70%" height="70%">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <button
                type="button"
                className="photo-badge-btn"
                title="Upload Photo"
                onClick={handlePhotoButtonClick}
                disabled={isUploadingPhoto}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handlePhotoFileChange}
              />
            </div>

            <div className="photo-actions-wrapper">
              <h2 className="section-title">Profile Photo</h2>
              <p className="section-subtitle">
                Update your photo for identification purposes.
              </p>
              <div className="photo-btn-group">
                <button
                  type="button"
                  className="btn-light-blue"
                  onClick={handlePhotoButtonClick}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                </button>
              </div>
              {photoError && <p className="field-hint" style={{ color: "#dc2626" }}>{photoError}</p>}
            </div>
          </section>

          <hr className="divider" />

          {/* Form Fields Stack */}
          <div className="form-fields-stack">
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="middleName">Middle Name</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Phone Number</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {saveError && <p className="field-hint" style={{ color: "#dc2626" }}>{saveError}</p>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSaving || isUploadingPhoto}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}