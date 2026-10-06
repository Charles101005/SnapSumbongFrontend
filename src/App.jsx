import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import RequireAuth from "./components/guards/RequireAuth";
import LoginPage from "./pages/auth/Login/LoginPage";
import Register from "./pages/auth/Register/Register";
import ResetPass from "./pages/auth/ResetPass/ResetPass";
import VerifyEmail from "./pages/auth/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/auth/NewPass/NewPass";
import MonitoringDashboard from "./pages/dashboard/Monitoring/MonitoringDashboard";
import ReportsHistory from "./pages/dashboard/Monitoring/ReportsHistory";
import ReportDetail from "./pages/dashboard/Monitoring/ReportDetail";
import Analytics from "./pages/dashboard/Monitoring/Analytics";
import ViewRoles from "./pages/dashboard/UserManagement/ViewRoles";
import AddNewRole from "./pages/dashboard/UserManagement/AddNewRole";
import ManageRole from "./pages/dashboard/UserManagement/ManageRole";
import ManageEmployees from "./pages/dashboard/UserManagement/ManageEmployees";
import AddEmployee from "./pages/dashboard/UserManagement/AddEmployee";
import EmployeeCreated from "./pages/dashboard/UserManagement/EmployeeCreated";
import EmployeeProfile from "./pages/dashboard/UserManagement/EmployeeProfile";
import ManageCitizens from "./pages/dashboard/UserManagement/ManageCitizens";
import CitizenProfile from "./pages/dashboard/UserManagement/CitizenProfile";
import AuditTrail from "./pages/dashboard/AuditTrail/AuditTrail";
import DashboardHome from "./pages/dashboard/Home/DashboardHome";

import HomePage from "./pages/citizen/Home/HomePage";
import ReportHazards from "./pages/citizen/ReportHazards/ReportHazards";
import PinLocation from "./pages/citizen/PinLocation/PinLocation";
import ReportSubmitted from "./pages/citizen/SubmitReport/ReportSubmitted";
import CitizenLayout from "./components/citizens/CitizenLayout/CitizenLayout";
import MyReport from "./pages/citizen/MyReport/MyReport";
import AccountSettingsRoute from "./pages/shared/AccountSettings/AccountSettingsRoute";

// Old /dashboard/monitoring[/*] URLs (bookmarks, in-app links) keep working:
// preserve the path suffix and query string when forwarding to /dashboard/operations.
const LEGACY_PREFIX = "/dashboard/monitoring";
function LegacyMonitoringRedirect() {
    const location = useLocation();
    const suffix = location.pathname.startsWith(LEGACY_PREFIX)
        ? location.pathname.slice(LEGACY_PREFIX.length).replace(/^\//, "")
        : "";
    const target = `/dashboard/operations${suffix ? `/${suffix}` : ""}${location.search}`;
    return <Navigate to={target} replace />;
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
                <Route path="/dashboard/users/roles" element={<ViewRoles />} />
                <Route path="/dashboard/users/roles/add" element={<AddNewRole />} />
                <Route path="/dashboard/users/roles/:id" element={<ManageRole />} />
                <Route path="/dashboard/users/employees" element={<ManageEmployees />} />
                <Route path="/dashboard/users/employees/add" element={<AddEmployee />} />
                <Route path="/dashboard/users/employees/created" element={<EmployeeCreated />} />
                <Route path="/dashboard/users/employees/:id" element={<EmployeeProfile />} />
                <Route path="/dashboard/users/citizens" element={<ManageCitizens />} />
                <Route path="/dashboard/users/citizens/:id" element={<CitizenProfile />} />
                {/* The standalone Report Management page now lives inside the
                    Operations Reports Overview table as a modal. */}
                <Route path="/dashboard/report-management" element={<Navigate to="/dashboard/operations" replace />} />
                <Route path="/dashboard/operations" element={<MonitoringDashboard />} />
                <Route path="/dashboard/operations/history" element={<ReportsHistory />} />
                <Route path="/dashboard/operations/report-details" element={<ReportDetail />} />
                <Route path="/dashboard/operations/analytics" element={<Analytics />} />
                <Route path="/dashboard/monitoring" element={<LegacyMonitoringRedirect />} />
                <Route path="/dashboard/monitoring/*" element={<LegacyMonitoringRedirect />} />
                <Route path="/dashboard/audit-trail" element={<AuditTrail />} />
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