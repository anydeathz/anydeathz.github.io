// The sets every object approach renders, so the five can be compared on identical inputs.
import { OBJECTS, CATALOGUE_SCROLLS, byKind } from './items.js';
import { SPELLS } from './spells.js';
import { RARITY_ORDER } from './palette.js';

const bySlot = () => { const g = {}; for (const o of byKind('item')) (g[o.slot] ??= []).push(o); return g; };
export const SETS = {
  items:    () => Object.entries(bySlot()).map(([slot, list]) => [`${slot} · ${list.length}`, list]),
  potions:  () => [[`potions · ${byKind('potion').length}`, byKind('potion')], [`throwables · ${byKind('throwable').length}`, byKind('throwable')]],
  elixirs:  () => [[`elixirs · ${byKind('elixir').length} (references/potions.md)`, byKind('elixir')], [`crafted potions · ${byKind('refPotion').length} (references/potions.md)`, byKind('refPotion')]],
  scrolls:  () => [[`scrolls in the game · ${byKind('scroll').length}`, byKind('scroll')], [`manuals — the martial half · ${byKind('manual').length}`, byKind('manual')]],
  catalogue:() => ['arcane', 'divine', 'primal', 'none'].map(l => { const list = CATALOGUE_SCROLLS.filter(s => (s.vis.list ?? 'none') === l); return [`${l} scrolls · ${list.length}`, list]; }),
  reagents: () => [[`reagents · ${byKind('reagent').length}`, byKind('reagent')], [`solvents · ${byKind('solvent').length}`, byKind('solvent')]],
  spells:   () => { const g = {}; for (const s of SPELLS) if (s.src !== 'item') (g[s.area.shape] ??= []).push({ kind: 'spell', id: s.id, name: s.name, look: s, rarity: 'common' }); return Object.entries(g).map(([k, v]) => [`${k} · ${v.length}`, v]); },
  rarity:   () => { const pick = ['longsword', 'potionSuperiorHealing', 'scroll.wizard.fireball', 'reagentUnicornHorn', 'helm', 'signet']; return pick.map(id => [OBJECTS.find(o => o.id === id).name, RARITY_ORDER.map(r => ({ ...OBJECTS.find(o => o.id === id), rarity: r, name: r }))]); },
  all:      () => [['everything', [...OBJECTS, ...CATALOGUE_SCROLLS, ...SPELLS.filter(s => s.src !== 'item').map(s => ({ kind: 'spell', id: s.id, name: s.name, look: s, rarity: 'common' }))]]],
  sample:   () => [['one of each kind', ['longsword', 'halberd', 'plate', 'towerShield', 'potionHealing', 'potionSupremeHealing', 'alchemistFire', 'poisonBomb', 'elixirOfFireResistance', 'scroll.wizard.fireball', 'manual.fighter.cleave', 'reagentBeholderIris', 'reagentEagleFeather', 'solventSalt'].map(id => OBJECTS.find(o => o.id === id))]],
};
export const ALL_OBJECTS = () => [...OBJECTS, ...CATALOGUE_SCROLLS];
