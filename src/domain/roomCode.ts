// Room codes for joining a Show. Pure & testable. Uses an unambiguous alphabet
// (no 0/O/1/I) so codes are easy to read aloud / type in a noisy venue.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(len = 4, rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return out;
}

/** Clean user/scanned input into a canonical code (uppercase, alphabet only). */
export function normalizeRoomCode(raw: string): string {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
