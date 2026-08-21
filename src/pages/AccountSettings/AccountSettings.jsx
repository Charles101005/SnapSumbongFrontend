import React, { useState } from "react";
import PersonalDetails from "./PersonalDetails";
import ChangePassword from "./ChangePassword";
import DeactivateAccount from "./DeactivateAccount";
import "./AccountSettings.css";

export default function AccountSettings({ user, onUpdateUser }) {
  const [currentView, setCurrentView] = useState("settings"); // 'settings' | 'personal-details' | 'change-password' | 'deactivate'
  const [emailNotifications, setEmailNotifications] = useState(true);

  if (currentView === "personal-details") {
    return (
      <PersonalDetails
        user={user}
        onUpdateUser={onUpdateUser}
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

  const fullName = `${user.firstName} ${user.lastName}`.trim();

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
                <svg viewBox="0 0 24 24" fill="#cfd8dc" width="70%" height="70%">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <button type="button" className="camera-btn" aria-label="Upload Avatar">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <div className="info-grid">
              <div className="info-field">
                <span className="field-label">FULL NAME</span>
                <span className="field-value">{fullName}</span>
              </div>

              <div className="info-field">
                <span className="field-label">EMAIL ADDRESS</span>
                <span className="field-value">{user.email}</span>
              </div>

              <div className="info-field">
                <span className="field-label">PHONE NUMBER</span>
                <span className="field-value">+63 912 345 6789</span>
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
              <div className="setting-desc">Last changed 3 months ago</div>
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
            </div>

            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <span className="checkmark"></span>
            </label>
          </div>
        </section>

        {/* 4. Danger Zone */}
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
                Temporarily hide your profile and reports. You can reactivate anytime.
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
      </div>
    </div>
  );
}