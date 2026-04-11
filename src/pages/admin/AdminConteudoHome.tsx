import { useState } from "react";
import { Save, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminConteudoHome = () => {
  const [content, setContent] = useState({
    officialDocuments: "Documentos oficiais da Re-Teck disponíveis para consulta.",
    values: "Inovação, Sustentabilidade, Integridade, Colaboração.",
    mission: "Promover a logística reversa de equipamentos eletrônicos de forma sustentável e segura.",
    commitment: "Comprometidos com a excelência operacional e a preservação ambiental.",
    vision: "Ser referência global em logística reversa e economia circular.",
    qualityPolicy: "A Re-Teck compromete-se com a melhoria contínua dos seus processos...",
    reteckWay: "O Jeito Re-Teck de Ser é baseado em respeito, transparência e inovação...",
    contacts: "Telefone: (11) 1234-5678 | Email: contato@re-teck.com",
    externalCalls: "Para ligações externas, disque 0 + ramal desejado.",
  });

  const [videos, setVideos] = useState([
    { id: 1, title: "Apresentação Institucional", url: "https://youtube.com/watch?v=example1" },
    { id: 2, title: "Processo de Logística Reversa", url: "https://youtube.com/watch?v=example2" },
  ]);

  const handleChange = (key: string, value: string) => setContent(prev => ({ ...prev, [key]: value }));

  const addVideo = () => setVideos(prev => [...prev, { id: Date.now(), title: "", url: "" }]);
  const removeVideo = (id: number) => setVideos(prev => prev.filter(v => v.id !== id));
  const updateVideo = (id: number, field: string, value: string) =>
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));

  const handleSave = () => toast.success("Conteúdo salvo com sucesso!");

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );

  const fields: { label: string; key: string; large?: boolean }[] = [
    { label: "Documentos Oficiais", key: "officialDocuments" },
    { label: "Valores", key: "values" },
    { label: "Missão", key: "mission" },
    { label: "Compromisso", key: "commitment" },
    { label: "Visão", key: "vision" },
    { label: "Política de Qualidade", key: "qualityPolicy", large: true },
    { label: "Jeito Re-Teck de Ser", key: "reteckWay", large: true },
    { label: "Contatos", key: "contacts" },
    { label: "Instruções para Chamadas Externas", key: "externalCalls" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Conteúdo da Home</h1>
        <Button onClick={handleSave}><Save size={16} className="mr-2" />Salvar Tudo</Button>
      </div>

      <div className="space-y-6">
        {/* Text fields */}
        <Section title="Textos Institucionais">
          <div className="grid gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                {f.large ? (
                  <Textarea value={(content as any)[f.key]} onChange={e => handleChange(f.key, e.target.value)} rows={5} />
                ) : (
                  <Textarea value={(content as any)[f.key]} onChange={e => handleChange(f.key, e.target.value)} rows={2} />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Image uploads */}
        <Section title="Imagens">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Ramais / Extensões</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para enviar imagem</p>
                <Input type="file" accept="image/*" className="mt-2" />
              </div>
            </div>
            <div>
              <Label>Empresas Parceiras</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para enviar imagem</p>
                <Input type="file" accept="image/*" className="mt-2" />
              </div>
            </div>
          </div>
        </Section>

        {/* Videos */}
        <Section title="Vídeos Institucionais">
          <div className="space-y-3">
            {videos.map(v => (
              <div key={v.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Título</Label>
                  <Input value={v.title} onChange={e => updateVideo(v.id, "title", e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label>URL</Label>
                  <Input value={v.url} onChange={e => updateVideo(v.id, "url", e.target.value)} />
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeVideo(v.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addVideo}><Plus size={16} className="mr-2" />Adicionar Vídeo</Button>
        </Section>

        {/* Global documents */}
        <Section title="Documentos Globais">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Código de Conduta Empresarial</Label>
              <div className="mt-2 flex gap-2">
                <Input type="file" accept=".pdf,.doc,.docx" className="flex-1" />
                <Button variant="outline"><Upload size={16} /></Button>
              </div>
            </div>
            <div>
              <Label>Manual Antissuborno</Label>
              <div className="mt-2 flex gap-2">
                <Input type="file" accept=".pdf,.doc,.docx" className="flex-1" />
                <Button variant="outline"><Upload size={16} /></Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default AdminConteudoHome;
