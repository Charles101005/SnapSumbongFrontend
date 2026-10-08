import { useEffect, useRef, useState } from "react";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import "./CitizenProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export default function CitizenProfileModal({ citizen, profile, mode = "edit", onClose, onSaved }) {
  const isView = mode === "view";
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [middleName, setMiddleName] = useState(profile?.middleName || "");
  const [userNumber, setUserNumber] = useState(profile?.userNumber || "");
  const [birthdate, setBirthdate] = useState(profile?.birthdate || "");
  const [gender, setGender] = useState(profile?.gender || "");
  const [email, setEmail] = useState(profile?.email || citizen?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [photo, setPhoto] = useState(profile?.photo || "");
  const [region, setRegion] = useState(profile?.region || "");
  const [province, setProvince] = useState(profile?.province || "");
  const [city, setCity] = useState(profile?.city || "");
  const [barangay, setBarangay] = useState(profile?.barangay || "");
  const [streetAddress, setStreetAddress] = useState(profile?.streetAddress || "");
  const [status, setStatus] = useState(profile?.status || citizen?.status || "ACTIVE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const photoInputRef = useRef(null);

  // Release any object URL created for a picked photo once it is replaced,
  // cleared (discard / citizen switch), or the dialog unmounts.
  useEffect(() => {
    if (!photo || !photo.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(photo);
  }, [photo]);

  // Reset the form when the dialog switches to a different citizen or mode —
  // React's "adjusting state when a prop changes" pattern (same shape as
  // ReportManagementModal), which keeps the reset out of an effect.
  const citizenId = citizen?.id ?? null;
  const [loadedKey, setLoadedKey] = useState(`${citizenId}:${mode}`);
  if (loadedKey !== `${citizenId}:${mode}`) {
    setLoadedKey(`${citizenId}:${mode}`);
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setMiddleName(profile?.middleName || "");
    setUserNumber(profile?.userNumber || "");
    setBirthdate(profile?.birthdate || "");
    setGender(profile?.gender || "");
    setEmail(profile?.email || citizen?.email || "");
    setPhoneNumber(profile?.phoneNumber || "");
    setPhoto(profile?.photo || "");
    setRegion(profile?.region || "");
    setProvince(profile?.province || "");
    setCity(profile?.city || "");
    setBarangay(profile?.barangay || "");
    setStreetAddress(profile?.streetAddress || "");
    setStatus(profile?.status || citizen?.status || "ACTIVE");
    setError("");
    setSuccess("");
    setLightboxSrc(null);
  }

  // Escape closes the lightbox first, then the dialog.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (lightboxSrc) {
        setLightboxSrc(null);
        return;
      }
      onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, lightboxSrc]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

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

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (isView) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedUserNumber = userNumber.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedStreet = streetAddress.trim();

    if (!trimmedUserNumber) {
      setError("User number is required.");
      setSuccess("");
      return;
    }
    if (!trimmedFirst) {
      setError("First name is required.");
      setSuccess("");
      return;
    }
    if (!trimmedLast) {
      setError("Last name is required.");
      setSuccess("");
      return;
    }
    if (!birthdate) {
      setError("Birthdate is required.");
      setSuccess("");
      return;
    }
    if (!gender) {
      setError("Gender is required.");
      setSuccess("");
      return;
    }
    if (!trimmedEmail) {
      setError("Email address is required.");
      setSuccess("");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      setSuccess("");
      return;
    }
    if (trimmedPhone && !/^\d{11}$/.test(trimmedPhone)) {
      setError("Phone number must be 11 digits.");
      setSuccess("");
      return;
    }
    if (!region) {
      setError("Region is required.");
      setSuccess("");
      return;
    }
    if (!barangay) {
      setError("Barangay is required.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("Citizen details saved successfully.");
    onSaved?.({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      middleName: trimmedMiddle,
      userNumber: trimmedUserNumber,
      birthdate,
      gender,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      photo,
      region,
      province,
      city,
      barangay,
      streetAddress: trimmedStreet,
      status,
    });
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <section
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cp-modal-header">
          <div>
            <h2 id="cp-modal-title" className="cp-modal-title">{isView ? "View Citizen" : "Manage Citizen"}</h2>
            <p className="cp-modal-subtitle">
              {isView ? "Citizen information (read-only)." : "Update the citizen information below."}
            </p>
          </div>
          <button
            type="button"
            className="cp-modal-close"
            onClick={onClose}
            aria-label="Close citizen management"
          >
            &times;
          </button>
        </header>

        {error && <div className="cp-banner cp-banner-error">{error}</div>}
        {success && <div className="cp-banner cp-banner-success">{success}</div>}

        <form className="cp-form" onSubmit={handleSave} noValidate>
          <div className="cp-form-grid">
            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-user-number">
                User Number {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-user-number"
                className="cp-input"
                type="text"
                placeholder="USR-2026-001"
                value={userNumber}
                onChange={(event) => setUserNumber(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-first-name">
                First Name {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-first-name"
                className="cp-input"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-last-name">
                Last Name {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-last-name"
                className="cp-input"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-middle-name">Middle Name</label>
              <input
                id="cp-middle-name"
                className="cp-input"
                type="text"
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-birthdate">
                Birthdate {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-birthdate"
                className="cp-input"
                type="date"
                value={birthdate}
                onChange={(event) => setBirthdate(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-gender">
                Gender {!isView && <span className="cp-required">*</span>}
              </label>
              <select
                id="cp-gender"
                className="cp-input cp-select"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                disabled={isView}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-email">
                Email {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-email"
                className="cp-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-phone">Phone Number</label>
              <input
                id="cp-phone"
                className="cp-input"
                type="tel"
                placeholder="09XXXXXXXXX"
                maxLength={11}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-photo-input">Profile Photo</label>
              <div className="cp-photo-box">
                <input
                  ref={photoInputRef}
                  id="cp-photo-input"
                  className="cp-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isView}
                />
              </div>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-region">
                Region {!isView && <span className="cp-required">*</span>}
              </label>
              <SearchableSelect
                id="cp-region"
                value={region}
                onChange={(value) => handleRegionChange({ target: { value } })}
                options={regionOptions}
                placeholder="Search region"
                disabled={isView}
                inputClassName="cp-input"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-province">Province</label>
              <SearchableSelect
                id="cp-province"
                value={province}
                onChange={(value) => handleProvinceChange({ target: { value } })}
                options={provinceOptions}
                placeholder="Search province"
                disabled={isView || !canSelectProvince}
                inputClassName="cp-input"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-city">City/Municipality</label>
              <SearchableSelect
                id="cp-city"
                value={city}
                onChange={(value) => handleCityChange({ target: { value } })}
                options={cityOptions}
                placeholder="Search city/municipality"
                disabled={isView || !canSelectCity}
                inputClassName="cp-input"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-barangay">
                Barangay {!isView && <span className="cp-required">*</span>}
              </label>
              <SearchableSelect
                id="cp-barangay"
                value={barangay}
                onChange={setBarangay}
                options={barangayOptions}
                placeholder="Search barangay"
                disabled={isView || !canSelectBarangay}
                inputClassName="cp-input"
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-street">Street Address</label>
              <input
                id="cp-street"
                className="cp-input"
                type="text"
                placeholder="House no., street"
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-joined-date">Joined Date</label>
              <input id="cp-joined-date" className="cp-input" type="text" value={profile?.joinedDate || "—"} readOnly disabled />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-user-role">User Role</label>
              <input id="cp-user-role" className="cp-input" type="text" value="Citizen" readOnly disabled />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-status">
                Account Status {!isView && <span className="cp-required">*</span>}
              </label>
              <select
                id="cp-status"
                className="cp-input cp-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isView}
              >
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {photo && (
              <div className="cp-field">
                <span className="cp-label">Photo Preview</span>
                <button
                  type="button"
                  className="cp-photo-preview"
                  onClick={() => setLightboxSrc(photo)}
                  aria-label="View photo"
                >
                  <img src={photo} alt="Profile preview" />
                </button>
              </div>
            )}
          </div>

          <div className="cp-actions">
            {isView ? (
              <button type="button" className="cp-btn-discard" onClick={onClose}>Close</button>
            ) : (
              <>
                <button type="button" className="cp-btn-discard" onClick={onClose}>Cancel</button>
                <button type="submit" className="cp-btn-save">Save Changes</button>
              </>
            )}
          </div>
        </form>
      </section>

      {lightboxSrc && (
        <div
          className="cp-lightbox-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setLightboxSrc(null);
          }}
        >
          <button
            type="button"
            className="cp-lightbox-close"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxSrc(null);
            }}
            aria-label="Close photo preview"
          >
            &times;
          </button>
          <img
            src={lightboxSrc}
            alt="Full size profile preview"
            className="cp-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
