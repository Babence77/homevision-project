// DREAMR — Heureka-formátumú XML termékfeed olvasása (a cseh/szlovák/magyar affiliate hálózatokban gyakori).
// Csak a feed szerkezetét olvassa ki; a bolti mezők saját adatmodellre fordítása a boltspecifikus adapter dolga.
// Külső csomag nélkül: a feed lapos szerkezetű (<SHOPITEM> blokkok, egyszerű mezők, ismétlődő <PARAM>).

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = s => String(s)
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()])
  .trim();
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : null; };
const tags = (block, name) => [...block.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'gi'))].map(m => decode(m[1]));
const num = s => { if (s == null) return null; const n = +String(s).replace(/\s/g, '').replace(',', '.'); return Number.isFinite(n) ? n : null; };

// Visszaad: { items: [nyers tétel], errors: [szerkezeti hiba] }
export function parseHeurekaXml(xml) {
  const errors = [];
  if (typeof xml !== 'string' || !/<SHOP[\s>]/i.test(xml)) return { items: [], errors: ['nem Heureka-feed: hiányzik a <SHOP> gyökérelem'] };
  const blocks = [...xml.matchAll(/<SHOPITEM>([\s\S]*?)<\/SHOPITEM>/gi)].map(m => m[1]);
  if (!blocks.length) errors.push('a feedben nincs <SHOPITEM>');
  const items = blocks.map((b, i) => {
    const params = {};
    for (const p of b.matchAll(/<PARAM>([\s\S]*?)<\/PARAM>/gi)) {
      const k = tag(p[1], 'PARAM_NAME'), v = tag(p[1], 'VAL');
      if (k) params[k] = v;
    }
    return {
      position: i + 1,
      itemId: tag(b, 'ITEM_ID'), groupId: tag(b, 'ITEMGROUP_ID'),
      productName: tag(b, 'PRODUCTNAME'), product: tag(b, 'PRODUCT'), description: tag(b, 'DESCRIPTION'),
      url: tag(b, 'URL'), imgUrl: tag(b, 'IMGURL'), imgAlternative: tags(b, 'IMGURL_ALTERNATIVE'),
      priceVat: num(tag(b, 'PRICE_VAT')), currency: tag(b, 'CURRENCY'),
      categoryText: tag(b, 'CATEGORYTEXT'), manufacturer: tag(b, 'MANUFACTURER'), ean: tag(b, 'EAN'),
      deliveryDate: tag(b, 'DELIVERY_DATE'), params
    };
  });
  return { items, errors };
}
