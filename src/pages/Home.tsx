import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FileText, Heart, Target, Handshake, Eye,
  Building2, BookOpen, Shield, Phone,
  ChevronRight, Megaphone, Leaf, Loader2, Download, ExternalLink, FileSpreadsheet, FileCode
} from "lucide-react";
import api from "@/lib/api";
import { useHomeContent } from "@/hooks/useHomeContent";
import { HomeRichText } from "@/components/HomeRichText";

interface Department {
  id: number;
  code: string;
  name: string;
  slug: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string; // ← adicionado
  expires_at: string | null;
  priority: number;
}

interface HomeFileItem {
  id: number;
  name: string;
  url: string;
}

const getFileExtension = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
};

const fileIconByName = (name: string) => {
  const ext = getFileExtension(name);
  if (ext === "xls" || ext === "xlsx" || ext === "csv") {
    return <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />;
  }
  if (ext === "json" || ext === "xml" || ext === "yaml" || ext === "yml") {
    return <FileCode size={16} className="text-amber-600 shrink-0" />;
  }
  return <FileText size={16} className="text-primary shrink-0" />;
};

const Home = () => {
  const { content, loading: contentLoading } = useHomeContent();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    api.get("/departments?public=1")
      .then(res => setDepartments(res.data))
      .catch(err => console.error(err))
      .finally(() => setDeptLoading(false));
  }, []);

  // ← usa ?public=1 para filtrar avisos expirados
  useEffect(() => {
    api.get("/announcements?public=1")
      .then(res => setAnnouncements(res.data))
      .catch(err => console.error(err));
  }, []);

  const officialDocs = [
    { icon: FileText, title: "Documentos Oficiais", desc: content?.official_documents },
    { icon: Heart,    title: "Valores",             desc: content?.values },
    { icon: Target,   title: "Missão",              desc: content?.mission },
    { icon: Handshake,title: "Compromisso",         desc: content?.commitment },
    { icon: Eye,      title: "Visão",               desc: content?.vision },
  ];

  const reteckLegacy = content?.reteck_way?.trim();
  const reteckLeft = content?.reteck_way_left?.trim() || reteckLegacy || "";
  const reteckRight = content?.reteck_way_right?.trim() || "";
  const reteckHasContent = Boolean(reteckLeft || reteckRight);
  const parseFiles = (raw?: string): HomeFileItem[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const masterFiles = parseFiles(content?.master_list_files)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  const generalFiles = parseFiles(content?.general_documents_files)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));

  if (contentLoading || deptLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-primary gap-3">
        <Loader2 size={32} className="animate-spin" />
        <span className="text-lg font-medium">Carregando Intranet Re-Teck...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

      {/* Mural de Avisos */}
      <section className="gradient-primary rounded-2xl p-8 text-primary-foreground">
        <div className="flex items-center gap-3 mb-4">
          <Megaphone size={28} />
          <h2 className="text-2xl font-bold">Mural de Avisos</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {announcements.length === 0 ? (
            <p className="text-sm opacity-70 col-span-3">Nenhum aviso no momento.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="bg-primary-foreground/15 backdrop-blur rounded-xl p-4">
                {a.priority > 0 && (
  <span className="inline-block text-[10px] font-bold bg-yellow-400 text-yellow-900 rounded-full px-2 py-0.5 mb-2 shadow-sm animate-pulse">
    URGENTE
  </span>
)}
                <h3 className="font-semibold text-sm leading-snug mb-1">{a.title}</h3>
                <HomeRichText
                  content={a.content}
                  className="text-xs opacity-90 leading-relaxed [&_a]:text-primary-foreground"
                />
                {a.expires_at && (
                  <p className="text-xs mt-2 opacity-70">
                    Válido até: {new Date(a.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Documentação Oficial — 3 + 2 (segunda linha ocupa toda a largura) */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Documentação Oficial</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {officialDocs.slice(0, 3).map((d) => (
              <div
                key={d.title}
                className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow border border-border"
              >
                <d.icon size={28} className="text-primary mb-3" />
                <h3 className="font-semibold text-foreground text-sm">{d.title}</h3>
                {d.desc ? (
                  <HomeRichText content={d.desc} className="text-xs text-muted-foreground mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground/40 mt-1 italic">Não configurado</p>
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialDocs.slice(3).map((d) => (
              <div
                key={d.title}
                className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow border border-border"
              >
                <d.icon size={28} className="text-primary mb-3" />
                <h3 className="font-semibold text-foreground text-sm">{d.title}</h3>
                {d.desc ? (
                  <HomeRichText content={d.desc} className="text-xs text-muted-foreground mt-1" />
                ) : (
                  <p className="text-xs text-muted-foreground/40 mt-1 italic">Não configurado</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Política da Qualidade */}
      <section className="bg-card rounded-2xl p-8 shadow-card border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Shield size={22} className="text-primary" />
          Política da Qualidade
        </h2>
        {content?.quality_policy?.trim() ? (
          <HomeRichText
            content={content.quality_policy}
            className="text-sm text-muted-foreground leading-relaxed"
          />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Re-Teck mantém um sistema de gestão integrada com foco em qualidade, segurança e
            melhoria contínua.
          </p>
        )}
      </section>

      {/* Jeito Re-Teck de Ser — duas colunas (editável no admin) */}
      <section className="bg-accent rounded-2xl p-8 border border-primary/20">
        <h2 className="text-xl font-bold text-accent-foreground mb-3 flex items-center gap-2">
          <Leaf size={22} className="text-primary" />
          Jeito Re-Teck de Ser
        </h2>
        {!reteckHasContent ? (
          <p className="text-sm text-accent-foreground/80 leading-relaxed">
            A família Re-Teck trabalha com os princípios de Visão e Missão, unindo pessoas em torno
            de objetivos comuns.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10 text-sm text-accent-foreground/90">
            <HomeRichText
              content={reteckLeft}
              className="leading-relaxed min-w-0 [&_a]:text-primary"
            />
            <HomeRichText
              content={reteckRight}
              className="leading-relaxed min-w-0 [&_a]:text-primary"
            />
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Departamentos */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            Departamentos
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                to={`/departamentos/${dept.slug}`}
                className="flex items-center justify-between bg-card rounded-xl px-4 py-3 shadow-card hover:shadow-card-hover border border-border transition-all hover:border-primary/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-lg w-8 h-8 flex items-center justify-center">
                    {dept.code}
                  </span>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {dept.name}
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>

          <div className="space-y-4 mt-6">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Lista Mestra
              </h3>
              {masterFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum arquivo disponível.</p>
              ) : (
                <div className="space-y-2">
                  {masterFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
                    >
                      <p className="text-sm text-foreground truncate flex items-center gap-2">
                        {fileIconByName(file.name)}
                        <span className="truncate">{file.name}</span>
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                        >
                          <ExternalLink size={13} />
                          Visualizar
                        </a>
                        <a
                          href={file.url}
                          download
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          <Download size={13} />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Documentos Gerais
              </h3>
              {generalFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum arquivo disponível.</p>
              ) : (
                <div className="space-y-2">
                  {generalFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2"
                    >
                      <p className="text-sm text-foreground truncate flex items-center gap-2">
                        {fileIconByName(file.name)}
                        <span className="truncate">{file.name}</span>
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                        >
                          <ExternalLink size={13} />
                          Visualizar
                        </a>
                        <a
                          href={file.url}
                          download
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          <Download size={13} />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 min-w-0">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border min-w-0">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone size={18} className="text-primary" />
              Ramais e Contatos
            </h3>
            {content?.contacts?.trim() ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <HomeRichText content={content.contacts} className="text-xs text-muted-foreground" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Consulte a lista de ramais internos.</p>
            )}
          </div>

          <div className="bg-card rounded-xl p-5 shadow-card border border-border min-w-0">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              Ligações Externas
            </h3>
            {content?.external_calls?.trim() ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <HomeRichText content={content.external_calls} className="text-xs text-muted-foreground" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Instruções para ligações externas.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;