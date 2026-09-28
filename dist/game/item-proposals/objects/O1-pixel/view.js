// O1 in a page: the sprite at an integer scale, nearest neighbour.
import { renderO1 } from './icon.js';
export const DEFAULT_SCALE = 2;
export function view(o, { scale = 2, size = 32 } = {}) { return renderO1(o, { size }).toCanvas(scale); }
