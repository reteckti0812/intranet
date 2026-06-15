import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import GlobalSearch from "./GlobalSearch";

function readUser(): { name?: string; role?: string } | null {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}
const normRole = (r?: string) =>
  r === "owner" || r === "super" ? "owner" : r === "admin" ? "admin" : "user";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = readUser();
  const role = normRole(user?.role);
  const isAdmin = role === "owner" || role === "admin";

  const isActive = (path: string) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  return (
    <header className="bg-card shadow-card sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Re-Teck" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-foreground leading-tight">Sistema de Documentação</p>
              <p className="text-xs text-muted-foreground">On-Line</p>
            </div>
          </Link>

          <div className="hidden md:block flex-1 max-w-md mx-6">
            <GlobalSearch />
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              }`}
            >
              Home
            </Link>
            <Link
              to="/departamentos"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname.startsWith("/departamentos") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              }`}
            >
              Departamentos
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Admin
              </Link>
            )}

            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
              {user?.name && <span className="text-sm text-muted-foreground hidden lg:inline">{user.name}</span>}
              <button
                onClick={logout}
                title="Sair"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-primary transition-colors"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1">
            <div className="px-1 pb-2"><GlobalSearch /></div>
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/departamentos" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Departamentos</Link>
            {isAdmin && (
              <Link to="/admin" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Admin</Link>
            )}
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-left hover:bg-accent"
            >
              <LogOut size={16} /> Sair{user?.name ? ` (${user.name})` : ""}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
