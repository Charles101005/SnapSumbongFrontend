import React, { useState } from "react";
import "./PersonalDetails.css";

export default function PersonalDetails({ user, onUpdateUser, onBack }) {
  const [formData, setFormData] = useState({
    lastName: user?.lastName || "Chen",
    firstName: user?.firstName || "Marcus",
    middleName: user?.middleName || "Hue",
    email: user?.email || "marcus.chen@email.com",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdateUser) {
      onUpdateUser(formData);
    }
    if (onBack) onBack();
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
        <form onSubmit={handleSubmit}>
          {/* Profile Photo Section */}
          <section className="photo-section">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="#cfd8dc" width="70%" height="70%">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <button type="button" className="photo-badge-btn" title="Upload Photo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>

            <div className="photo-actions-wrapper">
              <h2 className="section-title">Profile Photo</h2>
              <p className="section-subtitle">
                Update your photo for identification purposes.
              </p>
              <div className="photo-btn-group">
                <button type="button" className="btn-light-blue">
                  Change Photo
                </button>
                <button type="button" className="btn-light-gray">
                  Remove
                </button>
              </div>
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
                />
              </div>
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
                />
              </div>
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
                />
              </div>
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
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}