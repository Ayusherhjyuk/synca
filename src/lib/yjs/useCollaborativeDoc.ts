"use client";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";

export type SyncStatus = "loading" | "offline" | "connecting" | "syncing" | "synced";

export interface CollabState {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;

  localLoaded: boolean;
  status: SyncStatus;

  peers: number;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:1234";

export function useCollaborativeDoc(
  documentId: string,
  user: { name: string; color: string },
): CollabState {
  const [localLoaded, setLocalLoaded] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [peers, setPeers] = useState(1);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  const userRef = useRef(user);
  userRef.current = user;

  if (!docRef.current) docRef.current = new Y.Doc();

  useEffect(() => {
    const doc = docRef.current!;
    let cancelled = false;
    let online = typeof navigator === "undefined" ? true : navigator.onLine;

    const idb = new IndexeddbPersistence(`doc-${documentId}`, doc);
    idb.on("synced", () => {
      if (!cancelled) setLocalLoaded(true);
    });

    let provider: WebsocketProvider | null = null;

    const recomputeStatus = () => {
      if (!online) return setStatus("offline");
      if (!provider) return setStatus("connecting");
      if (provider.wsconnected && provider.synced) return setStatus("synced");
      if (provider.wsconnected) return setStatus("syncing");
      return setStatus("connecting");
    };

    const start = async () => {
      let token = "";
      try {
        const res = await fetch("/api/realtime-token");
        if (res.ok) token = (await res.json()).token;
      } catch {
        /* offline — provider will retry once back online */
      }
      if (cancelled) return;

      provider = new WebsocketProvider(WS_URL, documentId, doc, {
        params: token ? { token } : {},
        connect: online,
      });
      providerRef.current = provider;

      provider.awareness.setLocalStateField("user", {
        name: userRef.current.name,
        color: userRef.current.color,
      });

      provider.on("status", recomputeStatus);
      provider.on("sync", recomputeStatus);
      provider.awareness.on("change", () => {
        if (!cancelled) setPeers(provider!.awareness.getStates().size);
      });
      recomputeStatus();
    };
    start();

    const goOnline = () => {
      online = true;
      provider?.connect();
      recomputeStatus();
    };
    const goOffline = () => {
      online = false;
      provider?.disconnect();
      recomputeStatus();
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      provider?.destroy();
      idb.destroy();
      providerRef.current = null;
    };
  }, [documentId]);

  return {
    doc: docRef.current,
    provider: providerRef.current,
    localLoaded,
    status,
    peers,
  };
}
