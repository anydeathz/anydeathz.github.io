// One descent screenshot per biome, from the running dev server (uses the dev-only ?depth=N).
//   node docs/renovation/tools/biomes.mjs http://localhost:5190/game/ docs/renovation/shots/after [wait ms]
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const [base, out, wait = '6000'] = process.argv.slice(2);
const BIOMES = ['cisterns', 'ossuary', 'fungalReach', 'cinderworks', 'drownedVault', 'rimehollow', 'sableCourt', 'wyrmDeeps'];
const b = await chromium.launch({ channel: 'chrome' });
const errors = [];
for (let i = 0; i < BIOMES.length; i++) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => errors.push(`${BIOMES[i]}: ${e}`));
  await p.goto(`${base}?depth=${1 + i * 20}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  await p.getByText('Quick start').first().click();
  await p.waitForTimeout(Number(wait));
  await p.screenshot({ path: `${out}/biome-${i + 1}-${BIOMES[i]}.png`, clip: { x: 0, y: 0, width: 390, height: 470 } });
  await p.close();
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
