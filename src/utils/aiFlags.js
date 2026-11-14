// Human-readable copy for the backend's preliminary AI screening flags.
//
// The report serializers expose the raw ImageFlagReason codes from
// external/ai/constants.py (`AI_GENERATED`, `PRANK_OR_MEME`, ...). Every staff
// surface resolves them through this map instead of printing the enum, so the
// wording stays consistent between the reports table, the manage dialog and
// the read-only detail dialog.
export const AI_FLAG_REASON_META = {
  AI_GENERATED: {
    label: "AI-generated / synthetic image",
    description:
      "The image shows signs of being generated, edited or otherwise synthesized by AI.",
  },
  PRANK_OR_MEME: {
    label: "Prank, meme or screenshot",
    description:
      "The image looks like a prank, meme, screenshot or other non-evidence content.",
  },
  CONTEXT_MISMATCH: {
    label: "Does not match the report",
    description:
      "The image does not appear to match the report's hazard category or description.",
  },
  LOW_CONFIDENCE: {
    label: "Low AI confidence",
    description:
      "The AI was not confident about this image, so it needs a manual review.",
  },
};

// Officer answer to a pending AI screening flag. These are NOT report
// workflow statuses — the backend records the decision in the audit trail and
// clears the report/image flags either way.
export const AI_FLAG_DECISION = Object.freeze({
  CLEARED: "CLEARED",
  CONFIRMED: "CONFIRMED",
});

// Transitions that leave triage (Under Review) and therefore force the officer
// to answer "Is this report valid?" — mirrors the backend's
// AI_FLAG_REVIEW_REQUIRED_TARGETS. Moving back to Under Review keeps the flag
// pending and needs no answer.
export const AI_FLAG_REVIEW_REQUIRED_TARGETS = Object.freeze([
  "ON_HOLD",
  "DISPATCHED",
  "ONGOING",
  "RESOLVED",
  "CLOSED",
  "INVALID",
]);

export const isAiFlagReviewRequiredFor = (status) =>
  AI_FLAG_REVIEW_REQUIRED_TARGETS.includes(String(status || "").trim().toUpperCase());

const normalizeCode = (reason) => String(reason || "").trim().toUpperCase();

export const aiFlagReasonLabel = (reason) => {
  const code = normalizeCode(reason);
  return AI_FLAG_REASON_META[code]?.label || code.replace(/_/g, " ").toLowerCase();
};

export const aiFlagReasonDescription = (reason) =>
  AI_FLAG_REASON_META[normalizeCode(reason)]?.description ||
  "The automatic screening flagged this item for manual review.";

// De-duplicated, order-preserving list of reason codes.
export const uniqueAiFlagReasons = (reasons) => {
  const seen = new Set();
  const unique = [];
  (reasons || []).forEach((reason) => {
    const code = normalizeCode(reason);
    if (!code || seen.has(code)) return;
    seen.add(code);
    unique.push(code);
  });
  return unique;
};

// Map per-image flags by image URL. The detail payload returns
// `image_ai_flags` alongside the flat `image_urls`/`photos` lists, so matching
// on URL (rather than array index) keeps every thumbnail paired with its own
// verdict even if the order ever changes.
export const mapImageAiFlags = (imageFlags) => {
  const byUrl = new Map();
  (imageFlags || []).forEach((flag) => {
    if (flag?.image_url) byUrl.set(flag.image_url, flag);
  });
  return byUrl;
};

export const flaggedImageCount = (imageFlags) =>
  (imageFlags || []).filter((flag) => flag?.is_ai_flagged).length;

// A flag is pending only while the backend still marks it as flagged. Both
// review decisions clear the report/image flags, so a reviewed report looks
// exactly like any other unflagged submission; its history lives on the
// report timeline instead of a standing card.
export const isAiFlagPending = (report) => Boolean(report?.is_ai_flagged);

