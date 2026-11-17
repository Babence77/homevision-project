// DREAMR — bolti feedek importja (4. szakasz, F03–F04, F06)
// Futtatás:   node scripts/import-feeds.mjs [--feed kondela] [--dry-run]
// Teszteléshez (helyi mintafájl, külön katalógusfájlba):
//   node scripts/import-feeds.mjs --feed minta --config <config.json> --file <minta.xml> --catalog <katalogus-masolat.json>
//
// Biztonság:
//  - Csak az a feed fut, amelyik enabled=true ÉS van írásos megállapodás-hivatkozása (usage.agreementRef) — F01.
//  - A feed URL-je/kulcsa csak a futtatókörnyezet titkából jön (cfg.urlSecret nevű környezeti változó), és minden
//    naplóból, hibából, jelentésből ki van takarva. A böngészőbe sosem kerül (az import csak a CI-ben fut).
//  - A nyers feed és a karantén részletei a .feed-work/ mappába kerülnek, ami nincs a Gitben (.gitignore).
//  - Az új katalógus csak teljes ellenőrzés után, egy átnevezéssel (atomikusan) váltja a régit; bármilyen hiba
//    vagy túl sok karanténba került tétel esetén a korábbi jó katalógus marad.
import { appendFile, writeFile, readFile } from 'node:fs/promises';
import { processFeed, mergeIntoCatalog, writeCatalogAtomic, maskSecret, readJSON, ensureDir, removeIfExists } from './import-lib.mjs';

const arg = (name, def = null) => { const i = process.argv.indexOf('--' + name); return i > 0 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true) : def; };
const CONFIG = arg('config', 'scripts/feeds.config.json'), CATALOG = arg('catalog', 'data/catalog.json');
const FILE = arg('file'), ONLY = arg('feed'), DRY = !!arg('dry-run'), CRASH = process.env.DREAMR_IMPORT_CRASH === 'after-temp';
const WORK = '.feed-work', REPORTS = arg('reports', 'reports/feeds');
const now = new Date().toISOString();

const config = (await readJSON(CONFIG)).feeds;
const schema = await readJSON('schemas/product.schema.json');
const legacy = await readJSON('data/legacy-v1.json').catch(() => null);
let catalog = await readJSON(CATALOG);
const feeds = Object.entries(config).filter(([id]) => !ONLY || id === ONLY);
let failed = false, summaryMd = `## DREAMR feedimport — ${now.slice(0, 16).replace('T', ' ')}\n\n`;

for (const [id, cfg] of feeds) {
  const started = Date.now(), secret = cfg.urlSecret ? process.env[cfg.urlSecret] : null;
  const log = (...a) => console.log(maskSecret(a.join(' '), secret));
  if (!cfg.enabled || !cfg.usage?.agreementRef) { log(`KIHAGYVA  ${id}: nincs engedélyezve vagy nincs írásos megállapodás (${cfg.status || 'F01'})`); summaryMd += `- **${id}**: kihagyva — ${cfg.status || 'nincs engedélyezve'}\n`; continue; }
  if (!cfg.usage.linksAllowed) { log(`KIHAGYVA  ${id}: a használati keret nem engedi a termékoldalak linkelését`); continue; }
  const run = { feed: id, at: now, ok: false, parsed: 0, accepted: 0, quarantined: 0, durationMs: 0, error: null };
  try {
    // 1) Letöltés (titokból) vagy helyi mintafájl
    let xml;
    if (FILE) xml = await readFile(FILE, 'utf8');
    else {
      if (!secret) throw new Error(`hiányzó titok: ${cfg.urlSecret} (a futtatókörnyezetben kell beállítani)`);
      const res = await fetch(secret, { signal: AbortSignal.timeout(120000), headers: { 'User-Agent': 'DREAMR-feed-import/1' } });
      if (!res.ok) throw new Error(`a feed letöltése sikertelen: HTTP ${res.status}`);
      xml = await res.text();
      if (xml.length > 80 * 1024 * 1024) throw new Error('a feed túl nagy (> 80 MB)');
      if (arg('keep-raw')) { await ensureDir(WORK); await writeFile(`${WORK}/${id}-${now.slice(0, 10)}.xml`, xml); }
    }
    // 2) Feldolgozás, karantén
    const res = processFeed(xml, cfg, catalog, now);
    Object.assign(run, { parsed: res.parsed, accepted: res.accepted.length, quarantined: res.quarantine.length });
    await ensureDir(WORK);
    await writeFile(`${WORK}/quarantine-${id}.json`, JSON.stringify({ at: now, items: res.quarantine }, null, 1));
    if (res.structureErrors.length) throw new Error('szerkezeti hiba: ' + res.structureErrors.join('; '));
    const ratio = res.parsed ? res.quarantine.length / res.parsed : 1;
    if (res.accepted.length < (cfg.limits?.minItems ?? 1)) throw new Error(`túl kevés elfogadható tétel (${res.accepted.length})`);
    if (ratio > (cfg.limits?.quarantineMaxRatio ?? 0.3)) throw new Error(`túl sok karanténba került tétel: ${res.quarantine.length}/${res.parsed} (${Math.round(ratio * 100)}%)`);
    // 3) Összefésülés és atomikus csere
    const next = mergeIntoCatalog(catalog, cfg, res.accepted, now);
    if (!DRY) await writeCatalogAtomic(CATALOG, next, schema, legacy, { crashAfterTemp: CRASH });
    catalog = next; run.ok = true;
    // 4) Jelentés (nyilvános: csak összesítés és azonosítók — a nyers feed nem)
    const reasons = {}; res.quarantine.forEach(q => q.reasons.forEach(r => { const k = r.replace(/:.*$/, ''); reasons[k] = (reasons[k] || 0) + 1; }));
    log(`KÉSZ  ${id}: ${res.parsed} tétel, ${res.accepted.length} elfogadva, ${res.quarantine.length} karanténban${DRY ? ' (próbafuttatás, nem írt)' : ''}`);
    summaryMd += `- **${id}**: ✅ ${res.parsed} tétel · ${res.accepted.length} elfogadva · ${res.quarantine.length} karanténban\n${Object.entries(reasons).map(([k, n]) => `  - ${k}: ${n}`).join('\n')}\n`;
  } catch (e) {
    failed = true; run.error = maskSecret(e.message, secret);
    if (CRASH) await removeIfExists(CATALOG + '.uj');   // a megszakadt próba ideiglenes fájlja
    log(`HIBA  ${id}: ${run.error} — a korábbi katalógus változatlan`);
    summaryMd += `- **${id}**: ❌ ${run.error} — a korábbi katalógus maradt\n`;
  }
  run.durationMs = Date.now() - started;
  // F06: futási napló (nyilvános összesítés), ebből látszik a 7 egymást követő sikeres ütemezett import
  if (!DRY) {
    await ensureDir(REPORTS); const hf = `${REPORTS}/${id}-history.json`; const h = await readJSON(hf).catch(() => []); h.push(run);
    await writeFile(hf, JSON.stringify(h.slice(-60), null, 1) + '\n');
    let streak = 0; for (let i = h.length - 1; i >= 0 && h[i].ok; i--) streak++;
    summaryMd += `  - egymást követő sikeres futások: ${streak} (az éles működés feltétele: 7)\n`;
  }
}
console.log('\n' + summaryMd);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summaryMd);
process.exit(failed ? 2 : 0);
