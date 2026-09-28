// The cast matrix in M1 (three.js): one arena scene, built once; each frame adds a cast's group, renders
// at ⅓ resolution, copies the pixels out, and removes it again.
import { mapScene } from '../../character-proposals/map/render3d.js';
import { actor } from '../../character-proposals/map/actors3d.js';
import { BIOMES, spec, CREATURES } from '../../character-proposals/lib/data.js';
import { toWorld } from '../../character-proposals/lib/hex.js';
import { arena, MATRIX } from './arena.js';
import { PHASES } from '../casts/cast.js';
import { matrixCast, CASTER, TARGET, CHAIN } from '../shots-extra.js';

const MOD = { S4: '../casts/S4-toon-mesh/fx3d.js', S5: '../casts/S5-voxel-particles/fx3d.js', S1g: '../casts/S1-pixel-particles/fx3d.js', S2g: '../casts/S2-hex-decals/fx3d.js' };
export async function arenaScene(biomeId = 'cisterns', { w = 360, h = 240, px = 2, zoom = 21 / px } = {}) {
  const biome = BIOMES.find(b => b.id === biomeId), host = document.createElement('div');
  const S = mapScene(host, arena(4), biome, { w, h, px, focus: toWorld(-0.3, 0.4), zoom, lights: 4 });
  const place = (o, [q, r]) => { const [x, y] = toWorld(q, r); o.position.set(x, 0, y); S.scene.add(o); };
  place(actor('A', spec({ cls: 'wizard', race: 'elf', hairStyle: 1 })), CASTER);
  const cs = c => ({ ...spec({ race: 'human', cls: 'fighter', loadout: c.loadout ?? {}, skin: c.skin }), form: c.form, name: c.name, skin: c.skin, h: c.h, w: c.w, loadout: c.loadout ?? {} });
  [[CREATURES[0], TARGET], [CREATURES[2], CHAIN[0]], [CREATURES[7], CHAIN[1]]].forEach(([c, p]) => place(actor('A', c), p));
  return S;
}
export function snapScene(S, t) { S.frame(t); const c = document.createElement('canvas'); c.width = S.renderer.domElement.width; c.height = S.renderer.domElement.height; c.getContext('2d').drawImage(S.renderer.domElement, 0, 0); return c; }

export async function matrix3d(ap, { group, fig, q }) {
  const { fx3d } = await import(MOD[ap]);
  const S = await arenaScene(q.get('b') ?? 'cisterns', { w: Number(q.get('w') ?? 360), h: Number(q.get('h') ?? 216), px: Number(q.get('px') ?? 1) });
  const gl = S.renderer.getContext(), times = [], calls = [], tris = [];
  const only = q.get('only');
  for (const [name, label, opt] of MATRIX) {
    if (only && !only.split(',').includes(name)) continue;
    const c = matrixCast(name, opt ?? {}), row = group(`${name} — ${label}`);
    for (const [ph, t] of PHASES) {
      const t0 = performance.now(); const g = fx3d(c, t); S.scene.add(g); const snap = snapScene(S, t); gl.finish(); times.push(performance.now() - t0);
      calls.push(S.renderer.info.render.calls); tris.push(S.renderer.info.render.triangles);
      S.scene.remove(g); g.traverse(o => { o.geometry?.dispose?.(); o.material?.map?.dispose?.(); });
      const out = document.createElement('canvas'); out.width = snap.width; out.height = snap.height; const x = out.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(snap, 0, 0); out.style.width = (Number(q.get('w') ?? 360)) + 'px'; out.style.imageRendering = 'pixelated';
      fig(out, ph, row);
    }
  }
  const med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
  window.__metrics = { approach: ap, frames: times.length, frameMsMedian: +med(times).toFixed(2), callsMedian: med(calls), callsMax: Math.max(...calls), trisMedian: med(tris), trisMax: Math.max(...tris) };
}
