import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import EmployeeProfileModal from "./EmployeeProfileModal";
import "./ManageEmployees.css";
import mockData from "../../../data/mock.json";

const { employees: MOCK_EMPLOYEES, employeeProfiles: MOCK_EMPLOYEE_PROFILES } = mockData;
const ROWS_PER_PAGE = 8;

const buildFullName = ({ firstName, middleName, lastName }) =>
  [firstName, middleName ? `${middleName.charAt(0)}.` : "", lastName].filter(Boolean).join(" ");

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "REPORT OFFICER", label: "Report Officer" },
  { value: "SUPERVISOR", label: "Supervisor" },
];

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function ManageEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);
  const [employeeProfiles, setEmployeeProfiles] = useState(MOCK_EMPLOYEE_PROFILES);
  const [managing, setManaging] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (roleFilter && emp.role !== roleFilter) return false;
      if (statusFilter && emp.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [employees, roleFilter, statusFilter, searchQuery]);

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalEmployees);

  const paginatedEmployees = filteredEmployees.slice(startRow - 1, endRow);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch);
    setStatusFilter(draftStatus);
    setRoleFilter(draftRole);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDraftSearch("");
    setDraftStatus("");
    setDraftRole("");
    setSearchQuery("");
    setStatusFilter("");
    setRoleFilter("");
    setCurrentPage(1);
  };

  // Merge the modal's edits into the table row + profile store so the list
  // reflects the change without a reload (mock data, session state only).
  const handleSaved = (updates) => {
    const managingId = managing?.id;
    setEmployeeProfiles((current) => ({
      ...current,
      [managingId]: { ...current[managingId], ...updates },
    }));
    setEmployees((current) =>
      current.map((emp) =>
        emp.id === managingId
          ? { ...emp, name: buildFullName(updates), email: updates.email, role: updates.role, status: updates.status }
          : emp
      )
    );
  };

  const managingEmployee = employees.find((emp) => emp.id === managing?.id) || null;

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
              <label className="filter-label">Role</label>
              <select className="filter-select" value={draftRole} onChange={(e) => setDraftRole(e.target.value)}>
                {ROLE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
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
                        {emp.status === "ACTIVE" ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="last-activity-cell">{emp.lastActivity}</td>
                    <td>
                      <div className="action-icon-group">
                        <button
                          type="button"
                          className="action-icon-btn"
                          title={`View ${emp.name}`}
                          aria-label={`View ${emp.name}`}
                          onClick={() => setManaging({ id: emp.id, mode: "view" })}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn"
                          title={`Edit ${emp.name}`}
                          aria-label={`Edit ${emp.name}`}
                          onClick={() => setManaging({ id: emp.id, mode: "edit" })}
                        >
                          <PencilIcon />
                        </button>
                      </div>
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
            Showing {startRow} to {endRow} of {totalEmployees.toLocaleString()} Employees
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

      {managing?.id != null && managingEmployee && (
        <EmployeeProfileModal
          employee={managingEmployee}
          profile={employeeProfiles[managing.id]}
          mode={managing.mode}
          onClose={() => setManaging(null)}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}
