// Regenerate every picture on the proposals page and measure what the page claims.
//   node docs/item-proposals/tools/capture.mjs            (all)
//   node docs/item-proposals/tools/capture.mjs O1-        (names containing a filter)
// Writes shots/*.png and shots/metrics.json. Exits non-zero on any page error.
// (tools/baseline.mjs and tools/audit.mjs write their own files; run them first.)
import { createRequire } from 'node:module';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const OUT = fileURLToPath(new URL('../shots/', import.meta.url));
const filter = process.argv[2] ?? '';
const P = '/item-proposals/shots.html?shot=';
const BIOMES = ['cisterns', 'ossuary', 'fungalReach', 'cinderworks', 'drownedVault', 'rimehollow', 'sableCourt', 'wyrmDeeps'];
const SHOTS = [
  ...['O1', 'O2', 'O3', 'O4', 'O5'].flatMap(a => ['sample', 'items', 'potions', 'elixirs', 'scrolls', 'reagents', 'spells', 'rarity'].map(s => ({ name: `${a}-${s}`, url: `${P}${a}-${s}&k=${s === 'sample' ? 3 : 2}${s === 'spells' ? '&nocap=1' : ''}`, vw: 1200 }))),
  ...['O1', 'O2'].map(a => ({ name: `${a}-catalogue`, url: `${P}${a}-catalogue&k=1&nocap=1`, vw: 1200 })),
  { name: 'O1-sample-x1', url: `${P}O1-sample&k=1`, vw: 1200 },
  { name: 'O4-turn', url: `${P}turn-x&k=2`, vw: 1200 },
  ...['S1', 'S2', 'S3'].map(a => ({ name: `${a}-matrix`, url: `${P}${a}-matrix&k=1`, vw: 1200 })),
  ...['S4', 'S5', 'S1g', 'S2g'].map(a => ({ name: `${a}-matrix`, url: `${P}${a}-matrix&px=2`, vw: 1200 })),
  { name: 'hex-atlas', url: `${P}hex-atlas`, vw: 1200 },
  ...BIOMES.map(b => ({ name: `map2d-${b}`, url: `${P}map2d-${b}&k=2&w=330&h=220`, vw: 800 })),
  { name: 'map2d-S3-cinderworks', url: `${P}map2d-cinderworks&k=2&fx=S3`, vw: 800 }, { name: 'map2d-S3-rimehollow', url: `${P}map2d-rimehollow&k=2&fx=S3`, vw: 800 },
  { name: 'map2d-seq', url: `${P}map2d-cinderworks&k=2&t=0.42`, vw: 800 },
  ...[0.12, 0.6, 0.92].map(t => ({ name: `map2d-seq-${t}`, url: `${P}map2d-cinderworks&k=2&t=${t}`, vw: 800 })),
  { name: 'map2d-phone', url: `${P}map2d-drownedVault&k=2&w=195&h=330`, vw: 500 },
  ...[['cinderworks', 'S1S2'], ['rimehollow', 'S4'], ['fungalReach', 'S5'], ['ossuary', 'S1S2'], ['sableCourt', 'S2'], ['wyrmDeeps', 'S4']].map(([b, a]) => ({ name: `map3d-${b}-${a}`, url: `${P}map3d-${b}:${a}&w=660&h=460&px=2`, vw: 800 })),
  { name: 'loot-ossuary', url: `${P}loot-ossuary`, vw: 1000 },
  { name: 'loot-cisterns', url: `${P}loot-cisterns`, vw: 1000 },
];
// generation-cost runs: every object through every approach, no captions, screenshot not needed
const TIMING = ['O1', 'O2', 'O3', 'O4', 'O5'].map(a => ({ name: `timing-${a}`, url: `${P}${a}-all&k=1&nocap=1`, vw: 1200 }));

const server = await serve(0), port = server.address().port;
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
let metrics = {}; try { metrics = JSON.parse(await readFile(OUT + 'metrics.json', 'utf8')); } catch {}
async function open(url, vw) {
  const page = await browser.newPage({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(`${url}: ${e}`));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push(`${url}: ${m.text()}`); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${url}: ${r.status()} ${r.url()}`); });
  await page.goto(`http://localhost:${port}${url}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
  await page.waitForTimeout(200);
  return page;
}
for (const s of [...SHOTS, ...TIMING]) {
  if (filter && !s.name.includes(filter)) continue;
  const t0 = Date.now(); const page = await open(s.url, s.vw);
  if (!s.name.startsWith('timing-')) await (await page.$(/^map[23]d-/.test(s.name) ? '.tile canvas' : '#stage')).screenshot({ path: `${OUT}${s.name}.png`, omitBackground: true });  // scenes: the picture alone
  const m = await page.evaluate(() => window.__metrics ?? null); if (m) metrics[s.name] = m;
  await page.close(); console.log('shot', s.name, `${Date.now() - t0} ms`, m ? JSON.stringify(m).slice(0, 140) : '');
}
metrics.capturedAt = new Date().toISOString();
await writeFile(OUT + 'metrics.json', JSON.stringify(metrics, null, 2));
await browser.close(); server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('done');
