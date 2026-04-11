import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  HardDrive,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";

function formatLastSync(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

type SyncKind = "intranet" | "documentos";

interface IntranetMeta {
  lastSync: string;
  depts: string;
  docs: string;
}

interface DocumentsMeta {
  lastSync: string;
  created: string;
  deleted: string;
}

const AdminSincronizar = () => {
  const [syncing, setSyncing] = useState(false);
  const [activeKind, setActiveKind] = useState<SyncKind | null>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intranetResults, setIntranetResults] = useState({ processed: 0, removed: 0 });
  const [documentsResults, setDocumentsResults] = useState({ created: 0, deleted: 0 });
  const [intranetMeta, setIntranetMeta] = useState<IntranetMeta>({
    lastSync: "—",
    depts: "—",
    docs: "—",
  });
  const [documentsMeta, setDocumentsMeta] = useState<DocumentsMeta>({
    lastSync: "—",
    created: "—",
    deleted: "—",
  });

  const loadSyncStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/sync/status");
      const i = data?.intranet;
      const d = data?.documents;
      const is = i?.lastStats as
        | { totalDepts?: number; totalDocs?: number }
        | null
        | undefined;
      const ds = d?.lastStats as
        | { filesCreated?: number; filesDeleted?: number }
        | null
        | undefined;

      setIntranetMeta({
        lastSync: formatLastSync(i?.lastSyncAt ?? null),
        depts: is?.totalDepts != null ? String(is.totalDepts) : "—",
        docs: is?.totalDocs != null ? String(is.totalDocs) : "—",
      });
      setDocumentsMeta({
        lastSync: formatLastSync(d?.lastSyncAt ?? null),
        created: ds?.filesCreated != null ? String(ds.filesCreated) : "—",
        deleted: ds?.filesDeleted != null ? String(ds.filesDeleted) : "—",
      });
    } catch {
      /* mantém valores atuais */
    }
  }, []);

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  const startSync = async (kind: SyncKind) => {
    setSyncing(true);
    setActiveKind(kind);
    setDone(false);
    setError(null);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 85 ? prev + Math.random() * 10 : prev));
    }, 300);

    const path = kind === "intranet" ? "/sync/pasta-para-site" : "/sync/bd-para-pasta";

    try {
      const response = await api.post(path);
      clearInterval(interval);
      setProgress(100);

      if (response.data.success) {
        const payload = response.data.data ?? {};
        if (kind === "intranet") {
          setIntranetResults({
            processed: payload.processedFiles ?? payload.added ?? 0,
            removed: payload.removed ?? 0,
          });
        } else {
          setDocumentsResults({
            created: payload.filesCreated ?? 0,
            deleted: payload.filesDeleted ?? 0,
          });
        }
        setDone(true);
        await loadSyncStatus();
      } else {
        setError(response.data.message || "Erro desconhecido.");
      }
    } catch (err: unknown) {
      clearInterval(interval);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || "Erro ao conectar com o servidor.");
      await loadSyncStatus();
    } finally {
      setSyncing(false);
    }
  };

  const resetToIdle = () => {
    setDone(false);
    setError(null);
    setActiveKind(null);
    setProgress(0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sincronização</h1>
        <Button
          variant="outline"
          onClick={() => api.get("/open-folder").catch(() => {})}
        >
          <FolderOpen size={16} className="mr-2" /> Abrir Pasta Raiz
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
        Duas direções independentes: atualize o <strong>site</strong> a partir das pastas, ou alinhe as{" "}
        <strong>pastas</strong> ao que está registado na intranet. Use o botão certo consoante alterou
        ficheiros no disco ou apenas na base de dados.
      </p>

      {/* Resumo das últimas operações */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Última: Documentos → Intranet",
            value: intranetMeta.lastSync,
            icon: Globe,
            color: "text-primary",
          },
          {
            label: "Última: Intranet → Documentos",
            value: documentsMeta.lastSync,
            sub:
              documentsMeta.created !== "—"
                ? `${documentsMeta.created} criados · ${documentsMeta.deleted} apagados no disco`
                : undefined,
            icon: HardDrive,
            color: "text-info",
          },
          {
            label: "Departamentos (após sync intranet)",
            value: intranetMeta.depts,
            icon: AlertCircle,
            color: "text-muted-foreground",
          },
          {
            label: "Documentos na base",
            value: intranetMeta.docs,
            icon: FileText,
            color: "text-muted-foreground",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4"
          >
            <s.icon size={26} className={s.color} />
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
              {"sub" in s && s.sub ? (
                <p className="text-[11px] text-muted-foreground/80 mt-1 leading-snug">{s.sub}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="text-primary" size={22} />
            <h2 className="text-lg font-semibold text-foreground">Sincronizar a Intranet</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Lê toda a pasta <span className="font-mono text-xs">Documentos</span> e atualiza a base de dados
            do site (departamentos, grupos e ficheiros). Remove da base entradas de ficheiros que já não
            existem no disco.
          </p>
          <Button
            size="lg"
            className="w-full"
            disabled={syncing}
            onClick={() => startSync("documentos")}
          >
            <RefreshCw size={18} className="mr-2" />
            Sincronizar a Intranet
          </Button>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="text-info" size={22} />
            <h2 className="text-lg font-semibold text-foreground">Sincronizar os documentos</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            Garante pastas e ficheiros em <span className="font-mono text-xs">Documentos</span> conforme a
            intranet: cria o que falta (placeholders quando necessário) e{" "}
            <span className="text-destructive font-medium">apaga no disco</span> ficheiros que não estão na
            base.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={syncing}
            onClick={() => startSync("intranet")}
          >
            <RefreshCw size={18} className="mr-2" />
            Sincronizar os documentos
          </Button>
        </div>
      </div>

      {/* Progresso / resultado */}
      <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
        {!syncing && !done && !error && (
          <p className="text-sm text-muted-foreground">
            Escolha uma das duas sincronizações acima.
          </p>
        )}

        {syncing && (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              {activeKind === "intranet"
                ? "A atualizar a intranet a partir da pasta Documentos…"
                : "A alinhar a pasta Documentos com a base de dados…"}
            </p>
            <Progress value={Math.min(progress, 100)} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">{Math.min(Math.round(progress), 100)}% concluído</p>
          </>
        )}

        {error && (
          <div className="space-y-4">
            <AlertCircle size={48} className="mx-auto text-destructive" />
            <p className="text-lg font-semibold text-destructive">Erro na sincronização</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {activeKind && (
                <Button variant="outline" onClick={() => startSync(activeKind)}>
                  <RefreshCw size={16} className="mr-2" /> Tentar novamente
                </Button>
              )}
              <Button variant="ghost" onClick={resetToIdle}>
                Voltar
              </Button>
            </div>
          </div>
        )}

        {done && activeKind && (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-success" />
            <p className="text-lg font-semibold text-foreground">Concluído</p>
            {activeKind === "intranet" ? (
              <div className="flex justify-center gap-8 text-sm flex-wrap">
                <span className="text-success font-medium">
                  {intranetResults.processed} ficheiros processados
                </span>
                <span className="text-destructive font-medium">
                  {intranetResults.removed} removidos da base
                </span>
              </div>
            ) : (
              <div className="flex justify-center gap-8 text-sm flex-wrap">
                <span className="text-success font-medium">
                  {documentsResults.created} ficheiros criados no disco
                </span>
                <span className="text-destructive font-medium">
                  {documentsResults.deleted} ficheiros apagados no disco
                </span>
              </div>
            )}
            <Button variant="outline" className="mt-4" onClick={resetToIdle}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSincronizar;
