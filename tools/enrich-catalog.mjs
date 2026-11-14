// DREAMR — C03/C04/C05: a katalógus mezőinek kitöltése a bolti termékoldalakról, mezőnkénti forrással és állapottal.
// Futtatás:  node tools/enrich-catalog.mjs   →  frissíti a data/catalog.json-t és a reports/catalog-enrich.md-t
// Állapotok: verified (bolti adat, dátummal) · estimated (DREAMR becslés / szemléltető) · missing (nincs adat).
// Elv: méret csak akkor „verified”, ha a bolt egyértelműen közli; a tervbeli alapterület csak akkor, ha egyezik vele.
import { readFile, writeFile } from 'node:fs/promises';
import { fetchWithRetry, evaluate, ldProducts, STATUS } from './store-pages.mjs';

const TODAY = new Date().toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const text = html => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const cm = s => { const m = String(s ?? '').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*cm/); return m ? Math.round(+m[1]) : null; };
const V = (value, url, extra = {}) => ({ value, status: 'verified', source: url, checkedAt: TODAY, ...extra });

// --- bolti méretek (szó szerint) ---
function storeDims(store, page, product) {
  if (store === 'ikea') {
    const d = { width: cm(product.width), depth: cm(product.depth), height: cm(product.height), length: cm(product.length), diameter: cm(product.diameter) };
    return Object.values(d).some(x => x != null) ? d : null;
  }
  const t = text(page.html);
  const m = t.match(/Részletes Adatok[\s\S]*?Méret\s+([\s\S]{0,160})/); if (!m) return null;
  const s = m[1];
  const g = re => { const x = s.match(re); return x ? +x[1] : null; };
  const d = { width: g(/Szélesség:\s*(\d+)/) ?? g(/\bSZ\s*(\d+)/), depth: g(/Mélység:\s*(\d+)/), height: g(/Magasság:\s*(\d+)/) ?? g(/\bMA\s*(\d+)/),
    length: g(/Hosszúság:\s*(?:\d+\/)*(\d+)/) ?? g(/\bH\s*(\d+)/), diameter: g(/Átmérő:\s*(\d+)/) };
  const ext = s.match(/Hosszúság:\s*(\d+(?:\/\d+)+)\s*cm/);           // bővíthető asztal: „38/100/163”
  if (ext) { const parts = ext[1].split('/').map(Number); d.lengthClosed = parts.length > 2 ? parts[1] : parts[0]; d.length = Math.max(...parts); }
  return Object.values(d).some(x => x != null) ? d : null;
}

// --- csomagolás (IKEA: „Csomagolás N × … Szélesség: Magasság: Hosszúság: Súly:”) ---
function packages(store, page) {
  if (store !== 'ikea') return null;
  const t = text(page.html); const i = t.indexOf('Csomagolás'); if (i < 0) return null;
  const seg = t.slice(i, i + 1500), out = [];
  for (const m of seg.matchAll(/(\d+)\s*×\s*([^\d]{2,80}?)\s*[\d.]{3,}[\d.]*\s*Szélesség:\s*([\d.,]+)\s*cm\s*Magasság:\s*([\d.,]+)\s*cm\s*Hosszúság:\s*([\d.,]+)\s*cm\s*Súly:\s*([\d.,]+)\s*kg/g))
    out.push({ count: +m[1], name: m[2].trim(), width: Math.round(+m[3].replace(',', '.')), height: Math.round(+m[4].replace(',', '.')), length: Math.round(+m[5].replace(',', '.')), weightKg: +m[6].replace(',', '.') });
  return out.length ? out : null;
}

// --- anyag, szín, bolti kategória ---
function attrs(store, page, product) {
  const t = text(page.html);
  let material = product.material || null, color = product.color || null, category = product.category || null;
  if (store === 'jysk') {
    const m = t.match(/Részletes Adatok\s+Részletes Adatok\s+Anyag\s+([^]{0,120}?)\s+Anyag\b/); if (m) material = m[1].trim();
    const bc = page.html.match(/"@type":"BreadcrumbList"[\s\S]*?"itemListElement":(\[[\s\S]*?\])\}/);
    if (bc) { try { const items = JSON.parse(bc[1].replace(/\\\//g, '/')); category = items[items.length - 1]?.item?.name || items[items.length - 1]?.name || category; } catch {} }
  }
  return { material: material && String(material).slice(0, 160), color: color && String(color), category: category && String(category) };
}

// --- kép: a termék saját oldalának képe, elérhetőség-ellenőrzéssel ---
async function imageOf(store, product) {
  const img = [].concat(product.image || [])[0]; const url = img && (img.contentUrl || img.url || img);
  if (!url || typeof url !== 'string') return null;
  let ok = false, type = null;
  try { const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(15000) }); ok = r.status === 200 || r.status === 206; type = r.headers.get('content-type'); await r.arrayBuffer().catch(() => {}); } catch {}
  return { url, reachable: ok && /^image\//.test(type || ''), type };
}

const catalog = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const report = { verifiedFootprint: 0, estimatedFootprint: [], mismatch: [], noStore: [], images: { ok: 0, bad: [] }, packages: 0 };
for (const product of catalog.products) for (const v of product.variants) {
  const url = v.urls.canonical;
  if (v.store !== 'ikea' && v.store !== 'jysk') { report.noStore.push(`${v.id} (${v.store}: robotszűrő)`); continue; }
  const page = await fetchWithRetry(url); const ev = evaluate(v.store, url, page);
  if (ev.status !== STATUS.OK) { report.noStore.push(`${v.id} (${ev.status})`); await sleep(400); continue; }
  const ld = ldProducts(page.html).find(p => (v.store === 'ikea' ? String(p.sku || '').replace(/\D/g, '') === String(ev.sku).replace(/\D/g, '') : String(p.sku) === String(ev.sku))) || {};
  v.sku = ev.sku;
  if (ev.pageName) v.storeName = V(ev.pageName, url);

  // C03: méretek
  const sd = storeDims(v.store, page, ld);
  const D = v.dimensions;
  if (sd) {
    D.store = { ...sd, status: 'verified', source: url, checkedAt: TODAY };
    if (sd.height != null) D.height = V(sd.height, url);
    const W = sd.diameter ?? sd.width, L = sd.diameter ?? (sd.depth ?? sd.length);
    if (sd.lengthClosed) D.open = { width: V(sd.length, url, { note: 'kinyitva / bővítve' }), closedWidth: V(sd.lengthClosed, url) };
    const cw = D.width.value, cd = D.depth.value;
    const same = (a, b) => a != null && b != null && Math.abs(a - b) <= 1;
    if (W != null && L != null && ((same(cw, W) && same(cd, L)) || (same(cw, L) && same(cd, W)))) {
      // egyezik a bolti adattal (a tervbeli tájolás megmarad)
      D.width = V(cw, url); D.depth = V(cd, url); report.verifiedFootprint++;
    } else if (W != null && L != null) {
      report.mismatch.push(`${v.id}: terv ${cw}×${cd} cm ↔ bolt ${sd.diameter ? 'Ø' + sd.diameter : `${sd.width ?? '–'} × ${sd.depth ?? sd.length ?? '–'}`} cm`);
    } else report.estimatedFootprint.push(`${v.id}: a bolt nem ad szélesség+mélység párt`);
  } else report.estimatedFootprint.push(`${v.id}: nincs bolti méret`);
  // falra szerelés: a bolti terméknévből
  if (ev.pageName && /faliszekrény|falra szerel/i.test(ev.pageName)) D.wallMounted = V(true, url, { note: 'bolti terméknév' });

  // csomagméret (külön mező)
  const pk = packages(v.store, page);
  if (pk) { v.package = { status: 'verified', source: url, checkedAt: TODAY, parcels: pk }; report.packages++; }

  // C04: anyag, szín, bolti kategória, készlet, ajánlati időszak
  const at = attrs(v.store, page, ld);
  v.attributes.material = at.material ? V(at.material, url) : { value: null, status: 'missing' };
  v.attributes.color = at.color ? V(at.color, url) : { value: null, status: 'missing' };
  v.attributes.storeCategory = at.category ? V(at.category, url) : { value: null, status: 'missing' };
  v.attributes.availability = ev.availability ? V(ev.availability, url) : { value: null, status: 'missing' };
  v.attributes.offerPeriod = ev.saleUntil ? V({ until: ev.saleUntil, listPrice: ev.listPrice }, url) : { value: null, status: 'missing', note: 'nincs akció' };

  // C05: kép — a termék saját oldaláról, elérhetőséggel; a felhasználási feltétel külön döntés
  const im = await imageOf(v.store, ld);
  if (im) {
    v.image = { url: im.url, status: im.reachable ? 'verified' : 'unreachable', source: url, checkedAt: TODAY, productMatch: true,
      license: v.image?.license || { status: 'unsettled', owner: v.store, note: 'Bolti termékfotó; felhasználási engedély nincs rögzítve.' } };
    im.reachable ? report.images.ok++ : report.images.bad.push(v.id);
  } else { v.image = { url: null, status: 'missing' }; report.images.bad.push(v.id + ' (nincs kép az oldalon)'); }
  console.log(`${v.id.padEnd(46)} méret: ${D.width.status}${D.height.status === 'verified' ? '+mag' : ''}  csomag: ${v.package.status}  kép: ${v.image.status}`);
  await sleep(500);
}
catalog.checked = TODAY;
await writeFile('data/catalog.json', JSON.stringify(catalog, null, 1) + '\n');

const md = `# Katalógus-ellenőrzés (C03–C05)\n\nEllenőrizve: ${TODAY}\n\n` +
  `- Bolti adattal **igazolt alapterület**: ${report.verifiedFootprint} változat\n- Csomagméret igazolva: ${report.packages}\n- Elérhető, a termék saját oldaláról származó kép: ${report.images.ok}\n\n` +
  `## Eltérés a terv és a bolti méret között (becslés marad, javítandó)\n${report.mismatch.map(x => `- ${x}`).join('\n') || '- nincs'}\n\n` +
  `## Nincs egyértelmű bolti méret (becslés marad)\n${report.estimatedFootprint.map(x => `- ${x}`).join('\n') || '- nincs'}\n\n` +
  `## Bolti adat nem elérhető\n${report.noStore.map(x => `- ${x}`).join('\n') || '- nincs'}\n\n` +
  `## Kép hiányzik vagy nem elérhető\n${report.images.bad.map(x => `- ${x}`).join('\n') || '- nincs'}\n`;
await writeFile('reports/catalog-enrich.md', md);
console.log('\n' + md);
