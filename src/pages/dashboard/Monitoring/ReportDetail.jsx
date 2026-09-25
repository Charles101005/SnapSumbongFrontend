import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReportDetail, getReportHistoryDetail } from "../../../api/reports";
import "./ReportDetail.css";

const STATUS_COLORS = {
  new: "new",
  assigned: "assigned",
  under_review: "under-review",
  on_hold: "on-hold",
  dispatched: "dispatched",
  resolved: "resolved",
  closed: "closed",
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

export default function ReportDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get("report");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [timelineError, setTimelineError] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);
  const goBack = () => navigate("/dashboard/monitoring/history");

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError("");
    setTimelineError(false);
    if (!reportId) {
      setError("No report was selected.");
      return () => { cancelled = true; };
    }

    Promise.allSettled([getReportDetail(reportId), getReportHistoryDetail(reportId)])
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
  }, [reportId]);

  useEffect(() => {
    if (!lightboxSrc && !selectedTimelineEvent) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxSrc(null);
        setSelectedTimelineEvent(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxSrc, selectedTimelineEvent]);

  const statusClass = STATUS_COLORS[normalizeStatus(report?.status)] || "unknown";

  return (
    <DashboardLayout title="Management Overview">
      <div className="report-detail-wrapper">
        {error ? (
          <section className="report-detail-card report-detail-message">
            <p>{error}</p>
            <button className="report-detail-close" type="button" onClick={goBack}>Back to Report History</button>
          </section>
        ) : !report ? (
          <section className="report-detail-card report-detail-message"><p>Loading report...</p></section>
        ) : (
          <article className="report-detail-card">
            <header className="report-detail-header">
              <h2 className="report-detail-title">
                Report Details: #{report.report_number}{report.category ? ` – ${report.category}` : ""}
              </h2>
              <button className="report-detail-export" type="button" onClick={() => window.print()}>
                <DownloadIcon />
                Export as PDF
              </button>
            </header>

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
              <h3 className="detail-field-label">Attached Media</h3>
              {report.image_urls?.length ? (
                <div className="attached-media-grid">
                  {report.image_urls.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      className="media-thumbnail"
                      type="button"
                      onClick={() => setLightboxSrc(src)}
                      aria-label={`View attached photo ${idx + 1}`}
                    >
                      <img src={src} alt={`Report attachment ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              ) : <p className="report-detail-empty">No attached media.</p>}
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

            <footer className="report-detail-footer">
              <button className="report-detail-close" type="button" onClick={goBack}>Close</button>
            </footer>
          </article>
        )}
      </div>

      {lightboxSrc && (
        <div className="report-media-overlay" onClick={() => setLightboxSrc(null)}>
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
    </DashboardLayout>
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
    <div className="activity-modal-overlay" onClick={onClose}>
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
