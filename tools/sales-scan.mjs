// DREAMR — B02/B03: értékesítési szabályok és „nem tartozék” megjegyzések felderítése a bolti oldalakról.
// Futtatás:  node tools/sales-scan.mjs   →  reports/sales-scan.json és reports/sales-scan.md
// A talált mondatok KÉZI ellenőrzésre szolgálnak; a véglegesített adat a sales-data.js-be kerül.
import { mkdir, writeFile } from 'node:fs/promises';
import { readCatalog, uniqueByUrl } from './catalog.mjs';
import { fetchWithRetry, evaluate, STATUS } from './store-pages.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = html => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
// Kiszerelési és tartozék-szabályok jellegzetes mondatai (IKEA / JYSK magyar oldalak)
const NOTE = /[^.!?]{0,140}(nem tartozék|nem része|külön (?:kell|vásárol|kapható|rendel)|külön megvásárol|nélkül (?:kapható|szállít)|fényforrás|izzó|matrac|ágyrács|fogantyú|gombok?\b|lábak?\b|ajtó(?:k)? nélkül|front|beépíthető|töltet|párnabelső|belső párna)[^.!?]{0,160}/gi;

export function deliveryMultiple(html) {
  const m = html.match(/Házhozszállítás kiválasztásakor ezt a terméket\s*(\d+)\s*többszörösében/i);
  return m ? +m[1] : null;
}

const catalog = uniqueByUrl(await readCatalog());
const rows = [];
for (const [url, it] of catalog) {
  const page = await fetchWithRetry(url);
  const r = evaluate(it.store, url, page);
  const row = { name: it.name, store: it.store, url, status: r.status, pageName: r.pageName, price: r.price, deliveryMultiple: null, notes: [] };
  if (r.status === STATUS.OK) {
    row.deliveryMultiple = deliveryMultiple(page.html);
    const seen = new Set();
    for (const m of text(page.html).matchAll(NOTE)) {
      const s = m[0].trim();
      if (s.length > 20 && !seen.has(s) && seen.size < 8) seen.add(s);
    }
    row.notes = [...seen];
  }
  rows.push(row);
  console.log(`${r.status.padEnd(10)} ${it.name}${row.deliveryMultiple ? `  [házhoz: ${row.deliveryMultiple} többszöröse]` : ''}  (${row.notes.length} megjegyzés)`);
  await sleep(500);
}
await mkdir('reports', { recursive: true });
await writeFile('reports/sales-scan.json', JSON.stringify({ checkedAt: new Date().toISOString(), rows }, null, 1) + '\n');
let md = `# Értékesítési szabályok és tartozékok — felderítés\n\nEllenőrizve: ${new Date().toISOString()}\n\n`;
for (const r of rows) {
  if (!r.deliveryMultiple && !r.notes.length) continue;
  md += `## ${r.name} (${r.store})\n${r.pageName ? `Bolti név: ${r.pageName}  \n` : ''}${r.deliveryMultiple ? `**Házhozszállításnál ${r.deliveryMultiple} többszörösében rendelhető.**  \n` : ''}${r.notes.map(n => `- ${n}`).join('\n')}\n\n`;
}
await writeFile('reports/sales-scan.md', md);
