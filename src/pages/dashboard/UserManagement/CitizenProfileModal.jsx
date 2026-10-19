import { useEffect, useRef, useState } from "react";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import ModerationPanel from "../../../components/shared/ModerationPanel";
import { getCitizen, updateCitizen } from "../../../api/users";
import { GENDERS } from "../../../shared/constants";
import { formatDate } from "../../../utils/format";
import { mapApiErrors } from "../../../utils/apiErrors";
import "./CitizenProfileModal.css";

export default function CitizenProfileModal({ userNumber, mode = "view", onClose, onSaved }) {
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
  const [photo, setPhoto] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [role, setRole] = useState("Citizen");
  const [isActive, setIsActive] = useState(true);
  const [createdAt, setCreatedAt] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  // Bumped after a moderation action (via ModerationPanel's onChanged) so the
  // account-status select refreshes with the latest citizen detail.
  const [reloadKey, setReloadKey] = useState(0);
  // First load shows the full-screen spinner; later reloads refresh in place
  // so the moderation panel does not unmount after every action.
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!loadedOnceRef.current) setLoading(true);
      setDetailError("");
      try {
        const detail = await getCitizen(userNumber);
        if (cancelled) return;
        if (!detail || !detail.user_number) {
          setDetailError("Citizen not found.");
          return;
        }
        setFirstName(detail.first_name || "");
        setLastName(detail.last_name || "");
        setMiddleName(detail.middle_name || "");
        setBirthdate(detail.birth_date || "");
        setGender(detail.gender || "");
        setEmail(detail.email || "");
        setPhoneNumber(detail.contact_number || "");
        setPhoto(detail.profile_picture || "");
        setRegion(detail.region_code || "");
        setProvince(detail.province_code || "");
        setCity(detail.city_code || "");
        setBarangay(detail.barangay_code || "");
        setStreetAddress(detail.street_address || "");
        setRole(detail.role || "Citizen");
        setIsActive(detail.is_active !== false);
        setCreatedAt(detail.created_at || "");
      } catch (err) {
        if (cancelled) return;
        setDetailError(err?.detail || "Failed to load citizen. Please try again.");
      } finally {
        loadedOnceRef.current = true;
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userNumber, reloadKey]);

  // Warning history lives in the shared ModerationPanel, which fetches it.

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

  // Address selects are display-only — the API does not accept profile edits
  // for citizens (only is_active), so the cascade just renders the labels.
  const {
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
  } = usePsgcAddress({
    region,
    province,
    city,
    barangay,
    setRegion: () => {},
    setProvince: () => {},
    setCity: () => {},
    setBarangay: () => {},
  });

  const handleSave = async (event) => {
    event.preventDefault();
    if (isView) return;

    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateCitizen(userNumber, { is_active: isActive });
      setSuccess("Account status updated successfully.");
      onSaved?.();
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: { USER_NOT_FOUND: "form" },
      });
      setError(mapped.form || "Failed to update account status. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const modalShell = (content) => (
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
              {isView
                ? "Citizen information (read-only)."
                : "Only the account status can be changed — citizen profile details are self-managed."}
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
        {content}
      </section>
    </div>
  );

  if (loading) {
    return modalShell(<p className="cp-loading">Loading citizen...</p>);
  }

  if (detailError) {
    return modalShell(
      <div className="cp-body">
        <div className="cp-banner cp-banner-error">{detailError}</div>
        <div className="cp-actions">
          <button type="button" className="cp-btn-discard" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalShell(
        <>
          {error && <div className="cp-banner cp-banner-error">{error}</div>}
          {success && <div className="cp-banner cp-banner-success">{success}</div>}

          <form className="cp-form" onSubmit={handleSave} noValidate>
            <div className="cp-form-grid">
              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-user-number">User Number</label>
                <input
                  id="cp-user-number"
                  className="cp-input"
                  type="text"
                  value={userNumber}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-first-name">First Name</label>
                <input
                  id="cp-first-name"
                  className="cp-input"
                  type="text"
                  value={firstName}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-last-name">Last Name</label>
                <input
                  id="cp-last-name"
                  className="cp-input"
                  type="text"
                  value={lastName}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-middle-name">Middle Name</label>
                <input
                  id="cp-middle-name"
                  className="cp-input"
                  type="text"
                  value={middleName}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-birthdate">Birthdate</label>
                <input
                  id="cp-birthdate"
                  className="cp-input"
                  type="date"
                  value={birthdate}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-gender">Gender</label>
                <select
                  id="cp-gender"
                  className="cp-input cp-select"
                  value={gender}
                  disabled
                >
                  <option value="">—</option>
                  {GENDERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-email">Email</label>
                <input
                  id="cp-email"
                  className="cp-input"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-phone">Phone Number</label>
                <input
                  id="cp-phone"
                  className="cp-input"
                  type="tel"
                  value={phoneNumber}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-region">Region</label>
                <SearchableSelect
                  id="cp-region"
                  value={region}
                  onChange={() => {}}
                  options={regionOptions}
                  placeholder="—"
                  disabled
                  inputClassName="cp-input"
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-province">Province</label>
                <SearchableSelect
                  id="cp-province"
                  value={province}
                  onChange={() => {}}
                  options={provinceOptions}
                  placeholder="—"
                  disabled
                  inputClassName="cp-input"
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-city">City/Municipality</label>
                <SearchableSelect
                  id="cp-city"
                  value={city}
                  onChange={() => {}}
                  options={cityOptions}
                  placeholder="—"
                  disabled
                  inputClassName="cp-input"
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-barangay">Barangay</label>
                <SearchableSelect
                  id="cp-barangay"
                  value={barangay}
                  onChange={() => {}}
                  options={barangayOptions}
                  placeholder="—"
                  disabled
                  inputClassName="cp-input"
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-street">Street Address</label>
                <input
                  id="cp-street"
                  className="cp-input"
                  type="text"
                  value={streetAddress}
                  readOnly
                  disabled
                />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-joined-date">Joined Date</label>
                <input id="cp-joined-date" className="cp-input" type="text" value={formatDate(createdAt)} readOnly disabled />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-user-role">User Role</label>
                <input id="cp-user-role" className="cp-input" type="text" value={role} readOnly disabled />
              </div>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-status">Account Status</label>
                <select
                  id="cp-status"
                  className="cp-input cp-select"
                  value={isActive ? "ACTIVE" : "DEACTIVATED"}
                  onChange={(event) => setIsActive(event.target.value === "ACTIVE")}
                  disabled={isView}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>

              {photo && (
                <div className="cp-field">
                  <span className="cp-label">Photo</span>
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

            {/* Sits inside the form so Cancel/Save stay the last elements, but
                its buttons are all type="button"; the onKeyDown guard stops
                Enter in the moderation inputs from submitting the status form
                (buttons/textareas keep their normal keyboard behavior). */}
            <div
              className="cp-moderation-wrap"
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                  event.preventDefault();
                }
              }}
            >
              <ModerationPanel
                userNumber={userNumber}
                onChanged={() => {
                  setReloadKey((key) => key + 1);
                  onSaved?.();
                }}
              />
            </div>

            <div className="cp-actions">
              {isView ? (
                <button type="button" className="cp-btn-discard" onClick={onClose}>Close</button>
              ) : (
                <>
                  <button type="button" className="cp-btn-discard" onClick={onClose}>Cancel</button>
                  <button type="submit" className="cp-btn-save" disabled={saving}>
                    {saving ? "Saving..." : "Save Status"}
                  </button>
                </>
              )}
            </div>
          </form>
        </>
      )}

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
    </>
  );
}
