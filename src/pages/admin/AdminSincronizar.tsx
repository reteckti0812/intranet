import { useState } from "react";
import { RefreshCw, FolderOpen, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const AdminSincronizar = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState({ added: 0, removed: 0, unchanged: 0 });

  const startSync = () => {
    setSyncing(true);
    setDone(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncing(false);
          setDone(true);
          setResults({ added: 12, removed: 3, unchanged: 142 });
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Sincronização de Documentos</h1>
        <Button variant="outline" onClick={() => {}}>
          <FolderOpen size={16} className="mr-2" />Abrir Pasta Raiz
        </Button>
      </div>

      {/* Status card */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Última Sincronização", value: "07/04/2026 — 14:32", icon: CheckCircle2, color: "text-success" },
          { label: "Departamentos Escaneados", value: "13", icon: AlertCircle, color: "text-primary" },
          { label: "Documentos Encontrados", value: "157", icon: FileText, color: "text-info" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4">
            <s.icon size={28} className={s.color} />
            <div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sync action */}
      <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center">
        {!syncing && !done && (
          <>
            <p className="text-muted-foreground mb-4">Clique para iniciar a sincronização dos documentos.</p>
            <Button size="lg" onClick={startSync}>
              <RefreshCw size={20} className="mr-2" />Sincronizar Agora
            </Button>
          </>
        )}

        {syncing && (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Escaneando: <span className="font-mono text-xs">C:\Intranet\Documentos</span>
            </p>
            <Progress value={Math.min(progress, 100)} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">{Math.min(Math.round(progress), 100)}% concluído</p>
          </>
        )}

        {done && (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-success" />
            <p className="text-lg font-semibold text-foreground">Sincronização Concluída!</p>
            <div className="flex justify-center gap-8 text-sm">
              <span className="text-success font-medium">{results.added} novos arquivos</span>
              <span className="text-destructive font-medium">{results.removed} arquivos removidos</span>
              <span className="text-muted-foreground">{results.unchanged} inalterados</span>
            </div>
            <Button variant="outline" onClick={startSync} className="mt-4">
              <RefreshCw size={16} className="mr-2" />Sincronizar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSincronizar;
