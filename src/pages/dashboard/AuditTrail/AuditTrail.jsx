import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AuditTrail.css";

export default function AuditTrail() {
  return (
    <DashboardLayout title="Audit Trail">
      <div className="section-header">
        <h2 className="section-title">Audit Trail</h2>
        <p className="section-subtitle">View system activity logs and changes.</p>
      </div>

      <div className="analytics-placeholder">
        <p>Audit Trail content will be implemented here.</p>
      </div>
    </DashboardLayout>
  );
}
