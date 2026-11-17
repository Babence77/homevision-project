// DREAMR — ajánlómotor (5. szakasz, R01, R02, R05, R06)
// Tiszta függvények, DOM nélkül: a böngészőben window.DRReco, Node-ban require('./recommendations.js').
//
// R01  Előbb SZŰR, csak utána rangsorol. Kizáró okok: tiltott bolt, rossz link (megszűnt / nem https),
//      rossz változat (más kategória, feedből eltűnt, jóvá nem hagyott feedtermék), hiányzó kötelező méret.
//      A boltszűrő SOHA nem lazul: ha egy kategóriában nincs megfelelő termék a választott boltokban,
//      a kategória üres marad (más bolt nem tölti ki) — ezt a felület jelzi.
// R02  Kerethez igazítás: kötelező (a szoba fő funkciója) / opcionális / felhasználó által zárolt tételek.
//      Sorrend: 1. olcsóbb megfelelő változat, 2. darabszám csökkentése, 3. opcionális tétel elhagyása.
//      Kötelező és zárolt tétel soha nem esik ki; ha így sincs megoldás, az eredmény ezt kimondja.
// R05  Minden döntéshez indoklás (kód + adatok), a „legolcsóbb” csak a vizsgált, megfelelő termékekre vonatkozik.
// R06  Keresés a teljes engedélyezett katalógusban (név, méret, ár, bolt).
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRReco=api; })(typeof self!=='undefined'?self:this,function(){

  const fold=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const dimOk=f=>!!(f&&f.status!=='missing'&&f.value>0);
  // Alaprajzra kerülő kategória: a szélesség és mélység kötelező (különben nem ellenőrizhető, hogy befér-e).
  const needsFootprint=cat=>!!(cat&&(cat.plan!=null||cat.floor==='furniture'||cat.floor==='rug'));

  // ---- R01: szűrés ----
  // o: a katalógus lapos tétele (catalog.js toItem + élő ellenőrzés: o.check)
  // ctx: {stores:Set|Array, category:{...}, slotCategory, keepVid}  — keepVid: a mentett tervben kifejezetten
  //      választott tétel, amely megszűnt; a listában maradhat (cserejavaslattal), de bolttiltást nem írhat felül.
  function exclusions(o,ctx){
    const out=[], stores=ctx.stores instanceof Set?ctx.stores:new Set(ctx.stores||[]);
    if(!o){ return ['variant']; }
    if(!stores.has(o.store)) out.push('store');
    const gone=!!(o.check&&o.check.status==='gone')||!!(o.variant&&o.variant.missingSince);
    const badUrl=!o.url||!/^https:\/\//.test(o.url);
    if(badUrl||(gone&&o.vid!==ctx.keepVid)) out.push('link');
    if(ctx.slotCategory&&o.category!==ctx.slotCategory) out.push('variant');
    else if(o.product&&o.product.review&&o.product.review.status!=='approved') out.push('variant');
    if(needsFootprint(ctx.category)&&o.variant&&!(dimOk(o.variant.dimensions.width)&&dimOk(o.variant.dimensions.depth))) out.push('size');
    return out;
  }
  // Egy tétel (slot) összes opciójának szűrése. Visszaad: megfelelők (sorszámmal) és kizártak okkal.
  function filterSlot(slot,ctx){
    const eligible=[],excluded=[];
    slot.options.forEach((o,idx)=>{ const r=exclusions(o,{...ctx,slotCategory:ctx.slotCategory||slot.category});
      (r.length?excluded:eligible).push(r.length?{idx,o,reasons:r}:{idx,o}); });
    return {eligible,excluded};
  }
  const countReasons=excluded=>excluded.reduce((a,x)=>{ x.reasons.forEach(r=>a[r]=(a[r]||0)+1); return a; },{});

  // ---- R01: rangsorolás (csak a megfelelők között) ----
  // 1. befér a szobába (ha a szoba ismert)  2. ellenőrzött ár  3. stílus: a szoba+stílus alapajánlata
  // 4. árszint: a stílus alapajánlatához legközelebbi ár (a stílus „szintje” megmarad)  5. olcsóbb  6. katalógus-sorrend
  // A katalógusban nincs termékenkénti stílusjelölés — a stílust a gondozott alapajánlat képviseli.
  function rank(eligible,ctx){
    const primary=ctx.primaryVid, ref=(ctx.primaryPrice!=null)?ctx.primaryPrice:null;
    const fitsF=ctx.fits||(()=>true), verF=ctx.verified||(()=>true);
    return eligible.map(e=>({...e,fits:fitsF(e.o),verified:verF(e.o),style:e.o.vid===primary}))
      .sort((a,b)=>(b.fits-a.fits)||(b.verified-a.verified)||(b.style-a.style)||
        (ref!=null?Math.abs(a.o.price-ref)-Math.abs(b.o.price-ref):0)||(a.o.price-b.o.price)||(a.idx-b.idx));
  }
  // Kezdőajánlat + indoklás (R05). Ha nincs megfelelő: {idx:-1, reason:{code:'none', ...}}.
  function recommend(slot,ctx0){
    // a stílus alapajánlata; ahol a katalógus nem jelöl ilyet, a gondozott sorrend első tétele
    const pv=ctx0.primaryVid||slot.primaryVid||(slot.options[0]&&slot.options[0].vid)||null;
    const pp=slot.options.find(o=>o&&o.vid===pv);
    const ctx={...ctx0,primaryVid:pv,primaryPrice:ctx0.primaryPrice!=null?ctx0.primaryPrice:(pp?pp.price:null)};
    const {eligible,excluded}=filterSlot(slot,ctx);
    const why={examined:eligible.length,excluded:countReasons(excluded)};
    if(!eligible.length) return {idx:-1,ranked:[],eligible,excluded,reason:{code:'none',...why}};
    const ranked=rank(eligible,ctx), top=ranked[0];
    const prim=slot.options.find(o=>o&&o.vid===ctx.primaryVid);
    let code='primary', primaryBlocked=null;
    if(!top.style){
      code='alternative';
      // miért nem az alapajánlat: kizárták (bolt, link, méret…), vagy rangsorban lejjebb került (nem fér be / nem ellenőrzött az ára)
      if(prim){ const ex=excluded.find(x=>x.o.vid===prim.vid), pr=ranked.find(r=>r.style);
        primaryBlocked=ex?ex.reasons:pr?(!pr.fits?['fit']:!pr.verified?['unverified']:[]):[]; }
    }
    return {idx:top.idx,ranked,eligible,excluded,reason:{code,primaryBlocked,primaryStore:prim?prim.store:null,primaryName:prim?prim.name:null,fits:top.fits,verified:top.verified,...why}};
  }
  // „Legolcsóbb”: csak a vizsgált, megfelelő termékek közül (R05).
  function cheapest(eligible){ return eligible.length?eligible.reduce((b,e)=>e.o.price<b.o.price?e:b,eligible[0]):null; }

  // ---- R05: bizonytalan adatok egy tételnél ----
  function uncertainties(o,priceKind){
    const v=o&&o.variant, out=[];
    if(priceKind==='stale') out.push('priceStale'); else if(priceKind==='unverified') out.push('priceUnverified'); else if(priceKind==='gone') out.push('gone');
    if(v){ const d=v.dimensions;
      if(d.width.status==='estimated'||d.depth.status==='estimated') out.push('sizeEstimated');
      if(!d.height||d.height.status==='missing') out.push('heightMissing'); else if(d.height.status==='estimated') out.push('heightEstimated');
      if(v.attributes&&v.attributes.color&&v.attributes.color.status!=='verified') out.push('colorUnknown');
    }
    return out;
  }

  // ---- R02: kerethez igazítás ----
  // slots: [{id, role:'required'|'optional', locked:bool, on:bool, sel:idx, options:[...], candidates:[idx...] (megfelelő,
  //          ellenőrzött, befér), qty:n, minQty:n, qtyLocked:bool}]  — a lista sorrendje a szoba tételsorrendje.
  // evaluate(plan) → {total, placed:{slotId:db}}   plan = {sel:{id:idx}, off:Set, qty:{id:n}}
  // Visszaad: {ok, plan, changes:[...], total, over, blockers}
  function fitBudget({slots,budget,evaluate}){
    const start={sel:Object.fromEntries(slots.map(s=>[s.id,s.sel])),off:new Set(slots.filter(s=>!s.on).map(s=>s.id)),qty:Object.fromEntries(slots.map(s=>[s.id,s.qty]))};
    const clone=p=>({sel:{...p.sel},off:new Set(p.off),qty:{...p.qty}});
    const plan=clone(start); let cur=evaluate(plan);
    const startTotal=cur.total, startEval=cur;
    if(cur.total<=budget) return {ok:true,plan,changes:[],total:cur.total,startTotal,over:0,blockers:[]};
    // Semmi nem tűnhet el csendben: a változtatás után minden eredetileg elhelyezett darab a helyén marad.
    const keepsPlacement=e=>Object.entries(startEval.placed||{}).every(([id,n])=>plan.off.has(id)||(e.placed||{})[id]>=Math.min(n,plan.qty[id]??n));
    const optName=(s,i)=>s.options[i]&&s.options[i].name;
    const lineOf=s=>{ const o=s.options[plan.sel[s.id]]; return o?o.price*(plan.qty[s.id]||1):0; };
    const free=s=>!s.locked&&!plan.off.has(s.id);
    const tryApply=(mut)=>{ const p=clone(plan); mut(p); const e=evaluate(p); return {p,e}; };

    // 1. olcsóbb megfelelő változat — a legdrágább tételtől; az első elégséges (a lehető legjobb), különben a legolcsóbb
    for(const s of [...slots].filter(free).sort((a,b)=>lineOf(b)-lineOf(a))){
      if(cur.total<=budget) break;
      const now=s.options[plan.sel[s.id]];
      const cheaper=(s.candidates||[]).filter(i=>i!==plan.sel[s.id]&&s.options[i].price<now.price).sort((a,b)=>s.options[b].price-s.options[a].price);
      let pick=null;
      for(const i of cheaper){ const r=tryApply(p=>{ p.sel[s.id]=i; }); if(!keepsPlacement(r.e)) continue; pick=r; if(r.e.total<=budget) break; }
      if(pick){ Object.assign(plan,pick.p); cur=pick.e; }
    }
    // 2. darabszám csökkentése (a felhasználó által beállított darabszám zárolt)
    for(const s of [...slots].filter(s=>free(s)&&!s.qtyLocked).reverse()){
      while(cur.total>budget&&plan.qty[s.id]>(s.minQty||1)){
        const r=tryApply(p=>{ p.qty[s.id]--; }); if(r.e.total>=cur.total) break;
        Object.assign(plan,r.p); cur=r.e;
      }
      if(cur.total<=budget) break;
    }
    // 3. opcionális tétel elhagyása — a lista végéről (kiegészítők, dekoráció) a fő bútorok felé
    for(const s of [...slots].filter(s=>free(s)&&s.role!=='required').reverse()){
      if(cur.total<=budget) break;
      const r=tryApply(p=>{ p.off.add(s.id); }); if(r.e.total>=cur.total) continue;
      Object.assign(plan,r.p); cur=r.e;
    }
    const ok=cur.total<=budget;
    // 4. visszaépítés: ami a kereten belül visszafér, visszakerül — a fontosabb tételtől (lista eleje) kezdve:
    //    elhagyott tétel, darabszám, majd a lecserélt tétel az eredetihez legközelebbi (drágább) megfelelő változatra.
    if(ok){
      const accept=r=>{ if(r.e.total<=budget&&keepsPlacement(r.e)){ Object.assign(plan,r.p); cur=r.e; return true; } return false; };
      for(const s of slots) if(plan.off.has(s.id)&&!start.off.has(s.id)) accept(tryApply(p=>{ p.off.delete(s.id); }));
      for(const s of slots) while(plan.qty[s.id]<start.qty[s.id]&&!plan.off.has(s.id)&&accept(tryApply(p=>{ p.qty[s.id]++; })));
      for(const s of slots){ if(plan.sel[s.id]===start.sel[s.id]||plan.off.has(s.id)) continue;
        const was=s.options[start.sel[s.id]].price, now=s.options[plan.sel[s.id]].price;
        const better=[start.sel[s.id],...(s.candidates||[])].filter((i,k,a)=>a.indexOf(i)===k&&s.options[i].price>now&&s.options[i].price<=was).sort((a,b)=>s.options[b].price-s.options[a].price);
        for(const i of better) if(accept(tryApply(p=>{ p.sel[s.id]=i; }))) break; }
    }
    // A változtatások listája a kiinduló és a végső állapot különbsége; a megtakarítás az, amennyivel a tétel
    // visszavonása növelné a végösszeget (egyenként visszavonható).
    const changes=[], back=mut=>{ const p=clone(plan); mut(p); return evaluate(p).total-cur.total; };
    for(const s of slots){
      // elhagyott tételnél csak az elhagyás számít (az eredeti választással) — nincs előtte „csere” is
      if(plan.off.has(s.id)&&!start.off.has(s.id)){ plan.sel[s.id]=start.sel[s.id]; plan.qty[s.id]=start.qty[s.id];
        changes.push({type:'drop',slot:s.id,role:s.role,name:optName(s,start.sel[s.id]),saving:back(p=>{ p.off.delete(s.id); })}); continue; }
      if(plan.sel[s.id]!==start.sel[s.id]) changes.push({type:'swap',slot:s.id,role:s.role,from:start.sel[s.id],to:plan.sel[s.id],fromName:optName(s,start.sel[s.id]),toName:optName(s,plan.sel[s.id]),saving:back(p=>{ p.sel[s.id]=start.sel[s.id]; })});
      if(plan.qty[s.id]!==start.qty[s.id]) changes.push({type:'qty',slot:s.id,role:s.role,from:start.qty[s.id],to:plan.qty[s.id],saving:back(p=>{ p.qty[s.id]=start.qty[s.id]; })});
    }
    const order={swap:0,qty:1,drop:2}; changes.sort((a,b)=>order[a.type]-order[b.type]);
    const blockers=ok?[]:slots.filter(s=>!plan.off.has(s.id)&&(s.role==='required'||s.locked)).map(s=>({slot:s.id,role:s.role,locked:!!s.locked,name:optName(s,plan.sel[s.id])}));
    return {ok,plan,changes,total:cur.total,startTotal,over:ok?0:cur.total-budget,blockers};
  }

  // ---- R06: keresés a teljes engedélyezett katalógusban ----
  // items: lapos tételek; f: {q, stores, category, maxW, maxD, minPrice, maxPrice}; ctx.categoryLabel(id) a kategórianévhez.
  // Csak megfelelő (R01 szűrőn átmenő) tétel jelenik meg — tiltott bolt, megszűnt, hiányzó méretű nem.
  function search(items,f,ctx={}){
    const terms=fold(f.q).split(/\s+/).filter(Boolean);
    const stores=f.stores instanceof Set?f.stores:new Set(f.stores||[]);
    const out=[];
    for(const o of items){
      const cat=ctx.categories&&ctx.categories[o.category];
      if(cat&&cat.accessoryOnly) continue;
      if(exclusions(o,{stores,category:cat}).length) continue;
      if(f.category&&o.category!==f.category) continue;
      if(f.maxW&&!(o.w>0&&o.w<=f.maxW)) continue;
      if(f.maxD&&!(o.d>0&&o.d<=f.maxD)) continue;
      if(f.minPrice&&!(o.price>=f.minPrice)) continue;
      if(f.maxPrice&&!(o.price<=f.maxPrice)) continue;
      let score=0;
      if(terms.length){
        const name=fold(o.name), hay=[name,fold(o.product&&o.product.family),fold(o.sku),fold(ctx.categoryLabel?ctx.categoryLabel(o.category):o.category),fold(o.store)].join(' ');
        if(!terms.every(t=>hay.includes(t))) continue;
        score=terms.reduce((a,t)=>a+(name.startsWith(t)?3:name.includes(t)?2:1),0);
      }
      out.push({o,score});
    }
    return out.sort((a,b)=>(b.score-a.score)||(a.o.price-b.o.price)).map(x=>x.o);
  }

  return {fold,needsFootprint,exclusions,filterSlot,countReasons,rank,recommend,cheapest,uncertainties,fitBudget,search};
});
