// DREAMR — az árkinyerés tesztjei (A02). Futtatás: node --test test/
// A minta-oldalak a valódi IKEA / JYSK / XXXL oldalak JSON-LD szerkezetét követik (2026-11-12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, offerPrice, STATUS } from '../tools/store-pages.mjs';

const ld = obj => `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body></body></html>`;
const page = (url, html, status = 200, finalUrl = url) => ({ status, finalUrl, chain: [{ url, status }], html });
const NOW = new Date('2026-11-12T12:00:00Z');

// --- IKEA ---
const IKEA_URL = 'https://www.ikea.com/hu/hu/p/lack-dohanyzoasztal-feher-90449905/';
const ikeaProduct = (sku, price, extra = {}) => ({ '@context': 'https://schema.org', '@type': 'Product', name: 'LACK Dohányzóasztal', sku, mpn: sku,
  offers: { '@type': 'Offer', price: String(price), priceCurrency: 'HUF', url: IKEA_URL, availability: 'https://schema.org/InStock', ...extra } });

test('IKEA: azonosított cikkszám → elfogadott ár', () => {
  const r = evaluate('ikea', IKEA_URL, page(IKEA_URL, ld(ikeaProduct('904.499.05', 8990))), NOW);
  assert.equal(r.status, STATUS.OK); assert.equal(r.price, 8990); assert.equal(r.sku, '904.499.05');
});

test('IKEA: 500 Ft alatti valódi ár is elfogadott (nincs önkényes alsó határ)', () => {
  const r = evaluate('ikea', IKEA_URL, page(IKEA_URL, ld(ikeaProduct('904.499.05', 390))), NOW);
  assert.equal(r.status, STATUS.OK); assert.equal(r.price, 390);
});

test('IKEA: idegen cikkszám (kapcsolódó termék) → nincs elfogadott ár', () => {
  const r = evaluate('ikea', IKEA_URL, page(IKEA_URL, ld([ikeaProduct('702.111.22', 4990), ikeaProduct('503.333.44', 12990)])), NOW);
  assert.equal(r.status, STATUS.MISMATCH); assert.equal(r.price, null);
});

test('IKEA: több termék az oldalon → a miénk ára, nem a leggyakoribb', () => {
  const html = ld([ikeaProduct('702.111.22', 4990), ikeaProduct('702.111.22', 4990), ikeaProduct('904.499.05', 8990)]);
  const r = evaluate('ikea', IKEA_URL, page(IKEA_URL, html), NOW);
  assert.equal(r.status, STATUS.OK); assert.equal(r.price, 8990);
});

test('IKEA: kategóriaoldalra irányítás (VISKAFORS eset) → megszűnt, nincs ár', () => {
  const url = 'https://www.ikea.com/hu/hu/p/viskafors-3-szemelyes-kanape-lejde-szuerke-zoeld-nyir-s29443337/';
  const cat = 'https://www.ikea.com/hu/hu/cat/termekek-products/';
  const p = { status: 200, finalUrl: cat, chain: [{ url, status: 301 }, { url: cat, status: 200 }], html: '<html><title>Termékek</title></html>' };
  const r = evaluate('ikea', url, p, NOW);
  assert.equal(r.status, STATUS.GONE); assert.equal(r.price, null);
});

test('IKEA: akciós ár — az érvényes akciós ár, az áthúzott ár külön', () => {
  const offer = { '@type': 'Offer', priceSpecification: [
    { '@type': 'UnitPriceSpecification', price: '29990', priceCurrency: 'HUF', validFrom: '2026-09-01Z', validThrough: '2026-12-29Z' },
    { '@type': 'UnitPriceSpecification', price: '36990', priceCurrency: 'HUF', priceType: 'https://schema.org/StrikethroughPrice' }] };
  assert.deepEqual(offerPrice(offer, NOW), { price: 29990, listPrice: 36990, saleUntil: '2026-12-29' });
  assert.ok(offerPrice(offer, new Date('2027-01-05T12:00:00Z')).error, 'lejárt akció után nincs elfogadott ár');
});

test('Nem forint ár → nincs elfogadott ár', () => {
  const r = evaluate('ikea', IKEA_URL, page(IKEA_URL, ld(ikeaProduct('904.499.05', 99, { priceCurrency: 'EUR' }))), NOW);
  assert.equal(r.status, STATUS.PARSE); assert.equal(r.price, null);
});

// --- JYSK ---
const JYSK_URL = 'https://jysk.hu/nappali/kanapek/kanape-gedved-3-szemelyes-szurke-szovet';
const jyskGroup = {
  '@context': 'https://schema.org', '@type': 'ProductGroup', name: 'GEDVED Kanapék', hasVariant: [
    { '@type': 'Product', name: 'GEDVED', sku: '3600407', offers: { '@type': 'Offer', url: JYSK_URL.replace(/\//g, '\/'), priceCurrency: 'HUF', price: '214900' } },
    { '@type': 'Product', name: 'GEDVED', sku: '3600394', offers: { '@type': 'Offer', url: 'https://jysk.hu/articlelookup?article=3600394#product-intro', priceCurrency: 'HUF', price: '105000 Ft' } },
    { '@type': 'Product', name: 'GEDVED', sku: '3600408', offers: { '@type': 'Offer', url: 'https://jysk.hu/articlelookup?article=3600408#product-intro', priceCurrency: 'HUF', price: '154900 Ft' } }
  ] };

test('JYSK: a termékoldalhoz tartozó változat ára, nem a többi változaté', () => {
  const r = evaluate('jysk', JYSK_URL, page(JYSK_URL, ld(jyskGroup)), NOW);
  assert.equal(r.status, STATUS.OK); assert.equal(r.price, 214900); assert.equal(r.sku, '3600407');
});

test('JYSK: ha a változat nincs az oldalon → nincs elfogadott ár', () => {
  const other = { ...jyskGroup, hasVariant: jyskGroup.hasVariant.slice(1) };
  const r = evaluate('jysk', JYSK_URL, page(JYSK_URL, ld(other)), NOW);
  assert.equal(r.status, STATUS.MISMATCH); assert.equal(r.price, null);
});

test('JYSK: kategóriaoldalra irányítás (VEJEN eset) → megszűnt, nincs ár', () => {
  const url = 'https://jysk.hu/nappali/fotelek/fotel-vejen-fekete-textilbor';
  const p = { status: 200, finalUrl: 'https://jysk.hu/nappali/fotelek', chain: [{ url, status: 302 }], html: ld({ '@type': 'CollectionPage' }) };
  const r = evaluate('jysk', url, p, NOW);
  assert.equal(r.status, STATUS.GONE); assert.equal(r.price, null);
});

test('JYSK: másik termékoldalra irányítás → nem elfogadott, kézi ellenőrzés', () => {
  const old = 'https://jysk.hu/nappali/kanapek/kanape-gedved-3-szemelyes-szurke';
  const r = evaluate('jysk', old, { status: 200, finalUrl: JYSK_URL, chain: [{ url: old, status: 301 }], html: ld(jyskGroup) }, NOW);
  assert.equal(r.status, STATUS.REDIRECT); assert.equal(r.identityConfirmed, false);
});

// --- XXXL (Mömax / Möbelix) ---
test('Mömax/Möbelix: robotszűrő (403) → blocked, nincs ár', () => {
  const url = 'https://www.moemax.hu/p/kanape-kiss-000812011601';
  const r = evaluate('momax', url, page(url, '<html><head><title>Just a moment...</title></head></html>', 403), NOW);
  assert.equal(r.status, STATUS.BLOCKED); assert.equal(r.price, null);
});

test('Mömax: ha egyszer elérhető, a termékkód egyezése kell', () => {
  const url = 'https://www.moemax.hu/p/kanape-kiss-000812011601';
  const prod = sku => ({ '@type': 'Product', name: 'Kiss kanapé', sku, offers: { '@type': 'Offer', price: '289900', priceCurrency: 'HUF' } });
  assert.equal(evaluate('momax', url, page(url, ld(prod('000812011601'))), NOW).status, STATUS.OK);
  assert.equal(evaluate('momax', url, page(url, ld(prod('000999000001'))), NOW).status, STATUS.MISMATCH);
});

// --- Hálózat ---
test('Hálózati hiba / időtúllépés → network_error', () => {
  const r = evaluate('ikea', IKEA_URL, { status: 0, finalUrl: IKEA_URL, chain: [], html: '', error: 'időtúllépés' }, NOW);
  assert.equal(r.status, STATUS.NETWORK); assert.equal(r.price, null);
});
