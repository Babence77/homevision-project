# Megkeresés-tervezet — Kondela (Dognet) termékfeed (F01–F02)

> **TERVEZET — elküldés előtt nézd át és szabd testre.** A levelet a DREAMR nevében te (vagy a cég képviselője) küldöd.
> Első lépés: a Dognet publisher-felületén jelentkezés a Kondela magyar kampányára. Ha a kampány elfogad,
> a feedhez és a felhasználási kerethez **írásos** megerősítést kérünk (a nyilvános affiliate oldal önmagában nem elég).
> Tartalék irány: Bonami partnerprogram (nyilvános adatok szerint CJ Affiliate) — ugyanezekkel a kérdésekkel.

---

**Tárgy:** DREAMR — termékfeed-hozzáférés és felhasználási feltételek (Kondela HU kampány)

Tisztelt Kondela / Dognet Partnerkapcsolati Csapat!

A DREAMR egy magyar nyelvű online lakberendezés-tervező (https://babence77.github.io/homevision-project/): a felhasználó megadja a szobája méreteit és stílusát, a tervező valódi, megvásárolható termékekből állít össze javaslatot alaprajzzal, 3D-nézettel, költségbecsléssel és bevásárlólistával. A termékoldalakra mutató linkeken keresztül a vásárlás az Önök webáruházában történik.

Szeretnénk a Kondela magyar kínálatát a Dognet-kampány termékfeedjén keresztül bekötni. Ehhez az alábbiakban kérnénk írásos tájékoztatást, illetve jóváhagyást:

**Felhasználás (F01)**
1. Megjeleníthetjük-e a feed termékeit a tervezőben (név, ár, kategória, termékoldal-link), és milyen formában kell az affiliate linket használni?
2. Felhasználhatjuk-e a **termékfotókat** a tervezőben (termékkártya, ajánlat-PDF)? Ha igen, milyen feltétellel (forrásmegjelölés, méret, gyorsítótárazás, hotlink vagy saját tárhely)?
3. Felhasználhatjuk-e a feed **méretadatait** a tervezésre (alaprajz, 3D-modell méretezése), és megjeleníthetjük-e ezekből számolt értékeket (pl. elfér-e a szobában)?
4. Vannak-e korlátozások az árak, akciók vagy készletinformáció megjelenítésére (pl. frissítési kötelezettség)?
5. Mi a teendő a hozzáférés visszavonásakor vagy a kampány leállásakor (adatok törlése, határidő)?

**Mintafájl és szabályok (F02)**
6. Kérnénk egy **minta XML- vagy CSV-állományt** és a mezők leírását (Heureka-, Google- vagy saját formátum?).
7. Milyen gyakran frissül a feed, és mikor érdemes letölteni?
8. Hogyan jelzi a feed a **megszűnt** terméket (eltűnik, vagy külön állapotmező)? Van-e készletmező?
9. Szerepel-e a feedben a termékek **szélessége, mélysége, magassága** (és milyen mértékegységben), valamint a **vásárlási egység** (pl. 2 darabos csomag, pár, garnitúra)?
10. Van-e változatcsoport-azonosító (ugyanaz a termék más színben/méretben)?

A feedhez kapott hozzáférési kulcsot biztonságosan, kizárólag szerveroldalon kezeljük; a nyers feedet nem tesszük nyilvánosan elérhetővé.

Köszönettel:
[Név] · DREAMR · [e-mail] · [telefon]

---

## Belső jegyzet — a válasz alapján kitöltendő (`scripts/feeds.config.json` → `feeds.kondela.usage`)

| Mező | Jelentés | Kitöltés forrása |
|---|---|---|
| `agreementRef` | az írásos jóváhagyás azonosítója (pl. „Dognet levél, 2026-11-xx”) | 1–5. kérdés válasza |
| `linksAllowed` | termékoldal/affiliate link használható | 1. |
| `imagesAllowed` | termékfotó megjeleníthető | 2. |
| `dimensionsAllowed` | méretadat felhasználható a tervezéshez | 3. |
| `enabled` | csak a fentiek után kapcsolható be | — |
