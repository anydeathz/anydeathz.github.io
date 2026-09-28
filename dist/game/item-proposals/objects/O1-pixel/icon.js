// O1 — pixel icon grammar. The character paper-doll's engine (character-proposals/lib/pixel.js), fed
// the shared geometry from lib/parts.js: every part becomes a mask, is painted with a hue-shifted ramp
// shaded from its own silhouette, and the whole icon gets a selective outline. Glass is drawn as a rim
// and a highlight so the liquid shows through it. Rarity recolours the outline and, from Very Rare
// up, adds a halo — the same rule the characters follow. Only Legendary is gold.
//
//   renderO1(object, { size = 32 }) → Sprite     (any size: the parts are vector, the output is pixels)
import { Mask, Sprite, withAlpha } from '../../../character-proposals/lib/pixel.js';
import { shade, mix, ramp } from '../../../character-proposals/lib/color.js';
import { partsOf, latheToPoly, ellPts } from '../../lib/parts.js';
import { RARITY_LOOK } from '../../lib/palette.js';
import { MARKS } from '../../lib/marks.js';

const PATTERNS = {
  chain: (x, y) => ((x + y) % 2 ? -1 : 0),
  rings: (x, y) => (x % 3 === 0 && y % 3 === 0 ? 1 : x % 3 === 1 && y % 3 === 1 ? -1 : 0),
  scale: (x, y) => { const row = Math.floor(y / 2); return (x + row * 2) % 4 === 0 ? -1 : y % 2 === 0 ? 1 : 0; },
  studs: (x, y) => (x % 4 === 1 && y % 4 === 1 ? 2 : 0),
  quilt: (x, y) => ((x + y) % 5 === 0 || (x - y + 50) % 5 === 0 ? -1 : 0),
  plate: (x, y, t, v) => (Math.abs(v - 0.45) < 0.04 ? -1 : 0),
  splint: (x) => (x % 3 === 0 ? -1 : 0),
  grain: (x, y) => ((x * 7 + y * 3) % 11 === 0 ? -1 : 0),
  fur: (x, y) => ((x * 5 + y * 11) % 7 < 2 ? -1 : 0),
  paper: () => 0,
  pages: (x, y) => (y % 2 === 0 ? -1 : 0),
  barbs: (x, y) => ((x + y) % 3 === 0 ? -1 : 0),
  folds: (x, y) => ((x * 3 + y * 5) % 7 === 0 ? -1 : 0),
};

export function renderO1(o, { size = 32, pad = null, outline = true, glow = true } = {}) {
  const { parts, rarity } = partsOf(o);
  const P = pad ?? Math.max(1, Math.round(size / 16));
  const sp = new Sprite(size, size), k = (size - 2 * P) / 2;
  const X = x => (x + 1) * k + P, Y = y => (y + 1) * k + P, px = w => Math.max(1, w * k);
  const all = new Mask(size, size), glowMasks = [];
  const order = [...parts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.order - b.order);
  for (const p0 of order) {
    const p = p0.t === 'lathe' ? latheToPoly(p0) : p0;
    if (p.t === 'mark') { drawMark(sp, all, p, X, Y, k); continue; }
    const m = new Mask(size, size);
    if (p.t === 'poly') m.poly(p.pts.map(([x, y]) => [X(x), Y(y)]));
    else if (p.t === 'bar') { m.bar(X(p.a[0]), Y(p.a[1]), X(p.b[0]), Y(p.b[1]), px(p.w)); if (p.round) { m.ellipse(X(p.a[0]), Y(p.a[1]), px(p.w) / 2, px(p.w) / 2); m.ellipse(X(p.b[0]), Y(p.b[1]), px(p.w) / 2, px(p.w) / 2); } }
    else if (p.t === 'ell') {
      m.ellipse(X(p.c[0]), Y(p.c[1]), Math.max(0.6, p.rx * k), Math.max(0.6, p.ry * k));
      if (p.ring) { const inner = new Mask(size, size).ellipse(X(p.c[0]), Y(p.c[1]), Math.max(0, (p.rx - p.ring) * k), Math.max(0, (p.ry - p.ring) * k)); m.subtract(inner); }
    } else if (p.t === 'strokes') for (const [a, b, c, d] of p.segs) { const w = px(p.w); if (w < 1.6) m.line(X(a), Y(b), X(c), Y(d)); else m.bar(X(a), Y(b), X(c), Y(d), w); }
    if (!m.count()) { if (p.t === 'ell' || p.t === 'strokes') { const c = p.c ?? [p.segs[0][0], p.segs[0][1]]; m.set(X(c[0]), Y(c[1])); } else continue; }

    if (p.glass) {
      // the shell: its outer pixels and one highlight column on the lit side; the inside stays clear
      const rim = m.clone(); const core = erode(m); rim.subtract(core);
      sp.paint(rim, [shade(p.col, -0.35), shade(p.col, -0.15), p.col, shade(p.col, 0.1)], { edge: false });
      const { x0, x1, y0, y1 } = m.bbox(); const hx = Math.round(x0 + (x1 - x0) * 0.26);
      for (let y = y0 + 2; y <= y1 - 3; y++) if (core.has(hx, y) && (y - y0) % 7 !== 5) sp.put(hx, y, withAlpha('#ffffff', 0.7));
      if (p.z >= 2) for (let y = y0; y <= y1; y++) { const x = x1 - 1; if (core.has(x, y)) sp.put(x, y, withAlpha(shade(p.col, -0.2), 0.5)); }
    } else if (p.glassBack) {
      sp.paint(m, p.col, { flat: true, edge: false });
    } else if (p.liquid) {
      sp.paint(m, p.col, { edge: false, pattern: p.milky ? (x, y) => ((x + y) % 4 === 0 ? 1 : 0) : null });
      const { x0, x1, y0 } = m.bbox(); for (let x = x0; x <= x1; x++) if (m.has(x, y0)) sp.put(x, y0, shade(p.col, 0.2));   // meniscus
    } else if (p.alpha && p.alpha < 1) {
      for (let i = 0; i < m.a.length; i++) if (m.a[i]) sp.put(i % size, Math.floor(i / size), withAlpha(p.col, p.alpha));
    } else if (p.t === 'strokes' && (p.ink || p.deboss)) {
      sp.paint(m, p.col, { flat: true, edge: false });
    } else {
      const pat = p.pat ? PATTERNS[p.pat] : null;
      sp.paint(m, p.emit ? [shade(p.col, -0.1), p.col, shade(p.col, 0.1), shade(p.col, 0.22)] : p.col, { light: p.light, flat: p.flat, pattern: pat, edge: p.t !== 'strokes' });
      if (p.edge) edgeLight(sp, m, p.col);
      if (p.facet) facet(sp, m, p.col);
      if (p.seal) { const c = m.bbox(); sp.put(Math.round((c.x0 + c.x1) / 2), Math.round((c.y0 + c.y1) / 2), shade(p.col, -0.3)); }
    }
    if (p.emit && glow) glowMasks.push([m, p.col, p.emit]);
    all.union(m);
  }
  if (outline) sp.outline(0.42);
  // rarity: a coloured rim where the outline is, and a halo from Very Rare up
  const R = RARITY_LOOK[rarity] ?? RARITY_LOOK.common;
  if (R.rim) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!all.has(x, y) && sp.get(x, y)) sp.put(x, y, mix(sp.get(x, y).slice(0, 7), R.rim, 0.6));
  if (R.glow) { const withOutline = new Mask(size, size); for (let i = 0; i < sp.px.length; i++) if (sp.px[i]) withOutline.a[i] = 1; sp.halo(withOutline, R.rim, R.glow); }
  for (const [m, c, e] of glowMasks) glowAround(sp, m, c, e);
  return sp;
}

function drawMark(sp, all, p, X, Y, k) {
  const bm = MARKS[p.mark] ?? MARKS.utility, cell = Math.max(1, Math.floor(p.s * k / 5)), n = 5 * cell;
  const x0 = Math.round(X(p.c[0]) - n / 2), y0 = Math.round(Y(p.c[1]) - n / 2);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (bm[j][i] === '#') for (let b = 0; b < cell; b++) for (let a = 0; a < cell; a++) { sp.put(x0 + i * cell + a, y0 + j * cell + b, p.col); all.set(x0 + i * cell + a, y0 + j * cell + b); }
}
function erode(m) { const o = new Mask(m.w, m.h); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.has(x, y) && m.has(x - 1, y) && m.has(x + 1, y) && m.has(x, y - 1) && m.has(x, y + 1)) o.set(x, y); return o; }
function edgeLight(sp, m, col) { const hi = shade(col, 0.2); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.has(x, y) && !m.has(x + 1, y - 1) && (m.has(x - 1, y + 1))) sp.put(x, y, hi); }
function facet(sp, m, col) { const { x0, x1 } = m.bbox(), mid = Math.round((x0 + x1) / 2); for (let y = 0; y < m.h; y++) if (m.has(mid, y)) sp.put(mid, y, shade(col, 0.18)); }
function glowAround(sp, m, col, e) {
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (sp.get(x, y)) continue; let near = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (m.has(x + i, y + j)) near = 1;
    if (near) sp.put(x, y, withAlpha(col, 0.35 * e));
  }
}
