"use client";
import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Placeholder from "@tiptap/extension-placeholder";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { Toolbar } from "./Toolbar";

export function TiptapEditor({
  doc,
  provider,
  editable,
  onReady,
}: {
  doc: Y.Doc;
  provider: WebsocketProvider | null;
  editable: boolean;
  onReady?: (editor: Editor) => void;
}) {
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: doc }),
      ...(provider
        ? [CollaborationCaret.configure({ provider })]
        : []),
      Placeholder.configure({ placeholder: "Start writing… your words save locally, even offline." }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[60vh] px-6 py-5 focus:outline-none",
        "aria-label": "Document editor",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  return (
    <div className="glass glass-shadow flex flex-1 flex-col overflow-hidden rounded-2xl">
      {editable && <Toolbar editor={editor} />}
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
