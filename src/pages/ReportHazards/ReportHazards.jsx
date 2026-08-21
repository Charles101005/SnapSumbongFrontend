import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PinLocationPage from "../PinLocation/PinLocation";
import SubmitReportModal from "../SubmitReport/SubmitReportModal";
import UploadPhoto from "../UploadPhoto/UploadPhoto";
import MyReport from "../MyReport/MyReport";
import AccountSettings from "../AccountSettings/AccountSettings";
import CategorySelection from "../CategorySelection/CategorySelection";
import "./ReportHazards.css";

export default function HazardReportForm() {
  const navigate = useNavigate();

  // Navigation / View State ('form' | 'pin-location' | 'my-reports' | 'account-settings' | 'category-selection')
  const [currentView, setCurrentView] = useState("form");

  // User Profile State
  const [user, setUser] = useState({
    firstName: "Marcus",
    middleName: "Hue",
    lastName: "Chen",
    email: "marcus.chen@email.com",
    role: "Verified Citizen",
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Location State
  const [locationData, setLocationData] = useState({
    coords: [14.5818, 120.977], // Manila default
    address: "Rizal Park, Ermita, Manila, 1000 Metro Manila",
  });

  // Form Field States
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("pothole");
  const [description, setDescription] = useState("");

  // Dynamic Full Name derived from state
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  // --- Photo Handlers ---
  const handleRemovePhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoPreview(null);
  };

  const handleUploadSuccess = (imageSrc) => {
    setPhotoPreview(imageSrc);
  };

  // --- Category Click Handler ---
  const handleCategoryClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    if (categoryKey === "other") {
      setCurrentView("category-selection");
    }
  };

  // --- Form Actions ---
  const handleCancel = () => {
    if (window.confirm("Discard this hazard report?")) {
      setDescription("");
      setPhotoPreview(null);
      setSelectedCategory("pothole");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleFinalSubmit = (submissionType) => {
    setIsModalOpen(false);

    const refNum = `#HZ - ${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      referenceNumber: refNum,
      category: selectedCategory,
      description,
      hasPhoto: Boolean(photoPreview),
      location: locationData,
      submissionType,
    };

    console.log("Hazard report submitted:", payload);

    setDescription("");
    setPhotoPreview(null);
    setSelectedCategory("pothole");

    navigate("/report-submitted", {
      state: { referenceNumber: refNum },
    });
  };

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span>SnapSumbong</span>
          </div>

          <nav className="nav">
            {/* My Reports Option */}
            <button
              className={`nav-item ${currentView === "my-reports" ? "active" : ""}`}
              type="button"
              onClick={() => setCurrentView("my-reports")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              My Reports
            </button>

            {/* Report Hazard Option */}
            <button
              className={`nav-item ${currentView === "form" || currentView === "pin-location" || currentView === "category-selection" ? "active" : ""}`}
              type="button"
              onClick={() => setCurrentView("form")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Report Hazard
            </button>
          </nav>
        </div>

        <div className="user-card">
          <div className="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="user-meta">
            <span className="user-name">{fullName}</span>
            <span className="user-role">{user.role}</span>
            <button
              className={`account-settings ${currentView === "account-settings" ? "active" : ""}`}
              type="button"
              onClick={() => setCurrentView("account-settings")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Account Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main">
        {currentView === "account-settings" ? (
          <AccountSettings user={user} onUpdateUser={handleUpdateUser} />
        ) : currentView === "my-reports" ? (
          <MyReport />
        ) : currentView === "pin-location" ? (
          <PinLocationPage
            initialLocation={locationData}
            onConfirm={(updatedLocation) => {
              setLocationData(updatedLocation);
              setCurrentView("form");
            }}
            onBack={() => setCurrentView("form")}
          />
        ) : currentView === "category-selection" ? (
          <CategorySelection
            initialCategory={selectedCategory}
            onSelectCategory={(chosenCategoryLabel) => {
              setSelectedCategory(chosenCategoryLabel);
              setCurrentView("form");
            }}
            onBack={() => setCurrentView("form")}
          />
        ) : (
          <>
            <div className="page-header-group">
              <div className="eyebrow">SNAPSUMBONG RESIDENT PORTAL</div>
              <h1>File New Hazard Report</h1>
            </div>

            <form id="hazard-form" onSubmit={handleSubmit}>
              {/* 1. GPS Location Tagging */}
              <section className="card">
                <div className="section-header">
                  <div className="section-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13Z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    1. GPS Location Tagging
                  </div>
                  <div className="map-btn-group">
                    <button
                      type="button"
                      className="pill-btn active"
                      onClick={() => setCurrentView("pin-location")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                      </svg>
                      Auto-detect
                    </button>
                    <button
                      type="button"
                      className="pill-btn"
                      onClick={() => setCurrentView("pin-location")}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 17v5M9 3h6l1 6-4 3-4-3 1-6Z" />
                      </svg>
                      Manual Pin
                    </button>
                  </div>
                </div>

                {/* Map Graphic Preview */}
                <div
                  className="map-wrap"
                  onClick={() => setCurrentView("pin-location")}
                >
                  <img
                    src="https://tile.openstreetmap.org/15/27393/14660.png"
                    alt="Map Preview"
                    className="map-bg-img"
                  />
                  <div className="map-overlay-layer"></div>
                  <div className="map-pin-indicator">
                    <svg viewBox="0 0 24 24" fill="#1d82f5" stroke="#ffffff" strokeWidth="1.5">
                      <path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8Z" />
                      <circle cx="12" cy="8" r="3" fill="#ffffff" />
                    </svg>
                  </div>
                </div>
              </section>

              {/* 2. Photo Upload */}
              <section className="card">
                <div className="section-title" style={{ marginBottom: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  2. Photo Upload
                </div>

                <div
                  className="upload-box"
                  onClick={() => setIsUploadModalOpen(true)}
                  tabIndex="0"
                >
                  {!photoPreview ? (
                    <>
                      <div className="upload-icon-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </div>
                      <span>Add Photo</span>
                    </>
                  ) : (
                    <>
                      <img src={photoPreview} alt="Uploaded hazard" />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={handleRemovePhoto}
                        title="Remove photo"
                      >
                        &times;
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* 3. Category Selection */}
              <section className="card">
                <div className="section-title" style={{ marginBottom: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  3. Category Selection
                </div>

                <div className="category-grid">
                  <div
                    className={`category-card ${selectedCategory === "pothole" ? "selected" : ""}`}
                    onClick={() => handleCategoryClick("pothole")}
                  >
                    <div className="category-icon">
                      <div className="icon-circle-fill"></div>
                    </div>
                    <span>Pothole</span>
                  </div>

                  <div
                    className={`category-card ${selectedCategory === "uneven-roads" ? "selected" : ""}`}
                    onClick={() => handleCategoryClick("uneven-roads")}
                  >
                    <div className="category-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 20L12 4l9 16H3z"></path>
                      </svg>
                    </div>
                    <span>Uneven Roads</span>
                  </div>

                  <div
                    className={`category-card ${selectedCategory === "road-debris" ? "selected" : ""}`}
                    onClick={() => handleCategoryClick("road-debris")}
                  >
                    <div className="category-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    </div>
                    <span>Road Debris</span>
                  </div>

                  <div
                    className={`category-card ${selectedCategory === "other" || !["pothole", "uneven-roads", "road-debris"].includes(selectedCategory) ? "selected" : ""}`}
                    onClick={() => handleCategoryClick("other")}
                  >
                    <div className="category-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </div>
                    <span>
                      {["pothole", "uneven-roads", "road-debris"].includes(selectedCategory)
                        ? "Others"
                        : selectedCategory}
                    </span>
                  </div>
                </div>
              </section>

              {/* 4. Description Box */}
              <section className="card">
                <div className="section-title" style={{ marginBottom: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  4. Description Box
                </div>
                <textarea
                  id="description"
                  placeholder="Provide more context about the hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </section>

              {/* Submit / Cancel Actions */}
              <div className="actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Report
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {/* Upload Photo Modal */}
      <UploadPhoto
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Submit Report Modal */}
      <SubmitReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleFinalSubmit}
        userName={fullName}
      />
    </div>
  );
}