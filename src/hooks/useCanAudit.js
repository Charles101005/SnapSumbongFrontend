import { useAuth } from "../context/authContext";
import { MOCK_ALL_ACCESS } from "../shared/config/env";
import { PERMISSIONS } from "../shared/constants";

const AUDIT_PERMISSIONS = [
  PERMISSIONS.AUDIT_READ_SYSTEM_LOGS,
  PERMISSIONS.AUDIT_READ_REPORT_LOGS,
];

// Mirrors the Sidebar's Audit Trail gate: the user may load audit logs (and
// anything that previews them, like the Dashboard's Recent Activity panel)
// only with an audit:* read permission.
export function useCanAudit() {
  const { user } = useAuth();
  if (MOCK_ALL_ACCESS) return true;
  const permissions = user?.permissions || [];
  return AUDIT_PERMISSIONS.some((permission) => permissions.includes(permission));
}
