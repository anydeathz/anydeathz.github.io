// Areas as hex cells. Pointy-top axial (the grid in character-proposals/lib/hex.js). One hex step is
// the game's one tile, so a game radius in tiles is a radius in hex steps.
//
// The sim today has exactly one shape — a Euclidean disc (`aoeRadius`, SurfaceGrid.paint). Everything
// else here is a proposal for the hex pass: cone, line, cube, wall, ring, aura.
//
// Every function returns an array of [q, r] and is pure, so the sim could own it (R1: no window).
import { toWorld, roundAxial, dist, SQRT3, key } from '../../character-proposals/lib/hex.js';
export { toWorld, key, dist };

const STEP = SQRT3;                        // world distance between neighbouring hex centres
export const FT_PER_HEX = 5;
/** 5e feet → hex steps. Where the game has its own radius, use that instead (actionLook does). */
export const ftToHex = ft => ft / FT_PER_HEX;

function around([q, r], R) {                // every cell within R hex steps (inclusive)
  const out = []; const n = Math.ceil(R) + 1;
  for (let dq = -n; dq <= n; dq++) for (let dr = Math.max(-n, -dq - n); dr <= Math.min(n, -dq + n); dr++) out.push([q + dq, r + dr]);
  return out;
}
const wd = (a, b) => { const [ax, ay] = toWorld(...a), [bx, by] = toWorld(...b); return Math.hypot(ax - bx, ay - by) / STEP; };

/** The game's own rule, moved to hexes: every cell whose centre lies within r of the target's. */
export const disc = (c, r) => around(c, r).filter(p => wd(p, c) <= r + 1e-6);
export const ring = (c, r) => around(c, r).filter(p => dist(p, c) === Math.round(r));

/**
 * A cone from `origin` toward `toward`. `halfDeg` 30 is the hex-native 60° wedge (it follows grid
 * lines exactly); 26.57 is the 5e cone (width = length). They differ by one cell at the rim — measured
 * on the page, not assumed.
 */
export function cone(origin, toward, len, halfDeg = 30) {
  const [ox, oy] = toWorld(...origin), [tx, ty] = toWorld(...toward); const a0 = Math.atan2(ty - oy, tx - ox);
  return around(origin, len).filter(p => {
    const d = wd(p, origin); if (d < 0.5 || d > len + 1e-6) return false;
    const [x, y] = toWorld(...p); let da = Math.atan2(y - oy, x - ox) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
    return Math.abs(da) <= halfDeg * Math.PI / 180 + 1e-6;
  });
}
/** A line `len` hexes long, `width` hexes wide (1 → the hex line itself, 2 → centres within 0.9). */
export function line(origin, toward, len, width = 1) {
  const [ox, oy] = toWorld(...origin), [tx, ty] = toWorld(...toward); const L = Math.hypot(tx - ox, ty - oy) || 1;
  const ux = (tx - ox) / L, uy = (ty - oy) / L;
  return around(origin, len + 1).filter(p => {
    const [x, y] = toWorld(...p), dx = (x - ox) / STEP, dy = (y - oy) / STEP;
    const along = dx * ux + dy * uy, off = -dx * uy + dy * ux;
    // width 2 is one-sided: on hexes the neighbouring row sits 0.866 away, so a symmetric band is 1 or 3
    return along > 0.5 && along <= len + 0.5 && (width === 1 ? Math.abs(off) <= 0.5 : off >= -0.5 && off <= 0.95);
  });
}
/** A 5e cube on hexes: the axial lozenge of side n centred on c — the square the grid can actually draw. */
export function cube(c, side) {
  const n = Math.max(1, Math.round(side)), o = Math.floor((n - 1) / 2), out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([c[0] - o + i, c[1] - o + j]);
  return out;
}
/** A wall: a run of hexes `len` long through `c`, perpendicular to the caster's line of sight. */
export function wall(caster, c, len) {
  const [cx, cy] = toWorld(...c), [sx, sy] = toWorld(...caster); const L = Math.hypot(cx - sx, cy - sy) || 1;
  const px = -(cy - sy) / L, py = (cx - sx) / L, half = len / 2, out = new Map();
  for (let t = -half; t <= half; t += 0.25) { const p = roundAxialWorld(cx + px * t * STEP, cy + py * t * STEP); out.set(key(...p), p); }
  return [...out.values()];
}
function roundAxialWorld(x, y) { return roundAxial(SQRT3 / 3 * x - y / 3, 2 / 3 * y); }

/**
 * The one entry point renderers use: a look (lib/spells.js row or actionLook) + where it was cast →
 * the cells it covers. `hex` wins over `ft` (the game's own radius beats the SRD's feet).
 */
export function cellsFor(look, caster, target) {
  const a = look.area; const R = a.hex ?? ftToHex(a.ft ?? 0);
  switch (a.shape) {
    case 'sphere': case 'cylinder': return disc(target, Math.max(0.5, R));
    case 'aura': return disc(caster, Math.max(0.5, R));
    case 'cone': return cone(caster, target, Math.max(1, R), a.halfDeg ?? 30);
    case 'line': return line(caster, target, Math.max(1, R), a.width ?? 1);
    case 'cube': return cube(target, Math.max(1, R));
    case 'wall': return wall(caster, target, Math.max(2, Math.min(R, 12)));
    case 'ring': return ring(target, Math.max(1, R));
    default: return [target];
  }
}
