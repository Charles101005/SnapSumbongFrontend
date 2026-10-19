// Canonical permission strings issued by SnapSumbongApi
// (see SnapSumbongApi/shared/authorization/all_permissions_registry.py).
export const PERMISSIONS = {
    // Users
    USER_READ_OWN: "user:read_own",
    USER_UPDATE_OWN: "user:update_own",
    USER_DEACTIVATE_OWN: "user:deactivate_own",
    USER_READ_ALL: "user:read_all",
    USER_ACTIVATE_ANY: "user:activate_any",
    USER_DEACTIVATE_ANY: "user:deactivate_any",
    USER_WARN: "user:warn",
    // Employees
    EMPLOYEE_CREATE: "employee:create",
    EMPLOYEE_READ_ALL: "employee:read_all",
    EMPLOYEE_UPDATE_ANY: "employee:update_any",
    EMPLOYEE_ASSIGN_ROLE: "employee:assign_role",
    EMPLOYEE_ACTIVATE_ANY: "employee:activate_any",
    EMPLOYEE_DEACTIVATE_ANY: "employee:deactivate_any",
    // Roles
    ROLE_CREATE: "role:create",
    ROLE_READ_ALL: "role:read_all",
    ROLE_UPDATE_ANY: "role:update_any",
    ROLE_DEACTIVATE_ANY: "role:deactivate_any",
    // Reports
    REPORT_CREATE: "report:create",
    REPORT_READ_OWN: "report:read_own",
    REPORT_UPDATE_OWN: "report:update_own",
    REPORT_READ_ASSIGNED: "report:read_assigned",
    REPORT_UPDATE_ASSIGNED: "report:update_assigned",
    REPORT_READ_ALL: "report:read_all",
    REPORT_ASSIGN: "report:assign",
    REPORT_FLAG: "report:flag",
    // Analytics
    ANALYTIC_READ_OWN_METRICS: "analytic:read_own_metrics",
    ANALYTIC_READ_ASSIGNED_METRICS: "analytic:read_assigned_metrics",
    ANALYTIC_READ_EMPLOYEE_METRICS: "analytic:read_employee_metrics",
    ANALYTIC_READ_CITIZEN_METRICS: "analytic:read_citizen_metrics",
    ANALYTIC_READ_HANDLER_PERFORMANCE: "analytic:read_handler_performance",
    ANALYTIC_READ_ALL_METRICS: "analytic:read_all_metrics",
    ANALYTIC_READ_DASHBOARD: "analytic:read_dashboard",
    // Audits
    AUDIT_READ_REPORT_LOGS: "audit:read_report_logs",
    AUDIT_READ_SYSTEM_LOGS: "audit:read_system_logs",
};

// Display labels for the module keys returned by GET /accounts/lookup/permissions/.
export const PERMISSION_MODULE_LABELS = {
    USERS: "Users",
    EMPLOYEES: "Employees",
    ROLES: "Roles",
    REPORTS: "Reports",
    ANALYTICS: "Analytics",
    AUDITS: "Audit Trail",
};

// Transforms the module-keyed lookup response from GET /accounts/lookup/permissions/
// into the shape the permission checkbox UI expects:
//   { USERS: [{ permission_name, description }] }
//     -> [{ id: "users", name: "Users", permissions: [{ id, label, description }] }]
export const permissionModulesFromLookup = (lookup = {}) =>
    Object.entries(lookup).map(([moduleKey, permissions]) => ({
        id: moduleKey.toLowerCase(),
        name: PERMISSION_MODULE_LABELS[moduleKey] || moduleKey,
        permissions: (permissions || []).map((permission) => ({
            id: permission.permission_name,
            label: permission.permission_name,
            description: permission.description,
        })),
    }));

// Gender values accepted by the API (Users.gender).
export const GENDERS = [
    { value: "M", label: "Male" },
    { value: "F", label: "Female" },
    { value: "O", label: "Other" },
];

// Account status values used across User Management screens.
export const ACCOUNT_STATUS = {
    ACTIVE: "ACTIVE",
    DEACTIVATED: "DEACTIVATED",
};
