import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DocumentRow {
  id: number;
  code: string | null;
  title: string;
  file_path: string;
  file_type: string | null;
  created_at: string | null;
  observation: string | null;
  group_id: number;
  group_name: string;
  department_id: number;
  department_code: string;
  department_name: string;
  department_slug: string;
}

const AdminDocumentos = () => {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments/documents-all");
      const rows = response.data as DocumentRow[];
      setDocuments(rows);

      const initialDrafts: Record<number, string> = {};
      for (const row of rows) {
        initialDrafts[row.id] = row.observation || "";
      }
      setDrafts(initialDrafts);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
      toast.error("Não foi possível carregar os documentos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const departments = useMemo(() => {
    const map = new Map<number, { id: number; label: string }>();
    for (const doc of documents) {
      if (!map.has(doc.department_id)) {
        map.set(doc.department_id, {
          id: doc.department_id,
          label: `${doc.department_code} - ${doc.department_name}`,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [documents]);

  const groups = useMemo(() => {
    const map = new Map<string, { id: number; name: string }>();
    for (const doc of documents) {
      if (selectedDepartment !== "all" && String(doc.department_id) !== selectedDepartment) continue;
      const key = `${doc.group_id}`;
      if (!map.has(key)) {
        map.set(key, { id: doc.group_id, name: doc.group_name });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [documents, selectedDepartment]);

  useEffect(() => {
    if (selectedGroup === "all") return;
    const groupStillExists = groups.some((g) => String(g.id) === selectedGroup);
    if (!groupStillExists) {
      setSelectedGroup("all");
    }
  }, [groups, selectedGroup]);

  const filteredDocs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (selectedDepartment !== "all" && String(doc.department_id) !== selectedDepartment) {
        return false;
      }
      if (selectedGroup !== "all" && String(doc.group_id) !== selectedGroup) {
        return false;
      }
      if (!term) return true;

      const haystack = [
        doc.code || "",
        doc.title,
        doc.department_code,
        doc.department_name,
        doc.group_name,
        doc.file_type || "",
        doc.file_path,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [documents, query, selectedDepartment, selectedGroup]);

  const saveObservation = async (doc: DocumentRow) => {
    try {
      setSavingId(doc.id);
      await api.put(`/departments/documents/${doc.id}/observation`, {
        observation: drafts[doc.id] ?? "",
      });
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, observation: drafts[doc.id] ?? "" } : d))
      );
      toast.success("Observação salva.");
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      toast.error("Não foi possível salvar a observação.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Lista completa de documentos sincronizados no site. As observações são editáveis por documento.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              placeholder="Buscar por código, título, departamento, grupo..."
            />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os grupos</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={String(group.id)}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="w-52">Departamento</TableHead>
              <TableHead className="w-48">Grupo</TableHead>
              <TableHead className="w-20">Tipo</TableHead>
              <TableHead className="w-[420px]">Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum documento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => {
                const currentDraft = drafts[doc.id] ?? "";
                const persistedValue = doc.observation || "";
                const changed = currentDraft !== persistedValue;
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{doc.code || "—"}</TableCell>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.department_code} - {doc.department_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.group_name}</TableCell>
                    <TableCell className="uppercase text-xs">{doc.file_type || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Textarea
                          value={currentDraft}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [doc.id]: e.target.value,
                            }))
                          }
                          placeholder="Adicionar observações deste documento..."
                          className="min-h-[80px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => saveObservation(doc)}
                          disabled={!changed || savingId === doc.id}
                        >
                          {savingId === doc.id ? (
                            <Loader2 size={14} className="mr-1 animate-spin" />
                          ) : (
                            <Save size={14} className="mr-1" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDocumentos;
