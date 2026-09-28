// 5×5 pixel marks, one per element — the pixel twin of each damage type's glyph in
// data/damageTypes.ts (and of the non-damage looks in lib/palette.js). visual-language Q3: hue is
// never enough on its own, so wherever a small pixel icon carries an element, it carries this mark too.
// Vector approaches use the real glyph character instead.
const B = s => s.trim().split('\n').map(r => r.trim());
export const MARKS = {
  fire:        B(`..#..\n.##..\n.###.\n#####\n.###.`),
  cold:        B(`#.#.#\n.###.\n#####\n.###.\n#.#.#`),
  lightning:   B(`...##\n..##.\n.####\n.##..\n##...`),
  acid:        B(`..#..\n.###.\n##.##\n#####\n.###.`),
  poison:      B(`.###.\n#.#.#\n#####\n.#.#.\n.###.`),
  thunder:     B(`##.##\n.....\n#####\n.....\n##.##`),
  force:       B(`..#..\n.#.#.\n#...#\n.#.#.\n..#..`),
  necrotic:    B(`.###.\n##...\n#....\n##...\n.###.`),
  radiant:     B(`#.#.#\n.###.\n##.##\n.###.\n#.#.#`),
  psychic:     B(`.###.\n###.#\n###.#\n###.#\n.###.`),
  bludgeoning: B(`.....\n#####\n#####\n.....\n.....`),
  piercing:    B(`..#..\n..#..\n.###.\n.###.\n#####`),
  slashing:    B(`....#\n...#.\n..#..\n.#...\n#....`),
  heal:        B(`.###.\n.###.\n#####\n.###.\n.###.`).map(r => r.replace(/^\.###\.$/, '..#..')),
  buff:        B(`..#..\n.###.\n#####\n..#..\n..#..`),
  ward:        B(`.###.\n#...#\n#...#\n#...#\n.###.`),
  debuff:      B(`..#..\n..#..\n#####\n.###.\n..#..`),
  control:     B(`.#.#.\n#.#.#\n#.#.#\n#.#.#\n.#.#.`),
  summon:      B(`.###.\n#...#\n#.#.#\n#...#\n.###.`),
  light:       B(`..#..\n..#..\n##.##\n..#..\n..#..`),
  shadow:      B(`.###.\n#####\n#####\n#####\n.###.`),
  move:        B(`..###\n...##\n..#.#\n.#...\n#....`),
  utility:     B(`.....\n.....\n..#..\n.....\n.....`),
};
