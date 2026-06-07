// Domain core — the Sign entity. Pure, no DOM / no Firebase. (ADR-0006)

export type Effect = "scroll" | "blink" | "static" | "rainbow";
export type Direction = "rtl" | "ltr";

export interface SignStyle {
  color: string; // hex
  bgColor: string; // hex
  fontFamily: string; // a FONTS id
  speed: number; // 1..10
  effect: Effect;
  direction: Direction;
  bold: boolean;
  glow: boolean; // neon bloom around the text (the "real LED" look)
}

/** A Sign = the configured visual output (message + style) that scrolls. */
export interface Sign {
  message: string;
  style: SignStyle;
}

export const MAX_MESSAGE_LEN = 200;

export const DEFAULT_STYLE: SignStyle = {
  color: "#00E5FF",
  bgColor: "#000000",
  fontFamily: "Kanit",
  speed: 5,
  effect: "scroll",
  direction: "rtl",
  bold: true,
  glow: true,
};

/** Truncate by Unicode code points so Thai clusters & emoji are never split. */
export function sanitizeMessage(raw: string): string {
  const s = raw ?? "";
  return [...s].slice(0, MAX_MESSAGE_LEN).join("");
}

export function createSign(message: string, style: Partial<SignStyle> = {}): Sign {
  return { message: sanitizeMessage(message), style: { ...DEFAULT_STYLE, ...style } };
}

/** Invariant: a Sign needs at least one character and a speed within range. */
export function isValidSign(sign: Sign): boolean {
  return [...sign.message].length > 0 && sign.style.speed >= 1 && sign.style.speed <= 10;
}
