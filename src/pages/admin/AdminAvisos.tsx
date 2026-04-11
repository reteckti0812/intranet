import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  content: string;
  expires_at: string | null;
  priority: number;
  created_at?: string;
}

const AdminAvisos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    expires_at: "",
    priority: 0,
  });

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get("/announcements");
      setAnnouncements(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao carregar avisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openNew();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      expires_at: "",
      priority: 0,
    });
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      expires_at: announcement.expires_at
        ? announcement.expires_at.split("T")[0]
        : "",
      priority: announcement.priority || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Preencha o título e a descrição.");
      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await api.put(`/announcements/${editing.id}`, form);
        toast.success("Aviso atualizado com sucesso.");
      } else {
        await api.post("/announcements", form);
        toast.success("Aviso criado com sucesso.");
      }

      await fetchAnnouncements();
      setDialogOpen(false);
      setEditing(null);
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao salvar aviso.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      toast.success("Aviso excluído com sucesso.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao excluir aviso.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Avisos</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus size={16} className="mr-2" />
              Novo Aviso
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label>Título</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label>Data de Validade</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.priority > 0}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, priority: checked ? 1 : 0 })
                  }
                />
                <Label>Urgente</Label>
              </div>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead className="w-40">Validade</TableHead>
                <TableHead className="w-32 text-center">Prioridade</TableHead>
                <TableHead className="w-36 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    Nenhum aviso cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{a.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {a.content}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {a.expires_at
                        ? new Date(a.expires_at).toLocaleDateString("pt-BR")
                        : "Sem validade"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={a.priority > 0 ? "default" : "secondary"}>
                        {a.priority > 0 ? "Urgente" : "Normal"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil size={14} />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente excluir o aviso "{a.title}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(a.id)}>
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
        )}
      </div>
    </div>
  );
};

export default AdminAvisos;