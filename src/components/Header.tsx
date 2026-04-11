import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

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
                location.pathname.startsWith("/departamento") ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
              }`}
            >
              Departamentos
            </Link>
            <Link
              to="/admin/login"
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Admin
            </Link>
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1">
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/departamentos" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Departamentos</Link>
            <Link to="/admin/login" className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent" onClick={() => setMobileOpen(false)}>Admin</Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
