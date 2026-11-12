# 1. szakasz — Az árak és a terméklinkek rendbetétele

Ellenőrizve: 2026. november 12.  ·  Munkaág: `fejlesztes/1-arak-linkek`

| Feladat | Állapot | Bizonyíték |
|---|---|---|
| A01 A 107 link állapotfelmérése | ✅ Kész | `reports/link-audit.md` / `.json` |
| A02 Termékhez kötött árkinyerés | ✅ Kész | 14 egységteszt + élő futás |
| A03 Az utolsó jó ár megőrzése | ✅ Kész | szándékos hibapróba |
| A04 Frissesség a termékkártyán | ✅ Kész | böngészős próba (elavult, nem ellenőrzött, friss) |
| A05 Hibás termékek kezelése | ✅ Kész | 36 szoba×stílus próba, régi mentés próbája |
| A06 Frissítő ellenőrzése és hibajelzés | ✅ Kész | szándékos hibapróba, 2-es kilépési kód |

---

## A01 — A 107 link állapotfelmérése

**Kész, ha:** minden link besorolva; a VISKAFORS kategóriaoldala nem érvényes termékoldal.

- Eszköz: `node tools/link-audit.mjs` → `reports/link-audit.md` (termékenként HTTP-eredmény, átirányítási lánc, végső URL, várt és talált cikkszám, kódbeli és élő ár, akció, készlet).
- Külön állapot: rendben / átirányítás / megszűnt / robotszűrő (403) / nem a várt termék / feldolgozási hiba / HTTP hiba / hálózati hiba.
- Első felmérés: 87 rendben, 5 megszűnt, 4 átirányítás, 7 robotszűrő, 4 feldolgozási hiba.
  - A 4 feldolgozási hiba az IKEA akciós árformátuma volt (`priceSpecification`) — a kinyerő javítva.
  - A 4 átirányítás (GEDVED, VEDDE, BISTRUP, FULLTALIG) ugyanaz a termék új címen — név, méret, ár, IKEA-nál cikkszám egyezik; a linkek átírva.
- **Végeredmény: 107 linkből 95 rendben, 5 megszűnt, 7 robotszűrő.**
- VISKAFORS: `301 → https://www.ikea.com/hu/hu/cat/termekek-products/` → **Megszűnt** (nem termékoldal). ✔
- Megszűnt: VISKAFORS, MALM ágykeret, NORDVIKEN asztal, KULLEN éjjeliszekrény (IKEA), VEJEN fotel (JYSK).
- Mind a 107 linknél egyezik a terméknév az oldalon talált névvel.

## A02 — Termékhez kötött árkinyerés

**Kész, ha:** a minták helyes árat adnak; a kategóriaoldal és az idegen SKU nem ad elfogadott árat.

- `tools/store-pages.mjs`: IKEA — a link végén lévő 8 jegyű cikkszámnak egyeznie kell a JSON-LD `sku`-val; JYSK — csak az a változat, amelynek ajánlata erre a termékoldalra mutat; Mömax/Möbelix — 12 jegyű termékkód. Csak HUF ár fogadható el. Nincs 500 Ft-os alsó határ.
- Tesztek (`node --test test/`, 14/14 sikeres): helyes ár, 500 Ft alatti ár, idegen cikkszám → elutasítva, több termék az oldalon → a miénk ára, kategóriaoldal → elutasítva, akciós ár érvényességgel, nem forint ár → elutasítva, JYSK változatválasztás, JYSK kategóriaoldal, robotszűrő, hálózati hiba.
- **Élő bizonyíték:** PÅDRAG váza (cikkszám 104.709.91) valódi ára **495 Ft** — a régi robot az 500 Ft alatti árat eldobta, és egy másik termék árát (**1 499 Ft**) írta be.

## A03 — Az utolsó jó ár megőrzése

**Kész, ha:** egy mesterséges lekérési hiba után a korábbi jó ár és annak régi dátuma marad.

- `prices.json` v2: tételenként `price`, `checkedAt` (utolsó sikeres), `lastAttempt`, `status`, `error`, `sku`, akció, készlet.
- Próba: `DREAMR_FAIL_STORE=jysk` — HELLERUP kanapé előtte `179900 Ft, checkedAt 21:57:20`, utána `179900 Ft, checkedAt 21:57:20` (változatlan), `lastAttempt 21:59:10`, `status: network_error`. Mind a 95 ár megmaradt. ✔
- Soha nem áll vissza csendben a kódba írt árra; ahol még sosem volt sikeres ár, az app „nem ellenőrzött”-ként jelzi.

## A04 — Frissesség a termékkártyán

**Kész, ha:** a mai import nem teszi maivá a kimaradt terméket; a felhasználó felismeri a bizonytalan költséget.

- Kártyán: „Ár ellenőrizve: nov. 12. 23:06”, akciónál „akciós, dec. 29-ig (eredetileg … Ft)”, „csak áruházban”.
- 48 órás határ (`FRESH_HOURS`, partnerenként pontosítandó): felette „Elavult ár — utoljára ellenőrizve: …”.
- Sosem igazolt ár: „Nem ellenőrzött ár — a bolt oldala automatikusan nem ellenőrizhető” (Mömax/Möbelix).
- Bizonytalan ár: „≈” jellel, pontozott aláhúzással; az összegzésben „Ebből bizonytalan ár (N tétel) ≈ … Ft”; a PDF-ajánlatban `*` és lábjegyzet.
- Próba: STRANDMON utolsó sikeres ellenőrzése nov. 9., a mai próbálkozás hibás → a kártyán **„Elavult ár — utoljára ellenőrizve: nov. 9. 05:08”**, nem „ma”. ✔

## A05 — Hibás termékek kezelése

**Kész, ha:** a VISKAFORS helyett ellenőrzött kanapé ajánlódik; a mentett terv nem változik észrevétlenül.

- Megszűnt termék nem választható és nem lehet kezdőajánlat; igazolatlan (robotszűrős) sem lehet kezdőajánlat.
- Ellenőrzött csere: azonos kategória, lehetőleg azonos bolt, legközelebbi ár. **Modern nappali: VISKAFORS → ÄPPLARYD** (IKEA, 3 személyes, 231×93 cm, 299 900 Ft). ✔
- Mind a 36 szoba×stílus kombinációban csak friss, ellenőrzött árú termék a kezdőajánlat (0 kivétel).
- A KULLEN mellé ellenőrzött BRIMNES éjjeliszekrény került (102.349.42). A listák sorrendje nem változott, így a mentett sorszámok érvényesek maradnak.
- Régi mentés próbája: a VISKAFORS-os terv **VISKAFORS-szal töltődik be**, „Megszűnt termék” jelzéssel és „Csere erre: ÄPPLARYD” gombbal — nem cserélődik csendben. ✔
- Csere után a kártyán: „Lecserélve: VISKAFORS … helyett (megszűnt termék, nov. 12).”; az új mentés termékkulccsal (`selKeys`) rögzít, a `replaced` mező őrzi: honnan, mire, miért, mikor. A régi mentés érintetlen.

## A06 — Frissítő ellenőrzése és hibajelzés

**Kész, ha:** a szándékosan elrontott forrás látható hibát ad; jó katalógus nem vész el.

- Időkorlát (25 s/lekérés, 25 perc/futás), 2 újrapróbálás átmeneti hibánál, boltonkénti jelentés (Actions összefoglaló), hibaküszöb boltonként (`tools/price-sources.json`, 20%).
- A munkafolyamat előbb lefuttatja a teszteket; hiba esetén is menti a jó árakat, majd **pirosan zárul**.
- Próba: `DREAMR_FAIL_STORE=jysk` → „❌ HIBA — jysk: teljes kiesés — 22/22 sikertelen”, kilépési kód 2; a jó árak megmaradtak. ✔

---

## Nyitott akadályok és döntést igénylő pontok

1. **Mömax és Möbelix (7 termék):** Cloudflare robotszűrő (HTTP 403). Nem kerüljük meg. Az áraik „nem ellenőrzött”-ként jelennek meg, és nem lehetnek kezdőajánlatok. Végleges megoldás: partneri adatforrás (termékfeed / API) — üzleti döntés.
2. **Megszűnt termékek a katalógusban (5):** a mentett tervek miatt bent maradnak „megszűnt” jelöléssel. Új csere-termékek felvétele (pl. VEJEN helyett új fotel) a katalógus bővítésekor.
3. **Frissességi határ:** most egységesen 48 óra; partnerenként pontosítandó.
4. **Beolvasztás:** a `main`-re a robot naponta új `prices.json`-t ír; beolvasztáskor ezt a fájlt az új (v2) változatra kell feloldani — az app és a frissítő mindkét formátumot kezeli.

Szakasz lezárása  [ ] Elfogadva   Felelős: __________________   Dátum: __________
