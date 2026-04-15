import { Fragment, useState, useEffect, useRef } from "react";
import { Save, Trash2, Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type HomeFileItem = {
  id: number;
  name: string;
  url: string;
  stored_name?: string;
  uploaded_at?: string;
};

const AdminConteudoHome = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [uploadingGeneral, setUploadingGeneral] = useState(false);

  const [content, setContent] = useState({
    official_documents: "",
    values: "",
    mission: "",
    commitment: "",
    vision: "",
    quality_policy: "",
    reteck_way_left: "",
    reteck_way_right: "",
    contacts: "",
    external_calls: "",
  });
  const [masterFiles, setMasterFiles] = useState<HomeFileItem[]>([]);
  const [generalFiles, setGeneralFiles] = useState<HomeFileItem[]>([]);
  const masterInputRef = useRef<HTMLInputElement | null>(null);
  const generalInputRef = useRef<HTMLInputElement | null>(null);

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
          reteck_way_left: data.reteck_way_left || data.reteck_way || "",
          reteck_way_right: data.reteck_way_right || "",
          contacts: data.contacts || "",
          external_calls: data.external_calls || "",
        });
        try {
          setMasterFiles(data.master_list_files ? JSON.parse(data.master_list_files) : []);
        } catch {
          setMasterFiles([]);
        }
        try {
          setGeneralFiles(data.general_documents_files ? JSON.parse(data.general_documents_files) : []);
        } catch {
          setGeneralFiles([]);
        }
      })
      .catch(() => toast.error("Erro ao carregar conteúdo."))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) =>
    setContent(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/home-content/batch", content);
      toast.success("Conteúdo salvo com sucesso!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao salvar conteúdo.");
    } finally {
      setSaving(false);
    }
  };

  const uploadHomeFile = async (type: "master" | "general", file: File) => {
    const form = new FormData();
    form.append("file", file);

    if (type === "master") setUploadingMaster(true);
    if (type === "general") setUploadingGeneral(true);

    try {
      const response = await api.post(`/home-content/files/${type}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const item = response.data?.item as HomeFileItem;
      if (type === "master") setMasterFiles((prev) => [...prev, item]);
      if (type === "general") setGeneralFiles((prev) => [...prev, item]);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao enviar arquivo.");
    } finally {
      if (type === "master") setUploadingMaster(false);
      if (type === "general") setUploadingGeneral(false);
    }
  };

  const removeHomeFile = async (type: "master" | "general", id: number) => {
    try {
      await api.delete(`/home-content/files/${type}/${id}`);
      if (type === "master") setMasterFiles((prev) => prev.filter((f) => f.id !== id));
      if (type === "general") setGeneralFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("Arquivo removido.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao remover arquivo.");
    }
  };

  const fields: { label: string; key: keyof typeof content; large?: boolean }[] = [
    { label: "Documentos Oficiais", key: "official_documents" },
    { label: "Valores", key: "values" },
    { label: "Missão", key: "mission" },
    { label: "Compromisso", key: "commitment" },
    { label: "Visão", key: "vision" },
    { label: "Política de Qualidade", key: "quality_policy", large: true },
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
          <p className="text-sm text-muted-foreground -mt-1">
            Texto simples aparece na home com as mesmas quebras de linha e espaços. Para negrito,
            listas ou tabelas de ramais, use HTML seguro (por exemplo{" "}
            <code className="text-xs bg-muted px-1 rounded">&lt;strong&gt;</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">&lt;br&gt;</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">&lt;ul&gt;&lt;li&gt;</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">&lt;table&gt;</code>
            …).
          </p>
          <div className="grid gap-4">
            {fields.map(f => (
              <Fragment key={f.key}>
                <div>
                  <Label>{f.label}</Label>
                  <Textarea
                    value={content[f.key]}
                    onChange={e => handleChange(f.key, e.target.value)}
                    rows={f.large ? 5 : 2}
                    className="mt-1 text-sm"
                  />
                </div>
                {f.key === "quality_policy" && (
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                    <div>
                      <Label className="text-base">Jeito Re-Teck de Ser — duas colunas na home</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        A coluna esquerda fica à esquerda e a direita à direita (em ecrãs largos).
                        Se só existir conteúdo antigo num único campo, carregue-o na coluna esquerda.
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Coluna esquerda</Label>
                        <Textarea
                          value={content.reteck_way_left}
                          onChange={e => handleChange("reteck_way_left", e.target.value)}
                          rows={8}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label>Coluna direita</Label>
                        <Textarea
                          value={content.reteck_way_right}
                          onChange={e => handleChange("reteck_way_right", e.target.value)}
                          rows={8}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </Section>

        <Section title="Arquivos - Lista Mestra">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              ref={masterInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadHomeFile("master", file);
                e.currentTarget.value = "";
              }}
            />
            <Button
              onClick={() => masterInputRef.current?.click()}
              disabled={uploadingMaster}
            >
              {uploadingMaster ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
              Enviar arquivo (Lista Mestra)
            </Button>
          </div>
          <div className="space-y-2">
            {masterFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo cadastrado.</p>
            ) : (
              masterFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2 min-w-0"
                  >
                    <FileText size={14} />
                    <span className="truncate">{file.name}</span>
                  </a>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeHomeFile("master", file.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="Arquivos - Documentos Gerais">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              ref={generalInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadHomeFile("general", file);
                e.currentTarget.value = "";
              }}
            />
            <Button
              onClick={() => generalInputRef.current?.click()}
              disabled={uploadingGeneral}
            >
              {uploadingGeneral ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
              Enviar arquivo (Documentos Gerais)
            </Button>
          </div>
          <div className="space-y-3">
            {generalFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo cadastrado.</p>
            ) : (
              generalFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2 min-w-0"
                  >
                    <FileText size={14} />
                    <span className="truncate">{file.name}</span>
                  </a>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeHomeFile("general", file.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
        </Section>

      </div>
    </div>
  );
};

export default AdminConteudoHome;