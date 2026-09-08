import Sidebar from "../Sidebar/Sidebar";
import "./DashboardLayout.css";

export default function DashboardLayout({ title, children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-page-title">{title}</h1>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
