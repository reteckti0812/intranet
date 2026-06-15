import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading2, Heading3, Link2, Link2Off, Eye, Pencil, Undo2, Redo2,
} from "lucide-react";
import { HomeRichText } from "@/components/HomeRichText";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// Lista ordenada que aceita o atributo `type` (1, a, A, i) → permite a), b), c).
const TypedOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      type: {
        default: null,
        parseHTML: (el) => el.getAttribute("type"),
        renderHTML: (attrs) => (attrs.type ? { type: attrs.type } : {}),
      },
    };
  },
});

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const numberedActive = editor.isActive("orderedList") && !editor.isActive("orderedList", { type: "a" });
  const alphaActive = editor.isActive("orderedList", { type: "a" });

  const toggleNumbered = () => {
    if (numberedActive) { editor.chain().focus().toggleOrderedList().run(); return; }
    if (!editor.isActive("orderedList")) editor.chain().focus().toggleOrderedList().run();
    editor.chain().focus().updateAttributes("orderedList", { type: null }).run();
  };
  const toggleAlpha = () => {
    if (alphaActive) { editor.chain().focus().toggleOrderedList().run(); return; }
    if (!editor.isActive("orderedList")) editor.chain().focus().toggleOrderedList().run();
    editor.chain().focus().updateAttributes("orderedList", { type: "a" }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1.5">
      <ToolbarButton title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
      <ToolbarButton title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
      <ToolbarButton title="Sublinhado" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton title="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></ToolbarButton>
      <ToolbarButton title="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton title="Lista com marcadores" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
      <ToolbarButton title="Lista numerada (1, 2, 3)" active={numberedActive} onClick={toggleNumbered}><ListOrdered size={16} /></ToolbarButton>
      <ToolbarButton title="Lista alfabética (a, b, c)" active={alphaActive} onClick={toggleAlpha}><span className="text-[13px] font-bold leading-none px-0.5">a.</span></ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton title="Inserir link" active={editor.isActive("link")} onClick={setLink}><Link2 size={16} /></ToolbarButton>
      <ToolbarButton title="Remover link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Link2Off size={16} /></ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
      <ToolbarButton title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ value, onChange, minHeight = 200 }: Props) {
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ orderedList: false }),
      TypedOrderedList,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose-editor focus:outline-none px-3 py-2 text-sm " +
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold " +
          "[&_a]:text-primary [&_a]:underline [&_p]:my-1",
      },
    },
  });

  // Sincroniza quando o valor externo chega/é trocado (ex.: carregamento assíncrono).
  useEffect(() => {
    if (!editor) return;
    if ((value || "") !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-input bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/40">
        {preview ? <div className="px-3 py-1.5 text-xs text-muted-foreground">Pré-visualização</div> : <Toolbar editor={editor} />}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs text-primary hover:bg-accent shrink-0"
        >
          {preview ? <><Pencil size={14} /> Editar</> : <><Eye size={14} /> Visualizar</>}
        </button>
      </div>

      {preview ? (
        <div className="px-3 py-2" style={{ minHeight }}>
          {value?.trim()
            ? <HomeRichText content={value} className="text-sm text-foreground" />
            : <p className="text-sm text-muted-foreground italic">Nada para mostrar ainda.</p>}
        </div>
      ) : (
        <div style={{ minHeight }} onClick={() => editor.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
