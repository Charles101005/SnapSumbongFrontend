import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { refreshToken } from "./api/login";
import { setAccessToken } from "./api/authToken";
import LoginPage from "./pages/auth/Login/LoginPage";
import Register from "./pages/auth/Register/Register";
import ResetPass from "./pages/auth/ResetPass/ResetPass";
import VerifyEmail from "./pages/auth/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/auth/NewPass/NewPass";
import MonitoringDashboard from "./pages/dashboard/Monitoring/MonitoringDashboard";
import ReportManagement from "./pages/dashboard/ReportManagement/ReportManagement";
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

import ReportHazards from "./pages/citizen/ReportHazards/ReportHazards";
import PinLocation from "./pages/citizen/PinLocation/PinLocation";
import ReportSubmitted from "./pages/citizen/SubmitReport/ReportSubmitted";
import CitizenLayout from "./components/citizens/CitizenLayout/CitizenLayout";
import MyReport from "./pages/citizen/MyReport/MyReport";
import AccountSettingsRoute from "./pages/shared/AccountSettings/AccountSettingsRoute";

function App() {
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await refreshToken();
                if (!cancelled) setAccessToken(data.access);
            } catch (err) {
                // no valid refresh cookie yet — user just isn't logged in, that's fine
            } finally {
                if (!cancelled) setAuthChecked(true);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    if (!authChecked) {
        return null; // or a loading spinner if you'd rather show one
    }

    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/" element={<MonitoringDashboard />} /> 
            <Route path="/" element={<ReportHazards />} /> 
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/new-password" element={<NewPass />} />

            {/* Citizen portal pages share one sidebar layout, each with its own URL */}
            <Route element={<CitizenLayout />}>
                <Route path="/report-hazards" element={<ReportHazards />} />
                <Route path="/my-reports" element={<MyReport />} />
                <Route path="/account-settings" element={<AccountSettingsRoute />} />
            </Route>

            <Route path="/pin-location" element={<PinLocation />} />
            <Route path="/report-submitted" element={<ReportSubmitted />} />
            <Route path="/dashboard/users/roles" element={<ViewRoles />} />
            <Route path="/dashboard/users/roles/add" element={<AddNewRole />} />
            <Route path="/dashboard/users/roles/:id" element={<ManageRole />} />
            <Route path="/dashboard/users/employees" element={<ManageEmployees />} />
            <Route path="/dashboard/users/employees/add" element={<AddEmployee />} />
            <Route path="/dashboard/users/employees/created" element={<EmployeeCreated />} />
            <Route path="/dashboard/users/employees/:id" element={<EmployeeProfile />} />
            <Route path="/dashboard/users/citizens" element={<ManageCitizens />} />
            <Route path="/dashboard/users/citizens/:id" element={<CitizenProfile />} />
            <Route path="/dashboard/report-management" element={<ReportManagement />} />
            <Route path="/dashboard/monitoring" element={<MonitoringDashboard />} />
            <Route path="/dashboard/monitoring/history" element={<ReportsHistory />} />
            <Route path="/dashboard/monitoring/report-details" element={<ReportDetail />} />
            <Route path="/dashboard/monitoring/analytics" element={<Analytics />} />
            <Route path="/dashboard/audit-trail" element={<AuditTrail />} />
        </Routes>
    );
}

export default App;