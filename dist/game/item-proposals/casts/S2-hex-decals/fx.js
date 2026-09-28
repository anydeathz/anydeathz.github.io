// S2 — hex footprint decals. The cast's AREA drawn as hex cells on the floor, in three states:
//   telegraph  a rule along the outside edge of the covered cells + a sparse dither inside (never a fill)
//   impact     each cell washes in the element's hue at the moment the effect reaches it (sweeps travel)
//   aftermath  a zone or surface as floor state (casts/surfaces.js)
// This is literally "how a spell looks on the hex tile system": it can only ever say exactly which
// cells are affected — which is also what the dice-are-real pillar wants the player to be able to see.
// S2 draws nothing in the air; it is the ground half, and pairs with S1 (particles) for the air half.
import { edgeOf, surfaceLayer, key, toWorld, alphaHex, active, local, cellStart } from '../common.js';
import { DIRS } from '../../../character-proposals/lib/hex.js';
import { mix } from '../../../character-proposals/lib/color.js';

export function fx2d(cast, t) {
  const set = new Set(cast.cells.map(c => key(...c))), out = [];
  const E = cast.emitters, tel = E.find(e => e.type === 'telegraph'), hit = E.filter(e => ['burst', 'sweep', 'fill', 'column', 'zone', 'wall', 'ring'].includes(e.type));
  // a single target is still one cell: S2's promise is that every hit hex is marked, including this one
  if (!hit.length) hit.push({ type: 'fill', cells: cast.cells, t0: 0.42, t1: 0.8 });
  out.push({ cells: cast.cells, ground: (x, y, k) => {
    if (!set.has(k)) return null;
    const { e: ed, dir, q, r } = edgeOf(x, y), [dq, dr] = DIRS[dir], rim = !set.has(key(q + dq, r + dr));
    let col = null;
    if (tel && t <= tel.t1 + 0.4) {
      const fade = t > tel.t1 ? 1 - (t - tel.t1) / 0.4 : 1;
      if (rim && ed > 0.84) col = alphaHex(cast.cols[0], 0.85 * fade);
      else if (ed > 0.9) col = alphaHex(cast.cols[1], 0.3 * fade);                             // inner cell borders, faint
      else if ((Math.floor(x * 12) + Math.floor(y * 12 / 0.62)) % 5 === 0) col = alphaHex(cast.cols[1], 0.35 * fade);
    }
    for (const e of hit) {
      const [cq, cr] = [q, r], t0 = cellStart(e, [cq, cr], t);
      if (t < t0) continue;
      const persist = e.type === 'zone' || e.type === 'column' || e.type === 'wall' || e.persist;
      const age = (t - t0) / 0.4, a = persist ? 0.32 + (age < 1 ? 0.4 * (1 - age) : 0) : Math.max(0, 0.75 * (1 - age));
      if (a <= 0.01) continue;
      const tint = ed > 0.86 ? cast.cols[3] : mix(cast.cols[1], cast.cols[2], ed * 0.5);
      if (persist && age > 1 && (Math.floor(x * 10) + Math.floor(y * 16)) % 3) { col = col ?? alphaHex(cast.cols[1], 0.2); continue; }
      col = alphaHex(tint, a);
    }
    return col;
  } });
  const s = surfaceLayer(cast, t); if (s) out.push(s);
  // impact light: the area lights the room for the moment it lands
  const b = hit.find(e => t >= e.t0 && t <= e.t0 + 0.3);
  if (b) { const c = cast.cells[Math.floor(cast.cells.length / 2)], [x, y] = toWorld(...(b.at ? cast.target : c)); out[0].lights = [{ x, y, z: 0.5, col: cast.cols[0], r: 3.5, k: 0.8 * (1 - (t - b.t0) / 0.3) }]; }
  return out;
}
