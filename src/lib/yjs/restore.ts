"use client";
import * as Y from "yjs";
import type { Editor } from "@tiptap/react";
import { yDocToProsemirrorJSON } from "y-prosemirror";
import { YJS_FRAGMENT } from "@/lib/constants";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function restoreVersion(
  editor: Editor,
  documentId: string,
  versionId: string,
): Promise<void> {
  const res = await fetch(`/api/documents/${documentId}/versions/${versionId}`);
  if (!res.ok) throw new Error("Failed to load version");
  const { state } = (await res.json()) as { state: string };

  const tmp = new Y.Doc();
  Y.applyUpdate(tmp, base64ToBytes(state));
  const json = yDocToProsemirrorJSON(tmp, YJS_FRAGMENT);
  tmp.destroy();

  const replacement = editor.schema.nodeFromJSON(json);
  const { state: edState, view } = editor;
  const tr = edState.tr.replaceWith(0, edState.doc.content.size, replacement.content);
  tr.setMeta("addToHistory", true);
  view.dispatch(tr);
}
