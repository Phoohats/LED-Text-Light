import { describe, it, expect } from "vitest";
import { generateRoomCode, normalizeRoomCode } from "../src/domain/roomCode";

describe("roomCode", () => {
  it("generates a code of the requested length", () => {
    expect(generateRoomCode(4, () => 0)).toHaveLength(4);
    expect(generateRoomCode(6, () => 0)).toHaveLength(6);
  });

  it("uses only the unambiguous alphabet (no 0/O/1/I)", () => {
    const code = generateRoomCode(50, Math.random);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it("normalizes scanned/typed input", () => {
    expect(normalizeRoomCode(" ab-2c ")).toBe("AB2C");
    expect(normalizeRoomCode("a!b@c#1234567")).toBe("ABC123"); // strips junk, caps at 6
  });
});
