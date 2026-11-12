// DREAMR — A01: a bolti linkek állapotfelmérése.
// Futtatás:  node tools/link-audit.mjs
// Eredmény:  reports/link-audit.json (gépi) és reports/link-audit.md (olvasható táblázat)
import { mkdir, writeFile } from 'node:fs/promises';
import { readCatalog, uniqueByUrl } from './catalog.mjs';
import { fetchPage, evaluate, expectedId, STATUS } from './store-pages.mjs';

const LABEL = {
  [STATUS.OK]: 'Rendben', [STATUS.REDIRECT]: 'Átirányítás másik termékre', [STATUS.GONE]: 'Megszűnt',
  [STATUS.BLOCKED]: 'Robotszűrő (403)', [STATUS.MISMATCH]: 'Nem a várt termék', [STATUS.PARSE]: 'Feldolgozási hiba',
  [STATUS.HTTP]: 'HTTP hiba', [STATUS.NETWORK]: 'Hálózati hiba'
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const catalog = uniqueByUrl(await readCatalog());
console.log(`Linkek: ${catalog.size}`);
const rows = [];
for (const [url, it] of catalog) {
  const page = await fetchPage(url);
  const r = evaluate(it.store, url, page);
  rows.push({
    keys: it.keys, name: it.name, store: it.store, url, codePrice: it.price,
    status: r.status, httpStatus: r.httpStatus, finalUrl: r.finalUrl,
    chain: r.chain.map(c => `${c.status} ${c.url}`), expectedId: expectedId(it.store, url),
    sku: r.sku, pageName: r.pageName, livePrice: r.price ?? null, listPrice: r.listPrice ?? null,
    saleUntil: r.saleUntil || null, availability: r.availability || null, identityConfirmed: !!r.identityConfirmed, reason: r.reason
  });
  console.log(`${r.status.padEnd(18)} ${it.store.padEnd(8)} ${it.name}${r.reason ? '  — ' + r.reason : ''}`);
  await sleep(600); // kíméletes tempó a boltok szervereivel
}

const when = new Date().toISOString();
const count = {}; rows.forEach(r => { count[r.status] = (count[r.status] || 0) + 1; });
const byStore = {}; rows.forEach(r => { (byStore[r.store] ||= {})[r.status] = (byStore[r.store][r.status] || 0) + 1; });
await mkdir('reports', { recursive: true });
await writeFile('reports/link-audit.json', JSON.stringify({ checkedAt: when, total: rows.length, count, byStore, rows }, null, 1) + '\n');

const esc = s => String(s ?? '').replace(/\|/g, '\\|');
const fmt = n => n == null ? '—' : n.toLocaleString('hu-HU') + ' Ft';
let md = `# Bolti linkek állapotfelmérése (A01)\n\nEllenőrizve: ${when}  \nÖsszesen: **${rows.length}** link\n\n## Összesítés\n\n| Állapot | Darab |\n|---|---|\n`;
for (const [s, n] of Object.entries(count).sort((a, b) => b[1] - a[1])) md += `| ${LABEL[s] || s} | ${n} |\n`;
md += `\n## Boltonként\n\n| Bolt | ${Object.keys(LABEL).map(s => LABEL[s]).join(' | ')} |\n|---|${Object.keys(LABEL).map(() => '---').join('|')}|\n`;
for (const [store, c] of Object.entries(byStore)) md += `| ${store} | ${Object.keys(LABEL).map(s => c[s] || 0).join(' | ')} |\n`;
md += `\n## Teendőt igénylő linkek\n\n| Termék | Bolt | Állapot | Végső URL | Cikkszám | Ok |\n|---|---|---|---|---|---|\n`;
for (const r of rows.filter(r => r.status !== STATUS.OK)) md += `| ${esc(r.name)} | ${r.store} | ${LABEL[r.status]} | ${esc(r.finalUrl)} | ${esc(r.sku)} | ${esc(r.reason)} |\n`;
md += `\n## Minden link\n\n| Termék | Bolt | Állapot | HTTP | Cikkszám (várt / talált) | Kódbeli ár | Élő ár | Akció | Készlet |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of rows) md += `| ${esc(r.name)} | ${r.store} | ${LABEL[r.status]} | ${r.httpStatus || '—'} | ${r.expectedId || '—'} / ${esc(r.sku) || '—'} | ${fmt(r.codePrice)} | ${fmt(r.livePrice)} | ${r.listPrice ? `${fmt(r.listPrice)} helyett, ${r.saleUntil || '?'}-ig` : '—'} | ${r.availability || '—'} |\n`;
await writeFile('reports/link-audit.md', md);
console.log('\nÖsszesítés:', count);
