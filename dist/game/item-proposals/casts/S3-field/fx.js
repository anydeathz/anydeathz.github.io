// S3 — a continuous field. effectAt(cast, x, y, t) is a soft signed-distance field built from the same
// covered cells, plus noise: a fireball is a round, ragged scorch, not a set of hexes. It is sampled per
// pixel in M3 and baked to a texture over the footprint in M1 (casts/ground3d.js). The air parts are
// soft radial glows. The contrast with S2 is the point: S3 looks like fire, S2 says which cells burn.
import { active, local, cellStart, key, toWorld, alphaHex } from '../common.js';
import { DIRS } from '../../../character-proposals/lib/hex.js';
import { valueNoise } from '../../../character-proposals/lib/rng.js';
import { mix } from '../../../character-proposals/lib/color.js';
import { surfaceAt } from '../surfaces.js';

const NZ = valueNoise('field');
const grow = cells => { const m = new Map(cells.map(c => [key(...c), c])); for (const c of cells) for (const [a, b] of DIRS) m.set(key(c[0] + a, c[1] + b), [c[0] + a, c[1] + b]); return [...m.values()]; };
export function fieldAt(cells, x, y, rad = 1.05) {       // 1 deep inside → 0 at the soft edge
  let s = 0; for (const c of cells) { const [cx, cy] = toWorld(...c), d = Math.hypot(x - cx, y - cy); if (d < rad * 1.8) s += Math.max(0, 1 - d / (rad * 1.8)) ** 2; }
  return Math.min(1, s * 1.4);
}
export function fx2d(cast, t) {
  const E = cast.emitters, area = E.filter(e => ['burst', 'sweep', 'fill', 'column', 'zone', 'wall', 'ring', 'telegraph'].includes(e.type)), surf = E.find(e => e.type === 'surface');
  const halo = grow(cast.cells), out = [];
  out.push({ cells: halo, ground: (x, y) => {
    const n = NZ.fbm(x * 1.7 + t * 0.6, y * 1.7, 3); let best = null, ba = 0;
    for (const e of area) {
      const tel = e.type === 'telegraph';
      const t0 = e.type === 'sweep' ? e.t0 : e.t0; if (t < t0 || (!tel && t > e.t1 + 0.35 && !['zone', 'column', 'wall', 'ring'].includes(e.type))) continue;
      if (tel && t > e.t1 + 0.1) continue;
      let f = fieldAt(e.cells ?? cast.cells, x, y);
      if (e.type === 'sweep') { const [ox, oy] = e.origin, d = Math.hypot(x - ox, y - oy) / (e.maxD * Math.sqrt(3)), front = local(e, t) * 1.4; f *= Math.max(0, Math.min(1, (front - d) * 4)) * Math.max(0, 1 - Math.max(0, front - d - 0.4) * 2); }
      if (e.type === 'burst') { const u = local(e, t), [cx, cy] = toWorld(...cast.target), r = Math.hypot(x - cx, y - cy) / ((e.r + 0.6) * Math.sqrt(3)); f *= Math.max(0, Math.min(1, (u * 2.6 - r) * 5)) * (u > 0.55 ? 1 - (u - 0.55) * 1.8 : 1) * 1.4; }
      const v = f * (0.6 + 0.8 * (n - 0.5)) ;
      if (tel) { const band = Math.abs(f - 0.35) < 0.06 ? 0.8 : 0; if (band > ba) { ba = band; best = alphaHex(cast.cols[0], band * (1 - local(e, t) * 0.3)); } continue; }
      if (v < 0.12) continue;
      const a = Math.min(0.85, v), col = v > 0.7 ? cast.cols[3] : v > 0.4 ? cast.cols[0] : mix(cast.cols[1], cast.cols[2], 0.4);
      if (a > ba) { ba = a; best = alphaHex(['zone', 'column', 'wall', 'ring'].includes(e.type) ? cast.cols[1] : col, ['zone', 'column', 'wall', 'ring'].includes(e.type) ? a * 0.32 : a); }
    }
    if (surf && t >= surf.t0) { const f = fieldAt(surf.cells, x, y) * (0.7 + 0.6 * (n - 0.5)); if (f > 0.35) { const s = surfaceAt(surf.kind, x, y, t, Math.min(1, (f - 0.35) * 3)); if (s && (!best || ba < 0.3)) return s; } }
    return best;
  } });
  // air: soft glows for travelling heads and beams
  const air = E.filter(e => (e.type === 'travel' || e.type === 'beam' || e.type === 'flash' || e.type === 'sigil') && active(e, t));
  out.push({ draw(api) {
    for (const e of air) {
      const u = local(e, t), glow = (x, y, z, R, col, a) => { const [X, Y] = api.px(x, y, z); for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) { const d = Math.hypot(i, j) / R; if (d < 1) api.add(X + i, Y + j, col, a * (1 - d) ** 1.6, y); } };
      if (e.type === 'travel') { const [fx0, fy0] = e.from, [tx, ty] = e.to, x = fx0 + (tx - fx0) * u, y = fy0 + (ty - fy0) * u, z = e.z0 + (e.z1 - e.z0) * u + Math.sin(u * Math.PI) * e.arc; glow(x, y, z, 9, cast.cols[0], 0.9); glow(x, y, z, 4, cast.cols[3], 1); }
      else if (e.type === 'beam') { const pts = [e.from, ...(e.chain ?? [e.to])]; for (let s = 0; s + 1 < pts.length; s++) { const [ax, ay] = pts[s], [bx, by] = pts[s + 1], n = 30; for (let i = 0; i <= n; i++) { const q = i / n, j = e.jag ? (NZ(q * 9, t * 20 + s) - 0.5) * e.jag * 2 : 0; glow(ax + (bx - ax) * q + j * 0.3, ay + (by - ay) * q, e.z, 3, cast.cols[0], 0.5 * (1 - Math.max(0, u - 0.8) * 5)); } } }
      else { const [x, y] = e.at; glow(x, y, e.z, 12, cast.cols[0], 0.8 * Math.sin(u * Math.PI)); }
    }
  }, lights: air.filter(e => e.type === 'travel').map(e => { const u = local(e, t); return { x: e.from[0] + (e.to[0] - e.from[0]) * u, y: e.from[1] + (e.to[1] - e.from[1]) * u, z: 1, col: cast.cols[0], r: 3, k: 0.6 }; }) });
  return out;
}
