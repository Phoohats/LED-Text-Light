// The 10 display fonts. Each stack falls back to OS color-emoji so typing an
// emoji always renders in color (a key win of DOM rendering — see ADR-0002).
export interface FontDef {
  id: string;
  label: string;
  stack: string;
}

const EMOJI = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"`;

function f(id: string, label: string): FontDef {
  return { id, label, stack: `"${id}", ${EMOJI}, sans-serif` };
}

export const FONTS: FontDef[] = [
  f("Kanit", "Kanit · คานิต"),
  f("Mitr", "Mitr · มิตร"),
  f("Prompt", "Prompt · พร้อมต์"),
  f("Sarabun", "Sarabun · สารบรรณ"),
  f("Bai Jamjuree", "Bai Jamjuree · ใบจามจุรี"),
  f("Chakra Petch", "Chakra Petch · จักรเพชร"),
  f("Sriracha", "Sriracha · ศรีราชา"),
  f("Pridi", "Pridi · ปรีดี"),
  f("Charm", "Charm · ชาร์ม"),
  f("Mali", "Mali · มะลิ"),
  f("Athiti", "Athiti · อธิติ"),
  f("K2D", "K2D · เคทูดี"),
  f("Krub", "Krub · ครับ"),
  f("Maitree", "Maitree · ไมตรี"),
  f("Niramit", "Niramit · นิรมิต"),
  f("Taviraj", "Taviraj · ทวิราช"),
];

export function fontStack(id: string): string {
  return FONTS.find((x) => x.id === id)?.stack ?? FONTS[0].stack;
}
