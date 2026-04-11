import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, FileEdit, Building2, FolderSync,
  Users, LogOut, ChevronLeft, Menu, ExternalLink
} from "lucide-react";
import logo from "@/assets/logo.png";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Megaphone, label: "Avisos", path: "/admin/avisos" },
  { icon: FileEdit, label: "Conteúdo Home", path: "/admin/conteudo-home" },
  { icon: Building2, label: "Departamentos", path: "/admin/departamentos" },
  { icon: FolderSync, label: "Sincronizar Docs", path: "/admin/sincronizar" },
  { icon: Users, label: "Usuários Admin", path: "/admin/usuarios" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const sidebarWidth = sidebarOpen ? "w-64" : "w-16";
  const marginLeft = sidebarOpen ? "ml-64" : "ml-16";

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className={`${sidebarWidth} fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 z-30 overflow-y-auto`}>
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          {sidebarOpen && <img src={logo} alt="Re-Teck" className="h-8" />}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1 rounded hover:bg-sidebar-accent">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/50"
                }`}
                title={item.label}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen && <p className="text-xs opacity-60 mb-2">Logado como: Admin</p>}
          <Link to="/" className="flex items-center gap-2 text-sm hover:text-sidebar-primary transition-colors">
            <LogOut size={16} />
            {sidebarOpen && <span>Sair</span>}
          </Link>
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
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
