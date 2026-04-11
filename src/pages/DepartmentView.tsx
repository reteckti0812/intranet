import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, FileSpreadsheet, File, Download, Eye,
  ChevronRight, Home, Building2, Loader2, AlertCircle, Search
} from "lucide-react";
import api from "@/lib/api";

interface Document {
  id: number;
  code: string;
  title: string;
  file_name: string;
  file_path: string;
  file_extension: string;
  last_sync: string;
}

interface Group {
  id: number;
  name: string;
  documents: Document[];
}

interface Department {
  id: number;
  code: string;
  name: string;
  slug: string;
}

interface DepartmentData {
  department: Department;
  groups: Group[];
}

const typeIcon = (ext: string) => {
  const clean = ext.replace('.', '').toLowerCase();
  switch (clean) {
    case "pdf":  return <FileText size={16} className="text-destructive" />;
    case "xlsx":
    case "xls":  return <FileSpreadsheet size={16} className="text-green-600" />;
    case "docx":
    case "doc":  return <File size={16} className="text-blue-600" />;
    default:     return <File size={16} className="text-muted-foreground" />;
  }
};

const DepartmentView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get(`/departments/${slug}`);
        setData(response.data);
      } catch (err) {
        console.error("Erro ao buscar departamento:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchDepartment();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-primary gap-3">
        <Loader2 size={32} className="animate-spin" />
        <span className="text-lg font-medium">Carregando documentos...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={48} className="mx-auto text-destructive mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Departamento não encontrado</h1>
        <p className="text-muted-foreground mb-4">Verifique se o servidor está rodando e a sincronização foi realizada.</p>
        <Link to="/departamentos" className="text-primary hover:underline">Voltar para Departamentos</Link>
      </div>
    );
  }

  const { department, groups } = data;

  const totalDocs = groups.reduce((acc, g) => acc + g.documents.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <Link to="/departamentos" className="hover:text-primary transition-colors">
          Departamentos
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{department.code} - {department.name}</span>
      </nav>

      {/* Department Header */}
      <div className="gradient-primary rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="bg-primary-foreground/20 rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{department.code} - {department.name}</h1>
            <p className="text-sm opacity-80">{totalDocs} documento(s) operacional(is)</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-foreground/60" size={16} />
          <input
            type="text"
            placeholder="Buscar documentos..."
            className="w-full pl-9 pr-4 py-2 bg-primary-foreground/20 border border-primary-foreground/30 rounded-lg text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Documents by Group */}
      {groups.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center shadow-card border border-border">
          <FileText size={48} className="text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-muted-foreground">Nenhum documento encontrado para este departamento.</p>
          <p className="text-sm text-muted-foreground mt-1">Execute a sincronização no painel administrativo.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const filteredDocs = group.documents.filter((doc) =>
              doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (doc.code && doc.code.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            if (filteredDocs.length === 0 && searchQuery !== "") return null;

            return (
              <section key={group.id}>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  {group.name}
                </h2>
                <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Código</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Tipo</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocs.map((doc, i) => {
                        // Monta o caminho relativo para servir o arquivo
                        // Ex: /docs/01AltaGestao/Procedimentos/RT-01-001 - Manual.pdf
                        const deptFolder = `${department.code}${department.name}`;
                        const fileUrl = `/docs/${[deptFolder, group.name, doc.file_name]
                          .map((p) => encodeURIComponent(p))
                          .join("/")}`;

                        return (
                          <tr
                            key={doc.id}
                            className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${i % 2 !== 0 ? "bg-muted/20" : ""}`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {doc.code || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => window.open(fileUrl, '_blank')}
                                className="text-primary hover:underline font-medium text-left"
                              >
                                {doc.title}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {typeIcon(doc.file_extension)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => window.open(fileUrl, '_blank')}
                                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                                  title="Visualizar"
                                >
                                  <Eye size={16} className="text-primary" />
                                </button>
                                <a
                                  href={fileUrl}
                                  download={doc.file_name}
                                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                                  title="Baixar"
                                >
                                  <Download size={16} className="text-primary" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DepartmentView;