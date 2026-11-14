import { useState, useEffect } from "react";
import PersonalDetails from "./PersonalDetails";
import ChangePassword from "./ChangePassword";
import DeactivateAccount from "./DeactivateAccount";
import { getProfile, updateProfile } from "../../../api/accounts";
import {
  DEFAULT_FONT_SCALE,
  FONT_SCALE_PERCENT_MAX,
  FONT_SCALE_PERCENT_MIN,
  FONT_SCALE_PERCENT_STEP,
  useFontScale,
} from "../../../context/fontScaleContext";
import { resolveAddressLabels } from "../../../hooks/usePsgcAddress";
import { formatDate } from "../../../utils/format";
import { LEGAL_POLICIES } from "../../legal/policies";
import Toast from "../../../components/shared/Toast";
import "./AccountSettings.css";

// `user`/`onUpdateUser` come from CitizenLayout via outlet context — they're
// the *thin* identity (firstName/lastName/email/role) used by the sidebar.
// This component fetches the *full* profile itself (contact number,
// notification preference, profile picture) and, whenever an edit changes
// something the sidebar also displays, calls onUpdateUser to keep it in sync.
//
// `variant` selects the portal: "citizen" (default) keeps the self-service
// Danger Zone, while "staff" hides it (employee status is managed by admins
// via User Management) and shows a read-only role badge — pass `role` for it.
export default function AccountSettings({ onUpdateUser, variant = "citizen", role }) {
  const isStaff = variant === "staff";
  const [currentView, setCurrentView] = useState("settings"); // 'settings' | 'personal-details' | 'change-password' | 'deactivate'

  // Device-local text size. `scale` is the saved (applied) value; the slider
  // edits `draftScale` so the preview updates instantly while the rest of the
  // app only changes when the user presses Save.
  const { scale, saveScale } = useFontScale();
  const [draftScale, setDraftScale] = useState(scale);
  const scaleIsDirty = draftScale !== scale;
  const draftPercent = Math.round(draftScale * 100);
  // 0 → 1 position of the slider thumb, used to keep the % bubble above it.
  const sliderProgress =
    (draftPercent - FONT_SCALE_PERCENT_MIN) /
    (FONT_SCALE_PERCENT_MAX - FONT_SCALE_PERCENT_MIN);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [notifyUpdating, setNotifyUpdating] = useState(false);
  const [notifyError, setNotifyError] = useState("");

  // Success flash shown as a toast once a sub-view returns to settings.
  const [flash, setFlash] = useState("");

  // Initial load — state updates happen in the async callbacks, with a
  // cancellation guard so a fast unmount doesn't set state.
  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setProfileError("");
      })
      .catch(() => {
        if (cancelled) return;
        setProfileError("Couldn't load your account details. Please refresh the page.");
      })
      .finally(() => {
        if (cancelled) return;
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Called by PersonalDetails after a successful save — merges the fresh
  // profile in here, syncs the sidebar's cached name via onUpdateUser, and
  // returns to the settings view with a success toast.
  const handleProfileSaved = (updatedProfile) => {
    setProfile(updatedProfile);
    if (onUpdateUser) {
      onUpdateUser({
        firstName: updatedProfile.first_name,
        middleName: updatedProfile.middle_name,
        lastName: updatedProfile.last_name,
        email: updatedProfile.email,
        profilePicture: updatedProfile.profile_picture || "",
      });
    }
    setCurrentView("settings");
    setFlash("Profile updated successfully.");
  };

  // Called by ChangePassword after the password change succeeds.
  const handlePasswordSaved = () => {
    setCurrentView("settings");
    setFlash("Password updated. Other sessions have been signed out.");
  };

  // Called by PersonalDetails after the Change Email flow verifies — the
  // user stays on the form (unsaved edits there are preserved), so this
  // only merges the fresh email into the profile and the sidebar cache.
  const handleEmailChanged = (newEmail) => {
    setProfile((prev) => ({ ...prev, email: newEmail }));
    if (onUpdateUser) {
      onUpdateUser({
        firstName: profile.first_name,
        middleName: profile.middle_name,
        lastName: profile.last_name,
        email: newEmail,
        profilePicture: profile.profile_picture || "",
      });
    }
  };

  const handleToggleNotifications = async (checked) => {
    const previous = profile.is_notified;
    setProfile((prev) => ({ ...prev, is_notified: checked }));
    setNotifyUpdating(true);
    setNotifyError("");
    try {
      await updateProfile({ is_notified: checked });
      setFlash("Preference saved.");
    } catch {
      setProfile((prev) => ({ ...prev, is_notified: previous }));
      setNotifyError("Couldn't update your notification preference. Please try again.");
    } finally {
      setNotifyUpdating(false);
    }
  };

  // Persists the device-local text size and confirms it with a toast.
  const handleSaveFontScale = () => {
    if (!scaleIsDirty) return;
    saveScale(draftScale);
    setFlash("Text size saved.");
  };

  if (currentView === "personal-details") {
    return (
      <PersonalDetails
        variant={variant}
        profile={profile}
        onSaved={handleProfileSaved}
        onEmailChanged={handleEmailChanged}
        onBack={() => setCurrentView("settings")}
      />
    );
  }

  if (currentView === "change-password") {
    return (
      <ChangePassword
        onBack={() => setCurrentView("settings")}
        onSaved={handlePasswordSaved}
        identity={{
          email: profile?.email,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
        }}
      />
    );
  }

  if (currentView === "deactivate") {
    return <DeactivateAccount onBack={() => setCurrentView("settings")} />;
  }

  if (profileLoading) {
    return (
      <div className="account-settings-container" role="status" aria-live="polite">
        <span className="sr-only">Loading your account…</span>
        <div className="settings-header">
          <div className="skeleton sk-title" />
          <div className="skeleton sk-subtitle" />
        </div>
        <div className="settings-cards-list" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div className="settings-card skeleton-card" key={index}>
              <div className="card-header">
                <div className="skeleton sk-icon" />
                <div className="skeleton sk-heading" />
              </div>
              <div className="card-body skeleton-body">
                <div className="skeleton sk-line" />
                <div className="skeleton sk-line sk-line-short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="account-settings-container">
        <div className="settings-error-banner">{profileError || "Something went wrong."}</div>
      </div>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  const address = resolveAddressLabels({
    region: profile.region_code,
    province: profile.province_code,
    city: profile.city_code,
    barangay: profile.barangay_code,
  });

  const addressValue = (label) => label || <span className="field-value-empty">Not set</span>;

  // Muted so incomplete fields stand out against filled ones.
  const optionalValue = (value) => value || <span className="field-value-empty">Not set</span>;

  return (
    <div className="account-settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="settings-subtitle">
          Manage your identity, security, and preferences.
        </p>
      </div>

      <div className="settings-cards-list">
        {/* 1. Personal Information */}
        <section className="settings-card">
          <div className="card-header">
            <svg
              className="card-icon blue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <rect x="2" y="2" width="20" height="20" rx="2" strokeOpacity="0.3" />
            </svg>
            <h2>Personal Information</h2>
          </div>

          <div className="card-body personal-info-body">
            <div className="avatar-wrapper">
              <div className="profile-avatar">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="Profile" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="#cfd8dc" width="70%" height="70%">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
            </div>

            <div className="info-grid">
              <div className="info-field">
                <span className="field-label">FULL NAME</span>
                <span className="field-value">
                  {fullName}
                  {isStaff && role && <span className="role-badge">{role}</span>}
                </span>
              </div>

              <div className="info-field">
                <span className="field-label">EMAIL ADDRESS</span>
                <span className="field-value">{profile.email}</span>
              </div>

              <div className="info-field">
                <span className="field-label">PHONE NUMBER</span>
                <span className="field-value">{optionalValue(profile.contact_number)}</span>
              </div>

              <div className="info-field">
                <span className="field-label">JOINED DATE</span>
                <span className="field-value">{formatDate(profile.created_at)}</span>
              </div>

              <div className="info-field">
                <span className="field-label">REGION</span>
                <span className="field-value">{addressValue(address.region)}</span>
              </div>

              <div className="info-field">
                <span className="field-label">PROVINCE</span>
                <span className="field-value">{addressValue(address.province)}</span>
              </div>

              <div className="info-field">
                <span className="field-label">CITY/MUNICIPALITY</span>
                <span className="field-value">{addressValue(address.city)}</span>
              </div>

              <div className="info-field">
                <span className="field-label">BARANGAY</span>
                <span className="field-value">{addressValue(address.barangay)}</span>
              </div>

              <div className="info-field info-field-span">
                <span className="field-label">STREET ADDRESS</span>
                <span className="field-value">{optionalValue(profile.street_address)}</span>
              </div>

              <div className="info-field edit-action-field">
                <button
                  type="button"
                  className="edit-details-btn"
                  onClick={() => setCurrentView("personal-details")}
                >
                  Edit Details
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Security */}
        <section className="settings-card">
          <div className="card-header">
            <svg
              className="card-icon blue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h2>Security</h2>
          </div>

          <div className="card-body row-between">
            <div>
              <div className="setting-title">Password</div>
              <div className="setting-desc">Keep your account secure with a strong password.</div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentView("change-password")}
            >
              Change Password
            </button>
          </div>
        </section>

        {/* 3. Notifications — email alerts are report-related, so this
            section is citizen-only. */}
        {!isStaff && (
          <section className="settings-card">
            <div className="card-header">
              <svg
                className="card-icon blue-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h2>Notifications</h2>
            </div>

            <div className="card-body row-between">
              <div>
                <div className="setting-title">Email Notifications</div>
                <div className="setting-desc">
                  Get notified on your report status changes
                </div>
                {notifyError && <div className="settings-error-banner inline">{notifyError}</div>}
              </div>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={profile.is_notified}
                  disabled={notifyUpdating}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          </section>
        )}

        {/* 4. Appearance — device-local display preference, shared by staff
            and citizens. The slider edits a draft; Save persists it to
            localStorage and applies it app-wide (see FontScaleProvider). */}
        <section className="settings-card">
          <div className="card-header">
            <svg
              className="card-icon blue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <h2>Appearance</h2>
          </div>

          <div className="card-body appearance-body">
            <div>
              <div className="setting-title" id="text-size-label">
                Text Size
              </div>
              <div className="setting-desc">
                Adjust how large text appears across SnapSumbong.
              </div>
            </div>

            <div className="text-size-control">
              <span className="text-size-glyph text-size-glyph-small" aria-hidden="true">
                A
              </span>
              <div
                className="text-size-slider-wrap"
                style={{ "--slider-progress": sliderProgress }}
              >
                <input
                  id="text-size-slider"
                  type="range"
                  className="text-size-slider"
                  min={FONT_SCALE_PERCENT_MIN}
                  max={FONT_SCALE_PERCENT_MAX}
                  step={FONT_SCALE_PERCENT_STEP}
                  value={draftPercent}
                  onChange={(event) => setDraftScale(Number(event.target.value) / 100)}
                  aria-labelledby="text-size-label"
                  aria-valuetext={`${draftPercent}%`}
                />
                <span className="text-size-bubble" aria-hidden="true">
                  {draftPercent}%
                </span>
              </div>
              <span className="text-size-glyph text-size-glyph-large" aria-hidden="true">
                A
              </span>
              <button
                type="button"
                className="text-size-reset"
                onClick={() => setDraftScale(DEFAULT_FONT_SCALE)}
                disabled={draftScale === DEFAULT_FONT_SCALE}
                aria-label="Reset text size to 100%"
                title="Reset to 100%"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <polyline points="3 4 3 10 9 10" />
                </svg>
              </button>
            </div>

            <div className="text-size-preview">
              <span className="text-size-preview-label">Preview</span>
              <p
                className="text-size-preview-line"
                style={{ fontSize: `${16 * draftScale}px` }}
              >
                The quick brown fox jumps over the lazy dog.
              </p>
              <p
                className="text-size-preview-meta"
                style={{ fontSize: `${12 * draftScale}px` }}
              >
                REPORT #SS-2026-00412 &middot; PENDING REVIEW
              </p>
            </div>

            <div className="appearance-footer">
              <span className="setting-desc">Saved on this device only.</span>
              <div className="appearance-actions">
                <button
                  type="button"
                  className="btn-save"
                  onClick={handleSaveFontScale}
                  disabled={!scaleIsDirty}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Legal & Policies — shared by staff and citizens. Each policy
            opens in a new tab so the user keeps their place in Settings. */}
        <section className="settings-card">
          <div className="card-header">
            <svg
              className="card-icon blue-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <h2>Legal &amp; Policies</h2>
          </div>

          <div className="card-body policy-body">
            <p className="policy-intro">
              Review the documents that apply to your use of SnapSumbong.
            </p>
            <ul className="policy-list">
              {LEGAL_POLICIES.map((policy) => (
                <li key={policy.slug}>
                  <a
                    className="policy-link"
                    href={policy.path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="policy-link-text">
                      <span className="policy-link-label">{policy.label}</span>
                      <span className="policy-link-desc">{policy.description}</span>
                    </span>
                    <svg
                      className="policy-link-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Danger Zone — staff accounts are deactivated by admins via
            User Management, so this self-service block is citizen-only. */}
        {!isStaff && (
          <section className="settings-card danger-card">
            <div className="card-header border-danger">
              <svg
                className="card-icon danger-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h2 className="danger-text">Danger Zone</h2>
            </div>

            <div className="card-body row-between">
              <div>
                <div className="setting-title">Deactivate Account</div>
                <div className="setting-desc">
                  Hides your profile and reports. This can't be undone from
                  here — you'll need to contact support to reactivate.
                </div>
              </div>
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => setCurrentView("deactivate")}
              >
                Deactivate
              </button>
            </div>
          </section>
        )}
      </div>

      <Toast message={flash} onDismiss={() => setFlash("")} />
    </div>
  );
}
