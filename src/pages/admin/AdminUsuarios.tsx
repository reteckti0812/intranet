import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

type AdminRole = "owner" | "admin" | "user";

interface DeptRef { id: number; code: string; name: string; }
interface AdminRow {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  last_login_at: string | null;
  created_at?: string;
  departments: DeptRef[];
}

const normRole = (r?: string): AdminRole =>
  r === "owner" || r === "super" ? "owner" : r === "admin" ? "admin" : "user";

function readCurrentAdmin(): { id: number; role: AdminRole; name: string } | null {
  try {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id: number; role?: string; name: string };
    return { ...u, role: normRole(u.role) };
  } catch {
    return null;
  }
}

const roleLabel = (r: AdminRole) => (r === "owner" ? "Owner" : r === "admin" ? "Admin" : "Usuário");
const roleVariant = (r: AdminRole) => (r === "owner" ? "default" : r === "admin" ? "secondary" : "outline");

function formatLogin(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}
function errMsg(e: unknown): string | undefined {
  return e && typeof e === "object" && "response" in e
    ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
    : undefined;
}

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminRow[]>([]);
  const [allDepts, setAllDepts] = useState<DeptRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<ReturnType<typeof readCurrentAdmin>>(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "user" as AdminRole, department_ids: [] as number[],
  });

  // Reset de senha
  const [resetUser, setResetUser] = useState<AdminRow | null>(null);
  const [resetPwd, setResetPwd] = useState({ password: "", confirm: "" });
  const [resetting, setResetting] = useState(false);

  const isOwner = me?.role === "owner";

  const loadUsers = useCallback(async () => {
    setMe(readCurrentAdmin());
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get<AdminRow[]>("/admins"),
        api.get("/departments"),
      ]);
      setUsers(usersRes.data.map((u) => ({ ...u, role: normRole(u.role), departments: u.departments || [] })));
      setAllDepts(
        (deptsRes.data as DeptRef[])
          .map((d) => ({ id: d.id, code: d.code, name: d.name }))
          .sort((a, b) => String(a.code).localeCompare(String(b.code), "pt-BR", { numeric: true }))
      );
    } catch (e) {
      toast.error(errMsg(e) || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "user", department_ids: [] });
    setDialogOpen(true);
  };

  const openEdit = (u: AdminRow) => {
    if (!isOwner && u.role === "owner") { toast.error("Não é permitido editar o Owner."); return; }
    setEditing(u);
    setForm({
      name: u.name, email: u.email, password: "", confirmPassword: "",
      role: u.role, department_ids: u.departments.map((d) => d.id),
    });
    setDialogOpen(true);
  };

  const toggleDept = (id: number) => {
    setForm((f) => ({
      ...f,
      department_ids: f.department_ids.includes(id)
        ? f.department_ids.filter((x) => x !== id)
        : [...f.department_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Preencha nome e e-mail."); return; }
    if (!editing && (!form.password || form.password !== form.confirmPassword)) {
      toast.error("Senha e confirmação devem coincidir."); return;
    }
    if (form.role === "user" && form.department_ids.length === 0) {
      toast.error("Selecione ao menos um setor para o usuário."); return;
    }

    const payloadRole: AdminRole = !isOwner && form.role === "owner" ? "admin" : form.role;
    const body: Record<string, unknown> = {
      name: form.name.trim(), email: form.email.trim(), role: payloadRole,
      department_ids: payloadRole === "user" ? form.department_ids : [],
    };

    setSaving(true);
    try {
      if (editing) {
        if (form.password) body.password = form.password;
        await api.put(`/admins/${editing.id}`, body);
        toast.success("Usuário atualizado.");
      } else {
        body.password = form.password;
        await api.post("/admins", body);
        toast.success("Usuário criado.");
      }
      setDialogOpen(false);
      await loadUsers();
    } catch (e) {
      toast.error(errMsg(e) || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminRow) => {
    try {
      await api.delete(`/admins/${u.id}`);
      toast.success("Usuário removido.");
      if (u.id === me?.id) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        navigate("/login");
        return;
      }
      await loadUsers();
    } catch (e) {
      toast.error(errMsg(e) || "Erro ao excluir.");
    }
  };

  const openReset = (u: AdminRow) => {
    if (!isOwner && u.role === "owner") { toast.error("Não é permitido resetar a senha do Owner."); return; }
    setResetUser(u);
    setResetPwd({ password: "", confirm: "" });
  };

  const handleReset = async () => {
    if (!resetUser) return;
    if (!resetPwd.password || resetPwd.password.length < 6) { toast.error("A senha precisa de ao menos 6 caracteres."); return; }
    if (resetPwd.password !== resetPwd.confirm) { toast.error("Senha e confirmação devem coincidir."); return; }
    setResetting(true);
    try {
      await api.post(`/admins/${resetUser.id}/reset-password`, { password: resetPwd.password });
      toast.success(`Senha de ${resetUser.name} redefinida.`);
      setResetUser(null);
    } catch (e) {
      toast.error(errMsg(e) || "Erro ao resetar senha.");
    } finally {
      setResetting(false);
    }
  };

  const canEditRow = (u: AdminRow) => isOwner || u.role !== "owner";
  const canDeleteRow = (u: AdminRow) => u.role !== "owner";
  const canResetRow = (u: AdminRow) => isOwner || u.role !== "owner";

  if (loading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-2" />Novo usuário</Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        <strong>Usuários</strong> acessam o site e veem apenas os <strong>setores</strong> vinculados a eles.{" "}
        <strong>Admin/Owner</strong> veem tudo e gerenciam o sistema. Só o Owner mexe em outro Owner.
      </p>

      {/* Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Senha</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div><Label>Confirmar senha</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
              </div>
            )}
            {editing && (
              <p className="text-xs text-muted-foreground">Para trocar a senha use o botão <strong>Resetar senha</strong> na lista.</p>
            )}
            <div>
              <Label>Papel</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AdminRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário (vê só seus setores)</SelectItem>
                  <SelectItem value="admin">Admin (vê tudo)</SelectItem>
                  {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {form.role === "user" && (
              <div>
                <Label>Setores que este usuário pode ver</Label>
                <div className="mt-1.5 max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {allDepts.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">Nenhum departamento cadastrado.</p>
                  ) : allDepts.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={form.department_ids.includes(d.id)}
                        onChange={() => toggleDept(d.id)}
                        className="accent-primary"
                      />
                      <span className="font-mono text-xs text-muted-foreground w-10">{d.code}</span>
                      <span className="truncate">{d.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{form.department_ids.length} setor(es) selecionado(s).</p>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin size-4" /> : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset de senha */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetar senha</DialogTitle>
            <DialogDescription>{resetUser ? `${resetUser.name} (${resetUser.email})` : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nova senha</Label><Input type="password" value={resetPwd.password} onChange={(e) => setResetPwd({ ...resetPwd, password: e.target.value })} /></div>
            <div><Label>Confirmar nova senha</Label><Input type="password" value={resetPwd.confirm} onChange={(e) => setResetPwd({ ...resetPwd, confirm: e.target.value })} /></div>
            <Button className="w-full" onClick={handleReset} disabled={resetting}>
              {resetting ? <Loader2 className="animate-spin size-4" /> : "Redefinir senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24">Papel</TableHead>
              <TableHead className="w-64">Setores</TableHead>
              <TableHead className="w-40">Último acesso</TableHead>
              <TableHead className="w-36 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum usuário na base.</TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}{u.id === me?.id ? <span className="text-xs text-muted-foreground"> (você)</span> : null}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant={roleVariant(u.role)}>{roleLabel(u.role)}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.role !== "user"
                    ? <span className="text-primary font-medium">Todos os setores</span>
                    : u.departments.length === 0
                      ? <span className="text-destructive">Nenhum setor</span>
                      : u.departments.map((d) => d.code).join(", ")}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatLogin(u.last_login_at)}</TableCell>
                <TableCell className="text-center space-x-1 whitespace-nowrap">
                  <Button variant="ghost" size="icon" disabled={!canResetRow(u)} onClick={() => openReset(u)} title={canResetRow(u) ? "Resetar senha" : "Sem permissão"}>
                    <KeyRound size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={!canEditRow(u)} onClick={() => openEdit(u)} title={canEditRow(u) ? "Editar" : "Sem permissão"}>
                    <Pencil size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive" disabled={!canDeleteRow(u)} title={!canDeleteRow(u) ? "O Owner não pode ser excluído" : "Excluir"}>
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                          {u.id === me?.id
                            ? "Você está excluindo a sua própria conta e será desconectado. Continuar?"
                            : `Remover "${u.name}" (${u.email})? Esta ação não pode ser anulada.`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDelete(u)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsuarios;
