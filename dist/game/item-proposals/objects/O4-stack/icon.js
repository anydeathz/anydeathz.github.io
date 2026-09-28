// O4 — sprite-stacked loot. O3's voxel volume cut into horizontal slices; each slice is rotated in 2D
// and drawn one pixel above the last. Any angle, no WebGL, pixel output — so loot on the floor can turn.
// (Only Legendary loot may turn continuously: motion Q2 forbids motion that repeats more than once a
// second, and a turntable on every drop would be exactly that.)
import { Sprite } from '../../../character-proposals/lib/pixel.js';
import { shade } from '../../../character-proposals/lib/color.js';
import { voxelize } from '../voxelize.js';
import { RARITY_LOOK } from '../../lib/palette.js';

export function stackOf(o, N = 28) {
  const vol = voxelize(o, N), slices = []; let minY = 1e9, maxY = -1e9;
  for (const [k, c] of [...vol.glass, ...vol.v]) { const [x, y, z] = k.split(',').map(Number); (slices[y] ??= new Map()).set(`${x - N / 2},${z}`, vol.glass.has(k) && !vol.v.has(k) ? c + '66' : c); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  return { slices, minY, maxY, R: Math.ceil(N * 0.75), N, rarity: vol.rarity, ms: vol.ms };
}
/** tilt: 0 = side-on (an upright bottle), 1 = lying flat on the floor seen from above. */
export function renderO4(stack, angle = 0.6, { squash = 0.5, layer = 1 } = {}) {
  const W = stack.N + 12, H = stack.N + 16, sp = new Sprite(W, H), cx = W / 2, base = H - 6;
  const cos = Math.cos(angle), sin = Math.sin(angle), R = stack.R;
  for (let y = stack.minY; y <= stack.maxY; y++) {
    const sl = stack.slices[y]; if (!sl) continue; const above = stack.slices[y + 1];
    for (let sz = -R; sz <= R; sz++) for (let sx = -R; sx <= R; sx++) {
      const x = Math.round(sx * cos + sz * sin), z = Math.round(-sx * sin + sz * cos);
      const c = sl.get(`${x},${z}`); if (!c) continue;
      const X = Math.round(cx + sx), Y = Math.round(base - (y - stack.minY) * layer + sz * squash);
      const glassy = c.length > 7;
      let col = c.slice(0, 7);
      if (!above?.has(`${x},${z}`)) col = shade(col, 0.07);
      else { const lx = Math.round((sx - 1) * cos + sz * sin), lz = Math.round(-(sx - 1) * sin + sz * cos); if (!sl.has(`${lx},${lz}`)) col = shade(col, 0.04); const rx = Math.round((sx + 1) * cos + sz * sin), rz = Math.round(-(sx + 1) * sin + sz * cos); if (!sl.has(`${rx},${rz}`)) col = shade(col, -0.1); }
      if (glassy) { if (!sp.get(X, Y)) sp.put(X, Y, col + '55'); continue; }
      sp.put(X, Y, col); sp.put(X, Y + 1, shade(col, -0.04));
    }
  }
  sp.outline(0.42);
  const Rl = RARITY_LOOK[stack.rarity];
  if (Rl?.rim) { for (let x = cx - 10; x <= cx + 10; x++) if ((x & 1) === 0) sp.put(x, base + 3, Rl.rim); }
  return sp;
}
