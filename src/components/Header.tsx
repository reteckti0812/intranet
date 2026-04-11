import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    if (token) {
      navigate("/admin"); // Já logado → vai direto pro dashboard
    } else {
      navigate("/admin/login"); // Não logado → vai pro login
    }
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
            <a
              href="/admin"
              onClick={handleAdminClick}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Admin
            </a>
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1">
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/departamentos" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Departamentos</Link>
            <a
              href="/admin"
              onClick={(e) => { e.preventDefault(); handleAdminClick(e); setMobileOpen(false); }}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent"
            >
              Admin
            </a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;