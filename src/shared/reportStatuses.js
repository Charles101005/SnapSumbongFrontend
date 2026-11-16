// Single source of truth for every report status in the UI.
//
// The backend owns the workflow; this catalog mirrors HazardReports.Status
// (7 values) so the sidebar, tables, badges, filters, timeline, and modals
// cannot drift apart. Validation, dispatch, and corrective action happen
// inside IN_PROGRESS and are tracked as activity notes, not statuses.

export const REPORT_STATUS = Object.freeze({
  NEW: "NEW",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  ON_HOLD: "ON_HOLD",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  INVALID: "INVALID",
});

export const REPORT_STATUS_META = Object.freeze({
  NEW: {
    label: "New",
    badgeClass: "status-new",
    step: 0,
    active: true,
    terminal: false,
    description:
      "The report has been successfully submitted by the citizen and is awaiting initial assessment and assignment by the LGU.",
  },
  ASSIGNED: {
    label: "Assigned",
    badgeClass: "status-assigned",
    step: 1,
    active: true,
    terminal: false,
    description:
      "The report has been assigned to a designated LGU officer who is responsible for handling and monitoring the reported hazard.",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badgeClass: "status-in-progress",
    step: 2,
    active: true,
    terminal: false,
    description:
      "The LGU officer is actively handling the report, including validating the submitted information, assessing the reported hazard, coordinating with the appropriate department or field personnel, and carrying out the necessary corrective actions.",
  },
  ON_HOLD: {
    label: "On-Hold",
    badgeClass: "status-on-hold",
    step: 2,
    active: true,
    terminal: false,
    paused: true,
    description:
      "The report is temporarily paused pending additional information, further verification, resource availability, or referral to the appropriate agency when the reported issue falls outside the LGU's jurisdiction.",
  },
  RESOLVED: {
    label: "Resolved",
    badgeClass: "status-resolved",
    step: 3,
    active: false,
    terminal: false,
    description:
      "The reported hazard has been addressed and the necessary corrective actions have been completed. The report is awaiting final confirmation and closure.",
  },
  CLOSED: {
    label: "Closed",
    badgeClass: "status-closed",
    step: 4,
    active: false,
    terminal: true,
    description:
      "The report has been verified as completed and officially closed. No further action is required.",
  },
  INVALID: {
    label: "Invalid",
    badgeClass: "status-invalid",
    step: null,
    active: false,
    terminal: true,
    description:
      "The report has been determined to be false, misleading, spam, or otherwise invalid after assessment. No further action will be taken, and the associated account may be flagged for repeated abuse.",
  },
});

// Sidebar / filter order. On-Hold sits after In Progress because it is a pause
// inside the handling phase, not a step between Assigned and Resolved.
export const REPORT_STATUS_ORDER = [
  REPORT_STATUS.NEW,
  REPORT_STATUS.ASSIGNED,
  REPORT_STATUS.IN_PROGRESS,
  REPORT_STATUS.ON_HOLD,
  REPORT_STATUS.RESOLVED,
  REPORT_STATUS.CLOSED,
  REPORT_STATUS.INVALID,
];

export const REPORT_STATUS_KEYS = REPORT_STATUS_ORDER.map((status) =>
  status.toLowerCase()
);

// "Active" means the report still needs work; Resolved/Closed/Invalid are done.
export const ACTIVE_STATUS_KEYS = REPORT_STATUS_ORDER
  .filter((status) => REPORT_STATUS_META[status].active)
  .map((status) => status.toLowerCase());

export const normalizeStatus = (status) =>
  String(status || "").trim().toUpperCase().replace(/[\s-]+/g, "_");

export const normalizeStatusKey = (status) => normalizeStatus(status).toLowerCase();

// Retired statuses still exist in historical audit payloads. They collapse
// into In Progress and are displayed as the activity they represented.
export const LEGACY_STATUS_CODES = Object.freeze({
  UNDER_REVIEW: REPORT_STATUS.IN_PROGRESS,
  DISPATCHED: REPORT_STATUS.IN_PROGRESS,
  ONGOING: REPORT_STATUS.IN_PROGRESS,
});

export const LEGACY_ACTIVITY_LABELS = Object.freeze({
  UNDER_REVIEW: "Report validated",
  DISPATCHED: "Forwarded to field personnel",
  ONGOING: "Corrective work started",
});

export const normalizeStatusOrLegacy = (status) => {
  const code = normalizeStatus(status);
  return LEGACY_STATUS_CODES[code] || code;
};

export const statusMeta = (status) =>
  REPORT_STATUS_META[normalizeStatusOrLegacy(status)] || null;

export const statusLabel = (status) => statusMeta(status)?.label || String(status || "—");

export const statusBadgeClass = (status) =>
  `status-badge ${statusMeta(status)?.badgeClass || ""}`.trim();

export const statusDescription = (status) => statusMeta(status)?.description || "";

export const statusStep = (status) => {
  const meta = statusMeta(status);
  return meta && meta.step !== null ? meta.step : null;
};

export const isActiveStatus = (status) => Boolean(statusMeta(status)?.active);

export const isPausedStatus = (status) => Boolean(statusMeta(status)?.paused);

export const isTerminalStatus = (status) => Boolean(statusMeta(status)?.terminal);

export const isInvalidStatus = (status) =>
  normalizeStatusOrLegacy(status) === REPORT_STATUS.INVALID;

// Citizen resolution timeline: the five milestones every report moves through.
export const TIMELINE_STEPS = Object.freeze([
  { key: "submitted", expected: REPORT_STATUS.NEW, label: "Submitted" },
  { key: "assigned", expected: REPORT_STATUS.ASSIGNED, label: "Assigned" },
  { key: "in_progress", expected: REPORT_STATUS.IN_PROGRESS, label: "In Progress" },
  { key: "resolved", expected: REPORT_STATUS.RESOLVED, label: "Resolved" },
  { key: "closed", expected: REPORT_STATUS.CLOSED, label: "Closed" },
]);

// INVALID is deliberately absent: it is an off-track terminal outcome. The
// timeline stops at the last milestone the report actually reached.
export const STATUS_TO_STEP = Object.freeze({
  NEW: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  ON_HOLD: 2,
  RESOLVED: 3,
  CLOSED: 4,
});

// Activity notes logged by officers while a report is In Progress/On-Hold.
// Mirrors apps/reports/constants/activity_constant.py.
//
// VALIDATED is intentionally absent: entering In Progress is the validation
// milestone. The label map still knows it so historical audit rows render.
export const REPORT_ACTIVITY_LABELS = Object.freeze({
  VALIDATED: "Report validated",
  DISPATCHED: "Forwarded to field personnel",
  WORK_STARTED: "Corrective work started",
  WORK_COMPLETED: "Corrective work completed",
  REFERRED: "Referred to another office or agency",
  FOLLOW_UP: "Follow-up update",
  NOTE: "General update",
});

export const REPORT_ACTIVITY_OPTIONS = Object.freeze([
  { value: "DISPATCHED", label: "Forwarded to field personnel" },
  { value: "WORK_STARTED", label: "Corrective work started" },
  { value: "WORK_COMPLETED", label: "Corrective work completed" },
  { value: "REFERRED", label: "Referred to another office or agency" },
  { value: "FOLLOW_UP", label: "Follow-up update" },
  { value: "NOTE", label: "General update" },
]);

export const activityLabel = (entry) =>
  entry?.activity_label ||
  REPORT_ACTIVITY_LABELS[entry?.activity] ||
  "";
