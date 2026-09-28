// S4 — toon meshes at ⅓ resolution, in M1. Every emitter becomes a primitive with a toon ramp and an
// emissive colour: a sphere head with a trailing cone, cylinders for beams and columns, a torus for an
// aura, hex prisms that rise under a sweep, boxes for a wall. The direct upgrade of today's
// render/vfx/spells.ts — same primitives, but now for every shape, and driven by the same cells.
import { THREE } from '../../objects/three-icon.js';
import { active, local, cellStart } from '../cast.js';
import { toWorld } from '../../../character-proposals/lib/hex.js';
import { groundMesh, rimLines } from '../ground3d.js';
import { surfaceLayer } from '../common.js';

const ramp = (() => { const d = new Uint8Array([110, 190, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const mat = (col, opacity = 1, emit = 0.9) => new THREE.MeshToonMaterial({ color: col, emissive: col, emissiveIntensity: emit, gradientMap: ramp, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
const hexPrism = new THREE.CylinderGeometry(0.97, 0.97, 1, 6); hexPrism.rotateY(Math.PI / 6); hexPrism.translate(0, 0.5, 0);

export function fx3d(cast, t) {
  const g = new THREE.Group(), [c0, c1, c2, c3] = cast.cols;
  for (const e of cast.emitters) {
    if (e.type === 'telegraph' && t <= e.t1 + 0.3) g.add(rimLines(e.cells, c0, 0.03, t > e.t1 ? 1 - (t - e.t1) / 0.3 : 0.95));
    if (e.type === 'travel' && active(e, t)) {
      const u = local(e, t), P = uu => new THREE.Vector3(e.from[0] + (e.to[0] - e.from[0]) * uu, e.z0 + (e.z1 - e.z0) * uu + Math.sin(uu * Math.PI) * e.arc, e.from[1] + (e.to[1] - e.from[1]) * uu);
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(c3)); head.position.copy(P(u)); g.add(head);
      const tail = P(Math.max(0, u - 0.18)), dir = P(u).sub(tail), L = dir.length();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, L, 6), mat(c0, 0.75)); cone.position.copy(tail.clone().add(dir.clone().multiplyScalar(0.5))); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize()); g.add(cone);
    }
    if (e.type === 'beam' && active(e, t)) {
      const u = local(e, t), pts = [e.from, ...(e.chain ?? [e.to])], fade = u > 0.8 ? 1 - (u - 0.8) * 5 : 1;
      for (let s = 0; s + 1 < pts.length; s++) {
        const n = e.jag ? 7 : 1;
        for (let i = 0; i < n; i++) {
          const q0 = i / n, q1 = (i + 1) / n, J = q => e.jag && q > 0 && q < 1 ? (Math.sin(q * 37 + s + Math.floor(t * 20)) * e.jag) : 0;
          const A = new THREE.Vector3(pts[s][0] + (pts[s + 1][0] - pts[s][0]) * q0 + J(q0), e.z - s * 0.2, pts[s][1] + (pts[s + 1][1] - pts[s][1]) * q0), B = new THREE.Vector3(pts[s][0] + (pts[s + 1][0] - pts[s][0]) * q1 + J(q1), e.z - s * 0.2, pts[s][1] + (pts[s + 1][1] - pts[s][1]) * q1);
          const d = B.clone().sub(A), cyl = new THREE.Mesh(new THREE.CylinderGeometry(e.jag ? 0.04 : 0.07, e.jag ? 0.04 : 0.07, d.length(), 5), mat(c3, fade)); cyl.position.copy(A.clone().add(d.clone().multiplyScalar(0.5))); cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(cyl);
        }
      }
    }
    if (e.type === 'burst' && active(e, t)) { const u = local(e, t), R = (e.r + 0.5) * 1.732 * Math.min(1, u * 2.2); const sph = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(u < 0.3 ? c3 : c0, 0.85 * (1 - u))); sph.scale.set(R, R * 0.7, R); sph.position.set(e.at[0], 0, e.at[1]); g.add(sph); }
    if ((e.type === 'sweep' || e.type === 'fill' || e.type === 'zone' || e.type === 'wall') && t >= e.t0) {
      const persist = e.type === 'zone' || e.type === 'wall';
      for (const p of e.cells) {
        const t0 = cellStart(e, p, t); if (t < t0) continue; const age = (t - t0) / 0.35; if (!persist && age > 1) continue;
        const h = e.type === 'wall' ? e.height * Math.min(1, age * 3) : persist ? 0.25 : 0.7 * Math.sin(Math.min(1, age) * Math.PI);
        const m = new THREE.Mesh(hexPrism, mat(age < 0.3 ? c3 : c1, persist ? (e.type === 'wall' ? 0.7 : 0.35) : 0.7 * (1 - age))); const [x, y] = toWorld(...p); m.position.set(x, 0, y); m.scale.set(e.type === 'wall' ? 0.6 : 1, Math.max(0.02, h), e.type === 'wall' ? 0.6 : 1); g.add(m);
      }
    }
    if (e.type === 'column' && t >= e.t0) { const [x, y] = toWorld(...e.cells[0] ?? [0, 0]), [tx, ty] = e.at, R = Math.max(0.9, Math.sqrt(e.cells.length) * 0.9); const c = new THREE.Mesh(new THREE.CylinderGeometry(R, R, e.height, 12, 1, true), mat(c1, 0.35)); c.position.set(tx, e.height / 2, ty); g.add(c); const core = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.3, R * 0.3, e.height, 8), mat(c3, 0.5)); core.position.copy(c.position); g.add(core); }
    if (e.type === 'ring' && t >= e.t0) { const u = local(e, t), R = e.r * 1.732 * Math.min(1, u * 2.5); const tor = new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.1, R), 0.06, 4, 32), mat(c3, 0.9)); tor.rotation.x = Math.PI / 2; tor.position.set(e.at[0], 0.25, e.at[1]); g.add(tor); const disc = new THREE.Mesh(new THREE.CircleGeometry(Math.max(0.1, R), 24), mat(c1, 0.18)); disc.rotation.x = -Math.PI / 2; disc.position.set(e.at[0], 0.02, e.at[1]); g.add(disc); }
    if (e.type === 'flash' && active(e, t)) { const u = local(e, t), m = new THREE.Mesh(new THREE.OctahedronGeometry(0.2 + u * 0.5, 0), mat(c3, 1 - u)); m.position.set(e.at[0], e.z, e.at[1]); g.add(m); }
    if (e.type === 'sigil' && active(e, t)) { const u = local(e, t), m = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 4, 6), mat(c1, Math.sin(u * Math.PI))); m.rotation.x = Math.PI / 2; m.rotation.z = u * 2; m.position.set(e.at[0], e.z, e.at[1]); g.add(m); }
    if (e.type === 'rune' && active(e, t)) g.add(Object.assign(rimLines([cast.target], c0, 0.04, Math.sin(local(e, t) * Math.PI))));
    if (e.type === 'spirit' && active(e, t)) { const u = local(e, t), m = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.2, 3, 8), mat(c1, 0.55 * Math.min(1, u * 2))); m.position.set(e.at[0], 1.0 * Math.min(1, u * 2), e.at[1]); g.add(m); }
  }
  const s = surfaceLayer(cast, t); if (s) g.add(groundMesh([s], t));
  return g;
}
