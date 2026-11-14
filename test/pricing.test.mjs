// DREAMR — költségtesztek (B06). Futtatás: node --test test/*.test.mjs
// A példák a boltok 2026-11-12-i adatain alapulnak (lásd sales-data.js forrásait).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const P = require('../pricing.js');
const S = require('../sales-data.js');
// 3. szakasz óta a kiszerelés (sale) és a kiegészítők (requires) a katalógus változatain vannak.
const C = require('../catalog.js').fromJSON(JSON.parse(await readFile('data/catalog.json', 'utf8')), null);
const saleOf = url => (C.byUrl(url)?.variant.sale) || { unit: 'db', pack: 1 };
const requiresOf = url => C.byUrl(url)?.variant.requires || [];

const JONSTRUP = 'https://jysk.hu/etkezo/etkezoszekek/etkezoszek-jonstrup-szurke-szovet-natur-tolgyszinu';
const BRIMNES = 'https://www.ikea.com/hu/hu/p/brimnes-ejjeliszekreny-feher-10234942/';
const GURLI = 'https://www.ikea.com/hu/hu/p/gurli-diszparnahuzat-soetetszuerke-50598737/';
const MYRFIOL = 'https://jysk.hu/lakberendezes/diszparnak-es-diszparnahuzatok/diszparnak/diszparna-myrfiol-45x45-topszin';
const MAJGULL = 'https://www.ikea.com/hu/hu/p/majgull-fenyzaro-fueggoeny-1-par-szuerke-fueggoenyrancolo-szalaggal-80417815/';
const FULLTALIG = 'https://www.ikea.com/hu/hu/p/fulltalig-gyertyatarto-3-db-fekete-40342134/';
const INNER = 'cushionInsert.inner.50-50';

const item = (url, store, unitPrice, requested, extra = {}) => ({ id: url.slice(-12), name: url, store, url, unitPrice, requested, sale: saleOf(url), requires: requiresOf(url), ...extra });
const refInfo = id => id === INNER ? { name: 'INNER díszpárnabelső', store: 'ikea', url: C.variant(id).url, unitPrice: 1200, sale: C.variant(id).variant.sale } : null;
const run = (lines, mode = 'delivery', zone = null) => P.compute({ lines, mode, zone, shipping: S.SHIPPING, refInfo });

// --- B01: ugyanaz a termék 1, 2, 3, 4, 5 és 8 darabnál következetesen ---
test('Egyedi termék: 1, 2, 3, 4, 5, 8 darab = darabszám × egységár, többlet nélkül', () => {
  for (const n of [1, 2, 3, 4, 5, 8]) {
    const r = P.purchase(n, saleOf(BRIMNES), 'delivery');
    assert.deepEqual([r.units, r.pieces, r.extra], [n, n, 0], `${n} db`);
    assert.equal(run([item(BRIMNES, 'ikea', 11990, n)]).totals.products, n * 11990);
  }
});

test('Függönypár (1 egység = 2 lap): 1, 2, 3, 4, 5, 8 lapnál a megvásárolandó pár és a többlet', () => {
  const want = { 1: [1, 2, 1], 2: [1, 2, 0], 3: [2, 4, 1], 4: [2, 4, 0], 5: [3, 6, 1], 8: [4, 8, 0] };
  for (const [n, exp] of Object.entries(want)) {
    const r = P.purchase(+n, saleOf(MAJGULL), 'pickup');
    assert.deepEqual([r.units, r.pieces, r.extra], exp, `${n} lap`);
    if (exp[2]) assert.equal(r.reasons[0].code, 'pack');
  }
});

test('Csomag (FULLTALIG, 1 egység = 3 db): 1 darabhoz is egy teljes csomag kell', () => {
  const r = P.purchase(1, saleOf(FULLTALIG), 'pickup');
  assert.deepEqual([r.units, r.pieces, r.extra, r.unit], [1, 3, 2, 'csomag']);
  assert.equal(run([item(FULLTALIG, 'ikea', 3990, 1)]).totals.products, 3990);
});

// --- B02: JONSTRUP — a teljesítési mód határozza meg a mennyiséget ---
test('JONSTRUP: 3 szék tervezve → házhozszállításnál 4 vásárolandó, bolti átvételnél 3', () => {
  const d = run([item(JONSTRUP, 'jysk', 9000, 3)], 'delivery');
  assert.deepEqual([d.lines[0].requested, d.lines[0].units, d.lines[0].extra], [3, 4, 1]);
  assert.equal(d.lines[0].total, 36000);
  assert.deepEqual(d.extras[0].reasons, [{ code: 'multiple', multiple: 4, mode: 'delivery' }], 'a többletdarab oka megmagyarázva');
  const p = run([item(JONSTRUP, 'jysk', 9000, 3)], 'pickup');
  assert.deepEqual([p.lines[0].units, p.lines[0].extra, p.lines[0].total], [3, 0, 27000]);
});

test('JONSTRUP házhozszállításnál: 1, 2, 3, 4, 5, 8 szék → 4, 4, 4, 4, 8, 8 vásárolandó', () => {
  const got = [1, 2, 3, 4, 5, 8].map(n => P.purchase(n, saleOf(JONSTRUP), 'delivery').units);
  assert.deepEqual(got, [4, 4, 4, 4, 8, 8]);
});

// --- Két éjjeliszekrény és el nem helyezett darab ---
test('Két éjjeliszekrény (BRIMNES): 2 × 11 990 Ft = 23 980 Ft', () => {
  const r = run([item(BRIMNES, 'ikea', 11990, 2, { placed: 2 })]);
  assert.equal(r.totals.products, 23980); assert.equal(r.lines[0].units, 2);
});

test('El nem helyezett darab: 2 kérve, 1 fér el → 1 kerül a számításba, 1 jelezve', () => {
  const r = run([item(BRIMNES, 'ikea', 11990, 2, { placed: 1 })]);
  assert.equal(r.totals.products, 11990);
  assert.deepEqual(r.unplaced, [{ id: r.lines[0].id, name: BRIMNES, unplaced: 1 }]);
});

// --- B03: párnahuzatok és kiegészítők ---
test('Párnahuzat (GURLI): 2 huzat + 2 belső párna külön kiegészítőként, nem a termékárban', () => {
  const r = run([item(GURLI, 'ikea', 1490, 2)], 'pickup');
  assert.equal(r.totals.products, 2980, 'a huzat ára magában');
  assert.equal(r.accessories.length, 1);
  assert.deepEqual([r.accessories[0].id, r.accessories[0].need, r.accessories[0].total], ['inner', 2, 2400]);
  assert.equal(r.totals.accessories, 2400);
});

test('Kész díszpárna (MYRFIOL, JYSK): nincs hiányzó kiegészítő', () => {
  const r = run([item(MYRFIOL, 'jysk', 2750, 2)], 'pickup');
  assert.equal(r.accessories.length, 0); assert.equal(r.totals.products, 5500);
});

test('Ismert ár nélküli szükséges kiegészítő (KONGSBERG matrac) → ismeretlenként jelölve, nem 0', () => {
  const KONGSBERG = 'https://jysk.hu/haloszoba/agyak/agyalapok-agyracsok-agykeretek/agykeretek/agykeret-kongsberg-160x200-bezs-szovet';
  const r = run([item(KONGSBERG, 'jysk', 70000, 1)], 'pickup');
  assert.deepEqual(r.unknown.accessories.map(a => a.id), ['mattress', 'base']);
  assert.equal(r.totals.hasUnknown, true);
});

// --- B04: szállítás ---
test('Ismeretlen szállítás (JYSK házhoz): nem nulla, hanem ismeretlenként jelölve', () => {
  const r = run([item(JONSTRUP, 'jysk', 9000, 4)], 'delivery');
  assert.equal(r.totals.shipping, 0, 'ismert szállítási díj nincs');
  assert.equal(r.unknown.shipping.length, 1); assert.equal(r.unknown.shipping[0].store, 'jysk');
  assert.equal(r.unknown.shipping[0].known, false); assert.equal(r.totals.hasUnknown, true);
});

test('JYSK bolti átvétel: ismert 0 Ft (Click & Collect ingyenes)', () => {
  const r = run([item(JONSTRUP, 'jysk', 9000, 3)], 'pickup');
  assert.equal(r.stores[0].shipping.known, true); assert.equal(r.stores[0].shipping.amount, 0); assert.equal(r.totals.hasUnknown, false);
});

test('IKEA házhozszállítás: díjtábla zóna szerint; zóna nélkül tartomány', () => {
  const lines = [item(BRIMNES, 'ikea', 11990, 2), item('https://www.ikea.com/hu/hu/p/x-00000001/', 'ikea', 120000, 1)]; // 143 980 Ft
  assert.equal(run(lines, 'delivery', 'A').stores[0].shipping.amount, 10490);
  assert.equal(run(lines, 'delivery', 'B').stores[0].shipping.amount, 9490);
  const nz = run(lines, 'delivery', null).stores[0].shipping;
  assert.deepEqual([nz.known, nz.min, nz.max], [false, 9490, 10490]);
});

test('IKEA házhozszállítás 2000 Ft alatt nem elérhető → ismeretlen, nem 0', () => {
  const PADRAG = 'https://www.ikea.com/hu/hu/p/padrag-vaza-atlatszo-ueveg-10470991/';
  const s = run([item(PADRAG, 'ikea', 495, 1)], 'delivery', 'A').stores[0].shipping;
  assert.equal(s.known, false); assert.equal(s.belowMinimum, 2000);
});

// --- Hiányzó ár ---
test('Hiányzó ár: a tétel nem nullával, hanem ismeretlenként szerepel', () => {
  const r = run([item(BRIMNES, 'ikea', null, 2), item(GURLI, 'ikea', 1490, 1)], 'pickup');
  assert.equal(r.lines[0].total, null); assert.equal(r.totals.products, 1490);
  assert.deepEqual(r.unknown.prices.map(p => p.url ?? p.name), [BRIMNES]);
});

// --- B05: egy számítás, kerekítés, pillanatkép ---
test('Kerekítés: egész forint; ugyanaz a bemenet mindig ugyanazt adja', () => {
  const a = run([item(BRIMNES, 'ikea', 11990.4, 3)]), b = run([item(BRIMNES, 'ikea', 11990.4, 3)]);
  assert.equal(a.lines[0].unitPrice, 11990); assert.equal(a.totals.products, 35970);
  assert.deepEqual(a.totals, b.totals);
});

test('Árpillanatkép: új árnál látszik a változás', () => {
  const before = P.snapshot(run([item(BRIMNES, 'ikea', 11990, 2)], 'pickup'));
  const now = run([item(BRIMNES, 'ikea', 12990, 2)], 'pickup');
  const d = P.diff(before, now);
  assert.equal(d.delta, 2000); assert.deepEqual(d.changed, [{ name: BRIMNES, from: 11990, to: 12990, units: 2 }]);
});

// --- Adatminőség: minden kiegészítő-hivatkozás létező katalógusváltozatra mutat ---
test('Katalógus: minden „requires” hivatkozás létező változat', () => {
  const bad = C.allItems().flatMap(it => (it.variant.requires || []).map(r => r.ref)).filter(id => id && !C.variant(id));
  assert.deepEqual(bad, []);
});
