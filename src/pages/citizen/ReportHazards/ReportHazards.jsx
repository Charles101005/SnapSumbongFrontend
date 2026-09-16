import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import PinLocationPage from "../PinLocation/PinLocation";
import SubmitReportModal from "../SubmitReport/SubmitReportModal";
import UploadPhoto from "../UploadPhoto/UploadPhoto";
import MyReport from "../MyReport/MyReport";
import AccountSettings from "../../shared/AccountSettings/AccountSettings";
import CategorySelection from "../CategorySelection/CategorySelection";
import { getHazardCategories, createHazardReport, uploadHazardImageFiles } from "../../../api/reports";
import { getCurrentUser } from "../../../api/accounts";
import { hazardMarkerIcon, reverseGeocode } from "../../../utils/leafletHelpers";
import "./ReportHazards.css";

const DEFAULT_LOCATION = {
  coords: [14.5818, 120.977], // Manila default
  latitude: 14.5818,
  longitude: 120.977,
  address: "Rizal Park, Ermita, Manila, 1000 Metro Manila",
};

const MAX_PHOTOS = 5;
const MAX_CATEGORIES = 3;

export default function HazardReportForm() {
  const navigate = useNavigate();

  // Navigation / View State ('form' | 'pin-location' | 'my-reports' | 'account-settings' | 'category-selection')
  const [currentView, setCurrentView] = useState("form");

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User Profile State
  const [user, setUser] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "",
  });

  // Hazard Category State (fetched from the API)
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Location State
  const [locationData, setLocationData] = useState(DEFAULT_LOCATION);

  // Form Field States
  const [photos, setPhotos] = useState([]); // { file, previewUrl }[]
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]); // up to MAX_CATEGORIES
  const [description, setDescription] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auto-detect (GPS) State
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Dynamic Full Name derived from state
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  // Quick-pick tiles show the first 3 categories; "Others" opens the full grid.
  const quickPickCategories = categories.slice(0, 3);
  const quickPickIds = quickPickCategories.map((cat) => cat.hazard_id);
  const otherSelectedCategories = categories.filter(
    (cat) => selectedCategoryIds.includes(cat.hazard_id) && !quickPickIds.includes(cat.hazard_id)
  );
  const isOtherCategorySelected = otherSelectedCategories.length > 0;

  // --- Load categories and current user on mount ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getHazardCategories();
        if (cancelled) return;
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryIds((prev) => (prev.length > 0 ? prev : [data[0].hazard_id]));
        }
      } catch {
        if (!cancelled) setCategoriesError("Couldn't load hazard categories. Please refresh the page.");
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();

    (async () => {
      try {
        const data = await getCurrentUser();
        if (cancelled) return;
        setUser({
          firstName: data.first_name || "",
          middleName: data.middle_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          role: data.role || "",
        });
      } catch {
        // Not logged in, or session expired — leave the form blank rather than guessing.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Revoke any outstanding photo object URLs when the form unmounts (but not
  // on every ordinary state change — only the true final cleanup).
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => revokePhotos(photosRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Photo Handlers ---
  // Photos use blob object URLs (see UploadPhoto.jsx) — revoke them once
  // we're done with them so the browser can free the underlying memory.
  const revokePhotos = (list) => {
    list.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
  };

  const handleRemovePhoto = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUploadSuccess = (newItems) => {
    setPhotos((prev) => [...prev, ...newItems].slice(0, MAX_PHOTOS));
  };

  // --- Category Click Handler ---
  // Toggles a category on/off, capped at MAX_CATEGORIES.
  const handleCategoryClick = (hazardId) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(hazardId)) {
        return prev.filter((id) => id !== hazardId);
      }
      if (prev.length >= MAX_CATEGORIES) {
        setSubmitError(`You can select up to ${MAX_CATEGORIES} categories.`);
        return prev;
      }
      setSubmitError("");
      return [...prev, hazardId];
    });
  };

  const handleOthersClick = () => {
    setCurrentView("category-selection");
  };

  // --- Auto-detect Handler (real GPS via browser geolocation) ---
  const handleAutoDetect = () => {
    if (!("geolocation" in navigator)) {
      setSubmitError("Geolocation isn't supported on this device. Try Manual Pin instead.");
      return;
    }

    setSubmitError("");
    setIsAutoDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const address = await reverseGeocode(latitude, longitude);

        setLocationData({
          coords: [latitude, longitude],
          latitude,
          longitude,
          address: address || locationData.address,
        });
        setIsAutoDetecting(false);
      },
      () => {
        setSubmitError("Couldn't get your location. Please allow location access or use Manual Pin.");
        setIsAutoDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- Form Actions ---
  const handleCancel = () => {
    if (window.confirm("Discard this hazard report?")) {
      revokePhotos(photos);
      setDescription("");
      setPhotos([]);
      setSelectedCategoryIds(categories[0] ? [categories[0].hazard_id] : []);
      setSubmitError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");

    if (selectedCategoryIds.length === 0) {
      setSubmitError("Please select a hazard category.");
      return;
    }
    if (photos.length === 0) {
      setSubmitError("Please add at least one photo of the hazard.");
      return;
    }
    if (description.trim().length < 5) {
      setSubmitError("Please provide a description of at least 5 characters.");
      return;
    }
    if (!locationData.address || locationData.address.trim().length < 10) {
      setSubmitError("Please pin a location with a valid address.");
      return;
    }

    setIsModalOpen(true);
  };

  const handleFinalSubmit = async (submissionType) => {
    setIsModalOpen(false);
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const imageUrls = await uploadHazardImageFiles(photos.map((p) => p.file));

      const result = await createHazardReport({
        category_ids: selectedCategoryIds,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        description,
        is_anonymous: submissionType === "anonymous",
        image_urls: imageUrls,
      });

      revokePhotos(photos);
      setDescription("");
      setPhotos([]);
      setSelectedCategoryIds(categories[0] ? [categories[0].hazard_id] : []);

      navigate("/report-submitted", {
        state: { referenceNumber: result.report_number },
      });
    } catch (err) {
      setSubmitError(
        err?.detail || "Something went wrong while submitting your report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <div className="app">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
              onClick={() => { setCurrentView("my-reports"); setSidebarOpen(false); }}
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
              onClick={() => { setCurrentView("form"); setSidebarOpen(false); }}
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
            <span className="user-name">{fullName || "Guest"}</span>
            <span className="user-role">{user.role || "Citizen"}</span>
            <button
              className={`account-settings ${currentView === "account-settings" ? "active" : ""}`}
              type="button"
              onClick={() => { setCurrentView("account-settings"); setSidebarOpen(false); }}
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
        {/* Mobile hamburger button */}
        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

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
            categories={categories}
            initialCategoryIds={selectedCategoryIds}
            maxSelections={MAX_CATEGORIES}
            onSelectCategories={(chosenIds) => {
              setSelectedCategoryIds(chosenIds);
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
                      onClick={handleAutoDetect}
                      disabled={isAutoDetecting}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                      </svg>
                      {isAutoDetecting ? "Detecting..." : "Auto-detect"}
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

                {/* Map Preview (real Leaflet map, non-interactive — click to fine-tune) */}
                <div
                  className="map-wrap"
                  onClick={() => setCurrentView("pin-location")}
                >
                  <MapContainer
                    key={`${locationData.coords[0]}-${locationData.coords[1]}`}
                    center={locationData.coords}
                    zoom={16}
                    style={{ width: "100%", height: "100%" }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    boxZoom={false}
                    keyboard={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={locationData.coords} icon={hazardMarkerIcon} />
                  </MapContainer>
                  <div className="map-click-hint">Click to adjust</div>
                </div>
                <p className="map-address-caption">{locationData.address}</p>
              </section>

              {/* 2. Photo Upload */}
              <section className="card">
                <div className="section-title" style={{ marginBottom: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  2. Photo Upload
                  <span className="photo-count-hint">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </div>

                {photos.length === 0 ? (
                  <div
                    className="upload-box"
                    onClick={() => setIsUploadModalOpen(true)}
                    tabIndex="0"
                  >
                    <div className="upload-icon-wrapper">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <span>Add Photo</span>
                  </div>
                ) : (
                  <div className="photo-thumb-grid">
                    {photos.map((photo, index) => (
                      <div className="photo-thumb" key={index}>
                        <img src={photo.previewUrl} alt={`Uploaded hazard ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-photo"
                          onClick={(e) => handleRemovePhoto(e, index)}
                          title="Remove photo"
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    {photos.length < MAX_PHOTOS && (
                      <div
                        className="photo-thumb-add"
                        onClick={() => setIsUploadModalOpen(true)}
                        tabIndex="0"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add</span>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 3. Category Selection */}
              <section className="card">
                <div className="section-title" style={{ marginBottom: "16px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  3. Category Selection
                  <span className="photo-count-hint">
                    {selectedCategoryIds.length}/{MAX_CATEGORIES}
                  </span>
                </div>

                <div className="category-grid">
                  {categoriesLoading ? (
                    <span className="category-loading-state">Loading categories...</span>
                  ) : categoriesError ? (
                    <span className="category-loading-state">{categoriesError}</span>
                  ) : (
                    <>
                      {quickPickCategories.map((cat) => (
                        <div
                          key={cat.hazard_id}
                          className={`category-card ${selectedCategoryIds.includes(cat.hazard_id) ? "selected" : ""}`}
                          onClick={() => handleCategoryClick(cat.hazard_id)}
                          title={cat.description}
                        >
                          <div className="category-icon">
                            <div className="icon-circle-fill"></div>
                          </div>
                          <span>{cat.hazard_name}</span>
                        </div>
                      ))}

                      <div
                        className={`category-card ${isOtherCategorySelected ? "selected" : ""}`}
                        onClick={handleOthersClick}
                      >
                        <div className="category-icon">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </div>
                        <span>
                          {isOtherCategorySelected
                            ? otherSelectedCategories.map((c) => c.hazard_name).join(", ")
                            : "Others"}
                        </span>
                      </div>
                    </>
                  )}
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

              {submitError && <div className="form-error-banner">{submitError}</div>}

              {/* Submit / Cancel Actions */}
              <div className="actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Report"}
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
        existingCount={photos.length}
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