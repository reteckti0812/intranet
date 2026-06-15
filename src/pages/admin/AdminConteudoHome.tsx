import { useState, useEffect, useRef } from "react";
import { Save, Trash2, Loader2, Upload, FileText, Phone, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TableEditor } from "@/components/admin/TableEditor";
import {
  CONTACT_COLUMNS, EXTERNAL_COLUMNS, parseTableRows, cleanRows,
} from "@/lib/homeTables";

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <section className="bg-card rounded-xl shadow-card border border-border p-6 space-y-4">
    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">{icon}{title}</h2>
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

const TEXT_FIELDS: { label: string; key: string; minHeight?: number }[] = [
  { label: "Documentos Oficiais", key: "official_documents" },
  { label: "Valores", key: "values" },
  { label: "Missão", key: "mission" },
  { label: "Compromisso", key: "commitment" },
  { label: "Visão", key: "vision" },
  { label: "Política de Qualidade", key: "quality_policy", minHeight: 240 },
];

const AdminConteudoHome = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingGeneral, setUploadingGeneral] = useState(false);

  const [content, setContent] = useState<Record<string, string>>({
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
  const [certFiles, setCertFiles] = useState<HomeFileItem[]>([]);
  const [generalFiles, setGeneralFiles] = useState<HomeFileItem[]>([]);
  const masterInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);
  const generalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    api.get("/home-content")
      .then((res) => {
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
        try { setMasterFiles(data.master_list_files ? JSON.parse(data.master_list_files) : []); } catch { setMasterFiles([]); }
        try { setCertFiles(data.certificates_files ? JSON.parse(data.certificates_files) : []); } catch { setCertFiles([]); }
        try { setGeneralFiles(data.general_documents_files ? JSON.parse(data.general_documents_files) : []); } catch { setGeneralFiles([]); }
      })
      .catch(() => toast.error("Erro ao carregar conteúdo."))
      .finally(() => setLoading(false));
  }, []);

  const setField = (key: string, value: string) => setContent((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Limpa linhas vazias das tabelas antes de salvar.
      const payload = { ...content };
      payload.contacts = JSON.stringify(cleanRows(parseTableRows(content.contacts), CONTACT_COLUMNS));
      payload.external_calls = JSON.stringify(cleanRows(parseTableRows(content.external_calls), EXTERNAL_COLUMNS));
      await api.post("/home-content/batch", payload);
      setContent(payload);
      toast.success("Conteúdo salvo com sucesso!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao salvar conteúdo.");
    } finally {
      setSaving(false);
    }
  };

  type FileType = "master" | "certificates" | "general";
  const setUploadingByType: Record<FileType, (v: boolean) => void> = {
    master: setUploadingMaster, certificates: setUploadingCert, general: setUploadingGeneral,
  };
  const appendByType: Record<FileType, (item: HomeFileItem) => void> = {
    master: (item) => setMasterFiles((prev) => [...prev, item]),
    certificates: (item) => setCertFiles((prev) => [...prev, item]),
    general: (item) => setGeneralFiles((prev) => [...prev, item]),
  };
  const removeByType: Record<FileType, (id: number) => void> = {
    master: (id) => setMasterFiles((prev) => prev.filter((f) => f.id !== id)),
    certificates: (id) => setCertFiles((prev) => prev.filter((f) => f.id !== id)),
    general: (id) => setGeneralFiles((prev) => prev.filter((f) => f.id !== id)),
  };

  const uploadHomeFile = async (type: FileType, file: File) => {
    const form = new FormData();
    form.append("file", file);
    setUploadingByType[type](true);
    try {
      const response = await api.post(`/home-content/files/${type}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      appendByType[type](response.data?.item as HomeFileItem);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao enviar arquivo.");
    } finally {
      setUploadingByType[type](false);
    }
  };

  const removeHomeFile = async (type: FileType, id: number) => {
    try {
      await api.delete(`/home-content/files/${type}/${id}`);
      removeByType[type](id);
      toast.success("Arquivo removido.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao remover arquivo.");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  }

  const FileList = ({ type, files }: { type: FileType; files: HomeFileItem[] }) => (
    <div className="space-y-2">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum arquivo cadastrado.</p>
      ) : files.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
          <a href={file.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-2 min-w-0">
            <FileText size={14} /><span className="truncate">{file.name}</span>
          </a>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeHomeFile(type, file.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conteúdo da Home</h1>
          <p className="text-sm text-muted-foreground">Edite com o editor visual — sem precisar digitar HTML. Use “Visualizar” para conferir.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="mr-2 animate-spin" />Salvando...</> : <><Save size={16} className="mr-2" />Salvar Tudo</>}
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="Textos Institucionais">
          <div className="grid gap-5">
            {TEXT_FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="mb-1.5 block">{f.label}</Label>
                <RichTextEditor
                  value={content[f.key]}
                  onChange={(html) => setField(f.key, html)}
                  minHeight={f.minHeight || 160}
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
            <div>
              <Label className="text-base">Jeito Re-Teck de Ser — duas colunas na home</Label>
              <p className="text-xs text-muted-foreground mt-1">A coluna esquerda fica à esquerda e a direita à direita (em telas largas).</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Coluna esquerda</Label>
                <RichTextEditor value={content.reteck_way_left} onChange={(h) => setField("reteck_way_left", h)} minHeight={200} />
              </div>
              <div>
                <Label className="mb-1.5 block">Coluna direita</Label>
                <RichTextEditor value={content.reteck_way_right} onChange={(h) => setField("reteck_way_right", h)} minHeight={200} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Contatos / Ramais" icon={<Phone size={18} className="text-primary" />}>
          <p className="text-sm text-muted-foreground -mt-1">Adicione uma linha por pessoa/ramal. Aparece como tabela na home.</p>
          <TableEditor
            value={content.contacts}
            columns={CONTACT_COLUMNS}
            onChange={(v) => setField("contacts", v)}
            addLabel="Adicionar contato"
          />
        </Section>

        <Section title="Ligações Externas" icon={<BookOpen size={18} className="text-primary" />}>
          <p className="text-sm text-muted-foreground -mt-1">Lista de instruções/números para ligações externas.</p>
          <TableEditor
            value={content.external_calls}
            columns={EXTERNAL_COLUMNS}
            onChange={(v) => setField("external_calls", v)}
            addLabel="Adicionar item"
          />
        </Section>

        <Section title="Arquivos - Lista Mestra">
          <input ref={masterInputRef} type="file" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHomeFile("master", file); e.currentTarget.value = ""; }} />
          <Button onClick={() => masterInputRef.current?.click()} disabled={uploadingMaster}>
            {uploadingMaster ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
            Enviar arquivo (Lista Mestra)
          </Button>
          <FileList type="master" files={masterFiles} />
        </Section>

        <Section title="Arquivos - Certificados">
          <input ref={certInputRef} type="file" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHomeFile("certificates", file); e.currentTarget.value = ""; }} />
          <Button onClick={() => certInputRef.current?.click()} disabled={uploadingCert}>
            {uploadingCert ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
            Enviar arquivo (Certificados)
          </Button>
          <FileList type="certificates" files={certFiles} />
        </Section>

        <Section title="Arquivos - Documentos Gerais">
          <input ref={generalInputRef} type="file" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadHomeFile("general", file); e.currentTarget.value = ""; }} />
          <Button onClick={() => generalInputRef.current?.click()} disabled={uploadingGeneral}>
            {uploadingGeneral ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
            Enviar arquivo (Documentos Gerais)
          </Button>
          <FileList type="general" files={generalFiles} />
        </Section>
      </div>
    </div>
  );
};

export default AdminConteudoHome;
