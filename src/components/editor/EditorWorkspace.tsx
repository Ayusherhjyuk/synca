"use client";
import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { ArrowLeft, History, Sparkles } from "lucide-react";
import { useCollaborativeDoc } from "@/lib/yjs/useCollaborativeDoc";
import { canWrite as roleCanWrite, type Role } from "@/lib/constants";
import { TiptapEditor } from "./Editor";
import { ConnectionStatus } from "./ConnectionStatus";
import { VersionHistory } from "./VersionHistory";
import { ShareDialog } from "./ShareDialog";
import { AIPanel } from "./AIPanel";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];
function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export function EditorWorkspace({
  documentId,
  initialTitle,
  role,
  userName,
}: {
  documentId: string;
  initialTitle: string;
  role: Role;
  userName: string;
}) {
  const writable = roleCanWrite(role);
  const user = useMemo(() => ({ name: userName, color: colorFor(userName) }), [userName]);
  const { doc, provider, localLoaded, status, peers } = useCollaborativeDoc(documentId, user);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [tab, setTab] = useState<"versions" | "ai">("versions");

  const saveTitle = async () => {
    if (!writable || !title.trim()) return;
    await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="glass z-30 flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/dashboard" className="text-muted transition-colors hover:text-fg" aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          readOnly={!writable}
          aria-label="Document title"
          className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1 text-lg font-semibold text-fg focus:outline-none focus-visible:bg-surface2 read-only:cursor-default"
        />
        <Badge variant={role}>{role}</Badge>
        <ConnectionStatus status={status} peers={peers} />
        <ShareDialog documentId={documentId} isOwner={role === "owner"} />
        <ThemeToggle />
      </header>

      {/* Body */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <main className="flex flex-1 flex-col">
          {!localLoaded || !doc ? (
            <div className="flex flex-1 items-center justify-center text-muted">
              Loading your local copy…
            </div>
          ) : (
            <TiptapEditor doc={doc} provider={provider} editable={writable} onReady={setEditor} />
          )}
          {!writable && (
            <p className="mt-2 text-center text-xs text-muted">
              You have view-only access. Edits are disabled and rejected by the server.
            </p>
          )}
        </main>

        {/* Sidebar */}
        <aside className="glass glass-shadow hidden w-80 flex-col rounded-2xl lg:flex">
          <div className="flex border-b border-border" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "versions"}
              onClick={() => setTab("versions")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
                tab === "versions" ? "border-b-2 border-accent text-fg" : "text-muted hover:text-fg",
              )}
            >
              <History className="h-4 w-4" /> History
            </button>
            <button
              role="tab"
              aria-selected={tab === "ai"}
              onClick={() => setTab("ai")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
                tab === "ai" ? "border-b-2 border-accent text-fg" : "text-muted hover:text-fg",
              )}
            >
              <Sparkles className="h-4 w-4" /> AI
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {tab === "versions" ? (
              <VersionHistory documentId={documentId} editor={editor} canWrite={writable} />
            ) : (
              <AIPanel editor={editor} canWrite={writable} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
