// O5 — lathe/extrude toon 3D, baked. Bottles are real solids of revolution (LatheGeometry), blades and
// plates are extruded outlines, bars are cylinders — the C/E technique from character-proposals, fed the
// same parts. Toon ramp + inverted-hull outline, rendered at low resolution, cached by recipe hash so a
// bake is paid once per distinct item (E's idea).
import { THREE, snap } from '../three-icon.js';
import { partsOf } from '../../lib/parts.js';
import { MARKS } from '../../lib/marks.js';
import { RARITY_LOOK } from '../../lib/palette.js';
import { hashString } from '../../../character-proposals/lib/rng.js';

const rampTex = (() => { const d = new Uint8Array([80, 165, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const mats = new Map();
const toon = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!mats.has(k)) mats.set(k, new THREE.MeshToonMaterial({ color: hex, gradientMap: rampTex, transparent: !!o.opacity, opacity: o.opacity ?? 1, depthWrite: !o.opacity, emissive: o.emit ? hex : '#000', emissiveIntensity: o.emit ?? 0, side: THREE.DoubleSide })); return mats.get(k); };
const hull = new THREE.MeshBasicMaterial({ color: '#120e0c', side: THREE.BackSide });
hull.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.035;'); };

function meshFor(p) {
  let geo;
  if (p.t === 'lathe') { geo = new THREE.LatheGeometry(p.prof.map(([y, r]) => new THREE.Vector2(Math.max(0.001, r), -y)), 20); geo.translate(p.cx, 0, 0); }
  else if (p.t === 'poly') { const sh = new THREE.Shape(); p.pts.forEach(([x, y], i) => (i ? sh.lineTo(x, -y) : sh.moveTo(x, -y))); const d = Math.max(0.02, p.th ?? 0.12); geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 1 }); geo.translate(0, 0, -d / 2); }
  else if (p.t === 'bar') { const [ax, ay] = p.a, [bx, by] = p.b, L = Math.hypot(bx - ax, by - ay) || 0.01; geo = new THREE.CapsuleGeometry(Math.max(0.02, p.w / 2), L, 2, 8); geo.rotateZ(-Math.atan2(bx - ax, -(by - ay))); geo.translate((ax + bx) / 2, -(ay + by) / 2, 0); }
  else if (p.t === 'ell') { if (p.ring) { geo = new THREE.TorusGeometry((p.rx + p.ry) / 2 - p.ring / 2, p.ring / 2, 6, 24); geo.scale(1, p.ry / p.rx, 1); } else { geo = new THREE.SphereGeometry(1, 14, 10); geo.scale(Math.max(0.02, p.rx), Math.max(0.02, p.ry), p.th ? p.th / 2 : Math.min(p.rx, p.ry)); } geo.translate(p.c[0], -p.c[1], 0); }
  else return null;
  const mat = p.glass ? toon('#cfe0e6', { opacity: 0.3 }) : p.glassBack ? null : toon(p.col, { emit: p.emit ? p.emit * 0.7 : 0, opacity: p.alpha && p.alpha < 1 ? p.alpha : undefined });
  if (!mat) return null;
  const m = new THREE.Mesh(geo, mat); if (!p.glass && !p.liquid) m.add(new THREE.Mesh(geo, hull));
  if (p.liquid) m.scale.set(0.98, 1, 0.98);
  return m;
}
function decal(p, zFront) {  // strokes and marks drawn onto a plane in front of the object
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const X = x => (x + 1) * 64;
  if (p.t === 'strokes') { g.strokeStyle = p.col; g.lineWidth = Math.max(2, p.w * 64); g.lineCap = 'round'; for (const [a, b, c, d] of p.segs) { g.beginPath(); g.moveTo(X(a), X(b)); g.lineTo(X(c), X(d)); g.stroke(); } }
  else { const bm = MARKS[p.mark] ?? MARKS.utility, cs = p.s * 64 / 5; g.fillStyle = p.col; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (bm[j][i] === '#') g.fillRect(X(p.c[0]) - 2.5 * cs + i * cs, X(p.c[1]) - 2.5 * cs + j * cs, cs + 0.5, cs + 0.5); }
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false })); m.position.z = zFront; m.renderOrder = 10; return m;
}
export function groupO5(o) {
  const t0 = performance.now(); const { parts, rarity } = partsOf(o), g = new THREE.Group();
  const order = [...parts].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.order - b.order);
  let zf = 0.2;
  order.forEach((p, i) => { if (p.t === 'strokes' || p.t === 'mark') { g.add(decal(p, zf + 0.05)); return; } const m = meshFor(p); if (!m) return; m.position.z += (p.z ?? 0) * 0.02; zf = Math.max(zf, (p.th ?? 0.2) / 2 + (p.z ?? 0) * 0.02); g.add(m); });
  const R = RARITY_LOOK[rarity];
  if (R?.rim) { const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.84, 24), new THREE.MeshBasicMaterial({ color: R.rim, transparent: true, opacity: R.glow ? 0.9 : 0.6 })); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.98; g.add(ring); }
  g.userData.ms = performance.now() - t0;
  return g;
}
const cache = new Map();
export const bakeKey = o => hashString(JSON.stringify([o.id, o.rarity, o.vis]));
export function renderO5(o, { n = 32, k = 2 } = {}) {
  const key = `${bakeKey(o)}:${n}`;
  if (!cache.has(key)) { const g = groupO5(o); cache.set(key, snap(g, n, 1)); g.traverse(m => m.geometry?.dispose()); }
  const src = cache.get(key), c = document.createElement('canvas'); c.width = c.height = n * k; const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(src, 0, 0, n * k, n * k); return c;
}
