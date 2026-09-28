// O2 — manuscript vector. The same parts as SVG: flat ink-bordered fills, hatched shadow on the side
// away from the light, glyphs set as real type. It is the game's existing UI language (the SVG sprite in
// ui/icons.ts is ink on vellum), crisp at every size, and the only approach that can print a glyph.
//
//   renderO2(object, { px = 64 }) → SVGElement (a string too: svgO2)
import { partsOf, latheToPoly, ellPts } from '../../lib/parts.js';
import { RARITY_LOOK, elementOf } from '../../lib/palette.js';
import { shade } from '../../../character-proposals/lib/color.js';

const INK = '#1a1410';
let uid = 0;
export function svgO2(o, { px = 64 } = {}) {
  const { parts, rarity } = partsOf(o), id = `o2${uid++}`;
  const R = RARITY_LOOK[rarity] ?? RARITY_LOOK.common;
  const order = [...parts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.order - b.order);
  const f = n => n.toFixed(3);
  const body = [], rim = [];
  for (const p0 of order) {
    const p = p0.t === 'lathe' ? latheToPoly(p0) : p0;
    let d = null;
    if (p.t === 'poly') d = 'M' + p.pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
    else if (p.t === 'ell' && !p.ring) d = 'M' + ellPts(p, 28).map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
    if (p.t === 'mark') { const g = elementOf(p.mark).glyph; body.push(`<text x="${f(p.c[0])}" y="${f(p.c[1])}" font-size="${f(p.s * 0.95)}" text-anchor="middle" dominant-baseline="central" fill="${p.col}" font-family="'Noto Sans Symbols 2','Segoe UI Symbol',serif">${g}</text>`); continue; }
    if (p.t === 'bar') {
      const w = Math.max(0.03, p.w);
      rim.push(`<line x1="${f(p.a[0])}" y1="${f(p.a[1])}" x2="${f(p.b[0])}" y2="${f(p.b[1])}" stroke-width="${f(w + 0.13)}" stroke-linecap="round"/>`);
      body.push(`<line x1="${f(p.a[0])}" y1="${f(p.a[1])}" x2="${f(p.b[0])}" y2="${f(p.b[1])}" stroke="${INK}" stroke-width="${f(w + 0.06)}" stroke-linecap="round"/><line x1="${f(p.a[0])}" y1="${f(p.a[1])}" x2="${f(p.b[0])}" y2="${f(p.b[1])}" stroke="${p.col}" stroke-width="${f(w)}" stroke-linecap="round"/>`);
      continue;
    }
    if (p.t === 'strokes') { const segs = p.segs.map(([a, b, c, dd]) => `M${f(a)} ${f(b)}L${f(c)} ${f(dd)}`).join(''); body.push(`<path d="${segs}" stroke="${p.col}" stroke-width="${f(Math.max(0.025, p.w * 0.8))}" stroke-linecap="round" fill="none"/>`); continue; }
    if (p.t === 'ell' && p.ring) { body.push(`<ellipse cx="${f(p.c[0])}" cy="${f(p.c[1])}" rx="${f(p.rx - p.ring / 2)}" ry="${f(p.ry - p.ring / 2)}" fill="none" stroke="${INK}" stroke-width="${f(p.ring + 0.06)}"/><ellipse cx="${f(p.c[0])}" cy="${f(p.c[1])}" rx="${f(p.rx - p.ring / 2)}" ry="${f(p.ry - p.ring / 2)}" fill="none" stroke="${p.col}" stroke-width="${f(p.ring)}"/>`); rim.push(`<ellipse cx="${f(p.c[0])}" cy="${f(p.c[1])}" rx="${f(p.rx - p.ring / 2)}" ry="${f(p.ry - p.ring / 2)}" fill="none" stroke-width="${f(p.ring + 0.14)}"/>`); continue; }
    if (!d) continue;
    rim.push(`<path d="${d}" stroke-width="0.14"/>`);
    if (p.glass) { body.push(`<path d="${d}" fill="#ffffff10" stroke="${INK}" stroke-width="0.05"/><path d="${d}" fill="none" stroke="${p.col}" stroke-width="0.025"/>`); const bb = bbox(p.pts ?? ellPts(p)); body.push(`<path d="M${f(bb.x0 + (bb.x1 - bb.x0) * 0.26)} ${f(bb.y0 + 0.22)}V${f(bb.y1 - 0.2)}" stroke="#fff" stroke-opacity=".7" stroke-width="0.05" stroke-linecap="round"/>`); continue; }
    const op = p.alpha && p.alpha < 1 ? ` fill-opacity="${p.alpha}"` : '';
    body.push(`<path d="${d}" fill="${p.col}"${op} stroke="${INK}" stroke-width="0.045" stroke-linejoin="round"/>`);
    if (!p.flat && !p.glassBack && !(p.alpha < 1)) body.push(`<path d="${d}" fill="url(#${id}h)" mask="url(#${id}k)" opacity=".5" style="mix-blend-mode:multiply"/>`);
    if (p.liquid) { const bb = bbox(p.pts); body.push(`<path d="M${f(bb.x0 + 0.04)} ${f(bb.y0 + 0.01)}H${f(bb.x1 - 0.04)}" stroke="${shade(p.col, 0.2)}" stroke-width="0.04"/>`); }
    if (p.emit) body.push(`<path d="${d}" fill="${p.col}" opacity="${0.5 * p.emit}" filter="url(#${id}g)"/>`);
  }
  // hatch: lines at 45°, fading in from the lit (left) side, so shading reads as engraving not gradient
  const defs = `<defs><linearGradient id="${id}m" x1="0" x2="1"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#fff" stop-opacity="1"/></linearGradient>
<pattern id="${id}p" width=".09" height=".09" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".09" height=".09" fill="#fff"/><rect width=".035" height=".09" fill="#3a2e24"/></pattern>
<mask id="${id}k" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}m)"/></mask>
<pattern id="${id}h" width="2" height="2" x="-1" y="-1" patternUnits="userSpaceOnUse"><rect x="-1" y="-1" width="2" height="2" fill="url(#${id}p)"/></pattern>
<filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".08"/></filter>
<filter id="${id}r" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${R.glow ? 0.07 : 0}"/></filter></defs>`;
  const rimG = R.rim ? `<g stroke="${R.rim}" fill="${R.rim}" opacity="${R.glow ? 0.9 : 0.75}" ${R.glow ? `filter="url(#${id}r)"` : ''}>${rim.join('')}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.08 -1.08 2.16 2.16" width="${px}" height="${px}">${defs}${rimG}${body.join('')}</svg>`;
}
const bbox = pts => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x0, y0, x1, y1 }; };
