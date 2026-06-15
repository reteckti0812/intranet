import DOMPurify from "dompurify";

/**
 * True if the string likely contains HTML markup (vs plain text).
 * The previous check required the 3rd character to be space, >, / or ! — so `<table>`
 * was treated as plain text and tags appeared literally on the page.
 */
export function looksLikeHtml(raw: string): boolean {
  const s = String(raw || "");
  if (!s.trim()) return false;
  // <tag …>, </tag>, <br>, <table>…, or truncated "<table"
  if (/<\/?[a-z][a-z0-9-]*(?:\s|\/?>|$)/i.test(s)) return true;
  // <!DOCTYPE, <!-- …
  if (/<![a-z]/i.test(s)) return true;
  return false;
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "blockquote",
  "span",
  "div",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "colgroup",
  "col",
  "tr",
  "th",
  "td",
  "caption",
  "hr",
];

const ALLOWED_ATTR = ["href", "target", "colspan", "rowspan", "span", "title", "type", "start"];

let hooksInstalled = false;

function ensureLinkHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName !== "A") return;
    if (node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

export function sanitizeHomeHtml(html: string): string {
  ensureLinkHooks();
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
