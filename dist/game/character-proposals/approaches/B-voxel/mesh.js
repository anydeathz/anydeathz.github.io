// Voxel parts → three.js. Only faces that touch air are emitted (a 40-voxel human is ~3k quads),
// one BufferGeometry per part with vertex colours, one extra unlit mesh per part for glowing voxels.
import * as THREE from '../../vendor/three.module.js';
import { hexToRgb } from '../../lib/color.js';
import { buildVoxel, VOX } from './voxels.js';

const FACES = [
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] }, { n: [-1, 0, 0], c: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] },
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], c: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] }, { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
];
export function meshPart(part) {
  const out = [{ pos: [], col: [], nor: [], idx: [] }, { pos: [], col: [], nor: [], idx: [] }];
  for (const [k, c] of part.v) {
    const [x, y, z] = k.split(',').map(Number), g = part.glow.has(k) ? 1 : 0, o = out[g];
    const [r, gg, b] = hexToRgb(c).map(v => (v / 255) ** 2.2);
    for (const f of FACES) {
      if (part.v.has(`${x + f.n[0]},${y + f.n[1]},${z + f.n[2]}`)) continue;
      const i0 = o.pos.length / 3;
      for (const [a, bb, cc] of f.c) { o.pos.push((x + a - part.pivot[0]) * VOX, (y + bb - part.pivot[1]) * VOX, (z + cc - part.pivot[2]) * VOX); o.col.push(r, gg, b); o.nor.push(...f.n); }
      o.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    }
  }
  return out.map(o => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(o.pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(o.col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.nor, 3)); g.setIndex(o.idx); return g; });
}

const litMat = new THREE.MeshLambertMaterial({ vertexColors: true });
const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true });

/** A rigged voxel character: a Group with named pivots `legL legR torso armL armR head cloak`. */
export function voxelCharacter(spec) {
  const t0 = performance.now();
  const model = buildVoxel(spec);
  const root = new THREE.Group(); const rig = {}; let quads = 0;
  for (const [name, part] of Object.entries(model.parts)) {
    const pivot = new THREE.Group(); pivot.position.set(...part.pivot.map(v => v * VOX));
    const [lit, glow] = meshPart(part); quads += (lit.index.count + glow.index.count) / 6;
    const m = new THREE.Mesh(lit, litMat); m.castShadow = true; pivot.add(m);
    if (glow.index.count) pivot.add(new THREE.Mesh(glow, glowMat));
    root.add(pivot); rig[name] = pivot;
  }
  root.userData = { rig, quads, ms: performance.now() - t0, height: model.height * VOX };
  return root;
}

/** Procedural animation over the rig — the same idea as frontend/src/gen/anim/procedural.ts. */
export function animate(root, anim, t) {
  const { rig } = root.userData; const s = Math.sin(t * 8);
  for (const k of ['legL', 'legR', 'armL', 'armR', 'head', 'torso']) rig[k].rotation.set(0, 0, 0);
  root.position.y = 0;
  if (anim === 'walk') { rig.legL.rotation.x = s * 0.5; rig.legR.rotation.x = -s * 0.5; rig.armL.rotation.x = -s * 0.4; rig.armR.rotation.x = s * 0.3; root.position.y = Math.abs(s) * 0.02; }
  else if (anim === 'attack') { const a = (t * 1.6) % 1; rig.armR.rotation.x = a < 0.4 ? -a / 0.4 * 2.0 : -2.0 + (a - 0.4) / 0.6 * 2.6; rig.torso.rotation.y = a < 0.4 ? 0.2 : -0.15; }
  else { root.position.y = Math.sin(t * 2) * 0.006; rig.head.rotation.y = Math.sin(t * 0.7) * 0.15; }
}
