// Builds docs/renovation/index.html from _head.html + _body.html, filling {{…}} from the measure JSONs
// (shots/before/measure.json, shots/after/measure.json) and status.json. Anything missing reads "not yet".
//   node docs/renovation/tools/build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const dir = new URL('../', import.meta.url);
const read = (p) => (existsSync(new URL(p, dir)) ? JSON.parse(readFileSync(new URL(p, dir), 'utf8')) : {});
const data = { before: read('shots/before/measure.json'), after: read('shots/after/measure.json') };
const status = read('status.json');
for (const d of [data.before, data.after]) if (d.corridors) d.corridors.pct = `${(d.corridors.fraction * 100).toFixed(1)}%`;
const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
const fill = (body, prefix) => {
  let html = readFileSync(new URL('_head.html', dir), 'utf8') + readFileSync(new URL(body, dir), 'utf8');
  html = html.replace(new RegExp(`\\{\\{${prefix}(\\d+)(t?)\\}\\}`, 'g'), (_, n, t) => {
    const s = status[`${prefix === 's' ? '' : prefix.slice(1)}${n}`] ?? 'planned';
    return t ? s : s === 'done' ? 'done' : s === 'in progress' ? 'live' : '';
  });
  return html.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, p) => { const v = get(p); return v === undefined ? 'not yet' : String(v); });
};
writeFileSync(new URL('index.html', dir), fill('_body.html', 's'));
writeFileSync(new URL('part-two.html', dir), fill('_body2.html', 'sb').replace('<title>The Renovation</title>', '<title>Light and Stone</title>'));
console.log('built index.html and part-two.html');
