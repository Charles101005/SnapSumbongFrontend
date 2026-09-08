import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./UserManagement.css";

export default function UserManagement() {
  return (
    <DashboardLayout title="User Management">
      <div className="section-header">
        <h2 className="section-title">User Management</h2>
        <p className="section-subtitle">Manage system users and their roles.</p>
      </div>

      <div className="analytics-placeholder">
        <p>User Management content will be implemented here.</p>
      </div>
    </DashboardLayout>
  );
}
