// DREAMR — értékesítési adatok (2. szakasz, B01–B04)
// Minden adat a bolt saját oldaláról származik; forrás és ellenőrzési dátum mellette.
// A termékeket az URL-jük azonosítja (az app.js P_(...) soraiban szereplő link).
// Böngészőben: window.DRSales · Node-ban (tesztek): require('./sales-data.js')
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRSales=api; })(typeof self!=='undefined'?self:this,function(){
  const CHECKED='2026-11-12';

  // ---- B01: értékesítési egység ----
  // pack: hány darab (lap, szál, izzó…) van egy megvásárolható egységben; unit: az egység neve.
  // minOrder / orderMultiple: egységben. modes.delivery / modes.pickup: teljesítési módhoz kötött többszörös (B02).
  // Ami itt nem szerepel: 1 darab = 1 egység, nincs minimum, nincs többszörös.
  const SALES={
    // Függönypárok: 1 egység = 2 lap (IKEA terméknév: „1 pár”, „Függönypár”)
    'https://www.ikea.com/hu/hu/p/majgull-fenyzaro-fueggoeny-1-par-szuerke-fueggoenyrancolo-szalaggal-80417815/':{unit:'pár',pack:2,source:'ikea.com termékoldal: „Fényzáró függöny, 1 pár”'},
    'https://www.ikea.com/hu/hu/p/dytag-fueggoenypar-bezs-fueggoenyrancolo-szalaggal-80607820/':{unit:'pár',pack:2,source:'ikea.com termékoldal: „Függönypár”'},
    'https://www.ikea.com/hu/hu/p/vilborg-soetetitofueggoeny-1-par-bezs-fueggoenyrancolo-szalaggal-50297555/':{unit:'pár',pack:2,source:'ikea.com termékoldal: „Sötétítőfüggöny, 1 pár”'},
    // Gyertyatartó-készlet: 1 egység = 3 darab
    'https://www.ikea.com/hu/hu/p/fulltalig-gyertyatarto-3-db-fekete-40342134/':{unit:'csomag',pack:3,source:'ikea.com termékoldal: „Gyertyatartó, 3 db”'},
    // JYSK étkezőszékek: házhozszállításnál csak 4 többszörösében rendelhetők; bolti átvételnél darabra (B02).
    // A napi árfrissítő ezt minden JYSK-terméknél újraellenőrzi (prices.json → deliveryMultiple), az itt lévő érték a kiinduló.
    'https://jysk.hu/etkezo/etkezoszekek/etkezoszek-jonstrup-szurke-szovet-natur-tolgyszinu':{unit:'db',pack:1,modes:{delivery:{multiple:4}},source:'jysk.hu termékoldal: „A Házhozszállítás kiválasztásakor ezt a terméket 4 többszörösében kell megvásárolni”'},
    'https://jysk.hu/etkezo/etkezoszekek/etkezoszek-bistrup-homok-natur-tolgyszinu':{unit:'db',pack:1,modes:{delivery:{multiple:4}},source:'jysk.hu termékoldal: „A Házhozszállítás kiválasztásakor ezt a terméket 4 többszörösében kell megvásárolni”'},
    // Kiegészítők kiszerelése
    'https://www.ikea.com/hu/hu/p/solhetta-led-es-izzo-gu10-345-lumen-fenyereje-szabh-20584096/':{unit:'db',pack:1,modes:{delivery:{multiple:2}},source:'ikea.com: „Online rendelési egység: 2 db”'},
    'https://www.ikea.com/hu/hu/p/solhetta-led-izzo-e27-806-lumen-fenyereje-szabh-kerek-opalfeh-60583924/':{unit:'csomag',pack:2,source:'ikea.com: „1 990 Ft /2 darab, Egységár: 995 Ft/darab”'}
  };
  const saleOf=url=>SALES[url]||{unit:'db',pack:1};

  // ---- B03: nem tartozék, de a használathoz szükséges kiegészítők ----
  // per: hány kiegészítő-darab kell egy termékdarabhoz. ref: a bolt által ajánlott, ellenőrzött termék (URL alapján
  // az app.js ACCESSORY listájából kapja az élő árat); ref nélkül az ára ismeretlen → „nem tartalmazza, pontosítandó”.
  const A=(id,label,per,ref,note)=>({id,label,per,ref:ref||null,note:note||''});
  const R={
    fjadrar:'https://www.ikea.com/hu/hu/p/fjaedrar-diszparnabelso-toertfeher-80262187/',
    inner:'https://www.ikea.com/hu/hu/p/inner-diszparnabelso-feher-bel-kuelter-50550702/',
    gu10:'https://www.ikea.com/hu/hu/p/solhetta-led-es-izzo-gu10-345-lumen-fenyereje-szabh-20584096/',
    e27big:'https://www.ikea.com/hu/hu/p/solhetta-led-izzo-e27-1521-lumen-fenyereje-szabh-goemb-opalfeh-70591546/',
    e27small:'https://www.ikea.com/hu/hu/p/solhetta-led-izzo-e27-806-lumen-fenyereje-szabh-kerek-opalfeh-60583924/',
    vesteroy160:'https://www.ikea.com/hu/hu/p/vesteroey-zsakrugos-matrac-kemeny-vilagoskek-40450618/',
    afjall160:'https://www.ikea.com/hu/hu/p/afjaell-habszivacs-matrac-kemeny-feher-50569952/',
    afjall90m:'https://www.ikea.com/hu/hu/p/afjaell-habszivacs-matrac-koezepesen-kemeny-feher-40568646/',
    afjall90k:'https://www.ikea.com/hu/hu/p/afjaell-habszivacs-matrac-kemeny-feher-00568634/',
    luroy90:'https://www.ikea.com/hu/hu/p/luroey-agyracs-90160211/'
  };
  const L={
    inner:{hu:'Belső párna',en:'Cushion insert'},bulb:{hu:'Izzó',en:'Light bulb'},mattress:{hu:'Matrac',en:'Mattress'},
    base:{hu:'Ágyrács',en:'Slatted bed base'},fridgeDoor:{hu:'Hűtőajtó, lábazat, fogantyú, sarokpánt',en:'Fridge door, plinth, handle, hinges'},
    rail:{hu:'Falisín',en:'Suspension rail'}
  };
  const REQUIRES={
    // Díszpárnahuzatok — „A belső párna külön kapható” (IKEA)
    'https://www.ikea.com/hu/hu/p/sanela-diszparnahuzat-sarga-barna-50635990/':[A('inner',L.inner,1,R.fjadrar)],
    'https://www.ikea.com/hu/hu/p/gurli-diszparnahuzat-soetetszuerke-50598737/':[A('inner',L.inner,1,R.inner)],
    'https://www.ikea.com/hu/hu/p/svarthoe-diszparnahuzat-bezs-70336594/':[A('inner',L.inner,1,R.fjadrar)],
    // Állólámpák — „Az izzó külön kapható” (IKEA), „Izzó nélkül” (JYSK)
    'https://www.ikea.com/hu/hu/p/nymane-allolampa-3-spottal-feher-80455483/':[A('bulb',L.bulb,3,R.gu10,'GU10')],
    'https://www.ikea.com/hu/hu/p/lauters-allolampa-koris-feher-30405042/':[A('bulb',L.bulb,1,R.e27big,'E27')],
    'https://www.ikea.com/hu/hu/p/stockholm-2025-allolampa-feher-textil-sargarez-bev-50585914/':[A('bulb',L.bulb,3,R.e27big,'E27')],
    'https://www.ikea.com/hu/hu/p/barlast-allolampa-fekete-feher-10430368/':[A('bulb',L.bulb,1,R.e27small,'E27')],
    'https://www.ikea.com/hu/hu/p/arstid-allolampa-sargarez-feher-00321317/':[A('bulb',L.bulb,1,R.e27big,'E27')],
    'https://jysk.hu/lakberendezes/vilagitas/lampak/allolampa-hansson-ma155cm-fekete':[A('bulb',L.bulb,1,null,'E27')],
    // Ágyak — „A matracot és az ágyneműt külön veheted meg”; ahol kell, „Az ágyrácsot … külön”
    'https://www.ikea.com/hu/hu/p/slattum-karpitozott-agykeret-vissle-soetetszuerke-40571248/':[A('mattress',L.mattress,1,R.vesteroy160,'160×200')],
    'https://www.ikea.com/hu/hu/p/kleppstad-agykeret-feher-vissle-bezs-10492672/':[A('mattress',L.mattress,1,R.vesteroy160,'160×200')],
    'https://www.ikea.com/hu/hu/p/vihals-agykeret-feher-60602442/':[A('mattress',L.mattress,1,R.afjall160,'160×200'),A('base',L.base,1,null,'160×200')],
    'https://jysk.hu/haloszoba/agyak/agyalapok-agyracsok-agykeretek/agykeretek/agykeret-kongsberg-160x200-bezs-szovet':[A('mattress',L.mattress,1,null,'160×200'),A('base',L.base,1,null,'160×200')],
    'https://www.ikea.com/hu/hu/p/slaekt-agykeret-feher-00362746/':[A('mattress',L.mattress,1,null,'90×200'),A('base',L.base,1,R.luroy90,'90×200')],
    'https://www.ikea.com/hu/hu/p/kura-megfordithato-agy-feher-fenyo-80253809/':[A('mattress',L.mattress,1,R.afjall90m,'90×200')],
    'https://www.ikea.com/hu/hu/p/klippuggla-agykeret-taroloval-feher-leesesgatloval-s09627827/':[A('mattress',L.mattress,1,R.afjall90k,'90×200')],
    // Beépíthető hűtők — „ajtó, lábazat és fogantyúk külön kaphatók”, „UTRUSTA sarokpántokkal kiegészítendő”
    'https://www.ikea.com/hu/hu/p/rakall-hutoszekreny-fagyaszto-ikea-500-beepitett-80572868/':[A('fridgeDoor',L.fridgeDoor,1,null)],
    'https://www.ikea.com/hu/hu/p/tinad-hutoszekreny-fagyaszto-ikea-500-beepitett-00572872/':[A('fridgeDoor',L.fridgeDoor,1,null)],
    // METOD faliszekrény — „Falisín külön kapható”
    'https://www.ikea.com/hu/hu/p/metod-faliszekreny-vizszintesen-nyilo-feher-vallstena-feher-s39507277/':[A('rail',L.rail,1,null)]
  };
  const requiresOf=url=>REQUIRES[url]||[];

  // ---- B04: szállítási és átvételi díjak boltonként ----
  // type: 'free' (ismert 0), 'table' (ismert díjtábla), 'from' (csak alsó határ ismert), 'unknown' (ismeretlen — sosem 0).
  const SHIPPING={
    ikea:{
      delivery:{type:'table',minOrder:2000,service:{hu:'teherszállítás az első zárható ajtóig, 10 munkanapon belül',en:'truck delivery to the first lockable door, within 10 working days'},
        // [felső határ (kizárólagos), díj] — „Rendelési érték < 100 000 Ft …”
        zones:{A:[[100000,8490],[200000,10490],[350000,13490],[500000,15490],[Infinity,20490]],
               B:[[100000,7490],[200000,9490],[350000,12490],[500000,14490],[Infinity,18490]]},
        source:'https://www.ikea.com/hu/hu/customer-service/services/delivery/',checked:CHECKED},
      pickup:{type:'from',min:15,note:{hu:'Kattints és Vedd át: 15 Ft-tól (IKEA Family, legalább 22 500 Ft-os rendelésnél); tagság és átvételi hely szerint több',en:'Click & Collect: from 15 Ft (IKEA Family, orders from 22 500 Ft); more depending on membership and pickup point'},
        source:'https://www.ikea.com/hu/hu/customer-service/services/click-collect/',checked:CHECKED}
    },
    jysk:{
      delivery:{type:'unknown',note:{hu:'A JYSK a házhozszállítás díját súly, térfogat és cím alapján a kosárban számolja',en:'JYSK calculates delivery by weight, volume and address at checkout'},source:'https://jysk.hu/aszf#5',checked:CHECKED},
      pickup:{type:'free',note:{hu:'Click & Collect áruházi átvétel: ingyenes',en:'Click & Collect in store: free'},source:'https://jysk.hu/aszf#5',checked:CHECKED}
    },
    momax:{delivery:{type:'unknown',note:{hu:'A bolt oldala nem ellenőrizhető automatikusan',en:'The store page cannot be checked automatically'}},pickup:{type:'unknown',note:{hu:'A bolt oldala nem ellenőrizhető automatikusan',en:'The store page cannot be checked automatically'}}},
    mobelix:{delivery:{type:'unknown',note:{hu:'A bolt oldala nem ellenőrizhető automatikusan',en:'The store page cannot be checked automatically'}},pickup:{type:'unknown',note:{hu:'A bolt oldala nem ellenőrizhető automatikusan',en:'The store page cannot be checked automatically'}}}
  };

  // ---- B03: falfesték — külön becslés. Az ár NINCS ellenőrizve (a Héra/OBI oldalak az árat programból töltik). ----
  const PAINT={name:'Héra Prémium beltéri falfesték',canLiters:5,price:7490,coverage:9,coats:2,openingsM2:5,verified:false,source:null,checked:null};

  return {CHECKED,SALES,saleOf,REQUIRES,requiresOf,ACCESSORY_URLS:R,SHIPPING,PAINT};
});
