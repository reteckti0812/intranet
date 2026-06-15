/** URL de download público de um documento (apenas documentos aprovados). */
export function publicDownloadUrl(documentId: number | string): string {
  return `/api/documents/public/${documentId}/download`;
}

/** URL de download autenticado (área admin) — versão atual do documento. */
export function adminDownloadUrl(documentId: number | string): string {
  return `/api/documents/${documentId}/download`;
}

/** URL de download autenticado de uma versão específica. */
export function adminVersionDownloadUrl(
  documentId: number | string,
  versionId: number | string
): string {
  return `/api/documents/${documentId}/versions/${versionId}/download`;
}
