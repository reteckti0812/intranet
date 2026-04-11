import { cn } from "@/lib/utils";
import { looksLikeHtml, sanitizeHomeHtml } from "@/lib/sanitizeHomeHtml";

type Props = {
  content: string | undefined | null;
  className?: string;
  as?: "div" | "article" | "p";
};

/**
 * Renders home / admin content: plain text keeps line breaks and spaces;
 * HTML (when detected) is sanitized then rendered (negrito, listas, tabelas, etc.).
 */
export function HomeRichText({ content, className, as: Tag = "div" }: Props) {
  const raw = content ?? "";
  if (!raw.trim()) return null;

  if (looksLikeHtml(raw)) {
    return (
      <Tag
        className={cn("home-rich-text", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeHomeHtml(raw) }}
      />
    );
  }

  return <Tag className={cn("whitespace-pre-wrap", className)}>{raw}</Tag>;
}
