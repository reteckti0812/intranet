import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    {children}
  </section>
);

const AdminConteudoHome = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [content, setContent] = useState({
    official_documents: "",
    values: "",
    mission: "",
    commitment: "",
    vision: "",
    quality_policy: "",
    reteck_way: "",
    contacts: "",
    external_calls: "",
  });

  const [videos, setVideos] = useState<{ id: number; title: string; url: string }[]>([]);

  // Carrega conteúdo do banco ao abrir a página
  useEffect(() => {
    api.get("/home-content")
      .then(res => {
        const data = res.data;
        setContent({
          official_documents: data.official_documents || "",
          values: data.values || "",
          mission: data.mission || "",
          commitment: data.commitment || "",
          vision: data.vision || "",
          quality_policy: data.quality_policy || "",
          reteck_way: data.reteck_way || "",
          contacts: data.contacts || "",
          external_calls: data.external_calls || "",
        });

        // Carrega vídeos se existirem no banco
        if (data.videos) {
          try {
            setVideos(JSON.parse(data.videos));
          } catch {
            setVideos([]);
          }
        }
      })
      .catch(() => toast.error("Erro ao carregar conteúdo."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) =>
    setContent(prev => ({ ...prev, [key]: value }));

  const addVideo = () =>
    setVideos(prev => [...prev, { id: Date.now(), title: "", url: "" }]);

  const removeVideo = (id: number) =>
    setVideos(prev => prev.filter(v => v.id !== id));

  const updateVideo = (id: number, field: string, value: string) =>
    setVideos(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/home-content/batch", {
        ...content,
        videos: JSON.stringify(videos), // salva vídeos como JSON no banco
      });
      toast.success("Conteúdo salvo com sucesso!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao salvar conteúdo.");
    } finally {
      setSaving(false);
    }
  };

  const fields: { label: string; key: string; large?: boolean }[] = [
    { label: "Documentos Oficiais", key: "official_documents" },
    { label: "Valores", key: "values" },
    { label: "Missão", key: "mission" },
    { label: "Compromisso", key: "commitment" },
    { label: "Visão", key: "vision" },
    { label: "Política de Qualidade", key: "quality_policy", large: true },
    { label: "Jeito Re-Teck de Ser", key: "reteck_way", large: true },
    { label: "Contatos / Ramais", key: "contacts" },
    { label: "Instruções para Chamadas Externas", key: "external_calls" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Conteúdo da Home</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 size={16} className="mr-2 animate-spin" />Salvando...</>
            : <><Save size={16} className="mr-2" />Salvar Tudo</>
          }
        </Button>
      </div>

      <div className="space-y-6">

        {/* Textos Institucionais */}
        <Section title="Textos Institucionais">
          <div className="grid gap-4">
            {fields.map(f => (
              <div key={f.key}>
                <Label>{f.label}</Label>
                <Textarea
                  value={(content as any)[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  rows={f.large ? 5 : 2}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Vídeos Institucionais */}
        <Section title="Vídeos Institucionais">
          <div className="space-y-3">
            {videos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum vídeo cadastrado.</p>
            )}
            {videos.map(v => (
              <div key={v.id} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label>Título</Label>
                  <Input
                    value={v.title}
                    onChange={e => updateVideo(v.id, "title", e.target.value)}
                    placeholder="Ex: Apresentação Institucional"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label>URL do YouTube</Label>
                  <Input
                    value={v.url}
                    onChange={e => updateVideo(v.id, "url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive mb-0.5"
                  onClick={() => removeVideo(v.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addVideo} className="mt-2">
            <Plus size={16} className="mr-2" />
            Adicionar Vídeo
          </Button>
        </Section>

      </div>
    </div>
  );
};

export default AdminConteudoHome;