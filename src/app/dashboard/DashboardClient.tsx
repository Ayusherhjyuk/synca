"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { FileText, Plus, LogOut, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { timeAgo } from "@/lib/utils";
import type { Role } from "@/lib/constants";

export type DocCard = { id: string; title: string; role: Role; updatedAt: string };

export function DashboardClient({
  documents,
  userName,
}: {
  documents: DocCard[];
  userName: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const create = async () => {
    setCreating(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled document" }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/documents/${id}`);
    } else {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this document permanently? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) router.refresh();
  };

  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            <span className="gradient-text">Synca</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 sm:flex">
              <span className="gradient-accent flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="text-sm text-muted">{userName}</span>
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-fg">Your documents</h1>
            <p className="mt-1 text-sm text-muted">
              {documents.length} {documents.length === 1 ? "document" : "documents"} · synced &amp; offline-ready
            </p>
          </div>
          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New document
          </Button>
        </div>

        {documents.length === 0 ? (
          <div className="glass glass-shadow flex flex-col items-center justify-center rounded-2xl py-20 text-center">
            <div className="gradient-accent flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm shadow-indigo-500/25">
              <FileText className="h-7 w-7" />
            </div>
            <p className="mt-4 font-semibold text-fg">No documents yet</p>
            <p className="text-sm text-muted">Create your first document to get started.</p>
            <Button className="mt-5" onClick={create} disabled={creating}>
              <Plus className="h-4 w-4" /> New document
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((d, i) => (
              <li
                key={d.id}
                className="glass glass-shadow group relative rounded-2xl transition-transform hover:-translate-y-1 animate-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link href={`/documents/${d.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="gradient-accent flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm shadow-indigo-500/25">
                      <FileText className="h-5 w-5" />
                    </div>
                    <Badge variant={d.role}>{d.role}</Badge>
                  </div>
                  <h3 className="mt-4 truncate font-semibold text-fg">{d.title}</h3>
                  <p className="mt-1 text-xs text-muted">Edited {timeAgo(d.updatedAt)}</p>
                </Link>
                {d.role === "owner" && (
                  <button
                    onClick={() => remove(d.id)}
                    disabled={deletingId === d.id}
                    aria-label={`Delete ${d.title}`}
                    className="absolute bottom-4 right-4 rounded-lg p-1.5 text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  >
                    {deletingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
