import { describe, it, expect } from "vitest";
import { createSign, sanitizeMessage, isValidSign, MAX_MESSAGE_LEN } from "../src/domain/sign";

describe("sign", () => {
  it("applies defaults", () => {
    const s = createSign("ฮัลโหล");
    expect(s.style.fontFamily).toBe("Kanit");
    expect(s.style.effect).toBe("scroll");
    expect(s.style.direction).toBe("rtl");
  });

  it("truncates by code points and never splits an emoji", () => {
    const long = "😀".repeat(MAX_MESSAGE_LEN + 50);
    const out = sanitizeMessage(long);
    expect([...out].length).toBe(MAX_MESSAGE_LEN);
    expect(out.endsWith("😀")).toBe(true); // no broken surrogate pair
  });

  it("preserves Thai + emoji content", () => {
    const s = createSign("รักนะ 💙");
    expect(s.message).toBe("รักนะ 💙");
  });

  it("validates non-empty message", () => {
    expect(isValidSign(createSign(""))).toBe(false);
    expect(isValidSign(createSign("ก"))).toBe(true);
  });
});
