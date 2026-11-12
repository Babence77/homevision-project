// DREAMR — napi automatikus árfrissítő
// A GitHub Actions futtatja naponta (lásd .github/workflows/update-prices.yml).
//
// Elvek (1. szakasz, A02–A03–A06):
//  - Árat csak az azonosított termék és változat forint-ajánlatából fogadunk el (tools/store-pages.mjs).
//  - Sikertelen lekérésnél megtartjuk a legutolsó jó árat és annak idejét; rögzítjük az utolsó
//    próbálkozást és a hiba okát. Soha nem állunk vissza csendben a kódba írt alapárra.
//  - Időkorlát és újrapróbálás; boltonkénti jelentés; ha egy bolt hibaaránya átlépi a küszöböt,
//    a futás hibával (2-es kóddal) zárul — de a jó katalógus ekkor is kiíródik, nem vész el.
//
// Futtatás:  node update-prices.mjs
//   DREAMR_PRICES_OUT=másik.json  — máshová írja az eredményt (teszteléshez)
//   DREAMR_PRICES_IN=előző.json   — máshonnan olvassa az előző állapotot (teszteléshez)
//   DREAMR_FAIL_STORE=ikea        — szándékosan elrontja az adott bolt forrását (A06 próba)
//   DREAMR_ONLY_STORE=jysk        — csak egy boltot frissít (gyors próba)

import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { readCatalog, uniqueByUrl, packSize } from './tools/catalog.mjs';
import { fetchWithRetry, evaluate, STATUS } from './tools/store-pages.mjs';

const OUT = process.env.DREAMR_PRICES_OUT || 'prices.json';
const IN = process.env.DREAMR_PRICES_IN || 'prices.json';
const FAIL_STORE = process.env.DREAMR_FAIL_STORE || '';
const ONLY_STORE = process.env.DREAMR_ONLY_STORE || '';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const config = JSON.parse(await readFile(new URL('./tools/price-sources.json', import.meta.url), 'utf8')).stores;

// --- 1) Előző állapot betöltése (v1: csak számok, v2: tételenkénti adatok) ---
async function loadPrevious() {
  try {
    const prev = JSON.parse(await readFile(IN, 'utf8'));
    if (prev.version === 2 && prev.items) return prev.items;
    // v1 formátum: minden tárolt ár az akkori futás sikeres eredménye volt
    const at = prev.updated || (prev.date ? prev.date + 'T00:00:00.000Z' : null);
    return Object.fromEntries(Object.entries(prev.prices || {}).map(([url, price]) =>
      [url, { price, checkedAt: at, lastAttempt: at, status: STATUS.OK, error: null }]));
  } catch { return {}; }
}
const previous = await loadPrevious();
const catalog = uniqueByUrl(await readCatalog());
const startedAt = new Date().toISOString();
console.log(`Termékek: ${catalog.size}${FAIL_STORE ? `  (PRÓBA: a(z) ${FAIL_STORE} forrása szándékosan elrontva)` : ''}`);

// --- 2) Végigmegyünk minden terméken ---
const items = {}; const stats = {};
for (const [url, it] of catalog) {
  const st = (stats[it.store] ||= { total: 0, ok: 0, failed: 0, statuses: {}, changed: 0 });
  const prev = previous[url] || null;
  if (ONLY_STORE && it.store !== ONLY_STORE) { if (prev) items[url] = prev; continue; }
  st.total++;
  const now = new Date();
  const page = it.store === FAIL_STORE
    ? { status: 0, finalUrl: url, chain: [], html: '', error: 'szándékosan elrontott forrás (DREAMR_FAIL_STORE)', attempts: 1 }
    : await fetchWithRetry(url);
  const r = evaluate(it.store, url, page, now);
  st.statuses[r.status] = (st.statuses[r.status] || 0) + 1;
  const n = packSize(it.name);

  if (r.status === STATUS.OK) {
    const price = r.price * n;
    items[url] = {
      price, listPrice: r.listPrice ? r.listPrice * n : null, saleUntil: r.saleUntil || null,
      sku: r.sku, availability: r.availability || null,
      checkedAt: now.toISOString(), lastAttempt: now.toISOString(), status: STATUS.OK, error: null
    };
    st.ok++;
    const before = prev && prev.price;
    if (before !== price) { st.changed++; console.log(`VÁLTOZÁS  ${it.name}: ${before ?? '—'} -> ${price}`); }
  } else {
    // A03: az utolsó jó ár és annak ideje megmarad; csak a próbálkozás és a hiba frissül.
    items[url] = {
      price: prev?.price ?? null, listPrice: prev?.listPrice ?? null, saleUntil: prev?.saleUntil ?? null,
      sku: prev?.sku ?? r.sku ?? null, availability: prev?.availability ?? null,
      checkedAt: prev?.checkedAt ?? null, lastAttempt: now.toISOString(),
      status: r.status, error: r.reason || r.status, finalUrl: r.finalUrl !== url ? r.finalUrl : undefined
    };
    st.failed++;
    console.log(`HIBA      ${r.status.padEnd(18)} ${it.name} — ${r.reason}${page.attempts > 1 ? ` (${page.attempts} próbálkozás)` : ''}`);
  }
  await sleep(400); // kíméletes tempó a boltok szervereivel
}

// --- 3) Hibaküszöb boltonként (A06) ---
const problems = [];
for (const [store, st] of Object.entries(stats)) {
  if (!st.total) continue;
  const cfg = config[store] || { failThreshold: 0.2 };
  st.failRate = st.failed / st.total;
  st.expectBlocked = !!cfg.expectBlocked;
  if (cfg.expectBlocked) continue; // ismert robotszűrő: jelentjük, de nem bukik el miatta a futás
  if (st.ok === 0) problems.push(`${store}: teljes kiesés — ${st.total}/${st.total} sikertelen`);
  else if (st.failRate > cfg.failThreshold) problems.push(`${store}: ${st.failed}/${st.total} sikertelen (${Math.round(st.failRate * 100)}% > ${Math.round(cfg.failThreshold * 100)}%)`);
}

// --- 4) Kiírás: a jó katalógus akkor is kiíródik, ha a futás hibás ---
const finishedAt = new Date().toISOString();
const sorted = Object.fromEntries(Object.entries(items).sort((a, b) => a[0].localeCompare(b[0])));
const out = {
  version: 2,
  date: finishedAt.slice(0, 10),
  updated: finishedAt,
  run: { startedAt, finishedAt, healthy: problems.length === 0, problems, stores: stats },
  // Visszafelé kompatibilis nézet: URL → utolsó jó ár (csak ahol volt valaha sikeres ár)
  prices: Object.fromEntries(Object.entries(sorted).filter(([, v]) => v.price != null).map(([u, v]) => [u, v.price])),
  items: sorted
};
await writeFile(OUT, JSON.stringify(out, null, 1) + '\n');

// --- 5) Boltonkénti jelentés (konzol + GitHub Actions összefoglaló) ---
const LABEL = { ok: 'rendben', gone: 'megszűnt', blocked: 'robotszűrő', identity_mismatch: 'nem a várt termék', parse_error: 'feldolgozási hiba', redirect: 'átirányítás', http_error: 'HTTP hiba', network_error: 'hálózati hiba' };
let md = `## DREAMR árfrissítés — ${problems.length ? '❌ HIBA' : '✅ rendben'}\n\n| Bolt | Összes | Rendben | Sikertelen | Változott ár | Részletek |\n|---|---|---|---|---|---|\n`;
for (const [store, st] of Object.entries(stats)) {
  if (!st.total) continue;
  const detail = Object.entries(st.statuses).filter(([s]) => s !== 'ok').map(([s, c]) => `${LABEL[s] || s}: ${c}`).join(', ') || '—';
  md += `| ${store}${st.expectBlocked ? ' (ismert robotszűrő)' : ''} | ${st.total} | ${st.ok} | ${st.failed} | ${st.changed} | ${detail} |\n`;
}
if (problems.length) md += `\n**Küszöb feletti hiba:**\n${problems.map(p => `- ${p}`).join('\n')}\n\nA legutolsó jó árak megmaradtak a prices.json-ban.\n`;
console.log('\n' + md);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md);

if (problems.length) { console.error('A futás hibával zárul: ' + problems.join('; ')); process.exit(2); }
