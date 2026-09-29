import { Navigate, Outlet } from "react-router-dom";
import { useAuth, homePathFor } from "../../context/authContext";

export default function RequireAuth({ role }) {
  const { status, user } = useAuth();

  if (status === "loading") return null;

  if (status === "anonymous" || !user) {
    return <Navigate to="/" replace />;
  }

  const isStaff = user.is_staff === true;
  if ((role === "staff" && !isStaff) || (role === "citizen" && isStaff)) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}
