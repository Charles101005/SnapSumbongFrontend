import { useState, useMemo } from "react";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AuditTrail.css";
import mockData from "../../../data/mock.json";

const { auditLogs: MOCK_LOGS, constants } = mockData;
const { auditModules: MODULES, auditRoles: USER_ROLES } = constants;
const ROWS_PER_PAGE = 4;

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

function ActivityDetailsModal({ log, onClose }) {
  const handleCopyLogId = () => {
    navigator.clipboard.writeText(log.id);
  };

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
                <span className={`activity-detail-role-badge role-${log.role.toLowerCase().replace(" ", "-")}`}>
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
            <p className="activity-description-text">{log.description}</p>
          </div>
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
  const [draftModule, setDraftModule] = useState("All Module");
  const [draftRole, setDraftRole] = useState("All Roles");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All Module");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = useMemo(() => {
    return MOCK_LOGS.filter((log) => {
      if (moduleFilter !== "All Module" && log.module !== moduleFilter) return false;
      if (roleFilter !== "All Roles" && log.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          log.id.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [moduleFilter, roleFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const startRow = filteredLogs.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, filteredLogs.length);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch);
    setModuleFilter(draftModule);
    setRoleFilter(draftRole);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDraftSearch("");
    setDraftModule("All Module");
    setDraftRole("All Roles");
    setDraftDateFrom("");
    setDraftDateTo("");
    setSearchQuery("");
    setModuleFilter("All Module");
    setRoleFilter("All Roles");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="Audit Trail">
      <div className="section-header">
        <h2 className="section-title">Audit Trail Logs</h2>
        <p className="section-subtitle">Records and displays all system activities performed by administrators, LGU staff, and users.</p>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group filter-group-search">
            <label className="filter-label">Search Activities</label>
            <div className="search-input-wrapper">
              <SearchIcon />
              <input
                type="text"
                className="filter-input"
                placeholder="Search users or activities..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Module</label>
            <select className="filter-select" value={draftModule} onChange={(e) => setDraftModule(e.target.value)}>
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">User Role</label>
            <select className="filter-select" value={draftRole} onChange={(e) => setDraftRole(e.target.value)}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters-row filters-row-secondary">
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div className="date-range-wrapper">
              <input type="date" className="filter-date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} placeholder="mm/dd/yyyy" />
              <span className="date-range-separator">to</span>
              <input type="date" className="filter-date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} placeholder="mm/dd/yyyy" />
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-apply" onClick={handleApplyFilters}>
              <FilterIcon />
              Apply Filters
            </button>
            <button className="btn-reset" onClick={handleReset}>Reset</button>
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
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td><span className="report-id-link">{log.id}</span></td>
                  <td>{log.userName}</td>
                  <td>
                    <span className={`role-badge role-${log.role.toLowerCase().replace(" ", "-")}`}>
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

      <div className="pagination">
        <span className="pagination-info">
          Showing {startRow} to {endRow} of {filteredLogs.length} entries
        </span>
        <div className="pagination-buttons">
          <button className="pagination-btn" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === safePage ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button className="pagination-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>

      {selectedLog && (
        <ActivityDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </DashboardLayout>
  );
}
