// The "Try it" and "Walk the map" parts of index.html. Only runs when served over http.
import { renderA } from './approaches/A-pixel-paperdoll/gen.js';
import { slicesOf, renderD } from './approaches/D-spritestack/gen.js';
import { RACES, CLASSES, BASES, RARITIES, BIOMES, HAIRS, spec } from './lib/data.js';

const SLOTS = [['mainHand', 'Main hand'], ['offHand', 'Off hand'], ['body', 'Body'], ['head', 'Head'], ['hands', 'Hands'], ['feet', 'Feet'], ['cloak', 'Cloak'], ['amulet', 'Amulet'], ['ring', 'Ring']];

export function mount() {
  const ctl = document.getElementById('controls'); if (!ctl) return;
  const state = { race: 'dwarf', cls: 'paladin', skin: null, hair: HAIRS[2], hairStyle: 0, loadout: { ...CLASSES.find(c => c.id === 'paladin').loadout }, rarity: 'rare', kind: 'B' };
  const field = (label, el) => { const l = document.createElement('label'); l.textContent = label; ctl.append(l, el); return el; };
  const select = (opts, value, on) => { const s = document.createElement('select'); for (const [v, t] of opts) s.append(new Option(t, v)); s.value = value ?? ''; s.onchange = () => on(s.value); return s; };

  const raceSel = field('Race', select(RACES.map(r => [r.id, r.name]), state.race, v => { state.race = v; state.skin = null; skinSel.value = RACES.find(r => r.id === v).skins[0]; redraw(); }));
  const clsSel = field('Class kit', select(CLASSES.map(c => [c.id, c.name]), state.cls, v => { state.cls = v; state.loadout = { ...CLASSES.find(c => c.id === v).loadout }; syncSlots(); redraw(); }));
  const skinSel = field('Skin', Object.assign(document.createElement('input'), { type: 'color', value: RACES.find(r => r.id === state.race).skins[0] }));
  skinSel.oninput = () => { state.skin = skinSel.value; redraw(); };
  const hairSel = field('Hair', Object.assign(document.createElement('input'), { type: 'color', value: state.hair }));
  hairSel.oninput = () => { state.hair = hairSel.value; redraw(); };
  field('Hair style', select([[0, 'short'], [1, 'long'], [2, 'bun'], [3, 'crop']], 0, v => { state.hairStyle = Number(v); redraw(); }));
  const slotSels = {};
  for (const [slot, label] of SLOTS) slotSels[slot] = field(label, select([['', '—'], ...BASES.filter(b => b.slot === slot).map(b => [b.id, b.name])], state.loadout[slot], v => { if (v) state.loadout[slot] = v; else delete state.loadout[slot]; redraw(); }));
  function syncSlots() { for (const [slot] of SLOTS) slotSels[slot].value = state.loadout[slot] ?? ''; }
  field('Rarity (all)', select(RARITIES.map(r => [r.id, r.name]), state.rarity, v => { state.rarity = v; redraw(); }));
  field('3D view', select([['B', 'B · voxel'], ['C', 'C · pixel-3D']], 'B', v => { state.kind = v; redraw(); }));
  const row = document.createElement('div'); row.className = 'row2'; ctl.append(row);
  const rnd = Object.assign(document.createElement('button'), { className: 'b', textContent: 'Random' });
  rnd.onclick = () => {
    const R = RACES[Math.floor(Math.random() * RACES.length)], C = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    state.race = R.id; state.cls = C.id; state.loadout = { ...C.loadout }; state.skin = R.skins[Math.floor(Math.random() * R.skins.length)]; state.hair = HAIRS[Math.floor(Math.random() * HAIRS.length)];
    for (const [slot] of SLOTS) if (Math.random() < 0.35) { const l = BASES.filter(b => b.slot === slot); state.loadout[slot] = l[Math.floor(Math.random() * l.length)].id; }
    state.rarity = RARITIES[Math.floor(Math.random() * 5)].id; raceSel.value = state.race; clsSel.value = state.cls; skinSel.value = state.skin; hairSel.value = state.hair; syncSlots(); redraw();
  };
  row.append(rnd);

  const cvA = document.getElementById('cvA'), gA = cvA.getContext('2d');
  const cvD = document.getElementById('cvD'), gD = cvD.getContext('2d');
  const if3d = document.getElementById('if3d'), lbl = document.getElementById('lbl3d');
  gA.imageSmoothingEnabled = gD.imageSmoothingEnabled = false;
  let cur, stack, frames, back, t3d;
  function current() { const s = spec({ race: state.race, cls: state.cls, skin: state.skin ?? undefined, hair: state.hair, hairStyle: state.hairStyle, loadout: { ...state.loadout }, rarity: Object.fromEntries(SLOTS.map(([s]) => [s, state.rarity])) }); return s; }
  function redraw() {
    cur = current();
    frames = [0, 1, 2, 3].map(f => renderA(cur, { anim: 'walk', frame: f }).toCanvas(1));
    back = renderA(cur, { facing: 'back' }).toCanvas(1);
    stack = slicesOf(cur);
    clearTimeout(t3d);
    t3d = setTimeout(() => {
      const s = { race: state.race, cls: state.cls, skin: state.skin ?? undefined, hair: state.hair, hairStyle: state.hairStyle, loadout: state.loadout, rarity: Object.fromEntries(SLOTS.map(([x]) => [x, state.rarity])) };
      if3d.src = `approaches/gallery3d.html?k=${state.kind}&m=one&w=360&h=420&px=${state.kind === 'C' ? 3 : 2}&span=2.4&ry=-0.3&a=walk&s=${encodeURIComponent(JSON.stringify(s))}`;
      lbl.textContent = state.kind;
    }, 250);
  }
  redraw();
  let last = 0, ang = 0.5, f = 0;
  const loop = t => {
    if (t - last > 140) {
      last = t; f = (f + 1) % 4; ang += 0.16;
      gA.clearRect(0, 0, cvA.width, cvA.height);
      gA.drawImage(frames[f], 0, 0, 56, 72, 0, -8 * 4 + 40, 224, 288);
      gA.drawImage(back, 0, 0, 56, 72, 226, 136, 112, 144);
      gD.clearRect(0, 0, cvD.width, cvD.height);
      gD.drawImage(renderD(stack, ang).toCanvas(1), 0, 0, 64, 80, 0, 0, 192, 240);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // map explorer
  const mc = document.getElementById('mapControls'), ifMap = document.getElementById('ifMap');
  if (mc) {
    const m = { b: 'cisterns', s: 'textured', c: 'A' };
    const put = (label, el) => { const l = document.createElement('label'); l.textContent = label; mc.append(l, el); };
    const upd = () => { ifMap.src = `map/demo3d.html?b=${m.b}&s=${m.s}&c=${m.c}&w=780&h=560&px=2`; };
    put('Biome', select(BIOMES.map(b => [b.id, b.name]), m.b, v => { m.b = v; upd(); }));
    put('Style', select([['textured', 'M1 · textured'], ['voxel', 'M2 · voxel']], m.s, v => { m.s = v; upd(); }));
    put('Party', select([['A', 'A · paper-doll'], ['B', 'B · voxel'], ['C', 'C · pixel-3D'], ['D', 'D · stacked'], ['E', 'E · baked']], m.c, v => { m.c = v; upd(); }));
    upd();
  }
}
