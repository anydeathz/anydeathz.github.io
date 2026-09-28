// The furniture showcase (part two §10): every piece, wall piece, litter, torch and chest, in every biome and
// state, drawn by the game's own generator (frontend/src/gen/sprites/props.ts, imported read-only) → PNGs +
// docs/renovation/furniture.html in the renovation pages' design.
//   node --experimental-transform-types docs/renovation/tools/furniture.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const DIR = new URL('../', import.meta.url);
const SRC = new URL('../../../frontend/src/', import.meta.url).href;
const { propFrame, CHEST_DESIGNS } = await import(SRC + 'gen/sprites/props.ts');
const D = await import(SRC + 'data/dressing/index.ts');
const extra = await import(SRC + 'gen/sprites/showcaseExtras.ts').catch(() => null);
mkdirSync(new URL('shots/furniture/', DIR), { recursive: true });

function png(w, h, rgba) {
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
/** A strip of frames, each cell on the biome's own floor tone so the piece is seen as it will be. */
function strip(frames, grounds, cell = 80, scale = 2) {
  const W = frames.length * cell * scale, H = cell * scale, img = new Uint8Array(W * H * 4);
  frames.forEach((f, i) => {
    const g = grounds[i] ?? [26, 21, 18];
    for (let y = 0; y < H; y++) for (let x = i * cell * scale; x < (i + 1) * cell * scale; x++) img.set([g[0], g[1], g[2], 255], (y * W + x) * 4);
    if (!f) return;
    const px = f.sprite.toRGBA(), ox = i * cell + Math.floor((cell - f.sprite.w) / 2), oy = Math.max(0, cell - f.sprite.h - 4);
    for (let y = 0; y < f.sprite.h; y++) for (let x = 0; x < f.sprite.w; x++) {
      const s = (y * f.sprite.w + x) * 4; if (px[s + 3] < 128) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const X = (ox + x) * scale + dx, Y = (oy + y) * scale + dy; if (X >= i * cell * scale && X < (i + 1) * cell * scale && Y >= 0 && Y < H) img.set([px[s], px[s + 1], px[s + 2], 255], (Y * W + X) * 4); }
    }
  });
  return png(W, H, img);
}
const BIOMES = ['cisterns', 'ossuary', 'fungalReach', 'cinderworks', 'drownedVault', 'rimehollow', 'sableCourt', 'wyrmDeeps'];
const NAMES = { cisterns: 'Cisterns', ossuary: 'Ossuary', fungalReach: 'Fungal Reach', cinderworks: 'Cinderworks', drownedVault: 'Drowned Vault', rimehollow: 'Rimehollow', sableCourt: 'Sable Court', wyrmDeeps: 'Wyrm Deeps' };
const FLOOR = { cisterns: '#4a4f46', ossuary: '#625b4e', fungalReach: '#4a3a55', cinderworks: '#432d22', drownedVault: '#2a4c4e', rimehollow: '#4e5d69', sableCourt: '#282430', wyrmDeeps: '#33402a' };
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const A = 2;
const rows = [];   // { section, name, file, caption }
const t0 = performance.now();
let frames = 0;
const save = (name, fs, grounds) => { writeFileSync(new URL(`shots/furniture/${name}.png`, DIR), strip(fs, grounds)); frames += fs.filter(Boolean).length; return `shots/furniture/${name}.png`; };

// 1 · every piece in every biome (intact), then its broken and wrecked states in its home biome
const own = new Map(); for (const [b, t] of Object.entries(D.BIOME_PIECES)) for (const [p] of [...t.wall, ...t.free]) if (!own.has(p)) own.set(p, b);
for (const id of Object.keys(D.PIECES)) {
  const home = own.get(id) ?? 'cisterns';
  const fs = [...BIOMES.map((b) => propFrame(id, 'intact', b, 1, A)), propFrame(id, 'broken', home, 1, A), propFrame(id, 'wrecked', home, 1, A)];
  rows.push({ section: own.has(id) ? `own:${home}` : 'shared', name: id, file: save(`piece-${id}`, fs, [...BIOMES.map((b) => rgb(FLOOR[b])), rgb(FLOOR[home]), rgb(FLOOR[home])]) });
}
// 2 · wall pieces (each in every biome)
const wallKinds = [...new Set(Object.values(D.WALL_PIECES).flatMap((l) => l.map((w) => w[0])))];
for (const id of wallKinds) rows.push({ section: 'wall', name: id, file: save(`wall-${id}`, BIOMES.map((b) => propFrame(id, 'intact', b, 2, A)), BIOMES.map((b) => rgb(FLOOR[b]))) });
// 3 · litter
for (const id of ['rubble', 'bones', 'splinters', 'papers', 'shards', 'cobweb']) rows.push({ section: 'litter', name: id, file: save(`litter-${id}`, BIOMES.map((b) => propFrame(id, 'intact', b, 3, A)), BIOMES.map((b) => rgb(FLOOR[b]))) });
// 4 · torches and chests
rows.push({ section: 'lights', name: 'torches', file: save('torches', BIOMES.map((b) => propFrame(`torch:${D.TORCHES[b].design}`, 'intact', b, 0, A, D.TORCHES[b].flame)), BIOMES.map((b) => rgb(FLOOR[b]))) });
rows.push({ section: 'lights', name: 'chests, shut', file: save('chests-shut', BIOMES.map((b) => propFrame(`chest:${b}`, 'intact', b, 0, A)), BIOMES.map((b) => rgb(FLOOR[b]))) });
rows.push({ section: 'lights', name: 'chests, open', file: save('chests-open', BIOMES.map((b) => propFrame(`chest:${b}`, 'broken', b, 0, A)), BIOMES.map((b) => rgb(FLOOR[b]))) });
// 5 · later phases add their sheets through showcaseExtras (gates, status marks, camp kits)
if (extra?.showcaseRows) for (const r of extra.showcaseRows({ propFrame, BIOMES })) rows.push({ section: r.section, name: r.name, file: save(r.file, r.frames, r.grounds ?? r.frames.map(() => [26, 21, 18])) });
const ms = performance.now() - t0;

// page
const head = readFileSync(new URL('_head.html', DIR), 'utf8').replace('<title>The Renovation</title>', '<title>The Furnishings</title>').replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Every piece of furniture, wall dressing, litter, torch and chest in Sunderdeep, in every biome and state — drawn by the game\'s own generator.">');
const cols = BIOMES.map((b) => `<th>${NAMES[b]}</th>`).join('');
const section = (key, title, sub, extraCols = '') => {
  const list = rows.filter((r) => r.section === key);
  if (!list.length) return '';
  return `<h3>${title} <span class="mono">${list.length}</span></h3><p class="muted">${sub}</p>
  <div class="tbl"><table><tr><th>piece</th>${cols}${extraCols}</tr>${list.map((r) => `<tr><td class="mono">${r.name}</td><td colspan="${8 + (extraCols ? 2 : 0)}"><img src="${r.file}" alt="${r.name}" style="image-rendering:pixelated;display:block;height:120px;width:auto;max-width:none"></td></tr>`).join('')}</table></div>`;
};
const ownSections = BIOMES.map((b) => section(`own:${b}`, `${NAMES[b]}'s own`, `Built for the ${NAMES[b]} and mixed into its rooms (data/dressing BIOME_PIECES). Shown in every biome's materials, then broken and wrecked at home.`, '<th>broken</th><th>wrecked</th>')).join('');
const html = `${head}<body>
<nav class="toc"><div class="wrap"><a href="index.html"><b>←</b>Part I</a><a href="part-two.html"><b>←</b>Part II</a><a href="#shared"><b>1</b>Shared</a><a href="#own"><b>2</b>Biome own</a><a href="#wall"><b>3</b>Walls</a><a href="#litter"><b>4</b>Litter</a><a href="#lights"><b>5</b>Torches &amp; chests</a><a href="#more"><b>6</b>More</a></div></nav>
<div class="wrap">
<header class="hero"><div class="kicker rise d1">Sunderdeep · pass six · docs/renovation</div><h1 class="rise d2"><span class="flicker">The <em>Furnishings</em></span></h1>
<p class="lede rise d3">Every piece that dresses a floor, in every biome and every state. Each is a voxel model, sprite-stacked by the same code that draws the heroes, and nothing here is a stored image. <strong>${rows.length} rows, ${frames} frames, generated in ${(ms / 1000).toFixed(1)} s</strong> by <code>tools/furniture.mjs</code>.</p>
<div class="stat rise d4"><div><b>${Object.keys(D.PIECES).length}</b>pieces</div><div><b>${[...own.keys()].length}</b>of them a biome's own</div><div><b>${wallKinds.length}</b>wall pieces</div><div><b>8</b>biomes</div></div></header>
<section id="shared"><div class="sec-head"><div class="num">1</div><h2>Shared pieces</h2><div class="sub">every biome, its own materials · then broken, wrecked</div></div>${section('shared', 'Shared', 'Placed by room theme (library, barracks, storeroom, shrine, mess, armoury, crypt, bare) in any biome.', '<th>broken</th><th>wrecked</th>')}</section>
<section id="own"><div class="sec-head"><div class="num">2</div><h2>Each biome's own</h2><div class="sub">five or more per biome · data/dressing BIOME_PIECES</div></div>${ownSections}</section>
<section id="wall"><div class="sec-head"><div class="num">3</div><h2>On the walls</h2><div class="sub">hung on faces the camera sees · data/dressing WALL_PIECES</div></div>${section('wall', 'Wall dressing', 'Each biome hangs mostly its own; shields, trophies and chains appear everywhere at a lower weight.')}</section>
<section id="litter"><div class="sec-head"><div class="num">4</div><h2>Litter</h2><div class="sub">loose, blocks nothing · more of it in destroyed rooms</div></div>${section('litter', 'Litter', 'Scattered by room condition: destroyed rooms carry the most.')}</section>
<section id="lights"><div class="sec-head"><div class="num">5</div><h2>Torches &amp; chests</h2><div class="sub">one design per biome</div></div>${section('lights', 'Torches and chests', 'Torches are placed by the sim and light the light map; no flame burns gold.')}</section>
<section id="more"><div class="sec-head"><div class="num">6</div><h2>Gates, marks, camp</h2><div class="sub">added as their phases land</div></div>${section('gates', 'Biome gates', 'The stairs, remade (part two §11).')}${section('status', 'Status marks', 'Light state and conditions (part two §12).')}${section('kits', 'Camp plots', 'A companion’s plot by background (part two §16).')}</section>
</div><footer><div class="wrap">docs/renovation/furniture.html · generated by <code>node --experimental-transform-types docs/renovation/tools/furniture.mjs</code></div></footer></body></html>`;
writeFileSync(new URL('furniture.html', DIR), html);
console.log(`furniture.html: ${rows.length} rows, ${frames} frames, ${ms.toFixed(0)} ms`);
