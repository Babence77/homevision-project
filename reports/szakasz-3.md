# 3. szakasz — Az egységes katalógus kialakítása

Ellenőrizve: 2026. november 13–14.  ·  Munkaág: `fejlesztes/3-katalogus`

| Feladat | Állapot | Bizonyíték |
|---|---|---|
| C01 Katalógus kiszervezése az alkalmazáskódból | ✅ Kész | `data/catalog.json`, `catalog.js`, `schemas/product.schema.json`; teszt: termék felvétele kódmódosítás nélkül |
| C02 Stabil azonosítók és változatok | ✅ Kész | változat-id, SKU, kanonikus/vásárlási URL, régi URL-ek; teszt: URL- és sorrendváltozás |
| C03 Méretek és elhelyezési mód | ✅ Kész | KNOXHULT 60 × 31 × 60 cm igazolva; 5 mérethiba javítva |
| C04 Forrás és minőség mezőnként | ✅ Kész | mezőnkénti állapot/forrás/dátum; „Részletek” terméklap |
| C05 Termékképek kezelése | ⚠️ Kész a technikai rész — **a felhasználási engedély üzleti döntés** | képellenőrzés, licencmező, hiányzókép-jelzés |
| C06 Régi mentések átvezetése | ✅ Kész | verziózott formátum; régi helyi, kulcsos, megosztott és sérült tervek próbája |

Tesztek: `node --test test/*.test.mjs` — **50/50** (ebből 18 új katalógusteszt).

---

## C01 — Katalógus kiszervezése

**Kész, ha:** termék hozzáadása nem igényli az alkalmazás logikájának módosítását.

- `data/catalog.json`: 29 kategória, 115 termék, 118 változat, a szobák felépítése (`rooms`) és a választék (`assortment`: kategóriánkénti sorrend, stílusonkénti alapajánlatok). A JSON-t a `schemas/product.schema.json` írja le; a teszt minden futáskor ellenőrzi.
- `catalog.js`: betölti a katalógust (böngészőben az app indítása előtt, Node-ban a teszteknek), indexel azonosító / régi kulcs / URL (a régi URL-eket is) szerint, és ebből adja a szobák tételeit.
- Az `app.js`-ből kikerült a ~290 soros beégetett adatrész (1620 → 1323 sor); a duplikált `CURTAIN/CUSHION/VASE` megszűnt.
- Az árfrissítő és az eszközök a `data/catalog.json`-t olvassák — JavaScript-sorokat többé nem értelmeznek.
- Az átköltöztetés gépi úton történt (`tools/build-catalog.mjs` a régi kód adatrészét értékelte ki), kézi másolás nélkül.
- **Teszt:** egy új változat felvétele a JSON-ba (termék + választék) → megjelenik a Modern nappaliban, kódmódosítás nélkül. Hibás hivatkozásnál a betöltés azonnal jelez.

## C02 — Stabil azonosítók és változatok

**Kész, ha:** az URL vagy a sorrend változása nem cseréli le másik bútorra a mentett tételt.

- Változatonként: belső azonosító (pl. `chair.strandmon.melybezs`), bolti SKU, `urls.canonical` és `urls.buy`, régi URL-ek (`urls.previous`).
- Más szín/méret = változat: STRANDMON (2 szín), ÅFJÄLL (3 méret/keménység). Más modell = külön termék (KLEPPSTAD 2/3/tolóajtós, FLINTAN karfás, SOLHETTA foglalatok).
- A választás (`state.sel`) mostantól változatazonosító, nem sorszám; az árak (`prices.json` v4) is azonosító szerint tárolódnak.
- **Élő eset:** a JYSK SKALS könyvespolc linkje közben átirányított → azonos cikkszám (3640399), az azonosító maradt, a link frissült, a régi cím előzményként megmaradt. Az árátállásnál (v3 → v4) egyetlen ár sem veszett el.
- **Teszt:** a fotelek sorrendje megfordítva + a STRANDMON mélybézs új URL-t kap → a mentett terv továbbra is a STRANDMON mélybézst mutatja; a régi URL is erre a változatra vezet.

## C03 — Méretek és elhelyezési mód

**Kész, ha:** a KNOXHULT 60 × 31 × 60 cm; az ellenőrizetlen méret nem kap bizonyított státuszt.

- Külön mezők: szélesség, mélység, magasság, mértékegység, kinyitott méret (`open`), falra szerelés (`wallMounted`); a bolti nyers méretek (`store`) és a csomagolás (`package.parcels`) külön.
- Bolti adatból (`tools/enrich-catalog.mjs`, forrással és dátummal): alapterület igazolva 87 változatnál, magasság 69-nél, csomagolás 46-nál.
- **KNOXHULT: 60 × 31 × 60 cm, mind „Bolti adat”, falra szerelhető, csomag 62 × 9 × 63 cm / 15,5 kg.** ✔
- Javított mérethibák (a régi adat a mező megjegyzésében): KNOXHULT 60×60→60×31, ÅRSUNDA 66×80→66×72, PINNTORP 45×50→42×49, HAUGA 46×50→40×49, LAGAN 55×58→47×52.
- Az ALLING bővíthető asztal: 100 cm, kinyitva 163 cm (külön mező).
- Megszűnt és robotszűrős termékek mérete „becslés” marad — **teszt** igazolja, hogy nem kap bizonyított státuszt. A kártyán a becsült méret „≈” jellel látszik. ✔

## C04 — Forrás és minőség mezőnként

**Kész, ha:** a terméklapon megállapítható, mi bolti adat és mi szemléltető becslés.

- Minden mező: `value`, `status` (verified / estimated / missing), `source`, `checkedAt`. A séma szerint „verified” mező forrás és dátum nélkül érvénytelen (teszt).
- Rögzítve: anyag (65 igazolt), szín (86), bolti kategória, készlet, ajánlati időszak.
- **Új „Részletek” terméklap:** soronként „Bolti adat · dátum” / „Becslés (szemléltető)” / „Nincs adat” jelzés, link a bolti oldalra. ✔

## C05 — Termékképek kezelése

**Kész, ha:** a hiányzó kép érthető jelzést ad; minden nyilvános képhez rendezett felhasználási feltétel tartozik.

- Kép a termék saját bolti oldaláról (JSON-LD), elérhetőség-ellenőrzéssel: 105 elérhető, a termékhez tartozó kép.
- Hiányzó/elérhetetlen kép helyett: „Nincs ellenőrzött termékfotó”. ✔
- A látványterv színválasztója „Látványszín” lett, és jelzi: „Szemléltető szín; a bolti termék színe: …” — nem ígér nem létező változatot. ✔
- Minden képnek van felhasználási-feltétel bejegyzése (`image.license`). **Jelenleg mind a 106 bolti fotó „unsettled”: felhasználási engedély nincs rendezve.** Ezt kód nem tudja megoldani — lásd nyitott pontok.

## C06 — Régi mentések átvezetése

**Kész, ha:** régi helyi és megosztott tervek megnyithatók vagy érthető helyreállítási üzenetet kapnak.

- Verziózott formátum: terv `dreamr-plan/2`, mentett rekord `dreamr-room/2` (helyi és felhős mentés egyaránt; a `cloud.js` az értelmezhetetlen felhőadatot kiszűri).
- `data/legacy-v1.json`: a régi sorszámok rögzített sorrendje mind a 240 szoba×stílus×tétel kombinációra — **független ellenőrzéssel a régi `getSlots()` futásával: 240/240 egyezik.**
- Böngészős próbák:
  - régi sorszámos helyi mentés → VISKAFORS (megszűnt jelzéssel), POÄNG — a régi sorrend szerint ✔
  - 1–2. szakaszos kulcsos mentés → ÄPPLARYD, STRANDMON mélybézs ✔
  - nem létező termékre mutató mentés → „A mentett „Kanapé” termék már nem érhető el … helyette az alapajánlat látszik.” ✔
  - régi formátumú megosztott link → étkező / PINNTORP, a régi sorrend szerint ✔
  - sérült link → „A megosztott link sérült vagy hiányos … kérd el újra a linket.”, az app működik ✔

### Menet közben talált és javított hibák
- A régi kulcsos mentés (selKeys) kulcsát rossz szinten kereste a fordító → javítva; a teszt szigorítva (a sorszám és a kulcs szándékosan más termékre mutat — az eredeti teszt véletlenül egyező sorszámot használt).
- Az ellenőrző szkript a Windows-sorvégek miatt rossz helyen vágta a régi kódot → javítva.

---

## Nyitott akadályok és döntést igénylő pontok

1. **Képek felhasználási engedélye (C05):** a bolti termékfotók (IKEA, JYSK) a boltok tulajdonai; engedély nincs rögzítve. Lehetőségek: engedélykérés / partnerprogram, vagy saját (pl. AI-generált, egységes stílusú) termékillusztrációk. A mechanizmus kész: a licencmező egy döntéssel átállítható, és a nem rendezett képek elrejthetők.
2. **31 változat alapterülete becsült** (megszűnt, robotszűrős, lámpák, függönyök, vázák, izzók) — bolti adat hiányában; a kártyán „≈” jelzi.
3. **Kiszerelés adatforrása:** ahol nincs külön bolti adat, „1 db” alapértelmezés (a terméklapon „Becslés” jelzéssel).

Szakasz lezárása  [ ] Elfogadva   Felelős: __________________   Dátum: __________
