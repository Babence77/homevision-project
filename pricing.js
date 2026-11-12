// DREAMR — egyetlen közös költségszámítás (2. szakasz, B01–B05)
// Minden felület (lista, összegzés, PDF, bevásárlólista, mentés, megosztott terv) ezt használja.
// Pénz: egész forint (HUF). Egységár × egység — nincs osztás, így nincs kerekítési eltérés.
// Ismeretlen összeg sosem nulla: külön jelölve marad, a végösszeg mellett „+ ismeretlen”.
// Böngészőben: window.DRPricing · Node-ban (tesztek): require('./pricing.js')
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRPricing=api; })(typeof self!=='undefined'?self:this,function(){
  const MODES=['delivery','pickup'];
  const huf=n=>{ if(n==null||!Number.isFinite(+n)) return null; return Math.round(+n); };

  // ---- B01 + B02: kért darabszám → megvásárolandó egység ----
  // sale: {pack, unit, minOrder, orderMultiple, modes:{delivery:{multiple}, pickup:{multiple}}}
  // Visszaad: kért darab, egység, megkapott darab, többlet és a többlet okai (mind magyarázható).
  function purchase(requested,sale,mode){
    const r=Math.max(0,Math.floor(+requested||0));
    const s=sale||{}, pack=Math.max(1,Math.floor(s.pack||1)), reasons=[];
    if(!r) return {requested:0,units:0,pieces:0,extra:0,pack,unit:s.unit||'db',reasons};
    let units=Math.ceil(r/pack);
    if(units*pack>r) reasons.push({code:'pack',pack,unit:s.unit||'db'});
    const min=Math.max(1,Math.floor(s.minOrder||1));
    if(units<min){ units=min; reasons.push({code:'min',min}); }
    const modeMult=s.modes&&s.modes[mode]&&s.modes[mode].multiple;
    const mult=Math.max(1,Math.floor(modeMult||s.orderMultiple||1));
    if(units%mult){ units=Math.ceil(units/mult)*mult; reasons.push({code:'multiple',multiple:mult,mode:modeMult?mode:null}); }
    return {requested:r,units,pieces:units*pack,extra:units*pack-r,pack,unit:s.unit||'db',reasons};
  }

  // ---- B04: szállítási / átvételi díj egy bolt részösszegére ----
  // Visszaad: {known:true, amount} vagy {known:false, min, max, note} — ismeretlennél min/max lehet null.
  function shippingFee(rule,subtotal,opts){
    const o=opts||{};
    if(!rule||rule.type==='unknown') return {known:false,min:null,max:null,note:rule&&rule.note||null};
    if(rule.type==='free') return {known:true,amount:0,note:rule.note||null};
    if(rule.type==='from') return {known:false,min:rule.min,max:null,note:rule.note||null};
    if(rule.type==='table'){
      if(rule.minOrder&&subtotal<rule.minOrder) return {known:false,min:null,max:null,note:rule.note||null,belowMinimum:rule.minOrder};
      const feeIn=zone=>{ const rows=rule.zones[zone]; for(const [limit,fee] of rows) if(subtotal<limit) return fee; return rows[rows.length-1][1]; };
      if(o.zone&&rule.zones[o.zone]) return {known:true,amount:feeIn(o.zone),zone:o.zone,service:rule.service};
      const fees=Object.keys(rule.zones).map(feeIn);   // zóna nélkül: a lehetséges díjak tartománya
      return {known:false,min:Math.min(...fees),max:Math.max(...fees),service:rule.service,needsZone:true};
    }
    return {known:false,min:null,max:null};
  }

  // ---- Egy tétel ----
  // input: {id, name, store, url, unitPrice (egy megvásárolható egység ára, vagy null), requested, placed?, sale, requires:[...], priceUncertain}
  function line(input,mode){
    const q=purchase(input.placed!=null?input.placed:input.requested,input.sale,mode);
    const unitPrice=huf(input.unitPrice);
    return {...input,...q,unplaced:input.placed!=null?Math.max(0,(input.requested||0)-input.placed):0,
      unitPrice,priceKnown:unitPrice!=null,total:unitPrice!=null?q.units*unitPrice:null};
  }

  // ---- B03: kiegészítők egy tételhez ----
  // req: {id,label,per,ref,note}; refInfo(url) → {name, store, url, unitPrice, sale, uncertain} vagy null
  function accessories(ln,mode,refInfo){
    return (ln.requires||[]).map(req=>{
      const need=req.per*ln.pieces, ref=req.ref&&refInfo?refInfo(req.ref):null;
      if(!need) return null;
      if(!ref||ref.unitPrice==null) return {for:ln.id,forName:ln.name,id:req.id,label:req.label,note:req.note,need,known:false};
      const q=purchase(need,ref.sale,mode), unitPrice=huf(ref.unitPrice);
      return {for:ln.id,forName:ln.name,id:req.id,label:req.label,note:req.note,need,known:true,ref:{name:ref.name,store:ref.store,url:ref.url},
        ...q,unitPrice,total:q.units*unitPrice,uncertain:!!ref.uncertain};
    }).filter(Boolean);
  }

  // ---- B05: a teljes számítás ----
  // input: {lines:[…], mode:'delivery'|'pickup', zone:'A'|'B'|null, shipping:{store:{delivery,pickup}}, refInfo, paint:{cost,verified}|null, priceDate}
  function compute(input){
    const mode=MODES.includes(input.mode)?input.mode:'delivery';
    const lines=(input.lines||[]).map(l=>line(l,mode));
    const acc=[]; lines.forEach(l=>acc.push(...accessories(l,mode,input.refInfo)));
    const stores={};
    const add=(store,amount)=>{ (stores[store]||(stores[store]={store,subtotal:0,lines:0})).subtotal+=amount; };
    lines.forEach(l=>{ if(l.units&&l.total!=null){ add(l.store,l.total); stores[l.store].lines++; } else if(l.units) (stores[l.store]||(stores[l.store]={store:l.store,subtotal:0,lines:0})); });
    acc.forEach(a=>{ if(a.known) add(a.ref.store,a.total); });
    Object.values(stores).forEach(s=>{ const rule=input.shipping&&input.shipping[s.store]&&input.shipping[s.store][mode];
      s.shipping=shippingFee(rule,s.subtotal,{zone:input.zone}); });

    const products=lines.reduce((a,l)=>a+(l.total||0),0);
    const accessoriesKnown=acc.filter(a=>a.known).reduce((a,x)=>a+x.total,0);
    const paint=input.paint&&input.paint.cost?huf(input.paint.cost):0;
    const shipKnown=Object.values(stores).reduce((a,s)=>a+(s.shipping.known?s.shipping.amount:0),0);
    const shipMin=Object.values(stores).reduce((a,s)=>a+(s.shipping.known?0:(s.shipping.min||0)),0);
    const unknown={
      prices:lines.filter(l=>l.units&&!l.priceKnown).map(l=>({id:l.id,name:l.name,store:l.store})),
      accessories:acc.filter(a=>!a.known),
      shipping:Object.values(stores).filter(s=>!s.shipping.known).map(s=>({store:s.store,...s.shipping}))
    };
    const known=products+accessoriesKnown+paint+shipKnown;
    return {mode,zone:input.zone||null,priceDate:input.priceDate||null,lines,accessories:acc,stores:Object.values(stores),
      totals:{products,accessories:accessoriesKnown,paint,shipping:shipKnown,known,minimum:known+shipMin,
        hasUnknown:unknown.prices.length+unknown.accessories.length+unknown.shipping.length>0},
      unknown,
      extras:lines.filter(l=>l.extra>0).map(l=>({id:l.id,name:l.name,requested:l.requested,pieces:l.pieces,extra:l.extra,reasons:l.reasons})),
      unplaced:lines.filter(l=>l.unplaced>0).map(l=>({id:l.id,name:l.name,unplaced:l.unplaced}))};
  }

  // ---- Árpillanatkép (mentéshez / megosztáshoz) és összevetés ----
  function snapshot(result){
    return {at:new Date().toISOString(),priceDate:result.priceDate,mode:result.mode,zone:result.zone,known:result.totals.known,
      lines:result.lines.filter(l=>l.units).map(l=>({id:l.id,url:l.url,units:l.units,unitPrice:l.unitPrice,total:l.total}))};
  }
  function diff(saved,current){
    if(!saved) return null;
    // A mentés URL-lel, a megosztott link (rövidebb) tétel-azonosítóval hivatkozik a tételre.
    const changed=[]; const byKey={}; (saved.lines||[]).forEach(l=>byKey[l.url||('#'+l.id)]=l);
    current.lines.filter(l=>l.units).forEach(l=>{ const s=byKey[l.url]||byKey['#'+l.id]; if(s&&s.unitPrice!=null&&l.unitPrice!=null&&s.unitPrice!==l.unitPrice) changed.push({name:l.name,from:s.unitPrice,to:l.unitPrice,units:l.units}); });
    return {from:saved.known,to:current.totals.known,delta:current.totals.known-saved.known,changed,savedAt:saved.at};
  }

  return {MODES,purchase,shippingFee,line,accessories,compute,snapshot,diff,huf};
});
