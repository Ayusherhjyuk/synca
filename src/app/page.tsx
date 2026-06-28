import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Cloud, GitBranch, ShieldCheck, Wifi, Sparkles, History } from "lucide-react";

const FEATURES = [
  { Icon: Wifi, title: "Local-first", body: "Open, edit and close documents with zero blocking network calls. Works fully offline." },
  { Icon: Cloud, title: "Background sync", body: "Offline edits queue locally and reconcile automatically on reconnect — nothing is lost." },
  { Icon: GitBranch, title: "CRDT merge", body: "Concurrent edits merge deterministically with no data loss, powered by Yjs." },
  { Icon: History, title: "Time travel", body: "Snapshot any moment and safely restore — without corrupting collaborators' live state." },
  { Icon: ShieldCheck, title: "Secure by design", body: "Role-based access, server-side validation, payload limits and tenant isolation." },
  { Icon: Sparkles, title: "AI built in", body: "Summarize, rewrite and continue your writing with one click." },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-extrabold tracking-tight">
          <span className="gradient-text">Synca</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link href="/register">Get started</Link></Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-4">
        <section className="mx-auto max-w-3xl py-20 text-center animate-in-up">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs font-medium text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Offline-ready · Real-time · Conflict-free
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Write together.
            <br />
            <span className="gradient-text">Even offline.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            A local-first collaborative document editor with deterministic conflict resolution,
            background synchronization, and granular version history.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Button asChild size="lg"><Link href="/register">Start writing — free</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/login">I have an account</Link></Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-5xl gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, body }, i) => (
            <div
              key={title}
              className="glass glass-shadow group rounded-2xl p-6 text-left transition-transform hover:-translate-y-1 animate-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="gradient-accent inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm shadow-indigo-500/25">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-fg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
