import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageEmployees.css";
import mockData from "../../../data/mock.json";

const { employees: MOCK_EMPLOYEES, constants } = mockData;
const { employeeTabs: TABS } = constants;
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

function UserPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export default function ManageEmployees() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Employees");
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredEmployees = useMemo(() => {
    return MOCK_EMPLOYEES.filter((emp) => {
      if (activeTab !== "All Employees") {
        const roleMap = { Admins: "ADMIN", "Report Officer": "REPORT OFFICER", Supervisor: "SUPERVISOR" };
        if (emp.role !== roleMap[activeTab]) return false;
      }
      if (statusFilter && emp.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [activeTab, statusFilter, searchQuery]);

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalEmployees);

  const paginatedEmployees = filteredEmployees.slice(startRow - 1, endRow);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch);
    setStatusFilter(draftStatus);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDraftSearch("");
    setDraftStatus("");
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="LGU Employees">
      <div className="manage-employees-page">
        <div className="breadcrumb">
          <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">LGU Employees</span>
        </div>

        <div className="section-header-row">
          <div className="section-header">
            <h2 className="section-title">LGU Employees</h2>
            <p className="section-subtitle">
              Manage staff roles, permissions and department assignments.
            </p>
          </div>
          <button className="btn-add-employee" onClick={() => navigate("/dashboard/users/employees/add")}>
            <UserPlusIcon />
            Add New Employee
          </button>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-field filter-field-search">
              <label className="filter-label">Search Employees</label>
              <div className="filter-search-wrap">
                <SearchIcon />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by name or email..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Account Status</label>
              <select className="filter-select" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
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
                <th>USER</th>
                <th>EMAIL ADDRESS</th>
                <th>ROLE</th>
                <th>ACCOUNT STATUS</th>
                <th>LAST ACTIVITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <span className="employee-name">{emp.name}</span>
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <span className={`role-badge role-${emp.role.toLowerCase().replace(" ", "-")}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${emp.status.toLowerCase()}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="last-activity-cell">{emp.lastActivity}</td>
                    <td>
                      <button className="action-link" onClick={() => navigate(`/dashboard/users/employees/${emp.id}`)}>Manage</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-table-message">No employees found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">
            Showing {startRow} to {endRow} of {totalEmployees} results
          </span>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
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
            <button
              className="pagination-btn"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
