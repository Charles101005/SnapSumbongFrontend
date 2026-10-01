import { useState, useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getReports } from "../../../api/reports";
import { getReportMetrics } from "../../../api/analytics";
import "./HomePage.css";

// Same status mapping as MyReport — the API returns the raw backend values,
// and citizens see ASSIGNED as "Pending".
const STATUS_META = {
  NEW: { label: "New", badgeClass: "status-new" },
  ASSIGNED: { label: "Pending", badgeClass: "status-assigned" },
  UNDER_REVIEW: { label: "Under Review", badgeClass: "status-under-review" },
  ON_HOLD: { label: "On Hold", badgeClass: "status-on-hold" },
  DISPATCHED: { label: "Dispatched", badgeClass: "status-dispatched" },
  RESOLVED: { label: "Resolved", badgeClass: "status-resolved" },
  CLOSED: { label: "Closed", badgeClass: "status-closed" },
};

const normalizeStatus = (status) =>
  String(status || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const getStatusLabel = (status) => STATUS_META[normalizeStatus(status)]?.label || status;
const getStatusBadgeClass = (status) =>
  `status-badge ${STATUS_META[normalizeStatus(status)]?.badgeClass || ""}`;

const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const RECENT_LIMIT = 5;

export default function HomePage() {
  const { user } = useOutletContext();

  // Summary stat cards — GET /analytics/hazard-report/ is already scoped to
  // this citizen's own reports by the backend.
  const [stats, setStats] = useState({
    total: null,
    resolved: null,
    underReview: null,
    dispatched: null,
  });

  // Recent reports list (first page, newest first).
  const [recentReports, setRecentReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getReportMetrics();
        if (cancelled) return;
        setStats({
          total: data.total_count,
          resolved: data.count_by_status?.resolved ?? 0,
          underReview: data.count_by_status?.under_review ?? 0,
          dispatched: data.count_by_status?.dispatched ?? 0,
        });
      } catch {
        // Leave stats blank rather than showing misleading numbers.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getReports({ page: 1 });
        if (cancelled) return;
        setRecentReports((data.results || []).slice(0, RECENT_LIMIT));
      } catch {
        if (!cancelled) {
          setListError("Couldn't load your recent reports. Please try again.");
          setRecentReports([]);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.firstName || "";

  return (
    <div className="home-page">
      <div className="page-header-group">
        <div className="eyebrow">SNAPSUMBONG RESIDENT PORTAL</div>
        <h1>{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
      </div>

      {/* Quick actions */}
      <section className="card home-hero">
        <div className="home-hero-copy">
          <div className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            See a hazard around you?
          </div>
          <p>
            File a report with a photo and location — your LGU can review it and
            dispatch the right team faster.
          </p>
        </div>
        <div className="home-hero-actions">
          <Link to="/report-hazards" className="home-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Report a Hazard
          </Link>
          <Link to="/my-reports" className="home-btn-secondary">
            View My Reports
          </Link>
        </div>
      </section>

      {/* Stats summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <span className="stat-label">TOTAL REPORTS</span>
            <div className="stat-value">{stats.total ?? "—"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <span className="stat-label">RESOLVED</span>
            <div className="stat-value">{stats.resolved ?? "—"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon under-review-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <span className="stat-label">UNDER REVIEW</span>
            <div className="stat-value">{stats.underReview ?? "—"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon dispatched-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12h15" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </div>
          <div>
            <span className="stat-label">DISPATCHED</span>
            <div className="stat-value">{stats.dispatched ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <section className="card">
        <div className="section-header">
          <div className="section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Recent Reports
          </div>
          <Link to="/my-reports" className="home-view-all">
            View all
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {listLoading ? (
          <p className="home-muted">Loading recent reports…</p>
        ) : listError ? (
          <p className="home-muted home-error">{listError}</p>
        ) : recentReports.length === 0 ? (
          <div className="home-empty">
            <p>No reports yet.</p>
            <p>When you report a hazard, it will show up here so you can track its progress.</p>
            <Link to="/report-hazards" className="home-btn-primary">
              Report your first hazard
            </Link>
          </div>
        ) : (
          <div className="home-recent-list">
            <div className="home-recent-row home-recent-head" aria-hidden="true">
              <span>REPORT ID</span>
              <span>CATEGORY</span>
              <span>DATE SUBMITTED</span>
              <span>STATUS</span>
            </div>
            {recentReports.map((report) => (
              <div className="home-recent-row" key={report.report_number}>
                <span className="home-report-id">{report.report_number}</span>
                <span className="home-report-category">{report.category}</span>
                <span className="home-report-date">{formatDate(report.created_at)}</span>
                <span>
                  <span className={getStatusBadgeClass(report.status)}>
                    {getStatusLabel(report.status)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
