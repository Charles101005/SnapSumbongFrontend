import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapAutoResize from "../../../components/shared/MapAutoResize";
import { hazardMarkerIcon } from "../../../utils/leafletHelpers";
import { getReportDetail, updateReport, uploadResolutionImages } from "../../../api/reports";
import "./ReportManagementModal.css";

const FALLBACK_STATUSES = ["New", "Assigned", "Under Review", "On-Hold", "Dispatched", "Ongoing", "Resolved", "Closed", "Invalid"];
const FALLBACK_SEVERITIES = ["P1", "P2", "P3", "P4", "P5"];
// Invalid is a triage verdict only offered once the report has reached
// Under Review (the stage after Assigned); later stages keep it.
const INVALID_VISIBLE_AFTER = ["UNDER_REVIEW", "ON_HOLD", "DISPATCHED", "RESOLVED", "CLOSED", "INVALID"];
// Assigned has exactly one next stage: Under Review. The dropdown must
// offer nothing else — not even if next_expected_statuses is missing and
// the full-list fallback kicks in.
const ASSIGNED_NEXT_STATUSES = ["UNDER_REVIEW"];
const MAX_RESOLUTION_PHOTOS = 5; // Matches the backend's STORAGE_CONFIG['MAX_SIGNATURE_COUNT'] (combined DURING + AFTER).

const STATUS_COLORS = {
  new: { bg: "#e0f2fe", text: "#0369a1" },
  assigned: { bg: "#e0e7ff", text: "#4338ca" },
  under_review: { bg: "#f3e8ff", text: "#7e22ce" },
  on_hold: { bg: "#fef3c7", text: "#b45309" },
  dispatched: { bg: "#cffafe", text: "#0e7490" },
  ongoing: { bg: "#dbeafe", text: "#1d4ed4" },
  resolved: { bg: "#dcfce7", text: "#15803d" },
  closed: { bg: "#e2e8f0", text: "#334155" },
  invalid: { bg: "#ffe4e6", text: "#9f1239" },
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

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Inline field-level validation alert (red border, light red background,
// warning icon) shown directly above the field it applies to — the only
// feedback for status-dependent save rules (no top banner). The success
// variant (green border, light green background, check icon) sits directly
// above the Save All Updates button after a successful save.
function FieldAlert({ message, className, variant = "error" }) {
  const classes = ["mgmt-field-alert"];
  if (variant === "success") classes.push("mgmt-field-alert--success");
  if (className) classes.push(className);
  return (
    <div className={classes.join(" ")} role={variant === "success" ? "status" : "alert"}>
      {variant === "success" ? <CheckCircleIcon /> : <WarningIcon />}
      <span>{message}</span>
    </div>
  );
}

const statusValue = (item) => item?.value || item;
const statusLabel = (item) => item?.label || item;
const statusToValue = (status) => String(status || "").toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
const normalizeStatusKey = (label) => String(label || "").toLowerCase().replace(/[\s-]+/g, "_");
// The current category as a select value (string hazard_id): prefers the
// raw category_id, falls back to reverse-mapping the display name against
// the lookup list when the backend predates category_id in the detail payload.
const resolveCategoryId = (reportData, categoryList) => {
  if (!reportData) return "";
  if (reportData.category_id !== undefined && reportData.category_id !== null) {
    return String(reportData.category_id);
  }
  const byName = (categoryList || []).find((item) => item.hazard_name === reportData.category);
  return byName ? String(byName.hazard_id) : "";
};
// Preview of the recalculated DO 47 deadline for a picked category — strict
// rule: due = created_at + response_time_days, which may already be in the
// past (the report flips Overdue on save). Called from event handlers only,
// never during render (Date.now is impure). Null when data is unavailable
// or the new deadline is still ahead.
const computeSlaPreview = (reportData, pickedId, categoryList) => {
  if (!reportData?.created_at) return null;
  const option = (categoryList || []).find(
    (item) => String(item.hazard_id) === String(pickedId)
  );
  const days = Number(option?.response_time_days);
  if (!Number.isFinite(days)) return null;
  const due = new Date(new Date(reportData.created_at).getTime() + days * 86400000);
  if (Number.isNaN(due.getTime()) || due.getTime() >= Date.now()) return null;
  return { days, due };
};
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

export default function ReportManagementModal({ reportNumber, lookups, onClose, onSaved }) {
  const [report, setReport] = useState(null);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  // Corrected hazard category — the hazard_id of the picked option as a
  // string (select values are strings). Only submitted when it differs from
  // the report's current category.
  const [category, setCategory] = useState("");
  // DO 47 §2: required name of the technical personnel who validated the
  // completed works — sent as validated_by_name when resolving.
  const [validatorName, setValidatorName] = useState("");
  // DO 47 photolog: separate DURING (works in progress) and AFTER (completed)
  // photo sets — both are required before a report can be marked Resolved.
  const [duringFiles, setDuringFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [duringPreviews, setDuringPreviews] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Inline field-level validation for status-dependent save rules — shown
  // directly above the field each rule applies to instead of the top
  // banner, mirroring the backend's domain-error messages.
  const [severityError, setSeverityError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  // SLA consequence of the currently-picked category (null = deadline still
  // ahead or data unavailable) — recomputed in the category onChange handler.
  const [categorySlaPreview, setCategorySlaPreview] = useState(null);
  const [photosError, setPhotosError] = useState("");
  const [validatorError, setValidatorError] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Reset display state when the dialog switches to a different report —
  // React's "adjusting state when a prop changes" pattern (same as
  // OperationsDashboard), which keeps the reset out of an effect.
  const [loadedNumber, setLoadedNumber] = useState(null);
  if (loadedNumber !== reportNumber) {
    setLoadedNumber(reportNumber);
    setReport(null);
    setSuccess("");
    setError("");
    setSeverityError("");
    setStatusError("");
    setCategoryError("");
    setPhotosError("");
    setValidatorError("");
    setRemarksError("");
    setCategory("");
    setCategorySlaPreview(null);
    setLoadingDetail(Boolean(reportNumber));
  }

  const statuses = lookups?.statuses?.length ? lookups.statuses : FALLBACK_STATUSES;
  const severities = lookups?.severities?.length ? lookups.severities : FALLBACK_SEVERITIES;
  const categories = lookups?.categories || [];

  const duringPreviewsRef = useRef([]);
  const afterPreviewsRef = useRef([]);
  useEffect(() => { duringPreviewsRef.current = duringPreviews; }, [duringPreviews]);
  useEffect(() => { afterPreviewsRef.current = afterPreviews; }, [afterPreviews]);
  // Revoke generated preview URLs when the modal unmounts (closing the dialog).
  useEffect(() => () => {
    duringPreviewsRef.current.forEach((src) => URL.revokeObjectURL(src));
    afterPreviewsRef.current.forEach((src) => URL.revokeObjectURL(src));
  }, []);

  // Single Escape handler with priority: lightbox -> expanded map -> close modal.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (lightboxSrc) { setLightboxSrc(null); return; }
      if (mapExpanded) { setMapExpanded(false); return; }
      onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxSrc, mapExpanded, onClose]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Monotonic request id so a stale response can never overwrite the report
  // currently shown (rapid Edit clicks / StrictMode double-invoked effects).
  // Promise-chain (not async/await) so the react-hooks set-state-in-effect
  // rule does not trace the setState calls back into the load effect below —
  // same shape as getReportLookups().then(...) elsewhere in this codebase.
  const loadRequestRef = useRef(0);
  const loadDetail = (number) => {
    const requestId = ++loadRequestRef.current;
    return getReportDetail(number)
      .then((data) => {
        if (requestId !== loadRequestRef.current) return;
        setReport(data);
        setSeverity(data.severity || "");
        const matchingStatus = (lookups?.statuses || []).find(
          (item) => (item.label || item) === data.status || (item.value || item) === data.status
        );
        setStatus(matchingStatus?.value || statusToValue(data.status));
        setRemarks(data.remarks || "");
        // Preselect the current category (category_id, or name-mapped
        // against the lookup list when the payload predates category_id).
        setCategory(resolveCategoryId(data, lookups?.categories));
        setCategorySlaPreview(null);
        setValidatorName("");
        setDuringFiles([]);
        setAfterFiles([]);
        setDuringPreviews([]);
        setAfterPreviews([]);
        setError("");
        setSeverityError("");
        setStatusError("");
        setCategoryError("");
        setPhotosError("");
        setValidatorError("");
        setRemarksError("");
        setLoadingDetail(false);
      })
      .catch((err) => {
        if (requestId !== loadRequestRef.current) return;
        setError(err?.detail || err?.message || "Unable to load report details.");
        setReport(null);
        setLoadingDetail(false);
      });
  };

  // Load the requested report whenever the dialog opens for a different one.
  useEffect(() => {
    if (!reportNumber) return;
    loadDetail(reportNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportNumber]);

  const handlePhotoChange = (phase) => (event) => {
    const selected = Array.from(event.target.files || []);
    const otherCount = phase === "DURING" ? afterFiles.length : duringFiles.length;
    const remaining = Math.max(0, MAX_RESOLUTION_PHOTOS - otherCount);
    const files = selected.slice(0, remaining);

    if (selected.length > remaining) {
      setPhotosError(`DURING and AFTER photos are limited to ${MAX_RESOLUTION_PHOTOS} combined. Only the first ${files.length} were kept.`);
    } else {
      setPhotosError("");
    }
    setError("");
    setSuccess("");

    // Revoke any previously-generated preview URLs before replacing them.
    const setFiles = phase === "DURING" ? setDuringFiles : setAfterFiles;
    const setPreviews = phase === "DURING" ? setDuringPreviews : setAfterPreviews;
    const previousPreviews = phase === "DURING" ? duringPreviews : afterPreviews;
    previousPreviews.forEach((src) => URL.revokeObjectURL(src));

    setFiles(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
    // Allow re-selecting the same file after a discard.
    event.target.value = "";
  };

  // The backend only accepts a category correction while the report sits in
  // Under Review — the verification stage where a misclassified citizen
  // submission gets caught. The gate reads the report's CURRENT status (what
  // the server validates against before applying any transition), not the
  // dropdown's pending choice.
  const originalCategoryId = resolveCategoryId(report, categories);
  const categoryEditable = statusToValue(report?.status) === "UNDER_REVIEW";
  const categoryChanged = Boolean(category) && category !== originalCategoryId;

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
      const resolving = statusChanged && status === "RESOLVED";

      // DO 47 photolog: resolving requires at least one DURING and one AFTER
      // photo — mirror the backend's domain errors inline at the photolog.
      if (resolving && (!duringFiles.length || !afterFiles.length)) {
        setError("");
        if (!duringFiles.length && !afterFiles.length) {
          setPhotosError("Resolution images are required when transitioning to resolved status.");
        } else if (!duringFiles.length) {
          setPhotosError("The photolog requires at least one 'During' photo of the rectification works.");
        } else {
          setPhotosError("The photolog requires at least one 'After' photo of the completed rectification.");
        }
        setSaving(false);
        return;
      }

      // DO 47 §2: resolving requires the declared name of the technical
      // personnel who validated the completed works (ValidatorNameRequiredError).
      if (resolving && !validatorName.trim()) {
        setError("");
        setValidatorError("The name of the DO 47 validator is required when transitioning to resolved status.");
        setSaving(false);
        return;
      }

      // Flagging a report as Invalid (false/troll report) is only legal once
      // the report has reached Under Review (after Assigned).
      const invalidating = statusChanged && status === "INVALID";
      if (invalidating && !INVALID_VISIBLE_AFTER.includes(currentStatusValue)) {
        setError("");
        setStatusError("A report can only be flagged Invalid after it has reached Under Review (after Assigned).");
        setSaving(false);
        return;
      }

      // The backend (MandatoryRemarksStatusError) requires a detailed remark
      // when moving a report to On-Hold, Closed, or Invalid — surface that
      // as a single inline alert above the Remarks field.
      const remarksMandatory = statusChanged && ["ON_HOLD", "CLOSED", "INVALID"].includes(status);
      if (remarksMandatory && !remarks.trim()) {
        setError("");
        setRemarksError("A detailed remark is required when moving a report to this status.");
        setSaving(false);
        return;
      }

      // A category correction is a remark-driven fix: the officer must state
      // why the citizen's pick is being overridden (mirrors the backend's
      // MandatoryCategoryRemarksError) — shown above the Remarks field.
      if (categoryChanged && !remarks.trim()) {
        setError("");
        setRemarksError("A detailed remark is required when changing the hazard category.");
        setSaving(false);
        return;
      }

      // Severity is the triage verdict made during verification — it is
      // picked while the report sits in Under Review and must exist before
      // the report advances to On-Hold or Dispatched (flagging Invalid
      // stays exempt: that is a moderation verdict, not a triage one).
      const leavingReview =
        currentStatusValue === "UNDER_REVIEW" &&
        statusChanged &&
        ["ON_HOLD", "DISPATCHED"].includes(status);
      if (leavingReview && !(severity || report?.severity)) {
        setError("");
        setSeverityError("Set the severity (P1-P5) before moving this report out of Under Review.");
        setSaving(false);
        return;
      }

      const payload = {};
      if (statusChanged) {
        payload.status = status;
        if (remarks) payload.remarks = remarks;
        if (resolving) payload.validated_by_name = validatorName.trim();
      }

      let resolutionImages;
      // Photos are only sent on the -> Resolved transition; stale selections
      // left over from an earlier status choice must never ride along.
      if (resolving && (duringFiles.length || afterFiles.length)) {
        const [duringUrls, afterUrls] = await Promise.all([
          duringFiles.length ? uploadResolutionImages(duringFiles) : [],
          afterFiles.length ? uploadResolutionImages(afterFiles) : [],
        ]);
        resolutionImages = [
          ...duringUrls.map((image_url) => ({ image_url, photo_type: "DURING" })),
          ...afterUrls.map((image_url) => ({ image_url, photo_type: "AFTER" })),
        ];
      }
      if (statusChanged && resolutionImages) {
        payload.resolution_images = resolutionImages;
      }
      if (severity && severity !== (report.severity || "")) {
        payload.severity = severity;
      }
      // Category-only saves are legal (no status change), but always carry
      // the remark explaining the correction — the backend requires it.
      if (categoryChanged) {
        payload.category_id = Number(category);
        if (remarks) payload.remarks = remarks;
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes to save — update the category, status, severity, or remarks first.");
        setSaving(false);
        return;
      }

      const updated = await updateReport(report.report_number, payload);
      setReport((current) => ({ ...current, ...(updated || {}), status, severity, remarks }));
      setSuccess("Report updates saved successfully.");
      await loadDetail(report.report_number);
      onSaved?.();
    } catch (err) {
      // The category gate can race (report advanced since the modal opened) —
      // surface that under the category field instead of the top banner.
      if (err?.error_code === "CATEGORY_CHANGE_NOT_PERMITTED") {
        setCategoryError(err.detail || "The hazard category can only be changed while the report is Under Review.");
        setError("");
      } else {
        setError(err?.detail || err?.message || "Unable to save report updates.");
      }
    } finally {
      setSaving(false);
    }
  };

  const activeStatusLabel = useMemo(() => {
    const match = statuses.find((item) => statusValue(item) === status);
    return match ? statusLabel(match) : status;
  }, [statuses, status]);

  // UI transition matrix: the dropdown offers only the report's current
  // status plus the backend's next_expected_statuses (e.g. Under Review
  // can go On-Hold or Dispatched; Closed is only reachable from On-Hold
  // or Resolved). Falls back to the full list when the field is absent.
  const statusOptions = useMemo(() => {
    const currentValue = statusToValue(report?.status);
    if (currentValue === "ASSIGNED") {
      const assignedFlow = ["ASSIGNED", ...ASSIGNED_NEXT_STATUSES];
      return statuses.filter((item) => assignedFlow.includes(statusValue(item)));
    }
    const invalidAllowed = INVALID_VISIBLE_AFTER.includes(currentValue);
    const hideInvalid = (item) => statusValue(item) === "INVALID" && !invalidAllowed;
    const nextLabels = report?.next_expected_statuses;
    if (!Array.isArray(nextLabels)) return statuses.filter((item) => !hideInvalid(item));
    const currentOption =
      statuses.find((item) => statusValue(item) === currentValue) ||
      { value: currentValue, label: report?.status || currentValue };
    const nextOptions = nextLabels
      .map((label) => {
        const value = statusToValue(label);
        return statuses.find((item) => statusValue(item) === value) || { value, label };
      })
      .filter((item) => statusValue(item) !== currentValue && !hideInvalid(item));
    return [currentOption, ...nextOptions];
  }, [report, statuses]);

  const statusColor = STATUS_COLORS[normalizeStatusKey(activeStatusLabel)] || NEUTRAL_COLOR;
  const severityColor = SEVERITY_COLORS[String(severity).toLowerCase()] || NEUTRAL_COLOR;
  const reportCoordinates = getCoordinates(report);

  // The DO 47 photolog (DURING + AFTER) and the validator name are only
  // legal when the update transitions the report into Resolved — the
  // backend rejects resolution images on any other status change (e.g.
  // On-Hold transfers, staff force-closes).
  const isResolvingTransition = status === "RESOLVED" && statusToValue(report?.status) !== "RESOLVED";

  const shortLocation = report?.address ? report.address.split(",")[0].trim() : "";
  const cardTitle = report ? [report.category, shortLocation].filter(Boolean).join(" - ") : "";

  if (!reportNumber) return null;

  return (
    <div className="mgmt-modal-overlay" onClick={onClose}>
      <section
        className="mgmt-card mgmt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mgmt-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mgmt-modal-header">
          <h2 id="mgmt-modal-title" className="mgmt-modal-heading">Manage Report</h2>
          <button
            type="button"
            className="mgmt-modal-close"
            onClick={onClose}
            aria-label="Close report management"
          >
            &times;
          </button>
        </header>

        {loadingDetail ? (
          <div className="mgmt-empty">Loading report...</div>
        ) : !report ? (
          <div className="mgmt-empty">
            <FieldAlert message={typeof error === "string" && error ? error : "Report not available."} />
          </div>
        ) : (
          <>
            <div className="mgmt-header">
              <div>
                <h3 className="mgmt-title">{cardTitle}</h3>
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

                <div className="mgmt-field mgmt-field--category">
                  <span className="mgmt-label">Hazard Category</span>
                  {categoryError && <FieldAlert message={categoryError} />}
                  {categoryEditable ? (
                    <>
                      <select
                        className="mgmt-category-select"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setCategorySlaPreview(computeSlaPreview(report, e.target.value, categories));
                          setCategoryError("");
                          setError("");
                          setSuccess("");
                        }}
                        aria-invalid={Boolean(categoryError)}
                      >
                        {!category && (
                          <option value="" disabled>Select category...</option>
                        )}
                        {categories.map((item) => (
                          <option key={item.hazard_id} value={String(item.hazard_id)}>
                            {item.hazard_name}
                          </option>
                        ))}
                      </select>
                      {categoryChanged && !remarks.trim() && (
                        <p className="mgmt-validation-hint">
                          A remark is required — explain why the citizen's category
                          is being corrected (see Remarks below).
                        </p>
                      )}
                      {categoryChanged && categorySlaPreview && (
                        <p className="mgmt-validation-hint">
                          New deadline: {formatDate(categorySlaPreview.due)} — already
                          past. This report will be marked Overdue as soon as you save.
                        </p>
                      )}
                      {!categoryChanged && (
                        <p className="mgmt-info-hint">
                          Corrects the citizen's pick — the SLA due date is recalculated
                          from the report date, and the change is recorded in the audit trail.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="mgmt-category-readonly">
                        {report.category || "—"}
                      </span>
                      <p className="mgmt-info-hint">
                        The hazard category can only be changed while the report
                        is Under Review.
                      </p>
                    </>
                  )}
                </div>

                <div className="mgmt-controls-row">
                  <div className="mgmt-field">
                    <span className="mgmt-label">Severity</span>
                    {severityError && <FieldAlert message={severityError} />}
                    <select
                      className="pill-select"
                      style={{ backgroundColor: severityColor.bg, color: severityColor.text }}
                      value={severity}
                      onChange={(e) => { setSeverity(e.target.value); setSeverityError(""); setError(""); setSuccess(""); }}
                      aria-invalid={Boolean(severityError)}
                    >
                      {!severity && (
                        <option value="" disabled>Select severity...</option>
                      )}
                      {severities.map((item) => (
                        <option key={statusValue(item)} value={statusValue(item)}>{statusLabel(item)}</option>
                      ))}
                    </select>
                    {statusToValue(report.status) === "ASSIGNED" && !(severity || report?.severity) && (
                      <p className="mgmt-info-hint">
                        Optional here — severity is decided during Under Review.
                      </p>
                    )}
                    {statusToValue(report.status) === "UNDER_REVIEW" &&
                      ["ON_HOLD", "DISPATCHED"].includes(status) &&
                      !(severity || report?.severity) && (
                      <p className="mgmt-validation-hint">
                        Under Review requires a severity — select P1-P5 before moving to the next status.
                      </p>
                    )}
                  </div>
                  <div className="mgmt-field">
                    <span className="mgmt-label">Update Status</span>
                    {statusError && <FieldAlert message={statusError} />}
                    <select
                      className="pill-select"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      value={status}
                      onChange={(e) => {
                        // Every save rule depends on the chosen status —
                        // switching it clears all inline feedback.
                        setStatus(e.target.value);
                        setSeverityError("");
                        setStatusError("");
                        setCategoryError("");
                        setPhotosError("");
                        setValidatorError("");
                        setRemarksError("");
                        setError("");
                        setSuccess("");
                      }}
                      aria-invalid={Boolean(statusError)}
                    >
                      {statusOptions.map((item) => (
                        <option key={statusValue(item)} value={statusValue(item)}>{statusLabel(item)}</option>
                      ))}
                    </select>
                    {status === "CLOSED" && statusToValue(report.status) !== "CLOSED" && (
                      <p className="mgmt-validation-hint">
                        Closing requires a remark — state the reason (e.g., not under
                        DO 47 jurisdiction, referred to another office). If the works
                        were done, leave it Resolved so the reporter can confirm.
                      </p>
                    )}
                    {status === "INVALID" && statusToValue(report.status) !== "INVALID" && (
                      <p className="mgmt-validation-hint">
                        Marking a report Invalid flags it as false or not a valid
                        hazard report — a remark is required, the report is excluded
                        from closed/overdue counts, and it can be cited as evidence
                        when warning or banning the reporter.
                      </p>
                    )}
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

            {isResolvingTransition && (
              <div className="mgmt-photolog-row">
                {photosError && <FieldAlert message={photosError} className="mgmt-field-alert--grid" />}
                <div className="mgmt-section mgmt-photolog-phase">
                  <span className="mgmt-label">
                    During Photo — works in progress ({duringFiles.length})
                  </span>
                  <label className="mgmt-dropzone">
                    {duringPreviews.length ? (
                      <div className="mgmt-preview-row">
                        {duringPreviews.map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt="During works preview"
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
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange("DURING")} />
                  </label>
                </div>

                <div className="mgmt-section mgmt-photolog-phase">
                  <span className="mgmt-label">
                    After Photo — completed work ({afterFiles.length})
                  </span>
                  <label className="mgmt-dropzone">
                    {afterPreviews.length ? (
                      <div className="mgmt-preview-row">
                        {afterPreviews.map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt="After works preview"
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
                    <input type="file" accept="image/*" multiple onChange={handlePhotoChange("AFTER")} />
                  </label>
                </div>
              </div>
            )}

            {isResolvingTransition && (
              <div className="mgmt-section">
                <span className="mgmt-label">DO 47 Validator Name *</span>
                {validatorError && <FieldAlert message={validatorError} />}
                <input
                  className="mgmt-input"
                  type="text"
                  value={validatorName}
                  onChange={(e) => { setValidatorName(e.target.value); setValidatorError(""); setError(""); setSuccess(""); }}
                  placeholder="Name of the technical personnel who validated the completed works"
                  aria-invalid={Boolean(validatorError)}
                />
                <p className="mgmt-validation-hint">
                  Required when marking a report Resolved — record who validated
                  the rectification works (DO 47 §2).
                </p>
              </div>
            )}

            <div className="mgmt-section">
              <span className="mgmt-label">Remarks</span>
              {remarksError && <FieldAlert message={remarksError} />}
              <textarea
                className="mgmt-textarea"
                rows="4"
                value={remarks}
                onChange={(e) => { setRemarks(e.target.value); setRemarksError(""); setError(""); setSuccess(""); }}
                placeholder="Provide remarks about the hazard..."
                aria-invalid={Boolean(remarksError)}
              />
            </div>

            {error && <FieldAlert message={typeof error === "string" ? error : JSON.stringify(error)} />}
            {success && <FieldAlert message={success} variant="success" />}
            <div className="mgmt-actions">
              <button className="btn-discard-pill" onClick={onClose} disabled={saving}>Close</button>
              <button className="btn-save-pill" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save All Updates"}</button>
            </div>
          </>
        )}
      </section>

      {mapExpanded && report && reportCoordinates && (
        <div
          className="mgmt-map-modal-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setMapExpanded(false);
          }}
        >
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
                onClick={(event) => {
                  event.stopPropagation();
                  setMapExpanded(false);
                }}
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
        <div
          className="mgmt-lightbox-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setLightboxSrc(null);
          }}
        >
          <button
            className="mgmt-lightbox-close"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxSrc(null);
            }}
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
    </div>
  );
}
