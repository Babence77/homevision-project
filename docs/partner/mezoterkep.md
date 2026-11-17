# Mezőtérkép — bolti feed → DREAMR katalógus (F02)

A térkép a régióban gyakori **Heureka-XML** formátumra készült; a partner mintafájlja alapján véglegesítendő.
A tényleges lefedettséget a minta megérkezésekor ez mutatja meg:

```
node scripts/feed-gap-report.mjs --file <minta.xml> --feed kondela
```

(A kimenet a `.feed-work/` mappába kerül, ami nincs a Gitben.)

| DREAMR mező (`data/catalog.json`) | Heureka-XML | Kötelező? | Megjegyzés |
|---|---|---|---|
| változat `id` | `ITEM_ID` (+ kategória, `ITEMGROUP_ID`) | igen | `<kategória>.<bolt>-<csoport>.<tétel>` — ismételt importnál ugyanaz → nincs duplikáció |
| termék (változatcsoport) | `ITEMGROUP_ID` | ajánlott | hiánya esetén minden tétel külön termék |
| `sku` | `ITEM_ID` | igen | |
| `name.hu`, `storeName` | `PRODUCTNAME` / `PRODUCT` | igen | |
| `urls.canonical`, `urls.buy` | `URL` | igen | https; affiliate formátum az F01 válasza szerint |
| `basePrice.amount` | `PRICE_VAT` | igen | egész forint; egy **vásárlási egység** ára |
| pénznem | `CURRENCY` | igen | csak HUF fogadható el |
| `category` | `CATEGORYTEXT` → `categoryMap` | igen | ékezetfüggetlen részszöveg-egyezés; ismeretlen → karantén |
| `dimensions.width/depth` | `PARAM` „Szélesség”, „Mélység” | **igen, ha alaprajzra kerül** | mm/cm/m → cm; hiány → karantén |
| `dimensions.height` | `PARAM` „Magasság” | ajánlott | 3D-nézethez |
| `sale.pack` (vásárlási egység) | `PARAM` „Kiszerelés” / „Csomag tartalma” | **igen a költséghez** | hiányában 1 db feltételezés — a jelentés jelzi |
| `attributes.color` / `material` | `PARAM` „Szín” / „Anyag” | ajánlott | |
| `attributes.availability` | `DELIVERY_DATE` | ajánlott | 0 = raktáron |
| `image` | `IMGURL` | csak engedéllyel | `usage.imagesAllowed`; licenc: `permitted` + megállapodás-hivatkozás |
| megszűnt termék | a tétel eltűnése a feedből | — | nem törlődik: `missingSince` jelölés (mentett tervek, választék) |

**A tervezésre engedés feltétele:** kötelező mezők teljesek + kézi jóváhagyás (`product.review.status = "approved"`) + felvétel a választékba (`assortment.pools`). A jóvá nem hagyott feedtermék nem jelenik meg a tervezőben.
