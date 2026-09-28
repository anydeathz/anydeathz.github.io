// A tiny pixel-art engine: masks, auto-shaded fills, selective outlines. Every 2D generator
// (paper-doll, sprite-stack slices, 2D hex tiles) draws through this, so "what makes it look like
// pixel art" lives in one place:
//   1. hue-shifted 4-step ramps (lib/color.js)
//   2. shading computed from each part's own silhouette — light from the upper left
//   3. a dark outline that takes its colour from the pixel it outlines ("sel-out")
//   4. inner edges where one part overlaps another, so layers read as separate things
import { ramp, shade, hexToRgb } from './color.js';

export class Mask {
  constructor(w, h) { this.w = w; this.h = h; this.a = new Uint8Array(w * h); }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.a[y * this.w + x] === 1; }
  set(x, y) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = 1; return this; }
  clear(x, y) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = 0; return this; }
  rect(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j); return this; }
  ellipse(cx, cy, rx, ry) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y);
      }
    return this;
  }
  /** Scanline polygon fill; points are [x, y] pairs in pixel space. */
  poly(pts) {
    const ys = pts.map(p => p[1]); const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y);
    }
    return this;
  }
  /** A thick segment — the workhorse for limbs and weapons. */
  bar(x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2;
    if (w <= 1.01) return this.line(x0, y0, x1, y1);
    return this.poly([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]);
  }
  line(x0, y0, x1, y1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { this.set(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return this;
  }
  union(m) { for (let i = 0; i < this.a.length; i++) this.a[i] |= m.a[i]; return this; }
  subtract(m) { for (let i = 0; i < this.a.length; i++) if (m.a[i]) this.a[i] = 0; return this; }
  intersect(m) { for (let i = 0; i < this.a.length; i++) this.a[i] &= m.a[i]; return this; }
  clone() { const m = new Mask(this.w, this.h); m.a.set(this.a); return m; }
  mirror(cx) { const m = new Mask(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.a[y * this.w + x]) m.set(2 * cx - x - 1, y); return m; }
  bbox() { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.a[y * this.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, x1, y1 }; }
  count() { let n = 0; for (const v of this.a) n += v; return n; }
}

export class Sprite {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); this.id = new Int16Array(w * h).fill(-1); this._ids = 0; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null; }
  put(x, y, c, id = -1) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) { this.px[y * this.w + x] = c; this.id[y * this.w + x] = id; } }
  mask() { return new Mask(this.w, this.h); }
  /**
   * Paint a part. `color` is a base hex (a ramp is derived) or an explicit 4-ramp.
   * opts.pattern(x, y, t, v) → ramp-index delta (materials: chain, scales, quilting…)
   * opts.flat → no volume shading · opts.edge=false → no inner edge where it overlaps
   * opts.light: 'left' (default) or 'top' (for horizontal things like a hat brim)
   */
  paint(mask, color, opts = {}) {
    const r = Array.isArray(color) ? color : ramp(color);
    const id = this._ids++;
    const { x0, y0, x1, y1 } = mask.bbox(); if (x1 < 0) return id;
    // row spans + column spans → normalised position inside the silhouette
    for (let y = y0; y <= y1; y++) {
      let rl = -1, rr = -1; for (let x = x0; x <= x1; x++) if (mask.has(x, y)) { if (rl < 0) rl = x; rr = x; }
      if (rl < 0) continue;
      for (let x = rl; x <= rr; x++) {
        if (!mask.has(x, y)) continue;
        let cu = y, cd = y; while (mask.has(x, cu - 1)) cu--; while (mask.has(x, cd + 1)) cd++;
        const t = rr === rl ? 0.5 : (x - rl) / (rr - rl), v = cd === cu ? 0.5 : (y - cu) / (cd - cu);
        let k;
        if (opts.flat) k = 2;
        else {
          const lit = opts.light === 'top' ? 1 - v * 1.4 : 1 - t * 1.25 - v * 0.35 + 0.25;
          k = lit > 0.78 ? 3 : lit > 0.22 ? 2 : 1;
        }
        if (opts.pattern) k += opts.pattern(x, y, t, v) | 0;
        // inner edge: my boundary pixel sits on an already painted pixel below/right of me
        if (opts.edge !== false) {
          const under = (dx, dy) => !mask.has(x + dx, y + dy) && this.get(x + dx, y + dy);
          if (under(0, 1) || under(1, 0)) k = Math.min(k, 0);
        }
        k = Math.max(0, Math.min(3, k));
        this.put(x, y, r[k], id);
      }
    }
    return id;
  }
  /** One pixel of an explicit colour — eyes, gems, glints. */
  dot(x, y, c) { this.put(Math.round(x), Math.round(y), c, this._ids++); }
  /** Selective outline: each empty pixel beside the sprite takes the darkened colour of its neighbour. */
  outline(dark = 0.42, glow = null) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const n = this.get(x, y + 1) ?? this.get(x, y - 1) ?? this.get(x + 1, y) ?? this.get(x - 1, y);
      if (n) add.push([x, y, darken(n, dark)]);
    }
    for (const [x, y, c] of add) this.put(x, y, c);
    return this;
  }
  /** A soft aura around the outline — Very Rare and Legendary items only. */
  halo(maskOf, color, alpha = 0.5) {
    const out = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      let near = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (maskOf.has(x + i, y + j)) near = Math.max(near, 3 - Math.max(Math.abs(i), Math.abs(j)));
      if (near) out.push([x, y, near]);
    }
    for (const [x, y, n] of out) this.put(x, y, withAlpha(color, alpha * n / 3));
  }
  flipX() { const s = new Sprite(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) s.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x]; return s; }
  /** To a canvas at integer scale (nearest neighbour — the whole point). */
  toCanvas(scale = 1, canvas = null) {
    const c = canvas ?? document.createElement('canvas'); c.width = this.w * scale; c.height = this.h * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const img = g.createImageData(this.w, this.h);
    for (let i = 0; i < this.px.length; i++) { const p = this.px[i]; if (!p) continue; const [r, gg, b, a] = rgba(p); img.data.set([r, gg, b, a], i * 4); }
    if (scale === 1) { g.putImageData(img, 0, 0); return c; }
    const tmp = document.createElement('canvas'); tmp.width = this.w; tmp.height = this.h; tmp.getContext('2d').putImageData(img, 0, 0);
    g.drawImage(tmp, 0, 0, c.width, c.height); return c;
  }
}

export function darken(c, amt) { return c.length > 7 ? c : shade(c, -amt); }
export function withAlpha(hex, a) { return hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0'); }
export function rgba(c) { const [r, g, b] = hexToRgb(c.slice(0, 7)); return [r, g, b, c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255]; }
