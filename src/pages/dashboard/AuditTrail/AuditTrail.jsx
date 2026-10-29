import { useState, useEffect } from "react";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AuditTrail.css";
import { getAuditLogs, getAuditLog, getAuditModuleLookup } from "../../../api/audits";
import { getRoleLookup } from "../../../api/roles";
import { DATE_FILTER_PRESETS, notAfterToday, resolveRange, toISODate } from "../../../utils/dates";
import Pagination from "../../../components/shared/Pagination";

const ROWS_PER_PAGE = 4;
const ALL_MODULES = "All";
const ALL_ROLES = "All";
const ALL_DATES = "all";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const toRoleBadgeClass = (role) =>
  `role-badge role-${String(role || "system").toLowerCase().replace(/\s+/g, "-")}`;

// Backend list rows use different field names than the table renders.
const mapLog = (log) => ({
  id: log.audit_log_number,
  userName: log.actor_name,
  role: log.actor_role,
  action: log.action,
  module: log.module,
  date: formatDateTime(log.created_at),
});

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

const payloadLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const isEmptyPayloadValue = (value) =>
  value === null || value === undefined || value === "";

const isNestedPayloadContainer = (value) => {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return (
      value.length > 0 &&
      value.some((item) => item !== null && typeof item === "object")
    );
  }
  return Object.keys(value).length > 0;
};

function PayloadValue({ value }) {
  if (isEmptyPayloadValue(value)) {
    return <span className="activity-payload-empty">—</span>;
  }
  if (typeof value !== "object") {
    return <span>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="activity-payload-empty">—</span>;
    }
    const primitivesOnly = value.every(
      (item) => item === null || typeof item !== "object"
    );
    if (primitivesOnly) {
      return (
        <ul className="activity-payload-array">
          {value.map((item, index) => (
            <li className="activity-payload-array-item" key={index}>
              {isEmptyPayloadValue(item) ? (
                <span className="activity-payload-empty">—</span>
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="activity-payload-group">
        {value.map((item, index) => (
          <div
            className={`activity-payload-item${
              isNestedPayloadContainer(item) ? "" : " activity-payload-item--inline"
            }`}
            key={index}
          >
            <span className="activity-payload-key">Item {index + 1}</span>
            <PayloadValue value={item} />
          </div>
        ))}
      </div>
    );
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    return <span className="activity-payload-empty">—</span>;
  }
  return (
    <div className="activity-payload-group">
      {entries.map(([key, child]) => (
        <div
          className={`activity-payload-item${
            isNestedPayloadContainer(child) ? "" : " activity-payload-item--inline"
          }`}
          key={key}
        >
          <span className="activity-payload-key">{payloadLabel(key)}</span>
          <PayloadValue value={child} />
        </div>
      ))}
    </div>
  );
}

function ActivityDetailsModal({ log, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getAuditLog(log.id);
        if (cancelled) return;
        setDetail(data);
      } catch (err) {
        if (cancelled) return;
        setDetail(null);
        setError(err?.detail || "Failed to load activity details. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [log.id, refreshKey]);

  const handleCopyLogId = () => {
    navigator.clipboard.writeText(log.id);
  };

  // payload is a free-form JSON object (e.g. status_change from/to, remarks).
  // Null/empty top-level values are noise — skip them.
  const payloadEntries = Object.entries(detail?.payload || {}).filter(
    ([, value]) => !isEmptyPayloadValue(value)
  );

  return (
    <div className="activity-details-overlay" onClick={onClose}>
      <div className="activity-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="activity-details-header">
          <div className="activity-details-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="activity-details-title-group">
            <h3 className="activity-details-title">Activity Details</h3>
            <p className="activity-details-subtitle">Detailed information for system audit</p>
          </div>
          <button className="activity-details-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="activity-details-body">
          <div className="activity-details-grid">
            <div className="activity-detail-field">
              <label className="activity-detail-label">LOG ID</label>
              <div className="activity-detail-value">{log.id}</div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">PERFORMED BY</label>
              <div className="activity-detail-value">
                {log.userName}
                <span className={`activity-detail-role-badge ${toRoleBadgeClass(log.role).replace("role-badge ", "")}`}>
                  {log.role}
                </span>
              </div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">DATE &amp; TIME</label>
              <div className="activity-detail-value">{log.date}</div>
            </div>
            <div className="activity-detail-field">
              <label className="activity-detail-label">MODULE</label>
              <div className="activity-detail-value">{log.module}</div>
            </div>
          </div>

          <div className="activity-primary-action">
            <label className="activity-detail-label">PRIMARY ACTION</label>
            <div className="activity-primary-action-text">{log.action}</div>
          </div>

          <div className="activity-description">
            <label className="activity-detail-label">DESCRIPTION</label>
            {loading ? (
              <p className="activity-description-text">Loading details...</p>
            ) : error ? (
              <p className="activity-description-text">
                {error}{" "}
                <button
                  type="button"
                  className="retry-link"
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Try again
                </button>
              </p>
            ) : (
              <p className="activity-description-text">
                {detail?.description || "No description recorded."}
              </p>
            )}
          </div>

          {!loading && !error && payloadEntries.length > 0 && (
            <div className="activity-payload">
              <label className="activity-detail-label">ADDITIONAL DATA</label>
              <dl className="activity-payload-list">
                {payloadEntries.map(([key, value]) => (
                  <div className="activity-payload-item" key={key}>
                    <dt className="activity-payload-key">{payloadLabel(key)}</dt>
                    <dd className="activity-payload-value">
                      <PayloadValue value={value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="activity-details-footer">
          <button className="btn-copy-log-id" onClick={handleCopyLogId}>
            Copy Log ID
          </button>
          <button className="btn-activity-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditTrail() {
  const [draftSearch, setDraftSearch] = useState("");
  const [draftModule, setDraftModule] = useState(ALL_MODULES);
  const [draftRole, setDraftRole] = useState(ALL_ROLES);
  const [draftDateMode, setDraftDateMode] = useState(ALL_DATES);
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState(ALL_MODULES);
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES);
  const [dateMode, setDateMode] = useState(ALL_DATES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [moduleOptions, setModuleOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadLookups = async () => {
      try {
        const [modules, roles] = await Promise.all([getAuditModuleLookup(), getRoleLookup()]);
        if (cancelled) return;
        setModuleOptions(modules || []);
        setRoleOptions(roles || []);
      } catch {
        // Lookups only feed the filter dropdowns — the list fetch below
        // surfaces its own error row if the API is unreachable.
      }
    };
    loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // Resolve the preset at request time so "Today" stays correct across
        // refetches; "custom" uses the From/to inputs as-is.
        const { from, to } = resolveRange(dateMode, new Date(), { from: dateFrom, to: dateTo });
        const data = await getAuditLogs({
          q: searchQuery || undefined,
          module: moduleFilter !== ALL_MODULES ? moduleFilter : undefined,
          role_id: roleFilter !== ALL_ROLES ? Number(roleFilter) : undefined,
          from_date: from || undefined,
          to_date: to || undefined,
          page: currentPage,
          page_size: ROWS_PER_PAGE,
        });
        if (cancelled) return;
        const pages = data.total_pages || 1;
        if (currentPage > pages) {
          // Page is past the end (e.g. after filters shrink the result set) —
          // clamp and refetch.
          setCurrentPage(pages);
          return;
        }
        setLogs((data.results || []).map(mapLog));
        setCount(data.count || 0);
        setTotalPages(pages);
      } catch (err) {
        if (cancelled) return;
        setLogs([]);
        setCount(0);
        setTotalPages(1);
        setError(err?.detail || "Failed to load audit logs. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, moduleFilter, roleFilter, dateMode, dateFrom, dateTo, currentPage, refreshKey]);

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = count === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, count);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch);
    setModuleFilter(draftModule);
    setRoleFilter(draftRole);
    setDateMode(draftDateMode);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setCurrentPage(1);
  };

  const handleFilterKeyDown = (e) => {
    if(e.key === "Enter"){
      handleApplyFilters();
      if(e.target.tagName === "SELECT") e.preventDefault();
    }
  };

  const handleReset = () => {
    setDraftSearch("");
    setDraftModule(ALL_MODULES);
    setDraftRole(ALL_ROLES);
    setDraftDateMode(ALL_DATES);
    setDraftDateFrom("");
    setDraftDateTo("");
    setSearchQuery("");
    setModuleFilter(ALL_MODULES);
    setRoleFilter(ALL_ROLES);
    setDateMode(ALL_DATES);
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="Audit Trail">
      <div className="audit-trail-page">
        <div className="section-header">
          <h2 className="section-title">Audit Trail Logs</h2>
          <p className="section-subtitle">Records and displays all system activities performed by administrators, LGU staff, and users.</p>
        </div>

        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-field filter-field-search">
              <label className="filter-label">Search Activities</label>
              <div className="filter-search-wrap">
                <SearchIcon />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search users or activities..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={handleFilterKeyDown}
                />
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Module</label>
              <select className="filter-select" value={draftModule} onChange={(e) => setDraftModule(e.target.value)} onKeyDown={handleFilterKeyDown}>
                <option value={ALL_MODULES}>All Module</option>
                {moduleOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-label">User Role</label>
              <select className="filter-select" value={draftRole} onChange={(e) => setDraftRole(e.target.value)} onKeyDown={handleFilterKeyDown}>
                <option value={ALL_ROLES}>All Roles</option>
                <option value="0">System</option>
                {roleOptions.map((r) => (
                  <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                ))}
              </select>
            </div>
            <div className="filter-field audit-date-filter">
              <label className="filter-label">Date</label>
              <select className="filter-select" value={draftDateMode} onChange={(e) => setDraftDateMode(e.target.value)} onKeyDown={handleFilterKeyDown}>
                {DATE_FILTER_PRESETS.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
              {draftDateMode === "custom" && (
                <div className="date-range-wrapper">
                  <span className="date-range-separator">From</span>
                  <input
                    type="date"
                    className="filter-date"
                    value={draftDateFrom}
                    max={toISODate(new Date())}
                    onChange={(e) => {
                      if (notAfterToday(e.target.value)) setDraftDateFrom(e.target.value);
                    }}
                    onKeyDown={handleFilterKeyDown}
                  />
                  <span className="date-range-separator">to</span>
                  <input
                    type="date"
                    className="filter-date"
                    value={draftDateTo}
                    max={toISODate(new Date())}
                    onChange={(e) => {
                      if (notAfterToday(e.target.value)) setDraftDateTo(e.target.value);
                    }}
                    onKeyDown={handleFilterKeyDown}
                  />
                </div>
              )}
            </div>
            <div className="filter-buttons">
              <button className="btn-filter-apply" onClick={handleApplyFilters}>
                <FilterIcon />
                Apply Filters
              </button>
              <button className="btn-filter-reset" onClick={handleReset}>Reset</button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>LOG ID</th>
                <th>USER NAME</th>
                <th>ROLE</th>
                <th>ACTION PERFORMED</th>
                <th>MODULE</th>
                <th>DATE &amp; TIME</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="empty-table-message">Loading audit logs...</td>
                </tr>
              ) : error && logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-message">
                    {error}{" "}
                    <button
                      type="button"
                      className="retry-link"
                      onClick={() => setRefreshKey((key) => key + 1)}
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="report-id-link">{log.id}</span></td>
                    <td>{log.userName}</td>
                    <td>
                      <span className={toRoleBadgeClass(log.role)}>
                        {log.role}
                      </span>
                    </td>
                    <td>{log.action}</td>
                    <td>{log.module}</td>
                    <td>{log.date}</td>
                    <td>
                      <button className="action-link action-view-btn" onClick={() => setSelectedLog(log)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table-message">No audit logs found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setCurrentPage}
        >
          Showing {startRow} to {endRow} of {count.toLocaleString()} entries
        </Pagination>
      </div>

      {selectedLog && (
        <ActivityDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </DashboardLayout>
  );
}
