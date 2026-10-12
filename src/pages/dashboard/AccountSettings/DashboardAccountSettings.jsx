import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import AccountSettings from "../../shared/AccountSettings/AccountSettings";
import { useAuth } from "../../../context/authContext";
import "./DashboardAccountSettings.css";

// Staff-facing entry point for the shared AccountSettings. DashboardLayout
// already renders the page title in its header, so the wrapper hides the
// shared component's own header to avoid a duplicate "Account Settings"
// heading. `variant="staff"` drops the self-service Danger Zone (admin-
// managed status) and shows the employee's read-only role badge.
export default function DashboardAccountSettings() {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Account Settings">
      <div className="staff-account-settings">
        <AccountSettings variant="staff" role={user?.role} />
      </div>
    </DashboardLayout>
  );
}
