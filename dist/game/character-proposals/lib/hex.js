// Pointy-top axial hex grid + a small hex dungeon generator, so every map proposal renders a real
// layout (rooms, corridors, stairs) instead of a flat patch.
//
// The key idea for walls on a hex grid: the sim can stay cell-based (a cell is FLOOR or WALL, as
// sim/dungeon/tiles.ts has it today), but a wall cell is never *drawn* as a block. What is drawn is
// a thin wall run along every edge a wall cell shares with a floor cell — see `wallEdges`. That is
// what makes the walls read as walls, not as squares, without changing the sim's model.
import { Rng } from './rng.js';

export const SQRT3 = Math.sqrt(3);
export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const key = (q, r) => `${q},${r}`;
/** Axial → world (hex size 1 = centre to corner). World y grows toward the viewer. */
export const toWorld = (q, r) => [SQRT3 * (q + r / 2), 1.5 * r];
export function fromWorld(x, y) {
  const q = (SQRT3 / 3 * x - y / 3), r = (2 / 3 * y);
  return roundAxial(q, r);
}
export function roundAxial(q, r) {
  const s = -q - r; let rq = Math.round(q), rr = Math.round(r); const rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}
export const dist = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2;
export function corners(q, r, size = 1) {
  const [cx, cy] = toWorld(q, r);
  return Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [cx + size * Math.cos(a), cy + size * Math.sin(a)]; });
}
export function line(a, b) {
  const n = dist(a, b), out = [];
  for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; out.push(roundAxial(a[0] + (b[0] - a[0]) * t + 1e-6, a[1] + (b[1] - a[1]) * t + 1e-6)); }
  return out;
}

export const FLOOR = 1, WALL = 0;

/**
 * cols × rows in odd-r offset space. Returns { cells: Map key→{q,r,t}, rooms, entry, stairs }.
 * Rooms are hex disks and lozenges; corridors are hex lines, sometimes two wide.
 */
export function generateDungeon(seed = 'hex', cols = 30, rows = 22, roomCount = 7) {
  const rng = new Rng(`dungeon:${seed}`);
  const cells = new Map();
  const inside = (q, r) => { const col = q + (r - (r & 1)) / 2; return r >= 1 && r < rows - 1 && col >= 1 && col < cols - 1; };
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) { const q = col - (r - (r & 1)) / 2; cells.set(key(q, r), { q, r, t: WALL }); }
  const carve = (q, r) => { if (inside(q, r)) cells.get(key(q, r)).t = FLOOR; };
  const rooms = [];
  for (let tries = 0; rooms.length < roomCount && tries < 400; tries++) {
    const r = rng.int(3, rows - 4), col = rng.int(3, cols - 4), q = col - (r - (r & 1)) / 2;
    const rad = rng.int(2, 3);
    if (rooms.some(o => dist(o.c, [q, r]) < o.rad + rad + 2)) continue;
    rooms.push({ c: [q, r], rad });
  }
  rooms.sort((a, b) => a.c[0] + a.c[1] * 0.5 - (b.c[0] + b.c[1] * 0.5));
  for (const room of rooms) for (const [q, r] of cellsOf()) if (dist([q, r], room.c) <= room.rad) carve(q, r);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1].c, b = rooms[i].c, wide = rng.chance(0.35);
    // an elbow through an intermediate point, so corridors are not all straight diagonals
    const mid = rng.chance(0.5) ? [b[0], a[1]] : [a[0], b[1]];
    for (const seg of [[a, mid], [mid, b]]) for (const [q, r] of line(...seg)) { carve(q, r); if (wide) carve(q + 1, r); }
  }
  function cellsOf() { return [...cells.values()].map(c => [c.q, c.r]); }
  return { cells, rooms, entry: rooms[0].c, stairs: rooms[rooms.length - 1].c, cols, rows, seed };
}

export const isFloor = (map, q, r) => map.cells.get(key(q, r))?.t === FLOOR;

/**
 * Every edge between a floor cell and a non-floor cell, as a wall run:
 * { a, b } world-space endpoints, `n` the unit normal pointing into the floor, and `front` true when
 * the floor is *behind* the wall from the camera's point of view (wall is between room and viewer).
 */
export function wallEdges(map) {
  const out = [];
  for (const c of map.cells.values()) {
    if (c.t !== FLOOR) continue;
    const [cx, cy] = toWorld(c.q, c.r);
    DIRS.forEach(([dq, dr], d) => {
      if (isFloor(map, c.q + dq, c.r + dr)) return;
      const [nx, ny] = toWorld(c.q + dq, c.r + dr);
      const ang = Math.atan2(ny - cy, nx - cx);
      const a = [cx + Math.cos(ang - Math.PI / 6) * 1, cy + Math.sin(ang - Math.PI / 6)];
      const b = [cx + Math.cos(ang + Math.PI / 6) * 1, cy + Math.sin(ang + Math.PI / 6)];
      const n = [-Math.cos(ang), -Math.sin(ang)]; // from the wall back into the floor
      out.push({ a, b, n, cell: c, dir: d, front: ny > cy + 0.1 });
    });
  }
  return out;
}

/** Corner posts: every hex vertex touched by two or more wall runs. */
export function wallPosts(edges) {
  const m = new Map();
  for (const e of edges) for (const p of [e.a, e.b]) { const k = `${p[0].toFixed(2)},${p[1].toFixed(2)}`; const o = m.get(k) ?? { p, n: 0, front: true }; o.n++; o.front = o.front && e.front; m.set(k, o); }
  return [...m.values()].filter(o => o.n >= 2);
}
