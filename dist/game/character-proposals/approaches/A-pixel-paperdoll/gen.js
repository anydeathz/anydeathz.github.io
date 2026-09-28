// Approach A — procedural pixel paper-doll.
//
// A character is drawn, pixel by pixel, by code: a race-proportioned body built from masks,
// then every equipped item drawn from its recipe in lib/data.js, layer by layer. There is no
// sprite sheet anywhere — change a field of the recipe and the drawing changes.
//
//   renderA(spec, { facing: 'front' | 'back', anim: 'idle' | 'walk' | 'attack', frame }) → Sprite
//
// The sprite is 56×72; a human stands ~42px. It is shown ×1 on the map (billboarded) and ×4–5
// on the character sheet — nearest-neighbour, which is what keeps it crisp.
import { Sprite, Mask } from '../../lib/pixel.js';
import { ramp, shade, mix } from '../../lib/color.js';
import { base, rarity, MATERIALS } from '../../lib/data.js';

export const W = 56, H = 72;

const POSES = {
  idle:   [{ bob: 0 }, { bob: 0 }, { bob: 1 }, { bob: 1 }],
  walk:   [{ bob: 0, lift: [2, 0], swing: 1 }, { bob: 1 }, { bob: 0, lift: [0, 2], swing: -1 }, { bob: 1 }],
  attack: [{ bob: 0, raise: 0.9 }, { bob: 0, raise: 0.4 }, { bob: 1, raise: -0.6, lunge: 1 }, { bob: 0, raise: -0.2 }],
};
export const FRAME_COUNT = { idle: 4, walk: 4, attack: 4 };

function matColor(m, s) { return m === 'cloth' ? s.primary : MATERIALS[m] ?? m; }
const isMetal = m => m === 'iron' || m === 'steel' || m === 'brass';

export function renderA(s, { facing = 'front', anim = 'idle', frame = 0 } = {}) {
  const sp = new Sprite(W, H);
  const pose = POSES[anim][frame % 4];
  const R = s.race, L = s.loadout;
  const back = facing === 'back';

  // ── skeleton ─────────────────────────────────────────────────────────────────────────────
  const cx = 28, footY = 68 - (pose.bob ?? 0) * 0;
  const legLen = Math.round(14 * Math.pow(R.h, 1.3));
  const hipY = footY - 2 - legLen + (pose.bob ?? 0);
  const torsoH = Math.round(12 * (0.78 + 0.22 * R.h));
  const shY = hipY - torsoH;
  const shW = Math.round(14 * R.w), waW = Math.round(11 * R.w);
  const headW = R.bigHead ? 14 : 12, headH = R.bigHead ? 13 : 12;
  const headCY = shY - headH / 2;
  const armW = R.w > 1.1 ? 5 : 4;
  const legW = Math.max(4, Math.round(5 * R.w));
  const bodyH = footY - (headCY - headH / 2); // for weapon scale
  const sw = pose.swing ?? 0;

  const handR = { x: cx - shW / 2 - armW / 2 + 0.5, y: hipY + 1 - sw }; // character's right = viewer's left
  const handL = { x: cx + shW / 2 + armW / 2 - 0.5, y: hipY + 1 + sw };

  const items = {}; for (const [slot, id] of Object.entries(L)) if (id) items[slot] = base(id);
  const rar = slot => rarity(s.rarity?.[slot] ?? 'common');
  const itemMasks = []; // for rarity trims and halos, applied at the end

  const skin = s.skin, hair = s.hair;
  const naked = s.form === 'skeleton' || s.form === 'brute' || s.form === 'lizard' || s.form === 'winged';
  const tunic = naked ? skin : s.primary, trousers = naked ? shade(skin, -0.08) : mix(s.secondary, '#2a2018', 0.45);
  const bodyV = items.body?.vis;
  const cloakCol = mix(s.secondary, '#1e1a16', 0.35);

  // ── masks for the body ───────────────────────────────────────────────────────────────────
  const legs = [0, 1].map(i => {
    const lx = i === 0 ? cx - waW / 2 + 0.5 : cx + waW / 2 - legW - 0.5;
    const lift = pose.lift?.[i] ?? 0;
    return new Mask(W, H).rect(Math.round(lx), hipY, legW, legLen + 1 - lift);
  });
  const feet = [0, 1].map(i => {
    const lx = i === 0 ? cx - waW / 2 + 0.5 : cx + waW / 2 - legW - 0.5;
    const lift = pose.lift?.[i] ?? 0;
    const big = R.bareFeet && !items.feet ? 1 : 0;
    return new Mask(W, H).rect(Math.round(lx) - (i === 0 ? 1 + big : 0), footY - 2 - lift, legW + 1 + big, 2);
  });
  const torso = new Mask(W, H).poly([[cx - shW / 2, shY], [cx + shW / 2, shY], [cx + waW / 2, hipY + 1], [cx - waW / 2, hipY + 1]]);
  const arm = (side, upperOnly) => {
    const x = side < 0 ? cx - shW / 2 - armW + 1 : cx + shW / 2 - 1;
    const hand = side < 0 ? handR : handL;
    const endY = upperOnly ? shY + Math.round(torsoH * 0.5) : hand.y - 1;
    return new Mask(W, H).poly([[x, shY + 1], [x + armW, shY + 1], [x + armW - (side < 0 ? 0 : 1), endY], [x + (side < 0 ? 1 : 0), endY]]).rect(x + (side < 0 ? 1 : 0), shY + 1, armW - 1, 2);
  };
  const handMask = side => { const h = side < 0 ? handR : handL; return new Mask(W, H).rect(Math.round(h.x - armW / 2 + 0.5), Math.round(h.y - 1), armW, 3); };
  const head = new Mask(W, H).ellipse(cx + 0.5, headCY, headW / 2, headH / 2).rect(cx - headW / 2 + 1, headCY, headW - 2, headH / 2 - 1);
  if (R.snout) head.poly([[cx + 1, headCY + 1], [cx + headW / 2 + 4, headCY + 1], [cx + headW / 2 + 4, headCY + 5], [cx + 1, headCY + 6]]);
  const neck = new Mask(W, H).rect(cx - 2, shY - 2, 5, 3);

  // ── behind everything: cloak, tail, long hair, back-view weapon ───────────────────────────
  if (items.cloak?.vis.kind === 'cloak' && !back) {
    const len = items.cloak.vis.len;
    const m = new Mask(W, H).poly([[cx - shW / 2 - 1, shY], [cx + shW / 2 + 1, shY], [cx + shW / 2 + 4, shY + (footY - shY) * len], [cx - shW / 2 - 4, shY + (footY - shY) * len]]);
    sp.paint(m, shade(cloakCol, -0.1), { edge: false });
    itemMasks.push(['cloak', m]);
  }
  if (R.tail) {
    const m = new Mask(W, H).bar(cx + 3, hipY + 1, cx + 9, hipY + 9, 2).bar(cx + 9, hipY + 9, cx + 13, hipY + 7, 1.5).poly([[cx + 12, hipY + 5], [cx + 16, hipY + 6], [cx + 13, hipY + 9]]);
    sp.paint(m, shade(skin, -0.05));
  }
  if (!R.bald && s.hairStyle === 1 && !back) {
    sp.paint(new Mask(W, H).rect(cx - headW / 2, headCY - 2, headW + 1, headH / 2 + 7), shade(hair, -0.08), { edge: false });
  }
  if (s.form === 'winged') for (const side of [-1, 1]) {
    const wx = cx + side * 3, m = new Mask(W, H).poly([[wx, shY + 2], [wx + side * 14, shY - 8], [wx + side * 12, shY + 1], [wx + side * 15, shY + 4], [wx + side * 6, shY + 9]]);
    sp.paint(m, shade(skin, -0.2), { pattern: (x) => ((x - wx) % 4 === 0 ? -1 : 0) });
  }
  if (back) drawWeapon(true);

  // ── legs and feet ────────────────────────────────────────────────────────────────────────
  const legCol = bodyV?.legs ? matColor(bodyV.mat, s) : trousers;
  if (s.form === 'skeleton') legs.forEach(m => m.intersect(thin(m)));
  legs.forEach(m => sp.paint(m, legCol, { pattern: bodyV?.legs ? (x, y) => (y % 4 === 0 ? -1 : 0) : null }));
  const fv = items.feet?.vis;
  feet.forEach((m, i) => {
    if (!fv) { sp.paint(m, R.bareFeet ? skin : '#3a2a1e'); return; }
    const top = Math.round(footY - 2 - legLen * fv.height * 0.55) - (pose.lift?.[i] ?? 0);
    const lx = i === 0 ? cx - waW / 2 + 0.5 : cx + waW / 2 - legW - 0.5;
    const shaft = new Mask(W, H).rect(Math.round(lx) - (fv.kind === 'greaves' ? 0 : 0), top, legW, footY - 2 - (pose.lift?.[i] ?? 0) - top).union(m);
    sp.paint(shaft, matColor(fv.mat, s), { pattern: fv.kind === 'greaves' ? (x, y) => (y === top + 1 ? 1 : 0) : null });
    if (fv.kind === 'boots') sp.paint(new Mask(W, H).rect(Math.round(lx), top, legW, 1), shade(MATERIALS.leather, 0.1), { edge: false, flat: true });
    if (fv.kind === 'greaves') sp.paint(new Mask(W, H).rect(Math.round(lx) + 1, top + Math.round((footY - top) * 0.35), legW - 2, 2), shade(MATERIALS.steel, 0.05));
    itemMasks.push(['feet', shaft]);
  });

  // ── torso: tunic, then armour, then skirt ────────────────────────────────────────────────
  if (s.form === 'skeleton') {
    const ribs = new Mask(W, H); for (let y = shY + 1; y < hipY - 1; y += 2) ribs.rect(cx - shW / 2 + 2, y, shW - 3, 1);
    ribs.rect(cx, shY, 1, torsoH); sp.paint(ribs, skin, { flat: true });
  } else if (s.form === 'hollow') sp.paint(torso, '#141216', { flat: true });
  else sp.paint(torso, tunic);
  sp.paint(new Mask(W, H).rect(cx - waW / 2, hipY - 1, waW + 1, 2), '#3a2a1e', { flat: true }); // belt
  if (bodyV) drawBodyArmour(bodyV);

  // ── arms ─────────────────────────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const full = arm(side, false);
    sp.paint(full, s.form === 'hollow' ? '#141216' : skin);
    const sleeves = bodyV ? bodyV.sleeves : 1;
    if (sleeves > 0) {
      const col = bodyV ? (bodyV.tint ? tunic : matColor(bodyV.under && sleeves < 2 ? 'cloth' : bodyV.mat, s)) : tunic;
      const m = sleeves === 2 ? full : arm(side, true);
      if (bodyV?.robe || bodyV?.skirt === 1) m.rect(side < 0 ? Math.round(handR.x - armW / 2) - 1 : Math.round(handL.x - armW / 2), (side < 0 ? handR.y : handL.y) - 4, armW + 1, 3);
      sp.paint(m, col, { pattern: materialPattern(bodyV) });
      if (bodyV) itemMasks.push(['body', m]);
    }
    if (bodyV?.pauldrons) {
      const px = side < 0 ? cx - shW / 2 - 1 : cx + shW / 2 + 1;
      const m = new Mask(W, H).ellipse(px, shY + 2, armW / 2 + 1.5, 2.5);
      sp.paint(m, matColor(bodyV.mat, s), { light: 'top' }); itemMasks.push(['body', m]);
    }
    const hm = handMask(side);
    const hv = items.hands?.vis;
    if (hv?.kind === 'gauntlets') { hm.rect(Math.round((side < 0 ? handR : handL).x - armW / 2) - 0, (side < 0 ? handR : handL).y - 5, armW, 4); sp.paint(hm, MATERIALS.steel); itemMasks.push(['hands', hm]); }
    else if (hv?.kind === 'gloves') { sp.paint(hm, MATERIALS.leather); itemMasks.push(['hands', hm]); }
    else sp.paint(hm, skin);
    if (hv?.kind === 'bracers') {
      const h = side < 0 ? handR : handL;
      const bm = new Mask(W, H).rect(Math.round(h.x - armW / 2), h.y - 5, armW, 3);
      sp.paint(bm, MATERIALS.studded, { pattern: (x, y) => (x % 2 === 0 && y % 2 === 0 ? 2 : 0) }); itemMasks.push(['hands', bm]);
    }
    if (side < 0 && items.ring) sp.dot(handR.x - 1, handR.y + 1, rar('ring').trim ?? shade(matColor(items.ring.vis.mat, s), 0.25));
  }

  // ── amulet ───────────────────────────────────────────────────────────────────────────────
  if (items.amulet && !back) {
    const av = items.amulet.vis; const col = matColor(av.mat, s);
    const m = new Mask(W, H).line(cx - 3, shY, cx, shY + 4).line(cx + 3, shY, cx + 1, shY + 4);
    sp.paint(m, shade(col, 0.1), { flat: true, edge: false });
    const pend = new Mask(W, H).rect(cx - 1, shY + 4, 3, 3);
    sp.paint(pend, col, { edge: false });
    if (av.gem) sp.dot(cx, shY + 5, rar('amulet').trim ?? MATERIALS.gem);
    itemMasks.push(['amulet', pend]);
  }

  if (items.cloak?.vis.kind === 'mantle') {
    const m = new Mask(W, H).poly([[cx - shW / 2 - 2, shY - 1], [cx + shW / 2 + 2, shY - 1], [cx + shW / 2 + 3, shY + 5], [cx, shY + 7], [cx - shW / 2 - 3, shY + 5]]);
    if (!back) m.subtract(new Mask(W, H).rect(cx - 2, shY - 1, 5, 4));
    sp.paint(m, cloakCol, { light: 'top' }); itemMasks.push(['cloak', m]);
  }
  if (items.cloak?.vis.kind === 'cloak') {
    if (back) {
      const len = items.cloak.vis.len;
      const m = new Mask(W, H).poly([[cx - shW / 2 - 1, shY - 1], [cx + shW / 2 + 1, shY - 1], [cx + shW / 2 + 4, shY + (footY - shY) * len], [cx - shW / 2 - 4, shY + (footY - shY) * len]]);
      sp.paint(m, cloakCol, { pattern: (x) => ((x - cx) % 4 === 0 ? -1 : 0) }); itemMasks.push(['cloak', m]);
    } else {
      // the collar and the clasp — the only part of a cloak you see from the front
      const m = new Mask(W, H).rect(cx - shW / 2 - 1, shY - 1, 3, 3).rect(cx + shW / 2 - 1, shY - 1, 3, 3).rect(cx - shW / 2 - 1, shY - 1, shW + 3, 1);
      sp.paint(m, cloakCol, { flat: true });
      sp.dot(cx - shW / 2 + 1, shY + 1, MATERIALS.brass);
      if (items.cloak.vis.hood && !items.head) sp.paint(new Mask(W, H).rect(cx - 5, shY - 3, 11, 2), shade(cloakCol, -0.08), { flat: true });
    }
  }

  // ── head ─────────────────────────────────────────────────────────────────────────────────
  if (s.form === 'hollow') {
    // animated armour: nothing inside the helm but two cold lights
    sp.paint(head, '#141216', { flat: true });
    if (!back) { sp.dot(cx - 1, headCY, '#7fc6dd'); sp.dot(cx + 3, headCY, '#7fc6dd'); }
  } else {
    sp.paint(neck, shade(skin, -0.1), { flat: true });
    drawEars(-1); drawEars(1);
    sp.paint(head, skin);
    if (!back) drawFace();
    drawHair();
    if (R.horns) drawHorns();
  }
  if (items.head) drawHeadgear(items.head.vis);
  // ── hands' contents ──────────────────────────────────────────────────────────────────────
  if (!back) drawWeapon(false);
  if (items.offHand) drawShield(items.offHand.vis);

  // ── finish: outline, rarity trims, halos ─────────────────────────────────────────────────
  sp.outline();
  for (const [slot, m] of itemMasks) {
    const r = rar(slot); if (!r.trim) continue;
    trim(m, r.trim);
    if (r.glow) sp.halo(m, r.trim, r.glow * 0.55);
  }
  // legendary: a two-pixel glint that walks along the item with the frame
  for (const [slot, m] of itemMasks) {
    if (rar(slot).id !== 'legendary') continue;
    const pts = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m.has(x, y) && !m.has(x - 1, y - 1)) pts.push([x, y]);
    if (pts.length) { const p = pts[(frame * 7 + 3) % pts.length]; sp.dot(p[0], p[1], '#fff6d8'); sp.dot(p[0] + 1, p[1] - 1, '#fff6d8'); }
  }
  return sp;

  // ═════════════════════════════════════════════════════════════════════════════════════════
  function thin(m) { const { x0, x1 } = m.bbox(); const c = Math.round((x0 + x1) / 2); return new Mask(W, H).rect(c - 1, 0, 2, H); }
  function trim(m, color) {
    // top/left rim of the item in the rarity colour — reads as a border on metal, a hem on cloth
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!m.has(x, y)) continue;
      if (!m.has(x, y - 1) || !m.has(x - 1, y)) { sp.put(x, y, shade(color, 0.05)); }
    }
  }

  function materialPattern(v) {
    if (!v) return null;
    if (v.chain) return (x, y) => ((x + (y % 2)) % 2 === 0 ? 0 : -1);
    if (v.rings) return (x, y) => (x % 2 === 0 && y % 2 === 0 ? 1 : 0);
    if (v.scales) return (x, y) => { const r = Math.floor(y / 2); return y % 2 === 1 ? -1 : ((x + r) % 3 === 0 ? 1 : 0); };
    if (v.splints) return (x) => (x % 2 === 0 ? -1 : 0);
    if (v.studs) return (x, y) => (x % 3 === 1 && y % 3 === 1 ? 2 : 0);
    if (v.quilt) return (x, y) => ((x + y) % 4 === 0 || (x - y + 64) % 4 === 0 ? -1 : 0);
    if (v.plate) return (x, y) => (y % 5 === 0 ? -1 : 0);
    if (v.fur) return (x, y) => ((x * 7 + y * 3) % 5 === 0 ? -1 : 0);
    return null;
  }

  function drawBodyArmour(v) {
    const col = v.tint ? tunic : matColor(v.mat, s);
    const pat = materialPattern(v);
    if (v.skirt > 0) {
      const len = Math.round(legLen * v.skirt);
      const flare = v.skirt >= 1 ? 4 : 1;
      const m = new Mask(W, H).poly([[cx - waW / 2 - 0.5, hipY], [cx + waW / 2 + 0.5, hipY], [cx + waW / 2 + flare, hipY + len], [cx - waW / 2 - flare, hipY + len]]);
      if (v.skirt >= 1) m.subtract(new Mask(W, H).rect(0, footY - 2, W, 4));
      sp.paint(m, v.mat === 'steel' && v.plate === 'full' ? MATERIALS.iron : col, { pattern: pat ?? (v.skirt >= 1 ? (x) => ((x - cx) % 3 === 0 ? -1 : 0) : null) });
      itemMasks.push(['body', m]);
    }
    const m = torso.clone();
    if (v.plate === 'chest') m.intersect(new Mask(W, H).rect(0, shY + 1, W, torsoH - 2));
    sp.paint(m, col, { pattern: pat });
    itemMasks.push(['body', m]);
    if (v.plate) sp.paint(new Mask(W, H).rect(cx, shY + 2, 1, torsoH - 4), shade(col, 0.18), { flat: true, edge: false }); // ridge
    if (v.tabard) {
      const t = new Mask(W, H).rect(cx - 2, shY + 1, 5, torsoH + Math.round(legLen * 0.35));
      sp.paint(t, s.primary, { pattern: (x, y) => (y === shY + 4 && Math.abs(x - cx) <= 1 ? 2 : 0) });
    }
    if (v.fur) {
      const f = new Mask(W, H);
      for (let x = Math.round(cx - shW / 2) - 1; x <= cx + shW / 2 + 1; x++) f.rect(x, shY - 1, 1, 2 + ((x * 5) % 3));
      sp.paint(f, shade(MATERIALS.bone, -0.15), { light: 'top' }); itemMasks.push(['body', f]);
    }
    if (v.sash || v.skirt >= 1) sp.paint(new Mask(W, H).rect(cx - waW / 2, hipY - 1, waW + 1, 2).rect(cx + 2, hipY, 2, 5), s.secondary, { flat: true });
    else sp.paint(new Mask(W, H).rect(cx - waW / 2, hipY - 1, waW + 1, 2), '#3a2a1e', { flat: true });
    if (!isMetal(v.mat) || v.plate === 'chest') sp.dot(cx, hipY - 1, MATERIALS.brass); // buckle
  }

  function drawEars(side) {
    if (R.ears === 'none') return;
    const ex = side < 0 ? cx - headW / 2 : cx + headW / 2 + 1, ey = headCY + 1;
    const m = new Mask(W, H);
    if (R.ears === 'long') m.poly([[ex, ey - 1], [ex + side * 5, ey - 4], [ex, ey + 2]]);
    else if (R.ears === 'short') m.poly([[ex, ey - 1], [ex + side * 3, ey - 2], [ex, ey + 2]]);
    else if (R.ears === 'ridge') m.poly([[ex, ey - 2], [ex + side * 3, ey - 3], [ex + side * 2, ey + 1], [ex, ey + 2]]);
    else m.rect(side < 0 ? ex - 1 : ex, ey, 2, 2 + (R.ears === 'small' ? 0 : 1));
    sp.paint(m, shade(skin, -0.04));
  }

  function drawFace() {
    const ey = Math.round(headCY), eo = R.snout ? 2 : 1;
    const eyeCol = s.eyes ?? (R.id === 'drow' ? '#e84a4a' : R.id === 'githyanki' ? '#2a2a18' : '#1e1814');
    sp.dot(cx - 2 + eo, ey, eyeCol); sp.dot(cx - 2 + eo, ey + 1, eyeCol);
    sp.dot(cx + 3 + eo, ey, eyeCol); sp.dot(cx + 3 + eo, ey + 1, eyeCol);
    sp.dot(cx - 2 + eo, ey - 2, shade(hair, -0.05)); sp.dot(cx + 3 + eo, ey - 2, shade(hair, -0.05)); // brows
    if (R.snout) { sp.dot(cx + headW / 2 + 3, headCY + 2, shade(skin, -0.35)); sp.paint(new Mask(W, H).rect(cx + 3, headCY + 5, 6, 1), shade(skin, -0.3), { flat: true }); }
    else sp.dot(cx + 1 + eo, ey + 4, shade(skin, -0.25)); // mouth
    if (R.nose) sp.paint(new Mask(W, H).rect(cx + 1 + eo, ey + 1, 2, 2), shade(skin, 0.05));
    if (R.tusks) { sp.dot(cx - 1 + eo, ey + 4, '#f0ead8'); sp.dot(cx + 3 + eo, ey + 4, '#f0ead8'); sp.dot(cx - 1 + eo, ey + 3, '#f0ead8'); sp.dot(cx + 3 + eo, ey + 3, '#f0ead8'); }
    if (R.beard) {
      const m = new Mask(W, H).poly([[cx - headW / 2 + 1, ey + 2], [cx + headW / 2, ey + 2], [cx + headW / 2 - 1, ey + 8], [cx + 1, shY + 6], [cx - headW / 2 + 2, ey + 8]]);
      m.subtract(new Mask(W, H).rect(cx + eo - 1, ey + 3, 4, 1));
      sp.paint(m, hair, { pattern: (x, y) => ((x + y) % 3 === 0 ? -1 : 0) });
    }
  }

  function drawHair() {
    if (R.bald) return;
    const top = headCY - headH / 2;
    const hideTop = items.head && items.head.vis.kind !== 'circlet';
    const m = new Mask(W, H);
    if (back) m.union(head.clone().subtract(new Mask(W, H).rect(0, headCY + headH / 2 - 2, W, 4)));
    else if (!hideTop) {
      m.ellipse(cx + 0.5, top + 2.5, headW / 2 + 0.6, 3.2).rect(cx - headW / 2, top + 2, 2, 5).rect(cx + headW / 2 - 1, top + 2, 1, 2);
      if (s.hairStyle === 3) { m.a.fill(0); m.rect(cx - 1, top - 1, 4, 4); }
    }
    if (R.curls && !hideTop) for (let i = -3; i <= 3; i += 2) m.ellipse(cx + i * 2, top + 1, 1.8, 1.8);
    if (s.hairStyle === 2 && !hideTop) m.ellipse(cx - 1, top - 1, 3, 2.5);
    if (R.topknot && !hideTop) m.rect(cx, top - 4, 2, 5).ellipse(cx + 1, top - 5, 2, 2);
    if (s.hairStyle === 1 && back) m.rect(cx - headW / 2, headCY, headW + 1, headH / 2 + 6);
    sp.paint(m, hair, { pattern: (x, y) => ((x * 3 + y) % 5 === 0 ? -1 : 0) });
  }

  function drawHorns() {
    const top = headCY - headH / 2;
    const col = R.id === 'dragonborn' ? shade(skin, 0.18) : '#2e2428';
    for (const side of [-1, 1]) {
      const bx = cx + side * (headW / 2 - 2);
      const m = new Mask(W, H);
      if (R.horns === 'curl') m.bar(bx, top + 2, bx + side * 2, top - 3, 2).bar(bx + side * 2, top - 3, bx + side * 4, top - 1, 1.5);
      else m.bar(bx - side * 1, top + 3, bx + side * 3, top - 3, 2).bar(bx + side * 3, top - 3, bx + side * 5, top - 5, 1);
      sp.paint(m, col);
    }
  }

  function drawHeadgear(v) {
    const top = headCY - headH / 2, col = matColor(v.mat, s);
    let m;
    if (v.kind === 'cap') m = new Mask(W, H).ellipse(cx + 0.5, top + 2.5, headW / 2 + 0.5, 3.5).rect(cx - headW / 2 - 1, top + 3, headW + 3, 2);
    else if (v.kind === 'circlet') {
      m = new Mask(W, H).rect(cx - headW / 2, top + 3, headW + 1, 1);
      sp.paint(m, col, { flat: true, edge: false }); itemMasks.push(['head', m]);
      if (!back) { sp.dot(cx + 1, top + 3, rar('head').trim ?? MATERIALS.gem); sp.dot(cx + 1, top + 2, shade(col, 0.15)); }
      return;
    } else {
      m = new Mask(W, H).ellipse(cx + 0.5, top + 4, headW / 2 + 1.5, 5.5).rect(cx - headW / 2 - 1, top + 4, headW + 3, headH - 3);
      if (!back) m.subtract(new Mask(W, H).rect(cx - headW / 2 + 2 + (R.snout ? 1 : 0), Math.round(headCY), headW - 3 + (R.snout ? 6 : 0), headH / 2 - 1));
      if (R.snout && !back) m.subtract(new Mask(W, H).rect(cx + headW / 2, headCY, 8, 7));
    }
    sp.paint(m, col, { light: v.kind === 'cap' ? 'top' : 'left', pattern: v.kind === 'helm' ? (x, y) => (y === Math.round(top + 5) ? 1 : 0) : null });
    if (v.nasal && !back) sp.paint(new Mask(W, H).rect(cx + 1 + (R.snout ? 1 : 0), Math.round(headCY) - 1, 1, 4), shade(col, -0.05), { flat: true, edge: false });
    itemMasks.push(['head', m]);
  }

  function drawWeapon(behind) {
    const w = items.mainHand; if (!w) return;
    const v = w.vis, scale = bodyH;
    const L = Math.max(5, Math.round(v.len * scale));
    const raise = pose.raise ?? 0;
    const two = v.twoHanded;
    const m = new Mask(W, H), acc = new Mask(W, H);
    const metal = matColor(v.mat, s), haftCol = matColor(v.haft ?? v.mat, s);
    let gx = handR.x, gy = handR.y;
    // grip direction: straight up-and-out, tilted by the attack pose
    let ang = -Math.PI / 2 - 0.45 - raise * 0.6;
    if (two && (v.kind === 'blade' || v.kind === 'axe' || v.kind === 'hammer')) { gx = cx - 3; gy = hipY; ang = -Math.PI / 2 - 0.6 - raise * 0.7; }
    if (v.kind === 'staff' || v.kind === 'polearm') { ang = -Math.PI / 2 - raise * 0.4; }
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
    const at = t => [gx + dx * t, gy + dy * t];

    if (v.kind === 'blade') {
      const bl = Math.round(v.width * scale) + 1, hilt = two ? 5 : 3;
      const [ax, ay] = at(-hilt + 1), [bx, by] = at(0), [ex, ey] = at(L);
      acc.bar(ax, ay, bx, by, 1.6); // grip
      const cw = v.guard === 'cross' ? Math.max(3, bl + 3) : v.guard === 'cup' ? 3 : bl + 1;
      const g = new Mask(W, H).bar(bx - px * cw / 2, by - py * cw / 2, bx + px * cw / 2, by + py * cw / 2, v.guard === 'cup' ? 2.4 : 1.6);
      if (v.curve) m.poly([[bx - px, by - py], [bx + px * (bl - 1), by + py * (bl - 1)], [ex + px * 2, ey + py * 2], [ex - px * 1.5, ey - py * 1.5]]);
      else m.bar(bx, by, ex, ey, Math.max(1.2, bl)).set(ex, ey);
      sp.paint(acc, '#4a3020', { flat: true });
      sp.paint(m, metal);
      // fuller: a bright line down the middle of broader blades
      if (bl >= 3) { const f = new Mask(W, H).line(...at(2), ...at(L - 2)); sp.paint(f, shade(metal, 0.2), { flat: true, edge: false }); }
      sp.paint(g, MATERIALS.brass, { flat: false });
      m.union(g);
    } else if (v.kind === 'axe' || v.kind === 'hammer' || v.kind === 'mace' || v.kind === 'polearm' || v.kind === 'staff' || v.kind === 'flail') {
      const low = v.kind === 'staff' || v.kind === 'polearm' ? Math.round(L * 0.35) : (two ? 5 : 2);
      const [ax, ay] = at(-low), [ex, ey] = at(L);
      acc.bar(ax, ay, ex, ey, v.kind === 'staff' ? 2 : 1.6);
      sp.paint(acc, haftCol);
      const hs = Math.round((v.head ?? 0.1) * scale);
      if (v.kind === 'axe' || (v.kind === 'polearm' && v.blade === 'axe')) {
        const [hx, hy] = at(L - 2);
        const blade = new Mask(W, H).poly([[hx + px * 1, hy + py * 1], [hx - px * hs + dx * (hs * 0.6), hy - py * hs + dy * (hs * 0.6)], [hx - px * hs - dx * (hs * 0.5), hy - py * hs - dy * (hs * 0.5)], [hx + px * 1 - dx * 2, hy + py * 1 - dy * 2]]);
        if (v.double) blade.poly([[hx - px, hy - py], [hx + px * hs + dx * (hs * 0.6), hy + py * hs + dy * (hs * 0.6)], [hx + px * hs - dx * (hs * 0.5), hy + py * hs - dy * (hs * 0.5)], [hx - px - dx * 2, hy - py - dy * 2]]);
        if (v.kind === 'polearm') blade.bar(...at(L), ...at(L + 5), 1.5);
        sp.paint(blade, metal); m.union(blade);
      } else if (v.kind === 'polearm') {
        const knife = new Mask(W, H).poly([[...at(L - 3)].map((c, i) => c + (i ? py : px) * 1.5), [...at(L + hs)], [...at(L - 3)].map((c, i) => c - (i ? py : px) * 1.2)]);
        sp.paint(knife, metal); m.union(knife);
      } else if (v.kind === 'hammer') {
        const [hx, hy] = at(L - 1);
        const head = new Mask(W, H).bar(hx - px * hs * 0.6, hy - py * hs * 0.6, hx + px * hs * 0.6, hy + py * hs * 0.6, Math.max(3, hs * 0.55));
        if (v.spike) head.bar(hx + px * hs * 0.5, hy + py * hs * 0.5, hx + px * (hs * 0.5 + 3), hy + py * (hs * 0.5 + 3), 1.2);
        sp.paint(head, metal); m.union(head);
      } else if (v.kind === 'mace') {
        const [hx, hy] = at(L - 1);
        const head = new Mask(W, H).ellipse(hx, hy, hs / 2 + 0.5, hs / 2 + 0.5);
        sp.paint(head, metal, { pattern: (x, y) => ((x + y) % 3 === 0 ? -1 : 0) }); m.union(head);
      } else if (v.kind === 'flail') {
        const [hx, hy] = at(L);
        const chain = new Mask(W, H); for (let i = 0; i < 4; i++) chain.set(hx - px * i * 1.2 + 1, hy + i);
        sp.paint(chain, MATERIALS.iron, { flat: true });
        const ball = new Mask(W, H).ellipse(hx - px * 5 + 1, hy + 6, hs / 2 + 0.5, hs / 2 + 0.5);
        sp.paint(ball, metal, { pattern: (x, y) => ((x + y) % 2 === 0 ? 1 : 0) }); m.union(ball);
      } else if (v.kind === 'staff') {
        if (v.orb) { const [hx, hy] = at(L + 2); const orb = new Mask(W, H).ellipse(hx, hy, 2.5, 2.5); sp.paint(orb, rar('mainHand').trim ?? '#7fc6dd'); m.union(orb);
          const cl = new Mask(W, H).bar(...at(L - 1), hx - px * 2.5, hy - 1, 1).bar(...at(L - 1), hx + px * 2.5, hy - 1, 1); sp.paint(cl, haftCol, { flat: true }); }
        else { const knot = new Mask(W, H).bar(...at(L - 3), ...at(L), 3); sp.paint(knot, shade(haftCol, -0.05)); }
      }
      m.union(acc);
    } else if (v.kind === 'bow') {
      const top = gy - L / 2, bot = gy + L / 2, bx = gx - 1;
      for (let y = Math.round(top); y <= bot; y++) { const t = (y - gy) / (L / 2); m.set(bx - Math.round((1 - t * t) * L * 0.22), y); m.set(bx - Math.round((1 - t * t) * L * 0.22) + (Math.abs(t) < 0.6 ? 1 : 0), y); }
      sp.paint(new Mask(W, H).line(bx, top, bx + (raise > 0.5 ? 3 : 0), gy).line(bx + (raise > 0.5 ? 3 : 0), gy, bx, bot), MATERIALS.string, { flat: true, edge: false });
      sp.paint(m, haftCol);
      if (raise > 0.5) sp.paint(new Mask(W, H).line(bx - 8, gy, bx + 3, gy), MATERIALS.bone, { flat: true });
    } else if (v.kind === 'crossbow') {
      const [ex, ey] = [gx + L * 0.7, gy + L * 0.25];
      acc.bar(gx - 2, gy - 1, ex, ey, 2.4);
      sp.paint(acc, haftCol);
      const prod = new Mask(W, H).bar(ex - 2 - L * 0.12, ey - 3 - L * 0.2, ex - 2 + L * 0.12, ey + L * 0.2 - 1, 1.6);
      sp.paint(prod, MATERIALS.iron); m.union(prod).union(acc);
    } else if (v.kind === 'sling') {
      const st = new Mask(W, H).line(gx, gy, gx - 2, gy + 5).line(gx - 2, gy + 5, gx + 1, gy + 7);
      sp.paint(st, MATERIALS.leather, { flat: true }); m.union(st);
      const stone = new Mask(W, H).ellipse(gx - 1, gy + 7, 1.5, 1.5); sp.paint(stone, '#8a8680');
    }
    itemMasks.push(['mainHand', m]);
    // two-handed weapons: the off hand closes on the grip
    if (two && !items.offHand && !behind) {
      const [hx, hy] = at(-1);
      sp.paint(new Mask(W, H).rect(Math.round(hx) - 1, Math.round(hy) - 1, 3, 3), items.hands?.vis.kind === 'gauntlets' ? MATERIALS.steel : items.hands ? MATERIALS.leather : skin);
    }
  }

  function drawShield(v) {
    if (v.kind !== 'shield') return;
    const size = Math.round(v.size * bodyH);
    const x = handL.x + 1, y = handL.y - 3 - (v.shape === 'tower' ? 2 : 0);
    const m = new Mask(W, H);
    if (v.shape === 'round') m.ellipse(x, y, size / 2, size / 2);
    else if (v.shape === 'heater') m.poly([[x - size / 2, y - size / 2], [x + size / 2, y - size / 2], [x + size / 2, y + size * 0.1], [x, y + size * 0.6], [x - size / 2, y + size * 0.1]]);
    else m.rect(Math.round(x - size * 0.32), Math.round(y - size / 2), Math.round(size * 0.64), size).ellipse(x, y - size / 2, size * 0.32, 2);
    const face = matColor(v.mat, s);
    sp.paint(m, face, { pattern: v.mat === 'wood' ? (xx) => (xx % 3 === 0 ? -1 : 0) : null });
    if (v.rim) {
      const rim = new Mask(W, H); for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (m.has(xx, yy) && (!m.has(xx + 1, yy) || !m.has(xx - 1, yy) || !m.has(xx, yy + 1) || !m.has(xx, yy - 1))) rim.set(xx, yy);
      sp.paint(rim, matColor(v.rim, s), { flat: true, edge: false });
    }
    if (v.emblem || v.shape === 'tower') {
      const e = new Mask(W, H).rect(Math.round(x) - 1, Math.round(y - size * 0.3), 2, Math.round(size * 0.6)).rect(Math.round(x - size * 0.22), Math.round(y - size * 0.1), Math.round(size * 0.44), 2);
      sp.paint(e, s.secondary, { flat: true, edge: false });
    }
    if (v.shape === 'round') sp.paint(new Mask(W, H).ellipse(x, y, 1.5, 1.5), shade(face, 0.2));
    itemMasks.push(['offHand', m]);
  }
}

/** Every frame of every animation, both facings, mirrored for the other two iso diagonals. */
export function sheetA(s) {
  const out = {};
  for (const facing of ['front', 'back']) for (const anim of Object.keys(POSES)) for (let f = 0; f < 4; f++) {
    const spr = renderA(s, { facing, anim, frame: f });
    out[`${facing}-${anim}-${f}`] = spr; out[`${facing}M-${anim}-${f}`] = spr.flipX();
  }
  return out;
}
