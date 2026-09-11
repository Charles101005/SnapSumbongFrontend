import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageEmployees.css";

const MOCK_EMPLOYEES = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@lgu.gov.ph",
    role: "ADMIN",
    status: "ACTIVE",
    lastActivity: "2 mins ago",
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@lgu.gov.ph",
    role: "REPORT OFFICER",
    status: "DEACTIVATED",
    lastActivity: "15 hours ago",
  },
  {
    id: 3,
    name: "Ricardo Ramos",
    email: "ricardo.ramos@lgu.gov.ph",
    role: "REPORT OFFICER",
    status: "ACTIVE",
    lastActivity: "3 days ago",
  },
  {
    id: 4,
    name: "Elena Gomez",
    email: "elena.gomez@lgu.gov.ph",
    role: "ADMIN",
    status: "ACTIVE",
    lastActivity: "5 mins ago",
  },
  {
    id: 5,
    name: "Carlos Reyes",
    email: "carlos.reyes@lgu.gov.ph",
    role: "SUPERVISOR",
    status: "ACTIVE",
    lastActivity: "1 hour ago",
  },
];

const TABS = ["All Employees", "Admins", "Report Officer", "Supervisor"];
const ROWS_PER_PAGE = 4;

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

  const filteredEmployees = activeTab === "All Employees"
    ? MOCK_EMPLOYEES
    : MOCK_EMPLOYEES.filter((emp) => {
        const roleMap = { Admins: "ADMIN", "Report Officer": "REPORT OFFICER", Supervisor: "SUPERVISOR" };
        return emp.role === roleMap[activeTab];
      });

  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalEmployees);

  const paginatedEmployees = filteredEmployees.slice(startRow - 1, endRow);

  return (
    <DashboardLayout title="LGU Employees">
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
                <td colSpan="6" className="empty-table-message">No employees found.</td>
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
    </DashboardLayout>
  );
}
