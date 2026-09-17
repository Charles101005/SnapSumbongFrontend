import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getCurrentUser } from "../../../api/accounts";
// Reuses the existing "app shell" (.app / .sidebar / .main) styles that used
// to live only inside ReportHazards — the DOM structure below is unchanged,
// just moved up a level so it can wrap more than one route.
import "../../../pages/citizen/ReportHazards/ReportHazards.css";

// This layout is shared by every citizen-facing page (Report Hazard, My
// Reports, Account Settings) so the sidebar/nav only has to be built once,
// and each page gets its own real URL instead of being an internal view
// switch inside a single page component.
export default function CitizenLayout() {
  const [user, setUser] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getCurrentUser();
        if (cancelled) return;
        setUser({
          firstName: data.first_name || "",
          middleName: data.middle_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          role: data.role || "",
        });
      } catch {
        // Not logged in, or session expired — leave the sidebar blank rather than guessing.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const navItemClass = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;
  const accountSettingsClass = ({ isActive }) => `account-settings ${isActive ? "active" : ""}`;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13Z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span>SnapSumbong</span>
          </div>

          <nav className="nav">
            {/* My Reports Option */}
            <NavLink to="/my-reports" className={navItemClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              My Reports
            </NavLink>

            {/* Report Hazard Option */}
            <NavLink to="/report-hazards" className={navItemClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Report Hazard
            </NavLink>
          </nav>
        </div>

        <div className="user-card">
          <div className="avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="user-meta">
            <span className="user-name">{fullName || "Guest"}</span>
            <span className="user-role">{user.role || "Citizen"}</span>
            <NavLink to="/account-settings" className={accountSettingsClass}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Account Settings
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Routed Content Pane — each citizen page renders here via its own URL */}
      <main className="main">
        <Outlet context={{ user, updateUser }} />
      </main>
    </div>
  );
}