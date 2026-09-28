// Full scenes: a real hex dungeon (character-proposals' generator), the A-sprite party, foes, loot on the
// floor, a chest, a surface pair (grease meeting fire), and one signature cast per biome — in M3 (2D)
// and in M1 (three.js). The recommended pairing draws casts as S1 (air) + S2 (ground).
import { generateDungeon, toWorld, isFloor, DIRS, key } from '../../character-proposals/lib/hex.js';
import { BIOMES, spec, CREATURES } from '../../character-proposals/lib/data.js';
import { renderA } from '../../character-proposals/approaches/A-pixel-paperdoll/gen.js';
import { renderCreatureA } from '../../character-proposals/approaches/A-pixel-paperdoll/creatures.js';
import { spell } from '../lib/spells.js';
import { object } from '../lib/items.js';
import { makeCast } from '../casts/cast.js';
import { disc } from '../lib/hexarea.js';
import { surfaceAt } from '../casts/surfaces.js';
import { edgeOf } from '../casts/common.js';
import { renderO1 } from '../objects/O1-pixel/icon.js';

export const SIGNATURE = { cisterns: 'Lightning Bolt', ossuary: 'Spirit Guardians', fungalReach: 'Cloudkill', cinderworks: 'Fireball', drownedVault: 'Call Lightning', rimehollow: 'Cone of Cold', sableCourt: 'Hypnotic Pattern', wyrmDeeps: 'Wall of Fire' };
const LOOT = [['longsword', 'rare'], ['potionHealing', 'common'], ['scroll.wizard.fireball', 'uncommon'], ['reagentUnicornHorn', 'veryRare'], ['signet', 'legendary']];

export function surfacePatch(kind, center, r) {
  const cells = disc(center, r), set = new Set(cells.map(c => key(...c)));
  return { cells, ground: (x, y, k, t) => { if (!set.has(k)) return null; const { e, dir, q, r: rr } = edgeOf(x, y), [dq, dr] = DIRS[dir]; return surfaceAt(kind, x, y, t, set.has(key(q + dq, rr + dr)) ? 1 : Math.max(0, (1 - e) * 4)); } };
}
export function layout(biomeId, seed = 'demo') {
  const biome = BIOMES.find(b => b.id === biomeId), map = generateDungeon(seed);
  const [eq, er] = map.entry, [sq, sr] = map.rooms[1].c;
  const ring = DIRS.map(([a, b]) => [eq + a, er + b]).filter(([a, b]) => isFloor(map, a, b));
  const party = [['fighter', 'dwarf'], ['wizard', 'elf'], ['ranger', 'halfOrc'], ['cleric', 'human']].map(([cls, race], i) => ({ spec: spec({ cls, race, hairStyle: i }), at: i === 0 ? [eq, er] : ring[i - 1] }));
  const foes = [[CREATURES[0], [sq, sr]], [CREATURES[2], [sq + 1, sr]], [CREATURES[3], [sq - 1, sr + 1]]].filter(([, p]) => isFloor(map, ...p));
  // loot lies between the party and the room: the floor cells nearest the midpoint
  const mid = [Math.round((eq + sq) / 2), Math.round((er + sr) / 2)];
  const floorNear = (p, n) => [...map.cells.values()].filter(c => c.t === 1).map(c => [c.q, c.r]).sort((a, b) => Math.hypot(...toWorld(...a).map((v, i) => v - toWorld(...p)[i])) - Math.hypot(...toWorld(...b).map((v, i) => v - toWorld(...p)[i]))).slice(0, n);
  const lootCell = floorNear(mid, 1)[0], chestCell = floorNear([mid[0] - 1, mid[1] + 1], 2)[1];
  const caster = party[1].at, sig = spell(SIGNATURE[biomeId]);
  const self = sig.area.shape === 'aura' || sig.area.shape === 'cone' || sig.area.shape === 'line';
  const cast = makeCast(sig, sig.area.shape === 'aura' ? party[3].at : caster, [sq, sr], sig.delivery === 'bolt' ? { chainTo: foes.slice(1).map(f => f[1]) } : {});
  // the cast only exists where there is floor: cells over rock are dropped, as the sim would
  const onFloor = c => isFloor(map, ...c); cast.cells = cast.cells.filter(onFloor); for (const e of cast.emitters) if (e.cells) e.cells = e.cells.filter(onFloor);
  const surfaces = [surfacePatch('grease', floorNear([sq - 2, sr + 2], 1)[0], 1.3), surfacePatch('fire', floorNear([sq - 3, sr + 2], 1)[0], 0.9), surfacePatch('web', floorNear([eq + 2, er - 2], 1)[0], 0.9)];
  return { biome, map, party, foes, lootCell, chestCell, cast, surfaces, focus: toWorld((eq + sq) / 2, (er + sr) / 2 - 0.5), mid };
}
/** Loot as world-placed sprites: O1 icons at 18 px, fanned inside one hex, each with a rarity ring. */
export function lootSprites(L, size = 18) {
  const [cx, cy] = toWorld(...L.lootCell), out = [];
  LOOT.forEach(([id, rar], i) => { const a = i / LOOT.length * 6.283 + 0.4, r = i ? 0.55 : 0; const o = { ...object(id), rarity: rar }; out.push({ sprite: renderO1(o, { size }), world: [cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.8], ax: size / 2, ay: size - 3, shadow: 4, rarity: rar }); });
  const [hx, hy] = toWorld(...L.chestCell);
  out.push({ sprite: renderO1({ kind: 'chest', id: 'chest', vis: { open: true, glow: '#a87fd6' }, rarity: 'common' }, { size: 26 }), world: [hx, hy], ax: 13, ay: 22, shadow: 9 });
  return out;
}
export function actorSprites(L) {
  return [...L.party.map(p => ({ sprite: renderA(p.spec, { anim: 'idle' }), q: p.at[0], r: p.at[1], party: true })), ...L.foes.map(([c, p]) => ({ sprite: renderCreatureA(c), q: p[0], r: p[1] }))];
}
/** A rarity ring under each loot sprite (a ground layer): the rule is the same as the icon's rim. */
export function lootRings(sprites) {
  const RING = { uncommon: '#6faf63', rare: '#5c93dc', veryRare: '#a87fd6', legendary: '#e0b255' };
  const rs = sprites.filter(s => RING[s.rarity]);
  return { draw(api) { for (const s of rs) { const [X, Y] = api.px(...s.world); for (let a = 0; a < 40; a++) { const t = a / 40 * 6.283; api.add(X + Math.cos(t) * 7, Y + Math.sin(t) * 2.6, RING[s.rarity], 0.55, s.world[1] + 0.3); } } } };
}

export async function scene2d(what, { group, fig, q }) {
  const { makeMap2D, present } = await import('./render2d-fx.js');
  const S1 = await import('../casts/S1-pixel-particles/fx.js'), S2 = await import('../casts/S2-hex-decals/fx.js'), S3 = await import('../casts/S3-field/fx.js');
  const ids = what === 'all' ? BIOMES.map(b => b.id) : what.split(',');
  const W = Number(q.get('w') ?? 330), H = Number(q.get('h') ?? 220), K = Number(q.get('k') ?? 2), T = Number(q.get('t') ?? 0.6), mode = q.get('fx') ?? 'S1S2';
  const r = group(`M3 · casts as ${mode === 'S1S2' ? 'S1 particles + S2 hex decals' : mode} · t = ${T}`), metrics = [];
  for (const id of ids) {
    const L = layout(id), sprites = [...actorSprites(L), ...lootSprites(L)];
    const M = makeMap2D({ map: L.map, biome: L.biome, cam: L.focus, w: W, h: H });
    const fxs = t => [...L.surfaces, lootRings(sprites), ...(mode.includes('S2') ? S2.fx2d(L.cast, t) : []), ...(mode.includes('S1') ? S1.fx2d(L.cast, t) : []), ...(mode.includes('S3') ? S3.fx2d(L.cast, t) : [])];
    const times = []; let img; for (let i = 0; i < 9; i++) { const t0 = performance.now(); img = M.frame(sprites, T, fxs(T)); times.push(performance.now() - t0); }
    const base = []; for (let i = 0; i < 9; i++) { const t0 = performance.now(); M.frame(sprites, T, []); base.push(performance.now() - t0); }
    times.sort((a, b) => a - b); base.sort((a, b) => a - b);
    metrics.push({ biome: id, spell: SIGNATURE[id], bakeMs: +M.bakeMs.toFixed(0), frameMs: +times[4].toFixed(2), frameNoFxMs: +base[4].toFixed(2) });
    fig(present(img, document.createElement('canvas'), K), `${L.biome.name} · ${SIGNATURE[id]}`, r);
  }
  window.__metrics = { mode, w: W, h: H, t: T, scenes: metrics };
}

export async function scene3d(what, { group, fig, q }) {
  const { mapScene } = await import('../../character-proposals/map/render3d.js');
  const { actor, billboard } = await import('../../character-proposals/map/actors3d.js');
  const { groundMesh } = await import('../casts/ground3d.js');
  const [biomeId, ap = 'S1S2'] = what.split(':');
  const L = layout(biomeId), W = Number(q.get('w') ?? 660), H = Number(q.get('h') ?? 460), px = Number(q.get('px') ?? 2), T = Number(q.get('t') ?? 0.6);
  const host = document.createElement('div'); document.body.append(host); host.style.cssText = 'position:absolute;left:-9999px';
  const S = mapScene(host, L.map, L.biome, { w: W, h: H, px, focus: L.focus, zoom: 21 / px });
  const place = (o, p) => { const [x, y] = Array.isArray(p[0]) ? p : toWorld(...p); o.position.set(x, 0, y); S.scene.add(o); };
  L.party.forEach(p => place(actor('A', p.spec), p.at)); L.foes.forEach(([c, p]) => place(actor('A', c), p));
  const loot = lootSprites(L); loot.forEach(s => { const b = billboard(s.sprite.toCanvas(1), s.ay); const [x, y] = s.world; b.position.set(x, 0, y); S.scene.add(b); });
  S.scene.add(groundMesh(L.surfaces, T));
  const mods = { S1: '../casts/S1-pixel-particles/fx3d.js', S2: '../casts/S2-hex-decals/fx3d.js', S4: '../casts/S4-toon-mesh/fx3d.js', S5: '../casts/S5-voxel-particles/fx3d.js' };
  for (const k of ['S1', 'S2', 'S4', 'S5']) if (ap.includes(k)) S.scene.add((await import(mods[k])).fx3d(L.cast, T));
  const gl = S.renderer.getContext(), ts = [];
  for (let i = 0; i < 30; i++) { const t0 = performance.now(); S.frame(T); gl.finish(); ts.push(performance.now() - t0); }
  ts.sort((a, b) => a - b);
  const c = document.createElement('canvas'); c.width = S.renderer.domElement.width; c.height = S.renderer.domElement.height; c.getContext('2d').drawImage(S.renderer.domElement, 0, 0);
  c.style.width = W + 'px'; c.style.imageRendering = 'pixelated';
  fig(c, `${L.biome.name} · ${SIGNATURE[biomeId]} · ${ap}`, group(`M1 · three.js · ${ap}`));
  window.__metrics = { biome: biomeId, ap, frameMsMedian: +ts[15].toFixed(2), calls: S.renderer.info.render.calls, triangles: S.renderer.info.render.triangles };
}

/** Loot at map scale: every rarity, and a pile, at ×1 and ×3, on a biome floor. */
export async function lootShot(what, { group, fig, q }) {
  const { makeMap2D, present } = await import('./render2d-fx.js');
  const { arena } = await import('./arena.js');
  const biome = BIOMES.find(b => b.id === (what || 'ossuary'));
  const L = { lootCell: [0, 0], chestCell: [-2, 1] }, sprites = lootSprites(L);
  const M = makeMap2D({ map: arena(3), biome, cam: toWorld(-0.6, 0.3), w: 200, h: 120, torchEvery: 3 });
  const img = M.frame([...sprites, { sprite: renderA(spec({ cls: 'rogue', race: 'halfling' })), q: 2, r: 0, party: true }], 0.3, [lootRings(sprites)]);
  const r = group(`loot on the floor · ${biome.name} · O1 icons at 18 px, rarity ring beneath`);
  fig(present(img, document.createElement('canvas'), 1), '×1 — as on a phone', r); fig(present(img, document.createElement('canvas'), 3), '×3', r);
}

/** O4's reason to exist: one volume, any angle. */
export async function turntable({ group, fig }) {
  const { stackOf, renderO4 } = await import('../objects/O4-stack/icon.js');
  for (const id of ['greataxe', 'potionSupremeHealing', 'towerShield', 'reagentUnicornHorn']) { const st = stackOf(object(id)), r = group(object(id).name); for (let i = 0; i < 8; i++) fig(renderO4(st, i / 8 * 6.283).toCanvas(2), `${i * 45}°`, r); }
}
