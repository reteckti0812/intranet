import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";

type AdminRole = "super" | "admin";

interface AdminRow {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  last_login_at: string | null;
  created_at?: string;
}

function readCurrentAdmin(): { id: number; role: AdminRole; name: string; email: string } | null {
  try {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id: number; role?: AdminRole; name: string; email: string };
    return { ...u, role: u.role === "super" ? "super" : "admin" };
  } catch {
    return null;
  }
}

function roleLabel(r: AdminRole) {
  return r === "super" ? "Super Admin" : "Admin";
}

function formatLogin(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

const AdminUsuarios = () => {
  const [users, setUsers] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<ReturnType<typeof readCurrentAdmin>>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as AdminRole,
  });

  const isSuper = me?.role === "super";

  const loadUsers = useCallback(async () => {
    setMe(readCurrentAdmin());
    try {
      const { data } = await api.get<AdminRow[]>("/admins");
      setUsers(data.map((u) => ({ ...u, role: u.role === "super" ? "super" : "admin" })));
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Erro ao carregar administradores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
    });
    setDialogOpen(true);
  };

  const openEdit = (u: AdminRow) => {
    if (!isSuper && u.role === "super") {
      toast.error("Não é permitido editar um Super Admin.");
      return;
    }
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      confirmPassword: "",
      role: u.role,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (!editing) {
      if (!form.password || form.password !== form.confirmPassword) {
        toast.error("Senha e confirmação devem coincidir.");
        return;
      }
    } else if (form.password && form.password !== form.confirmPassword) {
      toast.error("Senha e confirmação devem coincidir.");
      return;
    }

    const payloadRole: AdminRole = isSuper && form.role === "super" ? "super" : "admin";

    setSaving(true);
    try {
      if (editing) {
        const body: Record<string, string> = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: payloadRole,
        };
        if (form.password) body.password = form.password;
        await api.put(`/admins/${editing.id}`, body);
        toast.success("Usuário atualizado.");
      } else {
        await api.post("/admins", {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: payloadRole,
        });
        toast.success("Administrador criado.");
      }
      setDialogOpen(false);
      await loadUsers();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AdminRow) => {
    if (!isSuper && u.role === "super") {
      toast.error("Apenas Super Admin pode excluir outro Super Admin.");
      return;
    }
    try {
      await api.delete(`/admins/${u.id}`);
      toast.success("Usuário removido.");
      await loadUsers();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Erro ao excluir.");
    }
  };

  const canEditRow = (u: AdminRow) => isSuper || u.role !== "super";
  const canDeleteRow = (u: AdminRow) => (isSuper || u.role !== "super") && u.id !== me?.id;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários Admin</h1>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" />
          Novo Admin
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        <strong>Super Admin</strong> pode criar e remover qualquer administrador.{" "}
        <strong>Admin</strong> normal só gere contas com papel &quot;Admin&quot; (não pode criar nem apagar Super
        Admin).
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar utilizador" : "Novo administrador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            {!editing && (
              <>
                <div>
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Confirmar senha</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                </div>
              </>
            )}
            {editing && (
              <div>
                <Label>Nova senha (opcional)</Label>
                <Input
                  type="password"
                  value={form.password}
                  placeholder="Deixe vazio para manter"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            )}
            {editing && form.password ? (
              <div>
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            ) : null}
            <div>
              <Label>Papel</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as AdminRole })}
                disabled={!isSuper}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuper && <SelectItem value="super">Super Admin</SelectItem>}
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              {!isSuper && (
                <p className="text-xs text-muted-foreground mt-1">Apenas Super Admin pode definir Super Admin.</p>
              )}
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin size-4" /> : "Guardar"}
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
              <TableHead className="w-36">Papel</TableHead>
              <TableHead className="w-44">Último acesso</TableHead>
              <TableHead className="w-28 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum administrador na base.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "super" ? "default" : "secondary"}>{roleLabel(u.role)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatLogin(u.last_login_at)}</TableCell>
                  <TableCell className="text-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={!canEditRow(u)}
                      onClick={() => openEdit(u)}
                      title={canEditRow(u) ? "Editar" : "Sem permissão"}
                    >
                      <Pencil size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={!canDeleteRow(u)}
                          title={!canDeleteRow(u) ? "Sem permissão" : "Excluir"}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir utilizador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remover &quot;{u.name}&quot; ({u.email})? Esta ação não pode ser anulada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => handleDelete(u)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsuarios;
