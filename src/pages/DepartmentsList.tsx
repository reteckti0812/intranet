import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronRight, Home, FileText, Loader2 } from "lucide-react";
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

const DepartmentsList = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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