// DREAMR — bolti termékoldalak lekérése és termékhez kötött adatkinyerés.
// Elv: árat CSAK akkor fogadunk el, ha az oldalon azonosítható pontosan az a termék
// (és változat), amelyre a link mutat. Kategóriaoldal, idegen cikkszám, más változat
// vagy robotszűrő esetén nincs elfogadott ár — ilyenkor a hívó az utolsó jó árat tartja meg.

export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Állapotok (a jelentésekben és a prices.json-ban is ezek szerepelnek)
export const STATUS = {
  OK: 'ok',                       // azonosított termék, elfogadott HUF ár
  REDIRECT: 'redirect',           // átirányít egy másik termékoldalra — kézi ellenőrzés kell
  GONE: 'gone',                   // 404/410, vagy kategória-/főoldalra irányít: megszűnt
  BLOCKED: 'blocked',             // 403 / robotszűrő: nem ellenőrizhető (nem kerüljük meg)
  MISMATCH: 'identity_mismatch',  // termékoldal, de nem a várt cikkszám/változat
  PARSE: 'parse_error',           // termékoldal, de nem nyerhető ki megbízható ár
  HTTP: 'http_error',             // egyéb HTTP hiba (pl. 5xx)
  NETWORK: 'network_error'        // időtúllépés, DNS, kapcsolat
};

// Lekérés kézi átirányítás-követéssel, hogy minden lépés látható legyen.
export async function fetchPage(url, { timeoutMs = 25000, maxHops = 5 } = {}) {
  const chain = [];
  let current = url;
  try {
    for (let hop = 0; hop <= maxHops; hop++) {
      const res = await fetch(current, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'hu-HU,hu;q=0.9' },
        redirect: 'manual', signal: AbortSignal.timeout(timeoutMs)
      });
      chain.push({ url: current, status: res.status });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location'), current).href;
        continue;
      }
      const html = await res.text();
      return { status: res.status, finalUrl: current, chain, html };
    }
    return { status: 0, finalUrl: current, chain, html: '', error: 'túl sok átirányítás' };
  } catch (e) {
    return { status: 0, finalUrl: current, chain, html: '', error: e.name === 'TimeoutError' ? 'időtúllépés' : (e.message || String(e)) };
  }
}

// Újrapróbálás átmeneti hibánál (hálózat, időtúllépés, 429, 5xx) — 403/404-nél nem, az végleges.
export async function fetchWithRetry(url, { retries = 2, backoffMs = [2000, 6000], ...opts } = {}) {
  let page;
  for (let attempt = 0; attempt <= retries; attempt++) {
    page = await fetchPage(url, opts);
    const transient = page.error || page.status === 429 || page.status >= 500;
    if (!transient) return { ...page, attempts: attempt + 1 };
    if (attempt < retries) await new Promise(r => setTimeout(r, backoffMs[attempt] ?? backoffMs.at(-1)));
  }
  return { ...page, attempts: retries + 1 };
}

// --- segédfüggvények ---
const norm = u => {
  try { const x = new URL(String(u).replace(/\\\//g, '/')); return (x.origin + x.pathname).replace(/\/+$/, '').toLowerCase(); }
  catch { return String(u).replace(/\/+$/, '').toLowerCase(); }
};
const digits = s => String(s ?? '').replace(/\D/g, '');
// "214900", "105000 Ft", 8990, "8 990" → egész forint; minden más → NaN
const toHuf = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : NaN;
  const m = String(v ?? '').replace(/\s/g, '').match(/^(\d+)(?:[.,]\d+)?(?:Ft)?$/i);
  return m ? +m[1] : NaN;
};

// Minden JSON-LD termék kilapítva (@graph, tömbök, ProductGroup.hasVariant).
export function ldProducts(html) {
  const out = [];
  const visit = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(visit);
    const type = [].concat(o['@type'] || []).join(',');
    if (/Product/i.test(type)) out.push(o);
    if (o['@graph']) visit(o['@graph']);
    if (o.hasVariant) visit(o.hasVariant);
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try { visit(JSON.parse(m[1])); } catch { /* hibás blokk: kihagyjuk */ }
  }
  return out;
}
const offersOf = p => [].concat(p.offers || []).flatMap(o => o && o['@type'] === 'AggregateOffer' ? [].concat(o.offers || []) : [o]).filter(Boolean);

// A link alapján várt azonosító (IKEA: 8 jegyű cikkszám, XXXL: 12 jegyű termékkód; JYSK: az oldal URL-je).
export function expectedId(store, url) {
  if (store === 'ikea') { const m = url.match(/-s?(\d{8})\/?$/); return m ? m[1] : null; }
  if (store === 'momax' || store === 'mobelix') { const m = url.match(/-(\d{12})\/?$/); return m ? m[1] : null; }
  return null;
}

const isChallenge = page => page.status === 403 || /<title>\s*Just a moment/i.test(page.html) || /cf-chl|challenge-platform/i.test(page.html);
const isProductPath = (store, url) => {
  const p = new URL(url).pathname;
  if (store === 'ikea') return /\/p\/[^/]+-s?\d{8}\/?$/.test(p);
  if (store === 'jysk') return p.split('/').filter(Boolean).length >= 3 && !/\/taxonomy\//.test(p);
  return /\/p\/.+-\d{12}\/?$/.test(p);
};

// Egy termékoldal kiértékelése: állapot + (ha azonosítható) cikkszám, név, ár.
export function evaluate(store, url, page, now = new Date()) {
  const base = { status: null, httpStatus: page.status, finalUrl: page.finalUrl, chain: page.chain, sku: null, pageName: null, price: null, reason: '' };
  if (page.error) return { ...base, status: STATUS.NETWORK, reason: page.error };
  if (isChallenge(page)) return { ...base, status: STATUS.BLOCKED, reason: `HTTP ${page.status} — robotszűrő, automatikusan nem ellenőrizhető` };
  if (page.status === 404 || page.status === 410) return { ...base, status: STATUS.GONE, reason: `HTTP ${page.status}` };
  if (page.status !== 200) return { ...base, status: STATUS.HTTP, reason: `HTTP ${page.status}` };

  const redirected = norm(page.finalUrl) !== norm(url);
  if (redirected && !isProductPath(store, page.finalUrl)) {
    return { ...base, status: STATUS.GONE, reason: `kategória- vagy gyűjtőoldalra irányít: ${page.finalUrl}` };
  }
  const products = ldProducts(page.html);
  if (!products.length) return { ...base, status: redirected ? STATUS.GONE : STATUS.PARSE, reason: 'nincs termékadat (JSON-LD Product) az oldalon' };

  let match = null, reason = '';
  if (store === 'ikea' || store === 'momax' || store === 'mobelix') {
    const want = expectedId(store, url);
    match = products.find(p => [p.sku, p.productID, p.mpn].some(v => v != null && digits(v) === want));
    if (!match) reason = `a várt cikkszám (${want}) nincs az oldalon; talált: ${products.map(p => p.sku || p.productID).filter(Boolean).join(', ') || '—'}`;
  } else if (store === 'jysk') {
    // A JYSK oldalon termékcsoport van; az a változat a miénk, amelynek ajánlata erre az oldalra mutat.
    match = products.find(p => offersOf(p).some(o => o.url && norm(o.url) === norm(page.finalUrl)));
    if (!match) reason = 'nincs olyan változat, amelynek ajánlata erre a termékoldalra mutat';
  }
  if (!match) return { ...base, status: STATUS.MISMATCH, reason };

  const offer = offersOf(match).find(o => store !== 'jysk' || (o.url && norm(o.url) === norm(page.finalUrl))) || offersOf(match)[0];
  const sku = match.sku || match.productID || match.mpn || null;
  const pageName = match.name || null;
  if (!offer) return { ...base, sku, pageName, status: STATUS.PARSE, reason: 'a terméknek nincs ajánlata (offer)' };
  const priced = offerPrice(offer, now);
  if (priced.error) return { ...base, sku, pageName, status: STATUS.PARSE, reason: priced.error };
  const extra = { price: priced.price, listPrice: priced.listPrice, saleUntil: priced.saleUntil, availability: offer.availability ? String(offer.availability).replace(/^https?:\/\/schema\.org\//, '') : null };

  if (redirected) {
    const same = expectedId(store, url) != null; // IKEA/XXXL: a cikkszám egyezése már igazolta az azonosságot
    return { ...base, sku, pageName, ...extra, status: STATUS.REDIRECT, identityConfirmed: same,
      reason: `${same ? 'ugyanaz a cikkszám, új címen' : 'másik termékoldalra irányít — kézi ellenőrzés kell'}: ${page.finalUrl}` };
  }
  return { ...base, sku, pageName, ...extra, status: STATUS.OK, reason: '' };
}

// Az ajánlat érvényes forintára. Akciónál (IKEA) a priceSpecification-ben az aktuális ár
// érvényességi idővel, a régi ár „StrikethroughPrice” típussal szerepel.
export function offerPrice(offer, now = new Date()) {
  const cur = c => !c || c === 'HUF';
  if (offer.price != null || offer.lowPrice != null) {
    if (!cur(offer.priceCurrency)) return { error: `nem forint ár (${offer.priceCurrency})` };
    const price = toHuf(offer.price ?? offer.lowPrice);
    return valid(price) ? { price, listPrice: null, saleUntil: null } : { error: `értelmezhetetlen ár: ${JSON.stringify(offer.price ?? offer.lowPrice)}` };
  }
  const specs = [].concat(offer.priceSpecification || []).filter(s => s && cur(s.priceCurrency));
  const strike = specs.find(s => /Strikethrough/i.test(s.priceType || ''));
  const active = specs.filter(s => !/Strikethrough/i.test(s.priceType || '')).filter(s => {
    const from = s.validFrom ? Date.parse(s.validFrom) : -Infinity, to = s.validThrough ? Date.parse(s.validThrough) + 86400000 : Infinity;
    return now >= from && now < to;
  });
  if (!active.length) return { error: specs.length ? 'nincs most érvényes ár (lejárt vagy jövőbeli akció)' : 'az ajánlatban nincs ár' };
  const price = toHuf(active[0].price), listPrice = strike ? toHuf(strike.price) : null;
  if (!valid(price)) return { error: `értelmezhetetlen ár: ${JSON.stringify(active[0].price)}` };
  return { price, listPrice: valid(listPrice) && listPrice > price ? listPrice : null, saleUntil: active[0].validThrough ? String(active[0].validThrough).slice(0, 10) : null };
}
const valid = p => Number.isInteger(p) && p > 0 && p <= 20000000;
