/* ============ Fake QR code (demo) ============
   The e-wallet payment shows a picture that looks like a QR code. It is NOT a real QR code: it
   cannot be scanned and no money moves. The pattern is worked out from a seed (any text), so the
   same seed always gives the same picture, and a new seed gives a new one. */

export const QR_SIZE = 25; // squares per side, like a small real QR code

// A new random seed for each "generate" click
export function makeQrSeed() {
  return "DEMO-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Small seeded random number generator (mulberry32), so a seed always gives the same numbers
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns a grid of true (dark square) / false (light square), `size` x `size`.
// Random squares fill the grid, then the fixed parts of a real QR code are drawn over them:
// three big corner squares, a small square near the bottom right, and the dotted lines between corners.
export function fakeQrMatrix(seed, size = QR_SIZE) {
  const random = seededRandom(String(seed));
  const cells = Array.from({ length: size }, () => Array.from({ length: size }, () => random() < 0.5));
  const set = (r, c, dark) => { if (r >= 0 && r < size && c >= 0 && c < size) cells[r][c] = dark; };

  const finder = (top, left) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3)); // 0 = middle ... 3 = outside edge, 4 = light gap
        set(top + r, left + c, ring === 3 || ring <= 1);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); } // dotted lines

  for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) set(size - 7 + r, size - 7 + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
  return cells;
}
