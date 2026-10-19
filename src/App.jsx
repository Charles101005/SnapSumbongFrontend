import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import RequireAuth from "./components/guards/RequireAuth";
import RequirePermission from "./components/guards/RequirePermission";
import { PERMISSIONS } from "./shared/constants";
import LoginPage from "./pages/auth/Login/LoginPage";
import Register from "./pages/auth/Register/Register";
import ResetPass from "./pages/auth/ResetPass/ResetPass";
import VerifyEmail from "./pages/auth/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/auth/NewPass/NewPass";
import OperationsDashboard from "./pages/dashboard/Operations/OperationsDashboard";
import Analytics from "./pages/dashboard/Operations/Analytics";
import RoleManagement from "./pages/dashboard/RoleManagement/RoleManagement";
import AddNewRole from "./pages/dashboard/RoleManagement/AddNewRole";
import ManageRole from "./pages/dashboard/RoleManagement/ManageRole";
import ManageEmployees from "./pages/dashboard/UserManagement/ManageEmployees";
import AddEmployee from "./pages/dashboard/UserManagement/AddEmployee";
import EmployeeCreated from "./pages/dashboard/UserManagement/EmployeeCreated";
import EmployeeProfile from "./pages/dashboard/UserManagement/EmployeeProfile";
import ManageCitizens from "./pages/dashboard/UserManagement/ManageCitizens";
import AuditTrail from "./pages/dashboard/AuditTrail/AuditTrail";
import DashboardHome from "./pages/dashboard/Home/DashboardHome";
import DashboardAccountSettings from "./pages/dashboard/AccountSettings/DashboardAccountSettings";

import HomePage from "./pages/citizen/Home/HomePage";
import ReportHazards from "./pages/citizen/ReportHazards/ReportHazards";
import PinLocation from "./pages/citizen/PinLocation/PinLocation";
import ReportSubmitted from "./pages/citizen/SubmitReport/ReportSubmitted";
import CitizenLayout from "./components/citizens/CitizenLayout/CitizenLayout";
import MyReport from "./pages/citizen/MyReport/MyReport";
import AccountSettingsRoute from "./pages/shared/AccountSettings/AccountSettingsRoute";

// Keeps old /dashboard/users/roles* bookmarks working after the Role
// Management section moved to /dashboard/role-management.
function OldRoleRedirect() {
    const { pathname } = useLocation();
    const tail = pathname.slice("/dashboard/users/roles".length);
    return <Navigate to={`/dashboard/role-management${tail}`} replace />;
}

function AppRoutes() {
    const { status } = useAuth();

    if (status === "loading") {
        return null;
    }

    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/new-password" element={<NewPass />} />

            {/* Citizen portal: requires a logged-in citizen */}
            <Route element={<RequireAuth role="citizen" />}>
                <Route element={<CitizenLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/report-hazards" element={<ReportHazards />} />
                    <Route path="/my-reports" element={<MyReport />} />
                    <Route path="/account-settings" element={<AccountSettingsRoute />} />
                </Route>
                <Route path="/pin-location" element={<PinLocation />} />
                <Route path="/report-submitted" element={<ReportSubmitted />} />
            </Route>

            {/* Staff portal: requires a logged-in staff member */}
            <Route element={<RequireAuth role="staff" />}>
                <Route path="/dashboard" element={<DashboardHome />} />
                {/* Role Management: standalone section (sidebar item above
                    Audit Trail), guarded per route group (any-of permission
                    semantics). Sidebar visibility is gated by the same
                    permissions via can() in Sidebar.jsx. */}
                <Route element={<RequirePermission permissions={[PERMISSIONS.ROLE_READ_ALL]} />}>
                    <Route path="/dashboard/role-management" element={<RoleManagement />} />
                    <Route element={<RequirePermission permissions={[PERMISSIONS.ROLE_CREATE]} />}>
                        <Route path="/dashboard/role-management/add" element={<AddNewRole />} />
                    </Route>
                    <Route element={<RequirePermission permissions={[PERMISSIONS.ROLE_UPDATE_ANY]} />}>
                        <Route path="/dashboard/role-management/:id" element={<ManageRole />} />
                    </Route>
                </Route>
                {/* Legacy role URLs (pre-Role-Management section) redirect. */}
                <Route path="/dashboard/users/roles" element={<OldRoleRedirect />} />
                <Route path="/dashboard/users/roles/*" element={<OldRoleRedirect />} />
                {/* User Management: guarded per route group (any-of permission
                    semantics). Sidebar visibility is gated by the same
                    permissions via can() in Sidebar.jsx. */}
                <Route element={<RequirePermission permissions={[PERMISSIONS.EMPLOYEE_READ_ALL]} />}>
                    <Route path="/dashboard/users/employees" element={<ManageEmployees />} />
                    <Route path="/dashboard/users/employees/:id" element={<EmployeeProfile />} />
                    <Route element={<RequirePermission permissions={[PERMISSIONS.EMPLOYEE_CREATE]} />}>
                        <Route path="/dashboard/users/employees/add" element={<AddEmployee />} />
                        <Route path="/dashboard/users/employees/created" element={<EmployeeCreated />} />
                    </Route>
                </Route>
                <Route element={<RequirePermission permissions={[PERMISSIONS.USER_READ_ALL]} />}>
                    <Route path="/dashboard/users/citizens" element={<ManageCitizens />} />
                </Route>
                {/* Citizen profile management now lives in a modal opened from
                    the Citizen Users table (same pattern as Reports Overview). */}
                {/* The standalone Report Management page now lives inside the
                    Operations Reports Overview table as a modal. */}
                <Route path="/dashboard/report-management" element={<Navigate to="/dashboard/operations" replace />} />
                <Route path="/dashboard/operations" element={<OperationsDashboard />} />
                {/* The standalone Report Detail page now lives inside the
                    Operations tables as a read-only modal. The legacy Report
                    History page was folded into Reports Overview (all statuses
                    show there), so old bookmarks land on Overview. */}
                <Route path="/dashboard/operations/history" element={<Navigate to="/dashboard/operations" replace />} />
                <Route path="/dashboard/operations/report-details" element={<Navigate to="/dashboard/operations" replace />} />
                <Route path="/dashboard/operations/analytics" element={<Analytics />} />
                <Route path="/dashboard/audit-trail" element={<AuditTrail />} />
                <Route path="/dashboard/account-settings" element={<DashboardAccountSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;