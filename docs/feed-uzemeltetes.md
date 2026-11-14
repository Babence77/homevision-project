# Bolti feed — üzemeltetési útmutató (F04–F06)

## 1. Bekapcsolás (az írásos jóváhagyás után)
1. GitHub → repó → **Settings → Secrets and variables → Actions → New repository secret**:
   név `FEED_KONDELA_URL`, érték: a partnertől kapott feed-URL a kulccsal. *(Soha ne kerüljön fájlba, levélbe, chatbe.)*
2. `scripts/feeds.config.json` → `feeds.kondela`: `usage` mezők a partner válasza szerint, `agreementRef` kitöltve, `enabled: true`.
3. A mintafájl alapján `categoryMap` és `params` véglegesítése (`node scripts/feed-gap-report.mjs --file minta.xml`).
4. Első futás kézzel: GitHub → **Actions → Feedek importja → Run workflow**.

## 2. Napi működés
- Minden nap 03:30 UTC-kor fut (az árfrissítés előtt, közös sávban, hogy ne írjanak egyszerre).
- Csak teljesen ellenőrzött katalógus lép életbe (séma + hivatkozások), egy átnevezéssel; hibánál a korábbi marad, a futás **piros**, a GitHub e-mailt küld.
- Napi jelentés: a futás összefoglalója + `reports/feeds/<feed>-history.json` (darabszám, elfogadott, karantén, idő, hiba, egymást követő sikeres futások).
- Karantén részletei: `.feed-work/quarantine-<feed>.json` (csak a futtató gépen; partneri adat, nem kerül Gitbe).

## 3. Pilot és jóváhagyás (F05)
1. `node scripts/feed-sample.mjs --feed kondela --n 30` → `.feed-work/minta-ellenorzes-kondela.md` (kezdőajánlatok mindig benne).
2. Minden sort ellenőrizni a bolti oldalon: kategória, ár, méret, változat, kép, link.
3. Jóváhagyás: a terméknél `"review": {"status": "approved", "by": "<név>", "at": "<dátum>"}`, majd felvétel a választékba (`assortment.pools.<kategória>`), kezdőajánlatnál `assortment.primary`.
4. Kritikus eltérésnél (rossz termék/ár/méret/változat): `"rejected"` + jelzés a partnernek.

## 4. Visszaállítás
- Bármely korábbi jó állapot: `node scripts/restore-catalog.mjs --ref <commit>` (ellenőrzés + atomikus csere), majd commit.
- A feed letiltása azonnal: `enabled: false` → a következő futás kihagyja; a már importált termékek megmaradnak (megszűnt jelölésig).

## 5. Partneri leállás / hozzáférés-visszavonás (F06 — a partnerrel tisztázandó)
- Visszavonásnál: `enabled: false`, a titok törlése, a partner kérése szerinti határidőn belül a feedtermékek eltávolítása a választékból és a képek törlése.
- A mentett tervek ilyenkor helyreállítási üzenetet kapnak (3. szakasz, C06).
