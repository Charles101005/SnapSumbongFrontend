import { useEffect, useRef, useState } from "react";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import { getEmployee, updateEmployee } from "../../../api/users";
import { getRoleLookup } from "../../../api/roles";
import { uploadProfileImage } from "../../../api/accounts";
import { GENDERS } from "../../../shared/constants";
import { formatDate } from "../../../utils/format";
import { mapApiErrors } from "../../../utils/apiErrors";
import "./EmployeeProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmployeeProfileModal({ userNumber, mode = "edit", onClose, onSaved }) {
  const isView = mode === "view";
  const [loading, setLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [createdAt, setCreatedAt] = useState("");
  const [roleOptions, setRoleOptions] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setDetailError("");
      try {
        const [detail, lookup] = await Promise.all([
          getEmployee(userNumber),
          getRoleLookup(),
        ]);
        if (cancelled) return;
        if (!detail || !detail.user_number) {
          setDetailError("Employee not found.");
          return;
        }
        setFirstName(detail.first_name || "");
        setLastName(detail.last_name || "");
        setMiddleName(detail.middle_name || "");
        setBirthdate(detail.birth_date || "");
        setGender(detail.gender || "");
        setEmail(detail.email || "");
        setPhoneNumber(detail.contact_number || "");
        setPhotoUrl(detail.profile_picture || "");
        setPhotoFile(null);
        setRegion(detail.region_code || "");
        setProvince(detail.province_code || "");
        setCity(detail.city_code || "");
        setBarangay(detail.barangay_code || "");
        setStreetAddress(detail.street_address || "");
        setRoleId(detail.role_id ? String(detail.role_id) : "");
        setIsActive(detail.is_active !== false);
        setCreatedAt(detail.created_at || "");
        setRoleOptions(lookup.map((role) => ({ value: String(role.role_id), label: role.role_name })));
      } catch (err) {
        if (cancelled) return;
        setDetailError(err?.detail || "Failed to load employee. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userNumber]);

  // Release any object URL created for a picked photo once it is replaced,
  // cleared (detail reload), or the dialog unmounts.
  useEffect(() => {
    if (!photoUrl || !photoUrl.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

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
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (isView) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedStreet = streetAddress.trim();

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
    if (!roleId) {
      setError("Role is required.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);
    try {
      let nextPhotoUrl = photoUrl;
      if (photoFile) {
        nextPhotoUrl = await uploadProfileImage(photoFile);
      }
      await updateEmployee(userNumber, {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        middle_name: trimmedMiddle,
        birth_date: birthdate,
        gender,
        email: trimmedEmail,
        contact_number: trimmedPhone,
        street_address: trimmedStreet,
        region_code: region,
        province_code: province,
        city_code: city,
        barangay_code: barangay,
        role_id: Number(roleId),
        is_active: isActive,
        ...(nextPhotoUrl ? { profile_picture: nextPhotoUrl } : {}),
      });
      setPhotoFile(null);
      setPhotoUrl(nextPhotoUrl);
      setSuccess("Employee details saved successfully.");
      onSaved?.();
    } catch (err) {
      // Domain errors ({ detail, error_code }) surface their detail message;
      // SELF_UPDATE_DENIED / ROLE_NOT_FOUND / USER_NOT_FOUND land on the form banner.
      const mapped = mapApiErrors(err, {
        codes: {
          SELF_UPDATE_DENIED: "form",
          ROLE_NOT_FOUND: "form",
          USER_NOT_FOUND: "form",
        },
      });
      setError(mapped.form || "Failed to save employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const modalShell = (content) => (
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
        {content}
      </section>
    </div>
  );

  if (loading) {
    return modalShell(<p className="epm-loading">Loading employee...</p>);
  }

  if (detailError) {
    return modalShell(
      <div className="epm-body">
        <div className="epm-banner epm-banner-error">{detailError}</div>
        <div className="epm-actions">
          <button type="button" className="epm-btn-discard" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalShell(
        <>
          {error && <div className="epm-banner epm-banner-error">{error}</div>}
          {success && <div className="epm-banner epm-banner-success">{success}</div>}

          <form className="epm-form" onSubmit={handleSave} noValidate>
            <div className="epm-form-grid">
              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-employee-number">Employee Number</label>
                <input
                  id="epm-employee-number"
                  className="epm-input"
                  type="text"
                  value={userNumber}
                  readOnly
                  disabled
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
                  {GENDERS.map((option) => (
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
                <SearchableSelect
                  id="epm-region"
                  value={region}
                  onChange={(value) => handleRegionChange({ target: { value } })}
                  options={regionOptions}
                  placeholder="Search region"
                  disabled={isView}
                  inputClassName="epm-input"
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-province">Province</label>
                <SearchableSelect
                  id="epm-province"
                  value={province}
                  onChange={(value) => handleProvinceChange({ target: { value } })}
                  options={provinceOptions}
                  placeholder="Search province"
                  disabled={isView || !canSelectProvince}
                  inputClassName="epm-input"
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-city">City/Municipality</label>
                <SearchableSelect
                  id="epm-city"
                  value={city}
                  onChange={(value) => handleCityChange({ target: { value } })}
                  options={cityOptions}
                  placeholder="Search city/municipality"
                  disabled={isView || !canSelectCity}
                  inputClassName="epm-input"
                />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-barangay">
                  Barangay {!isView && <span className="epm-required">*</span>}
                </label>
                <SearchableSelect
                  id="epm-barangay"
                  value={barangay}
                  onChange={setBarangay}
                  options={barangayOptions}
                  placeholder="Search barangay"
                  disabled={isView || !canSelectBarangay}
                  inputClassName="epm-input"
                />
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
                <input id="epm-joined-date" className="epm-input" type="text" value={formatDate(createdAt)} readOnly disabled />
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-role">
                  Role {!isView && <span className="epm-required">*</span>}
                </label>
                <select
                  id="epm-role"
                  className="epm-input epm-select"
                  value={roleId}
                  onChange={(event) => setRoleId(event.target.value)}
                  disabled={isView}
                >
                  {roleOptions.map((option) => (
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
                  value={isActive ? "ACTIVE" : "DEACTIVATED"}
                  onChange={(event) => setIsActive(event.target.value === "ACTIVE")}
                  disabled={isView}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>

              {photoUrl && (
                <div className="epm-field">
                  <span className="epm-label">Photo Preview</span>
                  <button
                    type="button"
                    className="epm-photo-preview"
                    onClick={() => setLightboxSrc(photoUrl)}
                    aria-label="View photo"
                  >
                    <img src={photoUrl} alt="Profile preview" />
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
                  <button type="submit" className="epm-btn-save" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </form>
        </>
      )}

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
    </>
  );
}
