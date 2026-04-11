import { Link } from "react-router-dom";
import {
  FileText, Heart, Target, Handshake, Eye, Star,
  Building2, Video, BookOpen, Shield, Phone, Users,
  ChevronRight, Megaphone, Leaf
} from "lucide-react";
import { departments } from "@/data/departments";

const announcements = [
  { id: 1, title: "Atualização da Política de Qualidade", date: "07/04/2026", urgent: true },
  { id: 2, title: "Novo procedimento de Segurança de Dados R2", date: "05/04/2026", urgent: false },
  { id: 3, title: "Treinamento de Integração - Abril 2026", date: "01/04/2026", urgent: false },
];

const officialDocs = [
  { icon: FileText, title: "Documentos Oficiais", desc: "Documentos em constante atualização" },
  { icon: Heart, title: "Valores", desc: "Ética, responsabilidade e acuracidade" },
  { icon: Target, title: "Missão", desc: "Soluções inovadoras em logística reversa" },
  { icon: Handshake, title: "Compromisso", desc: "Visão e Missão em mente, sempre" },
  { icon: Eye, title: "Visão", desc: "Líder em reciclagem responsável e sustentável" },
  { icon: Star, title: "Qualidade", desc: "Sistema de gestão integrada" },
];

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero / Announcements */}
      <section className="gradient-primary rounded-2xl p-8 text-primary-foreground">
        <div className="flex items-center gap-3 mb-4">
          <Megaphone size={28} />
          <h2 className="text-2xl font-bold">Mural de Avisos</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-primary-foreground/15 backdrop-blur rounded-xl p-4">
              {a.urgent && (
                <span className="inline-block text-xs font-semibold bg-primary-foreground/20 rounded-full px-2 py-0.5 mb-2">
                  URGENTE
                </span>
              )}
              <h3 className="font-semibold text-sm leading-snug">{a.title}</h3>
              <p className="text-xs mt-1 opacity-80">{a.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Documentation Grid */}
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">Documentação Oficial</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {officialDocs.map((d) => (
            <div key={d.title} className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow border border-border">
              <d.icon size={28} className="text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm">{d.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Policy */}
      <section className="bg-card rounded-2xl p-8 shadow-card border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Shield size={22} className="text-primary" />
          Política da Qualidade
        </h2>
        <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
          <p>
            A Re-Teck, empresa de logística reversa de eletroeletrônicos com atuação global, é responsável por manter e implementar um sistema de gestão integrada, para isso utiliza o seguinte conjunto de princípios:
          </p>
          <ol className="list-[lower-alpha] pl-5 space-y-2">
            <li>Reconhecer a Qualidade, o Meio Ambiente, a Saúde, Segurança Ocupacional e a Reciclagem Responsável como parte integrante do seu desempenho empresarial;</li>
            <li>Estar em conformidade com todos os requisitos de clientes, ambientais, ocupacionais, de reciclagem responsável e aos requisitos subscritos pela empresa;</li>
            <li>Fornecer recursos adequados para implementar a política, incluindo consulta e participação dos colaboradores;</li>
            <li>Prevenir a poluição, proteger o meio ambiente e os recursos naturais, gerenciar materiais de foco, reduzir desperdícios;</li>
            <li>Melhorar continuamente a eficácia do sistema de gestão integrado;</li>
          </ol>
        </div>
      </section>

      {/* Re-Teck Way */}
      <section className="bg-accent rounded-2xl p-8 border border-primary/20">
        <h2 className="text-xl font-bold text-accent-foreground mb-3 flex items-center gap-2">
          <Leaf size={22} className="text-primary" />
          Jeito Re-Teck de Ser
        </h2>
        <p className="text-sm text-accent-foreground/80 leading-relaxed">
          A família Re-Teck trabalha cada dia com os princípios de Visão e Missão em mente, para fazer da melhor forma possível o nosso trabalho. Conduzir o manuseio de toda cadeia produtiva, considerando tanto as atividades desenvolvidas na empresa, quanto as atividades na cadeia de destinação (Downstream), de acordo com a estratégia de gerenciamento baseado na hierarquia de reuso, recuperação, revenda de materiais ou recuperação energética.
        </p>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Departments */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 size={22} className="text-primary" />
            Departamentos
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <Link
                key={dept.id}
                to={`/departamento/${dept.slug}`}
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
        </section>

        {/* Sidebar sections */}
        <aside className="space-y-6">
          {/* Videos */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Video size={18} className="text-primary" />
              Vídeos Institucionais
            </h3>
            <ul className="space-y-2 text-sm">
              {["Institucional", "R2", "Certificados"].map((v) => (
                <li key={v}>
                  <button className="text-primary hover:underline font-medium">{v}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              Links Rápidos
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 bg-accent rounded-lg text-sm font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                Código de Conduta nos Negócios
              </button>
              <button className="w-full text-left px-4 py-2.5 bg-accent rounded-lg text-sm font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                Manual Antissuborno
              </button>
            </div>
          </div>

          {/* Extensions / Contact */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Phone size={18} className="text-primary" />
              Ramais e Contato
            </h3>
            <p className="text-xs text-muted-foreground">Consulte a lista de ramais internos e informações de contato.</p>
          </div>

          {/* Partners */}
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users size={18} className="text-primary" />
              Empresas Conveniadas
            </h3>
            <p className="text-xs text-muted-foreground">Parceiros e empresas conveniadas da Re-Teck.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Home;
