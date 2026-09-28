// A cast, as data over time. One spell look (lib/spells.js row, or actionLook of a game action) + who
// cast it + where → the cells it covers (lib/hexarea.js) and a list of EMITTERS on a 0…1 timeline.
// Every cast approach (S1…S5) draws the same emitters; they differ only in how.
//
//   0.00–0.25 telegraph  · 0.25–0.55 release (travel / beam / sweep) · 0.55–0.75 impact · 0.75–1 aftermath
//
// Deterministic: particlesAt(cast, t) is a pure function of (cast, t) — no simulation state — so any
// frame can be drawn on its own, the same on every device, and a still is exactly a frame.
import { cellsFor, toWorld, dist } from '../lib/hexarea.js';
import { elementOf } from '../lib/palette.js';
import { shade, mix } from '../../character-proposals/lib/color.js';
import { hashString } from '../../character-proposals/lib/rng.js';

export const PHASES = [['telegraph', 0.12], ['release', 0.42], ['impact', 0.6], ['aftermath', 0.92]];

/** How each element moves and looks. The hue is the game's; the motion and particle are proposals. */
export const ELEMENT_FX = {
  fire:        { p: 'ember',  rise: 1.4,  jitter: 0.25, n: 1.2 },
  cold:        { p: 'shard',  rise: -0.2, jitter: 0.1,  n: 1.0 },
  lightning:   { p: 'spark',  rise: 0,    jitter: 0.6,  n: 0.9 },
  acid:        { p: 'drip',   rise: -0.9, jitter: 0.15, n: 1.0 },
  poison:      { p: 'puff',   rise: 0.35, jitter: 0.3,  n: 1.1 },
  thunder:     { p: 'ring',   rise: 0,    jitter: 0.05, n: 0.6 },
  force:       { p: 'glyph',  rise: 0.2,  jitter: 0.05, n: 0.8 },
  necrotic:    { p: 'wisp',   rise: 0.8,  jitter: 0.4,  n: 1.0 },
  radiant:     { p: 'mote',   rise: 0.9,  jitter: 0.1,  n: 1.1 },
  psychic:     { p: 'ring',   rise: 0.3,  jitter: 0.2,  n: 0.8 },
  bludgeoning: { p: 'streak', rise: 0,    jitter: 0.1,  n: 0.6 },
  piercing:    { p: 'streak', rise: 0,    jitter: 0.1,  n: 0.8 },
  slashing:    { p: 'streak', rise: 0,    jitter: 0.2,  n: 0.8 },
  heal:        { p: 'cross',  rise: 1.0,  jitter: 0.1,  n: 0.8 },
  buff:        { p: 'mote',   rise: 1.2,  jitter: 0.1,  n: 0.7 },
  ward:        { p: 'glyph',  rise: 0.3,  jitter: 0.05, n: 0.6 },
  debuff:      { p: 'wisp',   rise: -0.4, jitter: 0.2,  n: 0.7 },
  control:     { p: 'ring',   rise: 0.1,  jitter: 0.3,  n: 0.8 },
  summon:      { p: 'mote',   rise: 1.4,  jitter: 0.1,  n: 0.9 },
  light:       { p: 'mote',   rise: 0.5,  jitter: 0.3,  n: 1.0 },
  shadow:      { p: 'puff',   rise: 0.1,  jitter: 0.2,  n: 1.2 },
  move:        { p: 'streak', rise: 0.6,  jitter: 0.1,  n: 0.6 },
  utility:     { p: 'mote',   rise: 0.4,  jitter: 0.2,  n: 0.4 },
};

export function makeCast(look, caster, target, extra = {}) {
  const el = elementOf(look.element), hue = el.hue;
  const cells = look.area.shape === 'single' ? [target] : cellsFor(look, caster, target);
  const cols = [shade(hue, 0.22), hue, shade(hue, -0.25), mix(hue, '#ffffff', 0.55)];  // [light, base, dark, core]
  const fx = ELEMENT_FX[look.element] ?? ELEMENT_FX.utility;
  const W = p => toWorld(...p);
  const c = { look, caster, target, cells, hue, cols, fx, seed: hashString(look.id + caster + target), extraTargets: extra.chainTo ?? [], emitters: [] };
  const E = c.emitters, from = W(caster), to = W(target), maxD = Math.max(1, ...cells.map(p => dist(p, caster)));
  const d = look.delivery, shape = look.area.shape;
  // ── telegraph: what the game would show first. A rule on the covered cells, never a fill. ──────
  if (shape !== 'single') E.push({ type: 'telegraph', cells, t0: 0, t1: 0.3 });
  // ── release ──────────────────────────────────────────────────────────────────────────────────
  if (d === 'projectile') E.push({ type: 'travel', from, to, z0: 1.3, z1: shape === 'single' ? 1.2 : 0.4, arc: shape === 'sphere' ? 1.4 : 0.25, t0: 0.22, t1: 0.55 });
  else if (d === 'beam') E.push({ type: 'beam', from, to, z: 1.25, jag: 0, t0: 0.25, t1: 0.72 });
  else if (d === 'bolt') { const pts = [from, to, ...c.extraTargets.map(W)]; if (shape === 'line') pts.splice(1, 1, W(cells.reduce((a, b) => dist(b, caster) > dist(a, caster) ? b : a))); E.push({ type: 'beam', from, to: pts[1], chain: pts.slice(1), z: 1.25, jag: 0.35, t0: 0.28, t1: 0.62 }); }
  else if (d === 'weapon' || d === 'touch') E.push({ type: 'flash', at: to, z: 1.1, r: 0.8, t0: 0.4, t1: 0.7 });
  else if (d === 'target') E.push({ type: 'sigil', at: to, z: 2.9, t0: 0.2, t1: 0.75 });
  else if (d === 'summon') E.push({ type: 'rune', at: to, r: 1.2, t0: 0.1, t1: 0.9 }, { type: 'spirit', at: to, t0: 0.45, t1: 1 });
  // ── the area ─────────────────────────────────────────────────────────────────────────────────
  if (shape === 'sphere' && d !== 'zone') E.push({ type: 'burst', at: to, cells, r: radiusOf(cells, target), t0: d === 'projectile' ? 0.55 : 0.35, t1: d === 'projectile' ? 0.78 : 0.62 });
  if (shape === 'cone' || shape === 'line') E.push({ type: 'sweep', origin: from, cells, maxD, t0: d === 'bolt' ? 0.28 : 0.3, t1: 0.7 });
  if (shape === 'cube' && d !== 'zone') E.push({ type: 'fill', cells, t0: 0.35, t1: 0.85 });
  if (shape === 'cylinder') E.push({ type: 'column', cells, at: to, t0: 0.3, t1: 1, height: 3.2 });
  if (shape === 'aura') E.push({ type: 'ring', at: from, follow: 'caster', r: radiusOf(cells, caster), t0: 0.2, t1: 1, persist: true });
  if (shape === 'wall') E.push({ type: 'wall', cells, t0: 0.3, t1: 1, height: 1.4 });
  if (shape === 'ring') E.push({ type: 'ring', at: to, r: radiusOf(cells, target), t0: 0.2, t1: 1, persist: true });
  if (d === 'zone' && shape !== 'cylinder') E.push({ type: 'zone', cells, t0: 0.35, t1: 1 });
  // ── aftermath: a surface, if the game (or the SRD) says one is left behind ─────────────────────
  if (look.surface) E.push({ type: 'surface', cells: look.surface === 'web' || shape === 'single' ? cells : cells.filter(p => dist(p, shape === 'cone' || shape === 'line' || shape === 'aura' ? caster : target) <= Math.max(1, Math.round(radiusOf(cells, target) * 0.7))), kind: look.surface, t0: 0.72 });
  return c;
}
const radiusOf = (cells, c) => Math.max(0.6, ...cells.map(p => dist(p, c)));
export const active = (e, t) => t >= e.t0 && t <= e.t1;
export const local = (e, t) => Math.max(0, Math.min(1, (t - e.t0) / (e.t1 - e.t0)));
export function cellStart(e, p, t) { if (e.type !== 'sweep') return e.t0; const [ox, oy] = e.origin, [x, y] = toWorld(...p); return e.t0 + (e.t1 - e.t0) * 0.6 * Math.hypot(x - ox, y - oy) / (e.maxD * Math.sqrt(3)); }

// ══════════════════════════════════════════════════════════════════════════════════════════════
// Particles — a pure function of (cast, t). S1 draws them as pixels, S5 as cubes.
// { x, y, z, c (hex), a (alpha 0..1), s (size in pixels at 1:1), k (kind) }
// ══════════════════════════════════════════════════════════════════════════════════════════════
const h01 = (s, i, k) => (hashString(`${s}:${i}:${k}`) & 0xffff) / 0xffff;
export function particlesAt(c, t) {
  const out = [], { fx, cols } = c, S = c.seed;
  const push = (x, y, z, col, a, s, k = fx.p) => out.push({ x, y, z, c: col, a: Math.max(0, Math.min(1, a)), s, k });
  for (const [ei, e] of c.emitters.entries()) {
    if (e.type === 'travel' && active(e, t)) {
      const u = local(e, t), [fx0, fy0] = e.from, [tx, ty] = e.to;
      const hx = fx0 + (tx - fx0) * u, hy = fy0 + (ty - fy0) * u, hz = e.z0 + (e.z1 - e.z0) * u + Math.sin(u * Math.PI) * e.arc;
      push(hx, hy, hz, cols[3], 1, 4, 'head'); push(hx, hy, hz, cols[0], 0.8, 6, 'head');
      for (let i = 0; i < 14; i++) { const back = i / 14 * 0.28, uu = Math.max(0, u - back); const px = fx0 + (tx - fx0) * uu, py = fy0 + (ty - fy0) * uu, pz = e.z0 + (e.z1 - e.z0) * uu + Math.sin(uu * Math.PI) * e.arc; push(px + (h01(S, i, ei) - 0.5) * 0.2, py + (h01(S, i, 'y') - 0.5) * 0.2, pz + back * fx.rise, i < 4 ? cols[0] : cols[1], 1 - i / 14, 2); }
    }
    if (e.type === 'beam' && active(e, t)) {
      const u = local(e, t), pts = [e.from, ...(e.chain ?? [e.to])];
      for (let s = 0; s + 1 < pts.length; s++) {
        const [ax, ay] = pts[s], [bx, by] = pts[s + 1], L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L * 10);
        const vis = Math.min(1, u * 3 - s * 0.4); if (vis <= 0) continue;
        for (let i = 0; i <= n * vis; i++) { const q = i / n, flick = Math.floor(t * 30); const j = e.jag ? (h01(S, i, flick) - 0.5) * e.jag * Math.sin(q * Math.PI) : 0; push(ax + (bx - ax) * q - (by - ay) / L * j, ay + (by - ay) * q + (bx - ax) / L * j, e.z - (e.jag ? 0 : 0) + (s ? -0.3 * q : 0), u > 0.85 ? cols[1] : cols[3], u > 0.85 ? (1 - u) / 0.15 : 1, e.jag ? 2 : 3, 'beam'); }
        for (let i = 0; i < 8; i++) { const a = h01(S, i, s) * 6.283, r = h01(S, i, 'r') * 0.5 * u; push(bx + Math.cos(a) * r, by + Math.sin(a) * r, e.z - 0.2 + h01(S, i, 'z') * 0.5, cols[0], 1 - u, 2); }
      }
    }
    if ((e.type === 'burst' || e.type === 'fill' || e.type === 'sweep' || e.type === 'zone' || e.type === 'column' || e.type === 'wall') && t >= e.t0) {
      const persist = e.type === 'zone' || e.type === 'column' || e.type === 'wall';
      if (!persist && t > e.t1 + 0.1) continue;
      if (e.type === 'burst' && active(e, t)) { const u = local(e, t), [bx, by] = e.at, R = (e.r + 0.5) * 1.732; push(bx, by, 0.6, cols[1], 0.9 * (1 - u), 4 + R * 26 * Math.min(1, u * 2.2), 'flash'); push(bx, by, 0.6 + u * 0.4, cols[0], 1 - u * u, 6 + R * 14 * Math.min(1, u * 3), 'flash'); push(bx, by, 0.7, cols[3], (1 - u) * 0.7, 4 + R * 5 * Math.min(1, u * 3), 'flash'); }
      const per = Math.round(8 * fx.n * (e.type === 'burst' ? 1.6 : 1));
      e.cells.forEach((p, ci) => {
        const t0 = cellStart(e, p, t); if (t < t0) return;
        const [cx, cy] = toWorld(...p), life = persist ? 0.35 : 0.3;
        for (let i = 0; i < per; i++) {
          const born = t0 + h01(S, ci * 31 + i, 'b') * (persist ? 1 : 0.1), age = persist ? ((t - born) / life % 1 + 1) % 1 : (t - born) / life;
          if (age < 0 || age > 1) continue;
          const ox = (h01(S, ci, i) - 0.5) * 1.6, oy = (h01(S, i, ci) - 0.5) * 1.4;
          let z = 0.1 + age * fx.rise * (e.type === 'burst' ? 1.6 : 1) + h01(S, i, 'z') * 0.3;
          if (e.type === 'column') z = e.height * (1 - age);                  // rain down the column
          if (e.type === 'wall') z = h01(S, i, 'wz') * e.height + age * 0.4;
          if (fx.rise < 0 && e.type !== 'column') z = 1.4 + age * fx.rise;
          const spread = e.type === 'burst' ? 1 + age * 0.6 : 1;
          push(cx + ox * spread + Math.sin(age * 9 + i) * fx.jitter * 0.3, cy + oy * spread, Math.max(0, z), age < 0.3 ? cols[3] : age < 0.6 ? cols[0] : cols[1], persist ? 0.85 * Math.sin(age * Math.PI) : 1 - age * 0.8, age < 0.4 ? 4 : 3);
        }
      });
    }
    if (e.type === 'ring' && t >= e.t0) {
      const u = local(e, t), R = e.r * Math.sqrt(3) * Math.min(1, u * 2.5), n = Math.round(R * 14) + 8, [cx, cy] = e.at;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + t * (e.persist ? 1.2 : 0); push(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.92, 0.3 + Math.sin(a * 3 + t * 4) * 0.12 + (i % 3) * 0.25, i % 4 ? cols[1] : cols[3], e.persist ? 0.95 : 1 - u, 3, 'mote'); }
    }
    if (e.type === 'flash' && active(e, t)) { const u = local(e, t), [x, y] = e.at; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; push(x + Math.cos(a) * e.r * u, y + Math.sin(a) * e.r * u * 0.6, e.z + Math.sin(a) * 0.3 * u, cols[i % 2 ? 0 : 3], 1 - u, 3, 'spark'); } push(x, y, e.z, cols[3], 1 - u, 6, 'head'); }
    if (e.type === 'sigil' && active(e, t)) { const u = local(e, t), [x, y] = e.at; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + u * 2; push(x + Math.cos(a) * 0.45, y + Math.sin(a) * 0.2, e.z + Math.sin(a) * 0.2, cols[i % 3 ? 1 : 3], Math.sin(u * Math.PI), 2, 'mote'); } }
    if (e.type === 'spirit' && active(e, t)) { const u = local(e, t), [x, y] = e.at; for (let i = 0; i < 40; i++) { const hz = h01(S, i, 'sz') * 2.4, w = 0.45 * Math.sin(Math.min(1, hz / 2.4) * Math.PI) + 0.1; push(x + (h01(S, i, 'sx') - 0.5) * w * 2, y + 0.05, hz * Math.min(1, u * 2), cols[i % 4 ? 1 : 3], 0.7 * Math.min(1, u * 2), 2, 'mote'); } }
  }
  return out;
}
