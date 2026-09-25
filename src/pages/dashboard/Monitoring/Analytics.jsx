import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReportMetrics } from "../../../api/analytics";
import "./Analytics.css";

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReportMetrics().then(setMetrics).catch((err) => setError(err?.detail || err?.message || "Unable to load analytics."));
  }, []);

  const counts = metrics?.count_by_status || {};
  const entries = Object.entries(counts);

  return (
    <DashboardLayout title="Monitoring Dashboard">
      <div className="section-header"><h2 className="section-title">Analytics</h2><p className="section-subtitle">View live hazard-report metrics scoped by your API permissions.</p></div>
      {error && <div className="form-error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
      <div className="analytics-placeholder" style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="stat-card"><div className="stat-info"><span className="stat-label">TOTAL REPORTS</span><span className="stat-value">{metrics?.total_count ?? "—"}</span></div></div>
        {entries.map(([status, count]) => <div className="stat-card" key={status}><div className="stat-info"><span className="stat-label">{status.replaceAll("_", " ").toUpperCase()}</span><span className="stat-value">{count}</span></div></div>)}
      </div>
    </DashboardLayout>
  );
}
