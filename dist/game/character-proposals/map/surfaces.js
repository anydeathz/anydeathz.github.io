// Floors and walls as *functions of world position*, not as tiles.
//
//   floorAt(biome, x, y) → hex colour     (x, y in world units; a hex is 1 from centre to corner)
//   wallAt(biome, u, v, h) → hex colour   (u along the wall run, v up from the floor, h its height)
//
// Because they are sampled in world space, flagstones run across hex borders and no two hexes are
// ever identical — which is exactly what the current tileable-texture floors cannot do. The 2D
// renderer samples them per pixel; the 3D renderers bake them into a texture once per floor.
import { hashString, valueNoise } from '../lib/rng.js';
import { shade, mix } from '../lib/color.js';

const cache = new Map();
function ctx(biome) {
  if (cache.has(biome.id)) return cache.get(biome.id);
  const c = {
    n: valueNoise(`floor:${biome.id}`),
    n2: valueNoise(`floor2:${biome.id}`),
    stones: biome.floor.slice(0, 3).map(col => col),
    grout: shade(biome.floor[3], -0.06),
    bevel: biome.floor.map(col => shade(col, 0.07)),
    wall: biome.wall,
    mortar: shade(biome.wall[2], -0.12),
  };
  cache.set(biome.id, c); return c;
}
const h01 = (...p) => (hashString(p.join(':')) & 0xffffff) / 0xffffff;

/** Nearest two jittered lattice points — the Voronoi that makes flagstones. */
function voronoi(x, y, cell, seed) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
  let d1 = 9, d2 = 9, id = '', fx = 0, fy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = gx + i, cy = gy + j;
    const px = (cx + 0.15 + 0.7 * h01(seed, cx, cy, 'x')) * cell, py = (cy + 0.15 + 0.7 * h01(seed, cx, cy, 'y')) * cell;
    const d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; id = `${cx},${cy}`; fx = px; fy = py; } else if (d < d2) d2 = d;
  }
  return { d1, d2, id, fx, fy, edge: d2 - d1 };
}

export function floorAt(biome, x, y, groutW = 0.035) {
  const c = ctx(biome);
  const big = c.n.fbm(x * 0.35, y * 0.35, 3);
  const v = voronoi(x, y, biome.id === 'sableCourt' ? 0.55 : 0.42, biome.id);
  const k = h01(biome.id, v.id);
  // grout
  if (v.edge < groutW) {
    let g = c.grout;
    if (biome.decal === 'embers' && c.n2(x * 2, y * 2) > 0.58) g = mix('#e0622a', '#ffb347', c.n2(x * 9, y * 9)); // lava in the joints
    if (biome.decal === 'moss' && big > 0.52) g = mix(g, biome.accent, 0.55);
    return g;
  }
  let col = c.stones[Math.floor(k * 3)];
  // a few stones are sunk or lifted: whole-stone tint
  col = shade(col, (h01('lift', biome.id, v.id) - 0.5) * 0.08 + (big - 0.5) * 0.08);
  // bevel: stone edge facing the light (upper-left) catches it, the far edge falls in shadow
  if (v.edge < groutW + 0.04) {
    const lx = x - v.fx, ly = y - v.fy;
    col = shade(col, lx + ly < 0 ? 0.07 : -0.07);
  }
  // surface grit
  const grit = c.n2(x * 14, y * 14);
  if (grit > 0.72) col = shade(col, 0.035); else if (grit < 0.25) col = shade(col, -0.035);
  // cracks: a quarter of stones carry one crack through their centre
  if (k > 0.75) {
    const a = h01('crack', v.id) * Math.PI, dx = Math.cos(a), dy = Math.sin(a);
    const px = x - v.fx, py = y - v.fy, along = px * dx + py * dy, off = Math.abs(-px * dy + py * dx + Math.sin(along * 18) * 0.012);
    if (off < 0.012 && Math.abs(along) < 0.16) col = shade(col, -0.16);
  }
  return decal(biome, c, x, y, v, k, big, col);
}

function decal(biome, c, x, y, v, k, big, col) {
  const d = biome.decal;
  if (d === 'moss' && big > 0.56) { const m = c.n2(x * 5, y * 5); if (m > 0.45) return mix(col, biome.accent, 0.35 + 0.3 * (m - 0.45)); }
  if (d === 'puddles') { const w = c.n.fbm(x * 0.6 + 7, y * 0.6, 3); if (w > 0.6) { if (w < 0.612) return shade(biome.floor[2], 0.08); const glint = c.n2(x * 7, y * 7) > 0.83; return glint ? mix(biome.accent, '#1a4c5a', 0.4) : mix(shade(biome.floor[3], -0.04), '#1a4c5a', 0.45); } }
  if (d === 'frost') { const f = c.n2(x * 3, y * 3); if (v.edge < 0.1 && f > 0.4) return mix(col, biome.accent, 0.45); if (f > 0.78) return mix(col, '#ffffff', 0.2); }
  if (d === 'embers' && k < 0.08) return mix(col, '#1c120d', 0.5); // scorched stones
  if (d === 'inlay') {
    // brass rule-lines laid in a larger hex lattice across the floor
    const s = 3.2, gx = x / s, gy = y / s; const fu = Math.abs(((gx + gy * 0.577) % 1 + 1) % 1 - 0.5), fv = Math.abs(((gy * 1.155) % 1 + 1) % 1 - 0.5);
    if (Math.min(fu, fv) < 0.012) return mix(shade(biome.accent, -0.25), col, 0.6); // muted: gold means Legendary
  }
  if (d === 'bones' || d === 'mushrooms' || d === 'roots') {
    // scatter: at most one object per 0.6-unit cell
    const cell = 0.6, gx = Math.floor(x / cell), gy = Math.floor(y / cell), p = h01(d, gx, gy);
    const chance = d === 'roots' ? 0.3 : 0.16;
    if (p < chance) {
      const ox = (gx + 0.2 + 0.6 * h01(d, gx, gy, 'x')) * cell, oy = (gy + 0.2 + 0.6 * h01(d, gx, gy, 'y')) * cell;
      const dx = x - ox, dy = y - oy;
      if (d === 'bones') {
        const a = h01(d, gx, gy, 'a') * Math.PI, ux = Math.cos(a), uy = Math.sin(a), t = Math.max(-0.12, Math.min(0.12, dx * ux + dy * uy));
        const dd = Math.hypot(dx - ux * t, dy - uy * t); const knob = Math.abs(Math.abs(t) - 0.12) < 0.001 ? 0.035 : 0.022;
        if (dd < knob + (Math.abs(t) > 0.1 ? 0.012 : 0)) return dd < knob * 0.6 ? '#e6dcc4' : '#b8ac92';
        if (Math.hypot(dx + 0.02, dy + 0.02 - 0.03) < 0.05 && p < 0.05) return '#ddd3bc'; // the odd skull
      } else if (d === 'mushrooms') {
        // a cluster: one large cap, two small ones, each with a pale stem and a lit rim
        for (const [ox2, oy2, rad] of [[0, 0, 0.17], [0.2, 0.08, 0.1], [-0.16, 0.1, 0.08]]) {
          const ddx = dx - ox2, ddy = dy - oy2, r = Math.hypot(ddx, ddy * 1.6);
          if (Math.abs(ddx) < rad * 0.3 && ddy > 0 && ddy < rad * 0.9) return '#d8ccb0';
          if (r < rad) return ddy < -rad * 0.2 ? shade(biome.accent, 0.12) : r > rad * 0.8 ? shade(biome.accent, -0.2) : biome.accent;
        }
      } else {
        const rr = Math.abs(dy + Math.sin(dx * 9 + p * 40) * 0.05);
        if (rr < 0.018 && Math.abs(dx) < 0.3) return mix('#1a2216', col, 0.3);
      }
    }
  }
  return col;
}

/** Masonry: coursed stone with offset joints, a capstone course at the top, biome weathering. */
export function wallAt(biome, u, v, h, seed = 0) {
  const c = ctx(biome);
  if (v > h - 0.09) {
    // the cap — one long course of dressed stone, lit from above
    const slab = Math.floor(u / 0.5 + seed * 0.37);
    if (Math.abs(((u / 0.5 + seed * 0.37) % 1 + 1) % 1) < 0.05) return c.mortar;
    return shade(c.wall[1], 0.0 + (h01('cap', biome.id, slab) - 0.5) * 0.05);
  }
  const courseH = 0.2, row = Math.floor(v / courseH), fv = v / courseH - row;
  const len = 0.42 + 0.12 * h01('len', biome.id, row % 3);
  const off = row % 2 ? len * 0.5 : 0;
  const bu = (u + off + seed * 0.61) / len, bi = Math.floor(bu), fu = bu - bi;
  if (fv < 0.14 || fu < 0.05) return c.mortar;
  const k = h01('brick', biome.id, seed, row, bi);
  let col = c.wall[k < 0.45 ? 0 : k < 0.85 ? 1 : 2];
  if (fv > 0.78) col = shade(col, 0.07); else if (fv < 0.3) col = shade(col, -0.05); // upper arris catches light
  if (fu < 0.14) col = shade(col, 0.04);
  if (k > 0.93) col = shade(col, -0.12); // a darker replacement stone
  // weathering by biome
  const n = c.n.fbm(u * 3 + seed, v * 3, 3);
  if (biome.decal === 'moss' && v < 0.35 && n > 0.5) col = mix(col, biome.accent, 0.4);
  if (biome.decal === 'puddles' && v < 0.22 + n * 0.1) col = mix(col, '#16292b', 0.35); // tide line
  if (biome.decal === 'frost' && n > 0.55) col = mix(col, biome.accent, 0.3);
  if (biome.decal === 'embers' && v < 0.12 && n > 0.55) col = mix(col, '#1c120d', 0.5);
  if (biome.decal === 'roots' && Math.abs(Math.sin(u * 5 + seed) * 0.3 + 0.4 - v) < 0.02) col = '#2a3a1e';
  return col;
}
