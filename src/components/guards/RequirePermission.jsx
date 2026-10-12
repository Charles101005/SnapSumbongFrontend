import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/authContext";

// Layout guard that blocks direct URL access to routes the logged-in user
// lacks permission for (any-of semantics: one matching permission is enough).
// Nest inside RequireAuth — it assumes an authenticated user.
export default function RequirePermission({ permissions = [], redirect = "/dashboard" }) {
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];
  const allowed =
    permissions.length === 0 ||
    permissions.some((permission) => userPermissions.includes(permission));

  if (!allowed) {
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
