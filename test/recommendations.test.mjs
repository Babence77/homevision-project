// DREAMR — ajánlómotor tesztjei (5. szakasz, R01, R02, R05, R06). Futtatás: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DR = require('../catalog.js');
const R = require('../recommendations.js');

const RAW = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const CAT = DR.fromJSON(RAW, JSON.parse(await readFile('data/legacy-v1.json', 'utf8')));
const ROOMS = Object.keys(RAW.rooms), STYLES = ['modern', 'skandinav', 'minimalista', 'japandi', 'luxus', 'ipari'];
const ALL_STORES = [...new Set(CAT.allItems().map(i => i.store))];
const ctxFor = (slot, stores, extra = {}) => ({ stores: new Set(stores), category: RAW.categories[slot.category], ...extra });
// a teszt ne módosítsa a közös katalógus-objektumot
const withCheck = (o, check) => ({ ...o, check });

test('R01: „csak MÖMAX” szűrő minden szobában és stílusban betartva — más bolt nem tölti ki a hiányzó kategóriát', () => {
  let filled = 0, empty = 0;
  for (const room of ROOMS) for (const style of STYLES) for (const slot of CAT.slotsFor(room, style)) {
    const r = R.recommend(slot, ctxFor(slot, ['momax']));
    if (r.idx < 0) { empty++; assert.equal(r.reason.code, 'none'); assert.equal(r.eligible.length, 0); continue; }
    filled++;
    assert.equal(slot.options[r.idx].store, 'momax', `${room}/${style}/${slot.id}`);
    assert.ok(r.ranked.every(x => x.o.store === 'momax'));
  }
  assert.ok(filled > 0 && empty > 0, 'van MÖMAX-termék és üresen maradó kategória is');
  const chair = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'chair');   // fotel: nincs MÖMAX-kínálat
  const r = R.recommend(chair, ctxFor(chair, ['momax']));
  assert.equal(r.idx, -1); assert.equal(r.reason.excluded.store, chair.options.length);
});

test('R01: kizáró okok — tiltott bolt, rossz link, rossz változat, hiányzó kötelező méret', () => {
  const sofa = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'sofa'), o = sofa.options[0], cat = RAW.categories.sofa;
  assert.deepEqual(R.exclusions(o, { stores: ALL_STORES, category: cat, slotCategory: 'sofa' }), []);
  assert.deepEqual(R.exclusions(o, { stores: ['jysk'], category: cat, slotCategory: 'sofa' }), ['store']);
  assert.ok(R.exclusions(withCheck(o, { status: 'gone' }), { stores: ALL_STORES, category: cat }).includes('link'));
  assert.ok(R.exclusions({ ...o, url: 'http://nem-biztonsagos.example' }, { stores: ALL_STORES, category: cat }).includes('link'));
  assert.ok(R.exclusions(o, { stores: ALL_STORES, category: cat, slotCategory: 'chair' }).includes('variant'));
  assert.ok(R.exclusions({ ...o, product: { ...o.product, review: { status: 'pending' } } }, { stores: ALL_STORES, category: cat }).includes('variant'));
  const noWidth = { ...o, variant: { ...o.variant, dimensions: { ...o.variant.dimensions, width: { value: 0, status: 'missing' } } } };
  assert.ok(R.exclusions(noWidth, { stores: ALL_STORES, category: cat }).includes('size'));
  // díszpárna (nincs alaprajzi helye): a méret nem kötelező
  const cushion = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'cushion').options[0];
  const cNo = { ...cushion, variant: { ...cushion.variant, dimensions: { ...cushion.variant.dimensions, width: { value: 0, status: 'missing' } } } };
  assert.deepEqual(R.exclusions(cNo, { stores: ALL_STORES, category: RAW.categories.cushion }), []);
});

test('R01: megszűnt, de mentett tervben kifejezetten választott tétel látható marad — a bolttiltást viszont nem írhatja felül', () => {
  const o = withCheck(CAT.slotsFor('nappali', 'modern').find(s => s.id === 'sofa').options[0], { status: 'gone' });
  assert.deepEqual(R.exclusions(o, { stores: ALL_STORES, category: RAW.categories.sofa, keepVid: o.vid }), []);
  assert.deepEqual(R.exclusions(o, { stores: ['jysk'], category: RAW.categories.sofa, keepVid: o.vid }), ['store']);
});

test('R01: rangsor — befér, ellenőrzött ár, stílus-alapajánlat, árszint', () => {
  const slot = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'sofa');
  const all = R.recommend(slot, ctxFor(slot, ALL_STORES));
  assert.equal(slot.options[all.idx].vid, slot.primaryVid); assert.equal(all.reason.code, 'primary');
  // az alapajánlat ára nem ellenőrzött → ellenőrzött csere, az indoklás megnevezi az okot
  const unv = R.recommend(slot, ctxFor(slot, ALL_STORES, { verified: o => o.vid !== slot.primaryVid }));
  assert.notEqual(slot.options[unv.idx].vid, slot.primaryVid);
  assert.equal(unv.reason.code, 'alternative'); assert.deepEqual(unv.reason.primaryBlocked, ['unverified']);
  // az alapajánlat boltja nincs kiválasztva
  const jysk = R.recommend(slot, ctxFor(slot, ['jysk']));
  assert.equal(slot.options[jysk.idx].store, 'jysk'); assert.deepEqual(jysk.reason.primaryBlocked, ['store']);
  // nem fér be → a befér­ő előre kerül
  const small = R.recommend(slot, ctxFor(slot, ALL_STORES, { fits: o => o.w <= 205 }));
  assert.ok(slot.options[small.idx].w <= 205); assert.deepEqual(small.reason.primaryBlocked, ['fit']);
});

test('R05: „legolcsóbb” csak a vizsgált, megfelelő termékek közül', () => {
  const slot = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'coffee');
  const absolute = slot.options.reduce((b, o) => o.price < b.price ? o : b);
  const { eligible } = R.filterSlot(slot, ctxFor(slot, ['jysk']));
  const c = R.cheapest(eligible);
  assert.equal(c.o.store, 'jysk');
  assert.notEqual(c.o.vid, absolute.vid, 'a kizárt (más boltbeli) olcsóbb termék nem számít');
  assert.equal(c.o.price, Math.min(...eligible.map(e => e.o.price)));
});

test('R05: bizonytalan adatok felsorolása', () => {
  const o = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'sofa').options[0];   // VISKAFORS: magasság hiányzik
  const u = R.uncertainties(o, 'unverified');
  assert.ok(u.includes('priceUnverified')); assert.ok(u.includes('heightMissing'));
  assert.ok(!R.uncertainties(o, 'fresh').includes('priceUnverified'));
});

// ---- R02: kerethez igazítás egy egyszerű, ellenőrizhető költségmodellel ----
const opt = (name, price) => ({ name, price });
function model(slots, placeFail = () => false) {
  return plan => {
    let total = 0; const placed = {};
    for (const s of slots) { if (plan.off.has(s.id)) continue; const o = s.options[plan.sel[s.id]];
      if (placeFail(s.id, o)) continue;                // pl. a nagyobb olcsóbb változat nem fér el
      placed[s.id] = plan.qty[s.id]; total += o.price * plan.qty[s.id]; }
    return { total, placed };
  };
}
const room = () => [
  { id: 'sofa', role: 'required', on: true, sel: 0, qty: 1, options: [opt('drága kanapé', 300000), opt('közepes kanapé', 200000), opt('olcsó kanapé', 120000)], candidates: [0, 1, 2] },
  { id: 'chair', role: 'optional', on: true, sel: 0, qty: 1, options: [opt('fotel', 60000), opt('olcsó fotel', 30000)], candidates: [0, 1] },
  { id: 'cushion', role: 'optional', on: true, sel: 0, qty: 2, minQty: 1, options: [opt('párna', 5000)], candidates: [0] },
  { id: 'vase', role: 'optional', on: true, sel: 0, qty: 1, options: [opt('váza', 8000)], candidates: [0] }
];

test('R02: előbb olcsóbb megfelelő változat — a legkisebb elégséges lépéssel, semmi nem esik ki', () => {
  const slots = room(), r = R.fitBudget({ slots, budget: 290000, evaluate: model(slots) });
  assert.equal(r.ok, true); assert.ok(r.total <= 290000);
  assert.deepEqual(r.changes.map(c => c.type), ['swap']);
  assert.equal(r.changes[0].toName, 'közepes kanapé', 'nem ugrik feleslegesen a legolcsóbbra');
  assert.equal(r.plan.off.size, 0);
});

test('R02: sorrend — változat, majd darabszám, végül opcionális tétel; a kötelező soha nem esik ki', () => {
  const slots = room(), r = R.fitBudget({ slots, budget: 155000, evaluate: model(slots) });
  const types = r.changes.map(c => c.type);
  assert.ok(types.indexOf('swap') < types.indexOf('qty') || !types.includes('qty'));
  assert.ok(!r.plan.off.has('sofa'));
  assert.ok(r.changes.filter(c => c.type === 'drop').every(c => c.role === 'optional'));
  assert.equal(r.ok, true, JSON.stringify(r.changes));
  const q = r.changes.find(c => c.type === 'qty'); assert.ok(q && q.to >= 1);
});

test('R02: ha a fő funkció megtartásával nincs megoldás, kimondja (mennyivel lóg ki, mi tartja fenn)', () => {
  const slots = room(), r = R.fitBudget({ slots, budget: 50000, evaluate: model(slots) });
  assert.equal(r.ok, false); assert.equal(r.over, r.total - 50000); assert.ok(r.over > 0);
  assert.ok(!r.plan.off.has('sofa'), 'a kanapé marad');
  assert.deepEqual(r.blockers.map(b => b.slot), ['sofa']);
  assert.equal(r.plan.sel.sofa, 2, 'a kötelező tételből a legolcsóbb megfelelő');
});

test('R02: zárolt tétel érintetlen; a felhasználó által állított darabszám sem változik', () => {
  const slots = room(); slots[0].locked = true; slots[2].qtyLocked = true;
  const r = R.fitBudget({ slots, budget: 290000, evaluate: model(slots) });
  assert.equal(r.plan.sel.sofa, 0); assert.ok(!r.changes.some(c => c.slot === 'sofa'));
  assert.ok(!r.changes.some(c => c.slot === 'cushion' && c.type === 'qty'));
  assert.equal(r.ok, false); assert.deepEqual(r.blockers, [{ slot: 'sofa', role: 'required', locked: true, name: 'drága kanapé' }]);
});

test('R02: olyan csere, amelytől egy bútor kiszorulna az alaprajzról, nem jöhet létre', () => {
  const slots = room(), r = R.fitBudget({ slots, budget: 260000, evaluate: model(slots, (id, o) => id === 'sofa' && o.name === 'közepes kanapé') });
  assert.notEqual(r.plan.sel.sofa, 1, 'a „közepes” nem fér el → kihagyva');
  for (const c of r.changes.filter(c => c.type === 'swap')) assert.notEqual(c.toName, 'közepes kanapé');
});

test('R02: keret alatt nincs változtatás', () => {
  const slots = room(), r = R.fitBudget({ slots, budget: 1e9, evaluate: model(slots) });
  assert.equal(r.ok, true); assert.deepEqual(r.changes, []);
});

test('R06: nem kiválasztott termék megtalálható névvel (ékezet nélkül is) a teljes engedélyezett katalógusban', () => {
  const items = CAT.allItems(), slot = CAT.slotsFor('nappali', 'modern').find(s => s.id === 'sofa');
  const target = slot.options.find(o => o.vid !== slot.primaryVid && o.store === 'jysk');
  const word = target.name.split(/\s+/).find(w => w.length > 4 && /[A-ZÁÉÍÓÖŐÚÜŰ]{3,}/.test(w)) || target.name.split(/\s+/)[0];
  const hits = R.search(items, { q: R.fold(word), stores: ALL_STORES }, { categories: RAW.categories });
  assert.ok(hits.some(h => h.vid === target.vid), `${word} → ${target.vid}`);
});

test('R06: bolt-, méret- és árszűrés; tiltott bolt és megszűnt termék nem jelenik meg', () => {
  const items = CAT.allItems(), cats = { categories: RAW.categories };
  const momax = R.search(items, { stores: ['momax'] }, cats);
  assert.ok(momax.length > 0 && momax.every(o => o.store === 'momax'));
  const narrow = R.search(items, { stores: ALL_STORES, category: 'sofa', maxW: 205 }, cats);
  assert.ok(narrow.length > 0 && narrow.every(o => o.category === 'sofa' && o.w <= 205));
  const cheap = R.search(items, { stores: ALL_STORES, maxPrice: 10000, minPrice: 5000 }, cats);
  assert.ok(cheap.length > 0 && cheap.every(o => o.price >= 5000 && o.price <= 10000));
  const gone = items[0], withGone = [withCheck(gone, { status: 'gone' }), ...items.slice(1)];
  assert.ok(!R.search(withGone, { stores: ALL_STORES }, cats).some(o => o.vid === gone.vid));
  assert.ok(!R.search(items, { stores: ALL_STORES }, cats).some(o => RAW.categories[o.category].accessoryOnly), 'csak kiegészítő (tartozék) nem önálló találat');
});

test('R02: visszaépítés — ha egy későbbi csere után a jobb változat is belefér, nem marad feleslegesen a legolcsóbb', () => {
  const slots = room(); slots[1].options = [opt('drága fotel', 150000), opt('olcsó fotel', 40000)];
  // indulás: 300 000 + 150 000 + 2 × 5 000 + 8 000 = 468 000 Ft
  const r = R.fitBudget({ slots, budget: 260000, evaluate: model(slots) });
  assert.equal(r.ok, true);
  assert.equal(r.plan.sel.sofa, 1, 'a kanapé a közepes változaton áll, nem a legolcsóbbon');
  assert.equal(r.plan.sel.chair, 1); assert.equal(r.total, 258000);
  assert.deepEqual(r.changes.map(c => [c.type, c.slot, c.toName]), [['swap', 'sofa', 'közepes kanapé'], ['swap', 'chair', 'olcsó fotel']]);
  assert.equal(r.changes[0].saving, 100000, 'a megtakarítás: amennyivel a visszavonás drágítana');
});
