"use client";
import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { History, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restoreVersion } from "@/lib/yjs/restore";
import { timeAgo } from "@/lib/utils";

type Version = {
  id: string;
  label: string;
  summary: string;
  author: string;
  createdAt: string;
};

export function VersionHistory({
  documentId,
  editor,
  canWrite,
}: {
  documentId: string;
  editor: Editor | null;
  canWrite: boolean;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}/versions`);
    if (res.ok) setVersions((await res.json()).versions);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    load();
  }, [load]);

  const snapshot = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        setLabel("");
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const restore = async (id: string) => {
    if (!editor) return;
    setRestoringId(id);
    try {
      await restoreVersion(editor, documentId, id);
    } catch (err) {
      console.error("[restore] failed:", err);
      alert("Restore failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <History className="h-4 w-4 text-muted" />
        <h2 className="text-sm font-semibold text-fg">Version history</h2>
      </div>

      {canWrite && (
        <div className="flex gap-2 border-b border-border p-3">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label this version (optional)"
            aria-label="Version label"
          />
          <Button size="sm" onClick={snapshot} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-3 text-sm text-muted">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="p-3 text-sm text-muted">
            No versions yet. Save a snapshot to start your timeline.
          </p>
        ) : (
          <ol className="relative space-y-1 pl-2">
            {versions.map((v) => (
              <li key={v.id} className="group rounded-md p-3 hover:bg-surface2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {v.label || "Snapshot"}
                    </p>
                    <p className="text-xs text-muted">
                      {timeAgo(v.createdAt)}
                      {v.author ? ` · ${v.author}` : ""}
                    </p>
                    {v.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{v.summary}</p>
                    )}
                  </div>
                  {canWrite && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => restore(v.id)}
                      disabled={restoringId === v.id}
                      aria-label={`Restore version ${v.label || ""}`}
                    >
                      {restoringId === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
