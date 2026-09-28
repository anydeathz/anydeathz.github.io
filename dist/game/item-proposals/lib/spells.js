// The spell LOOK table — one row per spell, every one the page draws. This is the recipe a renderer
// reads, the same idea as `vis` on items: no spell has a picture, it has a row.
//
//   school · element · delivery · shape · size(ft) · surface · list(s) · src
//
// school   abj con div enc evo ill nec tra                         (5e SRD schools)
// element  a damage type from data/damageTypes.ts, or one of: heal buff ward debuff control summon
//          light shadow move utility — the non-damage "looks"
// delivery projectile | beam | bolt (chain) | touch | weapon (imbues the next hit) | self | target
//          (appears on the target) | point (an area placed at range) | zone (persists) | wall | summon
// shape    single | sphere | cone | line | cube | cylinder | aura | wall | ring       size in 5e feet
// src      srd  — area and element as the 5e SRD states them
//          bg3  — a BG3 spell not in the SRD; drafted from BG3's tooltip, CHECK
//          game — the row mirrors an ActionDef in frontend/src/data/classes (its aoeRadius wins)
//          item — not a spell (a document), drawn as a scroll with no sigil
//
// Sizes convert at 5 ft = 1 hex, except where the game already has a radius (see lib/hexarea.js).
// The sim has only discs today; cone, line, cube and wall are visual drafts until the hex pass.
const T = `
Acid Splash            |con|acid       |target    |sphere  |5  |     |arcane      |srd
Blade Ward             |abj|ward       |self      |single  |0  |     |arcane      |srd
Booming Blade          |evo|thunder    |weapon    |single  |0  |     |arcane      |srd
Bursting Sinew         |nec|necrotic   |target    |sphere  |5  |     |arcane      |bg3
Dancing Lights         |evo|light      |point     |sphere  |10 |     |arcane      |srd
Eldritch Blast         |evo|force      |beam      |single  |0  |     |arcane      |game
Friends                |enc|control    |self      |single  |0  |     |arcane      |srd
Guidance               |div|buff       |touch     |single  |0  |     |divine      |srd
Light                  |evo|light      |touch     |sphere  |20 |     |arcane      |srd
Mage Hand              |con|utility    |summon    |single  |0  |     |arcane      |srd
Minor Illusion         |ill|utility    |point     |cube    |5  |     |arcane      |srd
Poison Spray           |con|poison     |target    |single  |0  |     |primal      |game
Produce Flame          |con|fire       |projectile|single  |0  |     |primal      |srd
Resistance             |abj|ward       |touch     |single  |0  |     |divine      |srd
Sacred Flame           |evo|radiant    |target    |single  |0  |     |divine      |game
Shillelagh             |tra|buff       |weapon    |single  |0  |     |primal      |srd
Thaumaturgy            |tra|utility    |self      |single  |0  |     |divine      |srd
Thorn Whip             |tra|piercing   |beam      |single  |0  |     |primal      |game
Toll the Dead          |nec|necrotic   |target    |single  |0  |     |divine      |srd
True Strike            |div|buff       |self      |single  |0  |     |arcane      |srd
Vicious Mockery        |enc|psychic    |target    |single  |0  |     |arcane      |game
Armour of Agathys      |abj|cold       |self      |aura    |0  |     |arcane      |srd
Arms of Hadar          |con|necrotic   |self      |aura    |10 |     |arcane      |game
Bane                   |enc|debuff     |target    |sphere  |30 |     |divine      |srd
Bless                  |enc|buff       |target    |sphere  |30 |     |divine      |game
Command                |enc|control    |target    |single  |0  |     |divine      |srd
Compelled Duel         |enc|control    |target    |single  |0  |     |divine      |srd
Create or Destroy Water|tra|utility    |point     |cube    |30 |water|primal      |game
Cure Wounds            |evo|heal       |touch     |single  |0  |     |divine      |srd
Dissonant Whispers     |enc|psychic    |target    |single  |0  |     |arcane      |srd
Divine Favour          |evo|radiant    |weapon    |single  |0  |     |divine      |srd
Enhance Leap           |tra|move       |touch     |single  |0  |     |arcane      |bg3
Ensnaring Strike       |con|control    |weapon    |single  |0  |web  |primal      |srd
Entangle               |con|control    |point     |cube    |20 |web  |primal      |game
Faerie Fire            |evo|light      |point     |cube    |20 |     |arcane      |game
Find Familiar          |con|summon     |summon    |single  |0  |     |arcane      |srd
Guiding Bolt           |evo|radiant    |projectile|single  |0  |     |divine      |srd
Hail of Thorns         |con|piercing   |weapon    |sphere  |5  |     |primal      |game
Healing Word           |evo|heal       |target    |single  |0  |     |divine      |game
Hellish Rebuke         |evo|fire       |target    |single  |0  |     |arcane      |srd
Heroism                |enc|buff       |touch     |single  |0  |     |divine      |srd
Hex                    |enc|necrotic   |target    |single  |0  |     |arcane      |game
Hunter's Mark          |div|debuff     |target    |single  |0  |     |primal      |game
Inflict Wounds         |nec|necrotic   |touch     |single  |0  |     |divine      |srd
Longstrider            |tra|move       |touch     |single  |0  |     |primal      |srd
Sanctuary              |abj|ward       |touch     |single  |0  |     |divine      |srd
Searing Smite          |evo|fire       |weapon    |single  |0  |     |divine      |game
Shield                 |abj|ward       |self      |single  |0  |     |arcane      |srd
Shield of Faith        |abj|ward       |target    |single  |0  |     |divine      |srd
Speak with Animals     |div|utility    |self      |single  |0  |     |primal      |srd
Thunderous Smite       |evo|thunder    |weapon    |single  |0  |     |divine      |srd
Wrathful Smite         |evo|psychic    |weapon    |single  |0  |     |divine      |srd
Barkskin               |tra|ward       |touch     |single  |0  |     |primal      |srd
Branding Smite         |evo|radiant    |weapon    |single  |0  |     |divine      |srd
Calm Emotions          |enc|control    |point     |sphere  |20 |     |divine      |srd
Enhance Ability        |tra|buff       |touch     |single  |0  |     |divine      |srd
Enthrall               |enc|control    |target    |single  |0  |     |arcane      |srd
Heat Metal             |tra|fire       |target    |single  |0  |     |primal      |srd
Lesser Restoration     |abj|heal       |touch     |single  |0  |     |divine      |srd
Moonbeam               |evo|radiant    |zone      |cylinder|5  |     |primal      |game
Pass Without Trace     |abj|shadow     |self      |aura    |30 |     |primal      |srd
Phantasmal Force       |ill|psychic    |target    |single  |0  |     |arcane      |srd
Prayer of Healing      |evo|heal       |target    |sphere  |30 |     |divine      |srd
Protection from Poison |abj|ward       |touch     |single  |0  |     |divine      |srd
Shadow Blade           |ill|psychic    |weapon    |single  |0  |     |arcane      |srd
Silence                |ill|control    |zone      |sphere  |20 |     |divine      |srd
Spike Growth           |tra|piercing   |zone      |sphere  |20 |     |primal      |srd
Spiritual Weapon       |evo|force      |summon    |single  |0  |     |divine      |srd
Warding Bond           |abj|ward       |touch     |single  |0  |     |divine      |srd
Beacon of Hope         |abj|heal       |target    |sphere  |30 |     |divine      |srd
Blinding Smite         |evo|radiant    |weapon    |single  |0  |     |divine      |srd
Call Lightning         |con|lightning  |zone      |cylinder|5  |     |primal      |game
Conjure Barrage        |con|piercing   |self      |cone    |60 |     |primal      |srd
Counterspell           |abj|ward       |target    |single  |0  |     |arcane      |srd
Crusader's Mantle      |evo|radiant    |self      |aura    |30 |     |divine      |srd
Daylight               |evo|light      |point     |sphere  |60 |     |divine      |srd
Elemental Weapon       |tra|fire       |weapon    |single  |0  |     |divine      |srd
Hunger of Hadar        |con|cold       |zone      |sphere  |20 |     |arcane      |game
Lightning Arrow        |tra|lightning  |projectile|sphere  |10 |     |primal      |srd
Mass Healing Word      |evo|heal       |target    |sphere  |30 |     |divine      |srd
Plant Growth           |tra|control    |zone      |sphere  |100|     |primal      |srd
Spirit Guardians       |con|radiant    |self      |aura    |15 |     |divine      |game
Warden of Vitality     |abj|heal       |self      |aura    |30 |     |primal      |bg3
Conjure Woodland Being |con|summon     |summon    |single  |0  |     |primal      |srd
Death Ward             |abj|ward       |touch     |single  |0  |     |divine      |srd
Dominate Beast         |enc|control    |target    |single  |0  |     |primal      |srd
Freedom of Movement    |abj|ward       |touch     |single  |0  |     |divine      |srd
Grasping Vine          |con|control    |summon    |single  |0  |     |primal      |srd
Guardian of Faith      |con|radiant    |summon    |aura    |10 |     |divine      |srd
Otiluke's Resilient Sphere|evo|ward    |target    |sphere  |5  |     |arcane      |srd
Contagion              |nec|poison     |touch     |single  |0  |     |divine      |srd
Dispel Evil and Good   |abj|radiant    |self      |single  |0  |     |divine      |srd
Flame Strike           |evo|fire       |point     |cylinder|10 |fire |divine      |srd
Greater Restoration    |abj|heal       |touch     |single  |0  |     |divine      |srd
Insect Plague          |con|piercing   |zone      |sphere  |20 |     |primal      |srd
Mass Cure Wounds       |evo|heal       |point     |sphere  |30 |     |divine      |srd
Arcane Gate            |con|move       |point     |ring    |5  |     |arcane      |srd
Blade Barrier          |evo|slashing   |wall      |wall    |100|     |divine      |srd
Create Undead          |nec|summon     |summon    |single  |0  |     |arcane      |srd
Harm                   |nec|necrotic   |target    |single  |0  |     |divine      |srd
Heal                   |evo|heal       |target    |single  |0  |     |divine      |srd
Heroes' Feast          |con|buff       |point     |sphere  |10 |     |divine      |srd
Planar Ally            |con|summon     |summon    |single  |0  |     |divine      |srd
Wall of Thorns         |con|piercing   |wall      |wall    |60 |     |primal      |srd
Wind Walk              |tra|move       |self      |single  |0  |     |primal      |srd
Darkvision             |tra|buff       |touch     |single  |0  |     |arcane      |srd
Detect Thoughts        |div|psychic    |self      |single  |0  |     |arcane      |srd
Dimension Door         |con|move       |self      |single  |0  |     |arcane      |srd
Feather Fall           |tra|move       |target    |sphere  |60 |     |arcane      |srd
Fly                    |tra|move       |touch     |single  |0  |     |arcane      |srd
Speak with Dead        |nec|utility    |target    |single  |0  |     |divine      |srd
Artistry of War        |con|force      |point     |sphere  |10 |     |arcane      |bg3
Bestial Communion      |con|summon     |summon    |single  |0  |     |primal      |bg3
Dethrone               |nec|necrotic   |target    |single  |0  |     |arcane      |bg3
Summon Quasit          |con|summon     |summon    |single  |0  |     |arcane      |bg3
True Resurrection      |nec|heal       |touch     |single  |0  |     |divine      |srd
Signed Trade Visa      |   |utility    |self      |single  |0  |     |            |item
Bone Chill             |nec|necrotic   |projectile|single  |0  |     |arcane      |bg3
Fire Bolt              |evo|fire       |projectile|single  |0  |     |arcane      |game
Ray of Frost           |evo|cold       |beam      |single  |0  |     |arcane      |game
Shocking Grasp         |evo|lightning  |touch     |single  |0  |     |arcane      |srd
Animal Friendship      |enc|control    |target    |single  |0  |     |primal      |srd
Burning Hands          |evo|fire       |self      |cone    |15 |fire |arcane      |srd
Charm Person           |enc|control    |target    |single  |0  |     |arcane      |srd
Chromatic Orb          |evo|fire       |projectile|single  |0  |     |arcane      |srd
Colour Spray           |ill|light      |self      |cone    |15 |     |arcane      |srd
Disguise Self          |ill|utility    |self      |single  |0  |     |arcane      |srd
Expeditious Retreat    |tra|move       |self      |single  |0  |     |arcane      |srd
False Life             |nec|ward       |self      |single  |0  |     |arcane      |srd
Fog Cloud              |con|shadow     |zone      |sphere  |20 |steam|arcane      |srd
Goodberry              |tra|heal       |self      |single  |0  |     |primal      |game
Grease                 |con|control    |point     |cube    |10 |grease|arcane     |game
Ice Knife              |con|cold       |projectile|sphere  |5  |ice  |arcane      |srd
Mage Armour            |abj|ward       |touch     |single  |0  |     |arcane      |srd
Magic Missile          |evo|force      |projectile|single  |0  |     |arcane      |game
Protection from Evil and Good|abj|ward |touch     |single  |0  |     |divine      |srd
Ray of Sickness        |nec|poison     |beam      |single  |0  |     |arcane      |srd
Sleep                  |enc|control    |point     |sphere  |20 |     |arcane      |srd
Tasha's Hideous Laughter|enc|psychic   |target    |single  |0  |     |arcane      |srd
Thunderwave            |evo|thunder    |self      |cube    |15 |     |arcane      |srd
Witch Bolt             |evo|lightning  |beam      |single  |0  |     |arcane      |srd
Aid                    |abj|heal       |target    |sphere  |30 |     |divine      |srd
Arcane Lock            |abj|utility    |touch     |single  |0  |     |arcane      |srd
Blindness              |nec|debuff     |target    |single  |0  |     |arcane      |srd
Blur                   |ill|ward       |self      |single  |0  |     |arcane      |srd
Cloud of Daggers       |con|slashing   |zone      |cube    |5  |     |arcane      |game
Crown of Madness       |enc|control    |target    |single  |0  |     |arcane      |srd
Darkness               |evo|shadow     |zone      |sphere  |15 |     |arcane      |srd
Enlarge                |tra|buff       |target    |single  |0  |     |arcane      |srd
Flame Blade            |evo|fire       |weapon    |single  |0  |     |primal      |srd
Flaming Sphere         |con|fire       |summon    |sphere  |5  |fire |primal      |srd
Gust of Wind           |evo|thunder    |self      |line    |60 |     |arcane      |srd
Hold Person            |enc|control    |target    |single  |0  |     |arcane      |srd
Invisibility           |ill|shadow     |touch     |single  |0  |     |arcane      |srd
Knock                  |tra|utility    |target    |single  |0  |     |arcane      |srd
Magic Weapon           |tra|buff       |weapon    |single  |0  |     |arcane      |srd
Melf's Acid Arrow      |evo|acid       |projectile|single  |0  |acid |arcane      |srd
Mirror Image           |ill|ward       |self      |single  |0  |     |arcane      |srd
Misty Step             |con|move       |self      |single  |0  |     |arcane      |srd
Ray of Enfeeblement    |nec|debuff     |beam      |single  |0  |     |arcane      |srd
Scorching Ray          |evo|fire       |beam      |single  |0  |     |arcane      |game
See Invisibility       |div|buff       |self      |single  |0  |     |arcane      |srd
Shatter                |evo|thunder    |point     |sphere  |10 |     |arcane      |game
Web                    |con|control    |zone      |cube    |20 |web  |arcane      |srd
Animate Dead           |nec|summon     |summon    |single  |0  |     |arcane      |srd
Bestow Curse           |nec|debuff     |touch     |single  |0  |     |arcane      |srd
Blink                  |tra|move       |self      |single  |0  |     |arcane      |srd
Fear                   |ill|psychic    |self      |cone    |30 |     |arcane      |srd
Feign Death            |nec|utility    |touch     |single  |0  |     |divine      |srd
Fireball               |evo|fire       |projectile|sphere  |20 |fire |arcane      |game
Gaseous Form           |tra|move       |touch     |single  |0  |     |arcane      |srd
Glyph of Warding       |abj|thunder    |point     |sphere  |20 |     |arcane      |srd
Haste                  |tra|buff       |target    |single  |0  |     |arcane      |game
Hypnotic Pattern       |ill|control    |point     |cube    |30 |     |arcane      |game
Lightning Bolt         |evo|lightning  |bolt      |line    |100|     |arcane      |game
Protection from Energy |abj|ward       |touch     |single  |0  |     |arcane      |srd
Remove Curse           |abj|ward       |touch     |single  |0  |     |divine      |srd
Revivify               |nec|heal       |touch     |single  |0  |     |divine      |srd
Sleet Storm            |con|cold       |zone      |cylinder|40 |ice  |arcane      |srd
Slow                   |tra|debuff     |point     |cube    |40 |     |arcane      |srd
Stinking Cloud         |con|poison     |zone      |sphere  |20 |poisonCloud|arcane|game
Vampiric Touch         |nec|necrotic   |touch     |single  |0  |     |arcane      |srd
Banishment             |abj|control    |target    |single  |0  |     |arcane      |srd
Blight                 |nec|necrotic   |target    |single  |0  |     |primal      |srd
Confusion              |enc|control    |point     |sphere  |10 |     |arcane      |srd
Conjure Minor Elemental|con|summon     |summon    |single  |0  |     |arcane      |srd
Evard's Black Tentacles|con|bludgeoning|zone      |cube    |20 |     |arcane      |srd
Fire Shield            |evo|fire       |self      |aura    |0  |     |arcane      |srd
Greater Invisibility   |ill|shadow     |touch     |single  |0  |     |arcane      |srd
Ice Storm              |evo|cold       |point     |cylinder|20 |ice  |arcane      |srd
Phantasmal Killer      |ill|psychic    |target    |single  |0  |     |arcane      |srd
Polymorph              |tra|control    |target    |single  |0  |     |arcane      |srd
Stoneskin              |abj|ward       |touch     |single  |0  |     |arcane      |srd
Wall of Fire           |evo|fire       |wall      |wall    |60 |fire |arcane      |srd
Cloudkill              |con|poison     |zone      |sphere  |20 |poisonCloud|arcane|srd
Cone of Cold           |evo|cold       |self      |cone    |60 |     |arcane      |srd
Conjure Elemental      |con|summon     |summon    |single  |0  |     |arcane      |srd
Dominate Person        |enc|control    |target    |single  |0  |     |arcane      |srd
Hold Monster           |enc|control    |target    |single  |0  |     |arcane      |srd
Planar Binding         |abj|control    |target    |single  |0  |     |arcane      |srd
Seeming                |ill|utility    |point     |single  |0  |     |arcane      |srd
Telekinesis            |tra|force      |target    |single  |0  |     |arcane      |srd
Wall of Stone          |evo|bludgeoning|wall      |wall    |100|     |arcane      |srd
Chain Lightning        |evo|lightning  |bolt      |single  |0  |     |arcane      |srd
Circle of Death        |nec|necrotic   |point     |sphere  |60 |     |arcane      |srd
Disintegrate           |tra|force      |beam      |single  |0  |     |arcane      |srd
Eyebite                |nec|debuff     |target    |single  |0  |     |arcane      |srd
Flesh to Stone         |tra|control    |target    |single  |0  |     |arcane      |srd
Globe of Invulnerability|abj|ward      |self      |aura    |10 |     |arcane      |srd
Otiluke's Freezing Sphere|evo|cold     |projectile|sphere  |60 |ice  |arcane      |srd
Otto's Irresistible Dance|enc|control  |target    |single  |0  |     |arcane      |srd
Sunbeam                |evo|radiant    |beam      |line    |60 |     |primal      |srd
Wall of Ice            |evo|cold       |wall      |wall    |100|ice  |arcane      |srd
`;
export const slug = s => s.replace(/^Scroll of /, '').replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^./, c => c.toLowerCase());
export const SCHOOLS = { abj: 'Abjuration', con: 'Conjuration', div: 'Divination', enc: 'Enchantment', evo: 'Evocation', ill: 'Illusion', nec: 'Necromancy', tra: 'Transmutation' };

export const SPELLS = T.trim().split('\n').map(line => {
  const [name, school, element, delivery, shape, size, surface, list, src] = line.split('|').map(s => s.trim());
  return { id: slug(name), name, school: school || null, element, delivery, area: { shape, ft: Number(size) }, surface: surface || null, list: list || null, src };
});
const ALIAS_BACK = { fireBolt: 'firebolt', viciousMockery: 'mockery', createOrDestroyWater: 'createWater', searingSmite: 'searing', haste: 'hasteSelf' };
// src 'game' rows take the game's own radius (what the sim does) — imported lazily to keep this file pure data
import { GAME } from './game.js';
for (const s of SPELLS) if (s.src === 'game') {
  const a = GAME.actions.find(a => { const short = a.id.split('.')[1]; return short === s.id || ALIAS_BACK[s.id] === short; });
  if (a && (a.aoeRadius || a.surface?.radius)) s.area.hex = a.aoeRadius ?? a.surface.radius;
  if (a) s.action = a.id;
}
export const spell = idOrName => SPELLS.find(s => s.id === idOrName || s.name === idOrName || s.id === slug(idOrName));

/**
 * The game's own actions (lib/game.js), as looks. A spell action maps onto its catalogue row where the
 * names agree; a martial action (Cleave, Rage, Sneak Attack…) becomes a MANUAL look — scrolls.md Q4.
 * The game's radius, surface and vfx family win over the catalogue, because they are what the sim does.
 */
const VFX_DELIVERY = { projectile: 'projectile', beam: 'beam', bolt: 'bolt', chain: 'bolt', nova: 'self', aura: 'self', burst: 'point', rain: 'point', wave: 'self', cone: 'self', vortex: 'zone', sigil: 'target', melee: 'weapon' };
const VFX_SHAPE = { nova: 'aura', aura: 'aura', burst: 'sphere', rain: 'sphere', wave: 'cone', cone: 'cone', vortex: 'sphere' };
const ALIAS = { firebolt: 'fireBolt', mockery: 'viciousMockery', huntersMark: "huntersMark", hasteSelf: 'haste', createWater: 'createOrDestroyWater', scorching: 'scorchingRay', boom: 'fireBolt', searing: 'searingSmite', smite: 'divineFavour' };
export function actionLook(a) {
  const short = a.id.split('.')[1];
  const cat = SPELLS.find(s => s.id === (ALIAS[short] ?? short)) ?? null;
  const martial = a.kind !== 'spell' && a.spellLevel == null;
  const element = a.damage?.type ?? cat?.element ?? (a.heal ? 'heal' : a.applies ? 'buff' : a.surface ? 'control' : 'buff');
  const radiusHex = a.aoeRadius ?? a.surface?.radius ?? 0;
  return {
    id: a.id, name: a.name, cls: a.cls, martial, vfx: a.vfx, level: a.spellLevel ?? null,
    element, school: cat?.school ?? (martial ? null : 'evo'),
    delivery: a.chain ? 'bolt' : VFX_DELIVERY[a.vfx] ?? 'target',
    area: radiusHex ? { shape: a.vfx === 'wave' || a.vfx === 'cone' ? 'cone' : VFX_SHAPE[a.vfx] ?? 'sphere', hex: radiusHex } : { shape: 'single', hex: 0 },
    chain: a.chain ?? 0, surface: a.surface?.kind ?? null, catalogue: cat?.id ?? null, src: 'game',
  };
}
