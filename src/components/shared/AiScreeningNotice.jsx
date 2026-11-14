import { FlagIcon } from "./icons";
import {
  aiFlagReasonDescription,
  aiFlagReasonLabel,
  flaggedImageCount,
  uniqueAiFlagReasons,
} from "../../utils/aiFlags";
import "./AiScreeningNotice.css";

// Small inline pill for the reports table: makes an AI-flagged row obvious
// without pushing the row height around. `title` carries the full reason list.
export function AiFlagBadge({ label = "AI flagged", title, className = "" }) {
  return (
    <span className={`ai-flag-badge ${className}`.trim()} title={title}>
      <FlagIcon size={10} />
      {label}
    </span>
  );
}

// Overlay badge pinned to a flagged thumbnail (manage/detail dialogs).
// `compact` renders just the flag icon — the 48px thumbnails in the manage
// dialog are too small for the "AI FLAGGED" text. The badge only appears while
// the flag is pending: a reviewed report has its image flags cleared.
export function AiImageFlagBadge({ className = "", compact = false }) {
  const title =
    "Automatic AI screening flagged this image. Advisory only — review it manually.";

  return (
    <span
      className={`ai-image-flag${compact ? " ai-image-flag--compact" : ""} ${className}`.trim()}
      title={title}
      aria-label={title}
    >
      <FlagIcon size={10} />
      {!compact && "AI FLAGGED"}
    </span>
  );
}

// Compact staff-facing notice for a report whose preliminary AI screening
// returned at least one flag and that has not been reviewed yet. Deliberately
// explicit that the flag is advisory: the backend never approves, rejects or
// invalidates a report automatically. Once an officer reviews the flag, the
// backend clears it and this card is no longer rendered.
export default function AiScreeningNotice({
  reasons = [],
  imageFlags = [],
  totalImages,
}) {
  const codes = uniqueAiFlagReasons(reasons);
  const flagged = flaggedImageCount(imageFlags);
  const hasImageList = Array.isArray(imageFlags) && imageFlags.length > 0;
  const photoCount = Number.isFinite(totalImages)
    ? totalImages
    : hasImageList
      ? imageFlags.length
      : null;
  const showCount = hasImageList && flagged > 0;
  const countText = showCount
    ? `${flagged} of ${photoCount ?? flagged} photo${(photoCount ?? flagged) === 1 ? "" : "s"} flagged`
    : null;

  return (
    <section
      className="ai-screening-notice"
      role="status"
      aria-label="Automatic AI screening flag"
    >
      <span className="ai-screening-notice-icon" aria-hidden="true">
        <FlagIcon size={15} />
      </span>
      <div className="ai-screening-notice-body">
        <div className="ai-screening-notice-title-row">
          <strong className="ai-screening-notice-title">
            Flagged by AI screening
          </strong>
          <span className="ai-screening-notice-tag">Needs review</span>
          {countText && (
            <span className="ai-screening-notice-count">{countText}</span>
          )}
        </div>
        <p className="ai-screening-notice-text">
          Advisory only — this report has <strong>not</strong> been marked
          Invalid automatically.
        </p>
        {codes.length > 0 && (
          <ul className="ai-screening-reasons" aria-label="AI flag reasons">
            {codes.map((code) => (
              <li
                className="ai-screening-reason"
                key={code}
                title={aiFlagReasonDescription(code)}
              >
                {aiFlagReasonLabel(code)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
