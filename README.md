# DREAMR — Lakberendező tervező

Interaktív lakberendező-tervező webalkalmazás magyar és angol nyelven: valós termékek és árak több boltból, méretre és büdzsére szabva, alaprajz + 3D nézet, PDF-ajánlat, bevásárlólista és „Házam” (mentett szobák egész házhoz).

---

## 📁 Mi van a projektben? (a 3 fő fájl)

Egy weboldal általában három részből áll — mi is így bontottuk szét:

- **`index.html`** — a **szerkezet** (a „csontváz”): milyen elemek vannak az oldalon (gombok, dobozok, szövegek).
- **`styles.css`** — a **megjelenés** (a „ruha”): színek, méretek, elrendezés, hogy szép legyen.
- **`app.js`** — a **működés** (az „agy”): a logika — az árak, a szűrők, az alaprajz, minden interaktív dolog.
- **`viewer3d.js`** — a **valódi 3D nézet** (Three.js): betölti a `models/` mappa 3D-bútormodelljeit és felépíti a szobát.

A `README.md` (ez a fájl) pedig a leírás magának a projektnek.

---

## ▶️ Hogyan nyisd meg VS Code-ban?

1. Nyisd meg a **VS Code**-ot.
2. **File → Open Folder…** (Fájl → Mappa megnyitása), és válaszd ki ezt a `homevision-project` mappát.
3. Bal oldalt megjelenik a három fájl — kattints bármelyikre, hogy lásd a kódot.

## 👀 Hogyan nézd meg működés közben (előnézet)?

A legegyszerűbb: **dupla katt az `index.html`-re** a fájlkezelőben — megnyílik a böngésződben.

Fejlesztéshez viszont kényelmesebb a **Live Server** (automatikusan frissül, ahogy szerkeszted):

1. VS Code bal oldali sávjában a kockás ikon = **Extensions** (bővítmények).
2. Keresd meg: **Live Server** (szerző: Ritwick Dey), és **Install**.
3. Utána jobb klikk az `index.html`-en → **„Open with Live Server”**. Megnyílik a böngészőben, és minden mentésnél (Ctrl+S) automatikusan frissül. 🎉

## 💾 Git verziókövetés (minden változás mentődik, visszavonható)

VS Code-ban a bal oldali **Source Control** ikonnal (elágazás-szimbólum) grafikusan is megy, de terminálból is:

```bash
git init
git add .
git commit -m "Első verzió: HomeVision AI tervező"
```

Ettől kezdve minden mentett állapothoz vissza tudsz lépni. Új változás után újra: `git add .` majd `git commit -m "mit változtattam"`.

## 🌍 Publikálás — hogy élő linken bárki elérje (később)

Amikor kész vagy, ingyen ki lehet tenni a netre:

- **GitHub + GitHub Pages**: feltöltöd a kódot GitHubra, bekapcsolod a Pages-t → kapsz egy `…github.io` linket.
- **Netlify**: a mappát behúzod a netlify.com oldalra, és azonnal kapsz egy élő linket.

Ezt majd együtt végigcsináljuk, ha eljutunk odáig.

---

## 🔜 Következő lépések (ötletek)

- ~~Valódi 3D-bútormodellek~~ ✅ Kész (Three.js + Kenney-modellek, `viewer3d.js` + `models/`).
- ~~Megosztható link~~ ✅ Kész (a 🔗 gomb a teljes összeállítást a linkbe kódolja).
- **Backend (szerver) — ehhez kell:** valódi AI-látványterv, élő/frissülő árak, valódi felhasználói fiókok és felhő-mentés.
- Név és logó véglegesítése (a szín már megvan: fehér / szürke / sötétkék).

## Jó tudni

- Az árak tájékoztató jellegűek (legutóbbi árellenőrzés: **2026-08-29**), a linkek a boltok oldalaira visznek.
- A „3D nézet” valódi 3D-modelleket tölt be (Three.js, internet kell hozzá) — internet nélkül automatikusan a beépített, egyszerű 3D-re vált.
- A 3D-bútormodellek a [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit)-ből valók (CC0, szabadon felhasználható) — lásd `models/LICENSE.txt`.
- A „Házam” mentés a böngésződben tárolódik (a valódi felhő-mentés a backend-fázisban jön).

Készült Bencével, lépésről lépésre. 💙

## DREAMR arculat

A korábbi HomeVision AI új neve DREAMR. Az új nyitóoldal bézs–fekete színeket, saját logójelet és billentyűzettel is kezelhető előtte–utána csúszkát használ. A room-before-dreamr.jpg és room-after-dreamr.jpg bemutatóképek illusztrációk, nem a tervező aktuális eredményei.

A felület magyarul és angolul, mobilon és sötét módban is használható. A belépő ablak, a lábléc és a PDF-ajánlatok is DREAMR nevet viselnek. A korábbi homevision_house_v1 helyi tárolási kulcs megmaradt, így a meglévő szobák továbbra is elérhetők. A Supabase-projektet, a megosztott linkek formátumát és az árfrissítőt az arculatváltás nem módosítja.
## Pontossági frissítés és képcsúszka

A 2D és 3D nézet közös, centiméteres elhelyezést használ. A bútorok a szobán belül maradnak, és a szőnyeg kivételével 5 cm-es ütközési hézagot tartanak. A falba vagy másik bútorba húzott elhelyezést a program elutasítja.

Helyhiány esetén figyelmeztetés jelenik meg. A kihagyott darab nem kerül az összegzésbe, PDF-be, bevásárlólistába és mentett tétellistába. A listában az elhelyezett / kért darabszám látható; a csomagból részben elférő darabok is bekerülhetnek.

A színek terméknév alapján, a magasságok részben becsültek. Ajtó-, ablak- és közlekedési helyigényt még nem ellenőrzünk: ez nem építészeti garancia. Az AI-kép illusztráció, nem méretezett terv.

A 3D nézet aktuális alaprajzból induló animált átmenetet kapott; az AI-gomb a modellek betöltését megvárja. A v4 új, összeillesztett képpárt és DREAMR saroklogót ad a billentyűzettel is kezelhető előtte-utána csúszkához.

## V6 testreszabás és TV-elhelyezés

- A bútorlista és a 3D vezérlősáv ugyanazt az állapotot használja: a szín és a darabszám mindkét helyen állítható, és azonnal szinkronban marad.
- Darabszám 1–8 között adható meg. A költség, PDF, bevásárlólista és mentett tétel a ténylegesen elhelyezett darabszámból számol.
- A többdarabos katalógusok (pl. 2-es/4-es csomag) ára belső egységárra van bontva, így nem számolódik duplán. Ez a tervbe kerülő darabok arányos költsége; a boltban a teljes csomag megvásárlása lehet szükséges.
- A 3D mozgatás ugyanazt az ütközés- és falellenőrzést használja, mint a 2D. Érvénytelen mozgatásnál visszaáll az előző pozíció.
- Nappali tervezés előtt kötelező TV-elhelyezést választani (bútoron / falon). A beállítás megjelenik 2D/3D nézetben, AI-promptban, mentésben és megosztható linkben.