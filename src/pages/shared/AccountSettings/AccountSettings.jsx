import { useState, useEffect, useCallback } from "react";
import PersonalDetails from "./PersonalDetails";
import ChangePassword from "./ChangePassword";
import DeactivateAccount from "./DeactivateAccount";
import { getProfile, updateProfile } from "../../../api/accounts";
import { resolveAddressLabels } from "../../../hooks/usePsgcAddress";
import { formatDate } from "../../../utils/format";
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

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [notifyUpdating, setNotifyUpdating] = useState(false);
  const [notifyError, setNotifyError] = useState("");

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      setProfileError("Couldn't load your account details. Please refresh the page.");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Called by PersonalDetails after the user dismisses the save-success
  // popup — merges the fresh profile in here, and syncs the sidebar's
  // cached name via onUpdateUser.
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
    } catch {
      setProfile((prev) => ({ ...prev, is_notified: previous }));
      setNotifyError("Couldn't update your notification preference. Please try again.");
    } finally {
      setNotifyUpdating(false);
    }
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
    return <ChangePassword onBack={() => setCurrentView("settings")} />;
  }

  if (currentView === "deactivate") {
    return <DeactivateAccount onBack={() => setCurrentView("settings")} />;
  }

  if (profileLoading) {
    return (
      <div className="account-settings-container">
        <p className="settings-loading-state">Loading your account...</p>
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

  const addressValue = (label) => label || "Not set";

  return (
    <div className="account-settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="settings-subtitle">
          Manage your identity, security, and notification preferences.
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
                <span className="field-value">{profile.contact_number || "Not set"}</span>
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
                <span className="field-value">{profile.street_address || "Not set"}</span>
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

        {/* 3. Notifications */}
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

        {/* 4. Danger Zone — staff accounts are deactivated by admins via
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
    </div>
  );
}
