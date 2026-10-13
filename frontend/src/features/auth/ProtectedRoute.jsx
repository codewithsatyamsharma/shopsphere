import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FullPageSpinner } from "../../components/ui/Spinner";

// Used as a "layout route": renders the matched child route, or redirects.
export function ProtectedRoute({ role }) {
  const { user, bootstrapped } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!bootstrapped) return <FullPageSpinner />; // still asking the server who we are
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
