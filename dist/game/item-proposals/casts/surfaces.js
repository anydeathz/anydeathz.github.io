// surfaceAt(kind, x, y, t) → '#rrggbbaa' overlay. The persistent ground state a cast leaves behind.
// visual-language Q3: surfaces are LOW-SATURATION tints plus a DISTINCT TEXTURE, so they read as floor
// and never as a creature. Palettes are the game's (data/surfaces.ts via lib/palette.js); the textures
// are new. Static except fire/acid/steam, which shimmer slowly (motion Q2 allows state, not motion).
import { SURFACE } from '../lib/palette.js';
import { valueNoise, hashString } from '../../character-proposals/lib/rng.js';
import { mix, shade } from '../../character-proposals/lib/color.js';
import { withAlpha } from '../../character-proposals/lib/pixel.js';
const N = valueNoise('surf'), N2 = valueNoise('surf2');
const cellv = (x, y, c) => { const gx = Math.floor(x / c), gy = Math.floor(y / c); let d1 = 9, d2 = 9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const h = hashString(`${gx + i},${gy + j}`); const px = (gx + i + 0.2 + 0.6 * ((h & 255) / 255)) * c, py = (gy + j + 0.2 + 0.6 * ((h >> 8 & 255) / 255)) * c; const d = Math.hypot(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } return d2 - d1; };
export function surfaceAt(kind, x, y, t = 0, edge = 1) {
  const P = SURFACE[kind]?.palette; if (!P) return null;
  const [base, light, dark] = P, n = N.fbm(x * 1.3, y * 1.3, 3), soft = Math.min(1, edge);  // edge: 0 at the rim → 1 inside
  const A = a => withAlpha(a[0], a[1] * soft);
  switch (kind) {
    case 'fire': { const c = cellv(x, y, 0.5); if (c < 0.05) return A([mix(light, '#ffe0a0', 0.3 + 0.2 * Math.sin(t * 3 + x)), 0.85]); return n > 0.55 ? A([base, 0.45]) : A([mix(dark, '#1a0e0a', 0.5), 0.55]); }  // glowing cracks in scorched stone
    case 'water': { const r = Math.sin((x * 2.1 + y * 1.3) * 4 + n * 6); return r > 0.85 ? A([light, 0.55]) : A([base, 0.42]); }
    case 'ice': { const c = cellv(x * 1.4, y * 1.4, 0.6); return c < 0.03 ? A(['#ffffff', 0.6]) : A([n > 0.6 ? light : base, 0.5]); }
    case 'grease': { const sw = Math.sin(x * 5 + Math.sin(y * 4) * 1.5 + n * 3); return sw > 0.82 ? A([mix(light, '#c8c090', 0.4), 0.6]) : sw > 0.6 ? A([light, 0.45]) : A([dark, 0.55]); }        // dark with oily sheen bands — the first version vanished on dark floors
    case 'acid': { const b = N2(x * 4, y * 4 + t * 0.2); return b > 0.72 ? A([light, 0.75]) : b > 0.66 ? A([dark, 0.6]) : A([base, 0.36]); }  // bubbles
    case 'poisonCloud': { const d = ((Math.floor(x * 8) + Math.floor(y * 8)) & 1); return A([n > 0.5 ? light : base, d ? 0.42 : 0.26]); } // dithered haze
    case 'blood': { return n > 0.52 ? A([base, 0.7]) : n > 0.46 ? A([dark, 0.5]) : null; }
    case 'web': { const a = Math.atan2(y - Math.round(y), x - Math.round(x)), r = Math.hypot(x - Math.round(x), y - Math.round(y)); const spoke = Math.abs(Math.sin(a * 4)) < 0.12, ring = Math.abs(Math.sin(r * 16)) < 0.15; return spoke || ring ? A([light, 0.75]) : A([base, 0.12]); }
    case 'steam': { return A([light, 0.2 + 0.2 * n]); }
  }
  return null;
}
