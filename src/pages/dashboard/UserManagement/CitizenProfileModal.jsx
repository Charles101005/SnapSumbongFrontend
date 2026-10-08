import { useEffect, useRef, useState } from "react";
import "./CitizenProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

// Placeholder PH address data shaped like PSGC responses (node = value/label/children)
// so the real PSGC API can replace this constant later — map { code, name } to
// { value, label } at the fetch boundary and the selects keep working untouched.
const LOCATION_OPTIONS = [
  {
    value: "NCR",
    label: "National Capital Region (NCR)",
    children: [
      {
        value: "METRO-MANILA",
        label: "Metro Manila",
        children: [
          {
            value: "CITY-OF-MANILA",
            label: "City of Manila",
            children: [
              { value: "BRGY-TONDO", label: "Barangay Tondo" },
              { value: "BRGY-BINONDO", label: "Barangay Binondo" },
              { value: "BRGY-SAMPALOC", label: "Barangay Sampaloc" },
            ],
          },
          {
            value: "CITY-OF-QUEZON",
            label: "Quezon City",
            children: [
              { value: "BRGY-COMMONWEALTH", label: "Barangay Commonwealth" },
              { value: "BRGY-SANGANDAAN", label: "Barangay Sangandaan" },
              { value: "BRGY-UP-CAMPUS", label: "Barangay UP Campus" },
            ],
          },
        ],
      },
    ],
  },
  {
    value: "CALABARZON",
    label: "Region IV-A (CALABARZON)",
    children: [
      {
        value: "CAVITE",
        label: "Cavite",
        children: [
          {
            value: "DASMARINAS",
            label: "City of Dasmariñas",
            children: [
              { value: "BRGY-PALIPARAN", label: "Barangay Paliparan" },
              { value: "BRGY-BUROL", label: "Barangay Burol" },
              { value: "BRGY-AGUINALDO", label: "Barangay Emilio Aguinaldo" },
            ],
          },
          {
            value: "BACOOR",
            label: "City of Bacoor",
            children: [
              { value: "BRGY-MOLINO", label: "Barangay Molino" },
              { value: "BRGY-PANAPAAN", label: "Barangay Panapaan" },
              { value: "BRGY-REAL-BACOOR", label: "Barangay Real Bacoor" },
            ],
          },
        ],
      },
      {
        value: "LAGUNA",
        label: "Laguna",
        children: [
          {
            value: "CALAMBA",
            label: "City of Calamba",
            children: [
              { value: "BRGY-POBLACION-CALAMBA", label: "Barangay Poblacion" },
              { value: "BRGY-BAGONG-SILANG", label: "Barangay Bagong Silang" },
              { value: "BRGY-SAN-CRISTOBAL", label: "Barangay San Cristobal" },
            ],
          },
          {
            value: "SANTA-ROSA",
            label: "City of Santa Rosa",
            children: [
              { value: "BRGY-TAGAPO", label: "Barangay Tagapo" },
              { value: "BRGY-KANLURAN", label: "Barangay Kanluran" },
              { value: "BRGY-LABAS", label: "Barangay Labas" },
            ],
          },
        ],
      },
    ],
  },
  {
    value: "REGION-I",
    label: "Region I (Ilocos Region)",
    children: [
      {
        value: "ILOCOS-NORTE",
        label: "Ilocos Norte",
        children: [
          {
            value: "LAOAG",
            label: "City of Laoag",
            children: [
              { value: "BRGY-CALAYAB", label: "Barangay Calayab" },
              { value: "BRGY-NAGLAYAAN", label: "Barangay Naglayaan" },
              { value: "BRGY-SAN-JOSE", label: "Barangay San Jose" },
            ],
          },
          {
            value: "BATAC",
            label: "City of Batac",
            children: [
              { value: "BRGY-POBLACION-BATAC", label: "Barangay Poblacion" },
              { value: "BRGY-SAN-JOSE", label: "Barangay San Jose" },
              { value: "BRGY-CENTRO-BATAC", label: "Barangay Centro" },
            ],
          },
        ],
      },
      {
        value: "ILOCOS-SUR",
        label: "Ilocos Sur",
        children: [
          {
            value: "VIGAN",
            label: "City of Vigan",
            children: [
              { value: "BRGY-CRISOLOGO", label: "Barangay Crisologo" },
              { value: "BRGY-TAMAG", label: "Barangay Tamag" },
              { value: "BRGY-LUGAN", label: "Barangay Lugan" },
            ],
          },
        ],
      },
    ],
  },
];

const findLocationNode = (nodes, value) =>
  (nodes || []).find((node) => node.value === value) || null;

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

  // Cascading address options — each level narrows the next; a parent change
  // clears every child selection so stale combinations can't be saved.
  const selectedRegion = findLocationNode(LOCATION_OPTIONS, region);
  const selectedProvince = findLocationNode(selectedRegion?.children, province);
  const selectedCity = findLocationNode(selectedProvince?.children, city);
  const provinceOptions = selectedRegion?.children || [];
  const cityOptions = selectedProvince?.children || [];
  const barangayOptions = selectedCity?.children || [];

  const handleRegionChange = (event) => {
    setRegion(event.target.value);
    setProvince("");
    setCity("");
    setBarangay("");
  };

  const handleProvinceChange = (event) => {
    setProvince(event.target.value);
    setCity("");
    setBarangay("");
  };

  const handleCityChange = (event) => {
    setCity(event.target.value);
    setBarangay("");
  };

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
              <select
                id="cp-region"
                className="cp-input cp-select"
                value={region}
                onChange={handleRegionChange}
                disabled={isView}
              >
                <option value="">Select region</option>
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-province">Province</label>
              <select
                id="cp-province"
                className="cp-input cp-select"
                value={province}
                onChange={handleProvinceChange}
                disabled={isView || !selectedRegion}
              >
                <option value="">Select province</option>
                {provinceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-city">City/Municipality</label>
              <select
                id="cp-city"
                className="cp-input cp-select"
                value={city}
                onChange={handleCityChange}
                disabled={isView || !selectedProvince}
              >
                <option value="">Select city/municipality</option>
                {cityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-barangay">
                Barangay {!isView && <span className="cp-required">*</span>}
              </label>
              <select
                id="cp-barangay"
                className="cp-input cp-select"
                value={barangay}
                onChange={(event) => setBarangay(event.target.value)}
                disabled={isView || !selectedCity}
              >
                <option value="">Select barangay</option>
                {barangayOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
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
