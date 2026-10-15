import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getCurrentUser, getProfile } from "../../../api/accounts";
import { getMyModerationSummary, getMyWarnings } from "../../../api/warnings";
import { useAuth } from "../../../context/authContext";
// Reuses the existing "app shell" (.app / .sidebar / .main) styles that used
// to live only inside ReportHazards — the DOM structure below is unchanged,
// just moved up a level so it can wrap more than one route.
import "../../../pages/citizen/ReportHazards/ReportHazards.css";
import "./CitizenLayout.css";

// This layout is shared by every citizen-facing page (Report Hazard, My
// Reports, Account Settings) so the sidebar/nav only has to be built once,
// and each page gets its own real URL instead of being an internal view
// switch inside a single page component.
export default function CitizenLayout() {
  const { logout } = useAuth();
  const [user, setUser] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    role: "",
    profilePicture: "",
  });

  // Mobile sidebar toggle — the sidebar is off-canvas on small screens and
  // slides in via the .open class, dismissed by the overlay or a nav click.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Moderation state (Flag -> Warn -> Ban): the amber banner shows whenever
  // the citizen has warnings; the details list is fetched lazily on expand.
  const [warningCount, setWarningCount] = useState(0);
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [warnings, setWarnings] = useState(null); // null = not fetched yet
  const [warningsError, setWarningsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getMyModerationSummary()
      .then((data) => {
        if (!cancelled) setWarningCount(Number(data?.warning_count || 0));
      })
      .catch(() => {
        // No banner rather than a broken one on network failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleWarnings = () => {
    const next = !warningsOpen;
    setWarningsOpen(next);
    if (next && warnings === null) {
      setWarningsError("");
      getMyWarnings()
        .then((data) => setWarnings(data?.warnings || []))
        .catch((err) => setWarningsError(err?.detail || err?.message || "Couldn't load your warnings."));
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [userResult, profileResult] = await Promise.allSettled([
          getCurrentUser(),
          getProfile(),
        ]);
        if (cancelled) return;
        if (userResult.status !== "fulfilled") return;
        const data = userResult.value;
        const profilePicture = profileResult.status === "fulfilled"
          ? profileResult.value.profile_picture || ""
          : "";
        setUser({
          firstName: data.first_name || "",
          middleName: data.middle_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          role: data.role || "",
          profilePicture,
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
  const closeSidebar = () => setSidebarOpen(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("Couldn't log out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <div className="app">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
            {/* Home Option */}
            <NavLink to="/home" className={navItemClass} onClick={closeSidebar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </NavLink>

            {/* My Reports Option */}
            <NavLink to="/my-reports" className={navItemClass} onClick={closeSidebar}>
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
            <NavLink to="/report-hazards" className={navItemClass} onClick={closeSidebar}>
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
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt=""
                onError={() => setUser((prev) => ({ ...prev, profilePicture: "" }))}
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            )}
          </div>
          <div className="user-meta">
            <span className="user-name">{fullName || "Guest"}</span>
            <span className="user-role">{user.role || "Citizen"}</span>
            <NavLink to="/account-settings" className={accountSettingsClass} onClick={closeSidebar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Account Settings
            </NavLink>
            <button className="user-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
            {logoutError && <span className="user-logout-error" role="alert">{logoutError}</span>}
          </div>
        </div>
      </aside>

      {/* Routed Content Pane — each citizen page renders here via its own URL */}
      <main className="main">
        {/* Mobile hamburger button */}
        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {warningCount > 0 && (
          <div
            className={`citizen-warning-banner ${warningCount >= 3 ? "citizen-warning-banner-danger" : ""}`}
            role="status"
          >
            <div className="citizen-warning-banner-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="citizen-warning-banner-text">
                <strong>
                  {warningCount >= 3
                    ? `Your account has ${warningCount} warnings and is eligible for a ban.`
                    : `Your account has received ${warningCount} ${warningCount === 1 ? "warning" : "warnings"}.`}
                </strong>
                <span>
                  {warningCount >= 3
                    ? "Further reports flagged as invalid will likely result in your account being banned from SnapSumbong."
                    : "Warnings are issued when a report you filed is flagged as invalid. Reaching 3 warnings may ban your account."}
                </span>
              </div>
              <button
                type="button"
                className="citizen-warning-toggle"
                onClick={toggleWarnings}
                aria-expanded={warningsOpen}
              >
                {warningsOpen ? "Hide details" : "View warnings"}
              </button>
            </div>

            {warningsOpen && (
              <div className="citizen-warning-details">
                {warningsError ? (
                  <p className="citizen-warning-error">{warningsError}</p>
                ) : warnings === null ? (
                  <p className="citizen-warning-loading">Loading warnings...</p>
                ) : warnings.length === 0 ? (
                  <p className="citizen-warning-loading">No warnings on record.</p>
                ) : (
                  <ul className="citizen-warning-list">
                    {warnings.map((warning) => (
                      <li key={warning.warning_number} className="citizen-warning-item">
                        <div className="citizen-warning-item-top">
                          <span className="citizen-warning-number">{warning.warning_number}</span>
                          <span className="citizen-warning-date">
                            {new Date(warning.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="citizen-warning-reason">{warning.reason}</p>
                        {warning.report_number && (
                          <p className="citizen-warning-meta">Cited report {warning.report_number}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <Outlet context={{ user, updateUser, warningCount }} />
      </main>
    </div>
  );
}
