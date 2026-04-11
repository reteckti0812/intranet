import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: number;
  title: string;
  description: string;
  expiryDate: string;
  active: boolean;
}

const initialData: Announcement[] = [
  { id: 1, title: "Atualização da Política de Qualidade", description: "Nova versão da política foi publicada.", expiryDate: "2026-04-30", active: true },
  { id: 2, title: "Novo procedimento de Segurança de Dados R2", description: "Procedimento atualizado conforme norma.", expiryDate: "2026-05-15", active: true },
  { id: 3, title: "Treinamento de Integração - Abril 2026", description: "Treinamento obrigatório para novos colaboradores.", expiryDate: "2026-04-30", active: true },
  { id: 4, title: "Aviso antigo expirado", description: "Este aviso já passou da validade.", expiryDate: "2026-03-01", active: false },
];

const AdminAvisos = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", description: "", expiryDate: "", active: true });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", expiryDate: "", active: true });
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description, expiryDate: a.expiryDate, active: a.active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setAnnouncements(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a));
    } else {
      setAnnouncements(prev => [...prev, { id: Date.now(), ...form }]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Avisos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus size={16} className="mr-2" />Novo Aviso</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
              </div>
              <div>
                <Label>Data de Validade</Label>
                <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
                <Label>Ativo</Label>
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
              <TableHead>Título</TableHead>
              <TableHead className="w-36">Validade</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-32 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(a.expiryDate).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={a.active ? "default" : "secondary"}>{a.active ? "Ativo" : "Expirado"}</Badge>
                </TableCell>
                <TableCell className="text-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 size={14} /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Deseja realmente excluir o aviso "{a.title}"?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
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

export default AdminAvisos;
