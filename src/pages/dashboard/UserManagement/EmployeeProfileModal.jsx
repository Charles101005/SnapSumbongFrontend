import { useEffect, useRef, useState } from "react";
import "./EmployeeProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "REPORT OFFICER", label: "Report Officer" },
  { value: "SUPERVISOR", label: "Supervisor" },
];

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
              { value: "BRGY-REAL-BACOOR", label: "Barangay Real" },
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
              { value: "BRGY-POBLACION-LAOAG", label: "Barangay Poblacion" },
              { value: "BRGY-CALAYAB", label: "Barangay Calayab" },
              { value: "BRGY-NAGLAYAAN", label: "Barangay Naglayaan" },
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
              { value: "BRGY-POBLACION-VIGAN", label: "Barangay Poblacion" },
              { value: "BRGY-CRISOLOGO", label: "Barangay Crisologo" },
              { value: "BRGY-TAMAG", label: "Barangay Tamag" },
            ],
          },
        ],
      },
    ],
  },
];

const findLocationNode = (nodes, value) =>
  (nodes || []).find((node) => node.value === value) || null;

export default function EmployeeProfileModal({ employee, profile, mode = "edit", onClose, onSaved }) {
  const isView = mode === "view";
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [middleName, setMiddleName] = useState(profile?.middleName || "");
  const [employeeNumber, setEmployeeNumber] = useState(profile?.employeeNumber || "");
  const [birthdate, setBirthdate] = useState(profile?.birthdate || "");
  const [gender, setGender] = useState(profile?.gender || "");
  const [email, setEmail] = useState(employee?.email || profile?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [photo, setPhoto] = useState(profile?.photo || "");
  const [region, setRegion] = useState(profile?.region || "");
  const [province, setProvince] = useState(profile?.province || "");
  const [city, setCity] = useState(profile?.city || "");
  const [barangay, setBarangay] = useState(profile?.barangay || "");
  const [streetAddress, setStreetAddress] = useState(profile?.streetAddress || "");
  const [role, setRole] = useState(employee?.role || profile?.role || "ADMIN");
  const [status, setStatus] = useState(employee?.status || profile?.status || "ACTIVE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const photoInputRef = useRef(null);

  // Release any object URL created for a picked photo once it is replaced,
  // cleared (discard / employee switch), or the dialog unmounts.
  useEffect(() => {
    if (!photo || !photo.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(photo);
  }, [photo]);

  // Reset the form when the dialog switches to a different employee or mode —
  // React's "adjusting state when a prop changes" pattern (same shape as
  // CitizenProfileModal), which keeps the reset out of an effect.
  const employeeId = employee?.id ?? null;
  const [loadedKey, setLoadedKey] = useState(`${employeeId}:${mode}`);
  if (loadedKey !== `${employeeId}:${mode}`) {
    setLoadedKey(`${employeeId}:${mode}`);
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setMiddleName(profile?.middleName || "");
    setEmployeeNumber(profile?.employeeNumber || "");
    setBirthdate(profile?.birthdate || "");
    setGender(profile?.gender || "");
    setEmail(employee?.email || profile?.email || "");
    setPhoneNumber(profile?.phoneNumber || "");
    setPhoto(profile?.photo || "");
    setRegion(profile?.region || "");
    setProvince(profile?.province || "");
    setCity(profile?.city || "");
    setBarangay(profile?.barangay || "");
    setStreetAddress(profile?.streetAddress || "");
    setRole(employee?.role || profile?.role || "ADMIN");
    setStatus(employee?.status || profile?.status || "ACTIVE");
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
    const trimmedEmployeeNumber = employeeNumber.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedStreet = streetAddress.trim();

    if (!trimmedEmployeeNumber) {
      setError("Employee number is required.");
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
    setSuccess("Employee details saved successfully.");
    onSaved?.({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      middleName: trimmedMiddle,
      employeeNumber: trimmedEmployeeNumber,
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
      role,
      status,
    });
  };

  return (
    <div className="epm-modal-overlay" onClick={onClose}>
      <section
        className="epm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="epm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="epm-modal-header">
          <div>
            <h2 id="epm-modal-title" className="epm-modal-title">{isView ? "View Employee" : "Manage Employee"}</h2>
            <p className="epm-modal-subtitle">
              {isView ? "Employee information (read-only)." : "Update the employee information below."}
            </p>
          </div>
          <button
            type="button"
            className="epm-modal-close"
            onClick={onClose}
            aria-label="Close employee management"
          >
            &times;
          </button>
        </header>

        {error && <div className="epm-banner epm-banner-error">{error}</div>}
        {success && <div className="epm-banner epm-banner-success">{success}</div>}

        <form className="epm-form" onSubmit={handleSave} noValidate>
          <div className="epm-form-grid">
            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-employee-number">
                Employee Number {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-employee-number"
                className="epm-input"
                type="text"
                placeholder="EMP-2026-001"
                value={employeeNumber}
                onChange={(event) => setEmployeeNumber(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-first-name">
                First Name {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-first-name"
                className="epm-input"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-last-name">
                Last Name {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-last-name"
                className="epm-input"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-middle-name">Middle Name</label>
              <input
                id="epm-middle-name"
                className="epm-input"
                type="text"
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-birthdate">
                Birthdate {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-birthdate"
                className="epm-input"
                type="date"
                value={birthdate}
                onChange={(event) => setBirthdate(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-gender">
                Gender {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-gender"
                className="epm-input epm-select"
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

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-email">
                Email {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-email"
                className="epm-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-phone">Phone Number</label>
              <input
                id="epm-phone"
                className="epm-input"
                type="tel"
                placeholder="09XXXXXXXXX"
                maxLength={11}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-photo-input">Profile Photo</label>
              <div className="epm-photo-box">
                <input
                  ref={photoInputRef}
                  id="epm-photo-input"
                  className="epm-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isView}
                />
              </div>
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-region">
                Region {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-region"
                className="epm-input epm-select"
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

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-province">Province</label>
              <select
                id="epm-province"
                className="epm-input epm-select"
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

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-city">City/Municipality</label>
              <select
                id="epm-city"
                className="epm-input epm-select"
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

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-barangay">
                Barangay {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-barangay"
                className="epm-input epm-select"
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

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-street">Street Address</label>
              <input
                id="epm-street"
                className="epm-input"
                type="text"
                placeholder="House no., street"
                value={streetAddress}
                onChange={(event) => setStreetAddress(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-joined-date">Joined Date</label>
              <input id="epm-joined-date" className="epm-input" type="text" value={profile?.joinedDate || "—"} readOnly disabled />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-role">
                Role {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-role"
                className="epm-input epm-select"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isView}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-status">
                Account Status {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-status"
                className="epm-input epm-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isView}
              >
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>

            {photo && (
              <div className="epm-field">
                <span className="epm-label">Photo Preview</span>
                <button
                  type="button"
                  className="epm-photo-preview"
                  onClick={() => setLightboxSrc(photo)}
                  aria-label="View photo"
                >
                  <img src={photo} alt="Profile preview" />
                </button>
              </div>
            )}
          </div>

          <div className="epm-actions">
            {isView ? (
              <button type="button" className="epm-btn-discard" onClick={onClose}>Close</button>
            ) : (
              <>
                <button type="button" className="epm-btn-discard" onClick={onClose}>Cancel</button>
                <button type="submit" className="epm-btn-save">Save Changes</button>
              </>
            )}
          </div>
        </form>
      </section>

      {lightboxSrc && (
        <div
          className="epm-lightbox-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setLightboxSrc(null);
          }}
        >
          <button
            type="button"
            className="epm-lightbox-close"
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
            className="epm-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
