type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

export function extractTipTapText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const walk = (node: TipTapNode): string => {
    if (typeof node.text === "string") return node.text;
    if (!Array.isArray(node.content)) return "";
    return node.content.map(walk).join(" ");
  };
  return walk(doc as TipTapNode).replace(/\s+/g, " ").trim();
}

export const EMPTY_DOC = {
  type: "doc" as const,
  content: [{ type: "paragraph" }],
};
