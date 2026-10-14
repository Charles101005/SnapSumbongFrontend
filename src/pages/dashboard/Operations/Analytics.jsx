import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReportMetrics, getHandlerCompliance } from "../../../api/analytics";
import "./Analytics.css";

const pct = (value) => (value === null || value === undefined ? "—" : `${value}%`);
const ratingSlug = (rating) => String(rating || "").toLowerCase().replace(/\s+/g, "-");

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [compliance, setCompliance] = useState(null);
  const [complianceNote, setComplianceNote] = useState("");

  useEffect(() => {
    getReportMetrics().then(setMetrics).catch((err) => setError(err?.detail || err?.message || "Unable to load analytics."));
    getHandlerCompliance()
      .then(setCompliance)
      .catch((err) => {
        if (err?.status === 403) {
          setComplianceNote("Your role does not include handler-performance access — ask a Supervisor to review DO 47 compliance scores.");
        } else {
          setComplianceNote(err?.detail || err?.message || "Unable to load compliance metrics.");
        }
      });
  }, []);

  const counts = metrics?.count_by_status || {};
  const entries = Object.entries(counts);
  const weights = compliance?.weights || {};

  return (
    <DashboardLayout title="Operations Dashboard">
      <div className="section-header"><h2 className="section-title">Analytics</h2><p className="section-subtitle">View live hazard-report metrics scoped by your API permissions.</p></div>
      {error && <div className="form-error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
      <div className="analytics-placeholder" style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">TOTAL REPORTS</span><span className="stat-value">{metrics?.total_count ?? "—"}</span></div></div>
        {entries.map(([status, count]) => <div className="stat-card" key={status}><div className="stat-info"><span className="stat-label">{status.replaceAll("_", " ").toUpperCase()}</span><span className="stat-value">{count}</span></div></div>)}
      </div>

      <section className="compliance-section">
        <div className="section-header">
          <h2 className="section-title">DO 47 Handler Compliance</h2>
          <p className="section-subtitle">
            Per-handler score = SLA on-time ({weights.sla_on_time ?? 60}%) + photolog
            completeness ({weights.photolog_completeness ?? 25}%) + declared validator
            ({weights.validation_independence ?? 15}%), ranked highest first.
            Transfers/referrals and pre-enforcement reports count as activity but are not scored.
          </p>
        </div>

        {!compliance ? (
          <p className="compliance-empty">{complianceNote || "Loading compliance scores..."}</p>
        ) : compliance.handlers.length === 0 ? (
          <p className="compliance-empty">No resolved reports have been assigned to handlers yet — scores appear once rectification works are completed.</p>
        ) : (
          <div className="compliance-table-wrap">
            <table className="compliance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Handler</th>
                  <th>Resolved</th>
                  <th>SLA On-Time</th>
                  <th>Photolog</th>
                  <th>Validation</th>
                  <th>Score</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {compliance.handlers.map((row, index) => (
                  <tr key={row.user_number}>
                    <td>{index + 1}</td>
                    <td>{row.handler_name}</td>
                    <td>{row.resolved_count}</td>
                    <td>{pct(row.sla_on_time_pct)}</td>
                    <td>{pct(row.photolog_pct)}</td>
                    <td>{pct(row.validation_pct)}</td>
                    <td className="compliance-score">{row.score ?? "—"}</td>
                    <td><span className={`rating-badge rating-${ratingSlug(row.rating)}`}>{row.rating}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
