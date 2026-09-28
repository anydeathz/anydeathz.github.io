// Every colour the proposals use for meaning. Damage hues, surface palettes and rarity come from the
// game snapshot (lib/game.js) — never retyped — so visual-language Q3 ("a fixed hue per damage type,
// used everywhere") holds by construction. The non-damage looks are new and are proposals.
import { GAME } from './game.js';
export { hexToRgb, rgbToHex, shade, mix, ramp } from '../../character-proposals/lib/color.js';

export const DAMAGE = Object.fromEntries(GAME.damageTypes.map(d => [d.id, { hue: d.hue, glyph: d.glyph, name: d.name, group: d.group }]));
export const SURFACE = Object.fromEntries(GAME.surfaces.map(s => [s.id, { palette: s.palette, name: s.name, damageType: s.damageType, difficult: s.difficultTerrain }]));
export const RARITY = Object.fromEntries(GAME.rarities.map(r => [r.id, r]));
// the rim/halo scheme from character-proposals: Common no trim, Very Rare + Legendary glow. Gold = Legendary only.
export const RARITY_LOOK = {
  common:    { rim: null,      glow: 0 },
  uncommon:  { rim: '#6faf63', glow: 0 },
  rare:      { rim: '#5c93dc', glow: 0 },
  veryRare:  { rim: '#a87fd6', glow: 0.35 },
  legendary: { rim: '#e0b255', glow: 0.7 },
};
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'veryRare', 'legendary'];

/**
 * The non-damage looks (heal, buff…). Each gets a hue AND a mark, like the damage types, because
 * visual-language Q3 says hue alone is never enough. None of them is gold.
 */
export const LOOK = {
  heal:    { hue: '#e36d6d', glyph: '✚', name: 'Healing' },
  buff:    { hue: '#efe6cf', glyph: '▲', name: 'Boon' },
  ward:    { hue: '#7fa6d9', glyph: '⬡', name: 'Ward' },
  debuff:  { hue: '#8c7d99', glyph: '▼', name: 'Bane' },
  control: { hue: '#c490d1', glyph: '∞', name: 'Control' },
  summon:  { hue: '#9bb5a0', glyph: '◎', name: 'Summoning' },
  light:   { hue: '#fff4c8', glyph: '✧', name: 'Light' },
  shadow:  { hue: '#5a5670', glyph: '●', name: 'Shadow' },
  move:    { hue: '#a9d7c9', glyph: '➚', name: 'Movement' },
  utility: { hue: '#b5a893', glyph: '·', name: 'Utility' },
};
export const elementOf = id => DAMAGE[id] ?? LOOK[id] ?? LOOK.utility;
export const hueOf = id => elementOf(id).hue;

/** scrolls.md Q1: a scroll belongs to a spell list. The list shows in the paper and the wax, not in gold. */
export const LISTS = {
  arcane: { paper: '#d9ccb0', wax: '#3d4f96', name: 'Arcane' },
  divine: { paper: '#e6dfcc', wax: '#9a2e3a', name: 'Divine' },
  primal: { paper: '#cfc3a0', wax: '#4f7a3a', name: 'Primal' },
  none:   { paper: '#cbbd9e', wax: '#6a5a4a', name: '—' },
};
