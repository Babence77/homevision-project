// DREAMR — a feedimport tesztjei (4. szakasz, F03–F04). Futtatás: node --test test/*.test.mjs
// Kitalált mintafeeddel (test/fixtures/feeds/minta-heureka.xml) — nem valós bolti adat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile, mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { processFeed, mergeIntoCatalog, maskSecret, mapCategory } from '../scripts/import-lib.mjs';
const require = createRequire(import.meta.url);
const DR = require('../catalog.js');

const XML = await readFile('test/fixtures/feeds/minta-heureka.xml', 'utf8');
const CFGFILE = 'test/fixtures/feeds/minta.config.json';
const CFG = JSON.parse(await readFile(CFGFILE, 'utf8')).feeds.minta;
const CATALOG = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const LEGACY = JSON.parse(await readFile('data/legacy-v1.json', 'utf8'));
const NOW = '2026-11-14T06:00:00.000Z';
const sha = async f => createHash('sha256').update(await readFile(f)).digest('hex');
const feedVariants = cat => cat.products.filter(p => p.source?.feed === 'kondela').flatMap(p => p.variants);

async function tempCatalog() {
  const dir = await mkdtemp(join(tmpdir(), 'dreamr-import-'));
  const file = join(dir, 'catalog.json'); await copyFile('data/catalog.json', file);
  return { dir, file };
}
const runCli = (args, env = {}) => spawnSync(process.execPath, ['scripts/import-feeds.mjs', ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

test('F03: mezőellenőrzés — 5 jó tétel elfogadva, 5 hibás karanténban, okkal', () => {
  const r = processFeed(XML, CFG, CATALOG, NOW);
  assert.equal(r.parsed, 10);
  assert.deepEqual(r.accepted.map(a => a.variant.sku), ['MINTA-1001', 'MINTA-2001', 'MINTA-2002', 'MINTA-3001', 'MINTA-4001']);
  const why = Object.fromEntries(r.quarantine.map(q => [q.itemId + (q.reasons[0].startsWith('ismétlődő') ? '#dup' : ''), q.reasons.join('; ')]));
  assert.match(why['MINTA-9001'], /hiányzó vagy érvénytelen ár/);
  assert.match(why['MINTA-9002'], /nem forint ár \(EUR\)/);
  assert.match(why['MINTA-9003'], /hiányzó szélesség\/mélység/);
  assert.match(why['MINTA-9004'], /ismeretlen kategória/);
  assert.match(why['MINTA-1001#dup'], /ismétlődő ITEM_ID/);
});

test('F03: egység- és kategóriaátalakítás (mm → cm, szóközös ár, kiszerelés, változatcsoport)', () => {
  const r = processFeed(XML, CFG, CATALOG, NOW), by = Object.fromEntries(r.accepted.map(a => [a.variant.sku, a]));
  const ova = by['MINTA-3001'].variant;
  assert.equal(ova.dimensions.width.value, 110); assert.equal(ova.basePrice.amount, 34990);
  assert.equal(by['MINTA-4001'].variant.sale.pack, 2);
  assert.equal(mapCategory('Bútor | Nappali | Kanapék', CFG.categoryMap), 'sofa');
  assert.equal(mapCategory('Lakástextil | Díszpárnák', CFG.categoryMap), 'cushion', 'toldalékolt alak (párna → párnák) is egyezik');
  const nora = [by['MINTA-2001'].variant.id, by['MINTA-2002'].variant.id];
  assert.equal(nora[0].split('.').slice(0, 2).join('.'), nora[1].split('.').slice(0, 2).join('.'), 'a két szín egy termék két változata');
});

test('F03: engedélyezett képlink — képengedély nélkül nincs kép', () => {
  const ok = processFeed(XML, CFG, CATALOG, NOW).accepted[0].variant.image;
  assert.equal(ok.license.status, 'permitted');
  const no = processFeed(XML, { ...CFG, usage: { ...CFG.usage, imagesAllowed: false } }, CATALOG, NOW).accepted[0].variant.image;
  assert.deepEqual(no, { url: null, status: 'missing' });
});

test('F03: kétszeri import nem hoz létre duplikációt (azonos eredmény)', () => {
  const r = processFeed(XML, CFG, CATALOG, NOW);
  const once = mergeIntoCatalog(CATALOG, CFG, r.accepted, NOW), twice = mergeIntoCatalog(once, CFG, r.accepted, NOW);
  assert.equal(feedVariants(once).length, 5); assert.equal(feedVariants(twice).length, 5);
  assert.deepEqual(twice, once);
  DR.fromJSON(twice, LEGACY);   // betölthető, hivatkozásai épek
});

test('F03: a jóváhagyás megmarad, a feedből eltűnt tétel nem törlődik, hanem jelölést kap', () => {
  const r = processFeed(XML, CFG, CATALOG, NOW);
  const a = mergeIntoCatalog(CATALOG, CFG, r.accepted, NOW);
  const sofa = a.products.find(p => p.source?.feed === 'kondela' && p.category === 'sofa'); sofa.review = { status: 'approved', by: 'teszt' };
  const b = mergeIntoCatalog(a, CFG, r.accepted.filter(x => x.variant.sku !== 'MINTA-2002'), '2026-11-15T06:00:00.000Z');
  assert.equal(b.products.find(p => p.id === sofa.id).review.status, 'approved');
  const gone = feedVariants(b).find(v => v.sku === 'MINTA-2002');
  assert.equal(gone.missingSince, '2026-11-15');
});

test('F03: az importált (még jóvá nem hagyott) termék nem kerül automatikusan a tervezőbe', () => {
  const r = processFeed(XML, CFG, CATALOG, NOW), next = mergeIntoCatalog(CATALOG, CFG, r.accepted, NOW);
  const opts = DR.fromJSON(next, LEGACY).slotsFor('nappali', 'modern').flatMap(s => s.options.map(o => o.vid));
  assert.ok(!opts.some(id => id.includes('kondela-')));
});

test('F03/F04: parancssorból kétszer futtatva sincs duplikáció', async () => {
  const { dir, file } = await tempCatalog();
  for (let i = 0; i < 2; i++) { const p = runCli(['--feed', 'minta', '--config', CFGFILE, '--file', 'test/fixtures/feeds/minta-heureka.xml', '--catalog', file, '--reports', dir]); assert.equal(p.status, 0, p.stdout + p.stderr); }
  assert.equal(feedVariants(JSON.parse(await readFile(file, 'utf8'))).length, 5);
  assert.equal(JSON.parse(await readFile(join(dir, 'minta-history.json'), 'utf8')).length, 2, 'két futás a naplóban');
});

test('F04: félbeszakadt import után a korábbi jó katalógus marad (atomikus csere)', async () => {
  const { dir, file } = await tempCatalog(), before = await sha(file);
  const p = runCli(['--feed', 'minta', '--config', CFGFILE, '--file', 'test/fixtures/feeds/minta-heureka.xml', '--catalog', file, '--reports', dir], { DREAMR_IMPORT_CRASH: 'after-temp' });
  assert.equal(p.status, 2); assert.match(p.stdout, /a korábbi katalógus változatlan/);
  assert.equal(await sha(file), before);
  await assert.rejects(access(file + '.uj'), 'nem maradt ideiglenes fájl');
});

test('F04: túl sok karanténba került tétel → nincs írás, hibás futás', async () => {
  const { dir, file } = await tempCatalog(), before = await sha(file);
  const strict = JSON.parse(await readFile(CFGFILE, 'utf8')); strict.feeds.minta.limits.quarantineMaxRatio = 0.1;
  const cf = join(dir, 'strict.json'); await writeFile(cf, JSON.stringify(strict));
  const p = runCli(['--feed', 'minta', '--config', cf, '--file', 'test/fixtures/feeds/minta-heureka.xml', '--catalog', file, '--reports', dir]);
  assert.equal(p.status, 2); assert.match(p.stdout, /túl sok karanténba került tétel: 5\/10/);
  assert.equal(await sha(file), before);
});

test('F04: a titok (feed-kulcs) nem jelenik meg a kimenetben', async () => {
  const { dir, file } = await tempCatalog();
  const SECRET = 'https://feed.invalid/export.xml?key=SZUPERTITOK-12345';
  const p = runCli(['--feed', 'minta', '--config', CFGFILE, '--catalog', file, '--reports', dir], { FEED_MINTA_URL: SECRET });
  const out = p.stdout + p.stderr + await readFile(join(dir, 'minta-history.json'), 'utf8');
  assert.equal(p.status, 2);
  assert.ok(!out.includes('SZUPERTITOK-12345'), 'a kulcs nem szivárog');
  assert.equal(maskSecret('hiba: ' + SECRET, SECRET), 'hiba: ***');
});

test('F06: visszaállítási próba — import után a korábbi pillanatkép ellenőrzötten visszahozható', async () => {
  const { dir, file } = await tempCatalog();
  const p = runCli(['--feed', 'minta', '--config', CFGFILE, '--file', 'test/fixtures/feeds/minta-heureka.xml', '--catalog', file, '--reports', dir]);
  assert.equal(p.status, 0); assert.equal(feedVariants(JSON.parse(await readFile(file, 'utf8'))).length, 5);
  const r = spawnSync(process.execPath, ['scripts/restore-catalog.mjs', '--ref', 'HEAD', '--catalog', file], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /VISSZAÁLLÍTVA/);
  const back = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(feedVariants(back).length, 0, 'a feedtermékek nélküli korábbi állapot jött vissza');
  DR.fromJSON(back, LEGACY);
});

test('F01: írásos megállapodás nélkül a feed nem fut (a valós beállításban egyik sem engedélyezett)', async () => {
  const { dir, file } = await tempCatalog(), before = await sha(file);
  const p = runCli(['--catalog', file, '--reports', dir]);
  assert.equal(p.status, 0); assert.match(p.stdout, /KIHAGYVA\s+kondela/); assert.match(p.stdout, /KIHAGYVA\s+bonami/);
  assert.equal(await sha(file), before);
});
