// DREAMR — boltszintű értékesítési adatok: szállítás és festékbecslés (2. szakasz, B04)
// Minden adat a bolt saját oldaláról származik; forrás és ellenőrzési dátum mellette.
// A termékeket az URL-jük azonosítja (az app.js P_(...) soraiban szereplő link).
// Böngészőben: window.DRSales · Node-ban (tesztek): require('./sales-data.js')
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRSales=api; })(typeof self!=='undefined'?self:this,function(){
  const CHECKED='2026-11-12';

  // A termékszintű értékesítési adatok (kiszerelés, rendelési szabály — B01/B02) és a szükséges kiegészítők (B03)
  // a 3. szakasz óta a data/catalog.json változatain vannak (sale, requires). Itt a boltszintű adatok maradnak.

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

  return {CHECKED,SHIPPING,PAINT};
});
