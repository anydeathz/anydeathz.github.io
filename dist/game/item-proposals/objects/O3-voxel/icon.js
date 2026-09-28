// O3 — voxel mini-models. The parts are voxelised (objects/voxelize.js), meshed with only the faces
// that touch air, lit, and rendered from the fixed 3/4 camera. Glass is a see-through shell.
import { THREE, snap } from '../three-icon.js';
import { voxelize } from '../voxelize.js';
import { hexToRgb, mix } from '../../../character-proposals/lib/color.js';
import { RARITY_LOOK } from '../../lib/palette.js';

const FACES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const CORN = { '1,0,0': [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], '-1,0,0': [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], '0,1,0': [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], '0,-1,0': [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], '0,0,1': [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]], '0,0,-1': [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] };
export function meshVolume(map, N, solidAlso = null) {
  const pos = [], col = [], nor = [], idx = [], s = 2 / N;
  for (const [k, c] of map) {
    const [x, y, z] = k.split(',').map(Number); const [r, g, b] = hexToRgb(c.slice(0, 7)).map(v => (v / 255) ** 2.2);
    for (const f of FACES) {
      const nk = `${x + f[0]},${y + f[1]},${z + f[2]}`; if (map.has(nk) || solidAlso?.has(nk)) continue;
      const i0 = pos.length / 3;
      for (const [a, bb, cc] of CORN[f.join(',')]) { pos.push(-1 + (x + a) * s, -1 + (y + bb) * s, (z - 0.5 + cc) * s); col.push(r, g, b); nor.push(...f); }
      idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setIndex(idx);
  return geo;
}
const lit = new THREE.MeshLambertMaterial({ vertexColors: true });
const glassMat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false });
const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });

export function groupO3(o, N = 28) {
  const vol = voxelize(o, N);
  const solid = new Map([...vol.v].filter(([k]) => !vol.glow.has(k))), glowing = new Map([...vol.v].filter(([k]) => vol.glow.has(k)));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(meshVolume(solid, N, glowing), lit));
  if (glowing.size) g.add(new THREE.Mesh(meshVolume(glowing, N, solid), glowMat));
  if (vol.glass.size) g.add(new THREE.Mesh(meshVolume(vol.glass, N), glassMat));
  const R = RARITY_LOOK[vol.rarity];
  if (R?.rim) { // rarity: a flat ring of the rarity colour under the object, like a plinth light
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.84, 24), new THREE.MeshBasicMaterial({ color: R.rim, transparent: true, opacity: R.glow ? 0.9 : 0.6 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.98; g.add(ring);
  }
  g.userData = { voxels: vol.v.size + vol.glass.size, ms: vol.ms, vol };
  return g;
}
export function renderO3(o, { n = 48, k = 2, N = 28 } = {}) { const g = groupO3(o, N); const c = snap(g, n, k); g.traverse(m => m.geometry?.dispose()); return c; }
