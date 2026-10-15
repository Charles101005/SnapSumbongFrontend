import { useCallback, useEffect, useRef, useState } from "react";
import { getCitizen } from "../../api/users";
import { getCitizenWarnings, warnCitizen, banCitizen, unbanCitizen } from "../../api/warnings";
import { PERMISSIONS } from "../../shared/constants";
import { MOCK_ALL_ACCESS } from "../../shared/config/env";
import { useAuth } from "../../context/authContext";
import { formatDate } from "../../utils/format";
import "./ModerationPanel.css";

// Minimum reason length enforced by the backend moderation serializers.
const MIN_REASON_LENGTH = 10;

const MODERATION_SUCCESS = {
  warn: "Warning issued. It now counts toward this citizen's ban eligibility.",
  ban: "Account banned. The citizen can no longer sign in until restored.",
  unban: "Account restored. The citizen can sign in again.",
};

// Shared Flag -> Warn -> Ban panel, used by the Citizen Profile modal and the
// Operations Report Moderation modal. Fetches its own moderation data so it
// works in any dialog; both endpoints fail soft (403/missing data leaves the
// count/history empty and hides the gated action buttons).
export default function ModerationPanel({ userNumber, defaultReportNumber = "", onChanged }) {
  const { user: authUser } = useAuth();
  const permissions = authUser?.permissions || [];
  // MOCK_ALL_ACCESS short-circuits the permission check (same as Sidebar).
  const can = (permission) => MOCK_ALL_ACCESS || permissions.includes(permission);
  const canWarn = can(PERMISSIONS.USER_WARN);
  const canBan = can(PERMISSIONS.USER_DEACTIVATE_ANY);
  const canUnban = can(PERMISSIONS.USER_ACTIVATE_ANY);
  const canModerate = canWarn || canBan || canUnban;

  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [modAction, setModAction] = useState(null); // "warn" | "ban" | "unban"
  const [modReason, setModReason] = useState("");
  const [modReportNumber, setModReportNumber] = useState(defaultReportNumber);
  const [modBusy, setModBusy] = useState(false);
  const [modNotice, setModNotice] = useState(null); // { type: "success" | "error", text }
  // Guards against a stale fetch landing after userNumber changed.
  const loadSeqRef = useRef(0);

  const fetchNow = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const [detail, list] = await Promise.all([
      getCitizen(userNumber).catch(() => null),
      getCitizenWarnings(userNumber).catch(() => null),
    ]);
    if (seq !== loadSeqRef.current) return;
    const history = list?.warnings || [];
    setIsActive(detail ? detail.is_active !== false : null);
    setWarningCount(detail ? Number(detail.warning_count || 0) : history.length);
    setWarnings(history);
    setLoading(false);
  }, [userNumber]);

  useEffect(() => {
    fetchNow();
  }, [fetchNow]);

  const handleModeration = async () => {
    const reason = modReason.trim();
    if (reason.length < MIN_REASON_LENGTH) {
      setModNotice({ type: "error", text: `The reason must be at least ${MIN_REASON_LENGTH} characters.` });
      return;
    }
    const reportNumber = modReportNumber.trim();
    setModBusy(true);
    setModNotice(null);
    try {
      const payload = { reason };
      if (reportNumber && modAction !== "unban") payload.report_number = reportNumber;
      if (modAction === "warn") await warnCitizen(userNumber, payload);
      else if (modAction === "ban") await banCitizen(userNumber, payload);
      else await unbanCitizen(userNumber, payload);
      setModNotice({ type: "success", text: MODERATION_SUCCESS[modAction] });
      setModAction(null);
      setModReason("");
      setModReportNumber(defaultReportNumber);
      await fetchNow();
      onChanged?.();
    } catch (err) {
      setModNotice({ type: "error", text: err?.detail || err?.message || "Moderation action failed. Please try again." });
    } finally {
      setModBusy(false);
    }
  };

  const cancelModeration = () => {
    setModAction(null);
    setModReason("");
    setModReportNumber(defaultReportNumber);
    setModNotice(null);
  };

  return (
    <section className="mp-panel" aria-label="Moderation">
      <div className="mp-header">
        <div>
          <h3 className="mp-title">Moderation</h3>
          <p className="mp-subtitle">
            False or troll reports are flagged as Invalid in Operations; warnings
            accumulate here and make the citizen eligible for a ban.
          </p>
        </div>
        <span
          className={`mp-count ${warningCount >= 3 ? "mp-count-danger" : warningCount > 0 ? "mp-count-warn" : ""}`}
        >
          {warningCount} {warningCount === 1 ? "warning" : "warnings"}
        </span>
      </div>

      {loading ? (
        <p className="mp-loading">Loading moderation data...</p>
      ) : (
        <>
          {modNotice && (
            <div
              className={`mp-banner ${modNotice.type === "error" ? "mp-banner-error" : "mp-banner-success"}`}
              role="status"
            >
              {modNotice.text}
            </div>
          )}

          {warnings.length > 0 ? (
            <ul className="mp-warn-list">
              {warnings.map((warning) => (
                <li key={warning.warning_number} className="mp-warn-item">
                  <div className="mp-warn-item-top">
                    <span className="mp-warn-number">{warning.warning_number}</span>
                    <span className="mp-warn-date">{formatDate(warning.created_at)}</span>
                  </div>
                  <p className="mp-warn-reason">{warning.reason}</p>
                  <p className="mp-warn-meta">
                    {warning.warned_by_name ? `Issued by ${warning.warned_by_name}` : null}
                    {warning.report_number
                      ? `${warning.warned_by_name ? " · " : ""}Cited report ${warning.report_number}`
                      : null}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mp-warn-empty">No warnings on record.</p>
          )}

          {canModerate && (modAction ? (
            <div className="mp-form">
              <label className="mp-label" htmlFor="mp-mod-reason">
                {modAction === "ban" ? "Ban reason *" : modAction === "unban" ? "Restoration reason *" : "Warning reason *"}
              </label>
              <textarea
                id="mp-mod-reason"
                className="mp-input mp-textarea"
                rows="3"
                value={modReason}
                onChange={(event) => setModReason(event.target.value)}
                placeholder={
                  modAction === "warn"
                    ? "Describe the false report(s) or misuse of the system..."
                    : modAction === "ban"
                      ? "State why this account is being banned..."
                      : "State why this account is being restored..."
                }
              />

              {modAction !== "unban" && (
                <>
                  <label className="mp-label" htmlFor="mp-mod-report">
                    {modAction === "ban" ? "Cited Invalid report (fast-track ban)" : "Cited Invalid report (optional)"}
                  </label>
                  <input
                    id="mp-mod-report"
                    className="mp-input"
                    type="text"
                    value={modReportNumber}
                    onChange={(event) => setModReportNumber(event.target.value)}
                    placeholder="Report ID, e.g. HR-20260101-ABC123"
                  />
                  <p className="mp-hint">
                    {modAction === "ban"
                      ? "Ban needs 3+ warnings, or cite one of this citizen's Invalid reports for a fast-track ban."
                      : "Link the flagged (Invalid) report this warning is based on — leave blank for general warnings."}
                  </p>
                </>
              )}

              <div className="mp-form-actions">
                <button type="button" className="mp-btn-cancel" onClick={cancelModeration} disabled={modBusy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={modAction === "ban" ? "mp-btn-ban" : modAction === "unban" ? "mp-btn-restore" : "mp-btn-warn"}
                  onClick={handleModeration}
                  disabled={modBusy}
                >
                  {modBusy
                    ? "Working..."
                    : modAction === "ban"
                      ? "Ban Account"
                      : modAction === "unban"
                        ? "Restore Account"
                        : "Issue Warning"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mp-actions">
              {canWarn && isActive && (
                <button type="button" className="mp-btn-warn" onClick={() => { setModAction("warn"); setModNotice(null); }}>
                  Issue Warning
                </button>
              )}
              {canBan && isActive && (
                <button type="button" className="mp-btn-ban" onClick={() => { setModAction("ban"); setModNotice(null); }}>
                  Ban Account
                </button>
              )}
              {canUnban && !isActive && (
                <button type="button" className="mp-btn-restore" onClick={() => { setModAction("unban"); setModNotice(null); }}>
                  Restore Account
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </section>
  );
}
