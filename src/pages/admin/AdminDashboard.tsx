import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, Layers, FileText, AlertTriangle, Plus, FilePlus2,
  ScrollText, Loader2, Pencil, Trash2, Clock, ShieldCheck,
} from "lucide-react";
import api from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  expires_at: string;
}

interface DocRow {
  status: string;
  review_date: string | null;
  is_deleted: number;
}

interface IsoRow {
  expiry_date: string | null;
}

interface Stats {
  depts: number;
  groups: number;
  docs: number;
  pending: number;
  reviewDue: number;
  isoAlert: number;
}

function isReviewDue(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return d <= in30;
}

// ISO vencida ou vencendo nos próximos 60 dias
function isoNeedsAttention(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() + 60);
  return d <= limit;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ depts: 0, groups: 0, docs: 0, pending: 0, reviewDue: 0, isoAlert: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [deptsRes, announcementsRes, docsRes, isoRes] = await Promise.all([
        api.get("/departments"),
        api.get("/announcements"),
        api.get("/documents").catch(() => ({ data: [] })),
        api.get("/iso").catch(() => ({ data: [] })),
      ]);

      const depts = deptsRes.data;
      const totalGroups = depts.reduce((acc: number, d: any) => acc + (d.group_count || 0), 0);
      const docs = (docsRes.data as DocRow[]) || [];
      const isos = (isoRes.data as IsoRow[]) || [];

      setStats({
        depts: depts.length,
        groups: totalGroups,
        docs: docs.length,
        pending: docs.filter((d) => d.status !== "aprovado" && d.status !== "obsoleto").length,
        reviewDue: docs.filter((d) => d.status === "aprovado" && isReviewDue(d.review_date)).length,
        isoAlert: isos.filter((i) => isoNeedsAttention(i.expiry_date)).length,
      });

      setAnnouncements(announcementsRes.data.slice(0, 5));
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Deseja excluir este aviso?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erro ao excluir aviso:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const cards = [
    { label: "Departamentos", value: stats.depts, icon: Building2, color: "bg-primary" },
    { label: "Grupos", value: stats.groups, icon: Layers, color: "bg-info" },
    { label: "Documentos", value: stats.docs, icon: FileText, color: "bg-success" },
    { label: "Pendentes de aprovação", value: stats.pending, icon: AlertTriangle, color: "bg-warning" },
    { label: "Revisões vencendo (30d)", value: stats.reviewDue, icon: Clock, color: "bg-destructive" },
    { label: "ISOs em alerta (60d)", value: stats.isoAlert, icon: ShieldCheck, color: "bg-destructive" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-5 shadow-card border border-border hover-lift animate-rise">
            <span className={`${stat.color} text-primary-foreground p-2 rounded-lg inline-flex mb-3`}>
              <stat.icon size={20} />
            </span>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/avisos?new=1"
          className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
          <Plus size={24} />
          <div className="text-left">
            <p className="font-semibold">Novo Aviso</p>
            <p className="text-xs opacity-80">Publicar comunicado</p>
          </div>
        </Link>

        <Link to="/admin/documentos"
          className="flex items-center gap-3 bg-info text-info-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
          <FilePlus2 size={24} />
          <div className="text-left">
            <p className="font-semibold">Documentos</p>
            <p className="text-xs opacity-80">Versões e aprovação</p>
          </div>
        </Link>

        <Link to="/admin/departamentos"
          className="flex items-center gap-3 bg-secondary text-secondary-foreground border border-border rounded-xl p-5 hover:opacity-90 transition-opacity">
          <Building2 size={24} />
          <div className="text-left">
            <p className="font-semibold">Departamentos</p>
            <p className="text-xs opacity-80">Grupos e estrutura</p>
          </div>
        </Link>

        <Link to="/admin/auditoria"
          className="flex items-center gap-3 bg-warning text-warning-foreground rounded-xl p-5 hover:opacity-90 transition-opacity">
          <ScrollText size={24} />
          <div className="text-left">
            <p className="font-semibold">Auditoria</p>
            <p className="text-xs opacity-80">Histórico de ações</p>
          </div>
        </Link>
      </div>

      {/* Announcements Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Avisos Recentes</h2>
          <Link to="/admin/avisos" className="text-sm text-primary font-medium hover:underline">Ver todos</Link>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum aviso cadastrado ainda.{" "}
              <Link to="/admin/avisos?new=1" className="text-primary hover:underline font-medium">Criar o primeiro</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Validade</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 text-foreground">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.expires_at ? new Date(a.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate("/admin/avisos")}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-primary" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-destructive" title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
