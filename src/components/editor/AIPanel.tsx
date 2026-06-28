"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Sparkles, Loader2, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Action = "summarize" | "improve" | "continue";

export function AIPanel({ editor, canWrite }: { editor: Editor | null; canWrite: boolean }) {
  const [loading, setLoading] = useState<Action | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = async (action: Action) => {
    if (!editor) return;
    setError("");
    setResult("");
    setLoading(action);

    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "\n");
    const text = (selected || editor.getText()).slice(0, 20_000);
    if (!text.trim()) {
      setError("Nothing to work with — write something first.");
      setLoading(null);
      return;
    }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "AI request failed");
      else setResult(data.result);
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  };

  const insert = () => {
    if (editor && result) editor.chain().focus().insertContent(`\n${result}\n`).run();
    setResult("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Sparkles className="h-4 w-4 text-violet-500" />
        <h2 className="text-sm font-semibold text-fg">AI assistant</h2>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-xs text-muted">
          Runs on your selection, or the whole document if nothing is selected.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="subtle" onClick={() => run("summarize")} disabled={!!loading}>
            {loading === "summarize" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Summarize
          </Button>
          {canWrite && (
            <>
              <Button size="sm" variant="subtle" onClick={() => run("improve")} disabled={!!loading}>
                {loading === "improve" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Improve
              </Button>
              <Button size="sm" variant="subtle" onClick={() => run("continue")} disabled={!!loading}>
                {loading === "continue" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue
              </Button>
            </>
          )}
        </div>

        {error && <p className="rounded-md bg-red-500/10 p-2 text-xs text-red-500">{error}</p>}

        {result && (
          <div className="space-y-2 rounded-md border border-border bg-surface2 p-3">
            <p className="whitespace-pre-wrap text-sm text-fg">{result}</p>
            {canWrite && (
              <div className="flex gap-2">
                <Button size="sm" onClick={insert}>
                  <Plus className="h-4 w-4" /> Insert
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setResult("")}>
                  <Check className="h-4 w-4" /> Dismiss
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
