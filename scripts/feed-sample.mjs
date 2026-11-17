// DREAMR — F05: kézi mintavételi lista az importált (jóváhagyásra váró) feedtermékekből.
// Futtatás:  node scripts/feed-sample.mjs --feed kondela [--n 30] [--seed 2026]
// Kimenet: .feed-work/minta-ellenorzes-<feed>.md — pipálható lista (kategória, ár, méret, változat, kép, link).
// A kezdőajánlatnak szánt termékek mindig bekerülnek a mintába. A jóváhagyás a katalógusban: product.review.status = "approved".
import { readFile, writeFile } from 'node:fs/promises';
import { ensureDir } from './import-lib.mjs';

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FEED = arg('feed', 'kondela'), N = +arg('n', 30); let seed = +arg('seed', 2026);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;   // ismételhető minta
const cat = JSON.parse(await readFile(arg('catalog', 'data/catalog.json'), 'utf8'));
const products = cat.products.filter(p => p.source?.feed === FEED);
const pool = products.flatMap(p => p.variants.filter(v => !v.missingSince).map(v => ({ p, v })));
const primaryIds = new Set(Object.values(cat.assortment.primary.roomStyle).flatMap(s => Object.values(s).flatMap(Object.values)));
const must = pool.filter(x => primaryIds.has(x.v.id));
const rest = pool.filter(x => !primaryIds.has(x.v.id)).sort(() => rnd() - 0.5).slice(0, Math.max(0, N - must.length));
const sample = [...must, ...rest];
const d = v => `${v.dimensions.width.value ?? '?'} × ${v.dimensions.depth.value ?? '?'}${v.dimensions.height.value ? ' × ' + v.dimensions.height.value : ''} cm`;
let md = `# Kézi mintavétel — ${FEED}\n\nFeedtermék-változat: ${pool.length} · minta: ${sample.length} (ebből kezdőajánlat: ${must.length})\n\n` +
  `Minden sornál a bolti oldalon ellenőrizd: kategória · ár · méret · változat (szín/méret) · kép · link. Kritikus eltérés = rossz termék, rossz ár, rossz méret, rossz változat.\n\n` +
  `| # | Változat | Kategória | Ár | Méret | Kép | Link | ✔/✖ | Megjegyzés |\n|---|---|---|---|---|---|---|---|---|\n`;
sample.forEach((x, i) => { md += `| ${i + 1}${primaryIds.has(x.v.id) ? ' (kezdő)' : ''} | ${x.v.name.hu} \`${x.v.id}\` | ${x.p.category} | ${x.v.basePrice.amount.toLocaleString('hu-HU')} Ft | ${d(x.v)} | ${x.v.image.url ? 'van' : '—'} | ${x.v.urls.buy} |  |  |\n`; });
await ensureDir('.feed-work'); const out = `.feed-work/minta-ellenorzes-${FEED}.md`; await writeFile(out, md);
console.log(`Mintalista: ${out} (${sample.length} tétel)`);
