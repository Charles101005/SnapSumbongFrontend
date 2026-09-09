import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageCitizens.css";

const MOCK_CITIZENS = [
  {
    id: 1,
    name: "Juan Daet",
    email: "juan.daet@email.com",
    status: "ACTIVE",
    lastActivity: "2 mins ago",
  },
  {
    id: 2,
    name: "Ricardo Ramos",
    email: "ricardo.r@email.com",
    status: "ACTIVE",
    lastActivity: "1 hour ago",
  },
  {
    id: 3,
    name: "Elena Cruz",
    email: "elena.cruz@email.com",
    status: "ACTIVE",
    lastActivity: "3 days ago",
  },
  {
    id: 4,
    name: "Juan Dela Cruz",
    email: "juan.dc@email.com",
    status: "DEACTIVATED",
    lastActivity: "5 mins ago",
  },
  {
    id: 5,
    name: "Sofia Reyes",
    email: "sofia.reyes@email.com",
    status: "ACTIVE",
    lastActivity: "10 mins ago",
  },
  {
    id: 6,
    name: "Antonio Luna",
    email: "a.luna@email.com",
    status: "ACTIVE",
    lastActivity: "Yesterday",
  },
  {
    id: 7,
    name: "Liza Santos",
    email: "liza.sj@email.com",
    status: "DEACTIVATED",
    lastActivity: "1 week ago",
  },
  {
    id: 8,
    name: "Manuel Quezon",
    email: "quezon.m@email.com",
    status: "ACTIVE",
    lastActivity: "3 hours ago",
  },
];

const ROWS_PER_PAGE = 8;

export default function ManageCitizens() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const totalCitizens = MOCK_CITIZENS.length;
  const totalPages = Math.ceil(totalCitizens / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalCitizens);

  const paginatedCitizens = MOCK_CITIZENS.slice(startRow - 1, endRow);

  return (
    <DashboardLayout title="Citizen Users">
      <div className="breadcrumb">
        <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Citizens</span>
      </div>

      <div className="section-header">
        <h2 className="section-title">Citizen Users</h2>
        <p className="section-subtitle">
          Manage registered citizen accounts and monitor their reporting activity.
        </p>
      </div>

      <div className="table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>EMAIL ADDRESS</th>
              <th>ACCOUNT STATUS</th>
              <th>LAST ACTIVITY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCitizens.length > 0 ? (
              paginatedCitizens.map((citizen) => (
                <tr key={citizen.id}>
                  <td>
                    <span className="citizen-name">{citizen.name}</span>
                  </td>
                  <td>{citizen.email}</td>
                  <td>
                    <span className={`status-badge status-${citizen.status.toLowerCase()}`}>
                      {citizen.status === "ACTIVE" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="last-activity-cell">{citizen.lastActivity}</td>
                  <td>
                    <button className="action-link" onClick={() => navigate(`/dashboard/users/citizens/${citizen.id}`)}>Manage</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-table-message">No citizens found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="pagination-info">
          Showing {startRow} to {endRow} of {totalCitizens.toLocaleString()} Citizens
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
