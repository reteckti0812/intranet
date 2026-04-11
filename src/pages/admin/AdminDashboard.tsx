import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Megaphone, FileEdit, Building2, FolderSync,
  Users, LogOut, Plus, RefreshCw, FolderOpen, FileText, Layers,
  Calendar, ChevronLeft, ChevronRight, Menu
} from "lucide-react";
import logo from "@/assets/logo.png";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Megaphone, label: "Avisos", path: "/admin/avisos" },
  { icon: FileEdit, label: "Conteúdo Home", path: "/admin/conteudo" },
  { icon: Building2, label: "Departamentos", path: "/admin/departamentos" },
  { icon: FolderSync, label: "Sincronizar Docs", path: "/admin/sync" },
  { icon: Users, label: "Usuários Admin", path: "/admin/usuarios" },
];

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 flex-shrink-0`}>
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

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Departamentos", value: "13", icon: Building2, color: "bg-primary" },
            { label: "Grupos", value: "28", icon: Layers, color: "bg-info" },
            { label: "Documentos Ativos", value: "142", icon: FileText, color: "bg-success" },
            { label: "Última Sincronização", value: "07/04/26", icon: Calendar, color: "bg-warning" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className={`${stat.color} text-primary-foreground p-2 rounded-lg`}>
                  <stat.icon size={20} />
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
            <Plus size={24} />
            <div className="text-left">
              <p className="font-semibold">Novo Aviso</p>
              <p className="text-xs opacity-80">Publicar comunicado</p>
            </div>
          </button>
          <button className="flex items-center gap-3 bg-info text-info-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
            <RefreshCw size={24} />
            <div className="text-left">
              <p className="font-semibold">Sincronizar Agora</p>
              <p className="text-xs opacity-80">Atualizar documentos</p>
            </div>
          </button>
          <button className="flex items-center gap-3 bg-warning text-warning-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
            <FolderOpen size={24} />
            <div className="text-left">
              <p className="font-semibold">Abrir Pasta</p>
              <p className="text-xs opacity-80">C:\Intranet\Documentos</p>
            </div>
          </button>
        </div>

        {/* Announcements Manager Preview */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Avisos Recentes</h2>
            <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
          </div>
          <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Validade</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-32">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: "Atualização da Política de Qualidade", date: "30/04/2026" },
                  { title: "Novo procedimento de Segurança de Dados R2", date: "15/05/2026" },
                  { title: "Treinamento de Integração - Abril 2026", date: "30/04/2026" },
                ].map((a, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 text-foreground">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.date}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button className="text-primary hover:underline text-xs font-medium">Editar</button>
                      <button className="text-destructive hover:underline text-xs font-medium">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Departments Manager Preview */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Departamentos</h2>
          </div>
          <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-16">Cód.</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Slug</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-20">Grupos</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-40">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: "01", name: "Alta Gestão", slug: "alta-gestao", groups: 2 },
                  { code: "02", name: "TI", slug: "ti", groups: 3 },
                  { code: "12", name: "Recursos Humanos", slug: "recursos-humanos", groups: 2 },
                ].map((d) => (
                  <tr key={d.code} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.code}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{d.slug}</td>
                    <td className="px-4 py-3 text-center">{d.groups}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button className="text-primary hover:underline text-xs font-medium">Editar</button>
                      <button className="text-destructive hover:underline text-xs font-medium">Excluir</button>
                      <button className="text-warning hover:underline text-xs font-medium">Pasta</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sync Screen Preview */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sincronização de Documentos</h2>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <p className="text-sm text-muted-foreground mb-2">Escaneando: <span className="font-mono text-xs">C:\Intranet\Documentos</span></p>
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div className="gradient-primary h-3 rounded-full" style={{ width: "72%" }} />
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-success font-medium">12 novos arquivos</span>
              <span className="text-destructive font-medium">3 arquivos removidos</span>
              <span className="text-muted-foreground">142 inalterados</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
