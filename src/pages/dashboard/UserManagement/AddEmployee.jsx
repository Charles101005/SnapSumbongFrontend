import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AddEmployee.css";
import mockData from "../../../data/mock.json";

const { roleOptions: ROLES } = mockData.constants;

export default function AddEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    role: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard/users/employees/created", { state: form });
  };

  return (
    <DashboardLayout title="Add New Employee">
      <div className="breadcrumb">
        <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/dashboard/users/employees" className="breadcrumb-link">LGU Employees</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Add New Employee</span>
      </div>

      <h2 className="page-title">Add New Employee</h2>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                placeholder="Cruz"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                placeholder="Juan Dela"
                value={form.firstName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                name="middleName"
                className="form-input"
                placeholder="Hirino"
                value={form.middleName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                name="role"
                className="form-input form-select"
                value={form.role}
                onChange={handleChange}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role === "Select a role" ? "" : role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="juan.delacruz@email.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-divider" />

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel-form"
              onClick={() => navigate("/dashboard/users/employees")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-create-account">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
