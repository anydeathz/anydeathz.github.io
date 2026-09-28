import { svgO2 } from './icon.js';
export const DEFAULT_SCALE = 2;
export function view(o, { scale = 2 } = {}) { const t = document.createElement('template'); t.innerHTML = svgO2(o, { px: 32 * scale }); return t.content.firstChild; }
