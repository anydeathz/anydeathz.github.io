// The renovation's numbers, measured from the game's own code (imported read-only).
//   node --experimental-transform-types docs/renovation/tools/measure.mjs [out.json]
// A · corridors — how many corridor cells sit inside a fully open three-wide band
// B · shoving   — how far bodies that are *not moving themselves* get pushed, per engaged second
// C · wall tops — closed cells beside the floor, and edges where the drawn top steps height with no face
import { writeFileSync } from 'node:fs';
const SRC = new URL('../../../frontend/src/', import.meta.url).href;
const imp = (p) => import(SRC + p);
const { setDemoEnabled } = await imp('config/demo.ts'); setDemoEnabled(false);
const { Floor } = await imp('sim/dungeon/Floor.ts');
const { isWalkable, isGround, TILE } = await imp('sim/dungeon/tiles.ts');
const { neighbours, cellCenter, cellDistance } = await imp('core/math/hex.ts');
const { quickStartParty } = await imp('sim/party/roster.ts');
const { Run } = await imp('sim/Run.ts');
const { isAlive } = await imp('sim/combat/combatant.ts');

const out = {};

// ── A ──
{
  let corridor = 0, wide = 0, floors = 0, narrowest = [];
  for (let depth = 1; depth <= 24; depth++) {
    const f = new Floor(depth, 'measure'); floors++;
    const open = (c, r) => c >= 0 && r >= 0 && c < f.width && r < f.height && isWalkable(f.tiles[r * f.width + c]);
    const disc = (c, r) => open(c, r) && neighbours(c, r).every((n) => open(n.col, n.row));
    let fc = 0, fw = 0;
    for (let r = 0; r < f.height; r++) for (let c = 0; c < f.width; c++) {
      if (!open(c, r) || f.rooms.some((room) => room.contains(c, r))) continue;
      fc++;
      if (disc(c, r) || neighbours(c, r).some((n) => disc(n.col, n.row))) fw++;
    }
    corridor += fc; wide += fw; narrowest.push(fc ? fw / fc : 1);
  }
  out.corridors = { floors, corridorCells: corridor, inThreeWideBand: wide, fraction: +(wide / corridor).toFixed(3), worstFloor: +Math.min(...narrowest).toFixed(3) };
}

// ── B: pushes applied by separation to bodies that did not move themselves this tick ──
// Pass five had no notion of "moved", so the before figure comes from the position-replay method recorded in
// shots/before/measure.json; from pass six on, sim/combat/separation.ts counts it at the source.
{
  const sep = await imp('sim/combat/separation.ts');
  let combatSeconds = 0;
  if (sep.separationStats) { sep.separationStats.pushedStill = 0; sep.separationStats.worstStill = 0; sep.separationStats.pushedMovers = 0; sep.separationStats.bigStill = 0; }
  for (const seed of ['m-a', 'm-b', 'm-c']) {
    const party = quickStartParty(seed, 4), run = new Run(party, seed, 3);
    for (let t = 0; t < 6000; t++) { if (run.encounter.inCombat && !run.encounter.cleared) combatSeconds += 0.1; run.tick(0.1); }
  }
  const st = sep.separationStats ?? { pushedStill: NaN, worstStill: NaN, pushedMovers: NaN };
  out.shoving = { combatSeconds: +combatSeconds.toFixed(1), shovePerEngagedSecond: +(st.pushedStill / combatSeconds).toFixed(4), worstSingleTick: +st.worstStill.toFixed(3), moverGiveWayPerSecond: +(st.pushedMovers / combatSeconds).toFixed(4), bigShovesPer100s: +((st.bigStill ?? 0) / combatSeconds * 100).toFixed(2) };
}

// ── C: wall tops, read back from the mesher's actual geometry ──
// Builds each floor with render/tiles/HexMesher.ts (three runs in Node) and inspects the triangles: every closed
// cell must have a top (else void), and every edge where two neighbours' tops differ in height — facing the
// camera — must carry a face quad spanning the step. Pass five had no prisms; its figure is in before/.
{
  const { HexMesher } = await imp('render/tiles/HexMesher.ts');
  const { cellAt: at } = await imp('core/math/hex.ts');
  let topped = 0, closedCells = 0, steps = 0, faced = 0, voids = 0, sunkSteps = 0, sunkFaced = 0;
  const TOWARD = { x: Math.SQRT1_2, y: Math.SQRT1_2 };
  for (let depth = 1; depth <= 8; depth++) {
    const f = new Floor(depth, 'measure');
    const m = new HexMesher();
    m.build({ width: f.width, height: f.height, tileAtCell: (c, r) => f.tileAtCell(c, r) }, f.biome.biome);
    const meshes = m.group.children.filter((o) => o.isMesh && !o.isInstancedMesh);
    const byTex = (w) => meshes.find((o) => o.material.map?.image?.width === w);
    // tops: the masonry ring (cap texture, 160 wide) and the flat rock beyond it (lit, untextured)
    // Two passes: walls standing, and every cuttable wall sunk to its stub (part two §7: the shader does this near
    // the party, so the mass must be watertight both ways).
    for (const sunk of [false, true]) {
    const STUB = 0.3;
    const yOf = (attr, cutAttr, k) => { const y = attr.getY(k); return sunk && cutAttr && cutAttr.getX(k) > 0.5 && y > STUB + 0.001 ? STUB : y; };
    // by role (HexMesher names its meshes): masonry tops and rock crowns; brick faces and rock faces
    const tops = meshes.filter((o) => o.name === 'tops' || o.name === 'rock');
    const faceMeshes = meshes.filter((o) => o.name === 'faces' || o.name === 'rockFaces');
    const H = new Map();
    for (const top of tops) {
      const tp = top.geometry.getAttribute('position'), tc = top.geometry.getAttribute('aCut');
      for (let t = 0; t < tp.count; t += 3) {
        const cx = (tp.getX(t) + tp.getX(t + 1) + tp.getX(t + 2)) / 3, cz = (tp.getZ(t) + tp.getZ(t + 1) + tp.getZ(t + 2)) / 3;
        // a cell's height is its top's *edge* — the lowest vertex; peaks and stalagmites rise above it
        const c = at(cx, cz), k = `${c.col},${c.row}`, y = Math.min(yOf(tp, tc, t), yOf(tp, tc, t + 1), yOf(tp, tc, t + 2));
        H.set(k, Math.min(H.get(k) ?? Infinity, y));
      }
    }
    const faceAt = new Map();
    for (const faces of faceMeshes) {
      const fp = faces.geometry.getAttribute('position'), fc = faces.geometry.getAttribute('aCut');
      for (let t = 0; t < fp.count; t += 6) {
        let mx = 0, mz = 0, lo = Infinity, hi = -Infinity;
        for (let k = 0; k < 6; k++) { mx += fp.getX(t + k) / 6; mz += fp.getZ(t + k) / 6; lo = Math.min(lo, yOf(fp, fc, t + k)); hi = Math.max(hi, yOf(fp, fc, t + k)); }
        // two cells that can both sink each face their shared edge: keep every face on an edge, not the last
        const key = `${Math.round(mx * 20)},${Math.round(mz * 20)}`;
        (faceAt.get(key) ?? faceAt.set(key, []).get(key)).push([lo, hi]);
      }
    }
    const open = (c, r) => isGround(f.tileAtCell(c, r));
    for (let r = 0; r < f.height; r++) for (let c = 0; c < f.width; c++) {
      if (open(c, r)) continue;
      if (!sunk) closedCells++;
      const h = H.get(`${c},${r}`);
      if (h === undefined) { voids++; continue; }
      if (!sunk) topped++;
      const cc = cellCenter(c, r);
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 3 * i, nx = Math.cos(a), ny = Math.sin(a);
        const nb = at(cc.x + nx, cc.y + ny);
        if (nb.col < 0 || nb.row < 0 || nb.col >= f.width || nb.row >= f.height) continue;
        const hn = open(nb.col, nb.row) ? 0 : H.get(`${nb.col},${nb.row}`);
        if (hn === undefined || hn >= h - 1e-6) continue;
        if (nx * TOWARD.x + ny * TOWARD.y < -0.55) continue;      // faces away from the camera: never seen
        if (sunk) sunkSteps++; else steps++;
        const mid = [cc.x + nx * 0.5, cc.y + ny * 0.5];
        const onEdge = faceAt.get(`${Math.round(mid[0] * 20)},${Math.round(mid[1] * 20)}`) ?? [];
        if (onEdge.some((face) => face[0] <= hn + 1e-3 && face[1] >= h - 1e-3)) { if (sunk) sunkFaced++; else faced++; }
      }
    }
    }
    m.clear();
  }
  out.wallTops = { floors: 8, closedCells, toppedCells: topped, visibleHeightSteps: steps, facedSteps: faced, unfacedHeightSteps: steps - faced, edgesIntoVoid: voids, sunkVisibleSteps: sunkSteps, sunkUnfaced: sunkSteps - sunkFaced };
}

console.log(JSON.stringify(out, null, 2));
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
