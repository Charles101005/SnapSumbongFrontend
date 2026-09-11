import { Link, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./EmployeeCreated.css";

function CheckCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function EmployeeCreated() {
  const location = useLocation();
  const navigate = useNavigate();
  const { firstName = "", middleName = "", lastName = "", role = "", email = "" } = location.state || {};

  const fullName = [firstName, middleName ? `${middleName.charAt(0)}.` : "", lastName].filter(Boolean).join(" ");

  return (
    <DashboardLayout title="Account Created">
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircleIcon />
          </div>

          <h1 className="success-title">Account Created Successfully</h1>
          <p className="success-subtitle">
            The new employee account has been provisioned and is ready for use.
          </p>

          <div className="account-details">
            <h3 className="details-heading">Account Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">EMPLOYEE NAME</span>
                <span className="detail-value">{fullName || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ASSIGNED ROLE</span>
                <span className="detail-value">{role || "N/A"}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">EMAIL ADDRESS</span>
                <span className="detail-value">{email || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="security-notice">
            <div className="security-notice-header">
              <LockIcon />
              <span className="security-notice-title">Security Notice</span>
            </div>
            <p className="security-notice-text">
              A temporary default password has been generated and sent to the employee's email. They will be required to change it upon their first login.
            </p>
          </div>

          <div className="success-actions">
            <button
              className="btn-back-to-list"
              onClick={() => navigate("/dashboard/users/employees")}
            >
              Back to User List
            </button>
            <button
              className="btn-create-another"
              onClick={() => navigate("/dashboard/users/employees/add")}
            >
              Create Another Account
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
