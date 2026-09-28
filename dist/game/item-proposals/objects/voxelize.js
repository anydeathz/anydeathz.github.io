// Parts → a voxel volume. Shared by O3 (meshed and lit) and O4 (sliced and stacked). The volume is a
// Map 'x,y,z' → colour, y UP, z toward the viewer, N voxels across the icon box.
import { partsOf, latheToPoly } from '../lib/parts.js';
import { MARKS } from '../lib/marks.js';
import { shade } from '../../character-proposals/lib/color.js';

function inPoly(pts, x, y) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const segDist = (px, py, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
function rAt(prof, y) { for (let i = 1; i < prof.length; i++) { const [ay, ar] = prof[i - 1], [by, br] = prof[i]; if (y >= ay && y <= by) return ar + (br - ar) * (y - ay) / (by - ay || 1); } return -1; }

export function voxelize(o, N = 28) {
  const t0 = performance.now();
  const { parts, rarity } = partsOf(o);
  const v = new Map(), glass = new Map(), glow = new Set(), s = 2 / N, H = N / 2;
  const at = (i, j, k) => `${i},${j},${k}`;
  const W = i => -1 + (i + 0.5) * s;                       // voxel index → box coordinate
  const order = [...parts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.order - b.order);
  const decals = [];
  for (const p of order) {
    if (p.t === 'strokes' || p.t === 'mark') { decals.push(p); continue; }
    const test = shapeTest(p);
    if (!test) continue;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = W(i), y = W(j);
      const zr = test(x, y); if (zr < 0) continue;
      const kz = Math.max(0, Math.round(zr / s - 0.01));
      for (let k = -kz; k <= kz; k++) {
        const key = at(i, N - 1 - j, k);
        if (p.glass) { if (!v.has(key) && Math.abs(k) >= kz - 0) glass.set(key, p.col); continue; }
        if (p.glassBack) continue;
        v.set(key, p.alpha && p.alpha < 1 ? shade(p.col, 0.05) : p.col); glass.delete(key);
        if (p.emit) glow.add(key);
      }
    }
  }
  // decals: ink the front-most voxel under each stroke / mark pixel
  const front = new Map(); for (const k of v.keys()) { const [i, j, z] = k.split(',').map(Number); const f = `${i},${j}`; if (!front.has(f) || front.get(f) < z) front.set(f, z); }
  const ink = (i, jj, col) => { const f = `${i},${jj}`; if (front.has(f)) v.set(at(i, jj, front.get(f)), col); };
  for (const p of decals) {
    if (p.t === 'strokes') for (const [a, b, c, d] of p.segs) { const n = Math.ceil(Math.hypot(c - a, d - b) / s * 2) + 1; for (let t = 0; t <= n; t++) { const x = a + (c - a) * t / n, y = b + (d - b) * t / n; ink(Math.floor((x + 1) / s), N - 1 - Math.floor((y + 1) / s), p.col); } }
    else { const bm = MARKS[p.mark] ?? MARKS.utility, i0 = Math.round((p.c[0] + 1) / s) - 2, j0 = Math.round((p.c[1] + 1) / s) - 2; for (let b = 0; b < 5; b++) for (let a = 0; a < 5; a++) if (bm[b][a] === '#') ink(i0 + a, N - 1 - (j0 + b), p.col); }
  }
  return { v, glass, glow, N, rarity, ms: performance.now() - t0 };
}

function shapeTest(p0) {
  const p = p0;
  if (p.t === 'lathe') return (x, y) => { const r = rAt(p.prof, y); if (r < 0) return -1; const dx = Math.abs(x - p.cx); return dx <= r ? Math.sqrt(r * r - dx * dx) : -1; };
  if (p.t === 'poly') { const th = (p.th ?? 0.12) / 2; return (x, y) => (inPoly(p.pts, x, y) ? th : -1); }
  if (p.t === 'bar') return (x, y) => { const d = segDist(x, y, p.a, p.b), r = Math.max(0.035, p.w / 2); return d <= r ? Math.sqrt(r * r - d * d) : -1; };
  if (p.t === 'ell') return (x, y) => {
    const dx = (x - p.c[0]) / Math.max(0.03, p.rx), dy = (y - p.c[1]) / Math.max(0.03, p.ry), d = dx * dx + dy * dy;
    if (d > 1) return -1;
    if (p.ring) { const inner = Math.max(0.01, 1 - p.ring / Math.min(p.rx, p.ry)); return Math.sqrt(d) >= inner ? p.ring / 2 : -1; }
    const rz = p.th ? p.th / 2 : Math.min(p.rx, p.ry); return rz * Math.sqrt(1 - d);
  };
  return null;
}
