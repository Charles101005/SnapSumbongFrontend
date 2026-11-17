import { buildReportTimeline } from "../../shared/reportTimeline";
import { REPORT_STATUS, normalizeStatus } from "../../shared/reportStatuses";
import "./ReportTimeline.css";

const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
};

/**
 * Shared five-milestone resolution track.
 *
 * Citizens use it interactively (In Progress opens the activity details).
 * Staff use the same track as an at-a-glance summary above the full audit
 * history. On-Hold pauses In Progress; Invalid stops at the last reached
 * milestone.
 */
export default function ReportTimeline({
  status,
  entries = [],
  createdAt = "",
  timeline: providedTimeline,
  interactive = false,
  onStepClick,
  collapseValidation = false,
  showPauseBanner = true,
  showReopenBanner = true,
  ariaLabel = "Resolution timeline",
}) {
  const timeline =
    providedTimeline ||
    buildReportTimeline({ status, entries, createdAt, collapseValidation });
  const { currentStep, steps, invalid, paused, pauseEntry, reopenEntry } = timeline;

  return (
    <div className="report-timeline" role="group" aria-label={ariaLabel}>
      <div
        className="report-timeline-stepper"
        style={{ "--rt-progress": currentStep }}
      >
        {steps.map((step, idx) => {
          const reached = idx <= currentStep;
          const clickable =
            interactive &&
            reached &&
            !step.skipped &&
            !step.halted &&
            (step.entries?.length > 0 || Boolean(step.entry));
          const stateClass = step.skipped
            ? "skipped"
            : step.halted
              ? "halted"
              : step.paused
                ? "paused"
                : idx < currentStep
                  ? "completed"
                  : idx === currentStep
                    ? invalid
                      ? "completed"
                      : "current"
                    : "upcoming";

          const content = (
            <>
              <span className="report-timeline-node">
                {step.skipped || step.halted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="7" y1="12" x2="17" y2="12" />
                  </svg>
                ) : step.paused ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="10" y1="9" x2="10" y2="15" />
                    <line x1="14" y1="9" x2="14" y2="15" />
                  </svg>
                ) : idx < currentStep ||
                  (idx === currentStep &&
                    (invalid ||
                      [REPORT_STATUS.RESOLVED, REPORT_STATUS.CLOSED].includes(
                        normalizeStatus(status)
                      ))) ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : idx === currentStep ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.icon} />
                  </svg>
                )}
              </span>
              <span className="report-timeline-label">{step.label}</span>
              <span className="report-timeline-date">
                {step.skipped
                  ? "Not needed"
                  : step.halted
                    ? "Not reached"
                    : step.paused
                      ? "On hold"
                      : reached
                        ? formatDate(step.date) || "—"
                        : "Pending"}
              </span>
              {clickable && (
                <span className="report-timeline-hint">View Details</span>
              )}
            </>
          );

          const className = `report-timeline-step ${stateClass}${clickable ? " clickable" : ""}`;

          return clickable ? (
            <button
              key={step.key}
              type="button"
              className={className}
              onClick={() => onStepClick?.(step)}
              aria-haspopup="dialog"
            >
              {content}
            </button>
          ) : (
            <div key={step.key} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      {showReopenBanner && reopenEntry && (
        <div className="report-timeline-reopen" role="status">
          <span className="report-timeline-reopen-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <polyline points="21 3 21 9 15 9" />
            </svg>
          </span>
          <span className="report-timeline-reopen-copy">
            <strong>Report reopened</strong>
            <span>
              {reopenEntry?.remarks ||
                "The report was reopened for further handling."}
            </span>
            {reopenEntry?.created_at && (
              <span className="report-timeline-reopen-date">
                Since {formatDateTime(reopenEntry.created_at)}
              </span>
            )}
          </span>
        </div>
      )}

      {showPauseBanner && paused && (
        <div className="report-timeline-pause" role="status">
          <span className="report-timeline-pause-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="10" y1="9" x2="10" y2="15" />
              <line x1="14" y1="9" x2="14" y2="15" />
            </svg>
          </span>
          <span className="report-timeline-pause-copy">
            <strong>Handling paused</strong>
            <span>
              {pauseEntry?.remarks ||
                "The LGU is awaiting additional information, resources, or referral before continuing."}
            </span>
            {pauseEntry?.created_at && (
              <span className="report-timeline-pause-date">
                Since {formatDateTime(pauseEntry.created_at)}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
