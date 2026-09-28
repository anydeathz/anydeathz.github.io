// S1 — pixel particles. particlesAt(cast, t) (casts/cast.js) drawn as single pixels and tiny pixel
// shapes, one small shape per element (an ember, a shard, a spark cross, a drip…), additively, after
// lighting, depth-tested against walls. Deterministic — a frame is a function of t — so a sheet can be
// baked once per (spell, size) and cached, or drawn live; both are measured.
import { particlesAt } from '../cast.js';
import { surfaceLayer, toWorld } from '../common.js';
import { S2telegraphOnly } from './telegraph.js';

const SHAPES = {
  ember: [[0, 0, 1], [0, 1, 0.5]], shard: [[0, 0, 1], [1, -1, 0.8], [-1, 1, 0.5]], spark: [[0, 0, 1], [1, 0, 0.6], [-1, 0, 0.6], [0, 1, 0.6], [0, -1, 0.6]],
  drip: [[0, 0, 1], [0, 1, 0.8], [0, 2, 0.4]], puff: [[0, 0, 0.7], [1, 0, 0.5], [-1, 0, 0.5], [0, 1, 0.5], [0, -1, 0.5], [1, 1, 0.25], [-1, -1, 0.25], [1, -1, 0.25], [-1, 1, 0.25]],
  ring: [[1, 0, 0.8], [-1, 0, 0.8], [0, 1, 0.8], [0, -1, 0.8]], glyph: [[0, 0, 1], [1, 1, 0.7], [-1, -1, 0.7], [1, -1, 0.7], [-1, 1, 0.7]],
  wisp: [[0, 0, 0.9], [1, -1, 0.5], [2, -1, 0.25]], mote: [[0, 0, 1], [1, 0, 0.3], [-1, 0, 0.3], [0, 1, 0.3], [0, -1, 0.3]],
  streak: [[0, 0, 1], [-1, 0, 0.7], [-2, 0, 0.4], [-3, 0, 0.2]], cross: [[0, 0, 1], [1, 0, 0.8], [-1, 0, 0.8], [0, 1, 0.8], [0, -1, 0.8]], beam: [[0, 0, 1], [0, 1, 0.6], [0, -1, 0.6]],
};
export function fx2d(cast, t) {
  const ps = particlesAt(cast, t), out = [S2telegraphOnly(cast, t)];
  const s = surfaceLayer(cast, t); if (s) out.push(s);
  const heads = ps.filter(p => p.k === 'head' || p.k === 'flash');
  out.push({ draw(api) {
    for (const p of ps) {
      const [X, Y] = api.px(p.x, p.y, p.z);
      if (p.k === 'flash') { const R = Math.round(p.s / 2); for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const d = Math.hypot(i, j * 1.4) / R; if (d <= 1 && ((i + j) & 1 || d < 0.6)) api.add(X + i, Y + j, p.c, p.a * (1 - d) * 0.8, p.y); } continue; }
      if (p.k === 'head') { const R = p.s / 2 + 1; for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const d = Math.hypot(i, j) / R; if (d <= 1) api.add(X + i, Y + j, p.c, p.a * (1 - d * d), p.y); } continue; }
      for (const [dx, dy, a] of SHAPES[p.k] ?? SHAPES.mote) api.add(X + dx, Y + dy, p.c, p.a * a * 0.9, p.y);
    }
  }, lights: heads.map(h => ({ x: h.x, y: h.y, z: h.z, col: h.c, r: h.k === 'flash' ? 2 + h.s / 24 : 2.6, k: (h.k === 'flash' ? 0.9 : 0.5) * h.a })) });
  return out;
}
export { particlesAt };
