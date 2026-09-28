// Screenshot one page of the proposals. Fails loudly on any page error.
//   node tools/shot.mjs <path-under-proposals> <out.png> [width] [fullPage=1]
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';
const require = createRequire(new URL('../../../frontend/package.json', import.meta.url));
const { chromium } = require('playwright');
const [path = '/', out = '/tmp/shot.png', width = '1280', full = '1'] = process.argv.slice(2);
const server = await serve(0);
const port = server.address().port;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e.stack ?? e)));
page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push(m.text()); if (m.type() === 'log') console.log('[page]', m.text()); });
await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ready !== false, null, { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close(); server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('ok', out);
