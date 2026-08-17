import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { refreshToken } from "./api/login";
import { setAccessToken } from "./api/authToken";
import LoginPage from "./pages/Login/LoginPage";
import Register from "./pages/Register/Register";
import ResetPass from "./pages/ResetPass/ResetPass";
import VerifyEmail from "./pages/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/NewPass/NewPass";
import MonitoringDashboard from "./pages/Monitoring/MonitoringDashboard";
import ReportManagement from "./pages/ReportManagement/ReportManagement";
import ReportsHistory from "./pages/Monitoring/ReportsHistory";

import ReportHazards from "./pages/ReportHazards/ReportHazards";
import PinLocation from "./pages/PinLocation/PinLocation";
import ReportSubmitted from "./pages/SubmitReport/ReportSubmitted";

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
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/report-management" element={<ReportManagement />} />
            <Route path="/monitoring/history" element={<ReportsHistory />} />
        </Routes>
    );
}

export default App;