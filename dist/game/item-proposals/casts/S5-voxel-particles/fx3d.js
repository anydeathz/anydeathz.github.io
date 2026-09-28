// S5 — voxel particles. The very same particlesAt(cast, t) as S1, as instanced lit cubes in M1:
// one draw call for every particle of every cast on screen. Pairs with the voxel map (M2) and B.
import { THREE } from '../../objects/three-icon.js';
import { particlesAt } from '../cast.js';
import { groundMesh, rimLines } from '../ground3d.js';
import { surfaceLayer } from '../common.js';
const box = new THREE.BoxGeometry(1, 1, 1);
export function fx3d(cast, t) {
  const g = new THREE.Group(), ps = particlesAt(cast, t).filter(p => p.a > 0.05);
  const tel = cast.emitters.find(e => e.type === 'telegraph'); if (tel && t <= tel.t1 + 0.3) g.add(rimLines(tel.cells, cast.cols[0], 0.03, 0.8));
  if (ps.length) {
    const im = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }), ps.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
    ps.forEach((p, i) => { const s = (p.k === 'flash' ? Math.min(0.6, p.s / 60) : p.k === 'head' ? 0.22 : 0.05 + p.s * 0.02) * (0.4 + 0.6 * p.a); m4.makeScale(s, s, s).setPosition(p.x, p.z, p.y); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(p.c).convertSRGBToLinear()); });
    g.add(im); g.userData.instances = ps.length;
  }
  const s = surfaceLayer(cast, t); if (s) g.add(groundMesh([s], t));
  return g;
}
