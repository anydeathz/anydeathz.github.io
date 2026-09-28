// Recipe → geometry, once. Every object approach (O1 pixel, O2 vector, O3 voxel, O4 stacked, O5 3D)
// draws THIS output, so they differ only in how they draw — never in what the thing is.
//
// Space: the icon box, x and y in [-1, 1], y DOWN (screen). z is thickness (a part is `th` thick,
// centred on z = 0) or, for a lathe, the part is a solid of revolution about its vertical axis.
//
// Part kinds
//   lathe  { prof: [[y, r]…] top→bottom, cx }            a bottle, a helm dome, a mushroom stem
//   poly   { pts: [[x, y]…], th }                         a blade, a cuirass, a book cover, a leaf
//   bar    { a: [x, y], b: [x, y], w }                     a haft, a grip, a string, a rolled scroll
//   ell    { c: [x, y], rx, ry, th? }                      a pommel, a gem, a bubble, a seal
//   strokes{ segs: [[x0,y0,x1,y1]…], w }                   ink on a face: a sigil, a rune, a vein
// Common fields: col (hex), glass (see-through shell), emit (glows), pat (material pattern for
// renderers that have one: chain scale studs quilt plate grain rings splint fur), z (depth order hint:
// bigger is nearer the viewer), light ('left' default | 'top').
import { MATERIALS } from '../../character-proposals/lib/data.js';
import { shade, mix } from '../../character-proposals/lib/color.js';
import { hueOf, LISTS } from './palette.js';
import { sigil } from './sigil.js';
import { Rng } from '../../character-proposals/lib/rng.js';

const M = m => MATERIALS[m] ?? m;
const lathe = (prof, col, o = {}) => ({ t: 'lathe', prof, cx: 0, col, ...o });
const poly = (pts, col, o = {}) => ({ t: 'poly', pts, th: 0.12, col, ...o });
const bar = (a, b, w, col, o = {}) => ({ t: 'bar', a, b, w, col, ...o });
const ell = (c, rx, ry, col, o = {}) => ({ t: 'ell', c, rx, ry, col, ...o });
const strokes = (segs, col, o = {}) => ({ t: 'strokes', segs, w: 0.06, col, ...o });

// ── transforms ────────────────────────────────────────────────────────────────────────────────
function mapPt(f) {
  return p => {
    const q = { ...p };
    if (p.pts) q.pts = p.pts.map(f);
    if (p.a) q.a = f(p.a); if (p.b) q.b = f(p.b); if (p.c) q.c = f(p.c);
    if (p.segs) q.segs = p.segs.map(([a, b, c, d]) => [...f([a, b]), ...f([c, d])]);
    return q;
  };
}
/** Rotate a part list (angle in radians, clockwise on screen) — lathes become polys, since only an upright bottle is a lathe. */
export function rotate(parts, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), f = ([x, y]) => [x * c - y * s, x * s + y * c];
  return parts.map(p => { if (p.t === 'lathe') p = latheToPoly(p); const q = mapPt(f)(p); if (p.t === 'ell' && Math.abs(p.rx - p.ry) > 0.01) { q.t = 'poly'; q.pts = ellPts(p).map(f); } return q; });
}
export function scale(parts, k, dx = 0, dy = 0) {
  const f = ([x, y]) => [x * k + dx, y * k + dy];
  return parts.map(p => { const q = mapPt(f)(p); if (q.t === 'lathe') { q.prof = p.prof.map(([y, r]) => [y * k + dy, r * k]); q.cx = p.cx * k + dx; } if (q.rx) { q.rx *= k; q.ry *= k; } if (q.w) q.w *= k; if (q.th) q.th *= k; return q; });
}
export function latheToPoly(p) {
  const R = p.prof.map(([y, r]) => [p.cx + r, y]), L = p.prof.map(([y, r]) => [p.cx - r, y]).reverse();
  return { ...p, t: 'poly', pts: [...R, ...L], th: 2 * Math.max(...p.prof.map(q => q[1])), round: true };
}
export const ellPts = (p, n = 20) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [p.c[0] + Math.cos(a) * p.rx, p.c[1] + Math.sin(a) * p.ry]; });

// ══════════════════════════════════════════════════════════════════════════════════════════════
// WEAPONS & WORN ITEMS — the 54 bases, reading the `vis` character-proposals already drafted.
// Built upright (tip at y = -1), then turned 45° so every weapon lies on the icon's diagonal.
// ══════════════════════════════════════════════════════════════════════════════════════════════
function weapon(v) {
  const P = [], mat = M(v.mat ?? 'steel'), haft = M(v.haft ?? 'wood');
  const L = 1.1 + 0.85 * Math.min(1, (v.len ?? 0.5) / 1.05);          // length along the diagonal
  const top = -L / 2, bot = L / 2;
  if (v.kind === 'blade') {
    const grip = v.twoHanded ? 0.42 : 0.28, gy = bot - grip - 0.1, w = 0.1 + (v.width ?? 0.06) * 2.4, bend = (v.curve ?? 0) * 0.5;
    P.push(bar([0, gy], [0, bot - 0.08], 0.1, M('leather'), { pat: 'grain' }));
    P.push(ell([0, bot - 0.04], 0.08, 0.08, M('brass')));
    const guard = v.guard === 'cross' ? 0.38 : v.guard === 'cup' ? 0.22 : 0.26;
    if (v.guard === 'cup') P.push(ell([0, gy + 0.02], 0.15, 0.1, mat));
    P.push(bar([-guard / 2, gy], [guard / 2, gy], 0.07, M('iron')));
    const tipY = top;
    P.push(poly([[-w / 2, gy - 0.04], [w / 2, gy - 0.04], [w / 2 + bend * 0.4, tipY + 0.3], [bend * 0.6, tipY], [-w / 2 + bend * 0.2, tipY + 0.22]], mat, { th: 0.04, fuller: true, edge: true }));
  } else if (v.kind === 'axe' || v.kind === 'hammer' || v.kind === 'mace' || v.kind === 'flail') {
    P.push(bar([0, top + 0.1], [0, bot], 0.1, haft, { pat: 'grain' }));
    const hy = top + 0.2, h = 0.2 + (v.head ?? 0.12) * 1.6;
    if (v.kind === 'axe') {
      const blade = s => poly([[0.04 * s, hy - 0.12], [(h + 0.1) * s, hy - h * 0.7], [(h + 0.16) * s, hy + h * 0.35], [0.04 * s, hy + 0.14]], mat, { th: 0.05, edge: true });
      P.push(blade(1)); if (v.double) P.push(blade(-1));
      P.push(bar([0, top], [0, hy + 0.16], 0.14, M('iron')));
    } else if (v.kind === 'hammer') {
      P.push(poly([[-h * 0.55, hy - 0.14], [h * 0.75, hy - 0.14], [h * 0.75, hy + 0.14], [-h * 0.55, hy + 0.14]], mat, { th: 0.24 }));
      if (v.spike) P.push(poly([[-h * 0.55, hy - 0.08], [-h - 0.1, hy], [-h * 0.55, hy + 0.08]], mat, { th: 0.08 }));
    } else if (v.kind === 'mace') {
      P.push(ell([0, hy], h * 0.55, h * 0.62, mat, { th: h }));
      for (const a of [-1, 1]) P.push(poly([[a * h * 0.45, hy - 0.08], [a * (h * 0.45 + 0.13), hy], [a * h * 0.45, hy + 0.08]], mat, { th: 0.06 }));
    } else {
      P.length = 0; P.push(bar([0, 0.05], [0, bot], 0.11, haft, { pat: 'grain' }));
      for (let i = 0; i < 4; i++) P.push(ell([0.05 * i, -0.02 - i * 0.12], 0.04, 0.05, M('iron')));
      const bx = 0.26, by = -0.58; P.push(ell([bx, by], 0.2, 0.2, mat, { th: 0.4 }));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.push(poly([[bx + Math.cos(a - 0.35) * 0.18, by + Math.sin(a - 0.35) * 0.18], [bx + Math.cos(a) * 0.32, by + Math.sin(a) * 0.32], [bx + Math.cos(a + 0.35) * 0.18, by + Math.sin(a + 0.35) * 0.18]], mat, { th: 0.05 })); }
    }
  } else if (v.kind === 'polearm') {
    P.push(bar([0, top + 0.25], [0, bot], 0.09, haft, { pat: 'grain' }));
    P.push(poly([[-0.05, top + 0.3], [0, top], [0.05, top + 0.3]], mat, { th: 0.04 }));
    if (v.blade === 'axe') P.push(poly([[0.03, top + 0.3], [0.34, top + 0.18], [0.36, top + 0.62], [0.03, top + 0.52]], mat, { th: 0.04, edge: true }), poly([[-0.03, top + 0.36], [-0.2, top + 0.44], [-0.03, top + 0.5]], mat, { th: 0.04 }));
    else P.push(poly([[-0.06, top + 0.3], [0.1, top + 0.3], [0.14, top + 0.02], [0.02, top - 0.12], [-0.06, top + 0.1]], mat, { th: 0.04, edge: true }));
    P.push(bar([-0.07, top + 0.62], [0.07, top + 0.62], 0.05, M('iron')));
  } else if (v.kind === 'staff') {
    P.push(bar([0, top + 0.15], [0, bot], 0.11, M(v.mat), { pat: 'grain' }));
    if (v.orb) { P.push(poly([[-0.14, top + 0.34], [0, top + 0.14], [0.14, top + 0.34], [0.07, top + 0.4], [-0.07, top + 0.4]], M('darkwood'), { th: 0.1 })); P.push(ell([0, top + 0.12], 0.14, 0.14, '#8ab4e8', { emit: 0.6, th: 0.28 })); }
    else { P.push(bar([0, top + 0.1], [0, top + 0.26], 0.14, M('iron'))); P.push(bar([0, bot - 0.16], [0, bot], 0.14, M('iron'))); }
  } else if (v.kind === 'bow') {
    const n = 10, r = L * 0.52, segs = [];
    for (let i = 0; i < n; i++) { const a0 = -0.9 + i / n * 1.8, a1 = -0.9 + (i + 1) / n * 1.8; segs.push([[Math.cos(a0) * r * 0.42 - r * 0.3, Math.sin(a0) * r], [Math.cos(a1) * r * 0.42 - r * 0.3, Math.sin(a1) * r]]); }
    segs.forEach(([a, b], i) => P.push(bar(a, b, i === 4 || i === 5 ? 0.11 : 0.08, M(v.mat), { pat: 'grain' })));
    P.push(bar(segs[0][0], segs[n - 1][1], 0.025, M('string')));
    P.push(bar([segs[4][1][0] - 0.02, segs[4][1][1] - 0.12], [segs[4][1][0] - 0.02, segs[4][1][1] + 0.12], 0.12, M('leather')));
  } else if (v.kind === 'crossbow') {
    const s = 0.8 + (v.len ?? 0.36);
    P.push(poly([[-0.07, -0.55 * s], [0.07, -0.55 * s], [0.09, 0.6 * s], [-0.09, 0.6 * s]], M(v.mat), { th: 0.12, pat: 'grain' }));
    const n = 8, segs = []; for (let i = 0; i <= n; i++) { const t = -1 + 2 * i / n; segs.push([t * 0.62 * s, -0.42 * s + t * t * 0.18 * s]); }
    for (let i = 0; i < n; i++) P.push(bar(segs[i], segs[i + 1], 0.07, M('iron')));
    P.push(bar(segs[0], [0, -0.1 * s], 0.02, M('string')), bar(segs[n], [0, -0.1 * s], 0.02, M('string')));
    P.push(bar([0, 0.08 * s], [0.12, 0.2 * s], 0.05, M('iron')));
    return scale(rotate(P, Math.PI / 4), 1.12);
  } else if (v.kind === 'sling') {
    P.push(bar([-0.55, -0.62], [0.05, 0.28], 0.035, M('string')), bar([0.55, -0.62], [0.12, 0.28], 0.035, M('string')));
    P.push(ell([0.08, 0.36], 0.26, 0.16, M('leather'), { pat: 'grain', th: 0.1 }), ell([0.08, 0.3], 0.1, 0.09, '#8a8e94'));
    P.push(ell([-0.55, -0.66], 0.06, 0.06, M('leather')));
    return P;
  }
  return scale(rotate(P, Math.PI / 4), 1.3);
}

function worn(b) {
  const v = b.vis, P = [];
  switch (b.slot) {
    case 'body': {
      const mat = v.mat === 'cloth' ? '#6a5a4a' : M(v.mat), pat = v.chain ? 'chain' : v.scales ? 'scale' : v.studs ? 'studs' : v.quilt ? 'quilt' : v.rings ? 'rings' : v.splints ? 'splint' : v.fur ? 'fur' : v.plate ? 'plate' : null;
      const skirt = 0.25 + (v.skirt ?? 0) * 0.55;
      if (v.sleeves) for (const s of [-1, 1]) P.push(poly([[s * 0.44, -0.62], [s * (0.62 + v.sleeves * 0.08), -0.5], [s * (0.72 + v.sleeves * 0.06), -0.1 + v.sleeves * 0.12], [s * 0.5, -0.05 + v.sleeves * 0.1]], v.under ? '#6a5a4a' : mat, { pat, th: 0.2 }));
      P.push(poly([[-0.46, -0.66], [-0.16, -0.72], [0, -0.56], [0.16, -0.72], [0.46, -0.66], [0.42, 0.05], [0.34, 0.25], [0.34 + skirt * 0.2, 0.25 + skirt], [-0.34 - skirt * 0.2, 0.25 + skirt], [-0.34, 0.25], [-0.42, 0.05]], v.plate ? M('steel') : mat, { pat, th: 0.5, z: 1 }));
      if (v.plate) P.push(poly([[-0.4, -0.55], [0.4, -0.55], [0.34, 0.08], [0, 0.2], [-0.34, 0.08]], M('steel'), { pat: 'plate', th: 0.56, z: 2 }));
      if (v.tabard) P.push(poly([[-0.14, -0.5], [0.14, -0.5], [0.16, 0.25 + skirt], [-0.16, 0.25 + skirt]], '#7a2e2e', { th: 0.54, z: 3 }));
      if (v.sash) P.push(bar([-0.4, -0.1], [0.4, 0.12], 0.12, '#8a2e3a', { z: 3 }));
      P.push(bar([-0.36, 0.22], [0.36, 0.22], 0.08, M('leather'), { z: 4 }), ell([0, 0.22], 0.06, 0.05, M('iron'), { z: 5 }));
      if (v.pauldrons) for (const s of [-1, 1]) P.push(ell([s * 0.5, -0.6], 0.22, 0.16, M('steel'), { z: 3, th: 0.4 }));
      return P;
    }
    case 'offHand': {
      const mat = M(v.mat), rim = M(v.rim ?? 'iron');
      if (v.shape === 'round') { P.push(ell([0, 0], 0.72, 0.72, rim, { th: 0.12 }), ell([0, 0], 0.62, 0.62, mat, { th: 0.14, pat: 'plate' }), ell([0, 0], 0.2, 0.2, M('steel'), { th: 0.3 })); }
      else if (v.shape === 'heater') { const h = [[-0.7, -0.78], [0.7, -0.78], [0.66, 0.1], [0, 0.92], [-0.66, 0.1]]; P.push(poly(h, rim, { th: 0.12 }), poly(h.map(([x, y]) => [x * 0.86, y * 0.86 - 0.02]), mat, { th: 0.14, pat: 'grain' })); if (v.emblem) P.push(poly([[-0.12, -0.5], [0.12, -0.5], [0.12, -0.12], [0.4, -0.12], [0.4, 0.1], [0.12, 0.1], [0.12, 0.55], [-0.12, 0.55], [-0.12, 0.1], [-0.4, 0.1], [-0.4, -0.12], [-0.12, -0.12]], '#7a2e2e', { th: 0.16 })); }
      else { const t = [[-0.58, -0.7], [-0.4, -0.9], [0.4, -0.9], [0.58, -0.7], [0.58, 0.9], [-0.58, 0.9]]; P.push(poly(t, rim, { th: 0.12 }), poly(t.map(([x, y]) => [x * 0.84, y * 0.9]), mat, { th: 0.14, pat: 'plate' }), ell([0, -0.1], 0.14, 0.14, rim, { th: 0.24 })); }
      return P;
    }
    case 'head': {
      if (v.kind === 'helm') { P.push(lathe([[-0.72, 0.02], [-0.62, 0.36], [-0.3, 0.58], [0.2, 0.64], [0.42, 0.66]], M('steel'), { pat: 'plate' })); P.push(poly([[-0.66, 0.1], [0.66, 0.1], [0.66, 0.46], [-0.66, 0.46]], shade(M('steel'), -0.25), { z: 1, flat: true, th: 1.2 })); P.push(poly([[-0.06, 0.04], [0.06, 0.04], [0.06, 0.62], [-0.06, 0.62]], M('steel'), { z: 2, th: 1.3 })); P.push(bar([-0.66, 0.44], [0.66, 0.44], 0.08, M('iron'), { z: 3 })); }
      else if (v.kind === 'cap') { P.push(lathe([[-0.5, 0.02], [-0.42, 0.32], [-0.15, 0.55], [0.18, 0.6]], M(v.mat), { pat: 'grain' })); P.push(ell([0, 0.24], 0.8, 0.14, shade(M(v.mat), -0.06), { z: 1, light: 'top', th: 1.2 })); }
      else { P.push(ell([0, 0.1], 0.72, 0.3, M(v.mat), { ring: 0.1, th: 0.08 })); if (v.gem) P.push(poly([[0, -0.3], [0.13, -0.18], [0, -0.04], [-0.13, -0.18]], '#6a8ad0', { z: 2, emit: 0.3, th: 0.1 })); }
      return P;
    }
    case 'hands': {
      const mat = M(v.mat);
      const hand = [[-0.3, 0.7], [-0.36, 0.1], [-0.52, -0.1], [-0.44, -0.2], [-0.28, -0.08], [-0.3, -0.6], [-0.18, -0.66], [-0.1, -0.24], [-0.06, -0.74], [0.06, -0.74], [0.08, -0.24], [0.16, -0.68], [0.28, -0.64], [0.24, -0.2], [0.34, -0.5], [0.44, -0.44], [0.36, 0.1], [0.3, 0.7]];
      if (v.kind === 'bracers') { P.push(poly([[-0.34, -0.5], [0.34, -0.5], [0.4, 0.6], [-0.4, 0.6]], mat, { pat: 'studs', th: 0.5 }), bar([-0.36, -0.3], [0.36, -0.3], 0.07, M('leather'), { z: 1 }), bar([-0.38, 0.35], [0.38, 0.35], 0.07, M('leather'), { z: 1 })); }
      else { P.push(poly(hand, mat, { pat: v.kind === 'gauntlets' ? 'plate' : 'grain', th: 0.3 })); P.push(poly([[-0.34, 0.3], [0.34, 0.3], [0.4, 0.78], [-0.4, 0.78]], v.kind === 'gauntlets' ? M('steel') : shade(mat, -0.06), { z: 1, th: 0.36 })); if (v.kind === 'gauntlets') for (const y of [-0.3, -0.05]) P.push(bar([-0.28, y], [0.32, y], 0.05, shade(M('steel'), -0.2), { z: 2 })); }
      return P;
    }
    case 'feet': {
      const mat = M(v.mat), h = 0.25 + (v.height ?? 0.5) * 0.85;
      P.push(poly([[-0.3, 0.72 - h * 1.3], [0.16, 0.72 - h * 1.3], [0.2, 0.36], [0.72, 0.52], [0.76, 0.78], [-0.34, 0.78]], mat, { pat: v.kind === 'greaves' ? 'plate' : 'grain', th: 0.36 }));
      P.push(poly([[-0.36, 0.7], [0.78, 0.7], [0.78, 0.82], [-0.36, 0.82]], shade(M('leather'), -0.25), { z: 1, th: 0.4 }));
      if (v.kind === 'greaves') P.push(bar([-0.06, 0.72 - h * 1.3 + 0.1], [-0.06, 0.3], 0.1, shade(M('steel'), 0.1), { z: 1 }));
      if (v.kind === 'boots') P.push(bar([-0.32, 0.72 - h * 1.3 + 0.08], [0.18, 0.72 - h * 1.3 + 0.08], 0.1, shade(mat, 0.1), { z: 1 }));
      return P;
    }
    case 'cloak': {
      const col = '#4a3a5a';
      if (v.kind === 'cloak') { P.push(poly([[-0.28, -0.62], [0.28, -0.62], [0.72, 0.86], [0.2, 0.78], [-0.2, 0.86], [-0.72, 0.8]], col, { pat: 'quilt', th: 0.2 })); if (v.hood) P.push(lathe([[-0.9, 0.02], [-0.8, 0.22], [-0.56, 0.3], [-0.42, 0.3]], shade(col, 0.06), { z: 1 })); P.push(ell([0, -0.52], 0.08, 0.08, M('iron'), { z: 2 })); }
      else { P.push(poly([[-0.24, -0.5], [0.24, -0.5], [0.78, 0.15], [0.3, 0.3], [0, 0.2], [-0.3, 0.3], [-0.78, 0.15]], col, { th: 0.2 })); P.push(bar([-0.3, -0.52], [0.3, -0.52], 0.14, shade(col, 0.1), { z: 1, pat: 'fur' })); }
      return P;
    }
    case 'ring': {
      P.push(ell([0, 0.12], 0.56, 0.56, M(v.mat), { ring: 0.16, th: 0.2 }));
      if (v.gem) P.push(ell([0, -0.46], 0.2, 0.18, M('iron'), { z: 1 }), poly([[0, -0.62], [0.15, -0.48], [0, -0.32], [-0.15, -0.48]], '#c43d4d', { z: 2, emit: 0.2, th: 0.2 }));
      return P;
    }
    case 'amulet': {
      const segs = []; for (let i = 0; i < 14; i++) { const a0 = Math.PI + i / 14 * Math.PI, a1 = Math.PI + (i + 1) / 14 * Math.PI; segs.push([Math.cos(a0) * 0.62, Math.sin(a0) * 0.62 - 0.1, Math.cos(a1) * 0.62, Math.sin(a1) * 0.62 - 0.1]); }
      P.push(strokes(segs, M('iron'), { w: 0.05, chain: true }));
      if (v.mat === 'bone') P.push(poly([[-0.1, 0.1], [0.1, 0.1], [0.16, 0.5], [0, 0.86], [-0.16, 0.5]], M('bone'), { z: 1, th: 0.14 }), strokes([[-0.05, 0.3, 0.05, 0.4], [0.05, 0.3, -0.05, 0.4]], shade(M('bone'), -0.4), { z: 2 }));
      else { P.push(ell([0, 0.48], 0.32, 0.36, M(v.mat), { z: 1, th: 0.12 })); P.push(ell([0, 0.48], 0.18, 0.2, v.mat === 'iron' ? '#4a9ab0' : '#c43d4d', { z: 2, emit: 0.25, th: 0.2 })); }
      P.push(bar([0, -0.06], [0, 0.12], 0.08, M('iron')));
      return P;
    }
  }
  return weapon(v);
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// VESSELS — potions, elixirs, throwables. A profile per vessel; liquid is the same profile cut at
// the fill line and drawn inside; the glass is drawn as a rim and a highlight so the liquid shows.
// ══════════════════════════════════════════════════════════════════════════════════════════════
const VESSEL = {
  round:    [[-0.58, 0.13], [-0.34, 0.13], [-0.24, 0.3], [-0.06, 0.52], [0.3, 0.62], [0.6, 0.52], [0.78, 0.3], [0.84, 0.0]],
  flask:    [[-0.6, 0.12], [-0.28, 0.12], [0.46, 0.56], [0.72, 0.62], [0.84, 0.0]],
  vial:     [[-0.7, 0.16], [-0.62, 0.2], [0.62, 0.2], [0.76, 0.14], [0.82, 0.0]],
  tall:     [[-0.74, 0.11], [-0.48, 0.11], [-0.34, 0.28], [0.64, 0.3], [0.78, 0.2], [0.82, 0.0]],
  squat:    [[-0.3, 0.16], [-0.16, 0.16], [-0.04, 0.5], [0.42, 0.66], [0.72, 0.54], [0.82, 0.0]],
  decanter: [[-0.74, 0.1], [-0.46, 0.1], [-0.38, 0.2], [-0.2, 0.2], [0.02, 0.52], [0.36, 0.6], [0.64, 0.46], [0.76, 0.22], [0.84, 0.0]],
  gourd:    [[-0.6, 0.1], [-0.46, 0.1], [-0.32, 0.3], [-0.12, 0.2], [0.12, 0.5], [0.5, 0.56], [0.76, 0.36], [0.84, 0.0]],
  elixir:   [[-0.84, 0.1], [-0.56, 0.1], [-0.42, 0.34], [0.66, 0.4], [0.8, 0.3], [0.86, 0.0]],
  orb:      [[-0.6, 0.1], [-0.42, 0.1], [-0.34, 0.3], [-0.14, 0.52], [0.18, 0.6], [0.5, 0.52], [0.72, 0.3], [0.8, 0.0]],
  grenade:  [[-0.46, 0.13], [-0.3, 0.13], [-0.18, 0.44], [0.2, 0.6], [0.6, 0.5], [0.78, 0.26], [0.84, 0.0]],
};
const inset = (prof, d) => prof.map(([y, r], i) => [i === 0 ? y + d * 2 : i === prof.length - 1 ? y - d : y, Math.max(0, r - d)]);
function cutBelow(prof, y0) {                                 // the part of a profile below y0 (liquid)
  const out = []; for (let i = 0; i < prof.length; i++) {
    const [y, r] = prof[i]; if (y >= y0) { if (i && prof[i - 1][0] < y0) { const [py, pr] = prof[i - 1]; out.push([y0, pr + (r - pr) * (y0 - py) / (y - py)]); } out.push([y, r]); }
  }
  return out;
}
function vessel(v) {
  const P = [], liquid = v.liquid;
  if (v.flask === 'bomb') {
    P.push(ell([0, 0.2], 0.62, 0.62, v.shell, { pat: 'grain', th: 1.24 }), bar([0, -0.46], [0, -0.3], 0.26, shade(v.shell, -0.2), { z: 1 }));
    P.push(bar([0, -0.46], [0.22, -0.78], 0.05, '#d8d2c4', { z: 2 }), ell([0.24, -0.82], 0.06, 0.06, '#ff9a4a', { emit: 1, z: 3 }));
    P.push(strokes([[-0.42, 0.08, 0.42, 0.08]], shade(v.shell, -0.3), { z: 1 }), ell([0, 0.2], 0.2, 0.12, liquid, { z: 1, th: 1.3 }));
    if (v.smoke) for (const [x, y, r] of [[-0.3, -0.72, 0.14], [-0.46, -0.9, 0.1], [-0.2, -0.95, 0.08]]) P.push(ell([x, y], r, r * 0.8, liquid, { alpha: 0.6, z: 4 }));
    return P;
  }
  if (v.flask === 'stone') {
    const rng = new Rng('thunderstone'), pts = Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, r = 0.62 + rng.range(-0.08, 0.08); return [Math.cos(a) * r * 1.05, Math.sin(a) * r * 0.9 + 0.1]; });
    P.push(poly(pts, v.shell, { th: 1.1, pat: 'grain' }));
    P.push(strokes([[-0.2, -0.2, 0, 0.1], [0, 0.1, -0.1, 0.1], [-0.1, 0.1, 0.12, 0.42], [0.18, -0.26, 0.28, -0.02]], liquid, { z: 1, emit: 0.7, w: 0.07 }));
    return P;
  }
  const prof = VESSEL[v.flask];
  const inner = inset(prof, 0.08), y0 = prof[0][0], y1 = prof[prof.length - 1][0];
  const fillY = y1 - (y1 - (y0 + 0.2)) * (v.fill ?? 0.8);
  const liq = cutBelow(inner, fillY);
  // back of the glass (dark, tinted by what is in it), then the liquid, then the front glass
  P.push(lathe(prof, mix(liquid, '#1a1d22', 0.78), { glassBack: true, alpha: 0.9 }));
  if (liq.length > 1) P.push(lathe(liq, liquid, { liquid: true, emit: v.glow ?? 0, milky: v.milky }));
  if (v.bubbles) for (const [x, y, r] of [[-0.12, fillY + 0.2, 0.05], [0.14, fillY + 0.36, 0.04], [-0.02, fillY + 0.5, 0.035]]) if (y < y1 - 0.05) P.push(ell([x, y], r, r, mix(liquid, '#ffffff', 0.55), { z: 1 }));
  P.push(lathe(prof, '#cfe0e6', { glass: true, z: 2 }));
  if (v.flask === 'grenade' || v.metal) for (const y of [y0 + 0.3, fillY + 0.05, y1 - 0.25]) { const r = radiusAt(prof, y); if (r > 0.1) P.push(bar([-r, y], [r, y], 0.07, M('iron'), { z: 3 })); }
  if (v.dark) P.push(lathe(inset(prof, 0.12), '#141018', { z: 1, alpha: 0.55 }));
  // label / tag
  if (v.label) { const y = (fillY + y1) / 2 + 0.05, r = radiusAt(prof, y) * 0.8; P.push(poly([[-r, y - 0.13], [r, y - 0.13], [r, y + 0.13], [-r, y + 0.13]], '#e0d4b8', { z: 3, flat: true, th: 2 * r + 0.02 })); P.push(strokes(v.label === 'holy' ? [[0, y - 0.1, 0, y + 0.1], [-0.07, y - 0.03, 0.07, y - 0.03]] : [[-0.07, y, 0.07, y], [0, y - 0.07, 0, y + 0.07]], v.label === 'holy' ? '#8a7a5a' : '#7a2e2e', { z: 4, w: 0.04 })); }
  if (v.tag) { P.push(bar([prof[1][1], y0 + 0.24], [0.5, y0 + 0.5], 0.03, '#d8d2c4', { z: 4 })); P.push(poly([[0.3, y0 + 0.46], [0.94, y0 + 0.46], [0.94, y0 + 1.06], [0.3, y0 + 1.06]], '#e0d4b8', { z: 5, flat: true, th: 0.02 })); P.push({ t: 'mark', c: [0.62, y0 + 0.76], s: 0.46, mark: v.mark, col: shade(v.liquid, lum(v.liquid) > 0.55 ? -0.45 : -0.1), glyph: v.tag, z: 6 }); }
  // stopper
  const nr = prof[0][1] + 0.03, top = y0;
  if (v.cork === 'cork') P.push(lathe([[top - 0.16, nr * 0.9], [top + 0.06, nr]], '#a07a50', { z: 3, pat: 'grain' }));
  else if (v.cork === 'wax') { P.push(lathe([[top - 0.12, nr], [top + 0.1, nr + 0.02]], '#7a2e2e', { z: 3 })); P.push(poly([[nr - 0.02, top + 0.06], [nr + 0.05, top + 0.08], [nr + 0.02, top + 0.24]], '#7a2e2e', { z: 3 })); }
  else if (v.cork === 'cap') P.push(lathe([[top - 0.12, nr * 0.8], [top - 0.06, nr + 0.04], [top + 0.08, nr + 0.04]], M('iron'), { z: 3, metal: true }));
  else if (v.cork === 'stopper') { P.push(lathe([[top + 0.02, nr], [top - 0.04, nr + 0.02]], '#cfe0e6', { z: 3, glass: true })); P.push(ell([0, top - 0.16], nr + 0.04, 0.14, v.glow ? mix(v.liquid, '#ffffff', 0.3) : '#cfe0e6', { z: 3, glass: !v.glow, emit: v.glow ? 0.4 : 0 })); }
  else if (v.cork === 'rag') { P.push(lathe([[top - 0.06, nr], [top + 0.06, nr]], '#a07a50', { z: 3 })); P.push(poly([[-0.08, top - 0.04], [0.1, top - 0.04], [0.26, top - 0.4], [0.12, top - 0.46]], '#d8ccb0', { z: 4, pat: 'quilt' })); P.push(ell([0.2, top - 0.46], 0.08, 0.08, '#e0622a', { z: 5, emit: 1 })); }
  if ((v.tier ?? 0) >= 3) P.push(bar([-prof[1][1] - 0.04, y0 + 0.2], [prof[1][1] + 0.04, y0 + 0.2], 0.06, M('steel'), { z: 4 }));
  return P;
}
const lum = h => { const n = parseInt(h.slice(1, 7), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };
function radiusAt(prof, y) { for (let i = 1; i < prof.length; i++) { const [ay, ar] = prof[i - 1], [by, br] = prof[i]; if (y >= ay && y <= by) return ar + (br - ar) * (y - ay) / (by - ay || 1); } return 0; }

// ══════════════════════════════════════════════════════════════════════════════════════════════
// SCROLLS, MANUALS, SPELL ICONS — the sigil is the identity; paper and wax say which list.
// ══════════════════════════════════════════════════════════════════════════════════════════════
const onto = (segs, cx, cy, k) => segs.map(([a, b, c, d]) => [cx + a * k, cy + b * k, cx + c * k, cy + d * k]);
function scrollParts(o) {
  const v = o.vis, L = LISTS[v.list] ?? LISTS.none, P = [];
  // ink must read on paper: pale hues (radiant, light, boons) are inked darker, the hue kept
  const hue = hueOf(v.element), ink = lum(hue) > 0.55 ? shade(hue, -0.42) : lum(hue) > 0.4 ? shade(hue, -0.2) : hue;
  const sheet = [[-0.66, -0.52], [0.66, -0.62], [0.72, 0.5], [-0.6, 0.6]];
  P.push(poly(sheet, L.paper, { th: 0.03, pat: 'paper' }));
  P.push(bar([-0.78, -0.52], [0.78, -0.64], 0.2, shade(L.paper, -0.08), { z: 1, round: true }));
  P.push(bar([-0.72, 0.6], [0.84, 0.5], 0.24, shade(L.paper, -0.05), { z: 1, round: true }));
  if (!v.blank) { const sg = sigil(v.sigilId, v.school); P.push(strokes(onto([...sg.frame, ...sg.strokes], 0.02, -0.02, 0.4), ink, { z: 2, w: 0.045, ink: true })); }
  else P.push(strokes([[-0.4, -0.28, 0.4, -0.34], [-0.4, -0.12, 0.3, -0.18], [-0.4, 0.04, 0.42, -0.02], [-0.4, 0.2, 0.1, 0.16]], '#4a3a2a', { z: 2, w: 0.035 }));
  P.push(ell([0.46, 0.46], 0.26, 0.24, L.wax, { z: 3, th: 0.1 }));
  P.push({ t: 'mark', c: [0.46, 0.46], s: 0.36, mark: v.element, col: shade(L.wax, lum(L.wax) > 0.4 ? -0.5 : 0.45), glyph: null, z: 4 });
  P.push(poly([[0.4, 0.58], [0.34, 0.9], [0.44, 0.82], [0.5, 0.92], [0.52, 0.6]], shade(L.wax, -0.1), { z: 2, th: 0.02 }));
  return P;
}
const STAMPS = {   // a manual's cover stamp, from the action's vfx family
  melee: [[-0.3, 0.3, 0.3, -0.3], [-0.3, -0.3, 0.3, 0.3], [-0.36, 0.2, -0.2, 0.36], [0.36, 0.2, 0.2, 0.36]],
  wave: Array.from({ length: 8 }, (_, i) => { const a0 = -2.4 + i / 8 * 1.7, a1 = -2.4 + (i + 1) / 8 * 1.7; return [Math.cos(a0) * 0.36, Math.sin(a0) * 0.36 + 0.14, Math.cos(a1) * 0.36, Math.sin(a1) * 0.36 + 0.14]; }),
  aura: Array.from({ length: 12 }, (_, i) => { const a0 = i / 12 * 6.283, a1 = (i + 1) / 12 * 6.283; return [Math.cos(a0) * 0.32, Math.sin(a0) * 0.32, Math.cos(a1) * 0.32, Math.sin(a1) * 0.32]; }).concat([[0, -0.14, 0, 0.14]]),
  projectile: [[-0.34, 0.34, 0.3, -0.3], [0.3, -0.3, 0.1, -0.3], [0.3, -0.3, 0.3, -0.1], [-0.34, 0.34, -0.2, 0.36], [-0.34, 0.34, -0.36, 0.2]],
  nova: Array.from({ length: 8 }, (_, i) => { const a = i / 8 * 6.283; return [Math.cos(a) * 0.12, Math.sin(a) * 0.12, Math.cos(a) * 0.38, Math.sin(a) * 0.38]; }),
  rain: [[-0.24, -0.3, -0.3, 0.1], [0.02, -0.34, -0.04, 0.2], [0.28, -0.3, 0.22, 0.1]],
  sigil: [[0, -0.36, 0.3, 0.2], [0.3, 0.2, -0.3, 0.2], [-0.3, 0.2, 0, -0.36]],
};
function manualParts(o) {
  const v = o.vis, c = v.leather, P = [];
  P.push(poly([[-0.5, -0.66], [0.62, -0.72], [0.66, 0.66], [-0.46, 0.74]], '#e0d4b8', { th: 0.3, pat: 'pages' }));
  P.push(poly([[-0.62, -0.74], [0.5, -0.8], [0.54, 0.6], [-0.58, 0.68]], c, { z: 1, th: 0.34, pat: 'grain' }));
  P.push(bar([-0.62, -0.74], [-0.58, 0.68], 0.14, shade(c, -0.12), { z: 2 }));
  for (const y of [-0.45, 0.3]) P.push(bar([0.44, y - 0.04], [0.68, y - 0.04], 0.1, M('iron'), { z: 3 }));
  P.push(strokes(onto(STAMPS[v.stamp] ?? STAMPS.melee, 0, -0.06, 1.05), shade(c, -0.32), { z: 2, w: 0.07, deboss: true }));
  return P;
}
const AREA_PICT = {
  sphere: Array.from({ length: 10 }, (_, i) => { const a0 = i / 10 * 6.283, a1 = (i + 1) / 10 * 6.283; return [Math.cos(a0), Math.sin(a0), Math.cos(a1), Math.sin(a1)]; }),
  cone: [[-1, 0, 1, -0.7], [1, -0.7, 1, 0.7], [1, 0.7, -1, 0]],
  line: [[-1, 0.3, 1, 0.3], [-1, -0.3, 1, -0.3], [1, -0.3, 1, 0.3]],
  cube: [[-0.8, -0.8, 0.8, -0.8], [0.8, -0.8, 0.8, 0.8], [0.8, 0.8, -0.8, 0.8], [-0.8, 0.8, -0.8, -0.8]],
  aura: [[0, -1, 0.87, 0.5], [0.87, 0.5, -0.87, 0.5], [-0.87, 0.5, 0, -1], [0, -0.1, 0, 0.1]],
  wall: [[-1, 0.6, 1, 0.6], [-1, 0.2, 1, 0.2], [-0.6, 0.2, -0.6, 0.6], [0.2, 0.2, 0.2, 0.6]],
};
AREA_PICT.cylinder = AREA_PICT.sphere; AREA_PICT.ring = AREA_PICT.sphere;
export function spellIconParts(look) {
  const ink = hueOf(look.element), sg = sigil(look.id, look.school ?? 'none'), P = [];
  P.push(ell([0, 0], 0.94, 0.94, '#1e1b22', { th: 0.12, flat: true }), ell([0, 0], 0.94, 0.94, mix(ink, '#1e1b22', 0.55), { ring: 0.08, z: 1 }));
  P.push(strokes(onto(sg.frame, 0, 0, 0.8), mix(ink, '#1e1b22', 0.35), { z: 2, w: 0.05, emit: 0.2 }));
  P.push(strokes(onto(sg.strokes, 0, 0, 0.9), ink, { z: 3, w: 0.08, emit: 0.6 }));
  for (const d of sg.dots) P.push(ell([d[0] * 0.9, d[1] * 0.9], 0.07, 0.07, ink, { z: 3, emit: 0.6 }));
  P.push(ell([-0.62, 0.62], 0.3, 0.3, mix(ink, '#1e1b22', 0.2), { z: 4, flat: true }), { t: 'mark', c: [-0.62, 0.62], s: 0.36, mark: look.element, col: '#1e1b22', z: 5 });
  const pict = AREA_PICT[look.area?.shape];
  if (pict) { P.push(ell([0.62, 0.62], 0.3, 0.3, '#e8dcc6', { z: 4, flat: true })); P.push(strokes(onto(pict, 0.62, 0.62, 0.17), '#1e1b22', { z: 5, w: 0.05 })); }
  return P;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════
// REAGENTS & SOLVENTS — one small grammar per physical form.
// ══════════════════════════════════════════════════════════════════════════════════════════════
function leaf(x, y, ang, len, w, col, o = {}) { const c = Math.cos(ang), s = Math.sin(ang), f = (a, b) => [x + a * c - b * s, y + a * s + b * c]; return poly([f(0, 0), f(len * 0.4, -w), f(len, 0), f(len * 0.4, w)], col, { th: 0.03, ...o }); }
function reagent(v, id) {
  const c = v.c, P = [], rng = new Rng(`reagent:${id}`);
  switch (v.form) {
    case 'herb': case 'moss': case 'vine': {
      if (v.form === 'moss') { for (let i = 0; i < 14; i++) P.push(ell([rng.range(-0.55, 0.55), rng.range(-0.1, 0.5)], rng.range(0.12, 0.22), rng.range(0.1, 0.18), shade(c, rng.range(-0.08, 0.08)), { z: i })); P.push(ell([0, 0.52], 0.7, 0.16, shade(c, -0.25), { z: -1 })); for (let i = 0; i < 5; i++) P.push(ell([rng.range(-0.4, 0.4), rng.range(-0.1, 0.4)], 0.04, 0.04, mix(c, '#ffffff', 0.6), { z: 20, emit: 0.4 })); break; }
      P.push(bar([-0.46, 0.7], [0.3, -0.7], 0.05, shade(c, -0.2)));
      for (let i = 0; i < 6; i++) { const t = 0.12 + i * 0.14, x = -0.46 + 0.76 * t, y = 0.7 - 1.4 * t, s = i % 2 ? 1 : -1; P.push(leaf(x, y, -Math.PI / 3 + s * 0.9, v.form === 'vine' ? 0.26 : 0.42 - i * 0.03, 0.1, shade(c, (i % 3) * 0.04), { z: 1 })); }
      if (v.form === 'vine') for (let i = 0; i < 3; i++) P.push(ell([-0.3 + i * 0.28, 0.4 - i * 0.5], 0.08, 0.08, '#8a3a4a', { z: 2 }));
      P.push(bar([-0.52, 0.52], [-0.3, 0.6], 0.07, '#a07a50', { z: 3 }));
      break;
    }
    case 'flower': {
      P.push(bar([0.3, 0.8], [0, -0.2], 0.06, '#4f6a3a'), leaf(0.18, 0.4, 0.5, 0.36, 0.1, '#4f6a3a'));
      const n = 6; for (let i = 0; i < n; i++) { const a = i / n * 6.283; P.push(ell([Math.cos(a) * 0.24, -0.34 + Math.sin(a) * 0.2], 0.2, 0.15, shade(c, i % 2 ? 0.05 : -0.03), { z: 1 })); }
      P.push(ell([0, -0.34], 0.12, 0.1, v.berries ? '#1a1418' : '#e8cf5a', { z: 2 }));
      if (v.berries) for (const [x, y] of [[-0.4, 0.3], [-0.28, 0.44], [-0.46, 0.5]]) P.push(ell([x, y], 0.1, 0.1, '#1a1418', { z: 3 }), bar([x, y - 0.08], [0.06, 0.1], 0.02, '#4f6a3a'));
      if (v.glow) for (const a of [0, 2, 4]) P.push(ell([Math.cos(a) * 0.5, -0.34 + Math.sin(a) * 0.4], 0.04, 0.04, mix(c, '#ffffff', 0.6), { z: 4, emit: 0.6 }));
      break;
    }
    case 'fungus': {
      P.push(lathe([[-0.02, 0.14], [0.6, 0.2], [0.72, 0.24]], '#d8ccb0', { pat: 'grain' }));
      if (v.cap === 'egg') { P.push(lathe([[-0.72, 0.02], [-0.6, 0.3], [-0.3, 0.46], [0, 0.44], [0.1, 0.32]], c, { z: 1 })); for (const [x, y] of [[-0.18, -0.4], [0.16, -0.22], [-0.04, -0.12]]) P.push(ell([x, y], 0.07, 0.06, '#f0a33c', { z: 2, emit: 0.5 })); }
      else { P.push(lathe([[-0.42, 0.02], [-0.3, 0.48], [-0.08, 0.66], [0.04, 0.58]], c, { z: 1 })); P.push(ell([-0.5, 0.52], 0.2, 0.14, shade(c, 0.05), { z: 2 })); }
      break;
    }
    case 'feather': {
      P.push(bar([-0.52, 0.76], [0.44, -0.76], 0.04, '#e8e0d0', { z: 2 }));
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, w = Math.sin(t * Math.PI) * 0.28 * (0.6 + t * 0.4); pts.push([-0.4 + 0.84 * t - w * 0.8, 0.56 - 1.32 * t - w * 0.5]); }
      for (let i = 10; i >= 0; i--) { const t = i / 10, w = Math.sin(t * Math.PI) * 0.28 * (0.6 + t * 0.4); pts.push([-0.4 + 0.84 * t + w * 0.8, 0.56 - 1.32 * t + w * 0.5]); }
      P.push(poly(pts, c, { th: 0.02, pat: 'barbs', emit: v.glow ?? 0 }));
      P.push(poly([[0.18, -0.46], [0.46, -0.78], [0.5, -0.5]], v.tip, { z: 1, th: 0.02 }));
      break;
    }
    case 'scale': for (let i = 0; i < 3; i++) { const x = -0.34 + i * 0.3, y = -0.1 + i * 0.22; P.push(poly([[x - 0.34, y - 0.2], [x + 0.34, y - 0.2], [x + 0.26, y + 0.18], [x, y + 0.36], [x - 0.26, y + 0.18]], shade(c, i * 0.04), { z: i, th: 0.06, pat: 'grain' })); } break;
    case 'fang': P.push(poly([[-0.34, -0.7], [0.3, -0.7], [0.26, -0.3], [0.1, 0.4], [-0.06, 0.86], [-0.2, 0.3], [-0.34, -0.3]], c, { th: 0.34 })); P.push(poly([[-0.34, -0.72], [0.3, -0.72], [0.28, -0.46], [-0.32, -0.46]], shade(c, -0.25), { z: 1, th: 0.36 })); break;
    case 'horn': { const n = 10; for (let i = 0; i < n; i++) { const t = i / n, t1 = (i + 1) / n; P.push(bar([-0.56 + t * 1.1, 0.72 - t * 1.46], [-0.56 + t1 * 1.1, 0.72 - t1 * 1.46], 0.32 * (1 - t) + 0.03, shade(c, i % 2 ? -0.06 : 0.04), { z: i })); } break; }
    case 'eye': {
      if (v.stalk) P.push(bar([0.2, 0.9], [0, 0.1], 0.18, shade(c, -0.1), { pat: 'grain' }));
      P.push(ell([0, -0.02], 0.52, 0.52, '#e8e0d8', { z: 1, th: 1 }), ell([0.08, -0.06], 0.3, 0.3, v.iris ?? c, { z: 2, th: 1.06 }), ell([0.12, -0.08], 0.12, 0.14, '#0e0a0c', { z: 3, th: 1.1 }), ell([-0.04, -0.2], 0.06, 0.06, '#ffffff', { z: 4 }));
      P.push(strokes([[-0.4, 0.2, -0.2, 0.1], [-0.44, -0.1, -0.3, -0.06], [0.36, 0.34, 0.2, 0.2]], '#b04040', { z: 2, w: 0.03 }));
      break;
    }
    case 'finger': P.push(bar([-0.5, 0.56], [0.3, -0.4], 0.34, c, { round: true, pat: 'grain' }), ell([0.36, -0.46], 0.14, 0.11, shade(c, 0.15), { z: 1 }), strokes([[-0.1, 0.1, 0.02, 0.2], [0.04, -0.08, 0.16, 0.02]], shade(c, -0.25), { z: 1 }), ell([-0.54, 0.6], 0.2, 0.18, '#8a2a24', { z: 1 })); break;
    case 'slime': { const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283, r = 0.56 + rng.range(-0.1, 0.12); pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.6 + 0.24]); } P.push(poly(pts, c, { th: 0.5, glassy: true })); P.push(ell([-0.2, 0.08], 0.12, 0.06, mix(c, '#ffffff', 0.5), { z: 1 }), ell([0.2, 0.3], 0.06, 0.06, shade(c, -0.2), { z: 1 })); break; }
    case 'gem': case 'lens': case 'crystal': case 'shard': {
      if (v.form === 'lens') { P.push(ell([0, 0], 0.62, 0.62, mix(c, '#1a1d22', 0.2), { th: 0.2, glassy: true }), ell([-0.18, -0.18], 0.18, 0.12, '#ffffff', { z: 1, alpha: 0.7 })); break; }
      const clusters = v.form === 'crystal' ? [[0, 0.1, 0.9, 0], [-0.34, 0.3, 0.6, -0.35], [0.34, 0.34, 0.5, 0.4]] : v.form === 'shard' ? [[0, 0, 1.1, 0.25]] : [[0, 0.1, 0.8, 0]];
      clusters.forEach(([x, y, h, a], i) => { const f = ([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]; const w = v.form === 'gem' ? 0.4 : 0.18; P.push(poly([[-w, h * 0.3], [-w, -h * 0.25], [0, -h * 0.6], [w, -h * 0.25], [w, h * 0.3], [0, h * 0.5]].map(f), shade(c, i * -0.05), { z: i, th: w, facet: true, emit: v.glow ?? 0 })); });
      break;
    }
    case 'gear': { const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, r = i % 3 === 0 ? 0.72 : 0.58; pts.push([Math.cos(a) * r - 0.1, Math.sin(a) * r]); } P.push(poly(pts, c, { th: 0.14, pat: 'plate' }), ell([-0.1, 0], 0.18, 0.18, '#1e1b22', { z: 1 }), bar([0.1, 0.3], [0.8, 0.66], 0.1, M('iron'), { z: 2 }), ell([0.5, 0.52], 0.08, 0.08, '#b04a2a', { z: 3 })); break; }
    case 'bark': P.push(poly([[-0.6, -0.5], [0.4, -0.7], [0.62, 0.46], [-0.42, 0.66]], c, { th: 0.16, pat: 'grain' }), strokes([[-0.4, -0.36, -0.26, 0.5], [-0.06, -0.5, 0.04, 0.52], [0.26, -0.56, 0.36, 0.4]], shade(c, -0.25), { z: 1, w: 0.05 })); break;
    case 'ear': P.push(poly([[-0.1, 0.8], [-0.46, 0.2], [-0.36, -0.62], [0, -0.84], [0.3, -0.5], [0.34, 0.2], [0.14, 0.7]], c, { th: 0.1, pat: 'fur' }), poly([[-0.04, 0.4], [-0.24, 0], [-0.16, -0.5], [0.08, -0.56], [0.14, 0.1]], '#c88a7a', { z: 1 })); break;
    case 'membrane': case 'wing': P.push(poly([[-0.7, -0.5], [0.7, -0.2], [0.44, 0.18], [0.2, 0.06], [0.04, 0.5], [-0.2, 0.2], [-0.5, 0.56]], c, { th: 0.03, alpha: v.form === 'membrane' ? 0.85 : 1 }), strokes([[-0.7, -0.5, 0.44, 0.18], [-0.7, -0.5, 0.04, 0.5], [-0.7, -0.5, -0.5, 0.56]], shade(c, -0.3), { z: 1, w: 0.05 })); break;
    case 'sac': P.push(ell([0, 0.2], 0.52, 0.56, c, { th: 1, glassy: true }), bar([0, -0.36], [0.14, -0.72], 0.14, shade(c, -0.1)), strokes([[-0.24, 0.0, -0.06, 0.4], [0.2, -0.04, 0.3, 0.3]], mix(c, '#8a6aa0', 0.5), { z: 1, w: 0.04 })); break;
    case 'brain': { for (const s of [-1, 1]) P.push(ell([s * 0.3, 0.06], 0.4, 0.5, c, { th: 0.9, pat: 'folds' })); P.push(strokes([[0, -0.44, 0, 0.5], [-0.5, -0.1, -0.2, -0.1], [-0.36, 0.2, -0.1, 0.26], [0.2, -0.1, 0.5, -0.06], [0.1, 0.22, 0.4, 0.3]], shade(c, -0.3), { z: 1, w: 0.04 })); break; }
    case 'bone': P.push(poly([[-0.6, 0.3], [-0.2, -0.3], [0.1, -0.7], [0.5, -0.56], [0.2, -0.1], [0.3, 0.3], [-0.3, 0.66]], c, { th: 0.2, facet: true, emit: v.glow ?? 0 })); break;
    case 'vialS': P.push(...vessel({ flask: 'vial', liquid: c, fill: v.thin ? 0.4 : 0.85, cork: 'cork', milky: !v.thin })); break;
    case 'salt': P.push(ell([0, 0.44], 0.72, 0.26, '#6a5a4a', { th: 0.3 })); P.push(ell([0, 0.2], 0.56, 0.3, c, { z: 1, th: 0.3 })); for (let i = 0; i < 9; i++) P.push(poly(((x, y, s) => [[x, y - s], [x + s, y], [x, y + s * 0.7], [x - s, y]])(rng.range(-0.44, 0.44), rng.range(-0.1, 0.34), rng.range(0.1, 0.17)), shade(c, rng.range(-0.1, 0.08)), { z: 2 + i, th: 0.1, facet: true })); break;
    case 'ash': P.push(poly([[-0.5, -0.1], [0.5, -0.1], [0.66, 0.66], [-0.66, 0.66]], '#8a6a44', { th: 0.6, pat: 'grain' }), bar([-0.52, -0.08], [0.52, -0.08], 0.12, '#6a4a2a', { z: 1 }), lathe([[-0.4, 0.02], [-0.18, 0.4]], c, { z: 2 })); break;
  }
  return P;
}

// ── props: a chest, open or shut — loot's container on the map (today a three.js box in PropViews.ts)
function chest(v) {
  const wood = '#6b4a2e', band = M('iron'), P = [];
  P.push(poly([[-0.8, -0.1], [0.8, -0.1], [0.8, 0.7], [-0.8, 0.7]], wood, { th: 1, pat: 'grain' }));
  for (const x of [-0.5, 0.5]) P.push(bar([x, -0.1], [x, 0.7], 0.12, band, { z: 1 }));
  if (v.open) { P.push(poly([[-0.8, -0.1], [0.8, -0.1], [0.72, -0.72], [-0.72, -0.72]], shade(wood, -0.2), { z: -1, th: 0.1, pat: 'grain' })); P.push(poly([[-0.72, -0.1], [0.72, -0.1], [0.72, 0.06], [-0.72, 0.06]], '#1a1210', { z: 2, flat: true })); if (v.glow) P.push(ell([0, -0.14], 0.5, 0.12, v.glow, { z: 3, emit: 0.8 })); }
  else { P.push(lathe([[-0.52, 0], [-0.1, 0.8]].map(([y, r]) => [y, r]), wood, { pat: 'grain' })); P[P.length - 1] = poly([[-0.8, -0.1], [-0.76, -0.4], [-0.5, -0.56], [0.5, -0.56], [0.76, -0.4], [0.8, -0.1]], shade(wood, 0.06), { z: 1, th: 1, pat: 'grain' }); P.push(ell([0, -0.08], 0.1, 0.12, band, { z: 3 })); }
  return P;
}
// ══════════════════════════════════════════════════════════════════════════════════════════════
/** The one entry point: any object (lib/items.js) → { parts, rarity, glow }. */
export function partsOf(o) {
  let parts;
  if (o.kind === 'item') parts = worn(o);
  else if (o.kind === 'scroll') parts = scrollParts(o);
  else if (o.kind === 'manual') parts = manualParts(o);
  else if (o.kind === 'reagent' || o.kind === 'solvent') parts = reagent(o.vis, o.id);
  else if (o.kind === 'spell') parts = spellIconParts(o.look);
  else if (o.kind === 'chest') parts = chest(o.vis);
  else parts = vessel(o.vis);
  return { parts: parts.map((p, i) => ({ z: 0, ...p, order: i })), rarity: o.rarity ?? 'common' };
}
