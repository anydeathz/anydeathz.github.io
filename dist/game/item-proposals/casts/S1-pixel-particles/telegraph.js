// S1's own telegraph: the covered cells as a scatter of rising dust points — no ground paint at all,
// so S1 can be judged as a pure "air" approach.
import { key, toWorld } from '../common.js';
import { hashString } from '../../../character-proposals/lib/rng.js';
export function S2telegraphOnly(cast, t) {
  const tel = cast.emitters.find(e => e.type === 'telegraph');
  return { draw(api) { if (!tel || t > tel.t1 + 0.2) return; const f = t > tel.t1 ? 1 - (t - tel.t1) / 0.2 : 1;
    cast.cells.forEach((c, i) => { const [x, y] = toWorld(...c); for (let k = 0; k < 3; k++) { const h = hashString(`${i}:${k}`); const [X, Y] = api.px(x + ((h & 255) / 255 - 0.5) * 1.2, y + ((h >> 8 & 255) / 255 - 0.5) * 1.2, 0.05 + ((t * 2 + k * 0.3) % 1) * 0.3); api.add(X, Y, cast.cols[0], 0.7 * f, y); } }); } };
}
