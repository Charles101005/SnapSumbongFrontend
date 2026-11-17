import {
  REPORT_STATUS,
  STATUS_TO_STEP,
  TIMELINE_STEPS,
  isInvalidStatus,
  isPausedStatus,
  normalizeStatus,
  statusStep,
} from "./reportStatuses";

// Icons for the five fixed milestones (presentation only).
export const TIMELINE_ICONS = Object.freeze({
  submitted: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  assigned: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  in_progress: "M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-2.1z",
  resolved: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
  closed: "M20 6 9 17l-5-5",
});

const isValidationEntry = (entry) =>
  entry?.activity === "VALIDATED" ||
  entry?.activity_label === "Report validated";

// The citizen view should not show the same "Report validated" milestone
// twice when a legacy Under Review entry and a manual VALIDATED note coexist.
// The staff audit history keeps every entry.
const collapseValidationEntries = (entries) => {
  let seenValidation = false;
  return entries.filter((entry) => {
    if (!isValidationEntry(entry)) return true;
    if (seenValidation) return false;
    seenValidation = true;
    return true;
  });
};

export function buildReportTimeline({
  status,
  entries = [],
  createdAt = "",
  collapseValidation = false,
}) {
  const currentStatusKey = normalizeStatus(status);
  const invalid = isInvalidStatus(currentStatusKey);
  const paused = isPausedStatus(currentStatusKey);

  // For Invalid, the track stops at the last milestone actually reached; the
  // Invalid status has no milestone of its own.
  const reachedStep = entries.reduce((max, item) => {
    const stepIndex = STATUS_TO_STEP[normalizeStatus(item.status)];
    return stepIndex !== undefined && stepIndex !== null
      ? Math.max(max, stepIndex)
      : max;
  }, 0);
  const currentStep = invalid
    ? reachedStep
    : (statusStep(currentStatusKey) ?? 0);

  const createEntry = entries.find((item) => item.action === "CREATE");
  const bornAssigned =
    normalizeStatus(createEntry?.status) === REPORT_STATUS.ASSIGNED;
  const hasHistory = entries.length > 0;

  const steps = TIMELINE_STEPS.map((step, idx) => {
    const phaseEntries = entries.filter(
      (item) => STATUS_TO_STEP[normalizeStatus(item.status)] === idx
    );
    const displayEntries =
      idx === 2 && collapseValidation
        ? collapseValidationEntries(phaseEntries)
        : phaseEntries;

    const firstEntry = phaseEntries[0];
    const latestEntry = displayEntries[displayEntries.length - 1];

    // A report can be created already Assigned; the CREATE entry doubles as
    // the Assigned milestone instead of a phantom separate status change.
    const fromCreate = idx === 1 && bornAssigned && !firstEntry;
    const date =
      idx === 0
        ? createdAt || createEntry?.created_at || ""
        : fromCreate
          ? createEntry?.created_at || ""
          : firstEntry?.created_at || "";

    // A milestone behind the current position with no history was jumped
    // over (e.g. On-Hold -> Closed skips Resolved). Submitted always happened,
    // so it is never treated as skipped.
    const skipped =
      hasHistory &&
      !invalid &&
      idx > 0 &&
      idx < currentStep &&
      phaseEntries.length === 0 &&
      !fromCreate;
    const halted = invalid && idx > currentStep;

    return {
      ...step,
      icon: TIMELINE_ICONS[step.key],
      date,
      skipped,
      halted,
      paused: paused && idx === currentStep,
      entries: displayEntries,
      entry:
        idx === 0
          ? createEntry || null
          : latestEntry || (fromCreate ? createEntry : null),
    };
  });

  const invalidEntry = [...entries]
    .reverse()
    .find((item) => normalizeStatus(item.status) === REPORT_STATUS.INVALID);
  const pauseEntry = [...entries]
    .reverse()
    .find((item) => normalizeStatus(item.status) === REPORT_STATUS.ON_HOLD);

  // A reopened report returns to In Progress. New reopens are allowed only
  // from Resolved; the Closed → In Progress case stays in the lookup so
  // historical entries from before that rule still render their banner.
  const activeHandling =
    currentStatusKey === REPORT_STATUS.IN_PROGRESS ||
    currentStatusKey === REPORT_STATUS.ON_HOLD;
  const reopenEntry = activeHandling
    ? [...entries].reverse().find((item) => {
        const from = normalizeStatus(item.from_status);
        const to = normalizeStatus(item.to_status);
        return (
          [REPORT_STATUS.RESOLVED, REPORT_STATUS.CLOSED].includes(from) &&
          to === REPORT_STATUS.IN_PROGRESS
        );
      }) || null
    : null;

  return {
    invalid,
    paused,
    currentStep,
    steps,
    invalidEntry,
    pauseEntry,
    reopenEntry,
  };
}
