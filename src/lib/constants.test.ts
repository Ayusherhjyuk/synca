import { describe, it, expect } from "vitest";
import { canWrite, canManage } from "./constants";

describe("role capabilities", () => {
  it("owner and editor can write; viewer cannot", () => {
    expect(canWrite("owner")).toBe(true);
    expect(canWrite("editor")).toBe(true);
    expect(canWrite("viewer")).toBe(false);
    expect(canWrite(null)).toBe(false);
  });

  it("only the owner can manage sharing/deletion", () => {
    expect(canManage("owner")).toBe(true);
    expect(canManage("editor")).toBe(false);
    expect(canManage("viewer")).toBe(false);
  });
});
