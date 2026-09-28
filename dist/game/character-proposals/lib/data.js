// A COPY of the game data the proposals draw from, taken 2026-09-25 from frontend/src/data.
// Nothing here imports frontend/ — the proposals must stand alone and must not touch the project.
// The `vis` recipes are new: the one table every generator reads to turn an item into a look.

// ── Races (data/races/index.ts: id, name, build) + the visual traits a generator needs ─────────
export const RACES = [
  { id: 'human',      name: 'Human',      build: 1.00, h: 1.00, w: 1.00, ears: 'round',  skins: ['#e0b18a', '#c98d62', '#9c6440', '#6d4428', '#f0d3b8'] },
  { id: 'elf',        name: 'Elf',        build: 0.98, h: 1.03, w: 0.88, ears: 'long',   skins: ['#f0d3b8', '#e0b18a', '#c98d62'] },
  { id: 'drow',       name: 'Drow',       build: 0.98, h: 1.00, w: 0.88, ears: 'long',   skins: ['#5a4f6e', '#4a4058', '#6b5f80'], hairs: ['#e8e4f0', '#d8d2e6'] },
  { id: 'dwarf',      name: 'Dwarf',      build: 0.86, h: 0.78, w: 1.22, ears: 'round',  skins: ['#e0b18a', '#c98d62', '#9c6440'], beard: true },
  { id: 'halfling',   name: 'Halfling',   build: 0.74, h: 0.68, w: 0.98, ears: 'small',  skins: ['#f0d3b8', '#e0b18a', '#c98d62'], curls: true, bareFeet: true },
  { id: 'gnome',      name: 'Gnome',      build: 0.72, h: 0.64, w: 0.92, ears: 'small',  skins: ['#f0d3b8', '#e0b18a', '#b8a08a'], bigHead: true, nose: true },
  { id: 'tiefling',   name: 'Tiefling',   build: 1.02, h: 1.00, w: 0.98, ears: 'long',   skins: ['#b0413e', '#8e3a5c', '#6a4a8a', '#c86a50'], horns: 'curl', tail: true },
  { id: 'dragonborn', name: 'Dragonborn', build: 1.12, h: 1.06, w: 1.14, ears: 'none',   skins: ['#b0413e', '#3f6fb0', '#4f8a45', '#d8dde2', '#2f2f36', '#9fa8b3', '#c9a045'], snout: true, horns: 'back', tail: true, bald: true },
  { id: 'halfOrc',    name: 'Half-Orc',   build: 1.08, h: 1.02, w: 1.14, ears: 'small',  skins: ['#7b8a6a', '#8a9a70', '#6a7a5a', '#a8907a'], tusks: true },
  { id: 'halfElf',    name: 'Half-Elf',   build: 1.00, h: 1.01, w: 0.94, ears: 'short',  skins: ['#f0d3b8', '#e0b18a', '#c98d62', '#9c6440'] },
  { id: 'githyanki',  name: 'Githyanki',  build: 1.00, h: 1.06, w: 0.86, ears: 'ridge',  skins: ['#b5b86a', '#a0a860', '#c4c280'], topknot: true },
];
export const race = id => RACES.find(r => r.id === id);

// sim/party/roster.ts
export const SKINS = ['#e0b18a', '#c98d62', '#9c6440', '#6d4428', '#4a2d1c', '#f0d3b8', '#a8907a', '#7b8a6a'];
export const HAIRS = ['#2a2018', '#4a3526', '#8a5a32', '#c9a45e', '#d8d2c4', '#6a3a3a', '#3a3a4a'];

// data/items/rarity.ts + styles/tokens.css. Gold means Legendary and nothing else.
export const RARITIES = [
  { id: 'common',    name: 'Common',    color: '#8e9691', trim: null },
  { id: 'uncommon',  name: 'Uncommon',  color: '#6faf63', trim: '#6faf63' },
  { id: 'rare',      name: 'Rare',      color: '#5c93dc', trim: '#5c93dc' },
  { id: 'veryRare',  name: 'Very Rare', color: '#a87fd6', trim: '#a87fd6', glow: 0.35 },
  { id: 'legendary', name: 'Legendary', color: '#e0b255', trim: '#e0b255', glow: 0.7 },
];
export const rarity = id => RARITIES.find(r => r.id === id) ?? RARITIES[0];

// ── Materials: a base colour each; generators derive their ramps from it ─────────────────────
export const MATERIALS = {
  cloth:   '#7a6a58', // overridden by the character's primary where `tint` is set
  leather: '#7a4e2e',
  hide:    '#8a6a44',
  studded: '#6a4428',
  iron:    '#8a9098',
  steel:   '#b6bec8',
  brass:   '#b99a5e',
  wood:    '#8a5a32',
  darkwood:'#4e3524',
  gem:     '#c43d4d',
  bone:    '#ddd3bc',
  string:  '#d8d2c4',
};

// ── The recipe table: every one of the 54 bases (data/items/bases/*) → a parametric look ─────
// body.mat: what the torso reads as · skirt: 0..1 hem below the belt · sleeves: 0 none … 2 long
// weapon: kind + length/width in body-heights so it scales with the wearer
export const BASES = [
  // melee.ts
  { id: 'dagger',       name: 'Dagger',        slot: 'mainHand', vis: { kind: 'blade',  len: 0.22, width: 0.05, guard: 'bar',   mat: 'steel' } },
  { id: 'shortsword',   name: 'Shortsword',    slot: 'mainHand', vis: { kind: 'blade',  len: 0.36, width: 0.06, guard: 'cross', mat: 'steel' } },
  { id: 'scimitar',     name: 'Scimitar',      slot: 'mainHand', vis: { kind: 'blade',  len: 0.40, width: 0.07, guard: 'bar',   mat: 'steel', curve: 0.35 } },
  { id: 'rapier',       name: 'Rapier',        slot: 'mainHand', vis: { kind: 'blade',  len: 0.46, width: 0.03, guard: 'cup',   mat: 'steel' } },
  { id: 'longsword',    name: 'Longsword',     slot: 'mainHand', vis: { kind: 'blade',  len: 0.50, width: 0.06, guard: 'cross', mat: 'steel' } },
  { id: 'battleaxe',    name: 'Battleaxe',     slot: 'mainHand', vis: { kind: 'axe',    len: 0.46, head: 0.16, mat: 'iron', haft: 'wood' } },
  { id: 'warhammer',    name: 'Warhammer',     slot: 'mainHand', vis: { kind: 'hammer', len: 0.46, head: 0.12, mat: 'iron', haft: 'wood', spike: true } },
  { id: 'mace',         name: 'Mace',          slot: 'mainHand', vis: { kind: 'mace',   len: 0.38, head: 0.10, mat: 'iron', haft: 'darkwood' } },
  { id: 'flail',        name: 'Flail',         slot: 'mainHand', vis: { kind: 'flail',  len: 0.30, head: 0.10, mat: 'iron', haft: 'darkwood' } },
  { id: 'greatsword',   name: 'Greatsword',    slot: 'mainHand', vis: { kind: 'blade',  len: 0.74, width: 0.08, guard: 'cross', mat: 'steel', twoHanded: true } },
  { id: 'greataxe',     name: 'Greataxe',      slot: 'mainHand', vis: { kind: 'axe',    len: 0.70, head: 0.24, mat: 'iron', haft: 'wood', twoHanded: true, double: true } },
  { id: 'maul',         name: 'Maul',          slot: 'mainHand', vis: { kind: 'hammer', len: 0.70, head: 0.18, mat: 'iron', haft: 'wood', twoHanded: true } },
  { id: 'halberd',      name: 'Halberd',       slot: 'mainHand', vis: { kind: 'polearm',len: 1.05, head: 0.16, mat: 'steel', haft: 'wood', twoHanded: true, blade: 'axe' } },
  { id: 'glaive',       name: 'Glaive',        slot: 'mainHand', vis: { kind: 'polearm',len: 1.00, head: 0.20, mat: 'steel', haft: 'wood', twoHanded: true, blade: 'knife' } },
  { id: 'quarterstaff', name: 'Quarterstaff',  slot: 'mainHand', vis: { kind: 'staff',  len: 0.95, mat: 'wood' } },
  { id: 'arcaneStaff',  name: 'Arcane Staff',  slot: 'mainHand', vis: { kind: 'staff',  len: 1.00, mat: 'darkwood', orb: true } },
  // ranged.ts
  { id: 'shortbow',     name: 'Shortbow',      slot: 'mainHand', vis: { kind: 'bow',      len: 0.60, mat: 'wood' } },
  { id: 'longbow',      name: 'Longbow',       slot: 'mainHand', vis: { kind: 'bow',      len: 0.90, mat: 'wood' } },
  { id: 'lightCrossbow',name: 'Light Crossbow',slot: 'mainHand', vis: { kind: 'crossbow', len: 0.36, mat: 'wood' } },
  { id: 'heavyCrossbow',name: 'Heavy Crossbow',slot: 'mainHand', vis: { kind: 'crossbow', len: 0.48, mat: 'darkwood', twoHanded: true } },
  { id: 'handCrossbow', name: 'Hand Crossbow', slot: 'mainHand', vis: { kind: 'crossbow', len: 0.24, mat: 'darkwood' } },
  { id: 'sling',        name: 'Sling',         slot: 'mainHand', vis: { kind: 'sling',    len: 0.24, mat: 'leather' } },
  // armour.ts — body
  { id: 'padded',        name: 'Padded Armour',  slot: 'body', vis: { mat: 'cloth',   tint: true, quilt: true,  sleeves: 1, skirt: 0.1 } },
  { id: 'leatherArmour', name: 'Leather Armour', slot: 'body', vis: { mat: 'leather', sleeves: 1, skirt: 0.1 } },
  { id: 'studdedLeather',name: 'Studded Leather',slot: 'body', vis: { mat: 'studded', studs: true, sleeves: 1, skirt: 0.15 } },
  { id: 'hide',          name: 'Hide Armour',    slot: 'body', vis: { mat: 'hide',    fur: true, sleeves: 0, skirt: 0.2 } },
  { id: 'scaleMail',     name: 'Scale Mail',     slot: 'body', vis: { mat: 'iron',    scales: true, sleeves: 1, skirt: 0.35 } },
  { id: 'breastplate',   name: 'Breastplate',    slot: 'body', vis: { mat: 'steel',   plate: 'chest', sleeves: 1, skirt: 0.1, under: 'cloth' } },
  { id: 'halfPlate',     name: 'Half Plate',     slot: 'body', vis: { mat: 'steel',   plate: 'half', pauldrons: true, sleeves: 2, skirt: 0.25 } },
  { id: 'ringMail',      name: 'Ring Mail',      slot: 'body', vis: { mat: 'iron',    rings: true, sleeves: 1, skirt: 0.25 } },
  { id: 'chainMail',     name: 'Chain Mail',     slot: 'body', vis: { mat: 'iron',    chain: true, sleeves: 2, skirt: 0.35, tabard: true } },
  { id: 'splint',        name: 'Splint Armour',  slot: 'body', vis: { mat: 'iron',    splints: true, pauldrons: true, sleeves: 2, skirt: 0.35 } },
  { id: 'plate',         name: 'Plate Armour',   slot: 'body', vis: { mat: 'steel',   plate: 'full', pauldrons: true, sleeves: 2, skirt: 0.3, legs: true } },
  { id: 'robe',          name: 'Robe',           slot: 'body', vis: { mat: 'cloth',   tint: true, sleeves: 2, skirt: 1.0, sash: true } },
  // off hand
  { id: 'buckler',     name: 'Buckler',     slot: 'offHand', vis: { kind: 'shield', shape: 'round',  size: 0.20, mat: 'iron' } },
  { id: 'shield',      name: 'Shield',      slot: 'offHand', vis: { kind: 'shield', shape: 'heater', size: 0.30, mat: 'wood', rim: 'iron', emblem: true } },
  { id: 'towerShield', name: 'Tower Shield',slot: 'offHand', vis: { kind: 'shield', shape: 'tower',  size: 0.46, mat: 'steel', rim: 'brass' } },
  // head
  { id: 'cap',     name: 'Leather Cap', slot: 'head', vis: { kind: 'cap',     mat: 'leather' } },
  { id: 'circlet', name: 'Circlet',     slot: 'head', vis: { kind: 'circlet', mat: 'brass', gem: true } },
  { id: 'helm',    name: 'Helm',        slot: 'head', vis: { kind: 'helm',    mat: 'steel', nasal: true } },
  // hands
  { id: 'gloves',    name: 'Gloves',    slot: 'hands', vis: { kind: 'gloves',    mat: 'leather' } },
  { id: 'bracers',   name: 'Bracers',   slot: 'hands', vis: { kind: 'bracers',   mat: 'studded' } },
  { id: 'gauntlets', name: 'Gauntlets', slot: 'hands', vis: { kind: 'gauntlets', mat: 'steel' } },
  // feet
  { id: 'shoes',   name: 'Shoes',   slot: 'feet', vis: { kind: 'shoes',   mat: 'leather', height: 0.3 } },
  { id: 'boots',   name: 'Boots',   slot: 'feet', vis: { kind: 'boots',   mat: 'leather', height: 0.7 } },
  { id: 'greaves', name: 'Greaves', slot: 'feet', vis: { kind: 'greaves', mat: 'steel',   height: 1.0 } },
  // cloak
  { id: 'cloak',  name: 'Cloak',  slot: 'cloak', vis: { kind: 'cloak',  len: 0.9, hood: true } },
  { id: 'mantle', name: 'Mantle', slot: 'cloak', vis: { kind: 'mantle', len: 0.35 } },
  // ring / amulet — small, but they still show: a glint on the finger, a pendant on the chest
  { id: 'ring',     name: 'Ring',     slot: 'ring',   vis: { kind: 'ring', mat: 'iron' } },
  { id: 'band',     name: 'Band',     slot: 'ring',   vis: { kind: 'ring', mat: 'brass' } },
  { id: 'signet',   name: 'Signet',   slot: 'ring',   vis: { kind: 'ring', mat: 'brass', gem: true } },
  { id: 'amulet',   name: 'Amulet',   slot: 'amulet', vis: { kind: 'amulet', mat: 'brass', gem: true } },
  { id: 'pendant',  name: 'Pendant',  slot: 'amulet', vis: { kind: 'amulet', mat: 'iron',  gem: true } },
  { id: 'talisman', name: 'Talisman', slot: 'amulet', vis: { kind: 'amulet', mat: 'bone' } },
];
export const base = id => BASES.find(b => b.id === id);
export const basesFor = slot => BASES.filter(b => b.slot === slot);
export const SLOTS = ['mainHand', 'offHand', 'body', 'head', 'hands', 'feet', 'cloak', 'amulet', 'ring'];

// ── Twelve classes (data/classes/*) with a loadout that reads as the class at a glance ───────
export const CLASSES = [
  { id: 'fighter',   name: 'Fighter',   primary: '#7a2e2e', secondary: '#c9b28a', loadout: { body: 'chainMail', mainHand: 'longsword', offHand: 'shield', head: 'helm', hands: 'gauntlets', feet: 'boots' } },
  { id: 'barbarian', name: 'Barbarian', primary: '#6a4a2a', secondary: '#a8452f', loadout: { body: 'hide', mainHand: 'greataxe', hands: 'bracers', feet: 'boots', amulet: 'talisman' } },
  { id: 'paladin',   name: 'Paladin',   primary: '#e4dcc6', secondary: '#3a5a8a', loadout: { body: 'plate', mainHand: 'warhammer', offHand: 'towerShield', head: 'helm', hands: 'gauntlets', feet: 'greaves', cloak: 'cloak' } },
  { id: 'ranger',    name: 'Ranger',    primary: '#3f5a36', secondary: '#8a6a44', loadout: { body: 'studdedLeather', mainHand: 'longbow', head: 'cap', hands: 'gloves', feet: 'boots', cloak: 'cloak' } },
  { id: 'rogue',     name: 'Rogue',     primary: '#2e2e36', secondary: '#6a3a3a', loadout: { body: 'leatherArmour', mainHand: 'dagger', hands: 'gloves', feet: 'shoes', cloak: 'cloak', ring: 'signet' } },
  { id: 'monk',      name: 'Monk',      primary: '#c07a2e', secondary: '#6a3a2a', loadout: { body: 'padded', mainHand: 'quarterstaff', hands: 'bracers', feet: 'shoes' } },
  { id: 'cleric',    name: 'Cleric',    primary: '#d8d2c4', secondary: '#8a2e2e', loadout: { body: 'scaleMail', mainHand: 'mace', offHand: 'shield', head: 'circlet', feet: 'boots', amulet: 'amulet' } },
  { id: 'druid',     name: 'Druid',     primary: '#4f6a3a', secondary: '#8a6a44', loadout: { body: 'hide', mainHand: 'quarterstaff', cloak: 'mantle', feet: 'shoes', amulet: 'talisman' } },
  { id: 'bard',      name: 'Bard',      primary: '#8a3a6a', secondary: '#d8b060', loadout: { body: 'studdedLeather', mainHand: 'rapier', head: 'cap', cloak: 'mantle', feet: 'boots', ring: 'band' } },
  { id: 'sorcerer',  name: 'Sorcerer',  primary: '#8a2e3a', secondary: '#2e2e36', loadout: { body: 'robe', mainHand: 'dagger', feet: 'shoes', amulet: 'pendant', ring: 'signet' } },
  { id: 'warlock',   name: 'Warlock',   primary: '#3a2e4a', secondary: '#6a8a3a', loadout: { body: 'leatherArmour', mainHand: 'handCrossbow', cloak: 'cloak', feet: 'boots', amulet: 'talisman' } },
  { id: 'wizard',    name: 'Wizard',    primary: '#2e4a7a', secondary: '#c9b28a', loadout: { body: 'robe', mainHand: 'arcaneStaff', head: 'circlet', cloak: 'mantle', feet: 'shoes' } },
];
export const klass = id => CLASSES.find(c => c.id === id);

/** The "one character through eight loadouts" progression every approach renders. */
export const PROGRESSION = [
  { label: 'Unarmed',          loadout: {} },
  { label: 'Robe & staff',     loadout: { body: 'robe', mainHand: 'quarterstaff', feet: 'shoes' } },
  { label: 'Leather & bow',    loadout: { body: 'leatherArmour', mainHand: 'shortbow', feet: 'boots', hands: 'gloves', head: 'cap' } },
  { label: 'Hide & axe',       loadout: { body: 'hide', mainHand: 'battleaxe', hands: 'bracers', feet: 'boots' } },
  { label: 'Chain & shield',   loadout: { body: 'chainMail', mainHand: 'longsword', offHand: 'shield', head: 'helm', feet: 'boots' } },
  { label: 'Scale & halberd',  loadout: { body: 'scaleMail', mainHand: 'halberd', hands: 'gauntlets', feet: 'greaves', cloak: 'mantle' } },
  { label: 'Plate & greatsword', loadout: { body: 'plate', mainHand: 'greatsword', head: 'helm', hands: 'gauntlets', feet: 'greaves', cloak: 'cloak' } },
  { label: 'Tower & warhammer', loadout: { body: 'halfPlate', mainHand: 'warhammer', offHand: 'towerShield', head: 'helm', hands: 'gauntlets', feet: 'greaves', amulet: 'amulet' } },
];

// ── Creatures: a handful of archetypes (data/creatures/archetypes.ts) to prove the method stretches
export const CREATURES = [
  { id: 'skeleton',  name: 'Skeleton',  form: 'skeleton', skin: '#ddd3bc', h: 1.0, w: 0.8, loadout: { mainHand: 'shortsword', offHand: 'buckler' } },
  { id: 'direRat',   name: 'Dire Rat',  form: 'quadruped', skin: '#5a4a3e', h: 0.45, w: 1.2 },
  { id: 'kobold',    name: 'Kobold',    form: 'lizard', skin: '#a8452f', h: 0.62, w: 0.85, loadout: { mainHand: 'dagger', body: 'leatherArmour' } },
  { id: 'ogre',      name: 'Ogre',      form: 'brute', skin: '#8a9a70', h: 1.45, w: 1.6, loadout: { mainHand: 'maul', body: 'hide' } },
  { id: 'greyOoze',  name: 'Grey Ooze', form: 'ooze', skin: '#7a8088', h: 0.55, w: 1.3 },
  { id: 'imp',       name: 'Imp',       form: 'winged', skin: '#b0413e', h: 0.55, w: 0.7 },
  { id: 'animatedArmour', name: 'Animated Armour', form: 'hollow', skin: '#2a2a30', h: 1.05, w: 1.05, loadout: { body: 'plate', head: 'helm', hands: 'gauntlets', feet: 'greaves', mainHand: 'longsword' } },
  { id: 'cultist',   name: 'Cultist',   form: 'biped', skin: '#c98d62', h: 1.0, w: 1.0, loadout: { body: 'robe', cloak: 'cloak', mainHand: 'dagger' }, primary: '#5a1a1a' },
];

// ── Biomes (data/floors/biomes.ts palettes, verbatim) ───────────────────────────────────────
export const BIOMES = [
  { id: 'cisterns',     name: 'The Cisterns',      floor: ['#3a3d38', '#4a4f46', '#565c50', '#2c2f2b'], wall: ['#4e544a', '#5f665a', '#3a3f38'], accent: '#6f8a5e', fog: '#141712', decal: 'moss' },
  { id: 'ossuary',      name: 'The Ossuary',       floor: ['#524c42', '#625b4e', '#6f6656', '#3d382f'], wall: ['#7a7263', '#8d8473', '#5a5349'], accent: '#a8452f', fog: '#171310', decal: 'bones' },
  { id: 'fungalReach',  name: 'The Fungal Reach',  floor: ['#3b2f44', '#4a3a55', '#574566', '#2a2131'], wall: ['#5c4a68', '#6d587c', '#40334a'], accent: '#c9b34a', fog: '#181221', decal: 'mushrooms' },
  { id: 'cinderworks',  name: 'The Cinderworks',   floor: ['#33231c', '#432d22', '#52372a', '#241812'], wall: ['#5a3b2b', '#6e4833', '#3d281e'], accent: '#e0622a', fog: '#1a0f0a', decal: 'embers' },
  { id: 'drownedVault', name: 'The Drowned Vault', floor: ['#1f3a3d', '#2a4c4e', '#356063', '#16292b'], wall: ['#3a5c5e', '#497173', '#2a4446'], accent: '#7fc6dd', fog: '#0c1a1c', decal: 'puddles' },
  { id: 'rimehollow',   name: 'The Rimehollow',    floor: ['#3e4a55', '#4e5d69', '#5f717e', '#2c363e'], wall: ['#647885', '#7a8f9c', '#4a5a66'], accent: '#d6f0f7', fog: '#111920', decal: 'frost' },
  { id: 'sableCourt',   name: 'The Sable Court',   floor: ['#1c1a20', '#282430', '#332e3c', '#131115'], wall: ['#3a3444', '#4a4256', '#282332'], accent: '#c8a349', fog: '#0a090c', decal: 'inlay' },
  { id: 'wyrmDeeps',    name: 'The Wyrm Deeps',    floor: ['#26301f', '#33402a', '#415034', '#1a2216'], wall: ['#44502f', '#56643b', '#2f3a23'], accent: '#e0622a', fog: '#0f1409', decal: 'roots' },
];
export const biome = id => BIOMES.find(b => b.id === id);

/** Build a character spec from race/class/overrides — the shape every generator takes. */
export function spec({ race: r = 'human', cls = 'fighter', skin, hair, hairStyle = 0, loadout, rarity: rar = {}, seed = 'x', primary, secondary } = {}) {
  const R = race(r), C = klass(cls);
  return {
    race: R, cls: C, seed,
    skin: skin ?? R.skins[0],
    hair: hair ?? (R.hairs ? R.hairs[0] : HAIRS[1]),
    hairStyle,
    primary: primary ?? C.primary, secondary: secondary ?? C.secondary,
    loadout: loadout ?? C.loadout,
    rarity: rar,
  };
}
