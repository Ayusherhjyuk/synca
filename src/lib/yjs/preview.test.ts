import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import { Schema } from "@tiptap/pm/model";
import { prosemirrorJSONToYDoc } from "y-prosemirror";
import { previewFromState } from "./preview";
import { YJS_FRAGMENT } from "@/lib/constants";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0], parseDOM: [{ tag: "p" }] },
    text: { group: "inline" },
  },
  marks: {},
});

describe("version snapshot preview", () => {
  it("extracts readable text from a Yjs snapshot using the shared fragment name", () => {
    const json = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello version history" }] }],
    };
    const ydoc = prosemirrorJSONToYDoc(schema, json, YJS_FRAGMENT);
    const state = Y.encodeStateAsUpdate(ydoc);

    const preview = previewFromState(state);
    expect(preview).toContain("Hello version history");
  });

  it("truncates long content", () => {
    const long = "word ".repeat(200).trim();
    const json = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: long }] }] };
    const ydoc = prosemirrorJSONToYDoc(schema, json, YJS_FRAGMENT);
    const preview = previewFromState(Y.encodeStateAsUpdate(ydoc), 50);
    expect(preview.length).toBeLessThanOrEqual(51);
    expect(preview.endsWith("…")).toBe(true);
  });
});
