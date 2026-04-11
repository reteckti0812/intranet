import { useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Department {
  id: number; code: string; name: string; slug: string; groupsCount: number;
}

interface Group {
  id: number; name: string; departmentId: number; documentsCount: number;
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const initialDepts: Department[] = [
  { id: 1, code: "01", name: "Alta Gestão", slug: "alta-gestao", groupsCount: 2 },
  { id: 2, code: "02", name: "TI", slug: "ti", groupsCount: 3 },
  { id: 3, code: "03", name: "Qualidade", slug: "qualidade", groupsCount: 2 },
  { id: 4, code: "12", name: "Recursos Humanos", slug: "recursos-humanos", groupsCount: 2 },
  { id: 5, code: "13", name: "Financeiro", slug: "financeiro", groupsCount: 1 },
];

const initialGroups: Group[] = [
  { id: 1, name: "Procedimentos", departmentId: 1, documentsCount: 5 },
  { id: 2, name: "Formulários", departmentId: 1, documentsCount: 3 },
  { id: 3, name: "Procedimentos", departmentId: 2, documentsCount: 8 },
  { id: 4, name: "Manuais", departmentId: 2, documentsCount: 4 },
  { id: 5, name: "Templates", departmentId: 2, documentsCount: 2 },
];

const AdminDepartamentos = () => {
  const [depts, setDepts] = useState(initialDepts);
  const [groups, setGroups] = useState(initialGroups);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deptForm, setDeptForm] = useState({ code: "", name: "", slug: "" });
  const [groupForm, setGroupForm] = useState({ name: "", departmentId: 0 });

  const openNewDept = () => { setEditingDept(null); setDeptForm({ code: "", name: "", slug: "" }); setDeptDialogOpen(true); };
  const openEditDept = (d: Department) => { setEditingDept(d); setDeptForm({ code: d.code, name: d.name, slug: d.slug }); setDeptDialogOpen(true); };
  const saveDept = () => {
    if (editingDept) {
      setDepts(prev => prev.map(d => d.id === editingDept.id ? { ...d, ...deptForm } : d));
    } else {
      setDepts(prev => [...prev, { id: Date.now(), ...deptForm, groupsCount: 0 }]);
    }
    setDeptDialogOpen(false);
  };
  const deleteDept = (id: number) => setDepts(prev => prev.filter(d => d.id !== id));

  const openNewGroup = () => { setEditingGroup(null); setGroupForm({ name: "", departmentId: depts[0]?.id || 0 }); setGroupDialogOpen(true); };
  const openEditGroup = (g: Group) => { setEditingGroup(g); setGroupForm({ name: g.name, departmentId: g.departmentId }); setGroupDialogOpen(true); };
  const saveGroup = () => {
    if (editingGroup) {
      setGroups(prev => prev.map(g => g.id === editingGroup.id ? { ...g, ...groupForm } : g));
    } else {
      setGroups(prev => [...prev, { id: Date.now(), ...groupForm, documentsCount: 0 }]);
    }
    setGroupDialogOpen(false);
  };
  const deleteGroup = (id: number) => setGroups(prev => prev.filter(g => g.id !== id));

  const openFolder = (path: string) => toast.info(`Abrir pasta: ${path}`);

  return (
    <div>
      {/* Departments */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Departamentos</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openFolder("C:\\Intranet\\Documentos\\Departamentos")}>
            <FolderOpen size={16} className="mr-2" />Abrir Pasta Geral
          </Button>
          <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDept}><Plus size={16} className="mr-2" />Novo Departamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingDept ? "Editar Departamento" : "Novo Departamento"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Código</Label><Input value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="01" /></div>
                <div><Label>Nome</Label><Input value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value, slug: slugify(e.target.value) })} /></div>
                <div><Label>Slug</Label><Input value={deptForm.slug} onChange={e => setDeptForm({ ...deptForm, slug: e.target.value })} /></div>
                <Button className="w-full" onClick={saveDept}>Salvar</Button>
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
            {depts.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{d.code}</TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{d.slug}</TableCell>
                <TableCell className="text-center">{d.groupsCount}</TableCell>
                <TableCell className="text-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDept(d)}><Pencil size={14} /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir departamento</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{d.name}"?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteDept(d.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" className="text-warning" onClick={() => openFolder(`C:\\Intranet\\Documentos\\${d.slug}`)}>
                    <FolderOpen size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Groups */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Grupos</h2>
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={openNewGroup}><Plus size={16} className="mr-2" />Novo Grupo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingGroup ? "Editar Grupo" : "Novo Grupo"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Nome</Label><Input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} /></div>
              <div>
                <Label>Departamento</Label>
                <Select value={String(groupForm.departmentId)} onValueChange={v => setGroupForm({ ...groupForm, departmentId: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{depts.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={saveGroup}>Salvar</Button>
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
            {groups.map(g => {
              const dept = depts.find(d => d.id === g.departmentId);
              return (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dept?.name || "—"}</TableCell>
                  <TableCell className="text-center">{g.documentsCount}</TableCell>
                  <TableCell className="text-center space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditGroup(g)}><Pencil size={14} /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir grupo</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{g.name}"?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteGroup(g.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="text-warning" onClick={() => openFolder(`C:\\Intranet\\Documentos\\${dept?.slug}\\${g.name}`)}>
                      <FolderOpen size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDepartamentos;
