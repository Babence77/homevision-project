# 4. szakasz — Az első magyar bolti feed bekötése

Állapot: 2026. november 14.  ·  Munkaág: `fejlesztes/4-feed`

| Feladat | Állapot | Mi kész / mi hiányzik |
|---|---|---|
| F01 Partner és felhasználás jóváhagyása | ⏳ **Partneri lépésre vár** | Megkeresés-tervezet kész (`docs/partner/megkereses-kondela.md`). Az írásos hozzáférés még nincs meg. |
| F02 Mintafájl és mezőtérkép | ⏳ **Mintafájlra vár** | Mezőtérkép kész (`docs/partner/mezoterkep.md`); a hiánytérkép-eszköz (`scripts/feed-gap-report.mjs`) a minta megérkezésekor azonnal futtatható. |
| F03 Első bolti adapter | ✅ Kész (kitalált mintával igazolva) | `scripts/import-feeds.mjs`, `scripts/adapters/heureka-xml.mjs`, `scripts/import-lib.mjs` |
| F04 Biztonságos futtatás és publikálás | ✅ Kész | titok csak a futtatókörnyezetben, nyers adat nincs Gitben, atomikus csere |
| F05 Szűk pilot és kézi mintavétel | ⏳ Valós feedre vár | Mintavételi eszköz kész (`scripts/feed-sample.mjs`), jóváhagyási folyamat leírva. |
| F06 Éles feed működtetési feltétele | ⏳ Valós feedre és 7 napra vár | Napi jelentés, sikeres-futás-számláló, visszaállítási eszköz és próba kész; a 7 egymást követő éles futás naptári idő. |

Tesztek: `node --test test/*.test.mjs` — **62/62** (12 új feedimport-teszt).

> **Fontos:** a feedimport minden próbája egy **kitalált, „MINTA” jelölésű** tesztfeeddel készült (`test/fixtures/feeds/minta-heureka.xml`), nem valós bolti adattal. A valós beállításban egyik feed sincs engedélyezve, amíg nincs írásos megállapodás.

---

## F01 — Partner és felhasználás jóváhagyása
- Nyilvános források alapján a Kondela Dognet-kampányáról konkrét információ nem érhető el; a régióban a bútorboltok jellemzően XML-feedet (gyakran Heureka- vagy Google-formátumot) adnak; a Bonami.hu a nyilvános adatok szerint a CJ Affiliate-en szerepel. **Ezek nem hiteles partneradatok** — ezért kell az írásos megkeresés.
- Megkeresés-tervezet 10 konkrét kérdéssel: megjelenítés, affiliate link, **képek**, **származtatott méretadatok**, árak/készlet, leállás és visszavonás; mintafájl, frissítés, megszűnt termék, méret- és vásárlásiegység-mezők, változatcsoport.
- A kód kikényszeríti: feed csak `enabled: true` **és** kitöltött `usage.agreementRef` mellett fut; képet csak `imagesAllowed`, méretet csak `dimensionsAllowed`, linket csak `linksAllowed` mellett használ. (Teszt: megállapodás nélkül mindkét valós feed kihagyva, a katalógus változatlan.)

## F02 — Mintafájl és mezőtérkép
- `docs/partner/mezoterkep.md`: Heureka-mező → DREAMR-mező, kötelezőség, átalakítás.
- `scripts/feed-gap-report.mjs --file <minta.xml>`: lefedettség mezőnként (⚠️ a hiányos kötelező mezőknél), külön az alaprajzra kerülő tételek méretlefedettsége, leképezetlen kategóriák, a feed paraméternevei. A kimenet a `.feed-work/`-be kerül (nincs Gitben).

## F03 — Első bolti adapter
**Kész, ha:** ugyanazon feed kétszeri importja nem hoz létre duplikációt; a hibás tétel karanténba kerül.
- Azonosító: `<kategória>.<bolt>-<ITEMGROUP_ID>.<ITEM_ID>` — változatcsoport → termék, tétel → változat.
- Mezőellenőrzés: azonosító, név, https-link, HUF-ár, kategória (ékezetfüggetlenül: *díszpárna → díszpárnák*), alaprajzra kerülő tételnél szélesség+mélység, pilotkategória, ismétlődő azonosító.
- Átalakítás: mm/cm/m → cm, szóközös ár, kiszerelés → vásárlási egység, kép csak engedéllyel (licenc: `permitted` + megállapodás).
- **Próba (mintafeed, 10 tétel):** 5 elfogadva, 5 karanténban okkal (nincs ár, euró ár, nincs méret, ismeretlen kategória, ismétlődő azonosító). ✔
- **Kétszeri import (függvény és parancssor):** 5 feedváltozat marad, az eredmény bájtra azonos. ✔
- Jóváhagyás megmarad újraimportnál; a feedből eltűnt tétel nem törlődik, hanem `missingSince` jelölést kap (mentett tervek, választék miatt).
- Jóvá nem hagyott feedtermék nem kerül a tervezőbe. Böngészős próba: a jóváhagyott MINTA-kanapé megjelent (KONDELA, 212 × 88 × 84 cm, „Ár ellenőrizve”), a jóvá nem hagyottak nem.

## F04 — Biztonságos futtatás és publikálás
**Kész, ha:** félbeszakadt importnál a korábbi jó katalógus marad; titok nem jelenik meg a böngészőben.
- Feed-URL/kulcs: GitHub Actions secret (`FEED_KONDELA_URL`), csak a CI-ben; minden naplóban, hibában, jelentésben kitakarva. **Teszt:** szándékosan titkos kulccsal indított, sikertelen letöltés — a kulcs sehol nem jelenik meg. ✔ A böngésző a feedet sosem éri el (csak a kész katalógust).
- Nyers feed és karanténrészletek: `.feed-work/` — `.gitignore`-ban. ✔
- Atomikus csere: séma- és hivatkozás-ellenőrzés → ideiglenes fájl → átnevezés. **Teszt:** szimulált megszakadás az ideiglenes fájl után → a katalógus SHA-256 ellenőrzőösszege változatlan, ideiglenes fájl nem marad. ✔ Túl sok karanténba került tétel → nincs írás, piros futás. ✔
- Napi munkafolyamat (`.github/workflows/import-feeds.yml`) közös sávban az árfrissítővel (nem írnak egyszerre).

## F05 — Pilot és kézi mintavétel (valós feedre vár)
- `scripts/feed-sample.mjs --n 30`: ismételhető véletlenszerű minta, a kezdőajánlatok mindig benne; pipálható lista (kategória, ár, méret, változat, kép, link).
- Jóváhagyás: `review.status = approved` + felvétel a választékba; pilotkeret: 300 nappali-változat (`pilot`).

## F06 — Éles működtetés (valós feedre és 7 napra vár)
- Napi jelentés: futás-összefoglaló + `reports/feeds/<feed>-history.json` (darabszám, elfogadott, karantén, időtartam, hiba) és **egymást követő sikeres futások** száma (cél: 7).
- Visszaállítás: `scripts/restore-catalog.mjs --ref <commit>` — **próba (teszt):** import után a korábbi pillanatkép ellenőrzötten visszajött. ✔
- Üzemeltetési útmutató: `docs/feed-uzemeltetes.md` (bekapcsolás, napi működés, jóváhagyás, visszaállítás, partneri leállás).

### Menet közben talált és javított hibák
- A kategória-leképezés a magyar toldalékolásnál elbukott (*díszpárna* ≠ *díszpárnák*, a szóvégi a → á miatt) → ékezetfüggetlen összevetés + teszt.
- A boltszűrő kódba égetett listája kiszűrte volna az új partner termékeit → a boltlista a katalógusból jön.
- A hiánytérkép rossz százalékot és szétesett táblázatot adott → javítva.

---

## Nyitott akadályok
1. **F01:** írásos hozzáférés és használati keret a Kondelától / Dognettől (vagy a Bonamitól). → `docs/partner/megkereses-kondela.md`
2. **F02:** minta XML/CSV és szabályok (frissítés, törlés, készlet, méret- és egységmezők).
3. **F05–F06:** a valós feed bekötése után 30+ elemű kézi minta és 7 egymást követő sikeres napi import.

Szakasz lezárása  [ ] Elfogadva   Felelős: __________________   Dátum: __________
