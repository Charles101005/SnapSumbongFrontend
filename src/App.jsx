import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import Register from "./pages/Register/Register";
import ResetPass from "./pages/ResetPass/ResetPass";
import VerifyEmail from "./pages/ResetPassVerify/VerifyEmail";
import NewPass from "./pages/NewPass/NewPass";

import ReportHazards from "./pages/ReportHazards/ReportHazards";
import PinLocation from "./pages/PinLocation/PinLocation"; 
import ReportSubmitted from "./pages/SubmitReport/ReportSubmitted"; // Added import

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/new-password" element={<NewPass />} />

            <Route path="/report-hazards" element={<ReportHazards />} />
            <Route path="/pin-location" element={<PinLocation />} />
            <Route path="/report-submitted" element={<ReportSubmitted />} /> {/* Added route */}
        </Routes>
    );
}

export default App;