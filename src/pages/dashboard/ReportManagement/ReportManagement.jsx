import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import MapAutoResize from "../../../components/shared/MapAutoResize";
import { hazardMarkerIcon } from "../../../utils/leafletHelpers";
import {
  getReportDetail,
  getReportLookups,
  getReports,
  updateReport,
  uploadResolutionImages,
} from "../../../api/reports";
import "./ReportManagement.css";

const FALLBACK_STATUSES = ["New", "Assigned", "Under Review", "On-Hold", "Dispatched", "Resolved", "Closed"];
const FALLBACK_SEVERITIES = ["P1", "P2", "P3", "P4", "P5"];
const MAX_RESOLUTION_PHOTOS = 5; // Matches the backend's STORAGE_CONFIG['MAX_SIGNATURE_COUNT'].

const STATUS_COLORS = {
  new: { bg: "#e0f2fe", text: "#0369a1" },
  assigned: { bg: "#e0e7ff", text: "#4338ca" },
  under_review: { bg: "#f3e8ff", text: "#7e22ce" },
  on_hold: { bg: "#fef3c7", text: "#b45309" },
  dispatched: { bg: "#cffafe", text: "#0e7490" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  closed: { bg: "#e2e8f0", text: "#334155" },
};
const SEVERITY_COLORS = {
  p1: { bg: "#fee2e2", text: "#dc2626" },
  p2: { bg: "#ffedd5", text: "#c2410c" },
  p3: { bg: "#fef9c3", text: "#a16207" },
  p4: { bg: "#dbeafe", text: "#1d4ed8" },
  p5: { bg: "#dbeafe", text: "#1d4ed8" },
};
const NEUTRAL_COLOR = { bg: "#f1f5f9", text: "#475569" };

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c3cbd6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

const statusValue = (item) => item?.value || item;
const statusLabel = (item) => item?.label || item;
const statusToValue = (status) => String(status || "").toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
const normalizeStatusKey = (label) => String(label || "").toLowerCase().replace(/[\s-]+/g, "_");
const getCoordinates = (report) => {
  if (report?.latitude === null || report?.latitude === undefined || report?.latitude === "" ||
      report?.longitude === null || report?.longitude === undefined || report?.longitude === "") return null;
  const latitude = Number(report.latitude);
  const longitude = Number(report.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [latitude, longitude];
};
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

export default function ReportManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedReport = searchParams.get("report");

  const [lookups, setLookups] = useState({ categories: [], statuses: [], severities: [] });
  const [selectedReportNumber, setSelectedReportNumber] = useState(requestedReport || "");
  const [report, setReport] = useState(null);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [resolutionFiles, setResolutionFiles] = useState([]);
  const [resolutionPreviews, setResolutionPreviews] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [noReports, setNoReports] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Close the lightbox on Escape.
  useEffect(() => {
    if (!lightboxSrc) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxSrc]);

  useEffect(() => {
    if (!mapExpanded) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMapExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mapExpanded]);

  const statuses = useMemo(() => (lookups.statuses?.length ? lookups.statuses : FALLBACK_STATUSES), [lookups.statuses]);
  const severities = useMemo(() => (lookups.severities?.length ? lookups.severities : FALLBACK_SEVERITIES), [lookups.severities]);

  const loadDetail = async (reportNumber) => {
    try {
      setLoadingDetail(true);
      setError("");
      const data = await getReportDetail(reportNumber);
      setReport(data);
      setSeverity(data.severity || "");
      const matchingStatus = (lookups.statuses || []).find(
        (item) => (item.label || item) === data.status || (item.value || item) === data.status
      );
      setStatus(matchingStatus?.value || statusToValue(data.status));
      setRemarks(data.remarks || "");
      setResolutionFiles([]);
      setResolutionPreviews([]);
    } catch (err) {
      setError(err?.detail || err?.message || "Unable to load report details.");
      setReport(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    getReportLookups().then(setLookups).catch(() => {});
  }, []);

  // Pick a report to manage: the one requested via ?report=, or fall back to
  // the first report currently in the queue.
  useEffect(() => {
    (async () => {
      if (requestedReport) {
        setSelectedReportNumber(requestedReport);
        return;
      }
      if (selectedReportNumber) return;
      try {
        setLoadingDetail(true);
        const data = await getReports({ exclude_closed: true, page: 1, page_size: 1 });
        const first = data.results?.[0]?.report_number;
        if (first) {
          setSelectedReportNumber(first);
          setSearchParams({ report: first }, { replace: true });
        } else {
          setNoReports(true);
          setLoadingDetail(false);
        }
      } catch (err) {
        setError(err?.detail || err?.message || "Unable to load reports.");
        setLoadingDetail(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedReport]);

  useEffect(() => {
    if (selectedReportNumber) {
      setNoReports(false);
      loadDetail(selectedReportNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReportNumber]);

  const handlePhotoChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const files = selected.slice(0, MAX_RESOLUTION_PHOTOS);

    if (selected.length > MAX_RESOLUTION_PHOTOS) {
      setError(`You can upload up to ${MAX_RESOLUTION_PHOTOS} resolution photos. Only the first ${MAX_RESOLUTION_PHOTOS} were kept.`);
    } else {
      setError("");
    }

    // Revoke any previously-generated preview URLs before replacing them.
    resolutionPreviews.forEach((src) => URL.revokeObjectURL(src));

    setResolutionFiles(files);
    setResolutionPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSave = async () => {
    if (!report?.report_number) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // The backend rejects a status resubmission that matches the report's
      // current status, and separately rejects remarks/resolution photos sent
      // without an actual status change — so only send what actually changed.
      const currentStatusValue = statusToValue(report.status);
      const statusChanged = status && status !== currentStatusValue;

      const payload = {};
      if (statusChanged) {
        payload.status = status;
        if (remarks) payload.remarks = remarks;
      }

      let resolutionImageUrls;
      if (resolutionFiles.length) {
        resolutionImageUrls = await uploadResolutionImages(resolutionFiles);
      }
      if (statusChanged && resolutionImageUrls) {
        payload.resolution_image_urls = resolutionImageUrls;
      }
      if (severity && severity !== (report.severity || "")) {
        payload.severity = severity;
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes to save — update the status, severity, or remarks first.");
        setSaving(false);
        return;
      }

      const updated = await updateReport(report.report_number, payload);
      setReport((current) => ({ ...current, ...(updated || {}), status, severity, remarks }));
      setSuccess("Report updates saved successfully.");
      await loadDetail(report.report_number);
    } catch (err) {
      setError(err?.detail || err?.message || "Unable to save report updates.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!report) return;
    setSeverity(report.severity || "");
    setStatus(statusToValue(report.status) || "");
    setRemarks(report.remarks || "");
    setResolutionFiles([]);
    setResolutionPreviews([]);
    setError("");
    setSuccess("");
  };

  const activeStatusLabel = useMemo(() => {
    const match = statuses.find((item) => statusValue(item) === status);
    return match ? statusLabel(match) : status;
  }, [statuses, status]);

  const statusColor = STATUS_COLORS[normalizeStatusKey(activeStatusLabel)] || NEUTRAL_COLOR;
  const severityColor = SEVERITY_COLORS[String(severity).toLowerCase()] || NEUTRAL_COLOR;
  const reportCoordinates = getCoordinates(report);

  const shortLocation = report?.address ? report.address.split(",")[0].trim() : "";
  const cardTitle = report ? [report.category, shortLocation].filter(Boolean).join(" - ") : "";

  return (
    <DashboardLayout title="Management Overview">
      <div className="mgmt-card">
        {error && <div className="form-error mgmt-banner">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
        {success && <div className="form-success mgmt-banner">{success}</div>}

        {loadingDetail ? (
          <div className="mgmt-empty">Loading report...</div>
        ) : noReports || !report ? (
          <div className="mgmt-empty">No reports to manage right now.</div>
        ) : (
          <>
            <div className="mgmt-header">
              <div>
                <h2 className="mgmt-title">{cardTitle}</h2>
                <p className="mgmt-date">DATE REPORTED: {formatDate(report.created_at)}</p>
              </div>
              <span className="pill-badge" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>
                {activeStatusLabel}
              </span>
            </div>

            <div className="mgmt-body">
              <div className="mgmt-main-col">
                <span className="mgmt-label">Report Description</span>
                <p className="mgmt-description">{report.description}</p>

                <div className="mgmt-meta-row">
                  <div className="mgmt-meta-item">
                    <span className="mgmt-label">Report ID</span>
                    <span className="mgmt-meta-value mgmt-meta-link">{report.report_number}</span>
                  </div>
                  <div className="mgmt-meta-item">
                    <span className="mgmt-label">Reported By</span>
                    <span className="mgmt-meta-value">{report.reported_by || "—"}</span>
                  </div>
                </div>

                <div className="mgmt-controls-row">
                  <div className="mgmt-field">
                    <span className="mgmt-label">Severity</span>
                    <select
                      className="pill-select"
                      style={{ backgroundColor: severityColor.bg, color: severityColor.text }}
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                    >
                      {severities.map((item) => (
                        <option key={statusValue(item)} value={statusValue(item)}>{statusLabel(item)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mgmt-field">
                    <span className="mgmt-label">Update Status</span>
                    <select
                      className="pill-select"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {statuses.map((item) => (
                        <option key={statusValue(item)} value={statusValue(item)}>{statusLabel(item)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mgmt-image-col">
                <span className="mgmt-label">Original Report</span>
                {report.image_urls?.length ? (
                  <div className="mgmt-image-grid">
                    {report.image_urls.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Original report ${i + 1}`}
                        onClick={() => setLightboxSrc(src)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mgmt-image-frame">
                    <ImageIcon />
                  </div>
                )}
              </div>
            </div>

            <section className="mgmt-location-section" aria-label="Reported location">
              <div className="mgmt-location-details">
                <span className="mgmt-label">Reported Location</span>
                <p className="mgmt-location-address">{report.address || "Address not provided"}</p>
                {reportCoordinates && (
                  <a
                    className="mgmt-map-link"
                    href={`https://www.google.com/maps?q=${reportCoordinates[0]},${reportCoordinates[1]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
              {reportCoordinates ? (
                <div
                  className="mgmt-map-frame"
                  role="button"
                  tabIndex={0}
                  aria-label="Open a larger map of the reported location"
                  onClick={() => setMapExpanded(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setMapExpanded(true);
                    }
                  }}
                >
                  <MapContainer
                    center={reportCoordinates}
                    zoom={16}
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    keyboard={false}
                    zoomControl={false}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={reportCoordinates} icon={hazardMarkerIcon} />
                    <MapAutoResize />
                  </MapContainer>
                </div>
              ) : (
                <p className="mgmt-map-unavailable">Map unavailable: no valid coordinates were provided.</p>
              )}
            </section>

            <div className="mgmt-section">
              <span className="mgmt-label">
                Resolution Photo ({resolutionFiles.length}/{MAX_RESOLUTION_PHOTOS})
              </span>
              <label className="mgmt-dropzone">
                {resolutionPreviews.length ? (
                  <div className="mgmt-preview-row">
                    {resolutionPreviews.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt="Resolution preview"
                        onClick={(e) => {
                          e.preventDefault();
                          setLightboxSrc(src);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <UploadIcon />
                    <span>Click to upload</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="mgmt-section">
              <span className="mgmt-label">Remarks</span>
              <textarea
                className="mgmt-textarea"
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide remarks about the hazard..."
              />
            </div>

            <div className="mgmt-actions">
              <button className="btn-discard-pill" onClick={handleDiscard} disabled={saving}>Discard Changes</button>
              <button className="btn-save-pill" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save All Updates"}</button>
            </div>
          </>
        )}
      </div>

      {mapExpanded && report && reportCoordinates && (
        <div className="mgmt-map-modal-overlay" onClick={() => setMapExpanded(false)}>
          <section
            className="mgmt-map-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mgmt-map-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mgmt-map-modal-header">
              <div>
                <h2 id="mgmt-map-modal-title">Reported Location</h2>
                <p>{report.address || `${reportCoordinates[0]}, ${reportCoordinates[1]}`}</p>
              </div>
              <button
                type="button"
                className="mgmt-map-modal-close"
                onClick={() => setMapExpanded(false)}
                aria-label="Close map"
              >
                &times;
              </button>
            </header>
            <div className="mgmt-map-modal-frame">
              <MapContainer
                center={reportCoordinates}
                zoom={17}
                scrollWheelZoom
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={reportCoordinates} icon={hazardMarkerIcon}>
                  <Popup>{report.address || "Reported location"}</Popup>
                </Marker>
                <MapAutoResize />
              </MapContainer>
            </div>
            <a
              className="mgmt-map-modal-link"
              href={`https://www.google.com/maps?q=${reportCoordinates[0]},${reportCoordinates[1]}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </section>
        </div>
      )}

      {lightboxSrc && (
        <div className="mgmt-lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <button
            className="mgmt-lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
          <img
            src={lightboxSrc}
            alt="Full size preview"
            className="mgmt-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
