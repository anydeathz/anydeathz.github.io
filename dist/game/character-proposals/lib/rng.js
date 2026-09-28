// Ported verbatim (minus types) from frontend/src/core/rng — so a proposal seeded with the
// same string draws the same numbers the game would.
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
  return h >>> 0;
}
export const hash = (...parts) => hashString(parts.join(''));

export class Rng {
  constructor(seed = 1) { this.seed = typeof seed === 'string' ? hashString(seed) : seed >>> 0; this.state = this.seed; }
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
}

/** Deterministic 2D value noise + fbm, for textures. */
export function valueNoise(seed) {
  const h = (x, y) => (hashString(`${seed}:${x}:${y}`) & 0xffff) / 0xffff;
  const s = t => t * t * (3 - 2 * t);
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const u = s(xf), v = s(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  n.fbm = (x, y, oct = 4) => { let f = 0, amp = 0.5, fr = 1; for (let i = 0; i < oct; i++) { f += amp * n(x * fr, y * fr); amp *= 0.5; fr *= 2; } return f / (1 - Math.pow(0.5, oct)); };
  return n;
}
