import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./Analytics.css";

export default function Analytics() {
  return (
    <DashboardLayout title="Monitoring Dashboard">
      <div className="section-header">
        <h2 className="section-title">Analytics</h2>
        <p className="section-subtitle">View detailed analytics and insights for hazard reports.</p>
      </div>

      <div className="analytics-placeholder">
        <p>Analytics content will be implemented here.</p>
      </div>
    </DashboardLayout>
  );
}
