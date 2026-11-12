// DREAMR — termékkatalógus kiolvasása az app.js-ből (a P_(...) sorok).
// Ezt használja a linkfelmérő (link-audit.mjs) és a napi árfrissítő (update-prices.mjs).
import { readFile } from 'node:fs/promises';

const RE = /P_\(\s*(?:'([^']*)'|"([^"]*)")\s*,\s*(?:"([^"]+)"|'([^']+)')\s*,\s*(?:"([^"]+)"|'([^']+)')\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(?:"([^"]+)"|'([^']+)')\s*\)/g;

// Visszaad: [{key,name,store,price,w,d,url}] a forrás sorrendjében (egy URL többször is szerepelhet).
export async function readCatalog(file = 'app.js') {
  const src = await readFile(file, 'utf8');
  return [...src.matchAll(RE)].map(m => ({
    key: m[1] ?? m[2], name: m[3] ?? m[4], store: m[5] ?? m[6],
    price: +m[7], w: +m[8], d: +m[9], url: m[10] ?? m[11]
  }));
}

// URL-enként egy bejegyzés (az első előfordulás adatai + az összes kulcs).
export function uniqueByUrl(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.url)) map.set(e.url, { ...e, keys: [e.key] });
    else map.get(e.url).keys.push(e.key);
  }
  return map;
}

// "(N db)" a névben: a katalógusár N darab ára, a boltban 1 darab ára szerepel.
export const packSize = name => { const m = name.match(/\((\d+)\s*db\)/); return m ? +m[1] : 1; };
