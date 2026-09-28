// Approach D — sprite stacking. The model is a stack of horizontal 2D slices (here: the layers of
// approach B's voxel volume). Each slice is rotated in 2D and drawn one pixel above the last. The
// result is a pixel sprite at *any* angle — 8, 16 or 360 facings for free — with no 3D renderer.
//
// It is inverse-mapped per pixel (screen → slice), so rotation never leaves holes.
import { Sprite } from '../../lib/pixel.js';
import { shade } from '../../lib/color.js';
import { buildVoxel } from '../B-voxel/voxels.js';

export const W = 64, H = 80;
const LAYER = 1, SQUASH = 0.5;

/** Flatten a posed voxel model to one lookup: slices[y] = Map('x,z' → colour). */
export function slicesOf(spec, pose = {}) {
  const m = buildVoxel(spec);
  const slices = []; let minY = 1e9, maxY = -1e9, rad = 0;
  for (const [name, part] of Object.entries(m.parts)) for (const [k, c] of part.v) {
    let [x, y, z] = k.split(',').map(Number);
    // pose: swing a limb about its pivot in the y–z plane
    const a = pose[name] ?? 0; if (a) { const [, py, pz] = part.pivot; const dy = y - py, dz = z - pz; y = Math.round(py + dy * Math.cos(a) - dz * Math.sin(a)); z = Math.round(pz + dy * Math.sin(a) + dz * Math.cos(a)); }
    (slices[y] ??= new Map()).set(`${x},${z}`, c); minY = Math.min(minY, y); maxY = Math.max(maxY, y); rad = Math.max(rad, Math.hypot(x, z));
  }
  return { slices, minY, maxY, rad: Math.ceil(rad) + 1 };
}

export function renderD(stack, angle = 0.6) {
  const sp = new Sprite(W, H), cx = W / 2, base = H - 6;
  const cos = Math.cos(angle), sin = Math.sin(angle), R = stack.rad;
  const lx = -0.6, lz = 0.8; // light from the front-left, in screen space
  for (let y = Math.max(0, stack.minY); y <= stack.maxY; y++) {
    const sl = stack.slices[y]; if (!sl) continue; const above = stack.slices[y + 1];
    for (let sz = -R; sz <= R; sz++) for (let sx = -R; sx <= R; sx++) {
      // screen-space (sx, sz) back to model space
      const x = Math.round(sx * cos + sz * sin), z = Math.round(-sx * sin + sz * cos);
      const c = sl.get(`${x},${z}`); if (!c) continue;
      const X = Math.round(cx + sx), Y = Math.round(base - (y - Math.max(0, stack.minY)) * LAYER + sz * SQUASH);
      let col = c;
      if (!above?.has(`${x},${z}`)) col = shade(c, 0.07);                 // a top face
      else {
        // which side faces the viewer? step one pixel toward the camera in screen space
        const fx = Math.round(sx * cos + (sz + 1) * sin), fz = Math.round(-sx * sin + (sz + 1) * cos);
        const lxm = Math.round((sx - 1) * cos + sz * sin), lzm = Math.round(-(sx - 1) * sin + sz * cos);
        const rxm = Math.round((sx + 1) * cos + sz * sin), rzm = Math.round(-(sx + 1) * sin + sz * cos);
        if (!sl.has(`${lxm},${lzm}`)) col = shade(c, 0.03);
        else if (!sl.has(`${rxm},${rzm}`)) col = shade(c, -0.1);
        else if (!sl.has(`${fx},${fz}`)) col = shade(c, -0.03);
      }
      sp.put(X, Y, col); sp.put(X, Y + 1, shade(col, -0.04)); // fill the squash gap below each slice pixel
    }
  }
  return sp.outline();
}
