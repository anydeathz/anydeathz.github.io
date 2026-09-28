// A one-room hex map (the same shape lib/hex.js dungeons have), for the cast matrices: small enough to
// render a hundred frames, real enough to have walls, torches and a floor from floorAt.
import { key, dist, FLOOR, WALL } from '../../character-proposals/lib/hex.js';
export function arena(R = 4, shape = 'disc') {
  const cells = new Map();
  for (let q = -R - 3; q <= R + 3; q++) for (let r = -R - 3; r <= R + 3; r++) {
    const inside = shape === 'wide' ? Math.abs(r) <= R - 1 && Math.abs(q + r / 2) <= R + 2.2 : dist([q, r], [0, 0]) <= R;
    cells.set(key(q, r), { q, r, t: inside ? FLOOR : WALL });
  }
  return { cells, rooms: [{ c: [0, 0], rad: R }], entry: [0, 0], stairs: [0, 0], seed: 'arena' };
}
/** The looks every cast approach renders — one per delivery × shape the catalogue actually uses. */
export const MATRIX = [
  ['Fire Bolt', 'projectile · single'], ['Ray of Frost', 'beam · single'], ['Chain Lightning', 'bolt · chain', { chain: true }],
  ['Fireball', 'projectile → sphere · leaves fire'], ['Cone of Cold', 'cone 60° (hex) · 30 ft shown', { ft: 30 }], ['Cone of Cold', 'cone 53° (5e) · 30 ft shown', { halfDeg: 26.57, ft: 30 }],
  ['Lightning Bolt', 'line · 1 wide · 40 ft shown', { ft: 40 }], ['Sunbeam', 'line · 2 wide · 40 ft shown', { width: 2, ft: 40 }], ['Thunderwave', 'cube → hex lozenge'],
  ['Moonbeam', 'cylinder · zone'], ['Spirit Guardians', 'aura · follows caster'], ['Wall of Fire', 'wall'],
  ['Cloudkill', 'zone · poison cloud'], ['Grease', 'cube · grease surface'], ['Mass Healing Word', 'heal · sphere'],
  ['Hex', 'target · sigil'], ['Shocking Grasp', 'touch'], ['Spiritual Weapon', 'summon'],
];
