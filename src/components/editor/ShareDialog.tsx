"use client";
import { useEffect, useState } from "react";
import { Share2, Trash2, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/constants";

type Collaborator = { userId: string; name?: string; email?: string; role: Role };

export function ShareDialog({ documentId, isOwner }: { documentId: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch(`/api/documents/${documentId}/share`);
    if (res.ok) setList((await res.json()).collaborators);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? "Failed to share");
        return;
      }
      setEmail("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (userId: string) => {
    await fetch(`/api/documents/${documentId}/share?userId=${userId}`, { method: "DELETE" });
    await load();
  };

  const changeRole = async (userId: string, newRole: Role) => {
    await fetch(`/api/documents/${documentId}/share`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    await load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite collaborators by email. Viewers can read but cannot edit.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={invite} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                aria-label="Collaborator email"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
                aria-label="Role"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </form>
        )}

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {list.map((c) => (
            <li key={c.userId} className="flex items-center justify-between rounded-md p-2 hover:bg-surface2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{c.name || c.email}</p>
                <p className="truncate text-xs text-muted">{c.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {c.role === "owner" || !isOwner ? (
                  <Badge variant={c.role}>{c.role}</Badge>
                ) : (
                  <>
                    <select
                      value={c.role}
                      onChange={(e) => changeRole(c.userId, e.target.value as Role)}
                      className="h-8 rounded-md border border-border bg-surface px-2 text-xs"
                      aria-label={`Change role for ${c.email}`}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => revoke(c.userId)}
                      className="text-muted hover:text-red-500"
                      aria-label={`Remove ${c.email}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
