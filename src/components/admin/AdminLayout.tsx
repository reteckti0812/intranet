import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, FileEdit, Building2, ScrollText,
  Users, LogOut, ChevronLeft, Menu, ExternalLink, Files, ShieldCheck
} from "lucide-react";
import logo from "@/assets/logo.png";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Megaphone, label: "Avisos", path: "/admin/avisos" },
  { icon: FileEdit, label: "Conteúdo Home", path: "/admin/conteudo-home" },
  { icon: Building2, label: "Dep. e Grp.", path: "/admin/departamentos" },
  { icon: Files, label: "Documentos", path: "/admin/documentos" },
  { icon: ShieldCheck, label: "Validade ISOs", path: "/admin/iso" },
  { icon: ScrollText, label: "Auditoria", path: "/admin/auditoria" },
  { icon: Users, label: "Usuários", path: "/admin/usuarios" },
];

function readAdminLabel(): string {
  try {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return "Admin";
    const u = JSON.parse(raw) as { name?: string; email?: string; role?: string };
    const rolePt = u.role === "owner" || u.role === "super" ? "Owner" : "Admin";
    return u.name ? `${u.name} (${rolePt})` : rolePt;
  } catch {
    return "Admin";
  }
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminLabel, setAdminLabel] = useState(readAdminLabel);
  const location = useLocation();

  useEffect(() => {
    setAdminLabel(readAdminLabel());
  }, [location.pathname]);
  const sidebarWidth = sidebarOpen ? "w-64" : "w-16";
  const marginLeft = sidebarOpen ? "ml-64" : "ml-16";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className={`${sidebarWidth} fixed top-0 left-0 h-screen bg-card text-foreground border-r border-border flex flex-col transition-all duration-200 z-30 overflow-y-auto`}>
        <div className="p-4 flex items-center gap-3 border-b border-border h-16">
          {sidebarOpen && <img src={logo} alt="Re-Teck" className="h-8" />}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5"
                }`}
                title={item.label}
              >
                <item.icon size={18} className={active ? "" : "text-primary"} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          {sidebarOpen && (
            <p className="text-xs text-muted-foreground mb-2 leading-snug">Logado como: {adminLabel}</p>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors w-full">
            <LogOut size={16} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${marginLeft} transition-all duration-200 min-h-screen`}>
        {/* Top bar with Ver Site */}
        <header className="flex items-center justify-end px-8 py-4 border-b border-border bg-card">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-primary border border-primary rounded-lg px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ExternalLink size={16} />
            Ver Site
          </Link>
        </header>
        <main key={location.pathname} className="p-8 animate-rise">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
