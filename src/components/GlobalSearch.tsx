import { useEffect, useRef, useState } from "react";
import { Search, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { publicDownloadUrl } from "@/lib/docsUrl";
import { viewFromApi } from "@/lib/download";

interface Result {
  id: number;
  code: string | null;
  title: string;
  file_type: string | null;
  department_name: string;
  group_name: string;
}

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/departments/search-documents", { params: { q: term, public: 1 } });
        setResults(res.data as Result[]);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openDoc = async (r: Result) => {
    setOpen(false);
    try {
      await viewFromApi(publicDownloadUrl(r.id));
    } catch {
      toast.error("Não foi possível abrir o documento.");
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Buscar documento…"
        className="w-full pl-9 pr-9 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}

      {open && q.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 right-0 w-full sm:w-[420px] bg-card border border-border rounded-xl shadow-card-hover p-1.5 max-h-[60vh] overflow-y-auto animate-pop">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento encontrado.</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => openDoc(r)}
                className="flex items-start gap-2.5 w-full text-left p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <FileText size={16} className="text-primary mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground truncate">
                    {r.code ? `${r.code} — ` : ""}{r.title}
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {r.department_name} · {r.group_name}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
