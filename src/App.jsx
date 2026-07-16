import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import Register from "./pages/Register/Register";
import ResetPass from "./pages/ResetPass/ResetPass";

function App() {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ResetPass />} />
        </Routes>
    );
}

export default App