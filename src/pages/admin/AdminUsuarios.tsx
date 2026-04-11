import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: number; name: string; email: string; role: string; lastLogin: string;
}

const initialUsers: AdminUser[] = [
  { id: 1, name: "Carlos Silva", email: "carlos@re-teck.com", role: "Super Admin", lastLogin: "07/04/2026 14:20" },
  { id: 2, name: "Ana Costa", email: "ana@re-teck.com", role: "Admin", lastLogin: "06/04/2026 09:15" },
  { id: 3, name: "Rafael Lima", email: "rafael@re-teck.com", role: "Admin", lastLogin: "05/04/2026 16:45" },
];

const AdminUsuarios = () => {
  const [users, setUsers] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "Admin" });

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", password: "", confirmPassword: "", role: "Admin" }); setDialogOpen(true); };
  const openEdit = (u: AdminUser) => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", confirmPassword: "", role: u.role }); setDialogOpen(true); };

  const handleSave = () => {
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, name: form.name, email: form.email, role: form.role } : u));
    } else {
      setUsers(prev => [...prev, { id: Date.now(), name: form.name, email: form.email, role: form.role, lastLogin: "—" }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => setUsers(prev => prev.filter(u => u.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Usuários Admin</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus size={16} className="mr-2" />Novo Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Usuário" : "Novo Administrador"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              {!editing && (
                <>
                  <div><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                  <div><Label>Confirmar Senha</Label><Input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></div>
                </>
              )}
              <div>
                <Label>Papel</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-32">Papel</TableHead>
              <TableHead className="w-40">Último Login</TableHead>
              <TableHead className="w-28 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><Badge variant={u.role === "Super Admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{u.lastLogin}</TableCell>
                <TableCell className="text-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Excluir usuário</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{u.name}"?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(u.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
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
