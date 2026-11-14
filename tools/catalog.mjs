// DREAMR — termékkatalógus az eszközöknek (árfrissítő, linkfelmérés, felderítés).
// 3. szakasz (C01): a forrás a data/catalog.json — JavaScript-sorokat többé nem értelmezünk.
import { readFile } from 'node:fs/promises';

export async function loadCatalogJSON(file = 'data/catalog.json') {
  return JSON.parse(await readFile(file, 'utf8'));
}

// Visszaad: [{id, key, name, store, price, url, previousUrls}] — egy bejegyzés változatonként.
export async function readCatalog(file = 'data/catalog.json') {
  const cat = await loadCatalogJSON(file);
  return cat.products.flatMap(p => p.variants.map(v => ({
    id: v.id, key: v.id, name: v.name.hu, store: v.store, price: v.basePrice.amount,
    url: v.urls.canonical, previousUrls: (v.urls.previous || []).map(x => x.url)
  })));
}

// URL-enként egy bejegyzés (az első előfordulás adatai + az összes azonosító).
export function uniqueByUrl(entries) {
  const map = new Map();
  for (const e of entries) {
    if (!map.has(e.url)) map.set(e.url, { ...e, keys: [e.key] });
    else map.get(e.url).keys.push(e.key);
  }
  return map;
}
