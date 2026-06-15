import { Navigate, useLocation } from "react-router-dom";

function getStoredUser(): { role?: string } | null {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

const normRole = (r?: string) =>
  r === "owner" || r === "super" ? "owner" : r === "admin" ? "admin" : "user";

/** Exige qualquer usuário logado (site inteiro). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  const location = useLocation();
  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

/** Exige papel admin ou owner (painel administrativo). */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("admin_token");
  const location = useLocation();
  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  const role = normRole(getStoredUser()?.role);
  if (role !== "owner" && role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default RequireAuth;
