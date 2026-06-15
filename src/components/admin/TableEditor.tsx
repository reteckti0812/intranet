import { useMemo } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseTableRows, type TableColumn, type TableRowData } from "@/lib/homeTables";

interface Props {
  value: string;
  columns: TableColumn[];
  onChange: (jsonValue: string) => void;
  addLabel?: string;
}

/**
 * Editor de tabela visual: cada linha vira um registro; botão "+" adiciona linha.
 * Salva como JSON (array de objetos) na string `value`.
 */
export function TableEditor({ value, columns, onChange, addLabel = "Adicionar linha" }: Props) {
  const rows = useMemo(() => parseTableRows(value), [value]);
  const isLegacyHtml = Boolean(value && value.trim() && rows.length === 0 && !value.trim().startsWith("["));

  const commit = (next: TableRowData[]) => onChange(JSON.stringify(next));

  const addRow = () => {
    const blank: TableRowData = {};
    columns.forEach((c) => (blank[c.key] = ""));
    commit([...rows, blank]);
  };

  const updateCell = (idx: number, key: string, val: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
    commit(next);
  };

  const removeRow = (idx: number) => commit(rows.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[idx], next[j]] = [next[j], next[idx]];
    commit(next);
  };

  return (
    <div className="space-y-2">
      {isLegacyHtml && (
        <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          Havia conteúdo antigo (texto/HTML) aqui. Ao adicionar linhas e salvar, ele será substituído por esta tabela.
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="w-8" />
              {columns.map((c) => (
                <th key={c.key} className="text-left px-3 py-2 font-medium text-muted-foreground">{c.label}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma linha. Clique em “{addLabel}”.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-b border-border last:border-0">
                  <td className="px-1 text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <button type="button" title="Subir" onClick={() => move(idx, -1)} className="hover:text-foreground leading-none">▲</button>
                      <GripVertical size={12} className="opacity-40" />
                      <button type="button" title="Descer" onClick={() => move(idx, 1)} className="hover:text-foreground leading-none">▼</button>
                    </div>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-2 py-1.5">
                      <Input
                        value={row[c.key] || ""}
                        placeholder={c.placeholder}
                        onChange={(e) => updateCell(idx, c.key, e.target.value)}
                        className="h-9"
                      />
                    </td>
                  ))}
                  <td className="px-1 text-center">
                    <button
                      type="button"
                      title="Remover linha"
                      onClick={() => removeRow(idx)}
                      className="p-1.5 rounded-md text-destructive hover:bg-accent"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus size={15} className="mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

export default TableEditor;
