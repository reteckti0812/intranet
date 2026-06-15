import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Search, Plus, History, Upload, Download, Pencil, Trash2,
  RotateCcw, FileText, CheckCircle2, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { downloadFromApi } from "@/lib/download";
import { adminDownloadUrl, adminVersionDownloadUrl } from "@/lib/docsUrl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type DocStatus = "rascunho" | "em_revisao" | "aprovado" | "obsoleto";

interface DocumentRow {
  id: number;
  code: string | null;
  title: string;
  observation: string | null;
  status: DocStatus;
  effective_date: string | null;
  review_date: string | null;
  is_deleted: number;
  current_version_id: number | null;
  group_id: number;
  group_name: string;
  department_id: number;
  department_code: string;
  department_name: string;
  current_version_number: number | null;
  current_file_name: string | null;
  current_file_type: string | null;
  current_size: number | null;
  version_count: number;
}

interface VersionRow {
  id: number;
  version_number: number;
  revision_label: string | null;
  file_name: string;
  file_type: string | null;
  size: number | null;
  change_note: string | null;
  created_by_name: string | null;
  created_at: string;
  is_current: number | boolean;
}

interface GroupOption {
  id: number;
  name: string;
  department_id: number;
  department_name: string;
}

const STATUS_META: Record<DocStatus, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  em_revisao: { label: "Em revisão", className: "bg-amber-500/15 text-amber-600" },
  aprovado: { label: "Aprovado", className: "bg-secondary text-secondary-foreground" },
  obsoleto: { label: "Obsoleto", className: "bg-destructive/15 text-destructive" },
};

function StatusBadge({ status }: { status: DocStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.rascunho;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function formatSize(bytes: number | null): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

const AdminDocumentos = () => {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [groupsOptions, setGroupsOptions] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"active" | "trash">("active");
  const [query, setQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentRow | null>(null);
  const [historyDoc, setHistoryDoc] = useState<DocumentRow | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents", { params: { trash: view === "trash" ? 1 : 0 } });
      setDocuments(res.data as DocumentRow[]);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível carregar os documentos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/departments/groups-all");
      setGroupsOptions(res.data as GroupOption[]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchDocuments(); /* eslint-disable-next-line */ }, [view]);
  useEffect(() => { fetchGroups(); }, []);

  const departments = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of documents) {
      if (!map.has(d.department_id)) map.set(d.department_id, `${d.department_code} - ${d.department_name}`);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [documents]);

  // Um item por NOME de grupo (deduplicado). Ao escolher um nome, a lista mostra
  // os documentos de todos os grupos com esse nome, em qualquer departamento.
  const groups = useMemo(() => {
    const names = new Set<string>();
    for (const d of documents) {
      if (selectedDepartment !== "all" && String(d.department_id) !== selectedDepartment) continue;
      if (d.group_name) names.add(d.group_name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [documents, selectedDepartment]);

  // Reseta o grupo se o nome selecionado deixar de existir (ex.: troca de departamento).
  useEffect(() => {
    if (selectedGroup !== "all" && !groups.includes(selectedGroup)) setSelectedGroup("all");
  }, [groups, selectedGroup]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (selectedDepartment !== "all" && String(d.department_id) !== selectedDepartment) return false;
      if (selectedGroup !== "all" && d.group_name !== selectedGroup) return false;
      if (!term) return true;
      return [d.code || "", d.title, d.department_code, d.department_name, d.group_name]
        .join(" ").toLowerCase().includes(term);
    });
  }, [documents, query, selectedDepartment, selectedGroup]);

  const handleDownloadCurrent = async (d: DocumentRow) => {
    try {
      await downloadFromApi(adminDownloadUrl(d.id), d.current_file_name || d.title);
    } catch {
      toast.error("Não foi possível baixar o documento.");
    }
  };

  const handleSoftDelete = async (d: DocumentRow) => {
    if (!confirm(`Mover "${d.title}" para a lixeira?`)) return;
    try {
      await api.delete(`/documents/${d.id}`);
      toast.success("Documento movido para a lixeira.");
      fetchDocuments();
    } catch {
      toast.error("Falha ao excluir.");
    }
  };

  const handleRestore = async (d: DocumentRow) => {
    try {
      await api.post(`/documents/${d.id}/restore`);
      toast.success("Documento restaurado.");
      fetchDocuments();
    } catch {
      toast.error("Falha ao restaurar.");
    }
  };

  const handlePurge = async (d: DocumentRow) => {
    if (!confirm(`Excluir DEFINITIVAMENTE "${d.title}" e todas as suas versões? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/documents/${d.id}/permanent`);
      toast.success("Documento excluído definitivamente.");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao excluir definitivamente.");
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground">
              Controle total: versões, status (ISO), datas de vigência/revisão e lixeira.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${view === "active" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                onClick={() => setView("active")}
              >
                Ativos
              </button>
              <button
                className={`px-3 py-2 text-sm ${view === "trash" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                onClick={() => setView("trash")}
              >
                Lixeira
              </button>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} className="mr-1" /> Novo documento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9"
              placeholder="Buscar por código, título, departamento, grupo..." />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {groups.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-44">Departamento</TableHead>
                <TableHead className="w-36">Grupo</TableHead>
                <TableHead className="w-28">Versão</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-[260px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum documento encontrado.
                  </TableCell>
                </TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.code || "—"}</TableCell>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.department_code} - {d.department_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.group_name}</TableCell>
                  <TableCell className="text-xs">
                    {d.current_version_number
                      ? <span className="font-medium">v{d.current_version_number}</span>
                      : <span className="text-muted-foreground italic">sem arquivo</span>}
                    <span className="text-muted-foreground"> · {d.version_count} ver.</span>
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {view === "active" ? (
                        <>
                          <IconBtn title="Versões" onClick={() => setHistoryDoc(d)}><History size={16} /></IconBtn>
                          <IconBtn title="Baixar atual" disabled={!d.current_version_id}
                            onClick={() => handleDownloadCurrent(d)}><Download size={16} /></IconBtn>
                          <IconBtn title="Editar" onClick={() => setEditDoc(d)}><Pencil size={16} /></IconBtn>
                          <IconBtn title="Excluir" className="text-destructive" onClick={() => handleSoftDelete(d)}>
                            <Trash2 size={16} />
                          </IconBtn>
                        </>
                      ) : (
                        <>
                          <IconBtn title="Restaurar" onClick={() => handleRestore(d)}><RotateCcw size={16} /></IconBtn>
                          <IconBtn title="Excluir definitivamente" className="text-destructive" onClick={() => handlePurge(d)}>
                            <ShieldAlert size={16} />
                          </IconBtn>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {createOpen && (
        <CreateDocumentDialog
          groups={groupsOptions}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); fetchDocuments(); }}
        />
      )}
      {editDoc && (
        <EditDocumentDialog
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSaved={() => { setEditDoc(null); fetchDocuments(); }}
        />
      )}
      {historyDoc && (
        <VersionHistoryDialog
          doc={historyDoc}
          onClose={() => setHistoryDoc(null)}
          onChanged={fetchDocuments}
        />
      )}
    </div>
  );
};

function IconBtn({
  children, title, onClick, disabled, className = "",
}: {
  children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type="button" title={title} onClick={onClick} disabled={disabled}
      className={`p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Criar documento --------------------------------------------------------

function CreateDocumentDialog({
  groups, onClose, onCreated,
}: { groups: GroupOption[]; onClose: () => void; onCreated: () => void }) {
  const [groupId, setGroupId] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) =>
      `${a.department_name} ${a.name}`.localeCompare(`${b.department_name} ${b.name}`, "pt-BR")),
    [groups]
  );

  const submit = async () => {
    if (!groupId || !title.trim()) { toast.error("Grupo e título são obrigatórios."); return; }
    try {
      setSaving(true);
      await api.post("/documents", { group_id: Number(groupId), code: code.trim() || null, title: title.trim() });
      toast.success("Documento criado. Agora suba a primeira versão.");
      onCreated();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao criar documento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
          <DialogDescription>Cria o documento lógico. O arquivo é enviado depois, em "Versões".</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Grupo *</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
              <SelectContent>
                {sortedGroups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.department_name} › {g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex.: POP-014" />
          </div>
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do documento" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 size={16} className="mr-1 animate-spin" />} Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Editar metadados / status ----------------------------------------------

function EditDocumentDialog({
  doc, onClose, onSaved,
}: { doc: DocumentRow; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(doc.title);
  const [code, setCode] = useState(doc.code || "");
  const [status, setStatus] = useState<DocStatus>(doc.status);
  const [effective, setEffective] = useState(doc.effective_date || "");
  const [review, setReview] = useState(doc.review_date || "");
  const [observation, setObservation] = useState(doc.observation || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) { toast.error("Título é obrigatório."); return; }
    try {
      setSaving(true);
      await api.patch(`/documents/${doc.id}`, {
        title: title.trim(),
        code: code.trim() || null,
        status,
        effective_date: effective || null,
        review_date: review || null,
        observation,
      });
      toast.success("Documento atualizado.");
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar documento</DialogTitle>
          <DialogDescription>{doc.department_code} - {doc.department_name} › {doc.group_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Label>Código</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DocStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_revisao">Em revisão</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="obsoleto">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vigência</Label>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
            </div>
            <div>
              <Label>Próx. revisão</Label>
              <Input type="date" value={review} onChange={(e) => setReview(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} className="min-h-[80px]" />
          </div>
          {status === "aprovado" && (
            <p className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 size={14} /> Ao salvar como "Aprovado", o documento fica visível no site público.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 size={16} className="mr-1 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Histórico de versões ---------------------------------------------------

function VersionHistoryDialog({
  doc, onClose, onChanged,
}: { doc: DocumentRow; onClose: () => void; onChanged: () => void }) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${doc.id}/versions`);
      setVersions(res.data as VersionRow[]);
    } catch {
      toast.error("Falha ao carregar versões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [doc.id]);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecione um arquivo."); return; }
    const fd = new FormData();
    fd.append("file", file);
    if (changeNote.trim()) fd.append("change_note", changeNote.trim());
    try {
      setUploading(true);
      await api.post(`/documents/${doc.id}/versions`, fd);
      toast.success("Nova versão enviada.");
      setChangeNote("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao enviar a versão.");
    } finally {
      setUploading(false);
    }
  };

  const download = async (v: VersionRow) => {
    try {
      await downloadFromApi(adminVersionDownloadUrl(doc.id, v.id), v.file_name);
    } catch {
      toast.error("Falha ao baixar a versão.");
    }
  };

  const rollback = async (v: VersionRow) => {
    if (!confirm(`Reverter para a versão ${v.version_number}? Isso cria uma nova versão atual a partir dela.`)) return;
    try {
      await api.post(`/documents/${doc.id}/versions/${v.id}/restore`);
      toast.success(`Revertido para a versão ${v.version_number}.`);
      await load();
      onChanged();
    } catch {
      toast.error("Falha ao reverter.");
    }
  };

  const remove = async (v: VersionRow) => {
    if (!confirm(`Excluir a versão ${v.version_number}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/documents/${doc.id}/versions/${v.id}`);
      toast.success("Versão excluída.");
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Falha ao excluir versão.");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText size={18} /> {doc.title}</DialogTitle>
          <DialogDescription>{doc.code ? `${doc.code} · ` : ""}{doc.department_code} - {doc.department_name} › {doc.group_name}</DialogDescription>
        </DialogHeader>

        {/* Upload de nova versão */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Upload size={16} /> Enviar nova versão</p>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.xls,.xlsx"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
          <Textarea value={changeNote} onChange={(e) => setChangeNote(e.target.value)}
            placeholder="O que mudou nesta versão? (ex.: revisão do passo 4)" className="min-h-[60px]" />
          <Button size="sm" onClick={upload} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
            Enviar versão
          </Button>
        </div>

        {/* Histórico */}
        <div className="max-h-[40vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-primary" /></div>
          ) : versions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma versão ainda. Envie a primeira acima.</p>
          ) : (
            <div className="divide-y divide-border">
              {versions.map((v) => (
                <div key={v.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      v{v.version_number}
                      {v.is_current ? (
                        <span className="text-[10px] uppercase tracking-wide bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">atual</span>
                      ) : null}
                      <span className="text-muted-foreground font-normal truncate">{v.file_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(v.size)} · {v.created_by_name || "—"} · {formatDate(v.created_at)}
                    </p>
                    {v.change_note ? <p className="text-xs text-foreground/80 mt-1">📝 {v.change_note}</p> : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn title="Baixar" onClick={() => download(v)}><Download size={15} /></IconBtn>
                    {!v.is_current && (
                      <>
                        <IconBtn title="Reverter para esta versão" onClick={() => rollback(v)}><RotateCcw size={15} /></IconBtn>
                        <IconBtn title="Excluir versão" className="text-destructive" onClick={() => remove(v)}><Trash2 size={15} /></IconBtn>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDocumentos;
