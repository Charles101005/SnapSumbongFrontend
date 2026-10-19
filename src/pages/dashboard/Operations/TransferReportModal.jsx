import { useEffect, useState } from "react";
import { transferReport } from "../../../api/reports";
import { getReportHandlers } from "../../../api/users";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import "./TransferReportModal.css";

// Supervisor handoff: reassign an open report to another eligible officer.
// Opened from the Report Detail footer. Status is untouched by design — a
// transfer is a handoff, not a workflow transition.
export default function TransferReportModal({ report, onClose, onChanged }) {
  const [handlers, setHandlers] = useState([]);
  const [loadingHandlers, setLoadingHandlers] = useState(true);
  const [handlersError, setHandlersError] = useState("");
  const [target, setTarget] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const reportNumber = report?.report_number;
  const currentAssigneeEmail = report?.assigned_to?.email;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingHandlers(true);
      setHandlersError("");
      try {
        const data = await getReportHandlers({ page_size: 50 });
        if (cancelled) return;
        setHandlers(data?.results || []);
      } catch (err) {
        if (cancelled) return;
        setHandlersError(
          err?.detail || err?.message || "Unable to load the list of officers. Please try again."
        );
      } finally {
        if (!cancelled) setLoadingHandlers(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Escape closes the dialog (the Report Detail Escape chain also guards
  // on the `transferring` flag so only this inner modal closes).
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const shell = (content) => (
    <div className="xfer-modal-overlay" onClick={onClose}>
      <section
        className="xfer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="xfer-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="xfer-modal-header">
          <div>
            <h2 id="xfer-modal-title" className="xfer-modal-title">Transfer Report</h2>
            <p className="xfer-modal-subtitle">
              Reassign <code className="xfer-report-id">{reportNumber}</code> to another officer.
            </p>
          </div>
          <button
            type="button"
            className="xfer-modal-close"
            onClick={onClose}
            aria-label="Close transfer report"
          >
            &times;
          </button>
        </header>
        {content}
      </section>
    </div>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!target || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      await transferReport(reportNumber, {
        assigned_to: target,
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      });
      onChanged?.();
      onClose?.();
    } catch (err) {
      setSubmitError(
        err?.detail || err?.message || "Unable to transfer the report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // The current assignee is not a valid transfer target; match on email
  // since the detail payload exposes { email, name } but no user_number.
  const eligibleHandlers = handlers.filter(
    (handler) => !currentAssigneeEmail || handler.email !== currentAssigneeEmail
  );

  const options = eligibleHandlers.map((handler) => ({
    value: handler.user_number,
    label: handler.role ? `${handler.full_name} — ${handler.role}` : handler.full_name,
  }));

  return shell(
    <form className="xfer-body" onSubmit={handleSubmit}>
      <div className="xfer-report-info">
        <div className="xfer-report-info-top">
          <span className="xfer-status-badge">{report?.status || "—"}</span>
          <span className="xfer-report-category">{report?.category || "—"}</span>
        </div>
        <div className="xfer-current-assignee">
          <span className="xfer-field-label">Currently assigned to</span>
          <span className="xfer-current-assignee-name">
            {report?.assigned_to?.name || "Unassigned"}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="xfer-banner xfer-banner-error" role="alert">{submitError}</div>
      )}

      <div className="xfer-field">
        <label className="xfer-field-label" htmlFor="xfer-target-officer">
          Transfer to officer
        </label>
        {loadingHandlers ? (
          <p className="xfer-loading">Loading officers...</p>
        ) : handlersError ? (
          <div className="xfer-banner xfer-banner-error" role="alert">{handlersError}</div>
        ) : (
          <SearchableSelect
            id="xfer-target-officer"
            value={target}
            onChange={setTarget}
            options={options}
            placeholder="Search for an officer"
            emptyMessage="No eligible officers found"
          />
        )}
      </div>

      <div className="xfer-field">
        <label className="xfer-field-label" htmlFor="xfer-remarks">
          Reason for transfer <span className="xfer-optional">(optional)</span>
        </label>
        <textarea
          id="xfer-remarks"
          className="xfer-textarea"
          rows={3}
          maxLength={500}
          placeholder="e.g. Officer on leave; workload rebalance"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
        />
      </div>

      <div className="xfer-actions">
        <button type="button" className="xfer-btn-close" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button
          type="submit"
          className="xfer-btn-submit"
          disabled={!target || submitting || loadingHandlers}
        >
          {submitting ? "Transferring..." : "Transfer Report"}
        </button>
      </div>
    </form>
  );
}
