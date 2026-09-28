// Creatures in approach A. Humanoid archetypes reuse the character body with a synthetic race;
// the two that are not humanoid (a rat, an ooze) get their own small shape grammar. That split is
// the honest cost of this approach: every new *body plan* is code, every new *item* is data.
import { Sprite, Mask } from '../../lib/pixel.js';
import { shade } from '../../lib/color.js';
import { renderA, W, H } from './gen.js';

export function renderCreatureA(c, { frame = 0 } = {}) {
  if (c.form === 'quadruped') return rat(c, frame);
  if (c.form === 'ooze') return ooze(c, frame);
  const R = {
    id: c.id, h: c.h, w: c.w, skins: [c.skin], bald: true,
    ears: c.form === 'brute' ? 'small' : c.form === 'winged' ? 'long' : 'none',
    snout: c.form === 'lizard', tail: c.form === 'lizard' || c.form === 'winged',
    horns: c.form === 'winged' ? 'curl' : null, tusks: c.form === 'brute',
  };
  const eyes = { skeleton: '#e84a4a', winged: '#f0c040', lizard: '#f0c040' }[c.form];
  return renderA({ race: R, skin: c.skin, hair: '#2a2018', hairStyle: 0, primary: c.primary ?? '#4a3a2a', secondary: '#3a2a1e', loadout: c.loadout ?? {}, rarity: {}, form: c.form, eyes }, { frame, anim: 'idle' });
}

function rat(c, frame) {
  const sp = new Sprite(W, H), y = 62 - (frame % 2);
  const body = new Mask(W, H).ellipse(27, y - 4, 11, 5.5);
  const head = new Mask(W, H).poly([[34, y - 9], [45, y - 4], [34, y]]);
  const tail = new Mask(W, H).bar(16, y - 3, 8, y - 7, 1.5).bar(8, y - 7, 4, y - 4, 1);
  for (const lx of [19, 24, 30, 34]) sp.paint(new Mask(W, H).rect(lx, y, 2, 4 - ((lx + frame) % 2)), shade(c.skin, -0.1));
  sp.paint(tail, '#b88a80'); sp.paint(body, c.skin, { pattern: (x, yy) => ((x * 3 + yy) % 4 === 0 ? -1 : 0) }); sp.paint(head, c.skin);
  sp.paint(new Mask(W, H).ellipse(35, y - 9, 2, 2), '#b88a80');
  sp.dot(40, y - 5, '#e84a4a'); sp.dot(45, y - 4, '#1e1814');
  return sp.outline();
}

function ooze(c, frame) {
  const sp = new Sprite(W, H), wob = [0, 1, 0, -1][frame % 4];
  const m = new Mask(W, H).ellipse(28, 58 + wob * 0.5, 15 + wob, 9 - wob * 0.5).rect(13 - wob, 58, 31 + wob * 2, 8);
  sp.paint(m, c.skin, { light: 'top', pattern: (x, y) => ((x * 5 + y * 3) % 11 === 0 ? 2 : 0) });
  sp.paint(new Mask(W, H).ellipse(22, 55, 2.5, 2.5), shade(c.skin, 0.25));
  sp.paint(new Mask(W, H).ellipse(33, 60, 1.8, 1.8), shade(c.skin, -0.2)); // a swallowed bone
  return sp.outline();
}
