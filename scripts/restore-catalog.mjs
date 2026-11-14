// DREAMR — katalógus visszaállítása egy korábbi, Gitben tárolt pillanatképre (4. szakasz, F04/F06).
// Futtatás:  node scripts/restore-catalog.mjs --ref <commit|ág|HEAD~1> [--catalog data/catalog.json]
// Minden import külön commit, így bármelyik korábbi jó állapot visszahozható. A visszaállított katalógus
// ugyanúgy séma- és hivatkozás-ellenőrzésen megy át, és atomikusan cseréli a jelenlegit.
import { execFileSync } from 'node:child_process';
import { writeCatalogAtomic, readJSON } from './import-lib.mjs';

const arg = (n, d = null) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const REF = arg('ref'), CATALOG = arg('catalog', 'data/catalog.json'), PATH = arg('path', 'data/catalog.json');
if (!REF) { console.error('Használat: node scripts/restore-catalog.mjs --ref <commit>'); process.exit(1); }
if (!/^[\w./~^-]+$/.test(REF)) { console.error('Érvénytelen hivatkozás: ' + REF); process.exit(1); }

const snapshot = JSON.parse(execFileSync('git', ['show', `${REF}:${PATH}`], { encoding: 'utf8', maxBuffer: 200 * 1024 * 1024 }));
const current = await readJSON(CATALOG).catch(() => null);
await writeCatalogAtomic(CATALOG, snapshot, await readJSON('schemas/product.schema.json'), await readJSON('data/legacy-v1.json').catch(() => null));
const count = c => c ? c.products.reduce((a, p) => a + p.variants.length, 0) : 0;
console.log(`VISSZAÁLLÍTVA  ${CATALOG} ← ${REF}  (változatok: ${count(current)} → ${count(snapshot)})`);
