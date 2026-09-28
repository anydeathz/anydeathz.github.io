// Contact sheets of the pass-six props, drawn by the game's own generator (imported read-only) into PNGs.
//   node --experimental-transform-types docs/renovation/tools/sheet.mjs docs/renovation/shots/after
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const SRC = new URL('../../../frontend/src/', import.meta.url).href;
const { propFrame, CHEST_DESIGNS } = await import(SRC + 'gen/sprites/props.ts');
const { TORCHES } = await import(SRC + 'data/dressing/index.ts');
const out = process.argv[2] ?? '.';

function png(w, h, rgba) {
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = (b) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function sheet(rows, cell, scale, bg = [26, 21, 18]) {
  const cols = Math.max(...rows.map((r) => r.length)), W = cols * cell * scale, H = rows.length * cell * scale, img = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) img.set([...bg, 255], i * 4);
  rows.forEach((row, ry) => row.forEach((f, rx) => {
    if (!f) return;
    const px = f.sprite.toRGBA(), ox = rx * cell + Math.floor((cell - f.sprite.w) / 2), oy = ry * cell + (cell - f.sprite.h - 2);
    for (let y = 0; y < f.sprite.h; y++) for (let x = 0; x < f.sprite.w; x++) {
      const s = (y * f.sprite.w + x) * 4; if (px[s + 3] < 128) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const X = (ox + x) * scale + dx, Y = (oy + y) * scale + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; img.set([px[s], px[s + 1], px[s + 2], 255], (Y * W + X) * 4); }
    }
  }));
  return png(W, H, img);
}
const PIECES = ['bookshelf', 'bed', 'table', 'chair', 'bench', 'barrel', 'crate', 'weaponRack', 'altar', 'sarcophagus', 'banner', 'cabinet', 'candles'];
const LITTER = ['rubble', 'bones', 'splinters', 'papers', 'shards', 'cobweb'];
const A = 2; // three-quarter view
const t0 = performance.now();
writeFileSync(`${out}/props-pieces.png`, sheet(['intact', 'broken', 'wrecked'].map((s) => PIECES.map((k) => propFrame(k, s, 'cisterns', 1, A))), 72, 3));
writeFileSync(`${out}/props-biomes.png`, sheet(Object.keys(TORCHES).map((b) => [...['bookshelf', 'bed', 'barrel', 'sarcophagus', 'banner'].map((k) => propFrame(k, 'intact', b, 2, A)), propFrame(`torch:${TORCHES[b].design}`, 'intact', b, 0, A, TORCHES[b].flame), ...LITTER.slice(0, 3).map((k) => propFrame(k, 'intact', b, 3, A))]), 72, 2));
writeFileSync(`${out}/chests.png`, sheet(Object.keys(CHEST_DESIGNS).map((b) => [propFrame(`chest:${b}`, 'intact', b, 0, A), propFrame(`chest:${b}`, 'broken', b, 0, A), propFrame(`chest:${b}`, 'intact', b, 0, 0), propFrame(`chest:${b}`, 'intact', b, 0, 12)]), 60, 3));
writeFileSync(`${out}/props-angles.png`, sheet([Array.from({ length: 16 }, (_, i) => propFrame('bookshelf', 'intact', 'sableCourt', 0, i)), Array.from({ length: 16 }, (_, i) => propFrame('bed', 'broken', 'rimehollow', 0, i))], 64, 2));
console.log('sheets in', out, `${(performance.now() - t0).toFixed(0)} ms`);
