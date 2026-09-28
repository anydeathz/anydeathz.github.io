// Small helpers every cast approach shares.
import { toWorld, fromWorld, key, DIRS, SQRT3 } from '../../character-proposals/lib/hex.js';
import { surfaceAt } from './surfaces.js';
import { active, local, cellStart } from './cast.js';
export { key, toWorld };
/** 0 at a hex centre → 1 on its edge (pointy-top), and which neighbour that edge faces. */
export function edgeOf(x, y) {
  const [q, r] = fromWorld(x, y), [cx, cy] = toWorld(q, r); let best = 0, bi = 0;
  DIRS.forEach(([dq, dr], i) => { const [nx, ny] = toWorld(q + dq, r + dr); const d = ((x - cx) * (nx - cx) + (y - cy) * (ny - cy)) / 3 * 2; if (d > best) { best = d; bi = i; } });
  return { e: best, dir: bi, q, r };
}
/** The surface layer a cast leaves, as a ground overlay — used by S1, S2, S4, S5 alike. */
export function surfaceLayer(cast, t) {
  const e = cast.emitters.find(e => e.type === 'surface'); if (!e || t < e.t0) return null;
  const set = new Set(e.cells.map(c => key(...c)));
  const fade = Math.min(1, (t - e.t0) / 0.1);
  return { cells: e.cells, ground: (x, y, k) => {
    if (!set.has(k)) return null; const { e: ed, dir, q, r } = edgeOf(x, y);
    const [dq, dr] = DIRS[dir], outside = !set.has(key(q + dq, r + dr));
    return surfaceAt(e.kind, x, y, t, (outside ? Math.max(0, (1 - ed) * 4) : 1) * fade);
  } };
}
export { active, local, cellStart };
export const alphaHex = (hex, a) => hex.slice(0, 7) + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
