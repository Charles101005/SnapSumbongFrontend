import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import SearchableSelect from "../../../components/shared/SearchableSelect";
import { usePsgcAddress } from "../../../hooks/usePsgcAddress";
import { createEmployee } from "../../../api/users";
import { getRoleLookup } from "../../../api/roles";
import { GENDERS } from "../../../shared/constants";
import { mapApiErrors } from "../../../utils/apiErrors";
import "./AddEmployee.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    email: "",
    contactNumber: "",
    birthDate: "",
    gender: "",
    streetAddress: "",
  });
  const [roleId, setRoleId] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [roleOptions, setRoleOptions] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const lookup = await getRoleLookup();
        if (cancelled) return;
        setRoleOptions(lookup.map((role) => ({ value: String(role.role_id), label: role.role_name })));
      } catch (err) {
        if (cancelled) return;
        setFormError(err?.detail || "Failed to load roles. Please try again.");
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    };
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    regionOptions,
    provinceOptions,
    cityOptions,
    barangayOptions,
    canSelectProvince,
    canSelectCity,
    canSelectBarangay,
    handleRegionChange,
    handleProvinceChange,
    handleCityChange,
  } = usePsgcAddress({
    region,
    province,
    city,
    barangay,
    setRegion,
    setProvince,
    setCity,
    setBarangay,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedFirst = form.firstName.trim();
    const trimmedLast = form.lastName.trim();
    const trimmedMiddle = form.middleName.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.contactNumber.trim();
    const trimmedStreet = form.streetAddress.trim();

    if (!trimmedLast) {
      setFormError("Last name is required.");
      return;
    }
    if (!trimmedFirst) {
      setFormError("First name is required.");
      return;
    }
    if (!trimmedEmail) {
      setFormError("Email address is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!roleId) {
      setFormError("Role is required.");
      return;
    }
    if (!trimmedPhone) {
      setFormError("Contact number is required.");
      return;
    }
    if (!/^\d{11}$/.test(trimmedPhone)) {
      setFormError("Contact number must be 11 digits.");
      return;
    }
    if (!form.birthDate) {
      setFormError("Birthdate is required.");
      return;
    }
    if (!form.gender) {
      setFormError("Gender is required.");
      return;
    }
    if (!region) {
      setFormError("Region is required.");
      return;
    }
    if (!barangay) {
      setFormError("Barangay is required.");
      return;
    }

    setSaving(true);
    try {
      await createEmployee({
        email: trimmedEmail,
        role_id: Number(roleId),
        last_name: trimmedLast,
        first_name: trimmedFirst,
        ...(trimmedMiddle ? { middle_name: trimmedMiddle } : {}),
        contact_number: trimmedPhone,
        birth_date: form.birthDate,
        gender: form.gender,
        street_address: trimmedStreet,
        region_code: region,
        province_code: province,
        city_code: city,
        barangay_code: barangay,
      });
      navigate("/dashboard/users/employees/created", {
        state: {
          firstName: trimmedFirst,
          middleName: trimmedMiddle,
          lastName: trimmedLast,
          roleName: roleOptions.find((option) => option.value === String(roleId))?.label || "",
          email: trimmedEmail,
        },
      });
    } catch (err) {
      const mapped = mapApiErrors(err);
      setFormError(mapped.form || "Failed to create employee. Please try again.");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Add New Employee">
      <div className="breadcrumb">
        <Link to="/dashboard/users/employees" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/dashboard/users/employees" className="breadcrumb-link">LGU Employees</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Add New Employee</span>
      </div>

      <h2 className="page-title">Add New Employee</h2>

      <div className="form-card">
        {formError && <div className="page-banner page-banner-error">{formError}</div>}

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
                className="form-input form-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">
                  {rolesLoading ? "Loading roles..." : "Select a role"}
                </option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                className="form-input"
                placeholder="09XXXXXXXXX"
                maxLength={11}
                value={form.contactNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Birthdate</label>
              <input
                type="date"
                name="birthDate"
                className="form-input"
                value={form.birthDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-input form-select"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                {GENDERS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Region</label>
              <SearchableSelect
                value={region}
                onChange={(value) => handleRegionChange({ target: { value } })}
                options={regionOptions}
                placeholder="Search region"
                inputClassName="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Province</label>
              <SearchableSelect
                value={province}
                onChange={(value) => handleProvinceChange({ target: { value } })}
                options={provinceOptions}
                placeholder="Search province"
                disabled={!canSelectProvince}
                inputClassName="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City/Municipality</label>
              <SearchableSelect
                value={city}
                onChange={(value) => handleCityChange({ target: { value } })}
                options={cityOptions}
                placeholder="Search city/municipality"
                disabled={!canSelectCity}
                inputClassName="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Barangay</label>
              <SearchableSelect
                value={barangay}
                onChange={setBarangay}
                options={barangayOptions}
                placeholder="Search barangay"
                disabled={!canSelectBarangay}
                inputClassName="form-input"
              />
            </div>
          </div>

          <div className="form-row-full">
            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                className="form-input"
                placeholder="House no., street"
                value={form.streetAddress}
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
            <button type="submit" className="btn-create-account" disabled={saving || rolesLoading}>
              {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
