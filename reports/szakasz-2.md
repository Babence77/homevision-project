# 2. szakasz — A tényleges vásárlási költség kiszámítása

Ellenőrizve: 2026. november 12–13.  ·  Munkaág: `fejlesztes/2-koltseg`

| Feladat | Állapot | Bizonyíték |
|---|---|---|
| B01 Darab és értékesítési egység szétválasztása | ✅ Kész | `pricing.js`, `sales-data.js`, tesztek |
| B02 Teljesítési módhoz kötött szabály | ✅ Kész | JONSTRUP teszt + böngészős próba |
| B03 Kiegészítők és hiányzó tételek | ✅ Kész (festékár: nyitott) | bolti oldalak felderítése, tesztek |
| B04 Szállítás és ismeretlen költség | ✅ Kész | hivatalos díjtáblák, tesztek |
| B05 Egyetlen közös költségszámítás | ✅ Kész | 5 felület ugyanazt adja; árpillanatkép |
| B06 Költségtesztek | ✅ Kész | `node --test test/*.test.mjs` — 32/32 |

---

## B01 — Darab és értékesítési egység

**Kész, ha:** ugyanaz a termék 1, 2, 3, 4, 5 és 8 darabnál következetesen számolható.

- Új `pricing.js` (`purchase`): kért darab → megvásárolandó egység; kezeli a kiszerelést (`pack`), a minimumot, a rendelési többszöröst és a teljesítési módhoz kötött többszöröst.
- A kiszerelés a bolt saját adatából jön (`sales-data.js`, forrással): függönypár = 2 lap (IKEA „1 pár”), FULLTALIG = 3 db/csomag, SOLHETTA E27 806 lm = 2 db/csomag.
- Megszűnt a terméknévből („(4 db)”) és a bútorcsoportból számolt ár: a katalógusban minden ár **egy megvásárolható egység** ára; a 26 érintett bejegyzés átírva (pl. JONSTRUP 40 000 Ft/4 db → 9 000 Ft/db).
- A napi frissítő sem szoroz többé név alapján; `prices.json` v3 (`priceBasis: "salesUnit"`).
- Tesztek: egyedi termék 1/2/3/4/5/8 db; függönypár 1/2/3/4/5/8 lap (1/1/2/2/3/4 pár, a többlet megmagyarázva); csomag.

## B02 — Teljesítési módhoz kötött szabály

**Kész, ha:** három szék tervezése és négy szék megvásárlása külön látható, a többletdarab megmagyarázva.

- Forrás (jysk.hu, JONSTRUP): *„A Házhozszállítás kiválasztásakor ezt a terméket 4 többszörösében kell megvásárolni”*; Click & Collect: darabra, ingyenes. Ugyanez a BISTRUP-nál.
- A napi frissítő minden JYSK-terméknél kiolvassa ezt a szabályt (`deliveryMultiple`), így változásnál automatikusan követi.
- Böngészőben (Étkező, 3 szék): **Házhozszállítás** → „Vásárlandó: 4 db · 1 többletdarab — házhozszállításnál csak 4 többszörösében rendelhető. Bolti átvételnél elég 3.” (36 000 Ft); **Bolti átvétel** → 3 db, 27 000 Ft. ✔
- Teszt: 1, 2, 3, 4, 5, 8 szék házhozszállításnál → 4, 4, 4, 4, 8, 8 vásárolandó.

## B03 — Kiegészítők és hiányzó tételek

**Kész, ha:** a részleges termék ára nem tűnik teljes használatra kész megoldás árának.

- Mind a 107 termékoldal átnézve (`tools/sales-scan.mjs` → `reports/sales-scan.md`); a bolt saját „nem tartozék” mondatai alapján:
  - ágyak: matrac (és a VIHALS/KONGSBERG/SLÄKT mellé ágyrács); IKEA-lámpák: izzó (NYMÅNE 3× GU10, STOCKHOLM 3× E27 …), JYSK HANSSON: izzó; IKEA párnahuzatok: belső párna; RÅKALL/TINAD: ajtó, lábazat, fogantyú, sarokpánt; METOD: falisín.
- Ahol a bolt maga ajánl kompatibilis terméket, annak ellenőrzött ára becslésként külön sorba kerül (pl. GURLI + 2× INNER belső párna ≈ 2 400 Ft; KLEPPSTAD + VESTERÖY 160×200 matrac ≈ 69 990 Ft). Ezeket a napi frissítő is követi (10 kiegészítő a katalógusban).
- Ahol nincs ellenőrzött ajánlat (pl. KONGSBERG matrac, hűtőajtó), ott „nincs benne az árban, a boltban pontosítandó” — sosem 0.
- A kártyán: „Nem tartozék: …”, az ár mellett „+” jel; az összegzésben külön „Kiegészítők (becslés)” sor.
- **Falfesték:** külön „becslés” sorban, „az ár nem ellenőrzött” jelzéssel — lásd nyitott pontok.

## B04 — Szállítás és ismeretlen költség

**Kész, ha:** a becsült végösszegből kiderül, mit tartalmaz, és mit kell a boltban pontosítani.

- IKEA házhozszállítás: a hivatalos díjtábla (rendelési érték × A/B zóna, „első zárható ajtóig, 10 munkanapon belül”); zóna nélkül tartomány; 2 000 Ft alatt nem elérhető. Bolti átvétel: „15 Ft-tól”.
- JYSK: bolti átvétel (Click & Collect) ingyenes; házhozszállítás díja a kosárban derül ki → **ismeretlen**.
- Mömax/Möbelix: ismeretlen.
- Összegzés: Termékek · Kiegészítők (becslés) · Falfesték (becslés) · szállítás boltonként; ismeretlennél „+ ismeretlen tételek”; lenyitható „Nincs benne / a boltban pontosítandó” lista.

## B05 — Egyetlen közös költségszámítás

**Kész, ha:** ugyanaz a konfiguráció minden felületen ugyanannyi; új árnál látszik a változás.

- `currentCost()` → `DRPricing.compute()` az egyetlen számítás; ezt használja a lista, az összegzés, a PDF, a bevásárlólista, a mentés és a megosztott link.
- Pénz: egész forint, egységár × egység (nincs osztás, nincs kerekítési eltérés).
- Próba: **összegzés = bevásárlólista = PDF = 333 260 Ft** (230 930 + 73 860 + 14 980 + 13 490). ✔ Megosztott link megnyitva: 309 720 Ft = 309 720 Ft, a mód megmarad. ✔
- Árpillanatkép mentéskor és megosztáskor; visszatöltéskor csak valódi egységár-változásnál jelez: „Mentés óta változott ár (+5000 Ft): STRANDMON … 79 990 → 84 990 Ft”. A teljesítési mód váltása nem ad téves jelzést. ✔

## B06 — Költségtesztek

**Kész, ha:** a JONSTRUP, a két éjjeliszekrény és a párnahuzatok példái helyesen működnek.

`node --test test/*.test.mjs` — **32/32 sikeres** (18 új költségteszt):
- JONSTRUP: 3 tervezett → házhoz 4 (36 000 Ft, ok megmagyarázva), bolti 3 (27 000 Ft) ✔
- Két éjjeliszekrény (BRIMNES): 2 × 11 990 = 23 980 Ft; el nem helyezett darab: 2 kérve, 1 fér → 11 990 Ft + jelzés ✔
- Párnahuzat (GURLI): 2 × 1 490 Ft + 2 belső párna külön (2 400 Ft); kész JYSK díszpárna: nincs kiegészítő ✔
- egyedi termék, csomag, darabszám 1–8, ismeretlen szállítás, IKEA díjtábla és minimum, hiányzó ár, kerekítés, árpillanatkép, adatminőség (minden `sales-data.js` URL létező katalógustermék).

### Menet közben talált és javított hibák
- A `sales-data.js` 16 termék-URL-je kezdetben nem egyezett a katalógussal → javítva, és állandó teszt őrzi.
- GU10 izzó: az élő adat felülírta az IKEA „online 2 db” szabályát → javítva (élő többszörös csak JYSK-nél).
- Módváltás téves „árváltozás” jelzést adott → javítva.

---

## Nyitott akadályok és döntést igénylő pontok

1. **Falfesték ára:** a Héra Prémium 7 490 Ft / 5 L nem igazolható megbízható forrásból (a Héra/OBI oldalak az árat programból töltik, a kódban látható szám valószínűleg nettó). Becslésként, „nem ellenőrzött” jelzéssel szerepel. Kell egy ellenőrizhető forrás (partner vagy kézi rögzítés dátummal).
2. **Hiányzó kiegészítő-ajánlatok:** KONGSBERG matrac és ágyrács, VIHALS ágyrács (160×200), hűtőajtók, METOD falisín, JYSK lámpaizzó — kézi termékválasztás kell, hogy becsülhetők legyenek.
3. **IKEA kiscsomag-szállítás:** csak kis tételekből álló rendelésnél olcsóbb lehet (2 990–3 490 Ft); súlyadat nélkül a teherszállítási díjjal számolunk.
4. **Mömax/Möbelix:** változatlanul nem ellenőrizhető (1. szakasz).

Szakasz lezárása  [ ] Elfogadva   Felelős: __________________   Dátum: __________
