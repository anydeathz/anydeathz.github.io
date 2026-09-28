// Colour ramps with hue-shifted shading — the single biggest difference between "pixel art" and
// "a darkened copy of the same colour". Shadows lean cool, highlights lean warm.
export function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function rgbToHex([r, g, b]) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h * 360, s, l];
}
export function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
/** Shift a colour: dl lightness, hue nudged toward blue when darkening, toward yellow when lightening. */
export function shade(hex, dl) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const toward = dl < 0 ? 235 : 50; // cool shadows, warm light
  let dh = ((toward - h + 540) % 360) - 180;
  const nh = h + dh * Math.min(0.08, Math.abs(dl) * 0.25);
  const ns = Math.max(0, Math.min(1, s + (dl < 0 ? 0.02 : -0.04)));
  return rgbToHex(hslToRgb([nh, ns, Math.max(0.02, Math.min(0.97, l + dl))]));
}
/** 4-step ramp: [outline-dark, shadow, base, highlight]. */
export function ramp(hex) { return [shade(hex, -0.30), shade(hex, -0.12), hex, shade(hex, 0.12)]; }
export function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); }
