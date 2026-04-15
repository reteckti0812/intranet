import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Home, FileText, Loader2, Search, FolderOpen, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { hrefForDocumentPath } from "@/lib/docsUrl";

interface Department {
  id: number;
  code: string;
  name: string;
  slug: string;
  folder_path: string;
  group_count: number;
  doc_count: number;
}

interface SearchDocumentResult {
  id: number;
  code: string | null;
  title: string;
  file_path: string;
  file_type: string | null;
  group_id: number;
  group_name: string;
  department_id: number;
  department_code: string;
  department_name: string;
  department_slug: string;
}

const DepartmentsList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchDocumentResult[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get("/departments");
        setDepartments(response.data);
      } catch (err) {
        setError("Não foi possível carregar os departamentos. Verifique se o servidor está rodando.");
        console.error("Erro ao buscar departamentos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await api.get("/departments/search-documents", {
          params: { q: term },
        });
        if (!active) return;
        setSearchResults(response.data || []);
      } catch (err) {
        if (!active) return;
        console.error("Erro ao buscar documentos globalmente:", err);
        setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20 text-primary gap-3">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-lg font-medium">Carregando departamentos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20 text-destructive gap-3">
          <Building2 size={24} />
          <span className="text-lg font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">Departamentos</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-6">Todos os Departamentos</h1>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Pesquisa geral de documentos
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            placeholder="Digite código ou título do documento..."
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Dica: digite ao menos 2 caracteres para buscar em todos os departamentos.
        </p>
      </div>

      {searchTerm.trim().length >= 2 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">Resultados da pesquisa</h2>

          {searching ? (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Buscando documentos...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/30 border border-dashed border-border rounded-lg p-4">
              Nenhum documento encontrado para "{searchTerm.trim()}".
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((doc) => (
                <div key={doc.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {doc.code ? `${doc.code} - ` : ""}{doc.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Building2 size={14} />
                        {doc.department_code} - {doc.department_name}
                        <span className="text-border">|</span>
                        <FolderOpen size={14} />
                        {doc.group_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={hrefForDocumentPath(doc.file_path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                      >
                        <ExternalLink size={14} />
                        Visualizar
                      </a>
                      <Link
                        to={`/departamentos/${doc.department_slug}`}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Ir para departamento
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Building2 size={48} className="opacity-30" />
          <p className="text-lg">Nenhum departamento encontrado.</p>
          <p className="text-sm">Execute a sincronização no painel administrativo.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              to={`/departamentos/${dept.slug}`}
              className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover border border-border transition-all hover:border-primary/30 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-primary text-primary-foreground text-sm font-bold rounded-lg w-10 h-10 flex items-center justify-center">
                  {dept.code}
                </span>
                <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {dept.name}
                </h2>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText size={12} /> {dept.doc_count} documento(s)
                </span>
                <ChevronRight size={14} className="group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentsList;