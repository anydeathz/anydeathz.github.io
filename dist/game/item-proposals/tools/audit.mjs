// Coverage: does every thing the game has, and every row in docs/references, have a look?
//   node docs/item-proposals/tools/audit.mjs            → prints the table, writes shots/audit.json
// Exits non-zero if anything is missing. "No assumptions" made concrete: a row with no recipe fails.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { GAME } from '../lib/game.js';
import { OBJECTS, CATALOGUE_SCROLLS } from '../lib/items.js';
import { SPELLS, actionLook, slug } from '../lib/spells.js';
import { DAMAGE, LOOK } from '../lib/palette.js';
const ref = async f => readFile(new URL(`../../references/${f}`, import.meta.url), 'utf8');
const rows = md => md.split('\n').filter(l => /^\| /.test(l) && !/^\|\s*(Level|Category|Name)\s*\|/.test(l) && !/^\|\s*-/.test(l)).map(l => l.split('|').map(s => s.trim()).slice(1, -1));
const miss = [], report = {};
const check = (label, ids, has) => { const m = ids.filter(id => !has(id)); report[label] = { total: ids.length, covered: ids.length - m.length }; m.forEach(id => miss.push(`${label}: ${id}`)); };

const obj = new Set(OBJECTS.filter(o => o.vis).map(o => o.id));
check('item bases (game)', GAME.bases.map(b => b.id), id => obj.has(id));
for (const k of ['potion', 'throwable', 'scroll', 'reagent', 'solvent']) check(`${k}s (game)`, GAME.stacks.filter(s => s.kind === k).map(s => s.id), id => obj.has(id));
check('actions (game)', GAME.actions.map(a => a.id), id => { const L = actionLook(GAME.actions.find(a => a.id === id)); return L && (DAMAGE[L.element] || LOOK[L.element]); });
check('martial actions → manuals', GAME.actions.filter(a => actionLook(a).martial).map(a => `manual.${a.id}`), id => obj.has(id));

const spells = await ref('spells.md');
const spellNames = [...new Set(rows(spells).map(r => r[1].replace(/^Scroll of /, '')))];
check('spells.md rows (unique spells)', spellNames, n => SPELLS.some(s => s.name === n));
check('spells.md → a scroll look', spellNames, n => CATALOGUE_SCROLLS.some(s => s.look.name === n));
const potions = await ref('potions.md');
const pr = rows(potions);
check('potions.md rows', pr.map(r => r[0]), n => obj.has(slug(n)));
check('damage types have hue + glyph', Object.keys(DAMAGE), id => DAMAGE[id].hue && DAMAGE[id].glyph);

const bySrc = {}; for (const s of SPELLS) bySrc[s.src] = (bySrc[s.src] ?? 0) + 1;
const byShape = {}; for (const s of SPELLS) byShape[s.area.shape] = (byShape[s.area.shape] ?? 0) + 1;
const byKind = {}; for (const o of OBJECTS) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
const out = { at: new Date().toISOString(), snapshotAt: GAME.takenAt, report, spellsBySrc: bySrc, spellsByShape: byShape, objectsByKind: byKind, catalogueScrolls: CATALOGUE_SCROLLS.length, spellRows: rows(spells).length, missing: miss };
console.table(report); console.log('spells by source', bySrc); console.log('spells by shape', byShape); console.log('objects', byKind, '+', CATALOGUE_SCROLLS.length, 'catalogue scrolls');
await writeFile(fileURLToPath(new URL('../shots/audit.json', import.meta.url)), JSON.stringify(out, null, 2));
if (miss.length) { console.error('MISSING\n' + miss.join('\n')); process.exit(1); }
console.log('coverage 100%');
