import { renderO3 } from './icon.js';
export const DEFAULT_SCALE = 2;
// rendered at 48 px and shown ×(scale·2/3) so every approach occupies the same 64 px as O1 at ×2
export function view(o, { scale = 2 } = {}) { const c = renderO3(o, { n: 32, k: scale }); return c; }
