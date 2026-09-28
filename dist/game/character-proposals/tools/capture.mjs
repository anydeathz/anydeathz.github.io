// Regenerate every picture on the proposals page and measure what the page claims.
//   node docs/character-proposals/tools/capture.mjs          (all)
//   node docs/character-proposals/tools/capture.mjs A-races  (names containing a filter)
// Writes shots/*.png and shots/metrics.json. Exits non-zero on any page error.
import { createRequire } from 'node:module';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const OUT = fileURLToPath(new URL('../shots/', import.meta.url));
const filter = process.argv[2] ?? '';

const BIOMES = ['cisterns', 'ossuary', 'fungalReach', 'cinderworks', 'drownedVault', 'rimehollow', 'sableCourt', 'wyrmDeeps'];
const g3 = (k, m, extra = '') => `/approaches/gallery3d.html?k=${k}&m=${m}&still=1${extra}`;
const SHOTS = [
  ...['A-races', 'A-classes', 'A-progression', 'A-rarity', 'A-creatures', 'A-anim', 'A-items', 'A-scales', 'A-random', 'D-turn', 'D-classes', 'D-progression', 'D-creatures', 'surfaces']
    .map(n => ({ name: n, url: `/shots.html?shot=${n}`, el: '#stage', vw: 1200 })),
  ...[['classes', 1200, 250], ['races', 1150, 250], ['progression', 1000, 270], ['rarity', 680, 270]].flatMap(([m, w, h]) => ['B', 'C'].map(k => ({ name: `${k}-${m}`, url: g3(k, m, `&w=${w}&h=${h}&px=${k === 'C' ? 3 : 2}`), el: 'canvas', vw: w }))),
  { name: 'B-creatures', url: g3('B', 'creatures', '&w=880&h=300&px=2&span=1.45'), el: 'canvas', vw: 880 },
  { name: 'B-close', url: g3('B', 'one', `&w=360&h=420&px=1&span=2.4&s=${encodeURIComponent(JSON.stringify({ race: 'dwarf', cls: 'paladin', rarity: { mainHand: 'legendary' } }))}`), el: 'canvas', vw: 360 },
  { name: 'C-close', url: g3('C', 'one', `&w=360&h=420&px=3&span=2.4&s=${encodeURIComponent(JSON.stringify({ race: 'dwarf', cls: 'paladin', rarity: { mainHand: 'legendary' } }))}`), el: 'canvas', vw: 360 },
  { name: 'C-close-px1', url: g3('C', 'one', `&w=360&h=420&px=1&span=2.4&s=${encodeURIComponent(JSON.stringify({ race: 'dwarf', cls: 'paladin', rarity: { mainHand: 'legendary' } }))}`), el: 'canvas', vw: 360 },
  { name: 'E-atlas-C', url: '/approaches/E-bake/demo.html?k=C&c=paladin&r=dwarf', el: 'canvas', vw: 700 },
  { name: 'E-atlas-B', url: '/approaches/E-bake/demo.html?k=B&c=wizard&r=elf', el: 'canvas', vw: 700 },
  ...BIOMES.map(b => ({ name: `M3-${b}`, url: `/map/demo2d.html?b=${b}&w=330&h=220&k=2`, el: 'canvas', vw: 700 })),
  { name: 'M3-phone', url: '/map/demo2d.html?b=cisterns&w=195&h=330&k=2', el: 'canvas', vw: 420 },
  ...[['textured', 'A', 'cisterns'], ['textured', 'C', 'rimehollow'], ['textured', 'E', 'ossuary'], ['textured', 'D', 'fungalReach'], ['voxel', 'B', 'cinderworks'], ['voxel', 'B', 'drownedVault'], ['textured', 'A', 'sableCourt'], ['textured', 'A', 'wyrmDeeps']]
    .map(([s, c, b]) => ({ name: `M3D-${s}-${c}-${b}`, url: `/map/demo3d.html?b=${b}&s=${s}&c=${c}&still=1&w=660&h=460&px=2`, el: 'canvas', vw: 660 })),
];

const server = await serve(0), port = server.address().port;
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
let metrics = {}; try { metrics = JSON.parse(await readFile(OUT + 'metrics.json', 'utf8')); } catch {}
async function open(url, vw, throttle = 1) {
  const page = await browser.newPage({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(`${url}: ${e}`));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${url}: ${r.status()} ${r.url()}`); });
  if (throttle > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle }); }
  await page.goto(`http://localhost:${port}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  return page;
}
for (const s of SHOTS) {
  if (filter && !s.name.includes(filter)) continue;
  const page = await open(s.url, s.vw);
  const el = await page.$(s.el);
  await el.screenshot({ path: `${OUT}${s.name}.png`, omitBackground: true });
  const m = await page.evaluate(() => window.__metrics ?? null);
  if (m) metrics[s.name] = m;
  await page.close();
  console.log('shot', s.name);
}
if (!filter || filter === 'metrics') {
  // generation cost, 2D approaches
  let page = await open('/shots.html?shot=none&time=1', 800); metrics.timing2d = await page.evaluate(() => window.__metrics); await page.close();
  // frame rate on the 3D map with each kind of character, at 1× and 4× CPU throttle (a phone proxy)
  metrics.fps = {};
  for (const [s, c] of [['textured', 'A'], ['textured', 'C'], ['textured', 'E'], ['textured', 'D'], ['voxel', 'B']]) for (const thr of [1, 4]) for (const px of [3, 1]) {
    page = await open(`/map/demo3d.html?b=cisterns&s=${s}&c=${c}&fps=1&w=390&h=600&px=${px}`, 400, thr);
    await page.waitForFunction(() => window.__fps, null, { timeout: 30000 });
    const r = await page.evaluate(() => ({ fps: window.__fps, ...window.__metrics }));
    metrics.fps[`${s}-${c}-cpu${thr}-px${px}`] = r; await page.close(); console.log('frame', s, c, thr, JSON.stringify(r.fps));
  }
  metrics.capturedAt = new Date().toISOString();
}
await writeFile(OUT + 'metrics.json', JSON.stringify(metrics, null, 2));
await browser.close(); server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('done');
