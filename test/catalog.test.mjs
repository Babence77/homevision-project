// DREAMR — a 3. szakasz (egységes katalógus) tesztjei. Futtatás: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { validate } from '../tools/schema-check.mjs';
const require = createRequire(import.meta.url);
const DR = require('../catalog.js');
const json = async f => JSON.parse(await readFile(f, 'utf8'));
const CATALOG = await json('data/catalog.json'), LEGACY = await json('data/legacy-v1.json'), SCHEMA = await json('schemas/product.schema.json');
const clone = o => JSON.parse(JSON.stringify(o));
const C = DR.fromJSON(CATALOG, LEGACY);
const variants = CATALOG.products.flatMap(p => p.variants);

// --- C01 ---
test('C01: a katalógus megfelel a sémának (schemas/product.schema.json)', () => {
  assert.deepEqual(validate(SCHEMA, CATALOG), []);
});

test('C01/C04: a sémaellenőrző tényleg elkapja a hibát (forrás nélküli „igazolt” mező, ismeretlen bolt)', () => {
  const cat = clone(CATALOG), v = cat.products[1].variants[0];
  v.dimensions.width = { value: 200, status: 'verified' };   // forrás és dátum nélkül
  v.store = 'aldi';
  const errs = validate(SCHEMA, cat).join('\n');
  assert.match(errs, /dimensions\/width: hiányzó kötelező mező: source/);
  assert.match(errs, /store: értéke "aldi"/);
});

test('C01: termék felvétele csak adatmódosítás — új változat megjelenik a szobában, kódmódosítás nélkül', () => {
  const cat = clone(CATALOG);
  const v = clone(variants.find(x => x.id === 'sofa.ektorp.vilagosbezs'));
  Object.assign(v, { id: 'sofa.proba.zold', legacyKeys: [], name: { hu: 'PRÓBA kanapé, zöld' }, urls: { canonical: 'https://www.ikea.com/hu/hu/p/proba-00000001/', buy: 'https://www.ikea.com/hu/hu/p/proba-00000001/' } });
  cat.products.push({ id: 'sofa.proba', category: 'sofa', family: 'PRÓBA', name: { hu: 'PRÓBA kanapé' }, variants: [v] });
  cat.assortment.pools.sofa.push('sofa.proba.zold');
  assert.deepEqual(validate(SCHEMA, cat), []);
  const slot = DR.fromJSON(cat, LEGACY).slotsFor('nappali', 'modern').find(s => s.id === 'sofa');
  assert.ok(slot.options.some(o => o.vid === 'sofa.proba.zold' && o.name === 'PRÓBA kanapé, zöld'));
});

test('C01: hibás hivatkozás a választékban betöltéskor kiderül', () => {
  const cat = clone(CATALOG); cat.assortment.pools.sofa.push('sofa.nincs.ilyen');
  assert.throws(() => DR.fromJSON(cat, LEGACY), /ismeretlen azonosító/);
});

// --- C02 ---
test('C02: minden változatnak egyedi, stabil azonosítója van; a STRANDMON két színe két változat', () => {
  assert.equal(new Set(variants.map(v => v.id)).size, variants.length);
  const p = CATALOG.products.find(x => x.id === 'chair.strandmon');
  assert.deepEqual(p.variants.map(v => v.id), ['chair.strandmon.sotetszurke', 'chair.strandmon.melybezs']);
});

test('C02: az URL vagy a sorrend változása nem cseréli le a mentett tételt', () => {
  const plan = { format: 'dreamr-plan/2', room: 'nappali', style: 'modern', sel: { 'nappali:modern:chair': 'chair.strandmon.melybezs' } };
  const cat = clone(CATALOG);
  cat.assortment.pools.chair.reverse();                                   // sorrend megfordítva
  const v = cat.products.find(p => p.id === 'chair.strandmon').variants[1];
  v.urls = { canonical: 'https://www.ikea.com/hu/hu/p/uj-cim-50613163/', buy: 'https://www.ikea.com/hu/hu/p/uj-cim-50613163/', previous: [{ url: v.urls.canonical }] };
  const C2 = DR.fromJSON(cat, LEGACY), m = C2.migratePlan(plan);
  assert.equal(m.config.sel['nappali:modern:chair'], 'chair.strandmon.melybezs');
  assert.equal(C2.byUrl(variants.find(x => x.id === 'chair.strandmon.melybezs').urls.canonical).vid, 'chair.strandmon.melybezs', 'a régi URL is a változatra mutat');
});

test('C02: a SKALS új címre költözött, az azonosítója és a régi címe megmaradt', () => {
  const v = C.variant('shelf.skals.feher');
  assert.match(v.url, /polcos-elem-skals/);
  assert.equal(C.byUrl('https://jysk.hu/tarolas/polcok-es-terelvalasztok/polc-kombinacio-elem-skals-konyvespolc-feher').vid, 'shelf.skals.feher');
});

// --- C03 ---
test('C03: KNOXHULT 60 × 31 × 60 cm, bolti adattal igazolva, falra szerelhető', () => {
  const d = C.variant('kcabinet.knoxhult.feher').variant.dimensions;
  assert.deepEqual([d.width.value, d.depth.value, d.height.value, d.unit], [60, 31, 60, 'cm']);
  assert.deepEqual([d.width.status, d.depth.status, d.height.status], ['verified', 'verified', 'verified']);
  assert.equal(d.wallMounted.value, true); assert.equal(d.wallMounted.status, 'verified');
});

test('C03: ellenőrizetlen méret nem kap bizonyított státuszt (megszűnt / robotszűrős termékek)', () => {
  for (const id of ['sofa.viskafors.szurke', 'sofa.kiss.alap', 'tv.malta.185-42', 'nightstand.kullen.feher']) {
    const d = C.variant(id).variant.dimensions;
    assert.notEqual(d.width.status, 'verified', id); assert.notEqual(d.depth.status, 'verified', id);
  }
});

test('C03: a csomagméret külön mező; a kinyitott méret is külön (ALLING bővíthető asztal)', () => {
  const k = C.variant('kcabinet.knoxhult.feher').variant;
  assert.equal(k.package.status, 'verified'); assert.ok(k.package.parcels[0].weightKg > 0);
  const a = C.variant('dtable.alling.tolgy').variant.dimensions;
  assert.equal(a.open.width.value, 163); assert.equal(a.open.closedWidth.value, 100);
});

// --- C04 ---
test('C04: minden igazolt mezőnek van forrása és ellenőrzési ideje', () => {
  const bad = [];
  const walk = (o, path) => { if (!o || typeof o !== 'object') return;
    if (o.status === 'verified' && 'value' in o && (!o.source || !o.checkedAt)) bad.push(path);
    for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`); };
  variants.forEach(v => walk(v, v.id));
  assert.deepEqual(bad, []);
});

test('C04: anyag, szín, kategória, készlet és ajánlati időszak mezőként szerepel', () => {
  for (const v of variants) for (const k of ['material', 'color', 'availability', 'offerPeriod'])
    assert.ok(v.attributes[k] && ['verified', 'estimated', 'missing'].includes(v.attributes[k].status), `${v.id}.${k}`);
  assert.equal(C.variant('kcabinet.knoxhult.feher').variant.attributes.color.value, 'fehér');
});

// --- C05 ---
test('C05: minden képnek van állapota és felhasználási feltétel-bejegyzése', () => {
  for (const v of variants) {
    assert.ok(['verified', 'unchecked', 'unreachable', 'missing'].includes(v.image.status), v.id);
    if (v.image.url) assert.ok(v.image.license && v.image.license.status, `${v.id}: felhasználási feltétel hiányzik`);
  }
});

// --- C06 ---
test('C06: régi (v1) mentés sorszámai a rögzített régi sorrendből fordulnak azonosítóra', () => {
  // VISKAFORS a régi Modern nappali 0. kanapéja volt; az 1. a régi listában az EKTORP
  const m = C.migratePlan({ room: 'nappali', style: 'modern', sel: { 'nappali:modern:sofa': 1, 'haloszoba:modern:nightstand': 1 } });
  assert.equal(m.migrated, true); assert.equal(m.config.format, 'dreamr-plan/2');
  assert.equal(m.config.sel['nappali:modern:sofa'], 'sofa.ektorp.vilagosbezs');
  assert.equal(m.config.sel['haloszoba:modern:nightstand'], 'nightstand.brimnes.feher');
  assert.equal(m.config.sel['nappali:modern:chair'], 'chair.strandmon.sotetszurke', 'a mentéskor nem rögzített tétel a régi alapértelmezés');
});

test('C06: az 1. szakaszos mentés régi kulcsa (selKeys) elsőbbséget kap a sorszámmal szemben', () => {
  // A sorszám (6) és a kulcs (applaryd) szándékosan MÁS termékre mutat — a kulcsnak kell nyernie.
  const order = LEGACY.order['nappali:modern:sofa'];
  assert.notEqual(order[6], 'sofa.applaryd.vilagosszurke', 'a próbához a 6. hely ne az ÄPPLARYD legyen');
  const m = C.migratePlan({ room: 'nappali', style: 'modern', sel: { 'nappali:modern:sofa': 6 }, selKeys: { 'nappali:modern:sofa': 'applaryd', 'nappali:modern:chair': 'strandmondeep' } });
  assert.equal(m.config.sel['nappali:modern:sofa'], 'sofa.applaryd.vilagosszurke');
  assert.equal(m.config.sel['nappali:modern:chair'], 'chair.strandmon.melybezs', 'sorszám nélküli tétel is a kulcs szerint');
  assert.equal('selKeys' in m.config, false);
});

test('C06: már nem létező termék nem cserélődik csendben — helyreállítási megjegyzés készül', () => {
  const m = C.migratePlan({ format: 'dreamr-plan/2', room: 'nappali', style: 'modern', sel: { 'nappali:modern:sofa': 'sofa.regi.torolt' } });
  assert.equal(m.config.sel['nappali:modern:sofa'], undefined);
  assert.deepEqual(m.notes, [{ key: 'nappali:modern:sofa', slot: 'sofa', code: 'missing', was: 'sofa.regi.torolt' }]);
});

test('C06: értelmezhetetlen régi sorszám → megjegyzés, nem véletlen bútor', () => {
  const m = C.migratePlan({ room: 'nappali', style: 'modern', sel: { 'nappali:modern:sofa': 99 } });
  assert.equal(m.notes[0].code, 'unmapped');
});

test('C06: a régi sorrend-tábla mind a 240 szoba×stílus×tétel kombinációt lefedi', () => {
  assert.equal(Object.keys(LEGACY.order).length, 240);
  assert.ok(Object.values(LEGACY.order).flat().every(id => C.variant(id)), 'minden régi azonosító létezik');
});
