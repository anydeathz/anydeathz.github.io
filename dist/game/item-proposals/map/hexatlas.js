// The hex area atlas: every shape lib/hexarea.js produces, at three sizes, drawn as SVG diagrams straight
// from the cell lists — and today's rule (a Euclidean disc over square tiles, SurfaceGrid.paint) beside
// its hex twin, so the change of grid is measured in cells, not described.
import { disc, cone, line, cube, wall, ring, toWorld, key } from '../lib/hexarea.js';
import { corners } from '../../character-proposals/lib/hex.js';

const C = [0, 0], T = [3, -1];
function hexSvg(cells, { R = 6, caster = null, target = null, col = '#e0622a', w = 190 } = {}) {
  const set = new Set(cells.map(c => key(...c))), out = [];
  for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) { if (Math.abs(q + r) > R) continue; const k = corners(q, r, 0.96).map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '); const on = set.has(key(q, r)); out.push(`<polygon points="${k}" fill="${on ? col : '#2a221c'}" fill-opacity="${on ? 0.75 : 1}" stroke="${on ? '#f4d8c0' : '#3a2f27'}" stroke-width="${on ? 0.08 : 0.05}"/>`); }
  const dot = (p, c, label) => { if (!p) return; const [x, y] = toWorld(...p); out.push(`<circle cx="${x}" cy="${y}" r="0.42" fill="${c}" stroke="#120f0d" stroke-width="0.12"/><text x="${x}" y="${y + 0.28}" font-size="0.8" text-anchor="middle" fill="#120f0d" font-family="monospace" font-weight="700">${label}</text>`); };
  dot(caster, '#e8dcc6', 'C'); dot(target, '#7fb09a', 'T');
  const s = R * 1.8 + 1.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-s} ${-s * 0.87} ${2 * s} ${2 * s * 0.87}" width="${w}" height="${Math.round(w * 0.87)}">${out.join('')}</svg>`;
}
function squareSvg(r, { R = 6, col = '#e0622a', w = 190 } = {}) {  // the game today: integer tiles within Math.hypot ≤ r
  const out = []; let n = 0;
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const on = Math.hypot(x, y) <= r; if (on) n++; out.push(`<rect x="${x - 0.48}" y="${y - 0.48}" width="0.96" height="0.96" fill="${on ? col : '#2a221c'}" fill-opacity="${on ? 0.75 : 1}" stroke="${on ? '#f4d8c0' : '#3a2f27'}" stroke-width="${on ? 0.06 : 0.04}"/>`); }
  out.push(`<circle cx="0" cy="0" r="${r}" fill="none" stroke="#e8dcc6" stroke-dasharray=".2 .2" stroke-width=".06"/>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-R - 0.6} ${-R - 0.6} ${2 * R + 1.2} ${2 * R + 1.2}" width="${Math.round(w * 0.87)}" height="${Math.round(w * 0.87)}">${out.join('')}</svg>`, n };
}
const el = s => { const t = document.createElement('template'); t.innerHTML = s; return t.content.firstChild; };

export function hexAtlas({ group, fig }) {
  const counts = {};
  const add = (row, cells, cap, o) => { counts[cap] = cells.length; fig(el(hexSvg(cells, o)), `${cap} · ${cells.length} cells`, row); };
  let r = group('today → hexes · the game\'s one rule, a Euclidean disc (Fireball 3.2 · Stinking Cloud 3 · Cleave 1.8)');
  for (const rad of [1.8, 3, 3.2]) { const sq = squareSvg(rad); counts[`square r${rad}`] = sq.n; fig(el(sq.svg), `today, squares · r ${rad} · ${sq.n} tiles`, r); add(r, disc(C, rad), `hex disc r ${rad}`, { target: C }); }
  r = group('cone · 60° wedge (follows hex lines) vs 5e 53° (width = length)');
  for (const L of [3, 4, 6]) { add(r, cone(C, T, L, 30), `60° · ${L * 5} ft`, { caster: C, target: T, col: '#7fc6dd' }); add(r, cone(C, T, L, 26.57), `53° · ${L * 5} ft`, { caster: C, target: T, col: '#7fc6dd' }); }
  r = group('line · 1 wide and 2 wide (on hexes a symmetric band is 1 or 3 — 2 is one-sided)');
  for (const L of [4, 6]) { add(r, line(C, T, L, 1), `line ${L * 5} ft ×1`, { caster: C, target: T, col: '#e8cf5a' }); add(r, line(C, [3, 1], L, 2), `line ${L * 5} ft ×2`, { caster: C, target: [3, 1], col: '#e8cf5a' }); }
  r = group('cube → hex lozenge · wall · ring');
  for (const n of [2, 3, 4]) add(r, cube(T, n), `cube ${n * 5} ft`, { target: T, col: '#9aa8c8' });
  for (const n of [4, 8]) add(r, wall(C, T, n), `wall ${n * 5} ft`, { caster: C, target: T, col: '#E87A42' });
  add(r, ring(T, 2), 'ring r 2', { target: T, col: '#c8a6e8' });
  r = group('aura (follows the caster) · sphere at range · cylinder');
  for (const n of [1, 2, 3]) add(r, disc(C, n), `aura ${n * 5} ft`, { caster: C, col: '#f0dd9a' });
  window.__metrics = { cellCounts: counts };
}
