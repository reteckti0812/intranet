/** Caminho absoluto ou relativo a `Documentos` → URL relativa servida em `/docs/...`. */
export function hrefForDocumentPath(filePath: string): string {
  if (!filePath) return "#";
  const norm = filePath.replace(/\\/g, "/");
  const lower = norm.toLowerCase();
  const marker = "/documentos/";
  const i = lower.indexOf(marker);
  const relative = i >= 0 ? norm.slice(i + marker.length) : norm;
  return (
    "/docs/" +
    relative
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/")
  );
}
