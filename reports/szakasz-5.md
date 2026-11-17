# 5. szakasz — Ajánlás, kerethez igazítás, elhelyezés és keresés

Állapot: 2026. november 17.  ·  Munkaág: `fejlesztes/5-ajanlas`

| Feladat | Állapot | Hol |
|---|---|---|
| R01 Ajánlás: előbb szűrés, utána rangsor | ✅ Kész | `recommendations.js` (`exclusions`, `filterSlot`, `rank`, `recommend`) |
| R02 Kerethez igazítás alapbútorokkal | ✅ Kész | `recommendations.js` (`fitBudget`), `app.js` (`autoFit`, napló, visszavonás) |
| R03 Közös elhelyezőmotor (2D + 3D) | ✅ Kész | `layout.js` (`place`, `fitsRoom`, `validateMove`), `app.js`, `viewer3d.js` |
| R04 Ajtó és használati helyigény | ✅ Kész | `layout.js` (`door`, `clearances`), ajtóbeállítás az alaprajz alatt |
| R05 Érthető indoklás | ✅ Kész | „Miért ez a termék?” minden tételnél, keret-napló, egyenkénti visszavonás |
| R06 Keresés a teljes katalógusban | ✅ Kész | „🔎 Teljes katalógus” ablak (név, kategória, méret, ár, bolt) |

Tesztek: `node --test test/*.test.mjs` — **85/85** (23 új: 15 ajánló-, 8 elhelyezésteszt).
Böngészős próba: helyi szerveren, telefonméretben (375 px) és asztali nézetben, magyarul és angolul.

---

## R01 — Ajánlás: előbb szűrés, utána rangsor
**Kész, ha:** a „csak MÖMAX” szűrő mindig érvényesül, és a hiányzó kategóriát nem tölti ki más bolt.
- Kizáró okok rangsorolás előtt: **tiltott bolt**, **rossz link** (megszűnt vagy nem https), **rossz változat** (más kategória, jóvá nem hagyott feedtermék), **hiányzó kötelező méret** (alaprajzra kerülő tételnél szélesség és mélység).
- A korábbi kód, ha a választott boltokban nem talált terméket, **csendben visszaesett az összes boltra**. Ez megszűnt: a tétel üres marad, és a listában ez áll: „Nincs megfelelő termék a választott boltokban (MÖMAX) — más bolt nem tölti ki”, a kizárás okaival. Ha fő funkcióról van szó, külön figyelmeztetés jelenik meg.
- Rangsor: befér-e a szobába → ellenőrzött-e az ár → stílus-alapajánlat → az alapajánlathoz legközelebbi árszint → olcsóbb. A katalógusban nincs termékenkénti stílusjelölés; a stílust a gondozott alapajánlat képviseli.
- **Próba:** 6 szoba × 6 stílus minden tételében csak MÖMAX-termék vagy üres tétel (teszt). A böngészőben a nappali „csak MÖMAX” beállítással: 4 MÖMAX-termék, 5 üres kategória okkal. ✔

## R02 — Kerethez igazítás alapbútorokkal
**Kész, ha:** a keretbe férés soha nem távolítja el csendben a szoba fő funkcióját, és ha nincs megoldás, ezt közli.
- Szerepek: **kötelező** (katalógusadat: `rooms[].role`), **opcionális**, **zárolt** (🔒 gomb minden tételen).
- Sorrend:
  1. olcsóbb megfelelő változat: csak a szűrőn átmenő, ellenőrzött árú, a szobába beférő termék;
  2. darabszám csökkentése, legfeljebb a kategória `minQty` értékéig; a felhasználó által beállított darabszám nem változik;
  3. opcionális tétel elhagyása a lista végéről (dekoráció, párna…).
- **Visszaépítés:** ami utólag belefér a keretbe, visszakerül (elhagyott tétel, darabszám, az eredetihez közelebbi drágább változat).
- Egyik csere sem szoríthat le bútort az alaprajzról. Kötelező és zárolt tétel soha nem esik ki.
- **Ha nincs megoldás, a program magától semmit nem változtat.** Kiírja, mennyivel lóg ki a legolcsóbb megfelelő összeállítás, és mi tartja fenn (pl. „Kanapé — fő funkció”). A legolcsóbbat csak külön kérésre alkalmazza („Mégis a legolcsóbb”).
- A régi algoritmus, amely egy rögzített listából kapcsolt ki tételeket, mindent visszakapcsolt (a felhasználó kikapcsolásait is), és a kanapét is elhagyhatta. Ez megszűnt.
- **Próba (böngésző, nappali):**
  - 300 000 Ft-os keret: 3 csere, 289 385 Ft. A fotel a visszaépítés miatt a jobb POÄNG lett, nem a legolcsóbb ÅRSUNDA.
  - 100 000 Ft-os keret: „nem érhető el — 54 880 Ft-tal túllépi”, semmi nem változott. ✔

## R03 — Közös elhelyezőmotor
**Kész, ha:** a csak elforgatva férő bútor ellenőrizhető, és az érvénytelen mozgatás üzenettel visszaáll.
- Az elhelyezés (horgonyok, rácskeresés, ütközés) az `app.js`-ből átkerült a `layout.js`-be. Az alaprajz, a 3D, a költség (elhelyezett darabszám) és **minden mozgatás** (2D-s és 3D-s húzás, forgatás) ugyanazt a szabályt használja.
- **90°-os forgatás:**
  - a bútor, ami csak elforgatva fér be, automatikusan elforgatva kerül a tervre, és ezt jelzés mutatja („csak elforgatva fér el”);
  - kézzel: koppintás a bútorra, majd „↻ … forgatása 90°-kal”. Ha a fal útban van, a bútor beljebb csúszik; ha így sem fér el, okkal visszaáll.
- **Magasság:** ismert magasságnál a belmagasságnál magasabb bútor nem kerül be. Becsült magasság nem zár ki semmit.
- **Falra szerelt elem:** a falhoz tapad, 140 cm-es alsó éllel; alatta alacsony bútor lehet, magas nem. A 3D-ben is megemelve jelenik meg.
- **Ami nem fér el, nem tűnik el csendben:** a lista okkal mutatja („semmilyen állásban nem fér el / magasabb a belmagasságnál / nincs szabad hely”), és ha a fő funkció hiányzik, azt kiemeli.
- Érvénytelen mozgatás üzenetei: „kilógna a falon túlra”, „másik bútorba ütközne”, „az ajtó nyitási területe”. A bútor mindig visszaáll az eredeti helyére.
- **Próba:**
  - lámpa az ajtózónába húzva → visszaállt, üzenettel ✔
  - TV-állvány forgatása a fal mellett → beljebb csúszott, 40×120 ✔
  - mentés → visszatöltés: forgatás, ajtó, zárolás megmaradt ✔

## R04 — Ajtó és használati helyigény
**Kész, ha:** a megadott ajtónyitási területre nem kerül bútor, és a közlekedési korlátok egyértelműen láthatók.
- Ajtó beállítható: fal (alsó, felső, bal, jobb), hely a saroktól, szélesség (60–120 cm). A nyitási négyzet **tiltott terület** minden bútornak, kivéve a szőnyeget.
- Használati sáv a bútor eleje előtt, becsült tervezési értékkel:

  | Bútor | Helyigény |
  |---|---|
  | étkezőszék kihúzása | 30 cm |
  | bárszék | 25 cm |
  | irodai szék | 40 cm |
  | gardrób | 60 cm |
  | tálaló | 40 cm |
  | éjjeliszekrény | 30 cm |
  | hűtő | 60 cm |
  | konyhaszekrény | 50 cm |
  | polc | 30 cm |

  A szék a saját asztalától elfelé húzódik ki; a szekrény a legközelebbi fallal szemben nyílik. A sáv szaggatott, és piros, ha kevés a hely. A lista kiírja, pl. „Étkezőszék kihúzásához 30 cm kell, itt 21 cm van”.
- Ez **jelzés, nem tiltás**, az ajtóval ellentétben. A pontossági megjegyzés most pontosan felsorolja, mi ellenőrzött (falak, átfedés, ajtó, belmagasság, falra szerelés), mi csak jelzett (kihúzás, nyitás), és mi nincs ellenőrizve (ablak, radiátor, konnektor, közlekedési útvonal).
- **Próba:** 6 szobatípus × 2 méret × 4 ajtófal — egyik bútor sem került az ajtózónába (teszt). ✔

## R05 — Érthető indoklás
**Kész, ha:** a felhasználó visszakövetheti és visszavonhatja a cserét.
- „Miért ez a termék?” minden tételnél:
  - eredet: a stílus alapajánlata, csere (és miért: a bolt nincs kiválasztva, megszűnt, nem ellenőrzött az ára, nem fér be), saját választás, keresésből, kerethez igazításból vagy a „Legolcsóbb mindenhol” gombbal;
  - a vizsgált kör („7 megfelelő; kizárva: 1 megszűnt / hibás link”);
  - **bizonytalan adatok** (elavult vagy nem ellenőrzött ár, hiányzó magasság, becsült méret, ismeretlen szín).
- „Legolcsóbb” → „**legolcsóbb a 7 vizsgált közül**”: csak a szűrőn átment termékekre vonatkozik.
- A keret-igazítás és a „Legolcsóbb mindenhol” naplója tételenként mutatja a megtakarítást. Minden csere **egyenként** és **egyben is visszavonható**; a tételnél is van „Visszavonás” (előtte: …).
- **Próba:** keresésből választott POÄNG → „Előtte: STRANDMON” → Visszavonás → STRANDMON visszaállt. A zárolt kanapé a „Legolcsóbb mindenhol” után is változatlan maradt. ✔

## R06 — Keresés a teljes katalógusban
**Kész, ha:** egy nem kiválasztott termék név alapján megtalálható és beállítható.
- „🔎 Teljes katalógus”: szöveg (ékezet nélkül is), kategória (a szoba tételei és a többi szoba), max. szélesség és mélység, ár-tól/-ig, bolt.
- A boltválasztás csak az engedélyezett boltokon belül szűkíthet, így az R01 szűrő itt is érvényes.
- Csak megfelelő termék jelenik meg (megszűnt, hiányzó méretű, csak tartozékként árult nem). A nem beférő terméknél jelzés áll.
- Egy kattintással beállítható, ha a szobában van ilyen tétel. Akkor is, ha a termék nincs a tétel előre válogatott listájában (az azonosítóval mentődik, és visszatöltéskor is érvényes).
- **A listaszűrő nem változtat az összegen:** a felső keresőmező csak a listát szűkíti, és ezt ki is írja („0 / 9 látszik — az összeg … mind a 9 tételt tartalmazza”), átirányítással a teljes katalógusra.
- **Próba:** „poang” → a lista üres, az összeg változatlan (550 885 Ft) → teljes katalógus: 1 találat → „Csere: Fotel” → 495 885 Ft. ✔

---

### Adatváltozás (a Te jóváhagyásodra vár)
- **A szobák fő funkciója** (`data/catalog.json` → `rooms[].role: "required"`):
  - nappali: kanapé
  - hálószoba: ágy
  - étkező: étkezőasztal, étkezőszék
  - konyha: konyhaszekrény, hűtő
  - dolgozószoba: íróasztal, irodai szék
  - gyerekszoba: gyerekágy

  A konyhasziget opcionális maradt. Ha másképp látod, egy sor átírása a katalógusban.
- **Legkisebb darabszám** (`categories[].minQty`): étkezőszék 2, éjjeliszekrény 1, díszpárna 1, bárszék 1. A többi kategória a tervezett darabszám alá nem megy.
- A használati helyigény értékei (fenti táblázat) becsült tervezési számok; partneradat esetén pontosíthatók.

### Menet közben talált és javított hibák
- A „Nincs szabad hely: {items}” üzenetben a helyőrző sosem cserélődött ki; most a kimaradt tételek névvel és okkal jelennek meg.
- A régi „befér” vizsgálat 40 cm-es általános ráhagyással dolgozott, és nem ismerte a forgatást. A közös motor most ugyanazzal a szabállyal dönt, mint az elhelyezés.
- A mentett tervből betöltött, keresésből választott termék „már nem választható” jelzést kapott volna. Most a kategóriaegyezés elég.

### Nyitott pontok
- Ablak, radiátor és közlekedési útvonal ellenőrzése nincs benne; ezt a felület ki is írja.
- A 3D-ben nincs külön forgatógomb; a forgatás az alaprajzon történik, és a 3D ugyanazt mutatja.
