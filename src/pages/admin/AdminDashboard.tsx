import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Building2, Layers, FileText, Calendar, Plus, RefreshCw,
  FolderOpen, CheckCircle2, AlertTriangle, Loader2, Pencil, Trash2,
  Globe, HardDrive,
} from "lucide-react";
import api from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  expires_at: string;
}

interface Stats {
  depts: number;
  groups: number;
  docs: number;
  lastSyncIntranet: string;
  lastSyncDocuments: string;
}

function formatLastSync(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    depts: 0,
    groups: 0,
    docs: 0,
    lastSyncIntranet: "—",
    lastSyncDocuments: "—",
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [syncingKind, setSyncingKind] = useState<"intranet" | "documentos" | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [deptsRes, announcementsRes, syncStatusRes] = await Promise.all([
        api.get("/departments"),
        api.get("/announcements"),
        api.get("/sync/status").catch(() => ({ data: null })),
      ]);

      const depts = deptsRes.data;
      const totalGroups = depts.reduce((acc: number, d: any) => acc + (d.group_count || 0), 0);
      const totalDocs = depts.reduce((acc: number, d: any) => acc + (d.doc_count || 0), 0);

      const sync = syncStatusRes.data as {
        intranet?: { lastSyncAt?: string | null };
        documents?: { lastSyncAt?: string | null };
      } | null;

      setStats({
        depts: depts.length,
        groups: totalGroups,
        docs: totalDocs,
        lastSyncIntranet: formatLastSync(sync?.intranet?.lastSyncAt ?? null),
        lastSyncDocuments: formatLastSync(sync?.documents?.lastSyncAt ?? null),
      });

      setAnnouncements(announcementsRes.data.slice(0, 5));
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const runSync = async (kind: "intranet" | "documentos") => {
    setSyncingKind(kind);
    setSyncResult(null);
    const path = kind === "intranet" ? "/sync/pasta-para-site" : "/sync/bd-para-pasta";
    try {
      const response = await api.post(path);
      setSyncResult({ success: true, message: response.data.message || "Concluído." });
      await fetchData();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.response?.data?.message || "Erro na sincronização.",
      });
    } finally {
      setSyncingKind(null);
    }
  };

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Departamentos", value: stats.depts, icon: Building2, color: "bg-primary" },
          { label: "Grupos", value: stats.groups, icon: Layers, color: "bg-info" },
          { label: "Documentos Ativos", value: stats.docs, icon: FileText, color: "bg-success" },
          {
            label: "Últimas sincronizações",
            value: null as string | null,
            icon: Calendar,
            color: "bg-warning",
            syncLines: [
              { k: "→ Intranet", v: stats.lastSyncIntranet },
              { k: "→ Pastas", v: stats.lastSyncDocuments },
            ],
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className={`${stat.color} text-primary-foreground p-2 rounded-lg`}>
                <stat.icon size={20} />
              </span>
            </div>
            {"syncLines" in stat && stat.syncLines ? (
              <div className="space-y-2">
                {stat.syncLines.map((line) => (
                  <div key={line.k}>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {line.k}
                    </p>
                    <p className="text-sm font-bold text-foreground leading-tight">{line.v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Link
          to="/admin/avisos?new=1"
          className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity"
          title="Novo Aviso"
        >
          <Plus size={24} />
          <div className="text-left">
            <p className="font-semibold">Novo Aviso</p>
            <p className="text-xs opacity-80">Publicar comunicado</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => runSync("documentos")}
          disabled={syncingKind !== null}
          className="flex items-center gap-3 bg-info text-info-foreground rounded-xl p-5 hover:opacity-90 transition-opacity disabled:opacity-60 text-left"
        >
          {syncingKind === "intranet" ? (
            <RefreshCw size={24} className="animate-spin shrink-0" />
          ) : (
            <Globe size={24} className="shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {syncingKind === "intranet" ? "A sincronizar…" : "Sincronizar a Intranet"}
            </p>
            <p className="text-xs opacity-80">Pastas Documentos → site</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => runSync("intranet")}
          disabled={syncingKind !== null}
          className="flex items-center gap-3 bg-secondary text-secondary-foreground rounded-xl p-5 hover:opacity-90 transition-opacity disabled:opacity-60 border border-border text-left"
        >
          {syncingKind === "documentos" ? (
            <RefreshCw size={24} className="animate-spin shrink-0" />
          ) : (
            <HardDrive size={24} className="shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {syncingKind === "documentos" ? "A sincronizar…" : "Sincronizar os documentos"}
            </p>
            <p className="text-xs opacity-80">Base de dados → pasta Documentos</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => api.get("/open-folder").catch(() => {})}
          className="flex items-center gap-3 bg-warning text-warning-foreground rounded-xl p-5 hover:opacity-90 transition-opacity text-left"
        >
          <FolderOpen size={24} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold">Abrir Pasta</p>
            <p className="text-xs opacity-80">C:\Intranet\Documentos</p>
          </div>
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border text-sm font-medium
          ${syncResult.success
            ? "bg-green-500/10 border-green-500/20 text-green-600"
            : "bg-destructive/10 border-destructive/20 text-destructive"}`}
        >
          {syncResult.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {syncResult.message}
        </div>
      )}

      {/* Announcements Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Avisos Recentes</h2>
          <Link to="/admin/avisos" className="text-sm text-primary font-medium hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum aviso cadastrado ainda.{" "}
              <Link to="/admin/avisos?new=1" className="text-primary hover:underline font-medium">
                Criar o primeiro
              </Link>
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
                      {a.expires_at
                        ? new Date(a.expires_at).toLocaleDateString("pt-BR")
                        : "Sem validade"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate("/admin/avisos")}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-primary"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-destructive"
                          title="Excluir"
                        >
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