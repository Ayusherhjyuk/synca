import "./load-env";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as awarenessProtocol from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";

import { verifyRealtimeToken } from "@/lib/auth/realtime-token";
import { getUserRole } from "@/lib/authz";
import { loadDoc, appendUpdate, compact } from "@/lib/yjs/persistence";
import { canWrite, MAX_SYNC_PAYLOAD_BYTES, PERSIST_DEBOUNCE_MS, type Role } from "@/lib/constants";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;
const SYNC_STEP_1 = 0;
const SYNC_STEP_2 = 1;
const SYNC_UPDATE = 2;

type Conn = { ws: WebSocket; role: Role; userId: string; controlledIds: Set<number> };

type Room = {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Set<Conn>;
  persistTimer: NodeJS.Timeout | null;
};

const rooms = new Map<string, Room>();

function send(ws: WebSocket, payload: Uint8Array) {
  if (ws.readyState === WebSocket.OPEN) ws.send(payload, (err) => err && ws.close());
}

function broadcast(room: Room, payload: Uint8Array, except?: WebSocket) {
  for (const c of room.conns) if (c.ws !== except) send(c.ws, payload);
}

function schedulePersist(documentId: string, room: Room) {
  if (room.persistTimer) return;
  room.persistTimer = setTimeout(async () => {
    room.persistTimer = null;
    try {
      await compact(documentId, room.doc);
    } catch (err) {
      console.error(`[ws] compaction failed for ${documentId}:`, err);
    }
  }, PERSIST_DEBOUNCE_MS);
}

const roomLoading = new Map<string, Promise<Room>>();

function getRoom(documentId: string): Promise<Room> {
  const existing = rooms.get(documentId);
  if (existing) return Promise.resolve(existing);

  const loading = roomLoading.get(documentId);
  if (loading) return loading;

  const creation = createRoom(documentId);
  roomLoading.set(documentId, creation);
  creation.finally(() => roomLoading.delete(documentId));
  return creation;
}

async function createRoom(documentId: string): Promise<Room> {
  const doc = await loadDoc(documentId);
  const awareness = new awarenessProtocol.Awareness(doc);
  const room: Room = { doc, awareness, conns: new Set(), persistTimer: null };

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MESSAGE_SYNC);
    syncProtocol.writeUpdate(enc, update);
    broadcast(room, encoding.toUint8Array(enc), (origin as Conn | undefined)?.ws);

    appendUpdate(documentId, update).catch((e) =>
      console.error(`[ws] append failed for ${documentId}:`, e),
    );
    schedulePersist(documentId, room);
  });

  awareness.on(
    "update",
    ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
      const changed = added.concat(updated, removed);
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(awareness, changed));
      broadcast(room, encoding.toUint8Array(enc), (origin as Conn | undefined)?.ws);
    },
  );

  rooms.set(documentId, room);
  return room;
}

function handleMessage(conn: Conn, room: Room, data: Uint8Array) {
  if (data.byteLength > MAX_SYNC_PAYLOAD_BYTES) {
    conn.ws.close(1009, "payload too large");
    return;
  }

  const decoder = decoding.createDecoder(data);
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case MESSAGE_SYNC: {
      const syncType = decoding.readVarUint(decoder);
      if (syncType === SYNC_STEP_1) {
        const enc = encoding.createEncoder();
        encoding.writeVarUint(enc, MESSAGE_SYNC);
        syncProtocol.writeSyncStep2(enc, room.doc, decoding.readVarUint8Array(decoder));
        send(conn.ws, encoding.toUint8Array(enc));
      } else if (syncType === SYNC_STEP_2 || syncType === SYNC_UPDATE) {
        const update = decoding.readVarUint8Array(decoder);

        if (canWrite(conn.role)) Y.applyUpdate(room.doc, update, conn);
      }
      break;
    }
    case MESSAGE_AWARENESS: {
      awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), conn);
      break;
    }
    default:
      break;
  }
}

function parseRequest(url: string | undefined): { documentId: string; token: string } | null {
  if (!url) return null;

  const parsed = new URL(url, "http://localhost");
  const documentId = decodeURIComponent(parsed.pathname.replace(/^\/+/, "").split("/")[0] ?? "");
  const token = parsed.searchParams.get("token") ?? "";
  if (!documentId || !token) return null;
  return { documentId, token };
}

const port = Number(process.env.PORT ?? process.env.WS_PORT ?? 1234);
const wss = new WebSocketServer({ port, maxPayload: MAX_SYNC_PAYLOAD_BYTES });

wss.on("connection", async (ws, req) => {
  const parsed = parseRequest(req.url);
  if (!parsed) {
    ws.close(4400, "bad request");
    return;
  }

  let userId: string;
  let name: string;
  try {
    const claims = await verifyRealtimeToken(parsed.token);
    userId = claims.sub;
    name = claims.name;
  } catch {
    ws.close(4401, "unauthorized");
    return;
  }

  const role = await getUserRole(parsed.documentId, userId);
  if (!role) {
    ws.close(4403, "forbidden");
    return;
  }

  const room = await getRoom(parsed.documentId);
  const conn: Conn = { ws, role, userId, controlledIds: new Set() };
  room.conns.add(conn);
  console.log(`[ws] ${name || userId} joined ${parsed.documentId} as ${role} (${room.conns.size} online)`);

  {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(enc, room.doc);
    send(ws, encoding.toUint8Array(enc));
  }

  {
    const states = room.awareness.getStates();
    if (states.size > 0) {
      const enc = encoding.createEncoder();
      encoding.writeVarUint(enc, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        enc,
        awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys())),
      );
      send(ws, encoding.toUint8Array(enc));
    }
  }

  ws.on("message", (data: Buffer) => {
    try {
      handleMessage(conn, room, new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    } catch (err) {
      console.error(`[ws] message error on ${parsed.documentId}:`, err);
    }
  });

  ws.on("close", () => {
    room.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(conn.controlledIds), "connection closed");
    console.log(`[ws] left ${parsed.documentId} (${room.conns.size} online)`);

    if (room.conns.size === 0) {
      if (room.persistTimer) {
        clearTimeout(room.persistTimer);
        room.persistTimer = null;
      }
      compact(parsed.documentId, room.doc)
        .catch((e) => console.error(`[ws] final compaction failed:`, e))
        .finally(() => {
          if (room.conns.size === 0) {
            room.doc.destroy();
            rooms.delete(parsed.documentId);
          }
        });
    }
  });

  room.awareness.on("update", ({ added }: { added: number[] }, origin: unknown) => {
    if (origin === conn) added.forEach((id) => conn.controlledIds.add(id));
  });
});

console.log(`[ws] Yjs sync server listening on ws://localhost:${port} (maxPayload ${MAX_SYNC_PAYLOAD_BYTES}B)`);
