# Synca — Local-First Collaborative Document Editor

A **local-first**, real-time collaborative document editor with **offline synchronization**, **deterministic (CRDT) conflict resolution**, and **granular version control / time travel**.

Open, edit, and close documents with **zero network requests blocking the UI**. Edits commit to the browser first and reconcile with the server automatically when connectivity returns — concurrent edits merge without data loss, and you can travel back through a timeline of versions and restore any of them without corrupting other collaborators' live sessions.

> **Author:** Ayush Jadhao · [GitHub](https://github.com/Ayusherhjyuk) · [LinkedIn](https://www.linkedin.com/in/ayush-jadhao-413520256)

---

## ✨ Live demo & links

- **App (Vercel):** `https://<your-app>.vercel.app`
- **WebSocket sync server (Railway/Render):** `wss://<your-ws-host>`
- **Repository:** `https://github.com/<you>/<repo>`

---

---

## Why this is not a CRUD app

The hard problems here are distributed-systems problems, and they are solved explicitly:


| Problem                                            | Where it's solved                                                                                                                                                                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Browser-based memory management**                | The WS server holds one in-memory `Y.Doc` per active room, compacts it to a binary snapshot on a debounce, prunes the append-only update log, and **destroys the doc when the last client leaves**. The client caps inbound frames and decoded payloads. |
| **State-sync race conditions**                     | CRDT (Yjs) state-vector exchange means merges are **order-independent and idempotent** — duplicate or out-of-order delivery converges to the same state. Restore is modeled as a normal collaborative transaction, not an out-of-band overwrite.         |
| **Complex data merging over a real-time protocol** | A hand-written implementation of the y-websocket **sync + awareness wire protocol** with per-message **role enforcement** layered on top.                                                                                                                |


---

## Project structure

```
src/
├─ app/
│  ├─ (pages) page.tsx · login · register · dashboard · documents/[id]
│  └─ api/   auth · register · realtime-token · documents[/id][/share][/versions] · ai
├─ components/
│  ├─ ui/          button · input · dialog · card · badge · label  (accessible primitives)
│  ├─ editor/      EditorWorkspace · Editor · Toolbar · ConnectionStatus · VersionHistory · ShareDialog · AIPanel
│  └─ Footer.tsx   (author credit — required)
├─ lib/
│  ├─ auth/        NextAuth config · password hashing · realtime JWT
│  ├─ db/          mongoose connection · models (User, Document, Permission, Version, DocUpdate)
│  ├─ yjs/         useCollaborativeDoc (local-first hook) · persistence · preview · restore
│  ├─ validation/  Zod schemas
│  ├─ authz.ts · api.ts · constants.ts · utils.ts
└─ server/
   └─ ws-server.ts  standalone Yjs sync server (auth + roles + persistence)
```

## Architecture

Two deployables. The browser is the source of truth; the server is a relay + durable store.

```
┌────────────────────────── Browser (source of truth) ──────────────────────────┐
│                                                                                 │
│   TipTap (ProseMirror)  ⇄  Y.Doc  ──▶ IndexedDB (y-indexeddb)  ← offline cache  │
│                            │                                                    │
│                            └──▶ WebsocketProvider ──┐                           │
└─────────────────────────────────────────────────────┼──────────────────────────┘
                                                       │  ws(s):// + JWT
                          ┌────────────────────────────▼─────────────────────────┐
                          │      Standalone WebSocket sync server (Node + ws)      │
                          │  • verify realtime JWT (jose)                          │
                          │  • resolve role (owner/editor/viewer) per connection   │
                          │  • DROP writes from viewers                            │
                          │  • maxPayload frame limit (anti-OOM)                   │
                          │  • broadcast + append-only durability log              │
                          │  • debounced compaction to a snapshot                  │
                          └────────────────────────────┬──────────────────────────┘
                                                       │
                          ┌────────────────────────────▼─────────────────────────┐
                          │                   MongoDB (Mongoose)                   │
                          │  Document(snapshot)  DocUpdate(log)  Version(snapshots) │
                          │  User   Permission(tenant isolation)                   │
                          └───────────────────────────────────────────────────────┘

   Next.js (Vercel)  ── REST API ──▶ auth, documents, sharing, versions, AI, realtime-token
```

---

## Tech stack

- **Next.js 16** (App Router, RSC, SSR) + **TypeScript** (strict)
- **React 19**, **Tailwind CSS v4**, Radix UI primitives (accessible shadcn-style components)
- **Yjs** (CRDT) + **TipTap 3** / ProseMirror editor + **y-indexeddb** (local-first) + **y-websocket** (transport) + **y-prosemirror** (version preview/restore)
- **MongoDB** + **Mongoose**
- **Auth.js / NextAuth v5** (JWT sessions, Credentials) + **bcryptjs** + **jose** (realtime tokens)
- **Zod** (validation), **ws** (sync server)
- **Vercel AI SDK** + OpenAI (AI add-ons)
- **Vitest** (unit/integration) + **Playwright** (E2E) + **GitHub Actions** (CI)

---

## How the core problems are solved

### 1. Local-first architecture

`y-indexeddb` persists the `Y.Doc` to IndexedDB. The editor renders from the local copy as soon as IndexedDB has loaded — **no network call is on the critical path**. Closing and reopening (even with the server unreachable) restores your work from IndexedDB.

### 2. Background sync engine

The `WebsocketProvider` connects opportunistically. While offline, edits accumulate in the `Y.Doc` (and IndexedDB). On reconnect, the **sync protocol exchanges state vectors and transfers only the missing updates in both directions** — local work is pushed, remote work is pulled, and neither overwrites the other. `online`/`offline` browser events drive reconnection and the status indicator. See `[useCollaborativeDoc.ts](src/lib/yjs/useCollaborativeDoc.ts)`.

### 3. Deterministic conflict resolution

Pure CRDT semantics. Proven by tests in `[crdt-sync.test.ts](src/lib/yjs/crdt-sync.test.ts)`: concurrent offline edits merge losslessly, merge order doesn't change the result, and duplicate delivery is idempotent.

### 4. Version history & time travel

Snapshots store a **full** `Y.encodeStateAsUpdate` blob (O(1), corruption-proof restore — never a diff chain). **Restore is a merge, not an overwrite**: the previous content is reconstructed to ProseMirror JSON and applied to the *live* `Y.Doc` via `setContent`, generating ordinary CRDT ops that propagate to every active collaborator and become a new history entry — no one's in-flight edits are lost. See `[restore.ts](src/lib/yjs/restore.ts)`.

### 5. AI add-ons

Summarize / improve / continue, operating on the selection or whole document, length-capped and auth-gated, degrading gracefully when no API key is configured. See `[api/ai/route.ts](src/app/api/ai/route.ts)`.

---

## Security


| Threat                                 | Mitigation                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Massive/malformed payload → OOM**    | `ws` `maxPayload` rejects oversized **frames before allocation**; a second logical check rejects oversized decoded buffers; HTTP routes enforce a `Content-Length` + body-size cap before `JSON.parse`; Zod bounds the base64 string length and shape.                                                                                          |
| **Unauthorized realtime writes**       | Every socket must present a short-lived **JWT** (minted only for an authenticated session). The server resolves the user's role per connection and **silently drops document writes from viewers** — viewers physically cannot push state.                                                                                                      |
| **Tenant isolation (no RLS in Mongo)** | All authorization flows through one helper (`[authz.ts](src/lib/authz.ts)`); there is no code path to document data that doesn't first resolve a role. Every query is scoped by `ownerId`/`Permission`. *MongoDB has no row-level security, so isolation is enforced at the ORM/application layer — the documented equivalent of Postgres RLS.* |
| **Credential safety**                  | bcrypt (cost 12), `passwordHash` excluded from queries by default, JWT sessions signed with `AUTH_SECRET`.                                                                                                                                                                                                                                      |
| **Input validation**                   | Zod on every API route and the sync boundary (`[schemas.ts](src/lib/validation/schemas.ts)`).                                                                                                                                                                                                                                                   |


---

## Local development

### Prerequisites

- Node 20+
- A MongoDB instance (local `mongod`, Docker, or a free MongoDB Atlas cluster)

### Setup

```bash
npm install
cp .env.example .env.local      # then fill in the values
```

Minimum `.env.local`:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017/collab-editor"
AUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
WS_PORT="1234"
# OPENAI_API_KEY="sk-..."   # optional, enables AI features
```

### Run (app + sync server together)

```bash
npm run dev:all      # Next.js on :3000  +  WS sync server on :1234
```

Or in two terminals: `npm run dev` and `npm run ws`.

Open [http://localhost:3000](http://localhost:3000), register, create a document. To see real-time collaboration and conflict resolution, open the same document in a second browser/incognito window (share it as Editor first), edit in both, and try toggling your network offline in DevTools.

---

## Testing

```bash
npm test            # Vitest — CRDT merge, validation, authz, tokens, version preview
npm run test:e2e    # Playwright smoke tests (no DB required)
RUN_INTEGRATION=1 npm run test:e2e   # full offline-sync E2E (needs MongoDB)
```

The unit suite deliberately tests the **sync engine itself** (`crdt-sync.test.ts`) at the protocol level — offline-edit/merge, order-independent convergence, idempotent re-delivery — which is where correctness actually matters.

---

## Deployment & CI/CD

**CI** (`[.github/workflows/ci.yml](.github/workflows/ci.yml)`) runs typecheck → tests → build on every push/PR.

**App → Vercel**

1. Import the repo into Vercel (auto-detects Next.js → continuous deployment on push).
2. Set env vars: `MONGODB_URI`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_WS_URL` (the **wss://** URL of the deployed sync server), `OPENAI_API_KEY` (optional).

**Sync server → Railway / Render / Fly.io** (needs a persistent process)

```bash
docker build -f Dockerfile.ws -t collab-ws .
docker run -p 1234:1234 --env-file .env.local collab-ws
```

Set `MONGODB_URI` and `AUTH_SECRET` (must match the app's) on the host. Point the app's `NEXT_PUBLIC_WS_URL` at its public `wss://` URL.

---

---

