import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";

interface Department {
  id: number;
  code: string;
  name: string;
  slug: string;
  folder_path: string;
  group_count: number;
  doc_count: number;
}

interface Group {
  id: number;
  name: string;
  department_id: number;
  department_name: string;
  folder_path: string;
  doc_count: number;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminDepartamentos = () => {
  const [depts, setDepts] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);

  const [deptForm, setDeptForm] = useState({ code: "", name: "", slug: "" });
  const [groupForm, setGroupForm] = useState({ name: "", department_id: 0 });

  const fetchData = async () => {
    try {
      const [deptRes, groupRes] = await Promise.all([
        api.get("/departments"),
        api.get("/departments/groups-all"),
      ]);
      setDepts(deptRes.data);
      setGroups(groupRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openFolder = (path: string) => {
    api.get(`/open-folder?path=${encodeURIComponent(path)}`).catch(() =>
      toast.error("Não foi possível abrir a pasta.")
    );
  };

  // ── Departamentos ──────────────────────────────────────────
  const openNewDept = () => {
    setEditingDept(null);
    setDeptForm({ code: "", name: "", slug: "" });
    setDeptDialogOpen(true);
  };

  const openEditDept = (d: Department) => {
    setEditingDept(d);
    setDeptForm({ code: d.code, name: d.name, slug: d.slug });
    setDeptDialogOpen(true);
  };

  const saveDept = async () => {
    if (!deptForm.code || !deptForm.name) return toast.error("Preencha código e nome.");
    setSaving(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, deptForm);
        toast.success("Departamento atualizado.");
      } else {
        await api.post("/departments", deptForm);
        toast.success("Departamento criado.");
      }
      await fetchData();
      setDeptDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erro ao salvar departamento.");
    } finally {
      setSaving(false);
    }
  };

  const deleteDept = async (id: number) => {
    try {
      await api.delete(`/departments/${id}`);
      toast.success("Departamento excluído.");
      await fetchData();
    } catch {
      toast.error("Erro ao excluir departamento.");
    }
  };

  // ── Grupos ─────────────────────────────────────────────────
  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: "", department_id: depts[0]?.id || 0 });
    setGroupDialogOpen(true);
  };

  const openEditGroup = (g: Group) => {
    setEditingGroup(g);
    setGroupForm({ name: g.name, department_id: g.department_id });
    setGroupDialogOpen(true);
  };

  const saveGroup = async () => {
    if (!groupForm.name || !groupForm.department_id) return toast.error("Preencha todos os campos.");
    setSaving(true);
    try {
      if (editingGroup) {
        await api.put(`/departments/groups/${editingGroup.id}`, groupForm);
        toast.success("Grupo atualizado.");
      } else {
        await api.post("/departments/groups", groupForm);
        toast.success("Grupo criado.");
      }
      await fetchData();
      setGroupDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Erro ao salvar grupo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      await api.delete(`/departments/groups/${id}`);
      toast.success("Grupo excluído.");
      await fetchData();
    } catch {
      toast.error("Erro ao excluir grupo.");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div>
      {/* ── Departamentos ── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Departamentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openFolder("C:\\Intranet\\Documentos")}>
            <FolderOpen size={16} className="mr-2" />Abrir Pasta Geral
          </Button>

          <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDept}><Plus size={16} className="mr-2" />Novo Departamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={deptForm.code}
                    onChange={e => setDeptForm({ ...deptForm, code: e.target.value })}
                    placeholder="01"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={deptForm.name}
                    onChange={e => setDeptForm({ ...deptForm, name: e.target.value, slug: slugify(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={deptForm.slug}
                    onChange={e => setDeptForm({ ...deptForm, slug: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button className="w-full" onClick={saveDept} disabled={saving}>
                  {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden mb-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Cód.</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-40">Slug</TableHead>
              <TableHead className="w-20 text-center">Grupos</TableHead>
              <TableHead className="w-44 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {depts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum departamento. Use <strong>Sincronizar Docs</strong> para importar automaticamente.
                </TableCell>
              </TableRow>
            ) : (
              depts.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{d.slug}</TableCell>
                  <TableCell className="text-center">{d.group_count}</TableCell>
                  <TableCell className="text-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDept(d)}>
                      <Pencil size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir departamento</AlertDialogTitle>
                          <AlertDialogDescription>Deseja excluir "{d.name}"? Todos os grupos e documentos vinculados serão removidos do banco.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDept(d.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="text-warning" onClick={() => openFolder(d.folder_path)}>
                      <FolderOpen size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Grupos ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Grupos</h2>
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={openNewGroup}>
              <Plus size={16} className="mr-2" />Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome</Label>
                <Input
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Departamento</Label>
                <Select
                  value={String(groupForm.department_id)}
                  onValueChange={v => setGroupForm({ ...groupForm, department_id: Number(v) })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {depts.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={saveGroup} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="w-24 text-center">Docs</TableHead>
              <TableHead className="w-40 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Nenhum grupo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              groups.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{g.department_name}</TableCell>
                  <TableCell className="text-center">{g.doc_count}</TableCell>
                  <TableCell className="text-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditGroup(g)}>
                      <Pencil size={14} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir grupo</AlertDialogTitle>
                          <AlertDialogDescription>Deseja excluir "{g.name}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteGroup(g.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="text-warning" onClick={() => openFolder(g.folder_path)}>
                      <FolderOpen size={14} />
                    </Button>
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

export default AdminDepartamentos;