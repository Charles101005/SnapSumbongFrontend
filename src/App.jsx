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
import Analytics from "./pages/dashboard/Monitoring/Analytics";
import UserManagement from "./pages/dashboard/UserManagement/UserManagement";
import AuditTrail from "./pages/dashboard/AuditTrail/AuditTrail";

import ReportHazards from "./pages/citizen/ReportHazards/ReportHazards";
import PinLocation from "./pages/citizen/PinLocation/PinLocation";
import ReportSubmitted from "./pages/citizen/SubmitReport/ReportSubmitted";

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
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/new-password" element={<NewPass />} />

            <Route path="/report-hazards" element={<ReportHazards />} />
            <Route path="/pin-location" element={<PinLocation />} />
            <Route path="/report-submitted" element={<ReportSubmitted />} />
            <Route path="/dashboard/users" element={<UserManagement />} />
            <Route path="/dashboard/report-management" element={<ReportManagement />} />
            <Route path="/dashboard/monitoring" element={<MonitoringDashboard />} />
            <Route path="/dashboard/monitoring/history" element={<ReportsHistory />} />
            <Route path="/dashboard/monitoring/analytics" element={<Analytics />} />
            <Route path="/dashboard/audit-trail" element={<AuditTrail />} />
        </Routes>
    );
}

export default App;