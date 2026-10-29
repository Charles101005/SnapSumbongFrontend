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

// The API stores/accepts the one-letter gender code ("M"/"F"/"O"), but detail
// responses have been seen carrying the full label ("Male"). Normalize to the
// code so the select matches an option and the payload is always valid.
const normalizeGender = (value) => (value ? String(value).trim().charAt(0).toUpperCase() : "");

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
  // Per-field errors plus optional form-wide `form` key — same shape
  // mapApiErrors returns so server and client messages share one state.
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const photoInputRef = useRef(null);
  // Snapshot of the employee as loaded (or last saved) so handleSave can send
  // only the fields that actually changed. PATCH treats the payload as a
  // partial update; resending an unchanged email trips the uniqueness check.
  const profileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setDetailError("");
      try {
        const [detail, lookup] = await Promise.all([
          getEmployee(userNumber),
          getRoleLookup({ exclude_citizen: true }),
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
        setGender(normalizeGender(detail.gender));
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
        profileRef.current = detail;
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
    setSuccess("");
  };

  // Drop a single field's error when the user edits it; leave errors.form
  // (network / SELF_UPDATE_DENIED / etc.) until the next save attempt.
  const clearFieldError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Standard onChange for plain inputs/selects: set value, clear that
  // field's error, and dismiss any success banner.
  const onFieldChange = (key, setter) => (event) => {
    setter(event.target.value);
    clearFieldError(key);
    setSuccess("");
  };

  // Same for SearchableSelect-style onChange(value).
  const onFieldChangeValue = (key, setter) => (value) => {
    setter(value);
    clearFieldError(key);
    setSuccess("");
  };

  // Address cascade: changing region/province/city resets the dependents
  // via usePsgcAddress, so their stale errors must go too.
  const onAddressChange = (keys, handler) => (value) => {
    handler({ target: { value } });
    setErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      keys.forEach((key) => {
        if (next[key]) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    setSuccess("");
  };

  // PATCH is a partial update: send only the fields whose current value
  // differs from the loaded (or last-saved) snapshot. Resending an unchanged
  // email in particular trips the backend's uniqueness validation.
  const buildPayload = (nextPhotoUrl, photoChanged) => {
    const original = profileRef.current || {};
    const payload = {};

    if (firstName.trim() !== (original.first_name || "")) payload.first_name = firstName.trim();
    if (lastName.trim() !== (original.last_name || "")) payload.last_name = lastName.trim();
    if (middleName.trim() !== (original.middle_name || "")) payload.middle_name = middleName.trim();
    if (birthdate !== (original.birth_date || "")) payload.birth_date = birthdate;

    const genderCode = normalizeGender(gender);
    if (genderCode !== normalizeGender(original.gender)) payload.gender = genderCode;

    if (email.trim() !== (original.email || "")) payload.email = email.trim();
    if (phoneNumber.trim() !== (original.contact_number || "")) {
      payload.contact_number = phoneNumber.trim();
    }
    if (streetAddress.trim() !== (original.street_address || "")) {
      payload.street_address = streetAddress.trim();
    }
    if (region !== (original.region_code || "")) payload.region_code = region;
    if (province !== (original.province_code || "")) payload.province_code = province;
    if (city !== (original.city_code || "")) payload.city_code = city;
    if (barangay !== (original.barangay_code || "")) payload.barangay_code = barangay;

    const originalRoleId = original.role_id ? String(original.role_id) : "";
    if (roleId !== originalRoleId) payload.role_id = Number(roleId);

    if (isActive !== (original.is_active !== false)) payload.is_active = isActive;

    // Always include a freshly uploaded photo, even if Cloudinary happened to
    // return the same URL; otherwise only send it when it actually differs.
    if (photoChanged || nextPhotoUrl !== (original.profile_picture || "")) {
      payload.profile_picture = nextPhotoUrl;
    }

    return payload;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (isView) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    // Collect every client-side problem so the user sees them all at once.
    const newErrors = {};
    if (!trimmedFirst) newErrors.firstName = "First name is required.";
    if (!trimmedLast) newErrors.lastName = "Last name is required.";
    if (!birthdate) newErrors.birthdate = "Birthdate is required.";
    if (!normalizeGender(gender)) newErrors.gender = "Gender is required.";
    if (!trimmedEmail) {
      newErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (trimmedPhone && !/^\d{11}$/.test(trimmedPhone)) {
      newErrors.phoneNumber = "Phone number must be 11 digits.";
    }
    if (!region) newErrors.region = "Region is required.";
    if (!barangay) newErrors.barangay = "Barangay is required.";
    if (!roleId) newErrors.roleId = "Role is required.";

    setErrors(newErrors);
    setSuccess("");
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      // Photo upload is a separate step so a Cloudinary/signature failure
      // never reaches PATCH and gets a photo-specific message.
      let nextPhotoUrl = photoUrl;
      let photoChanged = false;
      if (photoFile) {
        try {
          nextPhotoUrl = await uploadProfileImage(photoFile);
        } catch (uploadErr) {
          setErrors({
            form:
              (typeof uploadErr?.detail === "string" && uploadErr.detail) ||
              "Couldn't upload that photo. Please try a different image.",
          });
          return;
        }
        photoChanged = true;
        // Keep the CDN URL in state even if the PATCH below fails so a
        // retry does not re-upload (and orphan another Cloudinary asset).
        setPhotoFile(null);
        setPhotoUrl(nextPhotoUrl);
      }

      const payload = buildPayload(nextPhotoUrl, photoChanged);
      if (Object.keys(payload).length === 0) {
        setErrors({});
        setSuccess("No changes to save.");
        return;
      }

      const updated = await updateEmployee(userNumber, payload);
      // Keep the baseline in sync so a follow-up save doesn't resend fields
      // that were just persisted.
      profileRef.current = {
        ...(profileRef.current || {}),
        ...payload,
        ...(updated && typeof updated === "object" ? updated : {}),
      };
      setErrors({});
      setSuccess("Employee details saved successfully.");
      onSaved?.();
    } catch (err) {
      // Domain errors ({ detail, error_code }) surface their detail message;
      // DRF field errors land under the matching input; everything else on
      // the form banner (SELF_UPDATE_DENIED / ROLE_NOT_FOUND / USER_NOT_FOUND).
      setErrors(
        mapApiErrors(err, {
          fields: {
            first_name: "firstName",
            last_name: "lastName",
            middle_name: "middleName",
            birth_date: "birthdate",
            gender: "gender",
            email: "email",
            contact_number: "phoneNumber",
            region_code: "region",
            province_code: "province",
            city_code: "city",
            barangay_code: "barangay",
            role_id: "roleId",
          },
          codes: {
            SELF_UPDATE_DENIED: "form",
            ROLE_NOT_FOUND: "form",
            USER_NOT_FOUND: "form",
          },
        })
      );
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
          {errors.form && <div className="epm-banner epm-banner-error">{errors.form}</div>}

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
                  className={`epm-input${errors.firstName ? " input-error" : ""}`}
                  type="text"
                  value={firstName}
                  onChange={onFieldChange("firstName", setFirstName)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.firstName && <p className="error-text">{errors.firstName}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-last-name">
                  Last Name {!isView && <span className="epm-required">*</span>}
                </label>
                <input
                  id="epm-last-name"
                  className={`epm-input${errors.lastName ? " input-error" : ""}`}
                  type="text"
                  value={lastName}
                  onChange={onFieldChange("lastName", setLastName)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.lastName && <p className="error-text">{errors.lastName}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-middle-name">Middle Name</label>
                <input
                  id="epm-middle-name"
                  className={`epm-input${errors.middleName ? " input-error" : ""}`}
                  type="text"
                  value={middleName}
                  onChange={onFieldChange("middleName", setMiddleName)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.middleName && <p className="error-text">{errors.middleName}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-birthdate">
                  Birthdate {!isView && <span className="epm-required">*</span>}
                </label>
                <input
                  id="epm-birthdate"
                  className={`epm-input${errors.birthdate ? " input-error" : ""}`}
                  type="date"
                  value={birthdate}
                  onChange={onFieldChange("birthdate", setBirthdate)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.birthdate && <p className="error-text">{errors.birthdate}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-gender">
                  Gender {!isView && <span className="epm-required">*</span>}
                </label>
                <select
                  id="epm-gender"
                  className={`epm-input epm-select${errors.gender ? " input-error" : ""}`}
                  value={gender}
                  onChange={onFieldChange("gender", setGender)}
                  disabled={isView}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.gender && <p className="error-text">{errors.gender}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-email">
                  Email {!isView && <span className="epm-required">*</span>}
                </label>
                <input
                  id="epm-email"
                  className={`epm-input${errors.email ? " input-error" : ""}`}
                  type="email"
                  value={email}
                  onChange={onFieldChange("email", setEmail)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-phone">Phone Number</label>
                <input
                  id="epm-phone"
                  className={`epm-input${errors.phoneNumber ? " input-error" : ""}`}
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  value={phoneNumber}
                  onChange={onFieldChange("phoneNumber", setPhoneNumber)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.phoneNumber && <p className="error-text">{errors.phoneNumber}</p>}
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
                  onChange={onAddressChange(["region", "province", "city", "barangay"], handleRegionChange)}
                  options={regionOptions}
                  placeholder="Search region"
                  disabled={isView}
                  inputClassName={`epm-input${errors.region ? " input-error" : ""}`}
                />
                {errors.region && <p className="error-text">{errors.region}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-province">Province</label>
                <SearchableSelect
                  id="epm-province"
                  value={province}
                  onChange={onAddressChange(["province", "city", "barangay"], handleProvinceChange)}
                  options={provinceOptions}
                  placeholder="Search province"
                  disabled={isView || !canSelectProvince}
                  inputClassName={`epm-input${errors.province ? " input-error" : ""}`}
                />
                {errors.province && <p className="error-text">{errors.province}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-city">City/Municipality</label>
                <SearchableSelect
                  id="epm-city"
                  value={city}
                  onChange={onAddressChange(["city", "barangay"], handleCityChange)}
                  options={cityOptions}
                  placeholder="Search city/municipality"
                  disabled={isView || !canSelectCity}
                  inputClassName={`epm-input${errors.city ? " input-error" : ""}`}
                />
                {errors.city && <p className="error-text">{errors.city}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-barangay">
                  Barangay {!isView && <span className="epm-required">*</span>}
                </label>
                <SearchableSelect
                  id="epm-barangay"
                  value={barangay}
                  onChange={onFieldChangeValue("barangay", setBarangay)}
                  options={barangayOptions}
                  placeholder="Search barangay"
                  disabled={isView || !canSelectBarangay}
                  inputClassName={`epm-input${errors.barangay ? " input-error" : ""}`}
                />
                {errors.barangay && <p className="error-text">{errors.barangay}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-street">Street Address</label>
                <input
                  id="epm-street"
                  className={`epm-input${errors.streetAddress ? " input-error" : ""}`}
                  type="text"
                  placeholder="House no., street"
                  value={streetAddress}
                  onChange={onFieldChange("streetAddress", setStreetAddress)}
                  readOnly={isView}
                  disabled={isView}
                />
                {errors.streetAddress && <p className="error-text">{errors.streetAddress}</p>}
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
                  className={`epm-input epm-select${errors.roleId ? " input-error" : ""}`}
                  value={roleId}
                  onChange={onFieldChange("roleId", setRoleId)}
                  disabled={isView}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.roleId && <p className="error-text">{errors.roleId}</p>}
              </div>

              <div className="epm-field">
                <label className="epm-label" htmlFor="epm-status">
                  Account Status {!isView && <span className="epm-required">*</span>}
                </label>
                <select
                  id="epm-status"
                  className="epm-input epm-select"
                  value={isActive ? "ACTIVE" : "DEACTIVATED"}
                  onChange={(event) => {
                    setIsActive(event.target.value === "ACTIVE");
                    setSuccess("");
                  }}
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
              {success && <div className="epm-banner epm-banner-success">{success}</div>}
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
