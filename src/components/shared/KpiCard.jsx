import "./KpiCard.css";

// Compact KPI tile used on the admin landing page (DashboardHome). `tone`
// picks the icon chip color; `accent` gives the card a red alert border.
export default function KpiCard({ icon, tone = "indigo", hint, label, value, accent = false }) {
  return (
    <div className={`kpi-card${accent ? " kpi-card-accent" : ""}`}>
      <div className="kpi-top">
        <span className={`kpi-icon kpi-tone-${tone}`}>{icon}</span>
        {hint && <span className="kpi-hint">{hint}</span>}
      </div>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
    </div>
  );
}
