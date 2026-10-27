import { useState, useRef } from "react";
import "./PersonalDetails.css";
import { updateProfile, uploadProfileImage } from "../../../api/accounts";
import { mapApiErrors } from "../../../utils/apiErrors";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";

export default function PersonalDetails({ profile, onSaved, onBack }) {
  const [formData, setFormData] = useState({
    lastName: profile?.last_name || "",
    firstName: profile?.first_name || "",
    middleName: profile?.middle_name || "",
    email: profile?.email || "",
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

  const [profilePicture, setProfilePicture] = useState(profile?.profile_picture || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Set after a successful save; the success popup stays up until OK is
  // clicked, which is when onSaved finally runs (merge + navigate back).
  const [savedProfile, setSavedProfile] = useState(null);

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

  const validate = () => {
    const newErrors = {};
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email address.";

    // Only validated when actually changing — mirrors the payload condition
    // below so a legacy stored value can't block edits to other fields.
    const contactChanged =
      formData.contactNumber && formData.contactNumber !== (profile?.contact_number || "");
    if (contactChanged && !/^\d{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Phone number must be 11 digits.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
    if (profilePicture !== (profile?.profile_picture || "")) payload.profile_picture = profilePicture;

    // Blanks are sent as "" on purpose — the endpoint clears the stored value.
    if (streetAddress !== (profile?.street_address || "")) payload.street_address = streetAddress;
    if (region !== (profile?.region_code || "")) payload.region_code = region;
    if (province !== (profile?.province_code || "")) payload.province_code = province;
    if (city !== (profile?.city_code || "")) payload.city_code = city;
    if (barangay !== (profile?.barangay_code || "")) payload.barangay_code = barangay;

    if (Object.keys(payload).length === 0) {
      onBack();
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(payload);
      setSavedProfile({ ...profile, ...payload });
    } catch (err) {
      setErrors(
        mapApiErrors(err, {
          fields: {
            last_name: "lastName",
            first_name: "firstName",
            middle_name: "middleName",
            email: "email",
            contact_number: "contactNumber",
            street_address: "streetAddress",
            region_code: "region",
            province_code: "province",
            city_code: "city",
            barangay_code: "barangay",
          },
        })
      );
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
        <form onSubmit={handleSubmit} noValidate>
          {/* Profile Photo Section */}
          <section className="photo-section">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                {profilePicture ? (
                  <img className="profile-picture-preview" src={profilePicture} alt="Profile" />
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
              {photoError && <p className="error-text">{photoError}</p>}
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
                  className={errors.lastName ? "input-error" : ""}
                />
              </div>
              {errors.lastName && <p className="error-text">{errors.lastName}</p>}
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
                  className={errors.firstName ? "input-error" : ""}
                />
              </div>
              {errors.firstName && <p className="error-text">{errors.firstName}</p>}
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
                  className={errors.middleName ? "input-error" : ""}
                />
              </div>
              {errors.middleName && <p className="error-text">{errors.middleName}</p>}
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
                  className={errors.email ? "input-error" : ""}
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
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
                  className={errors.contactNumber ? "input-error" : ""}
                />
              </div>
              {errors.contactNumber && <p className="error-text">{errors.contactNumber}</p>}
            </div>
          </div>

          <hr className="divider" />

          {/* Address — optional for citizens; nothing here is required. */}
          <section className="address-section">
            <div className="address-heading">
              <h2 className="section-title">Address</h2>
              <p className="section-subtitle">
                Optional — leave any field blank if you'd rather not share it.
              </p>
            </div>

            <div className="address-grid">
              <div className="form-group">
                <label htmlFor="region">Region</label>
                <SearchableSelect
                  id="region"
                  value={region}
                  onChange={(value) => handleRegionChange({ target: { value } })}
                  options={regionOptions}
                  placeholder="Search region"
                  clearable
                  inputClassName="address-ss-input"
                />
                {errors.region && <p className="error-text">{errors.region}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="province">Province</label>
                <SearchableSelect
                  id="province"
                  value={province}
                  onChange={(value) => handleProvinceChange({ target: { value } })}
                  options={provinceOptions}
                  placeholder="Search province"
                  disabled={!canSelectProvince}
                  clearable
                  inputClassName="address-ss-input"
                />
                {errors.province && <p className="error-text">{errors.province}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="city">City/Municipality</label>
                <SearchableSelect
                  id="city"
                  value={city}
                  onChange={(value) => handleCityChange({ target: { value } })}
                  options={cityOptions}
                  placeholder="Search city/municipality"
                  disabled={!canSelectCity}
                  clearable
                  inputClassName="address-ss-input"
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="barangay">Barangay</label>
                <SearchableSelect
                  id="barangay"
                  value={barangay}
                  onChange={setBarangay}
                  options={barangayOptions}
                  placeholder="Search barangay"
                  disabled={!canSelectBarangay}
                  clearable
                  inputClassName="address-ss-input"
                />
                {errors.barangay && <p className="error-text">{errors.barangay}</p>}
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
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className={errors.streetAddress ? "input-error" : ""}
                  />
                </div>
                {errors.streetAddress && <p className="error-text">{errors.streetAddress}</p>}
              </div>
            </div>
          </section>

          {errors.form && <p className="error-text">{errors.form}</p>}

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

      {/* Success popup — centered so it's visible regardless of scroll;
          dismissed only via the OK button. */}
      {savedProfile && (
        <div className="pd-success-popup-overlay">
          <div
            className="pd-success-popup-card"
            role="dialog"
            aria-modal="true"
            aria-label="Profile updated"
          >
            <div className="pd-success-check-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p>Profile updated successfully.</p>
            <button
              type="button"
              className="pd-success-ok-btn"
              autoFocus
              onClick={() => onSaved(savedProfile)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
