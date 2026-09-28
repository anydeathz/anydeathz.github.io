// A mark per spell, generated from its id — so Fireball's seal, its spell icon and the circle under
// the caster are the same drawing everywhere, and nobody draws 213 of them.
//
//   sigil(id, school) → { frame: [[x0,y0,x1,y1]…], strokes: [...], dots: [[x,y]…] }  in [-1, 1]²
//
// The FRAME comes from the school (eight shapes, learnable), the STROKES from hash(id) (unique).
import { Rng } from '../../character-proposals/lib/rng.js';

const circle = (r, n = 24, gap = 0) => { const s = []; for (let i = 0; i < n; i++) { if (gap && i % gap === 0) continue; const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; s.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r, Math.sin(b) * r]); } return s; };
const poly = (r, n, rot = -Math.PI / 2) => { const s = []; for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2, b = rot + (i + 1) / n * Math.PI * 2; s.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(b) * r, Math.sin(b) * r]); } return s; };
const FRAMES = {
  abj: () => poly(0.92, 6),                                                   // a ward: the hexagon
  con: () => [...circle(0.92), ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return [Math.cos(a) * 0.92, Math.sin(a) * 0.92, Math.cos(a) * 0.7, Math.sin(a) * 0.7]; })],
  div: () => { const s = []; for (let i = 0; i < 16; i++) { const t0 = i / 16 * Math.PI, t1 = (i + 1) / 16 * Math.PI; for (const sg of [1, -1]) s.push([Math.cos(t0) * 0.95, sg * Math.sin(t0) * 0.55, Math.cos(t1) * 0.95, sg * Math.sin(t1) * 0.55]); } return s; }, // the eye
  enc: () => [...circle(0.92), ...circle(0.78)],
  evo: () => [...poly(0.95, 8, 0).map(([a, b, c, d]) => [a, b, c * 0.6, d * 0.6]), ...circle(0.6, 16)],  // a burst
  ill: () => circle(0.92, 24, 3),                                             // broken circle
  nec: () => { const s = []; for (let i = 0; i < 18; i++) { const a = Math.PI * 0.2 + i / 18 * Math.PI * 1.6, b = Math.PI * 0.2 + (i + 1) / 18 * Math.PI * 1.6; s.push([Math.cos(a) * 0.92, Math.sin(a) * 0.92, Math.cos(b) * 0.92, Math.sin(b) * 0.92]); s.push([Math.cos(a) * 0.62 + 0.25, Math.sin(a) * 0.62, Math.cos(b) * 0.62 + 0.25, Math.sin(b) * 0.62]); } return s.filter(([x, y]) => x < 0.75 || Math.abs(y) > 0.5); }, // crescent
  tra: () => [...poly(0.95, 3), ...poly(0.95, 3, Math.PI / 2)],               // two triangles
  none: () => [],
};

export function sigil(id, school = 'evo') {
  const rng = new Rng(`sigil:${id}`);
  // 6 anchor points on an inner ring + the centre; 3–5 strokes join them. Never the same two twice.
  const pts = [[0, 0], ...Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + i / 6 * Math.PI * 2 + rng.range(-0.2, 0.2); const r = rng.range(0.38, 0.55); return [Math.cos(a) * r, Math.sin(a) * r]; })];
  const n = rng.int(3, 5), used = new Set(), strokes = [];
  let at = rng.int(1, 6);
  for (let i = 0; i < n; i++) {
    let to; let guard = 0; do { to = rng.int(0, 6); guard++; } while ((to === at || used.has(`${Math.min(at, to)}-${Math.max(at, to)}`)) && guard < 20);
    used.add(`${Math.min(at, to)}-${Math.max(at, to)}`); strokes.push([...pts[at], ...pts[to]]); at = to;
  }
  const dots = rng.chance(0.6) ? [pts[rng.int(1, 6)]] : [];
  return { frame: (FRAMES[school] ?? FRAMES.none)(), strokes, dots };
}
