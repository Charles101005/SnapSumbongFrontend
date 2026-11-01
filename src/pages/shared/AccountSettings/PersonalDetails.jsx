import { useState, useRef, useEffect } from "react";
import "./PersonalDetails.css";
import { updateProfile, uploadProfileImage } from "../../../api/accounts";
import { mapApiErrors } from "../../../utils/apiErrors";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";
import EmailChangeModal from "./EmailChangeModal";
import Toast from "../../../components/shared/Toast";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Order fields are focused in after a failed submit, so the first invalid
// input always comes into view.
const FIELD_FOCUS_ORDER = [
  "lastName",
  "firstName",
  "middleName",
  "contactNumber",
  "streetAddress",
  "region",
  "province",
  "city",
  "barangay",
];

// Focus + scroll to a field by its input id. Comboboxes (SearchableSelect)
// only scroll — focusing them would pop their dropdown open as a side effect.
function focusField(key) {
  const element = document.getElementById(key);
  if (!element) return;
  if (element.getAttribute("role") !== "combobox") {
    element.focus({ preventScroll: true });
  }
  element.scrollIntoView({ block: "center", behavior: "smooth" });
}

export default function PersonalDetails({
  profile,
  onSaved,
  onEmailChanged,
  onBack,
  variant = "citizen",
}) {
  const [formData, setFormData] = useState({
    lastName: profile?.last_name || "",
    firstName: profile?.first_name || "",
    middleName: profile?.middle_name || "",
    contactNumber: profile?.contact_number || "",
  });

  // Address — optional for citizens; empty values are simply not sent (or
  // sent as "" to clear, which the endpoint treats as null).
  const [streetAddress, setStreetAddress] = useState(profile?.street_address || "");
  const [region, setRegion] = useState(profile?.region_code || "");
  const [province, setProvince] = useState(profile?.province_code || "");
  const [city, setCity] = useState(profile?.city_code || "");
  const [barangay, setBarangay] = useState(profile?.barangay_code || "");

  const {
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    canSelectProvince,
    canSelectCity,
    canSelectBarangay,
    handleRegionChange,
    handleProvinceChange,
    handleCityChange,
  } = usePsgcAddress({
    region,
    province,
    city,
    barangay,
    setRegion,
    setProvince,
    setCity,
    setBarangay,
  });

  // Photo — the picked file is staged locally and only uploaded when the
  // user saves, so selecting (or discarding) one never touches the server.
  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || "");
  const [stagedPhotoFile, setStagedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Email lives in its own verified flow (Change Email modal) — never in
  // the Save Changes payload, which the endpoint rejects outright.
  const [currentEmail, setCurrentEmail] = useState(profile?.email || "");
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Release the staged preview's object URL when it's replaced or unmounted.
  useEffect(() => {
    if (!photoPreviewUrl) return undefined;
    return () => URL.revokeObjectURL(photoPreviewUrl);
  }, [photoPreviewUrl]);

  const clearError = (...fields) =>
    setErrors((prev) => {
      if (!fields.some((field) => prev[field])) return prev;
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return next;
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Phone accepts digits only — pasted separators are stripped inline.
    const next = name === "contactNumber" ? value.replace(/\D/g, "").slice(0, 11) : value;
    setFormData((prev) => ({ ...prev, [name]: next }));
    clearError(name);
  };

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("File too large — maximum size is 5 MB.");
      return;
    }

    setPhotoError("");
    setStagedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoError("");
    if (stagedPhotoFile) {
      // Discard the staged selection and fall back to the saved photo.
      setStagedPhotoFile(null);
      setPhotoPreviewUrl("");
      return;
    }
    // Clears the saved photo — takes effect through the Save payload.
    setProfilePicture("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";

    // Only validated when actually changing — mirrors the payload condition
    // below so a legacy stored value can't block edits to other fields.
    const storedContact = profile?.contact_number || "";
    const contactChanged = formData.contactNumber !== storedContact;
    if (contactChanged && formData.contactNumber && !/^\d{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Phone number must be 11 digits.";
    }

    return newErrors;
  };

  // Only send fields that actually changed, matching the endpoint's
  // partial-update contract. Email is excluded on purpose — it goes
  // through the verified Change Email flow instead. `finalPicture` carries
  // the freshly uploaded photo URL when one was staged.
  const buildPayload = (finalPicture = profilePicture) => {
    const payload = {};
    const original = (value) => value || "";
    if (formData.lastName !== original(profile?.last_name)) payload.last_name = formData.lastName;
    if (formData.firstName !== original(profile?.first_name)) payload.first_name = formData.firstName;
    if (formData.middleName !== original(profile?.middle_name)) payload.middle_name = formData.middleName;
    // Cleared phone is a real change too — sent as "" to clear the value.
    if (formData.contactNumber !== original(profile?.contact_number)) {
      payload.contact_number = formData.contactNumber;
    }
    if (finalPicture !== original(profile?.profile_picture)) payload.profile_picture = finalPicture;

    // Blanks are sent as "" on purpose — the endpoint clears the stored value.
    if (streetAddress !== original(profile?.street_address)) payload.street_address = streetAddress;
    if (region !== original(profile?.region_code)) payload.region_code = region;
    if (province !== original(profile?.province_code)) payload.province_code = province;
    if (city !== original(profile?.city_code)) payload.city_code = city;
    if (barangay !== original(profile?.barangay_code)) payload.barangay_code = barangay;

    return payload;
  };

  const isDirty = Boolean(stagedPhotoFile) || Object.keys(buildPayload()).length > 0;

  // Warn before a refresh/close throws away edits.
  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const focusFirstError = (errorMap) => {
    const firstKey = FIELD_FOCUS_ORDER.find((key) => errorMap[key]);
    if (firstKey) {
      focusField(firstKey);
    } else if (errorMap.form) {
      document
        .getElementById("pd-form-error")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const requestBack = () => {
    if (isDirty) setConfirmDiscard(true);
    else onBack();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      // A staged photo uploads now — file selection itself never left the
      // browser, so cancelling earlier cost nothing.
      let uploadedPicture = profilePicture;
      if (stagedPhotoFile) {
        uploadedPicture = await uploadProfileImage(stagedPhotoFile);
      }

      const payload = buildPayload(uploadedPicture);
      if (Object.keys(payload).length === 0) {
        setNotice("No changes to save.");
        return;
      }

      await updateProfile(payload);

      setStagedPhotoFile(null);
      setPhotoPreviewUrl("");
      setProfilePicture(uploadedPicture);
      onSaved({ ...profile, ...payload, profile_picture: uploadedPicture });
    } catch (err) {
      const mapped = mapApiErrors(err, {
        fields: {
          last_name: "lastName",
          first_name: "firstName",
          middle_name: "middleName",
          contact_number: "contactNumber",
          street_address: "streetAddress",
          region_code: "region",
          province_code: "province",
          city_code: "city",
          barangay_code: "barangay",
          profile_picture: "form",
        },
      });
      setErrors(mapped);
      focusFirstError(mapped);
    } finally {
      setIsSaving(false);
    }
  };

  // Called by the Change Email modal after the OTP verifies. Updates the
  // displayed address locally, syncs the parent (profile + sidebar) without
  // navigating away — unsaved edits to the other fields stay intact.
  const handleEmailVerified = (newEmail) => {
    setCurrentEmail(newEmail);
    setEmailModalOpen(false);
    setNotice("Email updated successfully.");
    if (onEmailChanged) onEmailChanged(newEmail);
  };

  const displayedPhoto = photoPreviewUrl || profilePicture;
  const canRemovePhoto = Boolean(stagedPhotoFile || profilePicture);
  const removePhotoLabel = stagedPhotoFile ? "Undo selection" : "Remove photo";

  const addressErrorProps = (key) =>
    errors[key]
      ? { "aria-invalid": "true", "aria-describedby": `${key}-error` }
      : {};

  return (
    <div className="personal-details-container">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <button type="button" className="breadcrumb-link" onClick={requestBack}>
          Account Settings
        </button>
        <span className="breadcrumb-separator" aria-hidden="true">/</span>
        <span className="breadcrumb-current" aria-current="page">
          Edit Personal Details
        </span>
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
        <form onSubmit={handleSubmit} noValidate>
          {/* Profile Photo Section */}
          <section className="photo-section">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                {displayedPhoto ? (
                  <img className="profile-picture-preview" src={displayedPhoto} alt="Profile" />
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
                aria-label="Upload a new profile photo"
                onClick={handlePhotoButtonClick}
                disabled={isSaving}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose a profile photo"
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
                  disabled={isSaving}
                >
                  Change Photo
                </button>
                {canRemovePhoto && (
                  <button
                    type="button"
                    className="btn-light-gray"
                    onClick={handleRemovePhoto}
                    disabled={isSaving}
                  >
                    {removePhotoLabel}
                  </button>
                )}
              </div>
              {stagedPhotoFile && (
                <p className="photo-staged-hint">
                  New photo selected — it uploads when you save.
                </p>
              )}
              {photoError && <p className="error-text">{photoError}</p>}
            </div>
          </section>

          <hr className="divider" />

          {/* Form Fields Stack */}
          <div className="form-fields-stack">
            <div className="form-group">
              <label htmlFor="lastName">
                Last Name <span className="required-star" aria-hidden="true">*</span>
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  maxLength={100}
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={errors.lastName ? "true" : undefined}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  className={errors.lastName ? "input-error" : ""}
                />
              </div>
              {errors.lastName && (
                <p className="error-text" id="lastName-error">{errors.lastName}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="firstName">
                First Name <span className="required-star" aria-hidden="true">*</span>
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  maxLength={100}
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={errors.firstName ? "true" : undefined}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  className={errors.firstName ? "input-error" : ""}
                />
              </div>
              {errors.firstName && (
                <p className="error-text" id="firstName-error">{errors.firstName}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="middleName">
                Middle Name <span className="optional-tag">optional</span>
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  maxLength={100}
                  value={formData.middleName}
                  onChange={handleChange}
                  aria-invalid={errors.middleName ? "true" : undefined}
                  aria-describedby={errors.middleName ? "middleName-error" : undefined}
                  className={errors.middleName ? "input-error" : ""}
                />
              </div>
              {errors.middleName && (
                <p className="error-text" id="middleName-error">{errors.middleName}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">
                Phone Number {variant !== "staff" && (
                <span className="optional-tag">optional</span>
              )}
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="09XXXXXXXXX"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  value={formData.contactNumber}
                  onChange={handleChange}
                  aria-invalid={errors.contactNumber ? "true" : undefined}
                  aria-describedby={errors.contactNumber ? "contactNumber-error" : undefined}
                  className={errors.contactNumber ? "input-error" : ""}
                />
              </div>
              {errors.contactNumber && (
                <p className="error-text" id="contactNumber-error">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          <hr className="divider" />

          {/* Address — optional for citizens (nothing here is required);
              staff addresses are pre-filled by the admin at account
              creation, so that portal gets no hint subtitle. */}
          <section className="address-section">
            <div className="address-heading">
              <h2 className="section-title">Address</h2>
              {variant !== "staff" && (
                <p className="section-subtitle">
                  Optional — leave any field blank if you'd rather not share it.
                </p>
              )}
            </div>

            <div className="address-grid">
              <div className="form-group">
                <label htmlFor="region">Region</label>
                <SearchableSelect
                  id="region"
                  value={region}
                  onChange={(value) => {
                    handleRegionChange({ target: { value } });
                    clearError("region", "province", "city", "barangay");
                  }}
                  options={regionOptions}
                  placeholder="Search region"
                  clearable
                  inputClassName="address-ss-input"
                  {...addressErrorProps("region")}
                />
                {errors.region && (
                  <p className="error-text" id="region-error">{errors.region}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="province">Province</label>
                <SearchableSelect
                  id="province"
                  value={province}
                  onChange={(value) => {
                    handleProvinceChange({ target: { value } });
                    clearError("region", "province", "city", "barangay");
                  }}
                  options={provinceOptions}
                  placeholder="Search province"
                  disabled={!canSelectProvince}
                  clearable
                  inputClassName="address-ss-input"
                  {...addressErrorProps("province")}
                />
                {errors.province && (
                  <p className="error-text" id="province-error">{errors.province}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="city">City/Municipality</label>
                <SearchableSelect
                  id="city"
                  value={city}
                  onChange={(value) => {
                    handleCityChange({ target: { value } });
                    clearError("region", "province", "city", "barangay");
                  }}
                  options={cityOptions}
                  placeholder="Search city/municipality"
                  disabled={!canSelectCity}
                  clearable
                  inputClassName="address-ss-input"
                  {...addressErrorProps("city")}
                />
                {errors.city && (
                  <p className="error-text" id="city-error">{errors.city}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="barangay">Barangay</label>
                <SearchableSelect
                  id="barangay"
                  value={barangay}
                  onChange={(value) => {
                    setBarangay(value);
                    clearError("region", "province", "city", "barangay");
                  }}
                  options={barangayOptions}
                  placeholder="Search barangay"
                  disabled={!canSelectBarangay}
                  clearable
                  inputClassName="address-ss-input"
                  {...addressErrorProps("barangay")}
                />
                {errors.barangay && (
                  <p className="error-text" id="barangay-error">{errors.barangay}</p>
                )}
              </div>

              <div className="form-group address-full">
                <label htmlFor="streetAddress">Street Address</label>
                <div className="input-with-icon">
                  <svg
                    className="input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    placeholder="House no., street"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      clearError("streetAddress");
                    }}
                    aria-invalid={errors.streetAddress ? "true" : undefined}
                    aria-describedby={errors.streetAddress ? "streetAddress-error" : undefined}
                    className={errors.streetAddress ? "input-error" : ""}
                  />
                </div>
                {errors.streetAddress && (
                  <p className="error-text" id="streetAddress-error">{errors.streetAddress}</p>
                )}
              </div>
            </div>
          </section>

          <hr className="divider" />

          {/* Email — verified separately via Change Email; never saved
              by the Save Changes button (the endpoint rejects it). */}
          <section className="email-section">
            <div className="email-heading">
              <h2 className="section-title">Email Address</h2>
              <p className="section-subtitle">
                Changing your email requires a verification code sent to the
                new address.
              </p>
            </div>
            <div className="email-row">
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  value={currentEmail}
                  readOnly
                  className="email-readonly"
                  aria-label="Current email address"
                />
              </div>
              <button
                type="button"
                className="btn-light-blue"
                onClick={() => setEmailModalOpen(true)}
                disabled={isSaving}
              >
                Change Email
              </button>
            </div>
          </section>

          {errors.form && (
            <p className="error-text" id="pd-form-error">{errors.form}</p>
          )}

          <div className={`form-actions${isDirty ? " form-actions-dirty" : ""}`}>
            {isDirty && (
              <span className="unsaved-indicator">
                <span className="unsaved-dot" aria-hidden="true" />
                You have unsaved changes
              </span>
            )}
            <button type="button" className="btn-cancel" onClick={requestBack} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSaving || !isDirty}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <Toast message={notice} onDismiss={() => setNotice("")} />

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard your changes?"
        message="You have unsaved changes to your personal details. Leaving now will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          onBack();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <EmailChangeModal
        key={emailModalOpen ? "ecm-open" : "ecm-closed"}
        isOpen={emailModalOpen}
        currentEmail={currentEmail}
        onClose={() => setEmailModalOpen(false)}
        onVerified={handleEmailVerified}
      />
    </div>
  );
}
