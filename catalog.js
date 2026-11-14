// DREAMR — katalógus-betöltő és -index (3. szakasz, C01–C02)
// A termékadat a data/catalog.json-ban él; az app és az árfrissítő ezt használja (nem JavaScript-sorokat).
// Böngészőben: window.DRCatalog — betölti a katalógust és a régi sorrend-táblát, majd elindítja az appot.
// Node-ban (tesztek, eszközök): require('./catalog.js').fromJSON(catalog, legacy)
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRCatalog=api; })(typeof self!=='undefined'?self:this,function(){

  function fromJSON(catalog,legacy){
    const variants=new Map(), byUrl=new Map(), byLegacy=new Map(), products=new Map();
    for(const p of catalog.products){
      products.set(p.id,p);
      for(const v of p.variants){
        if(variants.has(v.id)) throw new Error('Ismétlődő változatazonosító: '+v.id);
        const item=toItem(p,v);
        variants.set(v.id,item);
        [v.urls.canonical,v.urls.buy,...(v.urls.previous||[]).map(x=>x.url)].forEach(u=>{ if(u&&!byUrl.has(u)) byUrl.set(u,item); });
        (v.legacyKeys||[]).forEach(k=>{ (byLegacy.get(k)||byLegacy.set(k,[]).get(k)).push(item); });
      }
    }
    // Választék ellenőrzése: minden hivatkozott azonosító létezzen
    const missing=[];
    Object.values(catalog.assortment.pools).flat().forEach(id=>{ if(!variants.has(id)) missing.push(id); });
    const prim=catalog.assortment.primary;
    Object.values(prim.roomStyle).forEach(st=>Object.values(st).forEach(sl=>Object.values(sl).forEach(id=>{ if(!variants.has(id)) missing.push(id); })));
    Object.values(prim.style).forEach(sl=>Object.values(sl).forEach(id=>{ if(!variants.has(id)) missing.push(id); }));
    if(missing.length) throw new Error('A választékban ismeretlen azonosító: '+[...new Set(missing)].join(', '));

    // Egy szoba tételei a választott stílusban — az alapajánlat elöl, utána a kategória sorrendje.
    function slotsFor(room,style){
      return (catalog.rooms[room]||[]).map(s=>{
        let ids=(catalog.assortment.pools[s.pool]||[]).slice();
        const primary=s.primary==='roomStyle'?prim.roomStyle[room]?.[style]?.[s.slot]:s.primary==='style'?prim.style[style]?.[s.slot]:null;
        if(primary) ids=[primary,...ids.filter(x=>x!==primary)];
        if(s.limit) ids=ids.slice(0,s.limit);
        return {id:s.slot,category:s.pool,options:ids.map(id=>variants.get(id))};
      });
    }
    // Régi (v1) mentés fordítása: sorszám vagy régi kulcs → változatazonosító
    function legacyVariant(room,style,slot,{index,key}={}){
      if(!legacy) return null;
      const order=legacy.order[`${room}:${style}:${slot}`];
      if(key!=null&&order){ const hit=order.find(id=>(variants.get(id)?.variant.legacyKeys||[]).includes(key)); if(hit) return hit; }
      if(index!=null&&order&&order[index]) return order[index];
      return null;
    }
    // C06: mentett / megosztott terv átvezetése a jelenlegi formátumra (dreamr-plan/2: state.sel = változatazonosító).
    // v1: state.sel sorszám (+ 1. szakasz óta selKeys régi kulcs) → azonosító a rögzített régi sorrendből.
    // A már nem létező termék nem cserélődik csendben: megjegyzés készül róla a helyreállítási üzenethez.
    function migratePlan(c){
      const isV2=c.format==='dreamr-plan/2', sel={}, notes=[];
      for(const [k,val] of Object.entries(c.sel||{})){
        const [room,style,slot]=k.split(':');
        if(typeof val==='string'){ if(variants.has(val)) sel[k]=val; else notes.push({key:k,slot,code:'missing',was:val}); continue; }
        if(typeof val==='number'){
          const vid=legacyVariant(room,style,slot,{key:c.selKeys&&c.selKeys[k],index:val});
          if(vid&&variants.has(vid)) sel[k]=vid; else notes.push({key:k,slot,code:'unmapped',was:val});
        }
      }
      // v1: a mentés szobájában a nem rögzített tétel a mentéskori alapértelmezés (0. sorszám) volt
      if(!isV2&&c.room&&c.style) for(const s of (catalog.rooms[c.room]||[])){
        const k=`${c.room}:${c.style}:${s.slot}`;
        if(sel[k]==null&&!notes.some(n=>n.key===k)){ const vid=legacyVariant(c.room,c.style,s.slot,{key:c.selKeys&&c.selKeys[k],index:0}); if(vid) sel[k]=vid; }
      }
      const {selKeys,...rest}=c;
      return {config:{...rest,format:'dreamr-plan/2',sel},notes,migrated:!isV2};
    }
    return {
      raw:catalog, legacy, migratePlan,
      categories:catalog.categories, rooms:catalog.rooms,
      variant:id=>variants.get(id)||null, product:id=>products.get(id)||null,
      byUrl:url=>byUrl.get(url)||null, byLegacyKey:key=>byLegacy.get(key)||[],
      allItems:()=>[...variants.values()],
      slotsFor, legacyVariant
    };
  }

  // Az app által használt lapos tételobjektum (a régi P_(...) mezőivel kompatibilis), hivatkozással a teljes változatra.
  function toItem(p,v){
    return {vid:v.id,productId:p.id,category:p.category,key:(v.legacyKeys||[])[0]||v.id,
      name:v.name.hu,store:v.store,price:v.basePrice.amount,w:v.dimensions.width.value,d:v.dimensions.depth.value,
      url:v.urls.buy,canonical:v.urls.canonical,sku:v.sku||null,variant:v,product:p};
  }

  // Böngésző: betöltés, majd az app indítása
  let readyResolve,readyReject; const ready=typeof Promise!=='undefined'?new Promise((res,rej)=>{readyResolve=res;readyReject=rej;}):null;
  const api={fromJSON,toItem,ready,current:null};
  if(typeof document!=='undefined'&&typeof fetch!=='undefined'){
    const me=document.currentScript, v=me&&me.src.split('?v=')[1]?('?v='+me.src.split('?v=')[1]):'';
    Promise.all([fetch('data/catalog.json'+v,{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error('data/catalog.json: HTTP '+r.status); return r.json(); }),
                 fetch('data/legacy-v1.json'+v,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)])
      .then(([cat,leg])=>{ api.current=fromJSON(cat,leg); readyResolve(api.current);
        const s=document.createElement('script'); s.src='app.js'+v; document.body.appendChild(s); })
      .catch(err=>{ console.error('DREAMR katalógus:',err); readyReject(err);
        const box=document.getElementById('welcomeStatus'); if(box) box.textContent='A termékkatalógus nem tölthető be. Frissítsd az oldalt. ('+err.message+')'; });
  }
  return api;
});
