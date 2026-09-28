// S1 in M1: the same particles as screen-space pixel points (size in pixels, no perspective), additive.
import { THREE } from '../../objects/three-icon.js';
import { particlesAt } from '../cast.js';
import { groundMesh } from '../ground3d.js';
import { surfaceLayer } from '../common.js';
export function fx3d(cast, t) {
  const g = new THREE.Group(), ps = particlesAt(cast, t).filter(p => p.a > 0.05);
  for (const big of [false, true]) {
    const sel = ps.filter(p => (p.s >= 5) === big); if (!sel.length) continue;
    const pos = [], col = [], c = new THREE.Color();
    for (const p of sel) { pos.push(p.x, p.z, p.y); c.set(p.c).convertSRGBToLinear().multiplyScalar(p.a); col.push(c.r, c.g, c.b); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: big ? 8 : 2.5, sizeAttenuation: false, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
  }
  const s = surfaceLayer(cast, t); if (s) g.add(groundMesh([s], t));
  return g;
}
