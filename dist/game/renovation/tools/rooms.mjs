// Screenshots of dressed rooms and chests in every biome, through the dev floor viewer (frontend/dev/floor.html).
//   node docs/renovation/tools/rooms.mjs http://localhost:5190/game/ docs/renovation/shots/after
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const [base, out] = process.argv.slice(2);
const BIOMES = ['cisterns', 'ossuary', 'fungalReach', 'cinderworks', 'drownedVault', 'rimehollow', 'sableCourt', 'wyrmDeeps'];
const b = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (let i = 0; i < BIOMES.length; i++) {
  for (const [tag, qs] of [['room', 'room=2&across=12'], ['room', 'room=4&across=12'], ['chest', 'chest=0&across=8']]) {
    const p = await b.newPage({ viewport: { width: 390, height: 520 }, deviceScaleFactor: 2 });
    p.on('pageerror', (e) => errors.push(`${BIOMES[i]}: ${e}`));
    const depth = 3 + i * 20;
    await p.goto(`${base}dev/floor.html?depth=${depth}&${qs}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const info = await p.evaluate(() => window.__floor);
    const name = `${tag}-${i + 1}-${BIOMES[i]}-${qs.split('&')[0].replace('=', '')}.png`;
    await p.screenshot({ path: `${out}/${name}` });
    console.log(name, JSON.stringify(info));
    await p.close();
  }
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
