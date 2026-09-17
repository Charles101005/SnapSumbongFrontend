import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MyReport.css';
import { getReports, getReportDetail, getHazardCategories } from '../../../api/reports';
import { hazardMarkerIcon } from '../../../utils/leafletHelpers';

const ROWS_PER_PAGE = 5; // Matches the backend's SmallListPagination page size.

// Mirrors HazardReports.Status on the backend. The API returns these raw
// values, so we map them to a display label and a badge class here.
const STATUS_META = {
  NEW: { label: 'New', badgeClass: 'status-new' },
  OPEN: { label: 'Open', badgeClass: 'status-open' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'status-in-progress' },
  PENDING: { label: 'Pending', badgeClass: 'status-pending' },
  ON_HOLD: { label: 'On Hold', badgeClass: 'status-on-hold' },
  UNDER_REPAIR: { label: 'Under Repair', badgeClass: 'status-under-repair' },
  RESOLVED: { label: 'Resolved', badgeClass: 'status-resolved' },
  CLOSED: { label: 'Closed', badgeClass: 'status-closed' },
};
const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

const getStatusLabel = (status) => STATUS_META[status]?.label || status;
const getStatusBadgeClass = (status) =>
  `status-badge ${STATUS_META[status]?.badgeClass || ''}`;

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const latLabel = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latLabel}, ${lonLabel}`;
};

export default function MyReport() {
  // --- Category options (for the filter dropdown) ---
  const [categories, setCategories] = useState([]);

  // --- Report list state (server-paginated/filtered) ---
  const [reports, setReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ count: 0, totalPages: 1 });

  // --- Summary stat cards ---
  // The API has no aggregate/stats endpoint, so these are derived from a few
  // lightweight requests (page_size=1, we only read the `count`).
  const [stats, setStats] = useState({ total: null, resolved: null, inProgress: null, pending: null });

  // --- Detail view state ---
  const [selectedReportRow, setSelectedReportRow] = useState(null); // the clicked row (has `category`)
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Temporary control states (bound to form controls)
  const [tempCategoryId, setTempCategoryId] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempSearch, setTempSearch] = useState('');

  // Applied filter states (used to actually query the API)
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  // Search has no server-side equivalent on this endpoint, so it only
  // filters within whatever page is currently loaded.
  const [appliedSearch, setAppliedSearch] = useState('');

  // --- Load hazard categories once, for the filter dropdown ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getHazardCategories();
        if (!cancelled) setCategories(data);
      } catch {
        // Non-critical — the filter dropdown just falls back to "All Categories".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Load the report list whenever filters or the page change ---
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError('');

    (async () => {
      try {
        const params = { page: currentPage };
        if (appliedCategoryId) params.category_id = appliedCategoryId;
        if (appliedStatus) params.status = appliedStatus;
        if (appliedDate) params.created_at = appliedDate;

        const data = await getReports(params);
        if (cancelled) return;
        setReports(data.results || []);
        setPageMeta({ count: data.count || 0, totalPages: data.total_pages || 1 });
      } catch {
        if (!cancelled) {
          setListError("Couldn't load your reports. Please try again.");
          setReports([]);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appliedCategoryId, appliedStatus, appliedDate, currentPage]);

  // --- Load summary counts once on mount ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [total, resolved, inProgress, pending] = await Promise.all([
          getReports({ page_size: 1 }),
          getReports({ page_size: 1, status: 'RESOLVED' }),
          getReports({ page_size: 1, status: 'IN_PROGRESS' }),
          getReports({ page_size: 1, status: 'PENDING' }),
        ]);
        if (cancelled) return;
        setStats({
          total: total.count,
          resolved: resolved.count,
          inProgress: inProgress.count,
          pending: pending.count,
        });
      } catch {
        // Leave stats blank rather than showing misleading numbers.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleApplyFilters = () => {
    setAppliedCategoryId(tempCategoryId);
    setAppliedStatus(tempStatus);
    setAppliedDate(tempDate);
    setAppliedSearch(tempSearch);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setTempCategoryId('');
    setTempStatus('');
    setTempDate('');
    setTempSearch('');

    setAppliedCategoryId('');
    setAppliedStatus('');
    setAppliedDate('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // Client-side search over just the currently-loaded page.
  const visibleReports = useMemo(() => {
    if (!appliedSearch) return reports;
    const q = appliedSearch.toLowerCase();
    return reports.filter(
      (report) =>
        report.report_number.toLowerCase().includes(q) ||
        report.category.toLowerCase().includes(q)
    );
  }, [reports, appliedSearch]);

  const totalPages = Math.max(1, pageMeta.totalPages);
  const startRow = pageMeta.count === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(currentPage * ROWS_PER_PAGE, pageMeta.count);

  const handleViewDetails = useCallback(async (report) => {
    setSelectedReportRow(report);
    setSelectedReportDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await getReportDetail(report.report_number);
      setSelectedReportDetail(data);
    } catch {
      setDetailError("Couldn't load this report's details. Please go back and try again.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleBackToList = () => {
    setSelectedReportRow(null);
    setSelectedReportDetail(null);
    setDetailError('');
  };

  // --- DETAIL VIEW ---
  if (selectedReportRow) {
    return (
      <div className="reports-detail-container">
        <button className="back-link-btn" onClick={handleBackToList}>
          &larr; Back to All Reports
        </button>

        {detailLoading && <p className="category-loading-state">Loading report details...</p>}
        {detailError && <div className="form-error-banner">{detailError}</div>}

        {selectedReportDetail && (
          <div className="detail-layout">
            {/* Main Detail Column */}
            <div className="detail-main-column">
              {/* Status Header Card */}
              <div className="card report-status-card">
                <div className="status-header-info">
                  <div className="status-icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div>
                    <span className="report-id-sub">Report ID: {selectedReportDetail.report_number}</span>
                    <h2>{getStatusLabel(selectedReportDetail.status)}</h2>
                  </div>
                </div>
                <span className={getStatusBadgeClass(selectedReportDetail.status)}>
                  {getStatusLabel(selectedReportDetail.status)}
                </span>
              </div>

              {/* Resolution Timeline */}
              <div className="card timeline-card">
                <h3>RESOLUTION TIMELINE</h3>
                <div className="timeline-stepper">
                  {(selectedReportDetail.status_timeline || []).map((step, idx) => (
                    <div key={idx} className="timeline-step completed">
                      <div className="step-node">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="step-label">{getStatusLabel(step.status)}</div>
                      <div className="step-date">{formatDate(step.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Original Report Submission */}
              <div className="card submission-card">
                <h3>Original Report Submission</h3>
                <div className="submission-content-grid">
                  <div className="photos-column">
                    {selectedReportDetail.image_urls && selectedReportDetail.image_urls.length > 0 ? (
                      <div className="photo-grid">
                        {selectedReportDetail.image_urls.map((src, i) => (
                          <img key={i} src={src} alt={`Submission proof ${i + 1}`} />
                        ))}
                      </div>
                    ) : (
                      <div className="no-photos-placeholder">No Photos Attached</div>
                    )}

                    <div className="gps-location-box">
                      <div className="gps-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                          <path d="M12 22s8-7.58 8-13a8 8 0 1 0-16 0c0 5.42 8 13 8 13Z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <strong>GPS Coordinates</strong>
                      </div>
                      <span className="coords-text">
                        {formatCoordinates(selectedReportDetail.latitude, selectedReportDetail.longitude)}
                      </span>
                      <span className="address-text">{selectedReportDetail.address}</span>
                    </div>
                  </div>

                  <div className="details-column">
                    <div className="user-description-section">
                      <h4>USER DESCRIPTION</h4>
                      <p>"{selectedReportDetail.description}"</p>
                    </div>

                    <div className="map-view-section">
                      <h4>ATTACHED MAP VIEW</h4>
                      <div className="map-preview-box">
                        <MapContainer
                          key={`${selectedReportDetail.latitude}-${selectedReportDetail.longitude}`}
                          center={[
                            Number(selectedReportDetail.latitude),
                            Number(selectedReportDetail.longitude),
                          ]}
                          zoom={16}
                          style={{ width: '100%', height: '100%' }}
                          zoomControl={false}
                          dragging={false}
                          scrollWheelZoom={false}
                          doubleClickZoom={false}
                          touchZoom={false}
                          boxZoom={false}
                          keyboard={false}
                          attributionControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker
                            position={[
                              Number(selectedReportDetail.latitude),
                              Number(selectedReportDetail.longitude),
                            ]}
                            icon={hazardMarkerIcon}
                          />
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel: LGU Resolution Proof */}
            <div className="detail-side-column">
              <div className="card resolution-proof-card">
                <h3>LGU Resolution Proof</h3>
                <div className="proof-placeholder-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <p>Photo of the repair will appear here once the case is marked 'Resolved'</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="reports-list-container">
      <div className="page-header">
        <h1>All Reports</h1>
        <p>Track and manage your submitted hazard reports.</p>
      </div>

      {/* Stats Summary Cards */}
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
            <div className="stat-value">{stats.total ?? '—'}</div>
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
            <div className="stat-value">{stats.resolved ?? '—'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon in-progress-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <span className="stat-label">IN PROGRESS</span>
            <div className="stat-value">{stats.inProgress ?? '—'}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <span className="stat-label">PENDING</span>
            <div className="stat-value">{stats.pending ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card filters-card">
        <div className="filter-group">
          <label>Category</label>
          <select value={tempCategoryId} onChange={(e) => setTempCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.hazard_id} value={cat.hazard_id}>
                {cat.hazard_name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Date Submitted</label>
          <input
            type="date"
            value={tempDate}
            onChange={(e) => setTempDate(e.target.value)}
          />
        </div>

        <div className="filter-group search-filter-group">
          <label>Search</label>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by Report ID or Category"
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-apply" onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="btn-reset" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="card table-card">
        <table className="reports-table">
          <thead>
            <tr>
              <th>REPORT ID</th>
              <th>CATEGORY</th>
              <th>DATE SUBMITTED</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan="5" className="empty-table-message">Loading reports...</td>
              </tr>
            ) : listError ? (
              <tr>
                <td colSpan="5" className="empty-table-message">{listError}</td>
              </tr>
            ) : visibleReports.length > 0 ? (
              visibleReports.map((report) => (
                <tr key={report.report_number}>
                  <td className="report-id-cell">{report.report_number}</td>
                  <td>{report.category}</td>
                  <td>{formatDate(report.created_at)}</td>
                  <td>
                    <span className={getStatusBadgeClass(report.status)}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-view-btn"
                      onClick={() => handleViewDetails(report)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table-message">No reports found matching your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span className="pagination-info">
          Showing {startRow} to {endRow} of {pageMeta.count} reports
        </span>
        <div className="pagination-buttons">
          <button className="pagination-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}