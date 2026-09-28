// The live "Try it" benches on index.html. Two: any object through all five object approaches, and any
// spell cast in a hex arena through the 2D cast approaches, scrubbable in time.
import { OBJECTS, CATALOGUE_SCROLLS } from './lib/items.js';
import { SPELLS } from './lib/spells.js';
import { RARITY_ORDER } from './lib/palette.js';
import { BIOMES } from '../character-proposals/lib/data.js';

const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const label = t => el('label', { textContent: t });

export async function mount() {
  await objectBench();
  await castBench();
}

async function objectBench() {
  const host = document.getElementById('objControls'), stage = document.getElementById('objStage');
  if (!host) return;
  const [O1, O2, O3, O4, O5] = await Promise.all(['O1-pixel/icon.js', 'O2-vector/icon.js', 'O3-voxel/icon.js', 'O4-stack/icon.js', 'O5-lathe3d/icon.js'].map(p => import('./objects/' + p)));
  const kinds = {}; for (const o of [...OBJECTS, ...CATALOGUE_SCROLLS]) (kinds[o.kind] ??= []).push(o);
  const pick = el('select'); for (const [k, list] of Object.entries(kinds)) { const g = el('optgroup', { label: `${k} · ${list.length}` }); for (const o of list) g.append(el('option', { value: o.id, textContent: o.name })); pick.append(g); }
  pick.value = 'potionSupremeHealing';
  const rar = el('select'); for (const r of RARITY_ORDER) rar.append(el('option', { value: r, textContent: r })); rar.value = 'veryRare';
  const ang = el('input', { type: 'range', min: 0, max: 628, value: 60 });
  host.append(label('Object'), pick, label('Rarity'), rar, label('O4 angle'), ang);
  const figs = ['O1 pixel', 'O2 vector', 'O3 voxel', 'O4 stacked', 'O5 toon 3D'].map(n => { const f = el('figure'), c = el('figcaption', { innerHTML: `<b>${n.split(' ')[0]}</b> ${n.split(' ').slice(1).join(' ')}` }); f.append(el('div'), c); stage.append(f); return f.firstChild; });
  const find = id => [...OBJECTS, ...CATALOGUE_SCROLLS].find(o => o.id === id);
  let stack = null;
  const draw = (all = true) => {
    const o = { ...find(pick.value), rarity: rar.value };
    if (all) {
      figs[0].replaceChildren(O1.renderO1(o, { size: 32 }).toCanvas(4));
      const t = document.createElement('template'); t.innerHTML = O2.svgO2(o, { px: 128 }); figs[1].replaceChildren(t.content.firstChild);
      figs[2].replaceChildren(O3.renderO3(o, { n: 32, k: 4 }));
      figs[4].replaceChildren(O5.renderO5(o, { n: 32, k: 4 }));
      stack = O4.stackOf(o);
    }
    figs[3].replaceChildren(O4.renderO4(stack, ang.value / 100).toCanvas(3));
  };
  pick.onchange = rar.onchange = () => draw(true); ang.oninput = () => draw(false);
  draw(true);
}

async function castBench() {
  const host = document.getElementById('castControls'), stage = document.getElementById('castStage');
  if (!host) return;
  const { makeMap2D, present } = await import('./map/render2d-fx.js');
  const { arena } = await import('./map/arena.js');
  const { matrixCast, arenaSprites } = await import('./shots-extra.js');
  const FX = { 'S1 + S2 (recommended)': ['S1', 'S2'], 'S1 particles': ['S1'], 'S2 hex decals': ['S2'], 'S3 field': ['S3'] };
  const mods = { S1: await import('./casts/S1-pixel-particles/fx.js'), S2: await import('./casts/S2-hex-decals/fx.js'), S3: await import('./casts/S3-field/fx.js') };
  const sp = el('select'); const byShape = {}; for (const s of SPELLS) if (s.src !== 'item') (byShape[s.area.shape] ??= []).push(s);
  for (const [k, list] of Object.entries(byShape)) { const g = el('optgroup', { label: `${k} · ${list.length}` }); for (const s of list) g.append(el('option', { value: s.name, textContent: `${s.name}${s.src === 'bg3' ? ' (BG3 draft)' : ''}` })); sp.append(g); }
  sp.value = 'Fireball';
  const bi = el('select'); for (const b of BIOMES) bi.append(el('option', { value: b.id, textContent: b.name }));
  const ap = el('select'); for (const k of Object.keys(FX)) ap.append(el('option', { value: k, textContent: k }));
  const tt = el('input', { type: 'range', min: 0, max: 100, value: 60 });
  const play = el('button', { className: 'b', textContent: 'Play' }), info = el('div', { className: 'mono muted', style: 'grid-column:1/-1' });
  host.append(label('Spell'), sp, label('Biome'), bi, label('Draw with'), ap, label('Time'), tt, el('div', { className: 'row2' }, play), info);
  const canvas = el('canvas'); stage.replaceChildren(canvas);
  let M = null, biome = null, sprites = arenaSprites(), cast = null;
  const bake = () => { biome = BIOMES.find(b => b.id === bi.value); M = makeMap2D({ map: arena(4), biome, cam: [-0.2, 0.6], w: 360, h: 216, torchEvery: 3 }); };
  const setCast = () => { cast = matrixCast(sp.value); const s = cast.look; info.textContent = `${s.name} · ${s.school ?? '—'} · ${s.element} · ${s.delivery} · ${s.area.shape}${s.area.hex ? ` r ${s.area.hex} (game)` : s.area.ft ? ` ${s.area.ft} ft` : ''} · ${cast.cells.length} cells · src ${s.src}`; };
  const draw = () => { const t = tt.value / 100, fx = FX[ap.value].flatMap(k => mods[k].fx2d(cast, t)); const t0 = performance.now(); const img = M.frame(sprites, t, fx); present(img, canvas, 2); canvas.title = `${(performance.now() - t0).toFixed(1)} ms`; };
  bi.onchange = () => { bake(); draw(); }; sp.onchange = () => { setCast(); draw(); }; ap.onchange = tt.oninput = draw;
  let raf = 0; play.onclick = () => { cancelAnimationFrame(raf); const t0 = performance.now(); const step = now => { const u = (now - t0) / 1800; tt.value = Math.min(100, u * 100); draw(); if (u < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
  bake(); setCast(); draw();
}
