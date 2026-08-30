// HomeVision AI — automatikus árfrissítő
// A GitHub Actions futtatja naponta (lásd .github/workflows/update-prices.yml).
// Működés: kiolvassa az app.js összes termékét → letölti a boltok termékoldalait →
// kinyeri az élő árat a strukturált adatokból → prices.json-ba írja.
// Az app (app.js) induláskor betölti a prices.json-t és felülírja az árakat.

import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- 1) Termékek kiolvasása az app.js-ből (a P_(...) sorok) ---
const src = await readFile('app.js', 'utf8');
const re = /P_\(\s*'[^']*'\s*,\s*(?:"([^"]+)"|'([^']+)')\s*,\s*(?:"([^"]+)"|'([^']+)')\s*,\s*(\d+)\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;
const items = new Map(); // url -> {name, store, old}
for (const m of src.matchAll(re)) {
  const name = m[1] ?? m[2], store = m[3] ?? m[4], old = +m[5], url = m[6] ?? m[7];
  if (!items.has(url)) items.set(url, { name, store, old });
}
console.log(`Termékek: ${items.size}`);

async function getHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return await res.text();
}

// --- 2) Ár-kinyerés boltonként (a bevált minták) ---
function priceIkea(html) {
  // a JSON-LD-ben többször szerepel az ár — a leggyakoribb érték a megbízható
  const c = [...html.matchAll(/"price"\s*:\s*"?(\d{3,9})(?:\.\d+)?"?/g)]
    .map(m => +m[1]).filter(p => p >= 500);
  if (!c.length) return 0;
  const freq = {}; c.forEach(p => freq[p] = (freq[p] || 0) + 1);
  return +Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}
function priceJysk(html, url) {
  // a kanonikus termék-URL-hez tartozó offer ára kell (nem valamelyik variánsé)
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  const path = ((canon ? canon[1] : url).replace('https://jysk.hu', '')).replace(/\/$/, '');
  if (!path || path.split('/').length < 3) return 0; // kategóriaoldal: nem termék
  for (const m of html.matchAll(/"url":"(https:[^"]*?)"[^}]*?"price":"?(\d+)/g)) {
    const u = m[1].replace(/\\\//g, '/').replace('jysk.hu//', 'jysk.hu/').replace(/\/$/, '');
    if (u.endsWith(path)) return +m[2];
  }
  return 0;
}
function priceXxxl(html) { // MÖMAX és MÖBELIX (közös anyacég, azonos formátum)
  const m = html.match(/content="(\d+)(?:\.\d+)?"\s+property="product:price:amount"/) ||
            html.match(/property="product:price:amount"\s+content="(\d+)/) ||
            html.match(/"price"\s*:\s*"?(\d{3,9})/);
  return m ? +m[1] : 0;
}

// --- 3) Végigmegyünk minden terméken ---
const prices = {}; let ok = 0, changed = 0, failed = 0;
for (const [url, it] of items) {
  let p = 0;
  try {
    const html = await getHtml(url);
    if (it.store === 'ikea') p = priceIkea(html);
    else if (it.store === 'jysk') p = priceJysk(html, url);
    else p = priceXxxl(html);
  } catch (e) { /* elérhetetlen oldal: kihagyjuk, marad a tárolt ár */ }

  // "(N db)" a névben: a tárolt ár N darab ára, a boltban 1 db ára szerepel
  const db = it.name.match(/\((\d+)\s*db\)/);
  if (p && db) p *= +db[1];

  if (p >= 100) {
    prices[url] = p; ok++;
    if (p !== it.old) { changed++; console.log(`VÁLTOZÁS  ${it.name}: ${it.old} -> ${p}`); }
  } else {
    failed++; console.log(`KIHAGYVA  ${it.name} (${url})`);
  }
  await sleep(400); // kíméletes tempó a boltok szervereivel
}

// --- 4) Eredmény kiírása (rendezve, hogy a git diff olvasható legyen) ---
const out = {
  date: new Date().toISOString().slice(0, 10),
  updated: new Date().toISOString(),
  prices: Object.fromEntries(Object.entries(prices).sort((a, b) => a[0].localeCompare(b[0])))
};
await writeFile('prices.json', JSON.stringify(out, null, 1) + '\n');
console.log(`KÉSZ: ${ok} ár frissítve (${changed} változás), ${failed} kihagyva.`);
