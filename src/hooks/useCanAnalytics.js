import { useAuth } from "../context/authContext";
import { MOCK_ALL_ACCESS } from "../shared/config/env";
import { PERMISSIONS } from "../shared/constants";

const ANALYTICS_PERMISSIONS = [
  PERMISSIONS.ANALYTIC_READ_DASHBOARD,
  PERMISSIONS.ANALYTIC_READ_ALL_METRICS,
  PERMISSIONS.ANALYTIC_READ_ASSIGNED_METRICS,
  PERMISSIONS.ANALYTIC_READ_OWN_METRICS,
];

// Mirrors the Sidebar's Operations-section gate: the user may open Analytics
// (and anything that deep-links into it) only with an analytic:* permission.
export function useCanAnalytics() {
  const { user } = useAuth();
  if (MOCK_ALL_ACCESS) return true;
  const permissions = user?.permissions || [];
  return ANALYTICS_PERMISSIONS.some((permission) => permissions.includes(permission));
}
