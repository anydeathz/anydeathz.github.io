// Approach C — "3D pixel art": smooth low-poly parts, toon-shaded with a 3-step ramp, an inverted-hull
// outline, and the whole scene rendered at 1/3 resolution and scaled up nearest-neighbour. This is the
// technique behind the recent wave of 3D games that read as pixel art; it keeps free rotation and real
// lighting, and the downscale does the "pixel" part for free.
//
// Items are built from the same recipes as A and B, as meshes: lathes for helms and skirts, extruded
// profiles for blades and axe heads, tori for rings and circlets.
import * as THREE from '../../vendor/three.module.js';
import { base, rarity, MATERIALS } from '../../lib/data.js';
import { shade, mix } from '../../lib/color.js';

const U = 1 / 24; // same proportions as A and B, which measure in 24ths of a world unit
const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const matCache = new Map();
export function toon(hex, emissive = null) {
  const k = hex + (emissive ?? '');
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshToonMaterial({ color: new THREE.Color(hex), gradientMap: ramp, emissive: emissive ? new THREE.Color(emissive) : undefined, emissiveIntensity: emissive ? 0.8 : 0 }));
  return matCache.get(k);
}
const outlineMat = new THREE.MeshBasicMaterial({ color: '#120e0c', side: THREE.BackSide });
outlineMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.022;'); };

function mesh(geo, hex, emissive) { const m = new THREE.Mesh(geo, toon(hex, emissive)); m.castShadow = true; const o = new THREE.Mesh(geo, outlineMat); m.add(o); return m; }
const capsule = (r, len) => new THREE.CapsuleGeometry(r, Math.max(0.001, len), 4, 10);
const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
function extrude(pts, depth) {
  const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
}

export function buildC(s) {
  const t0 = performance.now();
  const R = s.race, L = s.loadout;
  const items = {}; for (const [slot, id] of Object.entries(L)) if (id) items[slot] = base(id);
  const rar = slot => rarity(s.rarity?.[slot] ?? 'common');
  const matOf = m => (m === 'cloth' ? s.primary : MATERIALS[m] ?? m);
  const trimOr = (slot, hex) => rar(slot).trim ? mix(hex, rar(slot).trim, 0.55) : hex;
  const glowOf = slot => (rar(slot).glow ? rar(slot).trim : null);
  const bodyV = items.body?.vis;
  const skin = s.skin, hair = s.hair, tunic = s.primary, trousers = mix(s.secondary, '#2a2018', 0.45);

  const legLen = 14 * Math.pow(R.h, 1.3) * U, hipY = 2 * U + legLen, T = 12 * (0.78 + 0.22 * R.h) * U, shY = hipY + T;
  const shW = 14 * R.w * U, waW = 11 * R.w * U, D = 7 * R.w * U, limb = (R.w > 1.1 ? 2.6 : 2.2) * U;
  const headR = (R.bigHead ? 7 : 6.2) * U, hcy = shY + headR + 1.2 * U, bodyH = hcy + headR;

  const root = new THREE.Group(), rig = {};
  const pivot = (name, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g); rig[name] = g; return g; };

  // legs + feet
  const legCol = bodyV?.legs ? matOf(bodyV.mat) : trousers;
  for (const [name, sx] of [['legL', -1], ['legR', 1]]) {
    const p = pivot(name, sx * waW * 0.26, hipY, 0);
    const leg = mesh(capsule(limb * 1.05, legLen - 2 * U - limb), legCol); leg.position.y = -legLen / 2 + U; p.add(leg);
    const fv = items.feet?.vis;
    const footCol = fv ? matOf(fv.mat) : R.bareFeet ? skin : '#3a2a1e';
    const foot = mesh(new THREE.BoxGeometry(limb * 2.1, 2.4 * U, limb * 3.2), trimOr('feet', footCol)); foot.position.set(0, -legLen + U * 0.2, limb * 0.6); p.add(foot);
    if (fv && fv.height > 0.4) { const b = mesh(new THREE.CylinderGeometry(limb * 1.25, limb * 1.2, legLen * fv.height * 0.55, 10), trimOr('feet', footCol), glowOf('feet')); b.position.y = -legLen + legLen * fv.height * 0.3; p.add(b); }
  }
  // torso: a lathe from waist to shoulders, flattened front-to-back
  const torso = pivot('torso', 0, 0, 0);
  const tg = lathe([[0, hipY], [waW / 2, hipY], [waW / 2 * 1.05, hipY + T * 0.4], [shW / 2, shY - T * 0.15], [shW / 2 * 0.8, shY], [0, shY + U]]);
  tg.scale(1, 1, D / shW * 1.3);
  const armourCol = bodyV ? trimOr('body', bodyV.tint ? tunic : matOf(bodyV.mat)) : tunic;
  torso.add(mesh(tg, armourCol, glowOf('body')));
  const belt = mesh(new THREE.CylinderGeometry(waW / 2 * 1.1, waW / 2 * 1.1, 2 * U, 16), bodyV?.sash || bodyV?.skirt >= 1 ? s.secondary : '#3a2a1e'); belt.scale.z = D / shW * 1.3; belt.position.y = hipY + U; torso.add(belt);
  if (bodyV?.skirt > 0) {
    const len = legLen * bodyV.skirt, flare = bodyV.skirt >= 1 ? 3.5 * U : U;
    const sk = lathe([[waW / 2 * 1.08, hipY + U], [waW / 2 + flare, hipY - len + 2 * U], [waW / 2 + flare * 0.9, hipY - len + U]]); sk.scale(1, 1, 0.85);
    const m = mesh(sk, armourCol); m.material = m.material.clone(); m.material.side = THREE.DoubleSide; torso.add(m);
  }
  if (bodyV?.tabard) { const tb = mesh(new THREE.BoxGeometry(5 * U, T + legLen * 0.35, U * 0.6), s.primary); tb.position.set(0, hipY + T / 2 - legLen * 0.17, D / 2 + U * 1.4); torso.add(tb); }
  if (bodyV?.plate) { const ridge = mesh(new THREE.BoxGeometry(U * 0.8, T * 0.7, U), shade(armourCol, 0.15)); ridge.position.set(0, hipY + T * 0.5, D / 2 + U * 1.3); torso.add(ridge); }
  if (items.amulet) { const a = mesh(new THREE.OctahedronGeometry(1.4 * U), trimOr('amulet', rar('amulet').trim ?? MATERIALS.gem), glowOf('amulet')); a.position.set(0, shY - 5 * U, D / 2 + 1.5 * U); torso.add(a); }
  if (R.tail) { const t = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, hipY, -D / 2), new THREE.Vector3(0.05, hipY - 0.2, -D / 2 - 0.2), new THREE.Vector3(0.2, hipY - 0.12, -D / 2 - 0.38)]), 10, U * 0.9, 6), shade(skin, -0.05)); torso.add(t); }
  if (items.cloak) {
    const v = items.cloak.vis, col = mix(s.secondary, '#1e1a16', 0.35), len = v.kind === 'mantle' ? 0.32 : shY * v.len;
    const c = mesh(new THREE.CylinderGeometry(shW / 2 + U, shW / 2 + 3 * U, len, 12, 1, true, Math.PI * 0.55, Math.PI * 0.9), trimOr('cloak', col), glowOf('cloak'));
    c.material = c.material.clone(); c.material.side = THREE.DoubleSide; c.position.y = shY - len / 2 + U; c.scale.z = 0.7; torso.add(c);
    if (v.kind === 'mantle') { const m = mesh(new THREE.SphereGeometry(shW / 2 + 1.5 * U, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.35), col); m.position.y = shY - 2.5 * U; m.scale.set(1, 0.7, 0.8); torso.add(m); }
  }
  // arms
  for (const [name, sx] of [['armL', 1], ['armR', -1]]) {
    const p = pivot(name, sx * (shW / 2 + limb * 0.7), shY - U, 0);
    const sleeves = bodyV ? bodyV.sleeves : 1, armLen = T + U;
    const upper = mesh(capsule(limb, armLen * 0.45 - limb), sleeves >= 1 ? armourCol : skin); upper.position.y = -armLen * 0.25; p.add(upper);
    const lower = mesh(capsule(limb * 0.95, armLen * 0.45 - limb), sleeves >= 2 ? armourCol : skin); lower.position.y = -armLen * 0.68; p.add(lower);
    const hv = items.hands?.vis;
    const hand = mesh(new THREE.SphereGeometry(limb * (hv?.kind === 'gauntlets' ? 1.35 : 1.1), 8, 6), hv ? trimOr('hands', matOf(hv.mat)) : skin, glowOf('hands')); hand.position.y = -armLen; p.add(hand);
    if (hv?.kind === 'bracers' || hv?.kind === 'gauntlets') { const b = mesh(new THREE.CylinderGeometry(limb * 1.2, limb * 1.25, armLen * 0.3, 10), trimOr('hands', matOf(hv.mat))); b.position.y = -armLen * 0.78; p.add(b); }
    if (bodyV?.pauldrons) { const pd = mesh(new THREE.SphereGeometry(limb * 1.8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), armourCol, glowOf('body')); pd.position.y = -U; p.add(pd); }
    if (name === 'armR' && items.mainHand) p.add(weapon(items.mainHand.vis, -armLen));
    if (name === 'armL' && items.offHand?.vis.kind === 'shield') p.add(shieldMesh(items.offHand.vis, -armLen * 0.75));
  }
  // head
  const head = pivot('head', 0, shY, 0);
  const hm = mesh(new THREE.SphereGeometry(headR, 16, 12), skin); hm.position.y = hcy - shY; hm.scale.set(1, R.bigHead ? 0.95 : 1, 0.95); head.add(hm);
  if (R.snout) { const sn = mesh(new THREE.BoxGeometry(headR * 1.1, headR * 0.8, headR * 1.2), skin); sn.position.set(0, hcy - shY - headR * 0.35, headR * 0.8); head.add(sn); }
  const eyeMat = R.id === 'drow' ? '#e84a4a' : '#1e1814';
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(1.1 * U, 1.8 * U, U * 0.5), new THREE.MeshBasicMaterial({ color: eyeMat })); e.position.set(sx * 2.4 * U, hcy - shY, headR * 0.93); head.add(e);
    if (R.ears !== 'none') { const long = R.ears === 'long' ? 5 : R.ears === 'short' || R.ears === 'ridge' ? 3 : 1.5; const ear = mesh(new THREE.ConeGeometry(U * 1.2, long * U, 5), shade(skin, -0.04)); ear.position.set(sx * (headR + long * U * 0.3), hcy - shY + U, -U); ear.rotation.z = -sx * (long > 2 ? 1.0 : 1.5); head.add(ear); }
    if (R.horns) { const h = mesh(new THREE.ConeGeometry(U * 1.3, 6 * U, 6), R.id === 'dragonborn' ? shade(skin, 0.18) : '#2e2428'); h.position.set(sx * headR * 0.55, hcy - shY + headR * 0.9, R.horns === 'back' ? -headR * 0.5 : 0); h.rotation.set(R.horns === 'back' ? -0.9 : 0, 0, -sx * 0.45); head.add(h); }
  }
  if (R.beard) { const b = mesh(new THREE.SphereGeometry(headR * 0.8, 10, 8), hair); b.position.set(0, hcy - shY - headR * 0.75, headR * 0.45); b.scale.set(1, 1.1, 0.6); head.add(b); }
  if (R.tusks) for (const sx of [-1, 1]) { const t = mesh(new THREE.ConeGeometry(U * 0.5, U * 2, 4), '#f0ead8'); t.position.set(sx * 1.8 * U, hcy - shY - headR * 0.45, headR * 0.9); head.add(t); }
  const hv = items.head?.vis;
  if (!R.bald && (!hv || hv.kind === 'circlet')) {
    const h = mesh(new THREE.SphereGeometry(headR * 1.08, 14, 8, 0, Math.PI * 2, 0, Math.PI * (s.hairStyle === 1 ? 0.62 : 0.45)), hair); h.position.y = hcy - shY; h.rotation.x = -0.35; head.add(h);
    if (s.hairStyle === 1) { const l = mesh(new THREE.BoxGeometry(headR * 1.9, headR * 1.6, headR * 0.8), hair); l.position.set(0, hcy - shY - headR * 0.6, -headR * 0.55); head.add(l); }
    if (s.hairStyle === 2) { const b = mesh(new THREE.SphereGeometry(headR * 0.45, 8, 6), hair); b.position.set(0, hcy - shY + headR * 0.8, -headR * 0.6); head.add(b); }
  }
  if (hv) {
    const col = trimOr('head', matOf(hv.mat));
    if (hv.kind === 'circlet') { const c = mesh(new THREE.TorusGeometry(headR * 1.02, U * 0.5, 6, 20), col); c.rotation.x = Math.PI / 2; c.position.y = hcy - shY + headR * 0.3; head.add(c);
      const g = mesh(new THREE.OctahedronGeometry(U * 1.1), rar('head').trim ?? MATERIALS.gem, glowOf('head')); g.position.set(0, hcy - shY + headR * 0.35, headR * 1.05); head.add(g); }
    else { const helm = mesh(new THREE.SphereGeometry(headR * 1.14, 14, 8, 0, Math.PI * 2, 0, hv.kind === 'cap' ? Math.PI * 0.4 : Math.PI * 0.47), col, glowOf('head')); helm.position.y = hcy - shY; head.add(helm);
      if (hv.kind === 'cap') { const brim = mesh(new THREE.CylinderGeometry(headR * 1.25, headR * 1.25, U * 0.6, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7), shade(col, -0.05)); brim.position.y = hcy - shY + headR * 0.28; head.add(brim); }
      if (hv.nasal) { const n = mesh(new THREE.BoxGeometry(U * 0.9, headR * 0.8, U * 0.8), col); n.position.set(0, hcy - shY, headR * 1.08); head.add(n); } }
  }
  root.userData = { rig, ms: performance.now() - t0, height: bodyH };
  return root;

  function weapon(v, handY) {
    const g = new THREE.Group(); g.position.set(0, handY, limb * 0.5);
    const Lw = v.len * bodyH, metal = trimOr('mainHand', matOf(v.mat)), haft = matOf(v.haft ?? v.mat), glow = glowOf('mainHand');
    const tilt = v.kind === 'staff' || v.kind === 'polearm' ? 0.05 : v.twoHanded ? 0.8 : 0.35;
    g.rotation.set(0.25, 0, tilt);
    if (v.kind === 'blade') {
      const bw = v.width * bodyH;
      const blade = mesh(extrude(v.curve ? [[-bw / 2, 0], [bw / 2, 0], [bw / 2 + Lw * 0.12, Lw * 0.7], [0, Lw], [-bw / 2 + Lw * 0.05, Lw * 0.6]] : [[-bw / 2, 0], [bw / 2, 0], [bw / 2, Lw * 0.85], [0, Lw], [-bw / 2, Lw * 0.85]], U * 0.8), metal, glow);
      blade.position.y = U * 2; g.add(blade);
      const guard = mesh(new THREE.BoxGeometry(v.guard === 'cross' ? bw + 5 * U : bw + 2 * U, U * 1.2, U * 1.6), MATERIALS.brass); guard.position.y = U * 1.5; g.add(guard);
      const grip = mesh(new THREE.CylinderGeometry(U * 0.7, U * 0.7, (v.twoHanded ? 7 : 4) * U, 6), '#4a3020'); grip.position.y = -U; g.add(grip);
    } else if (v.kind === 'bow') {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, -Lw / 2, 0), new THREE.Vector3(0, 0, Lw * 0.45), new THREE.Vector3(0, Lw / 2, 0));
      g.add(mesh(new THREE.TubeGeometry(curve, 16, U * 0.7, 5), haft)); g.rotation.set(0, 0, 0);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(U * 0.15, U * 0.15, Lw, 3), new THREE.MeshBasicMaterial({ color: MATERIALS.string })); g.add(str);
    } else if (v.kind === 'crossbow') {
      const st = mesh(new THREE.BoxGeometry(U * 1.6, U * 1.6, Lw), haft); st.position.z = Lw / 2 - U * 2; g.add(st); g.rotation.set(0, 0, 0);
      const prod = mesh(new THREE.BoxGeometry(Lw * 0.6, U * 0.8, U * 0.8), MATERIALS.iron); prod.position.z = Lw - U * 3; g.add(prod);
    } else if (v.kind === 'sling') { const s1 = mesh(new THREE.CylinderGeometry(U * 0.3, U * 0.3, Lw, 4), MATERIALS.leather); s1.position.y = -Lw / 2; g.add(s1); }
    else {
      const low = v.kind === 'staff' || v.kind === 'polearm' ? Lw * 0.35 : 2 * U;
      const shaft = mesh(new THREE.CylinderGeometry(U * (v.kind === 'staff' ? 1 : 0.75), U * (v.kind === 'staff' ? 1 : 0.75), Lw + low, 6), haft); shaft.position.y = (Lw - low) / 2; g.add(shaft);
      const hs = (v.head ?? 0.1) * bodyH, top = Lw - U;
      if (v.kind === 'axe' || v.blade === 'axe') { const ax = mesh(extrude([[0, -hs * 0.3], [hs, -hs * 0.6], [hs * 1.1, 0], [hs, hs * 0.6], [0, hs * 0.3]], U * 0.8), metal, glow); ax.position.y = top - hs * 0.2; ax.rotation.y = Math.PI / 2; g.add(ax);
        if (v.double) { const ax2 = ax.clone(); ax2.rotation.y = -Math.PI / 2; g.add(ax2); }
        if (v.kind === 'polearm') { const tip = mesh(new THREE.ConeGeometry(U, 5 * U, 4), metal); tip.position.y = top + 3 * U; g.add(tip); } }
      else if (v.kind === 'polearm') { const k = mesh(extrude([[0, 0], [hs * 0.35, hs * 0.3], [0, hs * 1.3], [-hs * 0.15, hs * 0.3]], U * 0.7), metal, glow); k.position.y = top - U * 2; k.rotation.y = Math.PI / 2; g.add(k); }
      else if (v.kind === 'hammer') { const hd = mesh(new THREE.BoxGeometry(hs * 1.2, hs * 0.6, hs * 0.6), metal, glow); hd.position.y = top; g.add(hd); }
      else if (v.kind === 'mace' || v.kind === 'flail') { const hd = mesh(new THREE.IcosahedronGeometry(hs * 0.55, 0), metal, glow); hd.position.y = v.kind === 'flail' ? top - hs : top; hd.position.z = v.kind === 'flail' ? hs * 0.5 : 0; g.add(hd); }
      else if (v.orb) { const o = mesh(new THREE.IcosahedronGeometry(U * 2.3, 1), rar('mainHand').trim ?? '#7fc6dd', rar('mainHand').trim ?? '#7fc6dd'); o.position.y = Lw + U * 2; g.add(o); }
    }
    return g;
  }
  function shieldMesh(v, y) {
    const size = v.size * bodyH, face = trimOr('offHand', matOf(v.mat)), glow = glowOf('offHand');
    let geo;
    if (v.shape === 'round') geo = new THREE.CylinderGeometry(size / 2, size / 2, U * 1.2, 16).rotateX(Math.PI / 2);
    else if (v.shape === 'heater') geo = extrude([[-size / 2, size / 2], [size / 2, size / 2], [size / 2, -size * 0.1], [0, -size * 0.6], [-size / 2, -size * 0.1]], U * 1.2);
    else geo = new THREE.BoxGeometry(size * 0.64, size, U * 1.4);
    const m = mesh(geo, face, glow); m.position.set(limb * 0.6, y, limb * 2.6);
    if (v.emblem || v.shape === 'tower') { const e = mesh(new THREE.BoxGeometry(size * 0.1, size * 0.6, U * 0.4), s.secondary); e.position.z = U * 0.9; m.add(e); const e2 = mesh(new THREE.BoxGeometry(size * 0.44, size * 0.1, U * 0.4), s.secondary); e2.position.set(0, size * 0.1, U * 0.9); m.add(e2); }
    return m;
  }
}
