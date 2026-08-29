# HomeVision AI — Lakberendező tervező

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

- Az árak tájékoztató jellegűek (2026-07-17), a linkek a boltok oldalaira visznek.
- A „3D nézet” valódi 3D-modelleket tölt be (Three.js, internet kell hozzá) — internet nélkül automatikusan a beépített, egyszerű 3D-re vált.
- A 3D-bútormodellek a [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit)-ből valók (CC0, szabadon felhasználható) — lásd `models/LICENSE.txt`.
- A „Házam” mentés a böngésződben tárolódik (a valódi felhő-mentés a backend-fázisban jön).

Készült Bencével, lépésről lépésre. 💙
