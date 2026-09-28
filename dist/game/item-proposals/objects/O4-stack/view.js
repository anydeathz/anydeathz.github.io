import { stackOf, renderO4 } from './icon.js';
export const DEFAULT_SCALE = 2;
export function view(o, { scale = 2 } = {}) { return renderO4(stackOf(o), 0.6).toCanvas(scale); }
