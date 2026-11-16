import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MapAutoResize from '../../../components/shared/MapAutoResize';
import Pagination from '../../../components/shared/Pagination';
import ReportTimeline from '../../../components/shared/ReportTimeline';
import './MyReport.css';
import { getReports, getReportDetail, getHazardCategories, confirmReportResolution } from '../../../api/reports';
import { getReportMetrics } from '../../../api/analytics';
import { hazardMarkerIcon } from '../../../utils/leafletHelpers';
import { toISODate, validateCustomRange } from '../../../utils/dates';
import { formatDueDateLong, slaBadge } from '../../../utils/sla';
import {
  ACTIVE_STATUS_KEYS,
  REPORT_STATUS_META,
  REPORT_STATUS_ORDER,
  activityLabel,
  isInvalidStatus,
  normalizeStatus,
  statusBadgeClass,
  statusDescription,
  statusLabel,
} from '../../../shared/reportStatuses';
import { buildReportTimeline } from '../../../shared/reportTimeline';

const ROWS_PER_PAGE = 5; // Matches the backend's SmallListPagination page size.

const STATUS_OPTIONS = REPORT_STATUS_ORDER.map((status) => ({
  value: status,
  label: REPORT_STATUS_META[status].label,
}));

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
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
  // Backed by GET /analytics/hazard-report/, which returns the authoritative
  // per-status counts already scoped to this user by the backend.
  const [stats, setStats] = useState({ total: null, active: null, resolved: null, invalid: null });

  // --- Detail view state ---
  const [selectedReportRow, setSelectedReportRow] = useState(null); // the clicked row (has `category`)
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  // Resolution-timeline "View Details": the step whose status-change
  // dialog is open (null = closed).
  const [timelineStepDetail, setTimelineStepDetail] = useState(null);

  // --- Citizen confirmation (close a resolved report) ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  // Centered success popup shown after a confirmed closure; dismissed by
  // tapping outside it (or Escape), which returns to the list view.
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);

  // Bumped after a successful confirmation so the list/stats effects refetch
  // (the report just moved Resolved -> Closed; view-only state changes don't
  // re-run those effects on their own).
  const [refreshTick, setRefreshTick] = useState(0);

  // Temporary control states (bound to form controls)
  const [tempCategoryId, setTempCategoryId] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempSearch, setTempSearch] = useState('');

  // Applied filter states (used to actually query the API)
  const [appliedCategoryId, setAppliedCategoryId] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
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
        const params = { page: currentPage, page_size: ROWS_PER_PAGE };
        if (appliedCategoryId) params.category_id = appliedCategoryId;
        if (appliedStatus) params.status = appliedStatus;
        if (appliedDate) params.created_at = appliedDate;
        if (appliedSearch) params.q = appliedSearch;

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
  }, [appliedCategoryId, appliedStatus, appliedDate, appliedSearch, currentPage, refreshTick]);

  // --- Load summary counts once on mount ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getReportMetrics();
        if (cancelled) return;
        const by = data.count_by_status || {};
        // "Active" = still in progress: everything except Resolved, Closed, Invalid.
        const active = ACTIVE_STATUS_KEYS
          .reduce((sum, key) => sum + (Number(by[key]) || 0), 0);
        setStats({
          total: data.total_count,
          active,
          resolved: by.resolved ?? 0,
          invalid: by.invalid ?? 0,
        });
      } catch {
        // Leave stats blank rather than showing misleading numbers.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  // Custom-range standard — constrain → validate → block (see utils/dates.js).
  // This filter has a single bound, so the rule reduces to "nothing in the
  // future"; the picker is capped at today and validateCustomRange catches
  // anything typed/pasted past it. The input keeps the user's value and the
  // Apply button below stays blocked while the message is visible.
  const dateError = validateCustomRange(tempDate, '');

  const handleApplyFilters = () => {
    // Blocked while the date is invalid — the inline error under the field
    // explains why, and the draft keeps the typed value for correction.
    if (dateError) return;
    setAppliedCategoryId(tempCategoryId);
    setAppliedStatus(tempStatus);
    setAppliedDate(tempDate);
    setAppliedSearch(tempSearch);
    setCurrentPage(1);
  };

  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter'){
      handleApplyFilters();
      if (e.target.tagName === 'SELECT') e.preventDefault(); 
    } 
  }

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
    setTimelineStepDetail(null);
    setConfirmModalOpen(false);
    setConfirmError('');
  };

  // Closing the success popup (tap outside / Escape) returns to the list
  // and refetches it — the report just moved Resolved -> Closed.
  const dismissSuccessPopup = () => {
    setSuccessPopupOpen(false);
    handleBackToList();
    setRefreshTick((tick) => tick + 1);
  };

  // citizen step: confirm the completed works to close the report.
  const handleConfirmResolution = async () => {
    if (!selectedReportRow || confirmSubmitting) return;
    setConfirmSubmitting(true);
    setConfirmError('');
    try {
      await confirmReportResolution(selectedReportRow.report_number);
      setConfirmModalOpen(false);
      setSuccessPopupOpen(true);
    } catch (err) {
      setConfirmError(err?.detail || err?.message || 'Unable to confirm the resolution. Please try again.');
    } finally {
      setConfirmSubmitting(false);
    }
  };

  // --- Lightbox (photo viewer) + map modal state ---
  const [lightbox, setLightbox] = useState(null); // { images: string[], index: number }
  const [mapModalOpen, setMapModalOpen] = useState(false);

  const openLightbox = (images, index) => {
    if (!images || !images.length) return;
    setLightbox({ images, index });
  };
  const closeLightbox = () => setLightbox(null);
  const navigateLightbox = (delta) => {
    setLightbox((current) => {
      if (!current) return current;
      const next = (current.index + delta + current.images.length) % current.images.length;
      return { ...current, index: next };
    });
  };

  // --- DETAIL VIEW ---
  if (selectedReportRow) {
    // Five fixed milestones: Submitted -> Assigned -> In Progress -> Resolved
    // -> Closed. On-Hold pauses In Progress; Invalid is an off-track terminal
    // outcome, so the track stops at the last milestone actually reached.
    const timelineEntries = selectedReportDetail?.status_timeline || [];
    const currentStatus = selectedReportDetail?.status || selectedReportRow?.status;
    const createdAt =
      selectedReportRow?.created_at || selectedReportDetail?.created_at || '';

    const timeline = buildReportTimeline({
      status: currentStatus,
      entries: timelineEntries,
      createdAt,
      collapseValidation: true,
    });
    const invalidEntry = timeline.invalidEntry;

    // SLA state for the status card's expected-resolution row. Null while the
    // detail is still loading (the card only renders with the detail anyway).
    const sla = selectedReportDetail ? slaBadge(selectedReportDetail) : null;

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
                <div className="status-card-top">
                  <span className="status-card-caption">Report Status</span>
                  <span className={statusBadgeClass(selectedReportDetail.status)}>
                    {statusLabel(selectedReportDetail.status)}
                  </span>
                </div>
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
                    <h2>{statusLabel(selectedReportDetail.status)}</h2>
                    <p className="status-description">
                      {statusDescription(selectedReportDetail.status)}
                    </p>
                  </div>
                </div>

                {/* Expected resolution: its own row so the SLA date reads at a
                    glance instead of hiding in a pill beside the badge. */}
                {selectedReportDetail.due_at && sla && (
                  <div className={`resolution-sla resolution-sla-${sla.tone}`}>
                    <span className="resolution-sla-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <span className="resolution-sla-copy">
                      <span className="resolution-sla-label">Expected Resolution Date</span>
                      <span className="resolution-sla-date">{formatDueDateLong(selectedReportDetail.due_at)}</span>
                    </span>
                    {sla.tone !== 'none' && (
                      <span className="resolution-sla-chip">{sla.text}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution Timeline */}
              <div className="card timeline-card">
                <h3>RESOLUTION TIMELINE</h3>
                <ReportTimeline
                  status={currentStatus}
                  entries={timelineEntries}
                  createdAt={createdAt}
                  timeline={timeline}
                  interactive
                  collapseValidation
                  onStepClick={(step) => setTimelineStepDetail(step)}
                />
                {selectedReportDetail.remarks && (
                  <div className="remarks-box">
                    <span className="remarks-title">REMARKS:</span>
                    <p>{selectedReportDetail.remarks}</p>
                  </div>
                )}
              </div>

              {/* Original Report Submission */}
              <div className="card submission-card">
                <h3>Original Report Submission</h3>
                <div className="submission-content-grid">
                  <div className="photos-column">
                    {selectedReportDetail.image_urls && selectedReportDetail.image_urls.length > 0 ? (
                      <div className="photo-grid">
                        {selectedReportDetail.image_urls.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`Submission proof ${i + 1}`}
                            className="clickable-thumb"
                            onClick={() => openLightbox(selectedReportDetail.image_urls, i)}
                          />
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
                      <div
                        className="map-preview-box clickable-map"
                        onClick={() => setMapModalOpen(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setMapModalOpen(true); }}
                        aria-label="Open larger map view"
                      >
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
                          <MapAutoResize />
                        </MapContainer>
                        <div className="map-expand-hint">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </div>
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
                {selectedReportDetail.resolution_image_urls && selectedReportDetail.resolution_image_urls.length > 0 ? (
                  <div className="photo-grid resolution-proof-grid">
                    {selectedReportDetail.resolution_image_urls.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`Resolution proof ${i + 1}`}
                        className="clickable-thumb"
                        onClick={() => openLightbox(selectedReportDetail.resolution_image_urls, i)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="proof-placeholder-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <p>Photo of the repair will appear here once the case is marked 'Resolved'</p>
                  </div>
                )}
              </div>

              {/* Citizen confirmation: close a resolved report */}
              {normalizeStatus(selectedReportDetail.status) === 'RESOLVED' && (
                <div className="card confirm-resolution-card">
                  <h3>Close this Report</h3>
                  <p>
                    The responsible authorities have resolved this hazard. Review the repair photos above, then confirm below to close this report.
                  </p>
                  <button
                    type="button"
                    className="btn-confirm-resolution"
                    onClick={() => { setConfirmError(''); setConfirmModalOpen(true); }}
                  >
                    Confirm & Close Report
                  </button>
                </div>
              )}

              {/* Closure status: citizen-confirmed vs closed by the LGU */}
              {normalizeStatus(selectedReportDetail.status) === 'CLOSED' && (
                <div className="card closure-status-card">
                  <h3>
                    {selectedReportDetail.confirmed_at
                      ? 'Report Confirmed & Closed'
                      : 'Report Closed by LGU'}
                  </h3>
                  <p>
                    {selectedReportDetail.confirmed_at
                      ? `You confirmed the resolution on ${formatDate(selectedReportDetail.confirmed_at)}. Thank you for helping keep your community safe!`
                      : 'The LGU closed this report — for example, it may not be under jurisdiction of the SnapSumbong department or was referred to another office.'}
                  </p>
                </div>
              )}
              {/* Invalid outcome: terminal off-track state */}
              {isInvalidStatus(selectedReportDetail.status) && (
                <div className="card invalid-report-card">
                  <h3>Report Marked Invalid</h3>
                  <p>{statusDescription(selectedReportDetail.status)}</p>
                  {invalidEntry?.remarks && (
                    <p className="invalid-report-reason">
                      <strong>Reason:</strong> {invalidEntry.remarks}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {lightbox && (
          <Lightbox
            images={lightbox.images}
            index={lightbox.index}
            onClose={closeLightbox}
            onNavigate={navigateLightbox}
          />
        )}

        {mapModalOpen && selectedReportDetail && (
          <MapModal
            latitude={selectedReportDetail.latitude}
            longitude={selectedReportDetail.longitude}
            onClose={() => setMapModalOpen(false)}
          />
        )}

        {confirmModalOpen && (
          <ConfirmResolutionModal
            submitting={confirmSubmitting}
            error={confirmError}
            onConfirm={handleConfirmResolution}
            onClose={() => { if (!confirmSubmitting) setConfirmModalOpen(false); }}
          />
        )}

        {successPopupOpen && <SuccessPopup onDismiss={dismissSuccessPopup} />}

        {timelineStepDetail && (
          <TimelineDetailsModal
            step={timelineStepDetail}
            onClose={() => setTimelineStepDetail(null)}
          />
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="reports-list-container">
      <div className="page-header">
        <h1>My Reports</h1>
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
          <div className="stat-icon active-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <span className="stat-label">ACTIVE</span>
            <div className="stat-value">{stats.active ?? '—'}</div>
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
          <div className="stat-icon invalid-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <div>
            <span className="stat-label">INVALID</span>
            <div className="stat-value">{stats.invalid ?? '—'}</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className={`card filters-card${dateError ? ' filters-card-invalid' : ''}`}>
        <div className="filter-group">
          <label>Category</label>
          <select value={tempCategoryId} onChange={(e) => setTempCategoryId(e.target.value)} onKeyDown={handleFilterKeyDown}>
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
          <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} onKeyDown={handleFilterKeyDown}>
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
            max={toISODate(new Date())}
            aria-invalid={dateError ? 'true' : undefined}
            aria-describedby={dateError ? 'my-date-range-error' : undefined}
            onChange={(e) => setTempDate(e.target.value)}
            onKeyDown={handleFilterKeyDown}
          />
          {dateError && (
            <p className="date-range-error" id="my-date-range-error" role="alert">{dateError}</p>
          )}
        </div>

        <div className="filter-group search-filter-group">
          <label>Search</label>
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search"
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              onKeyDown={handleFilterKeyDown}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-apply" disabled={Boolean(dateError)} onClick={handleApplyFilters}>
            Apply Filters
          </button>
          <button className="btn-reset" onClick={handleResetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="card table-card">
        {/* Scroll happens here, not on .table-card — keeps the rounded-corner
            card visuals separate from the sticky/scroll positioning context,
            which is what was causing the sticky Report ID column to glitch
            on mobile. */}
        <div className="table-scroll-wrapper">
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
              ) : reports.length > 0 ? (
                reports.map((report) => (
                  <tr key={report.report_number}>
                    <td className="report-id-cell" data-label="Report ID">{report.report_number}</td>
                    <td data-label="Category">{report.category}</td>
                    <td data-label="Date Submitted">{formatDate(report.created_at)}</td>
                    <td data-label="Status">
                      <span className={statusBadgeClass(report.status)}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td data-label="">
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
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} loading={listLoading} onPageChange={setCurrentPage}>
        Showing {startRow} to {endRow} of {pageMeta.count.toLocaleString()} reports
      </Pagination>
    </div>
  );
}

function Lightbox({ images, index, onClose, onNavigate }) {
  const touchStartX = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNavigate(1);
      else if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) onNavigate(delta > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>
      {images.length > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          aria-label="Previous photo"
        >
          &#8249;
        </button>
      )}
      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={images[index]} alt={`Photo ${index + 1} of ${images.length}`} />
        {images.length > 1 && (
          <span className="lightbox-counter">{index + 1} / {images.length}</span>
        )}
      </div>
      {images.length > 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          aria-label="Next photo"
        >
          &#8250;
        </button>
      )}
    </div>
  );
}

function MapModal({ latitude, longitude, onClose }) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <MapContainer
          key={`modal-${lat}-${lon}`}
          center={[lat, lon]}
          zoom={17}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[lat, lon]} icon={hazardMarkerIcon} />
          <MapAutoResize />
        </MapContainer>
        <a
          className="map-modal-external-link"
          href={`https://www.google.com/maps?q=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

function ConfirmResolutionModal({ submitting, error, onConfirm, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose]);

  return (
    <div
      className="confirm-modal-overlay"
      onClick={() => { if (!submitting) onClose(); }}
    >
      <div
        className="confirm-modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-resolution-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-resolution-title">Report Resolved</h3>
        <p>
          The reported hazard has been successfully resolved and verified by the responsible authorities. As a result, this report has been marked as Closed. Thank you for helping keep the community safe.
        </p>
        {error && <div className="form-error-banner">{error}</div>}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-confirm-resolution"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Confirming...' : 'Ok'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Citizen-safe labels for the raw audit action codes returned in the
// timeline entries (backend keeps the codes, not display text).
const TIMELINE_ACTION_LABELS = {
  CREATE: 'Report created',
  STATUS_CHANGE: 'Status updated',
  TRANSFER: 'Report transferred',
  ACTIVITY_NOTE: 'Report activity recorded',
};

// Details for one resolution-timeline milestone. In Progress can carry many
// entries (validation, dispatch, work updates, pause/resume), so this dialog
// renders a list instead of a single status change. Only what the reporter
// may see is exposed: status/activity, timestamp, the actor's role (never a
// name/email), a plain-language summary, and that entry's own remarks.
function TimelineDetailsModal({ step, onClose }) {
  const entries = step.entries?.length
    ? step.entries
    : step.entry
      ? [step.entry]
      : [];

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const entrySummary = (entry) => {
    if (entry.action === 'CREATE') {
      return step.key === 'assigned'
        ? 'Report assigned automatically at submission.'
        : 'Report submitted.';
    }
    if (entry.action === 'TRANSFER') return 'Report reassigned to another officer.';
    if (entry.action === 'ACTIVITY_NOTE' || entry.is_activity) {
      return entry.activity_label || activityLabel(entry) || 'Report activity recorded.';
    }
    if (entry.from_status || entry.to_status) {
      return `Status changed${entry.from_status ? ` from ${entry.from_status}` : ''} to ${entry.to_status || step.label}.`;
    }
    return `Report status updated to ${step.label}.`;
  };

  return (
    <div className="tl-details-overlay" onClick={onClose}>
      <section
        className="tl-details-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tl-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tl-details-header">
          <div className="tl-details-heading">
            <span className="tl-details-icon" aria-hidden="true">i</span>
            <div>
              <h3 id="tl-details-title">
                {step.key === 'in_progress' ? 'Handling Activity' : 'Status Details'}
              </h3>
              <p>
                {step.key === 'in_progress'
                  ? 'Validation, dispatch, and field updates for this report'
                  : 'How your report reached this stage'}
              </p>
            </div>
          </div>
          <button className="tl-details-x" type="button" onClick={onClose} aria-label="Close details">
            &times;
          </button>
        </header>

        <div className="tl-details-body">
          <div className="tl-details-field">
            <span className="tl-details-label">Milestone</span>
            <span className="tl-details-value">{step.label}</span>
          </div>

          {entries.length === 0 ? (
            <p className="tl-details-empty">No further details were recorded for this stage.</p>
          ) : (
            <div className="tl-details-entry-list">
              {entries.map((entry, index) => {
                const performer = !entry.performed_by_role
                  ? 'System'
                  : entry.performed_by_role === 'Citizen'
                    ? 'You'
                    : entry.performed_by_role;
                const title =
                  entry.activity_label ||
                  (entry.action === 'CREATE' ? step.label : '') ||
                  (entry.action === 'ACTIVITY_NOTE' ? activityLabel(entry) : '') ||
                  entry.to_status ||
                  entry.status ||
                  step.label;
                return (
                  <article className="tl-details-entry" key={`${entry.created_at}-${index}`}>
                    <div className="tl-details-entry-head">
                      <strong>{title}</strong>
                      <span>{formatDateTime(entry.created_at) || '—'}</span>
                    </div>
                    <div className="tl-details-field">
                      <span className="tl-details-label">Performed by</span>
                      <span className="tl-details-value">{performer}</span>
                    </div>
                    <div className="tl-details-field">
                      <span className="tl-details-label">Action</span>
                      <span className="tl-details-value">
                        {TIMELINE_ACTION_LABELS[entry.action] || 'Status updated'}
                      </span>
                    </div>
                    <div className="tl-details-field tl-details-field-wide">
                      <span className="tl-details-label">What changed</span>
                      <span className="tl-details-value">{entrySummary(entry)}</span>
                    </div>
                    {entry.remarks && (
                      <div className="tl-details-field tl-details-field-wide tl-details-remarks">
                        <span className="tl-details-label">Remarks</span>
                        <span className="tl-details-value">{entry.remarks}</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="tl-details-footer">
          <button className="tl-details-close-btn" type="button" onClick={onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

// Centered success popup shown after the citizen confirms a closure.
// Dismissed by tapping anywhere outside the card (or pressing Escape),
// which returns to the My Reports list via onDismiss.
function SuccessPopup({ onDismiss }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="success-popup-overlay" onClick={onDismiss}>
      <div
        className="success-popup-card"
        role="status"
        aria-live="polite"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-check-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p>Thank you! Your report has been closed successfully.</p>
        <span className="success-popup-hint">Tap anywhere to continue</span>
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
