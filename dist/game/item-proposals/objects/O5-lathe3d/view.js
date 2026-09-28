import { renderO5 } from './icon.js';
export const DEFAULT_SCALE = 2;
export function view(o, { scale = 2 } = {}) { return renderO5(o, { n: 32, k: scale }); }
