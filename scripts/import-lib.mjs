// DREAMR — bolti feed import: ellenőrzés, átalakítás, karantén, összefésülés, atomikus csere (4. szakasz, F03–F04).
import { readFile, writeFile, rename, mkdir, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parseHeurekaXml } from './adapters/heureka-xml.mjs';
import { validate } from '../tools/schema-check.mjs';
const require = createRequire(import.meta.url);
const DRCatalog = require('../catalog.js');

export const ADAPTERS = { 'heureka-xml': parseHeurekaXml };
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
const cmOf = v => { if (v == null) return null; const m = String(v).replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(mm|cm|m)?\b/i); if (!m) return null;
  const n = +m[1], u = (m[2] || 'cm').toLowerCase(); return Math.round(u === 'mm' ? n / 10 : u === 'm' ? n * 100 : n); };
const firstParam = (params, names) => { for (const n of names || []) if (params[n] != null && params[n] !== '') return params[n]; return null; };

// Titok elrejtése minden kimenő szövegből (napló, hiba, jelentés)
export function maskSecret(text, ...secrets) {
  let s = String(text);
  for (const x of secrets) if (x && String(x).length >= 6) s = s.split(String(x)).join('***');
  return s.replace(/([?&](?:key|token|apikey|api_key|hash|auth)=)[^&\s"']+/gi, '$1***');
}

// Kategória: a CATEGORYTEXT legjobban (leghosszabban) egyező kulcsa. Ékezetfüggetlen összevetés, mert a magyar
// toldalékolás ékezetet változtat (díszpárna → díszpárnák, váza → vázák, lámpa → lámpák).
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function mapCategory(categoryText, map) {
  if (!categoryText) return null;
  const text = fold(categoryText); let best = null;
  for (const [k, v] of Object.entries(map || {})) if (!k.startsWith('_') && text.includes(fold(k)) && (!best || k.length > best[0].length)) best = [k, v];
  return best ? best[1] : null;
}

// Egy nyers feedtétel → katalógusváltozat, vagy karantén-ok(ok)
export function toVariant(raw, cfg, catalog, now) {
  const reasons = [], day = now.slice(0, 10), src = `feed:${cfg.store} ${day}`;
  const cat = mapCategory(raw.categoryText, cfg.categoryMap);
  if (!raw.itemId) reasons.push('hiányzó ITEM_ID');
  if (!raw.productName && !raw.product) reasons.push('hiányzó terméknév');
  if (!raw.url || !/^https:\/\//.test(raw.url)) reasons.push('hiányzó vagy nem https termékoldal-link');
  const currency = raw.currency || cfg.currency;
  if (currency !== 'HUF') reasons.push(`nem forint ár (${currency})`);
  if (!(raw.priceVat > 0)) reasons.push('hiányzó vagy érvénytelen ár');
  if (!cat) reasons.push(`ismeretlen kategória: ${raw.categoryText || '—'}`);
  else if (!catalog.categories[cat]) reasons.push(`a kategória nincs a katalógusban: ${cat}`);
  else if (cfg.pilot && cfg.pilot.categories && !cfg.pilot.categories.includes(cat)) reasons.push(`nem pilotkategória: ${cat}`);
  const w = cmOf(firstParam(raw.params, cfg.params?.width)), d = cmOf(firstParam(raw.params, cfg.params?.depth)), h = cmOf(firstParam(raw.params, cfg.params?.height));
  // tervezéshez kötelező alapterület: minden, ami az alaprajzra kerül (bútor, szőnyeg, lámpa…)
  const needsFootprint = cat && catalog.categories[cat] && (catalog.categories[cat].plan != null || ['furniture', 'rug'].includes(catalog.categories[cat].floor));
  if (needsFootprint && (!w || !d)) reasons.push('hiányzó szélesség/mélység — tervezéshez kötelező');
  if ((w || d || h) && !cfg.usage?.dimensionsAllowed) reasons.push('a méretadat felhasználását a használati keret nem engedi');
  if (reasons.length) return { reasons };

  const packRaw = firstParam(raw.params, cfg.params?.salesUnit), pack = packRaw ? Math.max(1, parseInt(String(packRaw), 10) || 1) : null;
  const group = slug(raw.groupId || raw.itemId), item = slug(raw.itemId);
  const field = (value, extra = {}) => value == null ? { value: null, status: 'missing' } : { value, status: 'verified', source: src, checkedAt: day, ...extra };
  const name = raw.productName || raw.product;
  const variant = {
    id: `${cat}.${slug(cfg.store)}-${group}.${item}`,
    legacyKeys: [], store: cfg.store, sku: String(raw.itemId),
    name: { hu: name }, label: { hu: '' },
    storeName: field(name),
    urls: { canonical: raw.url, buy: raw.url },
    basePrice: { amount: Math.round(raw.priceVat), currency: 'HUF', basis: 'salesUnit', status: 'verified', source: src, checkedAt: day },
    dimensions: { unit: 'cm', width: w ? field(w) : { value: w ?? 0, status: 'missing' }, depth: d ? field(d) : { value: d ?? 0, status: 'missing' },
      height: field(h), open: null, wallMounted: { value: false, status: 'estimated', source: null } },
    package: { status: 'missing' },
    attributes: {
      material: field(firstParam(raw.params, cfg.params?.material)), color: field(firstParam(raw.params, cfg.params?.color)),
      storeCategory: field(raw.categoryText), availability: field(raw.deliveryDate != null ? (String(raw.deliveryDate) === '0' ? 'InStock' : `Szállítás ${raw.deliveryDate} nap`) : null),
      offerPeriod: { value: null, status: 'missing' }
    },
    image: cfg.usage?.imagesAllowed && /^https:\/\//.test(raw.imgUrl || '')
      ? { url: raw.imgUrl, status: 'unchecked', source: src, checkedAt: day, productMatch: true, license: { status: 'permitted', owner: cfg.store, note: `Partneri megállapodás: ${cfg.usage.agreementRef}` } }
      : { url: null, status: 'missing' },
    sale: pack ? { unit: pack > 1 ? 'csomag' : 'db', pack, source: src } : null,
    requires: []
  };
  return { variant, category: cat, groupId: group, productName: name.split(',')[0] };
}

// Az egész feed feldolgozása: elfogadott termékek + karantén (soronként okkal)
export function processFeed(xml, cfg, catalog, now = new Date().toISOString()) {
  const parse = ADAPTERS[cfg.adapter]; if (!parse) throw new Error(`ismeretlen adapter: ${cfg.adapter}`);
  const { items, errors } = parse(xml);
  const accepted = [], quarantine = [], seen = new Set();
  for (const raw of items) {
    if (raw.itemId && seen.has(raw.itemId)) { quarantine.push({ position: raw.position, itemId: raw.itemId, reasons: ['ismétlődő ITEM_ID a feedben'] }); continue; }
    if (raw.itemId) seen.add(raw.itemId);
    const r = toVariant(raw, cfg, catalog, now);
    if (r.reasons) quarantine.push({ position: raw.position, itemId: raw.itemId, name: raw.productName || raw.product, reasons: r.reasons });
    else accepted.push(r);
  }
  const limited = cfg.pilot?.maxVariants ? accepted.slice(0, cfg.pilot.maxVariants) : accepted;
  accepted.slice(limited.length).forEach(a => quarantine.push({ itemId: a.variant.sku, name: a.variant.name.hu, reasons: [`a pilot keretén felül (${cfg.pilot.maxVariants})`] }));
  return { parsed: items.length, structureErrors: errors, accepted: limited, quarantine };
}

// Összefésülés a katalógussal — idempotens: ugyanaz a feed kétszer ugyanazt adja (azonosító = bolt + ITEM_ID).
// A korábbi jóváhagyás (review) megmarad; a feedből eltűnt tétel nem törlődik (mentett tervek, választék!),
// hanem „megszűnt” jelölést kap (missingSince).
export function mergeIntoCatalog(catalog, cfg, accepted, now = new Date().toISOString()) {
  const cat = JSON.parse(JSON.stringify(catalog));
  const mine = p => p.source && p.source.feed === cfg.store;
  const old = new Map(cat.products.filter(mine).map(p => [p.id, p]));
  const keep = cat.products.filter(p => !mine(p));
  const byProduct = new Map();
  for (const a of accepted) {
    const pid = a.variant.id.split('.').slice(0, 2).join('.');
    if (!byProduct.has(pid)) {
      const prev = old.get(pid);
      byProduct.set(pid, { id: pid, category: a.category, family: a.productName.split(' ')[0], name: { hu: a.productName },
        source: { feed: cfg.store, importedAt: now }, review: prev?.review || { status: 'pending' }, variants: [] });
    }
    byProduct.get(pid).variants.push(a.variant);
  }
  // eltűnt tételek: megmaradnak, jelölve
  for (const [pid, p] of old) {
    const cur = byProduct.get(pid), ids = new Set((cur?.variants || []).map(v => v.id));
    const gone = p.variants.filter(v => !ids.has(v.id)).map(v => ({ ...v, missingSince: v.missingSince || now.slice(0, 10) }));
    if (!gone.length) continue;
    if (cur) cur.variants.push(...gone); else byProduct.set(pid, { ...p, variants: gone });
  }
  cat.products = [...keep, ...byProduct.values()];
  return cat;
}

// Ellenőrzött, atomikus csere: csak a teljesen ellenőrzött új katalógus lép a régi helyére (átnevezéssel).
export async function writeCatalogAtomic(file, catalog, schema, legacy, { crashAfterTemp = false } = {}) {
  const errs = validate(schema, catalog);
  if (errs.length) throw new Error('az új katalógus nem felel meg a sémának: ' + errs.slice(0, 5).join('; '));
  DRCatalog.fromJSON(catalog, legacy);                    // hivatkozások ellenőrzése (dob, ha hibás)
  const tmp = file + '.uj';
  await writeFile(tmp, JSON.stringify(catalog, null, 1) + '\n');
  if (crashAfterTemp) throw new Error('szimulált megszakadás az ideiglenes fájl után');
  await rename(tmp, file);                                // atomikus csere ugyanazon a köteten
}

export async function readJSON(f) { return JSON.parse(await readFile(f, 'utf8')); }
export async function ensureDir(d) { await mkdir(d, { recursive: true }); }
export async function removeIfExists(f) { try { await unlink(f); } catch {} }
