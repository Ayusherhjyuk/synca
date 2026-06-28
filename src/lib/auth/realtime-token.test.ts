import { describe, it, expect, beforeAll } from "vitest";
import { signRealtimeToken, verifyRealtimeToken } from "./realtime-token";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
});

describe("realtime token", () => {
  it("round-trips identity claims", async () => {
    const token = await signRealtimeToken({ sub: "user123", name: "Ada", email: "ada@x.com" });
    const claims = await verifyRealtimeToken(token);
    expect(claims.sub).toBe("user123");
    expect(claims.name).toBe("Ada");
  });

  it("rejects a tampered token", async () => {
    const token = await signRealtimeToken({ sub: "u", name: "n", email: "e" });
    await expect(verifyRealtimeToken(token + "x")).rejects.toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signRealtimeToken({ sub: "u", name: "n", email: "e" });
    process.env.AUTH_SECRET = "a-completely-different-secret-bbbbbbbbbbbb";
    await expect(verifyRealtimeToken(token)).rejects.toThrow();
    process.env.AUTH_SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  });
});
