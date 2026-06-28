import * as Y from "yjs";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { prosemirrorJSONToYDoc } from "y-prosemirror";
import { YJS_FRAGMENT } from "@/lib/constants";

export const WELCOME_TITLE = "👋 Welcome to Synca";

const WELCOME_DOC = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Welcome to Synca 👋" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is your local-first collaborative editor. Everything you type saves to your browser instantly — " },
        { type: "text", marks: [{ type: "bold" }], text: "even with no internet" },
        { type: "text", text: "." },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Try this" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Type anything here — watch the status say “All changes synced.”" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Go offline (DevTools → Network → Offline), keep editing, then come back online and watch it sync." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Open the History tab to save a snapshot and restore an earlier version." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Click Share to invite a collaborator and edit together in real time." }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Use the AI tab to summarize, improve, or continue your writing." }] }] },
      ],
    },
    { type: "paragraph", content: [{ type: "text", text: "You can delete this note anytime from your dashboard. Happy writing!" }] },
  ],
};

export function buildWelcomeState(): Buffer {
  const schema = getSchema([StarterKit.configure({ undoRedo: false })]);
  const ydoc = prosemirrorJSONToYDoc(schema, WELCOME_DOC, YJS_FRAGMENT);
  const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  ydoc.destroy();
  return state;
}
