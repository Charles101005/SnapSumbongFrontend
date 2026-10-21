import { useAuth } from "../context/authContext";
import { MOCK_ALL_ACCESS } from "../shared/config/env";
import { PERMISSIONS } from "../shared/constants";

// Central permission helpers for the staff dashboard.
// Replaces the `can()` copy previously duplicated in Sidebar,
// OperationsDashboard, ReportDetail, RoleManagement, ManageCitizens
// and ModerationPanel. All checks are permission-string driven — never
// role-name driven — so custom roles from Role Management behave
// correctly with no extra code.
//
// The *Scope selectors mirror the server-side scoping in SnapSumbongApi
// (ReportService._authorized_reports / AnalyticService): "all" needs the
// read_all permission, else "assigned", else "own", else "none".
export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const can = (permission) => MOCK_ALL_ACCESS || permissions.includes(permission);

  const anyOf = (permissionList) =>
    MOCK_ALL_ACCESS || permissionList.some((permission) => permissions.includes(permission));

  const scopeOf = (permissionList) => {
    if (MOCK_ALL_ACCESS) return permissionList[0]?.scope || "all";
    for (const entry of permissionList) {
      if (permissions.includes(entry.permission)) return entry.scope;
    }
    return "none";
  };

  const reportScope = scopeOf([
    { permission: PERMISSIONS.REPORT_READ_ALL, scope: "all" },
    { permission: PERMISSIONS.REPORT_READ_ASSIGNED, scope: "assigned" },
    { permission: PERMISSIONS.REPORT_READ_OWN, scope: "own" },
  ]);

  const analyticsScope = scopeOf([
    { permission: PERMISSIONS.ANALYTIC_READ_ALL_METRICS, scope: "all" },
    { permission: PERMISSIONS.ANALYTIC_READ_ASSIGNED_METRICS, scope: "assigned" },
    { permission: PERMISSIONS.ANALYTIC_READ_OWN_METRICS, scope: "own" },
  ]);

  const auditScope = can(PERMISSIONS.AUDIT_READ_SYSTEM_LOGS)
    ? "system+report"
    : can(PERMISSIONS.AUDIT_READ_REPORT_LOGS)
      ? "report"
      : "none";

  return { permissions, can, anyOf, reportScope, analyticsScope, auditScope };
}
