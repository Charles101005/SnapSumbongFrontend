import { useEffect, useState } from "react";
import { getReportDetail } from "../../../api/reports";
import ModerationPanel from "../../../components/shared/ModerationPanel";
import "./ReportModerationModal.css";

const normalize = (value) => String(value || "").toLowerCase().replace(/[\s-]+/g, "_");

// Flag -> Warn -> Ban entry point from the Operations table: opened from an
// Invalid row so staff can moderate the reporter without leaving the page.
export default function ReportModerationModal({ reportNumber, onClose, onChanged }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const detail = await getReportDetail(reportNumber);
        if (cancelled) return;
        if (!detail || !detail.reported_by_user_number) {
          setError("Reporter identity is not available for this report.");
          return;
        }
        setReport(detail);
      } catch (err) {
        if (cancelled) return;
        setError(err?.detail || err?.message || "Failed to load the report. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reportNumber]);

  // Escape closes the dialog.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const shell = (content) => (
    <div className="rm-modal-overlay" onClick={onClose}>
      <section
        className="rm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rm-modal-header">
          <div>
            <h2 id="rm-modal-title" className="rm-modal-title">Report Moderation</h2>
            <p className="rm-modal-subtitle">
              Moderate the reporter of <code className="rm-report-id">{reportNumber}</code>.
            </p>
          </div>
          <button
            type="button"
            className="rm-modal-close"
            onClick={onClose}
            aria-label="Close report moderation"
          >
            &times;
          </button>
        </header>
        {content}
      </section>
    </div>
  );

  if (loading) return shell(<p className="rm-loading">Loading report...</p>);

  if (error) {
    return shell(
      <div className="rm-body">
        <div className="rm-banner rm-banner-error">{error}</div>
        <div className="rm-actions">
          <button type="button" className="rm-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const statusKey = normalize(report.status);

  return shell(
    <>
      <div className="rm-report-info">
        <div className="rm-report-info-top">
          <span className={`rm-status-badge rm-status-${statusKey}`}>{report.status || "—"}</span>
          <span className="rm-report-category">{report.category || "—"}</span>
        </div>
        {report.remarks && (
          <p className="rm-report-remarks">
            <strong>Flag reason:</strong> {report.remarks}
          </p>
        )}
        <div className="rm-reporter">
          <span className="rm-reporter-label">Reporter</span>
          <span className="rm-reporter-name">{report.reported_by || "—"}</span>
          <code className="rm-reporter-number">{report.reported_by_user_number}</code>
        </div>
      </div>

      <div className="rm-moderation">
        <ModerationPanel
          userNumber={report.reported_by_user_number}
          defaultReportNumber={reportNumber}
          onChanged={onChanged}
        />
      </div>

      <div className="rm-actions">
        <button type="button" className="rm-btn-close" onClick={onClose}>Close</button>
      </div>
    </>
  );
}
