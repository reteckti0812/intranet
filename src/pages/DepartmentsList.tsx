import { Link } from "react-router-dom";
import { departments } from "@/data/departments";
import { Building2, ChevronRight, Home, FileText } from "lucide-react";

const DepartmentsList = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">Departamentos</span>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-6">Todos os Departamentos</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <Link
            key={dept.id}
            to={`/departamento/${dept.slug}`}
            className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover border border-border transition-all hover:border-primary/30 group"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-primary text-primary-foreground text-sm font-bold rounded-lg w-10 h-10 flex items-center justify-center">
                {dept.code}
              </span>
              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">{dept.name}</h2>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText size={12} /> {dept.documents.length} documentos
              </span>
              <ChevronRight size={14} className="group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsList;
