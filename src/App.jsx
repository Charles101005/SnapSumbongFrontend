import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import Register from "./pages/Register/Register";
import ResetPass from "./pages/ResetPass/ResetPass";
import VerifyEmail from "./pages/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/NewPass/NewPass";
import MonitoringDashboard from "./pages/Monitoring/MonitoringDashboard";
import ReportManagement from "./pages/ReportManagement/ReportManagement";
import ReportsHistory from "./pages/Monitoring/ReportsHistory";

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/new-password" element={<NewPass />} />
            <Route path="/monitoring" element={<MonitoringDashboard />} />
            <Route path="/report-management" element={<ReportManagement />} />
            <Route path="/monitoring/history" element={<ReportsHistory />} />
        </Routes>
    );
}

export default App