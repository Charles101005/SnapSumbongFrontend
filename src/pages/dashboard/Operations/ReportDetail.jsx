import { useEffect, useState } from "react";
import { getReportDetail, getReportHistoryDetail } from "../../../api/reports";
import { formatDueDate, slaBadge } from "../../../utils/sla";
import { PERMISSIONS } from "../../../shared/constants";
import { MOCK_ALL_ACCESS } from "../../../shared/config/env";
import { useAuth } from "../../../context/authContext";
import ReportModerationModal from "./ReportModerationModal";
import TransferReportModal from "./TransferReportModal";
import "./ReportDetail.css";

const STATUS_COLORS = {
  new: "new",
  assigned: "assigned",
  under_review: "under-review",
  on_hold: "on-hold",
  dispatched: "dispatched",
  ongoing: "ongoing",
  resolved: "resolved",
  closed: "closed",
  invalid: "invalid",
};

const normalizeStatus = (status) => String(status || "").toLowerCase().replace(/[\s-]+/g, "_");
const formatDateTime = (value) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /></svg>;
}

export default function ReportDetail({ reportNumber, onClose, onChanged }) {
  const { user: authUser } = useAuth();
  const permissions = authUser?.permissions || [];
  // MOCK_ALL_ACCESS short-circuits the permission check (same as Sidebar).
  const can = (permission) => MOCK_ALL_ACCESS || permissions.includes(permission);
  const canModerate = can(PERMISSIONS.USER_WARN) || can(PERMISSIONS.USER_DEACTIVATE_ANY);
  const canTransfer = can(PERMISSIONS.REPORT_ASSIGN);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [timelineError, setTimelineError] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  const [moderating, setModerating] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError("");
    setTimelineError(false);
    if (!reportNumber) {
      setError("No report was selected.");
      return () => { cancelled = true; };
    }

    Promise.allSettled([getReportDetail(reportNumber), getReportHistoryDetail(reportNumber)])
      .then(([detailResult, historyResult]) => {
        if (cancelled) return;
        if (detailResult.status === "rejected") {
          const err = detailResult.reason;
          setError(err?.detail || err?.message || "Unable to load report.");
          return;
        }

        const history = historyResult.status === "fulfilled" ? historyResult.value : null;
        setReport({
          ...detailResult.value,
          status_timeline: history?.status_timeline || [],
        });
        if (historyResult.status === "rejected") setTimelineError(true);
      });
    return () => { cancelled = true; };
  }, [reportNumber, reloadKey]);

  // Single Escape handler with priority: lightbox -> activity details -> close dialog.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (lightboxSrc) { setLightboxSrc(null); return; }
      if (selectedTimelineEvent) { setSelectedTimelineEvent(null); return; }
      if (moderating) return;
      if (transferring) return;
      onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxSrc, selectedTimelineEvent, moderating, transferring, onClose]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  if (!reportNumber) return null;

  const statusClass = STATUS_COLORS[normalizeStatus(report?.status)] || "unknown";
  const isInvalid = normalizeStatus(report?.status) === "invalid";
  // Phase-4 statuses (Resolved/Closed/Invalid) are finished; only open
  // reports can be transferred to another officer.
  const isClosed = ["resolved", "closed", "invalid"].includes(normalizeStatus(report?.status));
  const sla = report ? slaBadge(report) : null;

  return (
    <div className="report-detail-modal-overlay" onClick={onClose}>
      <section
        className="report-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-detail-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="report-detail-modal-header">
          <h2 className="report-detail-title" id="report-detail-modal-title">
            {report
              ? `Report Details: #${report.report_number}${report.category ? ` – ${report.category}` : ""}`
              : "Report Details"}
          </h2>
          <div className="report-detail-modal-header-actions">
            {report && (
              <button className="report-detail-export" type="button" onClick={() => window.print()}>
                <DownloadIcon />
                Export as PDF
              </button>
            )}
            <button
              className="report-detail-modal-x"
              type="button"
              onClick={onClose}
              aria-label="Close report details"
            >
              &times;
            </button>
          </div>
        </header>

        {error ? (
          <div className="report-detail-modal-message">
            <p>{error}</p>
            <button className="report-detail-close" type="button" onClick={onClose}>Close</button>
          </div>
        ) : !report ? (
          <div className="report-detail-modal-message"><p>Loading report...</p></div>
        ) : (
          <div className="report-detail-modal-body">
            <div className="report-detail-fields">
              <DetailField label="Location" value={report.address || "—"} />
              <DetailField label="Reported Severity" value={report.severity || "—"} />
              <DetailField label="Report ID" value={`#${report.report_number}`} />
              <DetailField label="Category" value={report.category || "—"} />
              <div className="detail-field">
                <label className="detail-field-label">Status</label>
                <div className="detail-field-value">
                  <span className={`report-status-badge status-${statusClass}`}>{report.status || "Unknown"}</span>
                </div>
              </div>
              <DetailField label="Date Reported" value={formatDateTime(report.created_at)} />
              <DetailField label="Assigned To" value={report.assigned_to?.name || "—"} />
              <DetailField label="Validated By (DO 47)" value={report.validated_by_name || "—"} />
              <DetailField label="SLA Due Date (DO 47)" value={formatDueDate(report.due_at)} />
              <div className="detail-field">
                <label className="detail-field-label">SLA State</label>
                <div className="detail-field-value">
                  <span className={`report-sla-badge sla-${sla.tone}`}>{sla.text}</span>
                </div>
              </div>
            </div>

            <section className="report-detail-section">
              <h3 className="detail-field-label">Reporter Comments</h3>
              <p className="reporter-comments-text">{report.description || "No comments provided."}</p>
            </section>

            {report.remarks && (
              <section className="report-detail-section">
                <h3 className="detail-field-label">Officer Remarks</h3>
                <p className="reporter-comments-text">{report.remarks}</p>
              </section>
            )}

            <section className="report-detail-section">
              <h3 className="detail-field-label">Attached Media (DO 47 Photolog)</h3>
              {(() => {
                // Backend detail responses group photos by DO 47 photolog
                // phase; fall back to the flat before-only list for older rows.
                const photos = report.photos || { before: report.image_urls || [], during: [], after: [] };
                const groups = [
                  { key: "before", label: "Before — as reported", urls: photos.before || [] },
                  { key: "during", label: "During — works in progress", urls: photos.during || [] },
                  { key: "after", label: "After — completed rectification", urls: photos.after || [] },
                ];
                const hasAny = groups.some((group) => group.urls.length);
                if (!hasAny) return <p className="report-detail-empty">No attached media.</p>;
                return groups.filter((group) => group.urls.length).map((group) => (
                  <div className="photolog-group" key={group.key}>
                    <h4 className="photolog-group-label">{group.label}</h4>
                    <div className="attached-media-grid">
                      {group.urls.map((src, idx) => (
                        <button
                          key={`${group.key}-${src}-${idx}`}
                          className="media-thumbnail"
                          type="button"
                          onClick={() => setLightboxSrc(src)}
                          aria-label={`View ${group.key} photo ${idx + 1}`}
                        >
                          <img src={src} alt={`${group.key} photolog ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </section>

            <section className="report-detail-timeline-section">
              <h3 className="timeline-heading">Timeline of Status Changes</h3>
              {timelineError ? (
                <p className="report-detail-empty">Unable to load status history.</p>
              ) : report.status_timeline?.length ? (
                <ol className="report-status-timeline">
                  {report.status_timeline.map((step, index) => {
                    const stepStatus = normalizeStatus(step.status);
                    const stepClass = STATUS_COLORS[stepStatus] || "unknown";
                    return (
                      <li className="report-timeline-entry" key={`${step.status}-${step.created_at}-${index}`}>
                        <span className={`timeline-step-number status-step-${stepClass}`}>{index + 1}</span>
                        <span className={`timeline-status-badge status-${stepClass}`}>{step.status}</span>
                        <time dateTime={step.created_at}>{formatDateTime(step.created_at)}</time>
                        {step.performed_by && (
                          <span className="timeline-performed-by">
                            Performed by: {typeof step.performed_by === "object" ? step.performed_by.name : step.performed_by}
                          </span>
                        )}
                        <button
                          className="timeline-view-details"
                          type="button"
                          onClick={() => setSelectedTimelineEvent(step)}
                        >
                          View Details
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="report-detail-empty">No status history has been recorded for this report.</p>
              )}
            </section>
          </div>
        )}

        {report && !error && (
          <footer className="report-detail-footer">
            {canTransfer && !isClosed && (
              <button
                className="report-detail-transfer"
                type="button"
                onClick={() => setTransferring(true)}
              >
                Transfer to officer
              </button>
            )}
            {canModerate && isInvalid && (
              <button
                className="report-detail-moderate"
                type="button"
                onClick={() => setModerating(true)}
              >
                Issue a warning
              </button>
            )}
            <button className="report-detail-close" type="button" onClick={onClose}>Close</button>
          </footer>
        )}

        {moderating && report && (
          <ReportModerationModal
            reportNumber={report.report_number}
            initialAction="warn"
            onClose={() => setModerating(false)}
            onChanged={onChanged}
          />
        )}

        {transferring && report && (
          <TransferReportModal
            report={report}
            onClose={() => setTransferring(false)}
            onChanged={() => {
              setReloadKey((key) => key + 1);
              onChanged?.();
            }}
          />
        )}
      </section>

      {lightboxSrc && (
        <div
          className="report-media-overlay"
          onClick={(event) => { event.stopPropagation(); setLightboxSrc(null); }}
        >
          <button type="button" className="report-media-close" onClick={() => setLightboxSrc(null)} aria-label="Close image">&times;</button>
          <img src={lightboxSrc} alt="Full size report attachment" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {selectedTimelineEvent && (
        <TimelineActivityModal
          event={selectedTimelineEvent}
          reportNumber={report?.report_number}
          onClose={() => setSelectedTimelineEvent(null)}
        />
      )}
    </div>
  );
}

function TimelineActivityModal({ event, reportNumber, onClose }) {
  const performer = typeof event.performed_by === "object"
    ? event.performed_by
    : { name: event.performed_by || "System", role: "" };
  const rawLogId = event.audit_log_number ?? event.audit_log_id;
  const logId = rawLogId
    ? (String(rawLogId).startsWith("LOG-") ? `#${rawLogId}` : `#LOG-${rawLogId}`)
    : "Unavailable";
  const primaryAction = event.primary_action || `Updated report status #${reportNumber}`;

  return (
    <div className="activity-modal-overlay" onClick={(eventClick) => { eventClick.stopPropagation(); onClose(); }}>
      <section
        className="activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <header className="activity-modal-header">
          <div className="activity-modal-heading">
            <span className="activity-modal-icon" aria-hidden="true">i</span>
            <div>
              <h3 id="activity-modal-title">Activity Details</h3>
              <p>Detailed log information for system audit</p>
            </div>
          </div>
          <button className="activity-modal-x" type="button" onClick={onClose} aria-label="Close details">&times;</button>
        </header>

        <div className="activity-modal-content">
          <div className="activity-metadata-grid">
            <ActivityField label="Log ID" value={logId} />
            <div className="activity-field">
              <span className="activity-field-label">Performed By</span>
              <div className="activity-performer">
                <span>{performer.name || "System"}</span>
                {performer.role && <span className="activity-role-badge">{performer.role}</span>}
              </div>
            </div>
            <ActivityField label="Date & Time" value={formatDateTime(event.created_at)} />
            <ActivityField label="Module" value={event.module || "Report Management"} />
          </div>

          <div className="activity-primary-action">
            <span className="activity-field-label">Primary Action</span>
            <strong>{primaryAction}</strong>
          </div>

          <div className="activity-description">
            <span className="activity-field-label">Description</span>
            <p>{event.description || `Status changed to ${event.status || "Unknown"}.`}</p>
          </div>
        </div>

        <footer className="activity-modal-footer">
          <button className="report-detail-close" type="button" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

function ActivityField({ label, value }) {
  return (
    <div className="activity-field">
      <span className="activity-field-label">{label}</span>
      <span className="activity-field-value">{value || "Unavailable"}</span>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div className="detail-field">
      <label className="detail-field-label">{label}</label>
      <div className="detail-field-value">{value}</div>
    </div>
  );
}
