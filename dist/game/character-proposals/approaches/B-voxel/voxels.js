// Approach B — the voxel body builder. Pure data: no three.js in here, so the same volume can be
// meshed in 3D (B), sliced for sprite-stacking (D) or baked to sprites (E).
//
// A character is a set of *parts*, each a sparse voxel grid with a pivot (shoulder, hip, neck), so
// animation is rotating parts — the same named-part rig idea as frontend/src/gen/meshes/humanoid.ts.
// Scale: 1 voxel = 1/24 world unit, a human stands ~42 voxels, the same as the pixel sprites.
import { base, rarity, MATERIALS } from '../../lib/data.js';
import { shade, mix } from '../../lib/color.js';
import { hashString } from '../../lib/rng.js';

export const VOX = 1 / 24;

class Part {
  constructor(pivot = [0, 0, 0]) { this.v = new Map(); this.pivot = pivot; this.glow = new Set(); }
  set(x, y, z, c, glow = false) { const k = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`; if (!c) return; this.v.set(k, c); if (glow) this.glow.add(k); else this.glow.delete(k); }
  has(x, y, z) { return this.v.has(`${x},${y},${z}`); }
  get(x, y, z) { return this.v.get(`${x},${y},${z}`); }
  del(x, y, z) { this.v.delete(`${x},${y},${z}`); }
}

// tiny per-voxel jitter so flat faces are not flat colour — the voxel equivalent of dithering
const jit = (c, x, y, z, amt = 0.035) => shade(c, (((hashString(`${x},${y},${z}`) & 255) / 255) - 0.5) * amt * 2);

export function buildVoxel(s, { pose = {} } = {}) {
  const R = s.race, L = s.loadout;
  const P = { legL: new Part(), legR: new Part(), torso: new Part(), armL: new Part(), armR: new Part(), head: new Part(), cloak: new Part() };
  const items = {}; for (const [slot, id] of Object.entries(L)) if (id) items[slot] = base(id);
  const rar = slot => rarity(s.rarity?.[slot] ?? 'common');
  const mat = m => (m === 'cloth' ? s.primary : MATERIALS[m] ?? m);
  const naked = ['skeleton', 'brute', 'lizard', 'winged'].includes(s.form);
  const skin = s.skin, hair = s.hair, tunic = naked ? skin : s.primary, trousers = naked ? shade(skin, -0.08) : mix(s.secondary, '#2a2018', 0.45);
  const bodyV = items.body?.vis;

  // ── proportions (same numbers as approach A so the two are comparable) ────────────────────
  const legLen = Math.round(14 * Math.pow(R.h, 1.3)), hipY = 2 + legLen;
  const T = Math.round(12 * (0.78 + 0.22 * R.h)), shY = hipY + T;
  const shW = Math.round(14 * R.w), waW = Math.round(11 * R.w), legW = Math.max(4, Math.round(5 * R.w)), armW = R.w > 1.1 ? 5 : 4;
  const D = Math.round(7 * R.w);
  const headW = R.bigHead ? 14 : 12, headH = R.bigHead ? 13 : 12, hcy = shY + headH / 2 + 1;
  const bodyH = hcy + headH / 2;
  P.legL.pivot = [-waW / 4, hipY, 0]; P.legR.pivot = [waW / 4, hipY, 0];
  P.armL.pivot = [shW / 2 + armW / 2, shY - 1, 0]; P.armR.pivot = [-shW / 2 - armW / 2, shY - 1, 0];
  P.head.pivot = [0, shY, 0];
  const itemVox = {}; const tag = (slot, part, x, y, z) => (itemVox[slot] ??= []).push([part, x, y, z]);

  const box = (part, x0, y0, z0, x1, y1, z1, col, slot) => {
    for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) for (let z = Math.round(z0); z < Math.round(z1); z++) {
      const c = typeof col === 'function' ? col(x, y, z) : jit(col, x, y, z); if (!c) continue; part.set(x, y, z, c); if (slot) tag(slot, part, x, y, z);
    }
  };
  const ell = (part, cx, cy, cz, rx, ry, rz, col, slot) => {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) for (let z = Math.floor(cz - rz); z <= cz + rz; z++) {
      const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 + ((z + 0.5 - cz) / rz) ** 2; if (d > 1) continue;
      const c = typeof col === 'function' ? col(x, y, z) : jit(col, x, y, z); if (!c) continue; part.set(x, y, z, c); if (slot) tag(slot, part, x, y, z);
    }
  };
  const seg = (part, a, b, r, col, slot) => {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 2) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n; const p = a.map((v, k) => v + (b[k] - v) * t);
      if (r <= 0.6) { const c = typeof col === 'function' ? col(...p.map(Math.round), t) : jit(col, ...p.map(Math.round)); part.set(...p, c); if (slot) tag(slot, part, ...p.map(Math.round)); }
      else ell(part, p[0], p[1], p[2], r, r, r, col, slot);
    }
  };
  /** Wrap a region of a part in a one-voxel shell — how armour, boots and helms are made. */
  const wrap = (part, pred, col, slot, grow = 1) => {
    const add = [];
    for (const k of part.v.keys()) { const [x, y, z] = k.split(',').map(Number); if (!pred(x, y, z)) continue;
      for (let dx = -grow; dx <= grow; dx++) for (let dy = -grow; dy <= grow; dy++) for (let dz = -grow; dz <= grow; dz++) {
        if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) !== 1 && grow === 1) continue;
        const X = x + dx, Y = y + dy, Z = z + dz; if (!part.has(X, Y, Z) && pred(X, Y, Z)) add.push([X, Y, Z]); } }
    for (const [x, y, z] of add) { const c = typeof col === 'function' ? col(x, y, z) : jit(col, x, y, z); if (c) { part.set(x, y, z, c); if (slot) tag(slot, part, x, y, z); } }
    // recolour the surface under the shell too, so a thin gap never shows skin through armour
    for (const k of [...part.v.keys()]) { const [x, y, z] = k.split(',').map(Number); if (pred(x, y, z) && add.length) { const c = typeof col === 'function' ? col(x, y, z) : jit(col, x, y, z); if (c) { part.set(x, y, z, c); if (slot) tag(slot, part, x, y, z); } } }
  };
  const pattern = v => {
    if (!v) return null;
    if (v.chain) return (x, y, z) => ((x + y + z) % 2 ? -0.1 : 0.02);
    if (v.rings) return (x, y) => (x % 2 === 0 && y % 2 === 0 ? 0.12 : 0);
    if (v.scales) return (x, y) => (y % 2 ? -0.12 : (x + Math.floor(y / 2)) % 3 === 0 ? 0.1 : 0);
    if (v.splints) return (x) => (x % 2 ? -0.1 : 0.03);
    if (v.studs) return (x, y, z) => (x % 3 === 1 && y % 3 === 1 ? 0.3 : 0);
    if (v.quilt) return (x, y) => ((x + y) % 4 === 0 ? -0.1 : 0);
    if (v.plate) return (x, y) => (y % 5 === 0 ? -0.1 : 0.04);
    if (v.fur) return (x, y, z) => ((x * 7 + y * 3 + z) % 5 === 0 ? -0.12 : 0);
    return null;
  };
  const patCol = (base0, pat) => (x, y, z) => jit(shade(base0, pat ? pat(x, y, z) : 0), x, y, z);

  // ── body ───────────────────────────────────────────────────────────────────────────────────
  const legCol = bodyV?.legs ? mat(bodyV.mat) : trousers;
  if (s.form === 'skeleton') { box(P.legL, -waW / 2 + 1, 2, -1, -waW / 2 + 3, hipY, 1, skin); box(P.legR, waW / 2 - 3, 2, -1, waW / 2 - 1, hipY, 1, skin); }
  else { box(P.legL, -waW / 2, 2, -2, -waW / 2 + legW, hipY, 3, legCol); box(P.legR, waW / 2 - legW, 2, -2, waW / 2, hipY, 3, legCol); }
  const footCol = R.bareFeet && !items.feet ? skin : '#3a2a1e';
  box(P.legL, -waW / 2 - 0, 0, -2, -waW / 2 + legW, 2, 5, footCol); box(P.legR, waW / 2 - legW, 0, -2, waW / 2, 2, 5, footCol);
  for (let y = hipY; y < shY; y++) { const t = (y - hipY) / (T - 1), wd = waW + (shW - waW) * t;
    if (s.form === 'skeleton') { if ((y - hipY) % 2 === 0) box(P.torso, -wd / 2 + 1, y, -2, wd / 2 - 1, y + 1, 2, skin); box(P.torso, -1, y, -2, 1, y + 1, 0, skin); }
    else box(P.torso, -wd / 2, y, -D / 2, wd / 2, y + 1, D / 2, s.form === 'hollow' ? '#141216' : tunic); }
  box(P.torso, -waW / 2 - 0.5, hipY, -D / 2 - 0.5, waW / 2 + 0.5, hipY + 2, D / 2 + 0.5, '#3a2a1e');
  for (const [part, x0] of [[P.armL, shW / 2], [P.armR, -shW / 2 - armW]]) {
    box(part, x0, hipY - 1, -2, x0 + armW, shY, 2, s.form === 'hollow' ? '#141216' : skin);
    box(part, x0, hipY - 3, -2, x0 + armW, hipY - 1, 2, skin); // hand
  }
  if (s.form === 'winged') for (const sd of [-1, 1]) for (let i = 0; i < 12; i++) box(P.torso, sd * (3 + i), shY - 2 - Math.abs(i - 6) * 0.3 + i * 0.6, -D / 2 - 2, sd * (3 + i) + 1, shY - 10 + i * 0.4, -D / 2 - 1, shade(skin, -0.2));
  // head
  if (s.form === 'hollow') ell(P.head, 0, hcy, 0.5, headW / 2, headH / 2, headW / 2 - 0.5, '#141216');
  else {
    box(P.head, -2, shY, -2, 3, shY + 2, 2, shade(skin, -0.1));
    ell(P.head, 0, hcy, 0.5, headW / 2, headH / 2, headW / 2 - 0.5, skin);
    if (R.snout) box(P.head, -3, hcy - 5, 3, 4, hcy + 1, 9, skin);
  }
  const front = (x, y) => { for (let z = 20; z > -20; z--) if (P.head.has(x, y, z)) return z; return null; };
  const paint = (x, y, c, dz = 0) => { const z = front(x, y); if (z !== null) P.head.set(x, y, z + dz, c); };
  if (s.form === 'hollow') { paint(-2, Math.round(hcy), '#7fc6dd'); paint(2, Math.round(hcy), '#7fc6dd'); P.head.glow.add(`-2,${Math.round(hcy)},${front(-2, Math.round(hcy))}`); }
  else {
    const eye = s.eyes ?? (R.id === 'drow' ? '#e84a4a' : '#1e1814'), ey = Math.round(hcy) - 1;
    for (const ex of [-3, 2]) { paint(ex, ey, eye); paint(ex, ey + 1, eye); paint(ex, ey + 3, shade(hair, -0.05)); }
    if (!R.snout) paint(0, ey - 3, shade(skin, -0.25));
    if (R.nose) box(P.head, -1, ey - 1, front(0, ey) + 1, 1, ey + 1, front(0, ey) + 2, shade(skin, 0.05));
    if (R.tusks) { paint(-2, ey - 3, '#f0ead8', 1); paint(2, ey - 3, '#f0ead8', 1); }
    if (R.beard) { ell(P.head, 0, shY - 1, 4.5, 5.5, 5, 2.5, (x, y, z) => jit(shade(hair, (x + y) % 3 === 0 ? -0.08 : 0), x, y, z, 0.05)); for (const x of [-1, 0, 1]) P.head.del(x, ey - 3, front(x, ey - 3)); }
    // ears
    const eyY = Math.round(hcy);
    for (const sd of [-1, 1]) {
      const ex = sd * (headW / 2);
      if (R.ears === 'long') seg(P.head, [ex, eyY, 0], [ex + sd * 5, eyY + 4, -1], 0.5, shade(skin, -0.04));
      else if (R.ears === 'short' || R.ears === 'ridge') seg(P.head, [ex, eyY, 0], [ex + sd * 3, eyY + 2, -1], 0.5, shade(skin, -0.04));
      else if (R.ears !== 'none') box(P.head, ex - (sd < 0 ? 1 : 0), eyY - 1, -1, ex + (sd > 0 ? 1 : 0), eyY + 1, 1, shade(skin, -0.04));
    }
    // hair: a shell over the top and back of the skull
    if (!R.bald && s.form !== 'skeleton') {
      const hideTop = items.head && items.head.vis.kind !== 'circlet';
      const long = s.hairStyle === 1;
      wrap(P.head, (x, y, z) => Math.abs(x) <= headW / 2 && y <= hcy + headH / 2 + 1 && (!hideTop || long && z < -2) && (y >= hcy + 1 || (z <= -2 && y >= hcy - (long ? 9 : 3)) || (Math.abs(x) >= headW / 2 - 1 && y >= hcy - 1 && z < 3)), (x, y, z) => jit(shade(hair, (x * 3 + y) % 5 === 0 ? -0.08 : 0), x, y, z, 0.05));
      if (s.hairStyle === 2 && !hideTop) ell(P.head, 0, hcy + headH / 2 + 1, -3, 3, 2.5, 3, hair);
      if (R.topknot && !hideTop) seg(P.head, [0, hcy + headH / 2, 0], [0, hcy + headH / 2 + 5, -1], 1.2, hair);
      if (R.curls && !hideTop) for (let i = -4; i <= 4; i += 2) ell(P.head, i, hcy + headH / 2, 1, 1.6, 1.6, 1.6, hair);
    }
    if (R.horns) for (const sd of [-1, 1]) {
      const col = R.id === 'dragonborn' ? shade(skin, 0.18) : '#2e2428';
      if (R.horns === 'curl') { seg(P.head, [sd * 4, hcy + 4, 1], [sd * 6, hcy + 9, 0], 1, col); seg(P.head, [sd * 6, hcy + 9, 0], [sd * 8, hcy + 8, 2], 0.6, col); }
      else seg(P.head, [sd * 3, hcy + 3, -2], [sd * 5, hcy + 7, -8], 0.9, col);
    }
  }
  if (R.tail) seg(P.torso, [0, hipY + 1, -D / 2], [2, hipY - 6, -D / 2 - 7], 1, shade(skin, -0.05)), seg(P.torso, [2, hipY - 6, -D / 2 - 7], [5, hipY - 3, -D / 2 - 10], 0.6, shade(skin, -0.05));

  // ── gear ───────────────────────────────────────────────────────────────────────────────────
  if (bodyV) {
    const col = bodyV.tint ? tunic : mat(bodyV.mat), pat = pattern(bodyV), c = patCol(col, pat);
    wrap(P.torso, (x, y) => y >= hipY - 1 && y < shY + (bodyV.pauldrons ? 1 : 0) && (bodyV.plate !== 'chest' || y > hipY + 1), c, 'body');
    if (bodyV.plate === 'chest') wrap(P.torso, (x, y) => y >= hipY && y <= hipY + 1, patCol(s.primary), null);
    if (bodyV.skirt > 0) {
      const len = Math.round(legLen * bodyV.skirt), flare = bodyV.skirt >= 1 ? 3 : 1;
      for (let y = hipY - len; y < hipY; y++) { const t = (hipY - y) / Math.max(1, len), r = waW / 2 + 1 + flare * t, rz = D / 2 + 1 + flare * t * 0.8;
        for (let x = -Math.ceil(r); x <= r; x++) for (let z = -Math.ceil(rz); z <= rz; z++) { const d = (x / r) ** 2 + (z / rz) ** 2; if (d <= 1 && d > 0.55) { P.torso.set(x, y, z, c(x, y, z)); tag('body', P.torso, x, y, z); } } }
    }
    const sleeves = bodyV.sleeves;
    for (const part of [P.armL, P.armR]) {
      if (sleeves > 0) wrap(part, (x, y) => y >= (sleeves === 2 ? hipY - 1 : shY - T / 2) && y < shY, bodyV.under && sleeves < 2 ? patCol(s.primary) : c, 'body');
      if (bodyV.pauldrons) { const cx = part.pivot[0]; ell(part, cx, shY, 0, armW / 2 + 1.5, 2.5, 3.2, patCol(mat(bodyV.mat)), 'body'); }
    }
    if (bodyV.tabard) box(P.torso, -2, hipY - Math.round(legLen * 0.35), D / 2 + 1, 3, shY - 1, D / 2 + 2, s.primary);
    if (bodyV.fur) for (let x = -shW / 2 - 1; x <= shW / 2 + 1; x++) for (let z = -D / 2 - 1; z <= D / 2 + 1; z++) if (Math.abs(z) >= D / 2 || Math.abs(x) >= shW / 2 - 1) box(P.torso, x, shY - 1 - ((x * 5 + z) % 3 + 3) % 3, z, x + 1, shY + 1, z + 1, shade(MATERIALS.bone, -0.15));
    if (bodyV.sash || bodyV.skirt >= 1) box(P.torso, -waW / 2 - 1, hipY, -D / 2 - 1, waW / 2 + 1, hipY + 2, D / 2 + 2, s.secondary);
  }
  const fv = items.feet?.vis;
  if (fv) for (const part of [P.legL, P.legR]) wrap(part, (x, y) => y < 2 + legLen * fv.height * 0.55, patCol(mat(fv.mat), fv.kind === 'greaves' ? (x, y) => (y % 4 === 0 ? 0.12 : 0) : null), 'feet');
  const hv = items.hands?.vis;
  if (hv) for (const part of [P.armL, P.armR]) wrap(part, (x, y) => y < hipY + (hv.kind === 'gloves' ? -1 : 3), patCol(mat(hv.mat), hv.kind === 'bracers' ? (x, y) => (x % 2 === 0 && y % 2 === 0 ? 0.3 : 0) : null), 'hands');
  if (items.head) {
    const v = items.head.vis, col = mat(v.mat);
    if (v.kind === 'circlet') { for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; P.head.set(Math.cos(t) * (headW / 2 + 0.5), hcy + 2, Math.sin(t) * (headW / 2) + 0.5, col); tag('head', P.head, Math.round(Math.cos(t) * (headW / 2 + 0.5)), Math.round(hcy + 2), Math.round(Math.sin(t) * (headW / 2) + 0.5)); }
      P.head.set(0, hcy + 3, headW / 2 + 1, rar('head').trim ?? MATERIALS.gem, true); }
    else {
      const face = (x, y, z) => v.kind === 'helm' && z > 1 && y < hcy + 2 && y > hcy - headH / 2 + 1 && Math.abs(x) < headW / 2 - 1 && !(v.nasal && x === 0 && y > hcy - 2);
      wrap(P.head, (x, y, z) => (v.kind === 'cap' ? y >= hcy + 2 : y >= hcy - headH / 2 + 1) && !face(x, y, z), patCol(col, v.kind === 'helm' ? (x, y) => (y === Math.round(hcy + 3) ? 0.12 : 0) : null), 'head');
      if (v.kind === 'cap') box(P.head, -headW / 2, hcy + 2, 2, headW / 2, hcy + 3, headW / 2 + 3, shade(col, -0.05), 'head');
    }
  }
  if (items.cloak) {
    const v = items.cloak.vis, col = mix(s.secondary, '#1e1a16', 0.35), len = v.kind === 'mantle' ? 8 : Math.round((shY - 1) * v.len);
    for (let y = shY + 1 - len; y <= shY + 1; y++) { const t = (shY + 1 - y) / len, hw = shW / 2 + 1 + t * 3;
      for (let x = -Math.ceil(hw); x <= hw; x++) { const z = -D / 2 - 2 - Math.round(t * 2); P.cloak.set(x, y, z, jit(shade(col, (x % 4 === 0) ? -0.06 : 0), x, y, z)); tag('cloak', P.cloak, x, y, z); } }
    for (let x = -shW / 2 - 1; x <= shW / 2 + 1; x++) for (let z = -D / 2 - 2; z <= D / 2 + 1; z++) { P.cloak.set(x, shY + 1, z, jit(col, x, 0, z)); tag('cloak', P.cloak, x, shY + 1, z); }
    if (v.kind === 'mantle') for (let x = -shW / 2 - 2; x <= shW / 2 + 2; x++) for (let z = -D / 2 - 1; z <= D / 2 + 2; z++) { const y = shY - (Math.abs(x) > shW / 2 - 1 ? 3 : 1); box(P.cloak, x, y, z, x + 1, shY + 2, z + 1, col, 'cloak'); }
  }
  if (items.amulet) { const col = mat(items.amulet.vis.mat); seg(P.torso, [-3, shY, D / 2], [0, shY - 4, D / 2 + 1], 0.5, shade(col, 0.1)); seg(P.torso, [3, shY, D / 2], [0, shY - 4, D / 2 + 1], 0.5, shade(col, 0.1)); box(P.torso, -1, shY - 7, D / 2 + 1, 2, shY - 4, D / 2 + 2, col, 'amulet'); P.torso.set(0, shY - 6, D / 2 + 2, rar('amulet').trim ?? MATERIALS.gem, !!rar('amulet').glow); }
  if (items.ring) P.armR.set(-shW / 2 - armW - 1, hipY - 3, 1, rar('ring').trim ?? shade(mat(items.ring.vis.mat), 0.25), !!rar('ring').glow);

  // weapon — built in the right arm's space so it swings with the arm
  const w = items.mainHand?.vis;
  if (w) {
    const g = [-shW / 2 - armW / 2, hipY - 2, w.twoHanded ? D / 2 + 2 : 2]; const Lw = Math.max(5, Math.round(w.len * bodyH));
    const up = w.kind === 'staff' || w.kind === 'polearm' ? [0, 1, 0.05] : w.twoHanded ? [0.55, 0.8, 0.25] : [-0.35, 0.88, 0.3];
    const at = t => g.map((v, k) => v + up[k] * t);
    const metal = mat(w.mat), haft = mat(w.haft ?? w.mat), part = P.armR;
    if (w.kind === 'blade') {
      const bw = Math.max(1, Math.round(w.width * bodyH));
      seg(part, at(-3), at(0), 0.5, '#4a3020', 'mainHand');
      const cw = w.guard === 'cross' ? bw + 3 : 2; for (let i = -cw; i <= cw; i++) part.set(g[0] + i * 0.8, g[1], g[2], jit(MATERIALS.brass, i, 0, 0)), tag('mainHand', part, Math.round(g[0] + i * 0.8), g[1], g[2]);
      for (let i = 1; i <= Lw; i++) { const p = at(i); const width = Math.max(0, Math.round(bw / 2 - (i > Lw - 2 ? 1 : 0))); const cur = w.curve ? Math.round(Math.sin(i / Lw * Math.PI * 0.8) * 2.5) : 0;
        for (let d = -width; d <= width; d++) { const x = Math.round(p[0] + d), y = Math.round(p[1]), z = Math.round(p[2]) + cur; part.set(x, y, z, jit(d === 0 && bw > 2 ? shade(metal, 0.15) : metal, x, y, z)); tag('mainHand', part, x, y, z); } }
    } else if (['axe', 'hammer', 'mace', 'flail', 'staff', 'polearm'].includes(w.kind)) {
      const low = w.kind === 'staff' || w.kind === 'polearm' ? Math.round(Lw * 0.35) : 2;
      seg(part, at(-low), at(Lw), w.kind === 'staff' ? 0.9 : 0.5, (x, y, z) => jit(haft, x, y, z), 'mainHand');
      const hs = Math.round((w.head ?? 0.1) * bodyH), h = at(Lw - 1);
      if (w.kind === 'axe' || w.blade === 'axe') {
        for (const sd of w.double ? [-1, 1] : [1]) for (let i = 0; i <= hs; i++) for (let j = -Math.round(i * 0.6) - 1; j <= Math.round(i * 0.6) + 1; j++) { const x = Math.round(h[0]), y = Math.round(h[1] + j), z = Math.round(h[2] + sd * i); part.set(x, y, z, jit(i === hs ? shade(metal, 0.15) : metal, x, y, z)); tag('mainHand', part, x, y, z); }
        if (w.kind === 'polearm') seg(part, at(Lw), at(Lw + 5), 0.5, metal, 'mainHand');
      } else if (w.kind === 'polearm') { seg(part, at(Lw - 2), at(Lw + hs), 0.9, metal, 'mainHand'); }
      else if (w.kind === 'hammer') { box(part, h[0] - 2, h[1] - 2, h[2] - hs * 0.6, h[0] + 2, h[1] + 2, h[2] + hs * 0.6, metal, 'mainHand'); }
      else if (w.kind === 'mace') { ell(part, h[0], h[1], h[2], hs / 2 + 0.5, hs / 2 + 0.5, hs / 2 + 0.5, (x, y, z) => jit((x + y + z) % 3 ? metal : shade(metal, -0.15), x, y, z), 'mainHand'); }
      else if (w.kind === 'flail') { const e = at(Lw); seg(part, e, [e[0], e[1] - 4, e[2] + 2], 0.5, MATERIALS.iron); ell(part, e[0], e[1] - 6, e[2] + 3, hs / 2 + 0.5, hs / 2 + 0.5, hs / 2 + 0.5, metal, 'mainHand'); }
      else if (w.kind === 'staff' && w.orb) { const e = at(Lw + 2); ell(part, e[0], e[1], e[2], 2.2, 2.2, 2.2, rar('mainHand').trim ?? '#7fc6dd', 'mainHand'); for (const k of part.v.keys()) { const [x, y, z] = k.split(',').map(Number); if (Math.hypot(x - e[0], y - e[1], z - e[2]) < 2.4) part.glow.add(k); } }
    } else if (w.kind === 'bow') {
      for (let i = -Lw / 2; i <= Lw / 2; i++) { const t = i / (Lw / 2); const x = Math.round(g[0]), y = Math.round(g[1] + i), z = Math.round(g[2] + (1 - t * t) * Lw * 0.2); part.set(x, y, z, jit(haft, x, y, z)); tag('mainHand', part, x, y, z); part.set(x, y, Math.round(g[2]), MATERIALS.string); }
    } else if (w.kind === 'crossbow') {
      seg(part, [g[0], g[1], g[2] - 2], [g[0], g[1] + 1, g[2] + Lw * 0.7], 1, haft, 'mainHand');
      seg(part, [g[0] - Lw * 0.25, g[1] + 1, g[2] + Lw * 0.6], [g[0] + Lw * 0.25, g[1] + 1, g[2] + Lw * 0.6], 0.5, MATERIALS.iron, 'mainHand');
    } else if (w.kind === 'sling') seg(part, g, [g[0], g[1] - 6, g[2] + 1], 0.5, MATERIALS.leather, 'mainHand');
  }
  const o = items.offHand?.vis;
  if (o?.kind === 'shield') {
    const size = Math.round(o.size * bodyH), c = [shW / 2 + armW / 2, hipY + 3, 3], part = P.armL, face = mat(o.mat), rim = o.rim ? mat(o.rim) : shade(face, -0.1);
    for (let y = -size; y <= size; y++) for (let z = -size; z <= size; z++) {
      let inside, edge;
      const r = Math.hypot(y, z) / (size / 2);
      if (o.shape === 'round') { inside = r <= 1; edge = r > 0.8; }
      else if (o.shape === 'heater') { const yy = y / (size / 2); inside = Math.abs(z) <= size / 2 && yy <= 0.6 && yy >= -1.1 + Math.abs(z) / (size / 2) * 0.9; edge = Math.abs(z) >= size / 2 - 1 || yy >= 0.45 || yy <= -1.0 + Math.abs(z) / (size / 2) * 0.9; }
      else { inside = Math.abs(z) <= size * 0.32 && Math.abs(y) <= size / 2; edge = Math.abs(z) >= size * 0.32 - 1 || Math.abs(y) >= size / 2 - 1; }
      if (!inside) continue;
      const emb = (o.emblem || o.shape === 'tower') && (Math.abs(z) < 1 || Math.abs(y - size * 0.1) < 1) && !edge;
      for (let d = 0; d < 2; d++) { const x = c[0] + z, Y = c[1] + y, Z = c[2] + d; part.set(x, Y, Z, jit(edge ? rim : emb ? s.secondary : face, x, Y, Z)); tag('offHand', part, x, Y, Z); }
    }
  }

  // ── rarity: trim voxels in the rarity colour, Very Rare and up glow ────────────────────────
  for (const [slot, list] of Object.entries(itemVox)) {
    const r = rar(slot); if (!r.trim) continue;
    for (const [part, x, y, z] of list) {
      const exposed = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1]].filter(([a, b, c]) => !part.has(x + a, y + b, z + c)).length;
      if (exposed >= 2 && (x + y + z) % 2 === 0) part.set(x, y, z, jit(r.trim, x, y, z), !!r.glow);
    }
  }
  return { parts: P, height: bodyH, hipY, shY };
}
