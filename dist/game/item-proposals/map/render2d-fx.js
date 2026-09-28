// M3 with effect hooks — a COPY of character-proposals/map/render2d.js (which is left untouched), with
// three additions so casts, surfaces and loot can live in the map:
//   fx.ground(x, y, key, t) → '#rrggbbaa' an overlay on floor pixels inside fx.cells (S2 decals, S3 field, surfaces)
//   fx.draw(api, t)                      draws after lighting, depth-tested against walls (S1 particles, loot glints)
//   fx.lights → [{ x, y, z, col, r, k }] adds light to the lighting pass (a fireball lights the room)
// Loot is passed as ordinary sprites (it sorts by depth like a character). Everything else is verbatim.
//
// M3 — the map as 2D pixel art on a canvas, 3/4 top-down (Stardew/Zelda camera), hex grid.
//
// Everything is sampled per pixel from map/surfaces.js, so nothing is a pre-made tile. Walls are thin
// runs on hex edges (lib/hex.js wallEdges): a back wall shows its full masonry face, a wall between
// the room and the camera is cut down to a stub so it never hides the party — the classic cutaway.
import { toWorld, fromWorld, isFloor, wallEdges, wallPosts, DIRS, SQRT3, key } from '../../character-proposals/lib/hex.js';
import { floorAt, wallAt } from '../../character-proposals/map/surfaces.js';
import { hexToRgb, shade, mix, rgbToHex } from '../../character-proposals/lib/color.js';
import { rgba } from '../../character-proposals/lib/pixel.js';
import { valueNoise } from '../../character-proposals/lib/rng.js';

export const S = 24, SQ = 0.62, VZ = 1.0; // px per world unit · ground squash · px per unit of height
export const WALL_H = 1.0, WALL_T = 0.24, STUB_H = 0.3;

/** One-shot convenience: bake the static layer and draw one frame. */
export function renderMap2D(opts) { return makeMap2D(opts).frame(opts.sprites ?? [], opts.time ?? 0); }

/**
 * Bake floors, walls and the torch light map once; `frame(sprites, t)` then composites sprites against
 * a depth buffer (so a back wall's face never covers someone standing in front of it) and applies the
 * dynamic party light. This is the split a shipping 2D renderer needs; the numbers on the page
 * measure `frame` alone.
 */
export function makeMap2D({ map, biome, sprites: bakeSprites = [], cam, w = 320, h = 240, time = 0, grid = true, torchEvery = 5, withPosts = false }) {
  const tBake = performance.now();
  const buf = new Uint8ClampedArray(w * h * 4);
  const depth = new Float32Array(w * h).fill(-1e9); // world-y of what is drawn, for sprite/wall sorting
  const [camX, camY] = [cam[0] * S - w / 2, cam[1] * S * SQ - h / 2];
  const px = (x, y, z = 0) => [x * S - camX, y * S * SQ - z * S * VZ - camY];
  const put = (X, Y, hex, d = null, a = 1) => {
    if (X < 0 || Y < 0 || X >= w || Y >= h) return; const i = (Y * w + X) * 4;
    const [r, g, b] = hexToRgb(hex);
    if (a >= 1) { buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255; }
    else { buf[i] += (r - buf[i]) * a; buf[i + 1] += (g - buf[i + 1]) * a; buf[i + 2] += (b - buf[i + 2]) * a; buf[i + 3] = 255; }
    if (d !== null) depth[Y * w + X] = d;
  };
  const fog = biome.fog;
  const rockN = valueNoise(`rock:${biome.id}`);
  const rockAt = (x, y) => { const n = rockN.fbm(x * 1.6, y * 1.6, 3); return mix(shade(biome.wall[2], -0.22 + (n - 0.5) * 0.1), fog, 0.62); };

  // ── 1 · floor, per pixel ─────────────────────────────────────────────────────────────────
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
    const x = (X + camX) / S, y = (Y + camY) / (S * SQ);
    const [q, r] = fromWorld(x, y);
    if (!isFloor(map, q, r)) {
      // solid rock: a dark mass whose top sits at wall height, so thin walls read as its cut face
      const yt = (Y + camY + WALL_H * S * VZ) / (S * SQ), [tq, tr] = fromWorld(x, yt);
      put(X, Y, isFloor(map, tq, tr) ? fog : rockAt(x, yt)); continue;
    }
    let col = floorAt(biome, x, y);
    const [cx, cy] = toWorld(q, r), dx = x - cx, dy = y - cy;
    // hex metric: how far toward an edge, and which edge
    let best = -1, bi = 0;
    DIRS.forEach(([dq, dr], i) => { const [nx, ny] = toWorld(q + dq, r + dr); const ux = (nx - cx) / SQRT3, uy = (ny - cy) / SQRT3; const d = dx * ux + dy * uy; if (d > best) { best = d; bi = i; } });
    const [dq, dr] = DIRS[bi];
    if (!isFloor(map, q + dq, r + dr) && best > 0.55) col = shade(col, -0.2 * (best - 0.55) / 0.32); // contact shadow along walls
    if (grid && best > 0.845) col = shade(col, -0.05);
    put(X, Y, col);
  }

  // ── 2 · drawables: wall runs, posts, torches, sprites — painter-sorted by world y ────────
  const edges = wallEdges(map), posts = wallPosts(edges);
  const items = [];
  edges.forEach((e, i) => items.push({ y: Math.max(e.a[1], e.b[1]) - (e.front ? -0.2 : 0.35), draw: () => drawRun(e, i) }));
  if (withPosts) posts.forEach(p => items.push({ y: p.p[1] + 0.01, draw: () => drawPost(p) }));
  const torches = edges.filter((e, i) => !e.front && e.n[1] > 0.4 && i % torchEvery === 0);
  torches.forEach(e => items.push({ y: Math.max(e.a[1], e.b[1]) - 0.3, draw: () => drawTorch(e) }));
  items.sort((a, b) => a.y - b.y).forEach(it => it.draw());

  // ── 3 · light: torches are static, so their warmth is baked once ──────────────────────
  const lights = torches.map(e => { const m = [(e.a[0] + e.b[0]) / 2 + e.n[0] * 0.15, (e.a[1] + e.b[1]) / 2 + e.n[1] * 0.15]; return px(m[0], m[1], 0.75); });
  const warmMap = new Float32Array(w * h);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) { let warm = 0; for (const [lx, ly] of lights) { const d = Math.hypot(X - lx, (Y - ly) * 1.4) / (S * 2.6); if (d < 1) warm += (1 - d) * (1 - d); } warmMap[Y * w + X] = warm; }
  const staticBuf = buf.slice(), staticDepth = depth.slice();
  const fr = hexToRgb(fog);
  const bakeMs = performance.now() - tBake;

  function frame(sprites, t = 0, fxList = []) {
    buf.set(staticBuf); depth.set(staticDepth);
    // ── fx ground pass: only the pixels over the cells an effect covers ──
    for (const fx of fxList) if (fx.ground && fx.cells?.length) {
      const set = new Set(fx.cells.map(c => key(...c)));
      const xs = fx.cells.map(c => toWorld(...c)), bx0 = Math.min(...xs.map(p => p[0])) - 1, bx1 = Math.max(...xs.map(p => p[0])) + 1, by0 = Math.min(...xs.map(p => p[1])) - 1, by1 = Math.max(...xs.map(p => p[1])) + 1;
      const [X0, Y0] = px(bx0, by0), [X1, Y1] = px(bx1, by1);
      for (let Y = Math.max(0, Math.floor(Y0)); Y <= Math.min(h - 1, Math.ceil(Y1)); Y++) for (let X = Math.max(0, Math.floor(X0)); X <= Math.min(w - 1, Math.ceil(X1)); X++) {
        const x = (X + camX) / S, y = (Y + camY) / (S * SQ), [q, r] = fromWorld(x, y), k = key(q, r);
        if (!set.has(k) || !isFloor(map, q, r)) continue;
        const i = (Y * w + X) * 4; if (depth[Y * w + X] > y + 0.05) continue;       // a wall face is in front of this floor pixel
        const c = fx.ground(x, y, k, t); if (!c) continue;
        const [rr, gg, bb] = hexToRgb(c.slice(0, 7)), a = c.length > 7 ? parseInt(c.slice(7, 9), 16) / 255 : 1;
        buf[i] += (rr - buf[i]) * a; buf[i + 1] += (gg - buf[i + 1]) * a; buf[i + 2] += (bb - buf[i + 2]) * a;
      }
    }
    const wpos = s => s.world ?? toWorld(s.q, s.r);
    [...sprites].sort((a, b) => wpos(a)[1] - wpos(b)[1]).forEach(drawSprite);
    const party = sprites.filter(s => s.party).map(s => px(...(s.world ?? toWorld(s.q, s.r))));
    const flick = 1 + Math.sin(t * 9) * 0.04, R2 = (S * 6.5) ** 2;
    const fxl = fxList.flatMap(f => f.lights ?? []).map(l => ({ ...l, p: px(l.x, l.y, l.z ?? 0.5), rgb: hexToRgb(l.col) }));
    for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) {
      const i = (Y * w + X) * 4, warm = warmMap[Y * w + X] * flick;
      let seen = party.length ? 0 : 1; for (const [lx, ly] of party) { const dx = X - lx, dy = (Y - ly) * 1.3; seen = Math.max(seen, 1 - (dx * dx + dy * dy) / R2); }
      const k = Math.max(0.28, Math.min(1, seen)) + warm * 0.35;
      buf[i] = Math.min(255, buf[i] * k + warm * 60); buf[i + 1] = Math.min(255, buf[i + 1] * k + warm * 26); buf[i + 2] = buf[i + 2] * k;
      for (const L of fxl) { const d = Math.hypot(X - L.p[0], (Y - L.p[1]) * 1.4) / (S * L.r); if (d < 1) { const f2 = (1 - d) * (1 - d) * L.k; buf[i] = Math.min(255, buf[i] + L.rgb[0] * f2 * 0.5); buf[i + 1] = Math.min(255, buf[i + 1] + L.rgb[1] * f2 * 0.5); buf[i + 2] = Math.min(255, buf[i + 2] + L.rgb[2] * f2 * 0.5); } }
      const f = Math.max(0, 0.72 - seen) * 0.6; buf[i] += (fr[0] - buf[i]) * f; buf[i + 1] += (fr[1] - buf[i + 1]) * f; buf[i + 2] += (fr[2] - buf[i + 2]) * f;
    }
    // ── fx draw pass: after lighting (effects are their own light), depth-tested against walls ──
    const api = { w, h, px, S, SQ, VZ, put: (X, Y, hex, a = 1, wy = null) => { X = Math.round(X); Y = Math.round(Y); if (X < 0 || Y < 0 || X >= w || Y >= h) return; if (wy !== null && depth[Y * w + X] > wy + 0.4) return; const i = (Y * w + X) * 4, [rr, gg, bb] = hexToRgb(hex); buf[i] += (rr - buf[i]) * a; buf[i + 1] += (gg - buf[i + 1]) * a; buf[i + 2] += (bb - buf[i + 2]) * a; }, add: (X, Y, hex, a = 1, wy = null) => { X = Math.round(X); Y = Math.round(Y); if (X < 0 || Y < 0 || X >= w || Y >= h) return; if (wy !== null && depth[Y * w + X] > wy + 0.4) return; const i = (Y * w + X) * 4, [rr, gg, bb] = hexToRgb(hex); buf[i] = Math.min(255, buf[i] + rr * a); buf[i + 1] = Math.min(255, buf[i + 1] + gg * a); buf[i + 2] = Math.min(255, buf[i + 2] + bb * a); } };
    for (const fx of fxList) fx.draw?.(api, t);
    return new ImageData(buf.slice(), w, h);
  }
  return { frame, bakeMs, w, h, px };

  // ═══════════════════════════════════════════════════════════════════════════════════════
  function drawRun(e, i) {
    const H = e.front ? STUB_H : WALL_H;
    const o = [-e.n[0] * WALL_T, -e.n[1] * WALL_T];               // thickness goes into the wall cell
    // runs are lengthened a little at both ends so neighbouring runs overlap and the joint closes
    const ex = (e.b[0] - e.a[0]) * 0.08, ey = (e.b[1] - e.a[1]) * 0.08;
    const A = [e.a[0] - ex, e.a[1] - ey], B = [e.b[0] + ex, e.b[1] + ey], A2 = [A[0] + o[0], A[1] + o[1]], B2 = [B[0] + o[0], B[1] + o[1]];
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]), seed = i * 0.37;
    // the face we can see: the inner face of a back wall, the outer face of a front stub
    const faceA = e.front ? A2 : A, faceB = e.front ? B2 : B;
    const nx = e.front ? -e.n[0] : e.n[0], ny = e.front ? -e.n[1] : e.n[1];
    if (ny > 0.05) {
      const light = 0.06 * nx - 0.02; // faces turned toward the upper-left light are a touch brighter
      face(faceA, faceB, H, (u, v) => { let c = wallAt(biome, u, v, H, seed); if (e.front) c = shade(c, -0.1); return shade(c, light); }, len);
    }
    // the cap
    capPoly([A, B, B2, A2], H, (x, y) => wallAt(biome, (x + y) * 0.9, H - 0.02, H, seed));
  }
  function face(A, B, H, shader, len) {
    const [ax, ay] = px(A[0], A[1]), [bx, by] = px(B[0], B[1]);
    const x0 = Math.round(Math.min(ax, bx)), x1 = Math.round(Math.max(ax, bx));
    for (let X = x0; X <= x1; X++) {
      const t = bx === ax ? 0 : (X - ax) / (bx - ax); if (t < -0.01 || t > 1.01) continue;
      const base = ay + (by - ay) * t, top = base - H * S * VZ;
      for (let Y = Math.round(top); Y <= Math.round(base); Y++) {
        const v = (base - Y) / (S * VZ);
        put(X, Y, shader(t * len, Math.max(0, Math.min(H, v))), Math.max(A[1], B[1]));
      }
    }
  }
  function capPoly(pts, H, shader) {
    const capDepth = Math.max(...pts.map(p => p[1]));
    const sp = pts.map(p => px(p[0], p[1], H));
    const ys = sp.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let Y = y0; Y <= y1; Y++) {
      const xs = [];
      for (let k = 0; k < sp.length; k++) { const [ax, ay] = sp[k], [bx, by] = sp[(k + 1) % sp.length]; if ((ay <= Y + 0.5 && by > Y + 0.5) || (by <= Y + 0.5 && ay > Y + 0.5)) xs.push(ax + (Y + 0.5 - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let X = Math.round(xs[k]); X <= Math.round(xs[k + 1]); X++) {
        const x = (X + camX) / S, y = (Y + camY + H * S * VZ) / (S * SQ);
        put(X, Y, shade(shader(x, y), -0.02), capDepth);
      }
    }
  }
  function drawPost(p) {
    const H = (p.front ? STUB_H : WALL_H) + 0.03, r = WALL_T * 0.62;
    const [cx, cy] = px(p.p[0], p.p[1]);
    const rw = r * S, rh = r * S * SQ, top = H * S * VZ;
    for (let X = Math.floor(cx - rw); X <= Math.ceil(cx + rw); X++) {
      const t = (X - cx) / rw; if (Math.abs(t) > 1) continue;
      const yb = cy + Math.sqrt(1 - t * t) * rh;
      for (let Y = Math.round(cy - top - Math.sqrt(1 - t * t) * rh); Y <= Math.round(yb); Y++) {
        const onTop = Y < cy - top + Math.sqrt(1 - t * t) * rh;
        const base = biome.wall[0];
        put(X, Y, onTop ? shade(biome.wall[1], 0.03) : shade(base, -0.1 * t - 0.04 - (Y > yb - 2 ? 0.08 : 0)), p.p[1]);
      }
    }
  }
  function drawTorch(e) {
    const m = [(e.a[0] + e.b[0]) / 2 + e.n[0] * 0.02, (e.a[1] + e.b[1]) / 2 + e.n[1] * 0.02];
    const [X, Y] = px(m[0], m[1], 0.62).map(Math.round);
    for (let k = 0; k < 4; k++) put(X, Y + k, '#3a2a1e');
    put(X - 1, Y, '#5a4030'); put(X + 1, Y, '#5a4030');
    const f = Math.floor(time * 8) % 3;
    const flame = [[0, -1, '#ffd26a'], [0, -2, '#ffb347'], [-1, -2, '#e0622a'], [1, -2 - (f === 1), '#e0622a'], [0, -3 - (f === 2), '#e0622a'], [0, -4, f ? '#a8452f' : '#e0622a']];
    for (const [dx, dy, c] of flame) put(X + dx, Y + dy, c);
  }
  function drawSprite(s) {
    const W0 = s.world ?? toWorld(s.q, s.r), [fx, fy] = px(...W0), footY = W0[1];
    const X0 = Math.round(fx - (s.ax ?? 28)), Y0 = Math.round(fy - (s.ay ?? 68));
    // contact shadow
    const sw = s.shadow ?? 8; for (let dy = -2; dy <= 2; dy++) for (let dx = -sw; dx <= sw; dx++) if ((dx / sw) ** 2 + (dy / 2.4) ** 2 <= 1) put(Math.round(fx) + dx, Math.round(fy) + dy, '#000000', null, 0.35);
    const spr = s.sprite;
    for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) {
      const c = spr.px[y * spr.w + x]; if (!c) continue;
      const X = X0 + x, Y = Y0 + y; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      if (depth[Y * w + X] > footY + 0.3) continue; // a wall in front of this character
      put(X, Y, c.slice(0, 7), null, rgba(c)[3] / 255);
    }
  }
}

/** Paint an ImageData to a visible canvas at an integer scale, nearest neighbour. */
export function present(img, canvas, scale = 3) {
  const t = document.createElement('canvas'); t.width = img.width; t.height = img.height; t.getContext('2d').putImageData(img, 0, 0);
  canvas.width = img.width * scale; canvas.height = img.height * scale;
  const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(t, 0, 0, canvas.width, canvas.height);
  return canvas;
}
