"use client";
import { Cloud, CloudOff, RefreshCw, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/yjs/useCollaborativeDoc";

const MAP: Record<SyncStatus, { label: string; cls: string; Icon: React.ElementType; spin?: boolean }> = {
  loading: { label: "Loading…", cls: "text-muted", Icon: Loader2, spin: true },
  offline: { label: "Offline — saved locally", cls: "text-amber-500", Icon: CloudOff },
  connecting: { label: "Connecting…", cls: "text-muted", Icon: Loader2, spin: true },
  syncing: { label: "Syncing…", cls: "text-blue-500", Icon: RefreshCw, spin: true },
  synced: { label: "All changes synced", cls: "text-emerald-500", Icon: Cloud },
};

export function ConnectionStatus({ status, peers }: { status: SyncStatus; peers: number }) {
  const { label, cls, Icon, spin } = MAP[status];
  return (
    <div className="flex items-center gap-3 text-sm" role="status" aria-live="polite">
      <span className={cn("inline-flex items-center gap-1.5 font-medium", cls)}>
        <Icon className={cn("h-4 w-4", spin && "animate-spin")} aria-hidden />
        {label}
      </span>
      {peers > 1 && (
        <span className="inline-flex items-center gap-1 text-muted">
          <Users className="h-4 w-4" aria-hidden />
          {peers} online
        </span>
      )}
    </div>
  );
}
