import { describe, it, expect } from "vitest";
import { registerSchema, syncPushSchema, aiActionSchema, shareSchema } from "./schemas";
import { MAX_SYNC_PAYLOAD_BYTES } from "@/lib/constants";

describe("validation schemas", () => {
  it("accepts a valid registration", () => {
    const r = registerSchema.safeParse({ name: "Ada", email: "ADA@x.com", password: "longenough" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ada@x.com");
  });

  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({ name: "A", email: "a@x.com", password: "short" }).success).toBe(false);
  });

  it("rejects a sync payload over the size ceiling (anti-OOM)", () => {
    const huge = "A".repeat(Math.ceil((MAX_SYNC_PAYLOAD_BYTES * 4) / 3) + 1000);
    expect(syncPushSchema.safeParse({ update: huge }).success).toBe(false);
  });

  it("rejects non-base64 sync payloads", () => {
    expect(syncPushSchema.safeParse({ update: "not valid base64 !!!" }).success).toBe(false);
  });

  it("accepts a valid base64 sync payload", () => {
    expect(syncPushSchema.safeParse({ update: "SGVsbG8=" }).success).toBe(true);
  });

  it("caps AI input length", () => {
    expect(aiActionSchema.safeParse({ action: "summarize", text: "x".repeat(20_001) }).success).toBe(false);
    expect(aiActionSchema.safeParse({ action: "summarize", text: "hello" }).success).toBe(true);
  });

  it("does not allow granting the owner role via sharing", () => {
    expect(shareSchema.safeParse({ email: "a@x.com", role: "owner" }).success).toBe(false);
    expect(shareSchema.safeParse({ email: "a@x.com", role: "viewer" }).success).toBe(true);
  });
});
