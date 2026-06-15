export interface TableColumn {
  key: string;
  label: string;
  placeholder?: string;
}

export const CONTACT_COLUMNS: TableColumn[] = [
  { key: "nome", label: "Nome", placeholder: "Ex.: João Silva" },
  { key: "setor", label: "Setor", placeholder: "Ex.: Financeiro" },
  { key: "ramal", label: "Ramal", placeholder: "Ex.: 1021" },
  { key: "email", label: "E-mail", placeholder: "Ex.: joao@re-teckbr.com" },
];

export const EXTERNAL_COLUMNS: TableColumn[] = [
  { key: "descricao", label: "Descrição", placeholder: "Ex.: Emergência / Suporte TI" },
  { key: "numero", label: "Número / Instrução", placeholder: "Ex.: 190 ou 0 + número" },
];

export type TableRowData = Record<string, string>;

/** Lê o valor salvo (JSON) como linhas. Retorna [] para texto/HTML legado. */
export function parseTableRows(raw?: string | null): TableRowData[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TableRowData[]) : [];
  } catch {
    return [];
  }
}

/** True se o valor é uma tabela (JSON array) e não texto/HTML legado. */
export function isJsonTable(raw?: string | null): boolean {
  if (!raw || !raw.trim()) return false;
  try {
    return Array.isArray(JSON.parse(raw));
  } catch {
    return false;
  }
}

/** Remove linhas totalmente vazias antes de salvar. */
export function cleanRows(rows: TableRowData[], columns: TableColumn[]): TableRowData[] {
  return rows.filter((r) => columns.some((c) => (r[c.key] || "").trim() !== ""));
}
