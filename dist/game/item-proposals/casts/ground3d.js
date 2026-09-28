// The M1 path for anything drawn ON the floor: sample a ground overlay function (the same one M3 uses
// per pixel) into a canvas over the cells' bounding box, and lay it on the floor as a transparent plane.
// Also the hex rim as 3D line segments — the telegraph every 3D approach shares.
import { THREE } from '../objects/three-icon.js';
import { toWorld, fromWorld, key, DIRS, corners } from '../../character-proposals/lib/hex.js';
import { hexToRgb } from '../../character-proposals/lib/color.js';

export function groundMesh(layers, t, pxPerUnit = 16) {
  const g = new THREE.Group();
  for (const L of layers) {
    if (!L?.ground || !L.cells?.length) continue;
    const set = new Set(L.cells.map(c => key(...c))), ws = L.cells.map(c => toWorld(...c));
    const x0 = Math.min(...ws.map(p => p[0])) - 1, x1 = Math.max(...ws.map(p => p[0])) + 1, y0 = Math.min(...ws.map(p => p[1])) - 1, y1 = Math.max(...ws.map(p => p[1])) + 1;
    const W = Math.ceil((x1 - x0) * pxPerUnit), H = Math.ceil((y1 - y0) * pxPerUnit), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H);
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      const x = x0 + (X + 0.5) / pxPerUnit, y = y0 + (Y + 0.5) / pxPerUnit, [q, r] = fromWorld(x, y), k = key(q, r); if (!set.has(k)) continue;
      const c = L.ground(x, y, k, t); if (!c) continue; const [rr, gg, bb] = hexToRgb(c.slice(0, 7)); img.data.set([rr, gg, bb, c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255], (Y * W + X) * 4);
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.012 + g.children.length * 0.002, (y0 + y1) / 2); m.renderOrder = 2; g.add(m);
  }
  return g;
}
/** The outside edge of a cell set, as line segments on the floor. */
export function rimLines(cells, col, y = 0.03, opacity = 0.9) {
  const set = new Set(cells.map(c => key(...c))), pos = [];
  for (const [q, r] of cells) { const k = corners(q, r); DIRS.forEach(([dq, dr], i) => { if (set.has(key(q + dq, r + dr))) return; const [cx, cy] = toWorld(q, r), [nx, ny] = toWorld(q + dq, r + dr), a = Math.atan2(ny - cy, nx - cx); const A = [cx + Math.cos(a - Math.PI / 6), cy + Math.sin(a - Math.PI / 6)], B = [cx + Math.cos(a + Math.PI / 6), cy + Math.sin(a + Math.PI / 6)]; pos.push(A[0], y, A[1], B[0], y, B[1]); }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity }));
}
