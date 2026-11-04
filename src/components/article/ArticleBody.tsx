import { generateHTML } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import { sanitizeArticleHtml } from "@/lib/security/sanitize";

const extensions = [
  StarterKit,
  Link.configure({ openOnClick: false }),
  Image,
  Table.configure({ resizable: false }),
  TableRow,
  TableHeader,
  TableCell,
  Youtube.configure({ controls: true, nocookie: true }),
];

export function ArticleBody({ body }: { body: unknown }) {
  let html = "";
  try {
    html = generateHTML(body as never, extensions);
  } catch {
    html = "<p>Unable to render article body.</p>";
  }
  const safe = sanitizeArticleHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: safe }} />;
}
