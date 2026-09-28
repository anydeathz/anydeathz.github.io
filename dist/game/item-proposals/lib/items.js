// Every OBJECT the proposals draw, each with a `vis` recipe. Items come from character-proposals'
// table (54 bases, recipes already drafted there); stacks come from the game snapshot (lib/game.js);
// elixirs and the reference potions come from docs/references/potions.md (not in code yet).
//
// A recipe says what a thing is made of and how it is shaped — never which picture to use. lib/parts.js
// compiles a recipe into geometry once, and all five approaches draw that geometry.
import { GAME } from './game.js';
import { BASES } from '../../character-proposals/lib/data.js';
import { SPELLS, actionLook, slug } from './spells.js';
import { DAMAGE, LOOK } from './palette.js';
export { BASES };

const dmg = id => DAMAGE[id].hue;
const S = id => GAME.stacks.find(s => s.id === id);

// ── potions (data/consumables/potions.ts): family → vessel, effect → liquid ────────────────────
// healing is red and climbs in vessel with the tier; the other families each own a vessel shape, so
// a potion is legible by silhouette before colour (visual-language Q3: never colour alone).
const POTION_VIS = {
  potionHealing:         { flask: 'round',    liquid: '#c8323c', fill: 0.7,  cork: 'cork',    tier: 1 },
  potionGreaterHealing:  { flask: 'round',    liquid: '#c8323c', fill: 0.85, cork: 'wax',     tier: 2 },
  potionSuperiorHealing: { flask: 'flask',    liquid: '#d23a46', fill: 0.85, cork: 'wax',     tier: 3 },
  potionSupremeHealing:  { flask: 'decanter', liquid: '#e04a55', fill: 0.9,  cork: 'stopper', tier: 4, glow: 0.4 },
  antitoxin:             { flask: 'vial',     liquid: '#cfe3b0', fill: 0.8,  cork: 'cork',    label: 'cure', milky: true },
  potionClarity:         { flask: 'vial',     liquid: '#b9a6e0', fill: 0.8,  cork: 'cork',    label: 'cure' },
  potionThaw:            { flask: 'vial',     liquid: '#e89a4a', fill: 0.8,  cork: 'cork',    label: 'cure', bubbles: true },
  potionMana:            { flask: 'tall',     liquid: '#4a78d0', fill: 0.75, cork: 'cork',    tier: 1 },
  potionGreaterMana:     { flask: 'tall',     liquid: '#5a86e0', fill: 0.9,  cork: 'stopper', tier: 3, glow: 0.3 },
  potionShield:          { flask: 'squat',    liquid: '#bfc8d4', fill: 0.8,  cork: 'cap',     metal: true },
  potionWard:            { flask: 'squat',    liquid: '#e8eef5', fill: 0.85, cork: 'cap',     metal: true, glow: 0.3 },
  potionSpeed:           { flask: 'gourd',    liquid: '#a9d7c9', fill: 0.8,  cork: 'wax',     bubbles: true },
  potionValour:          { flask: 'gourd',    liquid: '#efe6cf', fill: 0.8,  cork: 'wax' },
  potionFury:            { flask: 'gourd',    liquid: '#9a2a24', fill: 0.85, cork: 'wax',     bubbles: true },
};
// ── throwables (throwables.ts): the vessel says "throw me"; the liquid is the damage hue ─────────
const THROW_VIS = {
  alchemistFire: { flask: 'grenade', liquid: dmg('fire'),   fill: 0.8, cork: 'rag' },
  flaskOil:      { flask: 'flask',   liquid: '#4d4a30',     fill: 0.9, cork: 'rag' },
  waterFlask:    { flask: 'flask',   liquid: '#4d9bb8',     fill: 0.9, cork: 'cork' },
  acidVial:      { flask: 'vial',    liquid: dmg('acid'),   fill: 0.8, cork: 'wax', bubbles: true },
  poisonBomb:    { flask: 'bomb',    shell: '#5a5040',      liquid: dmg('poison'), smoke: true },
  frostGrenade:  { flask: 'grenade', liquid: dmg('cold'),   fill: 0.8, cork: 'cap', metal: true },
  thunderstone:  { flask: 'stone',   shell: '#6a6e78',      liquid: dmg('thunder'), rune: true },
  webBomb:       { flask: 'bomb',    shell: '#b5b09c',      liquid: '#dedac7' },
  holyWater:     { flask: 'vial',    liquid: '#e8f0f4',     fill: 0.9, cork: 'stopper', label: 'holy', glow: 0.25 },
  voidFlask:     { flask: 'orb',     liquid: dmg('force'),  fill: 1.0, cork: 'stopper', dark: true, glow: 0.45 },
};

// ── elixirs + reference potions (docs/references/potions.md; no item in code) ────────────────────
// An elixir lasts until long rest, so it gets the one vessel no potion uses: a tall stoppered
// decanter with a tag. Resistance elixirs take the resisted type's hue AND its glyph on the tag.
const ELIXIRS = [
  ['Elixir of Arcane Cultivation', LOOK.control.hue, 'I'], ['Greater Elixir of Arcane Cultivation', LOOK.control.hue, 'II'],
  ['Superior Elixir of Arcane Cultivation', LOOK.control.hue, 'III'], ['Supreme Elixir of Arcane Cultivation', LOOK.control.hue, 'IV'],
  ...['acid', 'cold', 'fire', 'lightning', 'necrotic', 'poison', 'psychic', 'radiant'].map(t => [`Elixir of ${DAMAGE[t].name} Resistance`, dmg(t), DAMAGE[t].glyph]),
  ['Elixir of Universal Resistance', '#d8d4cc', '⬡'], ['Elixir of Cloud Giant Strength', '#9fb0c0', '✊'], ['Elixir of Hill Giant Strength', '#8a6a44', '✊'],
  ['Elixir of Barkskin', '#6b5334', '⬡'], ["Elixir of Battlemage's Power", '#5a86e0', '✦'], ['Elixir of Bloodlust', '#7a1e1e', '▲'],
  ['Elixir of Darkvision', '#3a4a3a', '◉'], ['Elixir of Guileful Movement', '#c8a050', '➚'], ['Elixir of Heroism', '#efe6cf', '▲'],
  ['Elixir of Peerless Focus', '#6a4a8a', '◎'], ['Elixir of See Invisibility', '#a9d7c9', '◉'], ['Elixir of the Colossus', '#8a7a6a', '▲'],
  ['Elixir of Viciousness', '#5a1a2a', '✕'], ['Elixir of Vigilance', '#d0c090', '◉'], ['Tadpole Elixir', dmg('psychic'), '◐'],
];
const markFor = n => { const t = Object.keys(DAMAGE).find(k => n.includes(DAMAGE[k].name)); return t ?? (/Arcane/.test(n) ? 'control' : /Strength|Colossus|Heroism|Bloodlust/.test(n) ? 'buff' : /Barkskin|Universal/.test(n) ? 'ward' : /vision|Invisibility|Vigilance/.test(n) ? 'light' : /Movement/.test(n) ? 'move' : /Viciousness/.test(n) ? 'slashing' : /Tadpole|Focus/.test(n) ? 'psychic' : /Battlemage/.test(n) ? 'force' : 'utility'); };
const ELIXIR_MARK = {};
const REF_POTIONS = [
  ['Antidote', '#cfe3b0', 'vial'], ['Basilisk Oil', '#8a8a60', 'flask'], ['Potion of Angelic Reprieve', '#f2f0ea', 'decanter'],
  ['Potion of Angelic Slumber', '#c8c8e8', 'decanter'], ['Potion of Animal Speaking', '#8a6a44', 'gourd'], ['Potion of Feather Fall', '#d8e8f0', 'tall'],
  ['Potion of Flying', '#a9d7c9', 'tall'], ['Potion of Gaseous Form', '#98a3a8', 'orb'], ['Potion of Glorious Vaulting', '#c8e0a0', 'gourd'],
  ['Potion of Invisibility', '#dde4ec', 'flask'], ['Potion of Mind Reading', dmg('psychic'), 'round'], ['Potion of Sleep', '#6a6aa8', 'round'],
  ['Potion of Speed', '#a9d7c9', 'gourd'], ['Remedial Potion', '#e89a8a', 'round'],
];

// ── reagents & solvents (reagents.ts): what the thing physically IS decides the form grammar ───────
const REAGENT_VIS = {
  reagentShard:             { form: 'shard',   c: '#b28ae0', glow: 0.3 },
  reagentMugwort:           { form: 'herb',    c: '#7a9a5a' },
  reagentAcornTruffle:      { form: 'fungus',  c: '#7a5a3a', cap: 'round' },
  reagentAutumncrocus:      { form: 'flower',  c: '#b07ad0' },
  reagentWispweed:          { form: 'herb',    c: '#c8d8b0', pale: true },
  reagentHyenaEar:          { form: 'ear',     c: '#a8845a' },
  reagentMergrass:          { form: 'herb',    c: '#4a8a7a' },
  reagentEagleFeather:      { form: 'feather', c: '#6a4a2e', tip: '#e8e0d0' },
  reagentImpPatagium:       { form: 'membrane',c: '#b0413e' },
  reagentXornScales:        { form: 'scale',   c: '#8a7a6a' },
  reagentUnicornHorn:       { form: 'horn',    c: '#f0ece0', spiral: true },
  reagentPlanetarFeather:   { form: 'feather', c: '#f4f0e0', tip: '#f4f0e0', glow: 0.35 },
  reagentWeavemoss:         { form: 'moss',    c: '#6a8ad0' },
  reagentWoodBark:          { form: 'bark',    c: '#6b5334' },
  reagentBelladonna:        { form: 'flower',  c: '#3a2a4a', berries: true },
  reagentWorgFang:          { form: 'fang',    c: '#e6dcc4' },
  reagentCrystallineLens:   { form: 'lens',    c: '#cfe8f0' },
  reagentLaculite:          { form: 'gem',     c: '#4a9ab0' },
  reagentShadowrootSac:     { form: 'sac',     c: '#3a2e4a' },
  reagentHillGiantFinger:   { form: 'finger',  c: '#b8906a' },
  reagentDragonEggMushroom: { form: 'fungus',  c: '#c0502a', cap: 'egg' },
  reagentBlackOleander:     { form: 'flower',  c: '#1e1a22' },
  reagentMudMephitWing:     { form: 'wing',    c: '#6a5a40' },
  reagentBrokenMachinery:   { form: 'gear',    c: '#9a8a6a' },
  reagentNightOrchid:       { form: 'flower',  c: '#4a3a8a', glow: 0.2 },
  reagentGauthEyestalk:     { form: 'eye',     c: '#8a6a7a', stalk: true },
  reagentNothicEye:         { form: 'eye',     c: '#c8b06a' },
  reagentOchreJellySlime:   { form: 'slime',   c: '#c89a3a' },
  reagentChasmCreeper:      { form: 'vine',    c: '#3a5a3a' },
  reagentPegasusFeather:    { form: 'feather', c: '#e8eef4', tip: '#b8c8d8' },
  reagentIntellectDevourer: { form: 'brain',   c: '#d88a9a' },
  reagentBeholderIris:      { form: 'eye',     c: '#6a3a6a', iris: '#d0a030' },
  reagentCloudGiantFinger:  { form: 'finger',  c: '#b8c4d0' },
  reagentDivineBoneShard:   { form: 'bone',    c: '#f0e8d0', glow: 0.35 },
  solventSuspension:        { form: 'vialS',   c: '#c8d0c8' },
  solventSalt:              { form: 'salt',    c: '#e8e4dc' },
  solventEssence:           { form: 'vialS',   c: '#a9d7c9', thin: true },
  solventAshes:             { form: 'ash',     c: '#7a746c' },
  solventSublimate:         { form: 'crystal', c: '#a8a8b0' },
};

// ── manuals: the martial half of scrolls (scrolls.md Q4). A book, coloured by class, stamped by vfx ──
const CLASS_LEATHER = { fighter: '#7a2e2e', barbarian: '#6a4a2a', paladin: '#3a5a8a', ranger: '#3f5a36', rogue: '#2e2e36', monk: '#c07a2e', cleric: '#8a2e2e', druid: '#4f6a3a', bard: '#8a3a6a', sorcerer: '#8a2e3a', warlock: '#3a2e4a', wizard: '#2e4a7a' };

const obj = (o) => o;
export const OBJECTS = [
  ...BASES.map(b => obj({ id: b.id, name: b.name, kind: 'item', slot: b.slot, vis: b.vis, src: 'game' })),
  ...GAME.potions.map(p => obj({ id: p.id, name: p.name, kind: 'potion', family: p.family, rarity: p.rarity, vis: POTION_VIS[p.id], src: 'game' })),
  ...GAME.throwables.map(t => obj({ id: t.id, name: t.name, kind: 'throwable', rarity: t.rarity, damage: t.damage?.type ?? null, surface: t.surface, radius: t.radius, vis: THROW_VIS[t.id], src: 'game' })),
  ...ELIXIRS.map(([name, liquid, tag], i) => obj({ id: slug(name), name, kind: 'elixir', rarity: 'common', // not in code: no rarity exists yet, so none is invented
 vis: { flask: 'elixir', liquid, fill: 0.85, cork: 'stopper', tag, mark: ELIXIR_MARK[name] ?? markFor(name) }, src: 'ref' })),
  ...REF_POTIONS.map(([name, liquid, flask]) => obj({ id: slug(name), name, kind: 'refPotion', rarity: 'common', vis: { flask, liquid, fill: 0.8, cork: 'wax' }, src: 'ref' })),
  ...GAME.stacks.filter(s => s.kind === 'reagent' || s.kind === 'solvent').map(s => obj({ id: s.id, name: s.name, kind: s.kind, rarity: s.rarity, vis: REAGENT_VIS[s.id], src: 'game' })),
  ...GAME.stacks.filter(s => s.kind === 'scroll').map(s => { const a = GAME.actions.find(x => x.id === s.actionId); const L = actionLook(a); return obj({ id: s.id, name: s.name, kind: 'scroll', rarity: s.rarity, look: L, vis: { list: listOf(a.cls), level: s.spellLevel, element: L.element, school: L.school, sigilId: L.catalogue ?? a.id }, src: 'game' }); }),
  ...GAME.actions.filter(a => actionLook(a).martial).map(a => obj({ id: `manual.${a.id}`, name: `Manual: ${a.name}`, kind: 'manual', rarity: 'uncommon', look: actionLook(a), vis: { leather: CLASS_LEATHER[a.cls], stamp: a.vfx, cls: a.cls }, src: 'draft' })),
];
function listOf(cls) { return ({ wizard: 'arcane', sorcerer: 'arcane', warlock: 'arcane', bard: 'arcane', cleric: 'divine', paladin: 'divine', druid: 'primal', ranger: 'primal' })[cls] ?? 'none'; }

/** The catalogue as scrolls: every row of spells.md gets the scroll it would drop as. */
export const CATALOGUE_SCROLLS = SPELLS.map(s => ({ id: `scroll.${s.id}`, name: s.src === 'item' ? s.name : `Scroll of ${s.name}`, kind: 'scroll', rarity: s.area.shape === 'single' ? 'common' : 'uncommon', look: s, vis: { list: s.list ?? 'none', level: null, element: s.element, school: s.school, sigilId: s.id, blank: s.src === 'item' }, src: s.src }));
export const byKind = k => OBJECTS.filter(o => o.kind === k);
export const object = id => OBJECTS.find(o => o.id === id) ?? CATALOGUE_SCROLLS.find(o => o.id === id);
