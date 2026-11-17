// DREAMR — F02: a partner mintafájljának mezőlefedettsége (mi hiányzik a saját adatmodellhez képest).
// Futtatás:  node scripts/feed-gap-report.mjs --file <minta.xml> [--feed kondela] [--out .feed-work/gap-kondela.md]
// A kimenet partneri adatot tartalmazhat (kategórianevek, paraméternevek) — alapból a .feed-work/ mappába ír (nincs a Gitben).
import { readFile, writeFile } from 'node:fs/promises';
import { ADAPTERS, mapCategory, ensureDir } from './import-lib.mjs';

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FILE = arg('file'), FEED = arg('feed', 'kondela'), OUT = arg('out', `.feed-work/gap-${FEED}.md`);
if (!FILE) { console.error('Használat: node scripts/feed-gap-report.mjs --file <minta.xml> [--feed kondela]'); process.exit(1); }
const cfg = JSON.parse(await readFile(arg('config', 'scripts/feeds.config.json'), 'utf8')).feeds[FEED];
const catalog = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const { items, errors } = ADAPTERS[cfg.adapter](await readFile(FILE, 'utf8'));
const pctOf = (c, total) => `${c} / ${total} (${total ? Math.round(c / total * 100) : 0}%)`, pct = c => pctOf(c, items.length);
const cell = s => String(s).split('|').join('\\|');   // a „|” a bolti kategórianevekben ne törje a táblázatot
const has = (f) => items.filter(f).length;
const param = names => it => (names || []).some(k => it.params[k] != null && it.params[k] !== '');
const paramNames = {}; items.forEach(it => Object.keys(it.params).forEach(k => { paramNames[k] = (paramNames[k] || 0) + 1; }));
const cats = {}; items.forEach(it => { const c = it.categoryText || '—'; cats[c] = cats[c] || { n: 0, mapped: mapCategory(it.categoryText, cfg.categoryMap) }; cats[c].n++; });
const plannable = it => { const c = mapCategory(it.categoryText, cfg.categoryMap); return c && catalog.categories[c] && (catalog.categories[c].plan != null || ['furniture', 'rug'].includes(catalog.categories[c].floor)); };

const rows = [
  ['Azonosító (ITEM_ID)', 'kötelező', has(i => i.itemId)], ['Termékcsoport (ITEMGROUP_ID) — változatokhoz', 'ajánlott', has(i => i.groupId)],
  ['Terméknév', 'kötelező', has(i => i.productName || i.product)], ['Termékoldal-link (https)', 'kötelező', has(i => /^https:/.test(i.url || ''))],
  ['Ár (PRICE_VAT)', 'kötelező', has(i => i.priceVat > 0)], ['Pénznem HUF (vagy alapértelmezett)', 'kötelező', has(i => (i.currency || cfg.currency) === 'HUF')],
  ['Kategória → DREAMR-kategória', 'kötelező', has(i => mapCategory(i.categoryText, cfg.categoryMap))],
  ['Szélesség', 'kötelező (alaprajz)', has(param(cfg.params.width))], ['Mélység', 'kötelező (alaprajz)', has(param(cfg.params.depth))],
  ['Magasság', 'ajánlott (3D)', has(param(cfg.params.height))], ['Vásárlási egység / kiszerelés', 'kötelező (költség)', has(param(cfg.params.salesUnit))],
  ['Kép (IMGURL)', 'engedélytől függ', has(i => /^https:/.test(i.imgUrl || ''))], ['Készlet / szállítási idő', 'ajánlott', has(i => i.deliveryDate != null)],
  ['Szín', 'ajánlott', has(param(cfg.params.color))], ['Anyag', 'ajánlott', has(param(cfg.params.material))]
];
const planItems = items.filter(plannable);
let md = `# Mezőlefedettség — ${FEED} mintafájl\n\nFájl: ${FILE} · tételek: ${items.length}${errors.length ? ` · szerkezeti hiba: ${errors.join('; ')}` : ''}\n\n| Adat | Szükséglet | Lefedettség |\n|---|---|---|\n`;
rows.forEach(([a, b, c]) => { md += `| ${a} | ${b} | ${pct(c)}${c < items.length && /kötelező/.test(b) ? ' ⚠️' : ''} |\n`; });
md += `\n**Alaprajzra kerülő tételeknél** (${planItems.length} db) szélesség+mélység mindkettő: ${pctOf(planItems.filter(i => param(cfg.params.width)(i) && param(cfg.params.depth)(i)).length, planItems.length)}\n`;
md += `\n## Kategóriák (CATEGORYTEXT → DREAMR)\n\n| Bolti kategória | Tétel | DREAMR |\n|---|---|---|\n${Object.entries(cats).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `| ${cell(k)} | ${v.n} | ${v.mapped || '❌ nincs leképezve'} |`).join('\n')}\n`;
md += `\n## Paraméternevek a feedben (a params-térképhez)\n\n${Object.entries(paramNames).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- nincs'}\n`;
await ensureDir(OUT.replace(/[\\/][^\\/]+$/, '') || '.'); await writeFile(OUT, md);
console.log(md);
