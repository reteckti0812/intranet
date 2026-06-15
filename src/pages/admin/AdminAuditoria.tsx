import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface AuditEntry {
  id: number;
  admin_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  create_document: "Criou documento",
  update_document: "Editou documento",
  delete_document: "Enviou p/ lixeira",
  restore_document: "Restaurou documento",
  purge_document: "Excluiu definitivamente",
  upload_version: "Enviou nova versão",
  rollback_version: "Reverteu versão",
  delete_version: "Excluiu versão",
  download: "Baixou",
  create_admin: "Criou administrador",
  update_admin: "Editou administrador",
  delete_admin: "Excluiu administrador",
  reset_password: "Resetou senha",
  create_iso: "Cadastrou ISO",
  update_iso: "Editou ISO",
  delete_iso: "Excluiu ISO",
};

function describe(e: AuditEntry): string {
  const base = ACTION_LABEL[e.action] || e.action;
  const d = (e.details || {}) as Record<string, unknown>;
  const label = (d.file || d.name) as string | undefined;
  if (label) return `${base} — ${label}`;
  if (e.entity_id) return `${base} (#${e.entity_id})`;
  return base;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

const AdminAuditoria = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/audit", { params: { limit: 300 } });
        setEntries(res.data as AuditEntry[]);
      } catch {
        toast.error("Não foi possível carregar a auditoria.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ScrollText size={22} /> Auditoria
        </h1>
        <p className="text-sm text-muted-foreground">Registro de quem fez o quê nos documentos e versões.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Data</TableHead>
                <TableHead className="w-48">Usuário</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    Nenhum registro ainda.
                  </TableCell>
                </TableRow>
              ) : entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(e.created_at)}</TableCell>
                  <TableCell className="text-sm">{e.admin_name || "—"}</TableCell>
                  <TableCell className="text-sm">{describe(e)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditoria;
