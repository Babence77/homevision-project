// DREAMR — C01/C02/C06: EGYSZERI átköltöztetés az app.js-be égetett adatokból a data/catalog.json-ba.
// Futtatás (csak a 3. szakasz átállásakor, a 2. szakasz végi állapoton — app.js, sales-data.js, product-images.json):
//   node tools/build-catalog.mjs <régi app.js>
// A régi kód adatrészét változtatás nélkül kiértékeli, így pontosan az kerül át, ami futott.
// Kimenet: data/catalog.json (katalógus) és data/legacy-v1.json (a régi, sorszámos mentések fordítótáblája).
// Az átállás után a katalógust a data/catalog.json szerkesztésével kell bővíteni — ezt a szkriptet NEM kell újra futtatni.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const SRC = process.argv[2] || 'app.js';
const src = await readFile(SRC, 'utf8');
const a = src.indexOf('const META'), b = src.indexOf('  function getSlots');
if (a < 0 || b < 0) throw new Error('A régi adatrész nem található: ' + SRC);
const D = new Function(src.slice(a, b).replace(/let PRICE_DATE[^\n]*\n/g, '') + '; return {META,POOL,PA,ACCESSORY,NIGHTSTANDS,BEDDING,PRIMARY};')();
const catEn = new Function('return ' + src.match(/const CAT_EN=(\{[^\n]*\});/)[1])();
const planQty = new Function('return ' + src.match(/const PLAN_QTY=(\{[^\n]*\});/)[1])();
const S = require('../sales-data.js');
const prices = JSON.parse(await readFile('prices.json', 'utf8'));
const images = JSON.parse(await readFile('product-images.json', 'utf8'));
const CHECKED = '2026-11-14';

// --- azonosítók ---
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Ugyanazon család különböző modelljei külön termékek (nem változatok):
const MODEL = { kleppstad2: 'kleppstad-2-ajtos', kleppstad3: 'kleppstad-3-ajtos', kleppstadslide: 'kleppstad-toloajtos',
  flintan: 'flintan', flintanarm: 'flintan-karfas', gu10: 'solhetta-gu10', e27big: 'solhetta-e27-1521', e27small: 'solhetta-e27-806' };
// A kiegészítők saját kategóriát kapnak (szobában nem jelennek meg önállóan)
const ACC_CAT = { fjadrar: 'cushionInsert', inner: 'cushionInsert', gu10: 'bulb', e27big: 'bulb', e27small: 'bulb',
  vesteroy160: 'mattress', afjall160: 'mattress', afjall90m: 'mattress', afjall90k: 'mattress', luroy90: 'bedbase' };

const entries = [];   // {cat, p}
Object.entries(D.POOL).forEach(([cat, arr]) => arr.forEach(p => entries.push({ cat, p })));
D.NIGHTSTANDS.forEach(p => entries.push({ cat: 'nightstand', p }));
Object.values(D.BEDDING).forEach(p => entries.push({ cat: 'bedding', p }));
Object.entries(D.ACCESSORY).forEach(([k, p]) => entries.push({ cat: ACC_CAT[k], p }));

const products = new Map(); const byUrl = new Map(); const usedVariantIds = new Set();
for (const { cat, p } of entries) {
  const family = p.name.split(/[ ,]/)[0];
  const productId = `${cat}.${MODEL[p.key] || slug(family)}`;
  const descriptor = (p.name.split(',').slice(1).join(',').trim()) || 'alap';
  let vid = `${productId}.${slug(descriptor) || 'alap'}`;
  if (usedVariantIds.has(vid)) vid = `${vid}-${slug(p.key)}`;
  usedVariantIds.add(vid);
  const live = prices.items?.[p.url] || null;
  const sale = S.SALES[p.url] ? { ...S.SALES[p.url] } : null;
  const variant = {
    id: vid, legacyKeys: [p.key], store: p.store, sku: live?.sku || null,
    name: { hu: p.name }, label: { hu: descriptor === 'alap' ? '' : descriptor },
    urls: { canonical: p.url, buy: p.url },
    basePrice: { amount: p.price, currency: 'HUF', basis: 'salesUnit', status: 'estimated', source: 'DREAMR kiinduló ár (az élő ár a prices.json-ból jön)' },
    dimensions: {
      unit: 'cm',
      width: { value: p.w, status: 'estimated', source: 'DREAMR korábbi kézi adat' },
      depth: { value: p.d, status: 'estimated', source: 'DREAMR korábbi kézi adat' },
      height: { value: null, status: 'missing' },
      open: null,
      wallMounted: { value: false, status: 'estimated', source: 'DREAMR feltételezés' }
    },
    package: { status: 'missing' },
    attributes: {
      material: { value: null, status: 'missing' }, color: { value: null, status: 'missing' },
      availability: live?.availability ? { value: live.availability, status: 'verified', source: p.url, checkedAt: (live.checkedAt || '').slice(0, 10) } : { value: null, status: 'missing' },
      offerPeriod: live?.saleUntil ? { value: { until: live.saleUntil }, status: 'verified', source: p.url, checkedAt: (live.checkedAt || '').slice(0, 10) } : { value: null, status: 'missing' }
    },
    image: images[p.url] ? { url: images[p.url], status: 'unchecked', license: { status: 'unsettled', owner: p.store, note: 'Bolti termékfotó; felhasználási engedély nincs rögzítve.' } } : { url: null, status: 'missing' },
    sale, requires: []
  };
  if (!products.has(productId)) products.set(productId, { id: productId, category: cat, family, name: { hu: p.name.split(',')[0] }, variants: [] });
  products.get(productId).variants.push(variant);
  byUrl.set(p.url, variant);
}
// Kiegészítő-hivatkozások: URL helyett változatazonosító
for (const [url, reqs] of Object.entries(S.REQUIRES)) {
  const v = byUrl.get(url); if (!v) throw new Error('REQUIRES: ismeretlen termék ' + url);
  v.requires = reqs.map(r => ({ id: r.id, label: r.label, per: r.per, note: r.note || '', ref: r.ref ? byUrl.get(r.ref).id : null }));
}

// --- választék: kategóriánkénti sorrend, alapajánlatok, szobák felépítése ---
const idOf = p => byUrl.get(p.url).id;
const pools = {};
Object.entries(D.POOL).forEach(([cat, arr]) => { pools[cat] = arr.map(idOf); });
pools.nightstand = D.NIGHTSTANDS.map(idOf);
pools.bedding = Object.values(D.BEDDING).map(idOf);
const find = (cat, key) => { const p = D.POOL[cat].find(x => x.key === key); if (!p) throw new Error(`hiányzó alapajánlat: ${cat}/${key}`); return idOf(p); };
const primaryRoomStyle = {};
for (const [room, styles] of Object.entries(D.PRIMARY)) {
  primaryRoomStyle[room] = {};
  for (const [style, slots] of Object.entries(styles)) {
    primaryRoomStyle[room][style] = {};
    for (const [slot, key] of Object.entries(slots)) primaryRoomStyle[room][style][slot] = find(slot === 'kdesk' ? 'desk' : slot, key);
  }
}
const primaryStyle = {};
for (const [cat, byStyle] of Object.entries(D.PA)) for (const [style, key] of Object.entries(byStyle)) (primaryStyle[style] ||= {})[cat] = find(cat, key);

// A szobák felépítése — pontosan a régi getSlots() szerint
const R = (slot, pool, primary, extra = {}) => ({ slot, pool, primary, ...extra });
const rooms = {
  nappali: [R('sofa', 'sofa', 'roomStyle'), R('chair', 'chair', 'roomStyle'), R('coffee', 'coffee', 'roomStyle'), R('tv', 'tv', 'roomStyle'), R('rug', 'rug', 'roomStyle'), R('lamp', 'lamp', 'roomStyle'), R('curtain', 'curtain', 'style'), R('cushion', 'cushion', 'style'), R('vase', 'vase', 'style')],
  haloszoba: [R('bed', 'bed', 'roomStyle'), R('nightstand', 'nightstand', null), R('wardrobe', 'wardrobe', 'roomStyle'), R('rug', 'rug', 'roomStyle'), R('lamp', 'lamp', 'roomStyle'), R('curtain', 'curtain', 'style'), R('bedding', 'bedding', null)],
  etkezo: [R('dtable', 'dtable', 'roomStyle'), R('dchair', 'dchair', 'roomStyle'), R('sideboard', 'sideboard', 'roomStyle'), R('rug', 'rug', 'roomStyle'), R('lamp', 'lamp', 'roomStyle'), R('curtain', 'curtain', 'style')],
  konyha: [R('island', 'island', 'roomStyle'), R('barstool', 'barstool', 'roomStyle'), R('kcabinet', 'kcabinet', 'roomStyle'), R('fridge', 'fridge', null, { limit: 1 }), R('lamp', 'lamp', 'roomStyle'), R('curtain', 'curtain', 'style')],
  dolgozo: [R('desk', 'desk', 'roomStyle'), R('ochair', 'ochair', 'roomStyle'), R('shelf', 'shelf', 'roomStyle'), R('rug', 'rug', 'roomStyle'), R('lamp', 'lamp', 'roomStyle'), R('curtain', 'curtain', 'style')],
  gyerek: [R('kbed', 'kbed', 'roomStyle'), R('kdesk', 'desk', 'roomStyle'), R('wardrobe', 'wardrobe', 'roomStyle'), R('shelf', 'shelf', 'roomStyle'), R('rug', 'rug', 'roomStyle'), R('lamp', 'lamp', 'roomStyle')]
};

// --- kategóriák ---
const categories = {};
for (const [id, m] of Object.entries(D.META)) categories[id] = { label: { hu: m.cat, en: catEn[id] || m.cat }, icon: m.icon, floor: m.floor, plan: m.plan, planQty: planQty[id] || 1 };
Object.assign(categories, {
  cushionInsert: { label: { hu: 'Díszpárnabelső', en: 'Cushion insert' }, icon: '▫', floor: 'none', plan: null, planQty: 1, accessoryOnly: true },
  bulb: { label: { hu: 'Izzó', en: 'Light bulb' }, icon: '💡', floor: 'none', plan: null, planQty: 1, accessoryOnly: true },
  mattress: { label: { hu: 'Matrac', en: 'Mattress' }, icon: '▭', floor: 'none', plan: null, planQty: 1, accessoryOnly: true },
  bedbase: { label: { hu: 'Ágyrács', en: 'Bed base' }, icon: '▤', floor: 'none', plan: null, planQty: 1, accessoryOnly: true }
});

// --- régi (v1) mentések fordítótáblája: sorszám → változatazonosító, szobánként/stílusonként/tételenként ---
const legacy = { format: 'dreamr-legacy-order/1', note: 'A 3. szakasz előtti mentések state.sel sorszámai és selKeys kulcsai ebből fordíthatók változatazonosítóra. SOHA NE MÓDOSÍTSD.', order: {}, keys: {} };
for (const [room, slots] of Object.entries(rooms)) for (const style of Object.keys(D.PRIMARY[room])) for (const s of slots) {
  let list = pools[s.pool].slice();
  const prim = s.primary === 'roomStyle' ? primaryRoomStyle[room][style][s.slot] : s.primary === 'style' ? primaryStyle[style][s.slot] : null;
  if (prim) list = [prim, ...list.filter(x => x !== prim)];
  if (s.limit) list = list.slice(0, s.limit);
  legacy.order[`${room}:${style}:${s.slot}`] = list;
}
for (const v of byUrl.values()) for (const k of v.legacyKeys) (legacy.keys[k] ||= []).push(v.id);

const catalog = {
  $schema: '../schemas/product.schema.json',
  format: 'dreamr-catalog/1', checked: CHECKED,
  categories, rooms, assortment: { pools, primary: { roomStyle: primaryRoomStyle, style: primaryStyle } },
  products: [...products.values()]
};
await mkdir('data', { recursive: true });
await writeFile('data/catalog.json', JSON.stringify(catalog, null, 1) + '\n');
await writeFile('data/legacy-v1.json', JSON.stringify(legacy, null, 1) + '\n');
console.log(`Termékek: ${products.size}, változatok: ${byUrl.size}, kategóriák: ${Object.keys(categories).length}, régi sorrendek: ${Object.keys(legacy.order).length}`);
