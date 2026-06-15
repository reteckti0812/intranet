import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, Pencil, Trash2, RefreshCw, ExternalLink, ShieldCheck, Wifi, WifiOff, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IsoCert {
  id: number;
  name: string;
  standard: string | null;
  cert_number: string | null;
  certifier: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  url: string | null;
  notes: string | null;
  link_status: "online" | "offline" | "unknown" | null;
  link_http_code: number | null;
  link_checked_at: string | null;
}

type ValidityStatus = "valido" | "vencendo" | "vencido" | "sem_data";

const EXPIRING_DAYS = 60;

function validity(expiry: string | null): ValidityStatus {
  if (!expiry) return "sem_data";
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return "sem_data";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return "vencido";
  const limit = new Date(today);
  limit.setDate(limit.getDate() + EXPIRING_DAYS);
  return d <= limit ? "vencendo" : "valido";
}

const VALIDITY_META: Record<ValidityStatus, { label: string; className: string }> = {
  valido: { label: "Válido", className: "bg-secondary text-secondary-foreground" },
  vencendo: { label: "Vencendo", className: "bg-amber-500/15 text-amber-600" },
  vencido: { label: "Vencido", className: "bg-destructive/15 text-destructive" },
  sem_data: { label: "Sem validade", className: "bg-muted text-muted-foreground" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return "nunca";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

const EMPTY = {
  name: "", standard: "", cert_number: "", certifier: "",
  issued_date: "", expiry_date: "", url: "", notes: "",
};

const AdminISO = () => {
  const [certs, setCerts] = useState<IsoCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/iso");
      setCerts(res.data as IsoCert[]);
    } catch {
      toast.error("Não foi possível carregar as certificações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const s = { vencido: 0, vencendo: 0, valido: 0 };
    for (const c of certs) {
      const v = validity(c.expiry_date);
      if (v === "vencido") s.vencido++;
      else if (v === "vencendo") s.vencendo++;
      else if (v === "valido") s.valido++;
    }
    return s;
  }, [certs]);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); setDialogOpen(true); };
  const openEdit = (c: IsoCert) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "", standard: c.standard || "", cert_number: c.cert_number || "",
      certifier: c.certifier || "", issued_date: c.issued_date || "", expiry_date: c.expiry_date || "",
      url: c.url || "", notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    try {
      if (editingId) await api.put(`/iso/${editingId}`, form);
      else await api.post("/iso", form);
      toast.success("Certificação salva.");
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: IsoCert) => {
    if (!confirm(`Excluir a certificação "${c.name}"?`)) return;
    try {
      await api.delete(`/iso/${c.id}`);
      toast.success("Certificação excluída.");
      await load();
    } catch {
      toast.error("Falha ao excluir.");
    }
  };

  const checkOne = async (c: IsoCert) => {
    try {
      const res = await api.post(`/iso/${c.id}/check`);
      const updated = res.data?.cert as IsoCert;
      setCerts((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
      toast.success(`Link verificado: ${updated.link_status}`);
    } catch {
      toast.error("Falha ao verificar o link.");
    }
  };

  const checkAll = async () => {
    setChecking(true);
    try {
      await api.post("/iso/check-all");
      await load();
      toast.success("Links verificados.");
    } catch {
      toast.error("Falha ao verificar.");
    } finally {
      setChecking(false);
    }
  };

  const LinkBadge = ({ c }: { c: IsoCert }) => {
    if (!c.url) return <span className="text-xs text-muted-foreground">sem link</span>;
    const map = {
      online: { icon: <Wifi size={13} />, label: "Online", cls: "text-primary" },
      offline: { icon: <WifiOff size={13} />, label: "Offline", cls: "text-destructive" },
      unknown: { icon: <HelpCircle size={13} />, label: "—", cls: "text-muted-foreground" },
    } as const;
    const m = map[c.link_status || "unknown"];
    return (
      <div className="flex flex-col gap-0.5">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${m.cls}`}>
          {m.icon} {m.label}{c.link_http_code ? ` (${c.link_http_code})` : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">{fmtDateTime(c.link_checked_at)}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ShieldCheck size={22} /> Validade das ISOs</h1>
          <p className="text-sm text-muted-foreground">Monitore a validade das certificações e a disponibilidade dos links (checagem automática a cada 6h).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkAll} disabled={checking}>
            {checking ? <Loader2 size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
            Verificar links agora
          </Button>
          <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nova ISO</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Vencidas", value: summary.vencido, cls: "text-destructive" },
          { label: "Vencendo (60d)", value: summary.vencendo, cls: "text-amber-600" },
          { label: "Válidas", value: summary.valido, cls: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificação</TableHead>
                <TableHead className="w-24">Norma</TableHead>
                <TableHead className="w-32">Validade</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-32">Link</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma certificação cadastrada.</TableCell></TableRow>
              ) : certs.map((c) => {
                const v = VALIDITY_META[validity(c.expiry_date)];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[c.cert_number, c.certifier].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{c.standard || "—"}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.expiry_date)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.className}`}>{v.label}</span>
                    </TableCell>
                    <TableCell><LinkBadge c={c} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" title="Abrir link"
                            className="p-2 rounded-lg hover:bg-accent"><ExternalLink size={15} /></a>
                        )}
                        <button title="Verificar agora" onClick={() => checkOne(c)} className="p-2 rounded-lg hover:bg-accent"><RefreshCw size={15} /></button>
                        <button title="Editar" onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-accent"><Pencil size={15} /></button>
                        <button title="Excluir" onClick={() => remove(c)} className="p-2 rounded-lg hover:bg-accent text-destructive"><Trash2 size={15} /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar certificação" : "Nova certificação ISO"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: ISO 9001 — Gestão da Qualidade" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Norma</Label><Input value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} placeholder="9001" /></div>
              <div><Label>Nº do certificado</Label><Input value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })} /></div>
            </div>
            <div><Label>Órgão certificador</Label><Input value={form.certifier} onChange={(e) => setForm({ ...form, certifier: e.target.value })} placeholder="Ex.: Bureau Veritas" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emissão</Label><Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
              <div><Label>Validade</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
            </div>
            <div><Label>Link do certificado / verificação</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[70px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 size={16} className="mr-1 animate-spin" />} Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminISO;
