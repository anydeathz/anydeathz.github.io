// The non-object shots: cast matrices (S1…S5), the hex area atlas, map scenes. See shots.html.
import { spell, SPELLS } from './lib/spells.js';
import { makeCast, PHASES } from './casts/cast.js';
import { arena, MATRIX } from './map/arena.js';
import { BIOMES, spec, CREATURES } from '../character-proposals/lib/data.js';
import { renderA } from '../character-proposals/approaches/A-pixel-paperdoll/gen.js';
import { renderCreatureA } from '../character-proposals/approaches/A-pixel-paperdoll/creatures.js';

export const CASTER = [-3, 1], TARGET = [2, -1], CHAIN = [[3, 0], [1, 1]];
export function matrixCast(name, opt = {}) {
  const s = spell(name); const look = { ...s, area: { ...s.area, ...(opt.ft ? { ft: opt.ft, hex: undefined } : {}), ...(opt.halfDeg ? { halfDeg: opt.halfDeg } : {}), ...(opt.width ? { width: opt.width } : {}) } };
  const self = ['self'].includes(s.delivery) || ['cone', 'line', 'aura'].includes(s.area.shape);
  return makeCast(look, CASTER, self && s.area.shape !== 'aura' && s.area.shape !== 'cone' && s.area.shape !== 'line' ? CASTER : TARGET, opt.chain ? { chainTo: CHAIN } : {});
}
export function arenaSprites() {
  const wiz = spec({ cls: 'wizard', race: 'elf', hairStyle: 1 });
  return [{ sprite: renderA(wiz, { anim: 'attack', frame: 2 }), q: CASTER[0], r: CASTER[1], party: true },
    { sprite: renderCreatureA(CREATURES[0]), q: TARGET[0], r: TARGET[1] }, { sprite: renderCreatureA(CREATURES[2]), q: CHAIN[0][0], r: CHAIN[0][1] }, { sprite: renderCreatureA(CREATURES[7]), q: CHAIN[1][0], r: CHAIN[1][1] }];
}
const D2 = { S1: './casts/S1-pixel-particles/fx.js', S2: './casts/S2-hex-decals/fx.js', S3: './casts/S3-field/fx.js' };

export async function render(shot, { stage, group, fig, q }) {
  const [ap, what] = shot.split(/-(.+)/);
  if (D2[ap] && what === 'matrix') return matrix2d(ap, { stage, group, fig, q });
  if ((ap === 'S4' || ap === 'S5' || ap === 'S1g' || ap === 'S2g') && what === 'matrix') return (await import('./map/matrix3d.js')).matrix3d(ap, { stage, group, fig, q });
  if (ap === 'hex') return (await import('./map/hexatlas.js')).hexAtlas({ stage, group, fig, q });
  if (ap === 'map2d') return (await import('./map/scenes.js')).scene2d(what, { stage, group, fig, q });
  if (ap === 'map3d') return (await import('./map/scenes.js')).scene3d(what, { stage, group, fig, q });
  if (ap === 'loot') return (await import('./map/scenes.js')).lootShot(what, { stage, group, fig, q });
  if (ap === 'baseline') return (await import('./map/baseline.js')).baseline({ stage, group, fig, q });
  if (ap === 'turn') return (await import('./map/scenes.js')).turntable({ stage, group, fig, q });
  throw new Error('unknown shot ' + shot);
}

async function matrix2d(ap, { group, fig, q }) {
  const { makeMap2D, present } = await import('./map/render2d-fx.js');
  const { fx2d } = await import(D2[ap]);
  const biome = BIOMES.find(b => b.id === (q.get('b') ?? 'cisterns'));
  const W = Number(q.get('w') ?? 360), H = Number(q.get('h') ?? 216), k = Number(q.get('k') ?? 1);
  const M = makeMap2D({ map: arena(4), biome, cam: [-0.2, 0.6], w: W, h: H, torchEvery: 3 });
  const sprites = arenaSprites(), times = [];
  const only = q.get('only');
  for (const [name, label, opt] of MATRIX) {
    if (only && !only.split(',').includes(name)) continue;
    const c = matrixCast(name, opt ?? {}), row = group(`${name} — ${label}`);
    for (const [ph, t] of PHASES) { const t0 = performance.now(); const img = M.frame(sprites, t, fx2d(c, t)); times.push(performance.now() - t0); fig(present(img, document.createElement('canvas'), k), ph, row); }
  }
  times.sort((a, b) => a - b);
  window.__metrics = { approach: ap, frames: times.length, frameMsMedian: +times[times.length >> 1].toFixed(2), frameMsP95: +times[Math.floor(times.length * 0.95)].toFixed(2), bakeMs: +M.bakeMs.toFixed(1), w: W, h: H };
}
