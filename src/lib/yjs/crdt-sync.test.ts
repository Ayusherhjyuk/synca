import { describe, it, expect } from "vitest";
import * as Y from "yjs";

function sync(a: Y.Doc, b: Y.Doc) {
  const aToB = Y.encodeStateAsUpdate(a, Y.encodeStateVector(b));
  const bToA = Y.encodeStateAsUpdate(b, Y.encodeStateVector(a));
  Y.applyUpdate(b, aToB);
  Y.applyUpdate(a, bToA);
}

const text = (doc: Y.Doc) => doc.getText("t").toString();

describe("CRDT offline sync", () => {
  it("merges concurrent offline edits from two clients without data loss", () => {
    const server = new Y.Doc();
    server.getText("t").insert(0, "Hello world");

    const alice = new Y.Doc();
    const bob = new Y.Doc();
    sync(alice, server);
    sync(bob, server);
    expect(text(alice)).toBe("Hello world");
    expect(text(bob)).toBe("Hello world");

    alice.getText("t").insert(0, "Alice: ");
    bob.getText("t").insert(11, "!");

    sync(alice, server);
    sync(bob, server);
    sync(alice, server);

    expect(text(server)).toContain("Alice: ");
    expect(text(server)).toContain("Hello world!");
    expect(text(alice)).toBe(text(server));
    expect(text(bob)).toBe(text(server));
  });

  it("is deterministic regardless of merge order (convergence)", () => {
    const base = new Y.Doc();
    base.getText("t").insert(0, "X");
    const seed = Y.encodeStateAsUpdate(base);

    const d1 = new Y.Doc();
    const d2 = new Y.Doc();
    Y.applyUpdate(d1, seed);
    Y.applyUpdate(d2, seed);

    d1.getText("t").insert(1, "AAA");
    d2.getText("t").insert(1, "BBB");

    const u1 = Y.encodeStateAsUpdate(d1);
    const u2 = Y.encodeStateAsUpdate(d2);

    const order1 = new Y.Doc();
    Y.applyUpdate(order1, u1);
    Y.applyUpdate(order1, u2);

    const order2 = new Y.Doc();
    Y.applyUpdate(order2, u2);
    Y.applyUpdate(order2, u1);

    expect(text(order1)).toBe(text(order2));
  });

  it("does not lose a client's offline work when the server has also advanced", () => {
    const server = new Y.Doc();
    server.getText("t").insert(0, "doc");

    const client = new Y.Doc();
    sync(client, server);

    client.getText("t").insert(3, " [client-offline]");

    server.getText("t").insert(0, "[remote] ");

    sync(client, server);
    sync(client, server);

    expect(text(server)).toContain("[client-offline]");
    expect(text(server)).toContain("[remote]");
    expect(text(client)).toBe(text(server));
  });

  it("re-applying the same update is idempotent (safe duplicate delivery)", () => {
    const a = new Y.Doc();
    a.getText("t").insert(0, "data");
    const u = Y.encodeStateAsUpdate(a);

    const b = new Y.Doc();
    Y.applyUpdate(b, u);
    Y.applyUpdate(b, u);
    expect(text(b)).toBe("data");
  });
});
