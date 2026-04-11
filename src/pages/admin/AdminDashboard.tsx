import {
  Building2, Layers, FileText, Calendar, Plus, RefreshCw, FolderOpen
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div>
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

      {/* Announcements Preview */}
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
    </div>
  );
};

export default AdminDashboard;
