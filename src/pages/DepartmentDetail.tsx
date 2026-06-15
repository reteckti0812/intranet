import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ChevronRight, 
  Search, 
  FileText, 
  Download, 
  ExternalLink, 
  ArrowLeft,
  Loader2,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { publicDownloadUrl } from "@/lib/docsUrl";
import { viewFromApi, downloadFromApi } from "@/lib/download";

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
};
const isRecent = (iso?: string | null) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() < 14 * 24 * 60 * 60 * 1000;
};

const DepartmentDetail = () => {
  const { slug } = useParams();
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        // Chamada para a rota que acabamos de criar no backend
        const response = await api.get(`/departments/by-slug/${slug?.toLowerCase()}`);
        setDepartment(response.data);
      } catch (error) {
        console.error("Erro ao carregar departamento:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchDepartment();
  }, [slug]);

  const pageShell = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

  if (loading) {
    return (
      <div className={pageShell}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className={pageShell}>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Departamento não encontrado</h2>
          <Button asChild>
            <Link to="/departamentos">Voltar para Departamentos</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Lógica de busca simples
  const filteredGroups = department.groups?.map((group: any) => ({
    ...group,
    documents: group.documents.filter((doc: any) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter((group: any) => group.documents.length > 0);

  return (
    <div className={`${pageShell} animate-in fade-in duration-500`}>
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} className="mx-2" />
        <Link to="/departamentos" className="hover:text-primary transition-colors">Departamentos</Link>
        <ChevronRight size={14} className="mx-2" />
        <span className="text-foreground font-medium">{department.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{department.name}</h1>
          <p className="text-muted-foreground">Visualize e baixe os documentos deste departamento.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar documento..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        {filteredGroups && filteredGroups.length > 0 ? (
          filteredGroups.map((group: any) => (
            <section key={group.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center">
                <Folder size={18} className="text-primary mr-2" />
                <h2 className="font-semibold text-foreground">{group.name}</h2>
              </div>
              
              <div className="divide-y divide-border">
                {group.documents.map((doc: any) => (
                  <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                          <span>{doc.code ? `${doc.code} - ` : ""}{doc.title}</span>
                          {isRecent(doc.updated_at) && (
                            <span className="text-[10px] uppercase tracking-wide bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">Novo</span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          <span className="uppercase">{doc.file_type}</span>
                          {doc.version_number ? <> · v{doc.version_number}</> : null}
                          {doc.updated_at ? <> · atualizado em {fmtDate(doc.updated_at)}</> : null}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewFromApi(publicDownloadUrl(doc.id)).catch(() => toast.error("Não foi possível abrir o documento."))}
                      >
                        <ExternalLink size={16} className="mr-2" /> Visualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadFromApi(publicDownloadUrl(doc.id), doc.file_name || doc.title).catch(() => toast.error("Não foi possível baixar o documento."))}
                      >
                        <Download size={16} className="mr-2" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Nenhum documento encontrado para sua busca.</p>
          </div>
        )}
      </div>
      
      <div className="mt-10">
        <Button variant="outline" asChild>
          <Link to="/departamentos">
            <ArrowLeft size={16} className="mr-2" /> Voltar para Departamentos
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DepartmentDetail;