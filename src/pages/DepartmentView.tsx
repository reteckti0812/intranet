import { useParams, Link } from "react-router-dom";
import { departments } from "@/data/departments";
import { FileText, FileSpreadsheet, File, Download, ChevronRight, Home, Building2 } from "lucide-react";

const typeIcon = (type: string) => {
  switch (type) {
    case "pdf": return <FileText size={16} className="text-destructive" />;
    case "excel": return <FileSpreadsheet size={16} className="text-success" />;
    case "word": return <File size={16} className="text-info" />;
    default: return <File size={16} className="text-muted-foreground" />;
  }
};

const DepartmentView = () => {
  const { slug } = useParams<{ slug: string }>();
  const dept = departments.find((d) => d.slug === slug);

  if (!dept) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Departamento não encontrado</h1>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Voltar ao início</Link>
      </div>
    );
  }

  const groups = [...new Set(dept.documents.map((d) => d.group))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{dept.code} - {dept.name}</span>
      </nav>

      {/* Department Header */}
      <div className="gradient-primary rounded-2xl p-6 mb-8 flex items-center gap-4 text-primary-foreground">
        <div className="bg-primary-foreground/20 rounded-xl w-14 h-14 flex items-center justify-center">
          <Building2 size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{dept.code} - {dept.name}</h1>
          <p className="text-sm opacity-80">{dept.documents.length} documentos operacionais</p>
        </div>
      </div>

      {/* Documents by Group */}
      {groups.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center shadow-card border border-border">
          <FileText size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum documento cadastrado para este departamento.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const docs = dept.documents.filter((d) => d.group === group);
            return (
              <section key={group}>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  {group}
                </h2>
                <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Código</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Tipo</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((doc, i) => (
                        <tr key={doc.code} className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{doc.code}</td>
                          <td className="px-4 py-3">
                            <button className="text-primary hover:underline font-medium text-left">
                              {doc.title}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">{typeIcon(doc.type)}</td>
                          <td className="px-4 py-3 text-center">
                            <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Download">
                              <Download size={16} className="text-primary" />
                            </button>
                          </td>
                        </tr>
                      ))}
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
