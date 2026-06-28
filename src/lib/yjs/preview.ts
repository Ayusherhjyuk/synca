import * as Y from "yjs";
import { yDocToProsemirrorJSON } from "y-prosemirror";
import { YJS_FRAGMENT } from "@/lib/constants";

type PMNode = { type?: string; text?: string; content?: PMNode[] };

function collectText(node: PMNode, out: string[]) {
  if (node.text) out.push(node.text);
  if (node.content) for (const child of node.content) collectText(child, out);
}

export function previewFromState(state: Uint8Array, maxChars = 280): string {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  try {
    const json = yDocToProsemirrorJSON(doc, YJS_FRAGMENT) as PMNode;
    const parts: string[] = [];
    collectText(json, parts);
    const text = parts.join(" ").replace(/\s+/g, " ").trim();
    return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
  } catch {
    return "";
  } finally {
    doc.destroy();
  }
}
