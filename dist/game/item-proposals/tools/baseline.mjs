// TODAY'S icons, for the before/after: runs the game's own gen/textures/itemIcon.ts (read-only import
// under Node's --experimental-strip-types — nothing in frontend/ is written) and writes sheets.
//   node --experimental-transform-types --no-warnings docs/item-proposals/tools/baseline.mjs
import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const F = new URL('../../../frontend/src/', import.meta.url).href;
const { generateItemIcon, generateStackIcon, ICON_SIZE } = await import(F + 'gen/textures/itemIcon.ts');
const { GAME } = await import('../lib/game.js');
const { STACKS } = await import(F + 'data/consumables/index.ts');

function png(w, h, rgba) {
  const crc = (() => { const t = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; }); return b => { let c = ~0; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; }; })();
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function sheet(bufs, cols, k = 2, gap = 6) {
  const S = ICON_SIZE * k, rows = Math.ceil(bufs.length / cols), W = cols * (S + gap) + gap, H = rows * (S + gap) + gap, out = new Uint8ClampedArray(W * H * 4);
  bufs.forEach((b, i) => { const ox = gap + (i % cols) * (S + gap), oy = gap + Math.floor(i / cols) * (S + gap);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const si = ((Math.floor(y / k)) * ICON_SIZE + Math.floor(x / k)) * 4, di = ((oy + y) * W + ox + x) * 4; out.set(b.data.slice(si, si + 4), di); } });
  return png(W, H, out);
}
const item = (baseId, rarity = 'common', seed = 1) => ({ id: `${baseId}:${seed}`, name: baseId, baseId, slot: 'mainHand', itemLevel: 10, rarity, enhancement: 0, affixes: [], seed, value: 1 });
const t0 = performance.now();
const items = GAME.bases.map(b => generateItemIcon(item(b.id)));
const tItems = performance.now() - t0;
const rar = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'].map(r => generateItemIcon(item('longsword', r)));
const stacks = STACKS.map(s => generateStackIcon(s));
const OUT = fileURLToPath(new URL('../shots/', import.meta.url));
await writeFile(OUT + 'baseline-items.png', sheet(items, 18));
await writeFile(OUT + 'baseline-rarity.png', sheet(rar, 5));
await writeFile(OUT + 'baseline-stacks.png', sheet(stacks, 20));
console.log(`today: ${items.length} item icons in ${tItems.toFixed(1)} ms · ${stacks.length} stack icons · distinct stack icons ${new Set(stacks.map(b => Buffer.from(b.data).toString('base64'))).size}`);
