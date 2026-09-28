// Putting each character approach into the 3D map. A and D (and E) are billboards — a camera-facing
// quad showing the pixel sprite at exactly 24 px per world unit, so a sprite pixel is a map pixel.
// B and C are real meshes and stand in the scene like anything else.
import * as THREE from '../vendor/three.module.js';
import { renderA } from '../approaches/A-pixel-paperdoll/gen.js';
import { renderCreatureA } from '../approaches/A-pixel-paperdoll/creatures.js';
import { slicesOf, renderD } from '../approaches/D-spritestack/gen.js';
import { voxelCharacter } from '../approaches/B-voxel/mesh.js';
import { buildC } from '../approaches/C-pixel3d/gen.js';
import { bake } from '../approaches/E-bake/bake.js';

export function billboard(canvas, footY) {
  const tex = new THREE.CanvasTexture(canvas); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.5 }));
  s.scale.set(canvas.width / 24, canvas.height / 24, 1); s.center.set(0.5, (canvas.height - footY) / canvas.height);
  return s;
}

/** kind: A | B | C | D | E · camAz: the camera azimuth, so D and E can pick the facing that looks right */
export function actor(kind, spec, camAz = 0.5, facing = 0) {
  if (kind === 'B') { const m = voxelCharacter(spec); m.rotation.y = facing; return m; }
  if (kind === 'C') { const m = buildC(spec); m.rotation.y = facing; return m; }
  if (kind === 'D') return billboard(renderD(slicesOf(spec), camAz - facing + 0.0).toCanvas(1), 74);
  if (kind === 'E') { const b = bake(spec, 'C'); const d = ((Math.round((camAz - facing) / (Math.PI / 4)) % 8) + 8) % 8; return billboard(b.frame(d, 0).toCanvas(1), 76); }
  return billboard((spec.form ? renderCreatureA(spec) : renderA(spec)).toCanvas(1), 68);
}
