  // ---- KATALÓGUS (3. szakasz, C01) ----
  // A termékadat a data/catalog.json-ban él (séma: schemas/product.schema.json). A catalog.js tölti be,
  // és csak utána indítja ezt a fájlt. Termék felvétele vagy módosítása nem igényli az app logikájának módosítását.
  const CAT=DRCatalog.current;
  const META={}; Object.entries(CAT.categories).forEach(([id,c])=>META[id]={cat:c.label.hu,icon:c.icon,floor:c.floor,plan:c.plan});
  let PRICE_DATE='2026-08-29'; // az árellenőrzés dátuma — a prices.json betöltése automatikusan frissíti
  let PRICE_DATE_HU='2026. augusztus 29-i', PRICE_DATE_EN='29 August 2026';
  // Egy szoba tételei a választott stílusban (alapajánlat elöl) — a szobák felépítése is a katalógusban van.
  // R06: a teljes katalógusból (keresésből) választott, azonos kategóriájú termék is a tétel opciója lesz.
  const getSlotsFor=(room,style)=>CAT.slotsFor(room,style).map(slot=>{
    const v=state.sel[room+':'+style+':'+slot.id];
    if(v&&!slot.options.some(o=>o.vid===v)){ const o=CAT.variant(v); if(o&&o.category===slot.category) return {...slot,options:[...slot.options,o]}; }
    return slot;
  });
  // 5. szakasz: ajánlómotor (szűrés → rangsor → kerethez igazítás → indoklás → keresés) és közös elhelyezőmotor (2D + 3D)
  const RECO=window.DRReco, LY=window.DRLayout;
  function getSlots(){ return getSlotsFor(state.room,state.style); }

  const STYLES=[{id:'modern',label:'Modern'},{id:'skandinav',label:'Skandináv'},{id:'minimalista',label:'Minimalista'},{id:'japandi',label:'Japandi'},{id:'luxus',label:'Luxus'},{id:'ipari',label:'Ipari'}];
  const ROOMS=[{id:'nappali',label:'Nappali'},{id:'haloszoba',label:'Hálószoba'},{id:'etkezo',label:'Étkező'},{id:'konyha',label:'Konyha'},{id:'dolgozo',label:'Dolgozószoba'},{id:'gyerek',label:'Gyerekszoba'}];
  const ROOM_NAME={nappali:'nappali',haloszoba:'hálószoba',etkezo:'étkező',konyha:'konyha',dolgozo:'dolgozószoba',gyerek:'gyerekszoba'};
  const PAINT={name:"Héra Prémium",can:5,price:7490,coverage:9};
  const COATS=2, OPENINGS=5;
  const COLORS=[
    {id:'white',name:"Tiszta fehér",hex:"#f4f3ef"},{id:'greige',name:"Meleg greige",hex:"#ddd5c7"},
    {id:'grey',name:"Világosszürke",hex:"#cfd4d8"},{id:'sage',name:"Zsályazöld",hex:"#b9c4b1"},
    {id:'blue',name:"Ködkék",hex:"#b6c6d0"},{id:'sand',name:"Homok bézs",hex:"#e6d8bd"},
    {id:'terra',name:"Terrakotta",hex:"#cf9077"},{id:'char',name:"Antracit",hex:"#6b7178"}
  ];
  const STORE_LABEL={ikea:'IKEA',jysk:'JYSK',momax:'MÖMAX',mobelix:'MÖBELIX',kondela:'KONDELA',bonami:'BONAMI'};
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function productPhoto(it){
    // C05: a kép a katalógusból jön (a termék saját bolti oldaláról, elérhetőség-ellenőrzéssel); hiányzó vagy elérhetetlen kép helyett érthető jelzés
    const im=it.variant&&it.variant.image, image=im&&im.url&&(im.status==='verified'||im.status==='unchecked')?im.url:null, label=t('imgMissing');
    return `<div class="product-photo">${image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(it.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:''}<span class="photo-fallback" ${image?'hidden':''}>${it.icon}<small>${label}</small></span><span class="photo-store-logo ${it.store}">${STORE_LABEL[it.store]}</span></div>`;
  }
  // 4. szakasz: a boltok listája a katalógusból jön — új partner felvételéhez nem kell kódot módosítani
  const STORES=(()=>{ const known=['ikea','jysk','momax','mobelix'], inUse=new Set(CAT.allItems().map(i=>i.store)); return [...known.filter(s=>inUse.has(s)),...[...inUse].filter(s=>!known.includes(s)).sort()]; })();
  const storeBadge=s=>`<span class="store ${s}">${STORE_LABEL[s]||s.toUpperCase()}</span>`;
  const state={room:'nappali', style:'modern', off:new Set(), layoutOmit:new Set(), layoutQty:{}, quantity:{}, itemColors:{}, tvPlacement:null, color:'white', budget:600000, sel:{}, replaced:{}, fulfillment:'delivery', zone:null, compareSnap:null, pos:{}, openCmp:new Set(), lang:'hu', stores:new Set(STORES), search:'', house:[],
    // 5. szakasz: zárolt tételek, az ajtó helye, forgatás, kijelölt alaprajzi elem, a választások eredete (visszavonáshoz), a keret-igazítás naplója
    locked:new Set(), door:{...window.DRLayout.DOOR_DEFAULT}, rot:{}, selBlock:null, picked:{}, budgetLog:null};
  const fmt=n=>n.toLocaleString(state.lang==='hu'?'hu-HU':'en-US');
  let guestMode=false;

  // ---- I18N ----
  const T={
    hu:{precisionNote:'A szélesség és mélység katalógusadat; a magasság és szín részben becsült. Az ajtó-, ablak- és közlekedési helyigény nincs ellenőrizve. Az AI-kép illusztráció, nem méretezett terv.',layoutBlocked:'Ide nem helyezhető a bútor: fal vagy másik bútor akadályozza.',layoutOmitted:'Nincs szabad hely: {items}. Ezek nem szerepelnek az összegben.',transitionCaption:'A térből otthon lesz.',navPlanner:'Tervező',navFurniture:'Bútorok',navSummary:'Összegzés',startPlanning:'Kezdj tervezni',heroKicker:'AI lakberendezés · valódi termékek',heroProof:'✓ Valós árak · ✓ 3D nézet · ✓ PDF-ajánlat',heroBefore:'Előtte',heroAfter:'DREAMR terv',heroCompare:'Előtte–utána összehasonlítás',heroDemo:'Illusztráció · nem a jelenlegi szobaterv',plannerIntroTitle:'Építsd fel a szobád.',plannerIntroText:'Először a teret állítjuk be, utána jöhetnek a bútorok, a színek és a büdzsé.',try:'Próbáld ki',kicker:'Interaktív tervező · valódi árak',planner:'tervező',
      sub:'Töltsd ki a szobád adatait, válassz stílust, és építsd fel az otthonod valódi bútorokból. <strong>Árak, alternatívák és vásárlási lista</strong> egy helyen.',
      b1:'🛋️ 6 szobatípus',b2:'🎨 6 stílus',b3:'🏬 4 bolt',b4:'📐 méretre szabva',b5:'💰 büdzsére',b6:'🧾 PDF-ajánlat',
      selRoom:'Szobatípus',selStyle:'Stílus',sizeH:'Szoba mérete',sizeP:'A két oldal hossza és a belmagasság (méterben).',
      len:'Hossz (m)',wid:'Szélesség (m)',hei:'Belmagasság (m)',pSmall:'Kicsi · 2,5×3',pMed:'Közepes · 4×5',pLarge:'Nagy · 5×6',
      planH:'Alaprajz (felülnézet)',planP:'Húzd át a bútorokat! A be nem férő, kikapcsolt darabok nem látszanak.',
      reset:'↺ Elrendezés visszaállítása',exportBtn:'🧾 Ajánlat (PDF)',planHint:'Fogd meg és húzd a bútort.',
      legFurn:'Bútor',legRug:'Szőnyeg',legWall:'Falszín',
      paintH:'Falszín (Héra Prémium beltéri falfesték)',paintP:'Válassz színt — kiszámoljuk, hány doboz kell és mennyibe kerül.',paintNone:'Nincs kiválasztva',paintLabelNone:'Falfesték',
      paintNet:'Falfelület (2 réteg, ajtó/ablak levonva)',paintLiters:'Festékigény (9 m²/liter)',paintCans:'Szükséges kiszerelés',paintCost:'Festékköltség',cans:'× 5 L doboz',
      budgetH:'Büdzsé',budgetP:'Állítsd be a keretet — jelezzük, belefér-e, és egy kattintással hozzáigazítjuk.',budgetField:'Keret (Ft)',autofit:'✨ Igazítás a kerethez',
      searchPh:'Keresés a bútorok közt…',storesLabel:'Boltok:',cheapAll:'⤓ Legolcsóbb mindenhol',
      listLabel:'Bútorlista',listH:'Az összeállítás elemei',on:'bekapcsolva',fit:'befér',
      sumLabel:'Becsült összköltség',brkFurn:'Bútorok',brkPaint:'Falfesték',budgetWord:'Keret:',
      within:'✓ Belefér a keretbe — marad ',within2:' Ft.',fitState:'Belefér',overState:'Túllépve',over1:'Túllépve ',over2:' Ft-tal — nyomd meg az „✨ Igazítás a kerethez" gombot, vagy válts olcsóbb alternatívára.',
      fillLabel:'Mennyire tölti ki a szobát',floorPct:'A padló ~',floorPct2:'%-a bútor',
      fillAiry:'Levegős',fillComfy:'Kényelmes',fillTight:'Kicsit zsúfolt',fillCrowd:'Túl zsúfolt',
      note:'Az árak <strong>'+PRICE_DATE_HU+'</strong> tájékoztató árak. A pontos árat a termék oldalán ellenőrizd.',exportFull:'🧾 Ajánlat letöltése (PDF)',
      buy:'Megnézem a boltban →',cheapest:'✓ ez a legolcsóbb',cheaperPre:'legolcsóbb: ',prices:'💰 Árak',cmpSel:'kiválasztva',cmpCheap:'legolcsóbb',nofit:'Nem fér be',
      tips:'<strong>Tippek:</strong> a ◀ ▶ nyilakkal válts a valódi alternatívák között (a „legolcsóbb" jelzés segít); az alaprajzon <strong>húzd</strong> a bútorokat a helyükre; a méret, festék és büdzsé mind automatikusan követi a választásod; végül a <strong>🧾 Ajánlat</strong> gombbal PDF-et menthetsz az ügyfélnek.',
      footL:'© 2026 DREAMR — Lakberendező tervező',footR:'Árak: ikea.com/hu, jysk.hu · '+PRICE_DATE,
      exTitle:'Berendezési ajánlat — DREAMR',exStyle:'stílus',exWall:'falszín',exNone:'nincs',exDate:'dátum',exCat:'Kategória',exProd:'Termék',exStore:'Bolt',exPrice:'Ár',exFurn:'Bútorok',exPaint:'Falfesték',exTotal:'Végösszeg',exNote:'Az árak tájékoztató jellegűek ('+PRICE_DATE+'), a boltok oldalán ellenőrizhetők. Készült a DREAMR tervezővel.',
      noneItem:'Nincs festés',belm:'belmagasság',shoppingBtn:'🛒 Bevásárlólista',slTitle:'Bevásárlólista — bolt szerint',slItems:'tétel',slTotal:'Végösszeg',slOpen:'Megnézem →',slPrint:'🖨️ Nyomtatás / PDF',slClose:'Bezárás',view3d:'🧊 3D nézet',d3Title:'3D nézet',d3Hint:'Húzd a bútort a mozgatáshoz · az üres részt a forgatáshoz · görgő = nagyítás',d3NoLib:'A 3D nézethez internet szükséges.',houseBtn:'🏠 Házam',saveRoomBtn:'💾 Mentés a házamba',houseTitle:'A házam — mentett szobák',houseEmpty:'Még nincs mentett szoba. Állíts össze egy szobát, és mentsd el a szobatípus nevével!',load:'Betöltés',del:'Törlés',houseTotal:'Teljes ház összesen',houseShop:'🛒 Teljes ház – bevásárlólista',shareBtn:'🔗 Megosztás linkkel',shareCopied:'✔ Link a vágólapon!',shareFail:'Másold ki a linket:',
      accSignIn:'Add meg az e-mail címed — belépő linket küldünk:',accSent:'✉️ Elküldve! Nyisd meg az e-mailben kapott linket.',accSignedIn:'Bejelentkezve:',accSignOut:'Kijelentkezés',accSynced:'☁ A Házam mentések mostantól a fiókodba is mentődnek.',accUpload:'Van {n} helyi mentésed. Feltöltsük a fiókodba?',
      aiBtn:'✨ AI látványterv',authWelcome:'Üdvözöljük',authSub:'Jelentkezzen be a mentett szobáihoz',authCreate:'Fiók létrehozása',authCreateSub:'Mentse el terveit, bármely eszközön',authGoogle:'Folytatás Google-lel',authOr:'vagy',authName:'Név',authEmail:'E-mail cím',authPass:'Jelszó',authSignIn:'Belépés',authSignUp:'Regisztráció',authNew:'Még nincs fiókja?',authHave:'Már van fiókja?',authMagic:'Belépés jelszó nélkül, e-mailes linkkel',authFill:'Kérjük, töltse ki az e-mailt és a jelszót.',authShort:'A jelszó legalább 6 karakter legyen.',authConfirm:'Megerősítő e-mailt küldtünk — nyissa meg a levélben lévő linket.',aiWorking:'⏳ Készül… (kb. fél perc)',aiLogin:'Az AI-látványtervhez jelentkezz be a 👤 gombbal!',aiLimit:'Mára elfogyott az AI-képkereted (5 kép/nap). Holnap újra próbálhatod!',aiErr:'Hiba történt a kép készítése közben. Próbáld újra!',aiLeft:'Hátralévő képek ma:'},
    en:{precisionNote:'Width and depth use catalog data; height and colour are partly estimated. Door, window and circulation clearances are not checked. The AI image is an illustration, not a dimensioned plan.',layoutBlocked:'Cannot place furniture here: a wall or another item blocks it.',layoutOmitted:'No free space: {items}. These items are excluded from the total.',transitionCaption:'Turning your space into a home.',navPlanner:'Planner',navFurniture:'Furniture',navSummary:'Summary',startPlanning:'Start planning',heroKicker:'AI interior design · real products',heroProof:'✓ Real prices · ✓ 3D view · ✓ PDF offer',heroBefore:'Before',heroAfter:'DREAMR design',heroCompare:'Before and after comparison',heroDemo:'Illustration · not your current room design',plannerIntroTitle:'Build your room.',plannerIntroText:'Start with the space, then choose the furniture, colours and budget.',try:'Try it',kicker:'Interactive planner · real prices',planner:'planner',
      sub:'Enter your room details, choose a style, and build your home with real furniture. <strong>Prices, alternatives and a shopping list</strong> in one place.',
      b1:'🛋️ 6 room types',b2:'🎨 6 styles',b3:'🏬 4 stores',b4:'📐 fits your room',b5:'💰 fits your budget',b6:'🧾 PDF offer',
      selRoom:'Room type',selStyle:'Style',sizeH:'Room size',sizeP:'Length of the two sides and the ceiling height (in metres).',
      len:'Length (m)',wid:'Width (m)',hei:'Ceiling (m)',pSmall:'Small · 2.5×3',pMed:'Medium · 4×5',pLarge:'Large · 5×6',
      planH:'Floor plan (top view)',planP:'Drag the furniture! Items that don’t fit or are off are hidden.',
      reset:'↺ Reset layout',exportBtn:'🧾 Offer (PDF)',planHint:'Grab and drag the furniture.',
      legFurn:'Furniture',legRug:'Rug',legWall:'Wall colour',
      paintH:'Wall colour (Héra Premium interior paint)',paintP:'Pick a colour — we calculate how many cans you need and the cost.',paintNone:'Not selected',paintLabelNone:'Wall paint',
      paintNet:'Wall area (2 coats, minus door/window)',paintLiters:'Paint needed (9 m²/litre)',paintCans:'Cans required',paintCost:'Paint cost',cans:'× 5 L can',
      budgetH:'Budget',budgetP:'Set your budget — we show if it fits, and adjust it in one click.',budgetField:'Budget (Ft)',autofit:'✨ Fit to budget',
      searchPh:'Search the furniture…',storesLabel:'Stores:',cheapAll:'⤓ Cheapest everywhere',
      listLabel:'Furniture list',listH:'Your selection',on:'on',fit:'fit',
      sumLabel:'Estimated total',brkFurn:'Furniture',brkPaint:'Wall paint',budgetWord:'Budget:',
      within:'✓ Within budget — ',within2:' Ft left.',fitState:'Fits',overState:'Over',over1:'Over by ',over2:' Ft — press “✨ Fit to budget”, or switch to a cheaper alternative.',
      fillLabel:'How full the room is',floorPct:'~',floorPct2:'% of the floor is furniture',
      fillAiry:'Airy',fillComfy:'Comfortable',fillTight:'A bit tight',fillCrowd:'Too crowded',
      note:'Prices are indicative, as of <strong>'+PRICE_DATE_EN+'</strong>. Check the exact price on the product page.',exportFull:'🧾 Download offer (PDF)',
      buy:'View in store →',cheapest:'✓ cheapest',cheaperPre:'cheapest: ',prices:'💰 Prices',cmpSel:'selected',cmpCheap:'cheapest',nofit:'Doesn’t fit',
      tips:'<strong>Tips:</strong> use the ◀ ▶ arrows to switch between real alternatives (the “cheapest” tag helps); <strong>drag</strong> the furniture on the plan; size, paint and budget all update automatically; finally use the <strong>🧾 Offer</strong> button to save a PDF for your client.',
      footL:'© 2026 DREAMR — Interior planner',footR:'Prices: ikea.com/hu, jysk.hu · '+PRICE_DATE,
      exTitle:'Furnishing offer — DREAMR',exStyle:'style',exWall:'wall',exNone:'none',exDate:'date',exCat:'Category',exProd:'Product',exStore:'Store',exPrice:'Price',exFurn:'Furniture',exPaint:'Wall paint',exTotal:'Total',exNote:'Prices are indicative ('+PRICE_DATE+'), verify on the store pages. Made with the DREAMR planner.',
      noneItem:'No paint',belm:'ceiling',shoppingBtn:'🛒 Shopping list',slTitle:'Shopping list — by store',slItems:'items',slTotal:'Total',slOpen:'Open →',slPrint:'🖨️ Print / PDF',slClose:'Close',view3d:'🧊 3D view',d3Title:'3D view',d3Hint:'Drag furniture to move · drag empty space to rotate · scroll = zoom',d3NoLib:'The 3D view needs an internet connection.',houseBtn:'🏠 My house',saveRoomBtn:'💾 Save to my house',houseTitle:'My house — saved rooms',houseEmpty:'No saved rooms yet. Design a room and save it under its room-type name!',load:'Load',del:'Delete',houseTotal:'Whole house total',houseShop:'🛒 Whole-house shopping list',shareBtn:'🔗 Share link',shareCopied:'✔ Link copied!',shareFail:'Copy this link:',
      accSignIn:'Enter your email — we will send a sign-in link:',accSent:'✉️ Sent! Open the link in the email.',accSignedIn:'Signed in:',accSignOut:'Sign out',accSynced:'☁ Your saved rooms now sync to your account.',accUpload:'You have {n} local saves. Upload them to your account?',
      aiBtn:'✨ AI visualization',authWelcome:'Welcome',authSub:'Sign in to your saved rooms',authCreate:'Create account',authCreateSub:'Keep your designs, on any device',authGoogle:'Continue with Google',authOr:'or',authName:'Name',authEmail:'Email address',authPass:'Password',authSignIn:'Sign in',authSignUp:'Sign up',authNew:'No account yet?',authHave:'Already have an account?',authMagic:'Sign in without a password, via email link',authFill:'Please enter your email and password.',authShort:'Password must be at least 6 characters.',authConfirm:'We sent a confirmation email — open the link inside.',aiWorking:'⏳ Rendering… (about 30s)',aiLogin:'Sign in with the 👤 button to use AI visualization!',aiLimit:'You used up today\'s AI quota (5 images/day). Try again tomorrow!',aiErr:'Something went wrong while rendering. Please try again!',aiLeft:'Images left today:'},
  };
  Object.assign(T.hu,{
    welcomeEyebrow:'A TÉR A TIÉD. AZ ÁLOM IS.',welcomeTitle:'Álmodd meg. Lakd meg.',
    welcomeSubtitle:'Valódi bútorok. Személyes terek. Egy új kezdet.',welcomePromise:'A térből otthon lesz.',
    guestContinue:'Folytatás vendégként →',sessionLoading:'Profil ellenőrzése…',
    authBusy:'Egy pillanat…',authRemember:'Ezen a böngészőn bejelentkezve maradsz, amíg ki nem jelentkezel.',
    authEmailRequired:'Add meg az e-mail-címed.',authNetwork:'A kapcsolat megszakadt. Próbáld újra.',
    authDelivery:'A belépőlink kérését fogadtuk. Nézd meg a Spam mappát is. Ha nem érkezik levél, a levélküldés beállítását kell ellenőrizni.',
    authUnavailable:'A bejelentkezés nem elérhető. Vendégként tovább tervezhetsz.'
  });
  Object.assign(T.en,{
    welcomeEyebrow:'YOUR SPACE. YOUR DREAM.',welcomeTitle:'Dream it. Live it.',
    welcomeSubtitle:'Real furniture. Personal spaces. A fresh beginning.',welcomePromise:'A space becomes a home.',
    guestContinue:'Continue as a guest →',sessionLoading:'Checking your profile…',
    authBusy:'One moment…',authRemember:'You stay signed in on this browser until you sign out.',
    authEmailRequired:'Enter your email address.',authNetwork:'Connection failed. Please try again.',
    authDelivery:'Your sign-in link request was accepted. Check Spam too. If no email arrives, the email delivery settings need checking.',
    authUnavailable:'Sign-in is unavailable. You can continue as a guest.'
  });
  // Az új design ikon nélküli, letisztult feliratokat használ (emoji helyett).
  Object.assign(T.hu,{
    b1:'6 szobatípus',b2:'6 stílus',b3:'4 bolt',b4:'Méretre szabva',b5:'Büdzsére',b6:'PDF-ajánlat',
    reset:'Elrendezés visszaállítása',exportBtn:'Ajánlat (PDF)',autofit:'Igazítás a kerethez',cheapAll:'Legolcsóbb mindenhol',
    exportFull:'Ajánlat letöltése (PDF)',prices:'Árak',shoppingBtn:'Bevásárlólista',slPrint:'Nyomtatás / PDF',view3d:'3D nézet',
    houseBtn:'Házam',saveRoomBtn:'Mentés a házamba',houseShop:'Teljes ház – bevásárlólista',shareBtn:'Megosztás linkkel',aiBtn:'AI látványterv',
    heroProof:'Valós árak · 3D nézet · PDF-ajánlat',
    enterKicker:'ÜDVÖZLÜNK OTTHON',enterTitle:'Berendezzük',enterTitleAlt:'az álmodat.',signInTab:'Belépés',signUpTab:'Regisztráció',bagLabel:'Bevásárlólista',imgMissing:'Nincs ellenőrzött termékfotó',vizColor:'Látványszín',vizColorTitle:'Csak a terv és a 3D nézet színe — nem bolti változat',vizColorNote:'Szemléltető szín; a bolti termék színe: {c}',vizColorNoteNone:'Szemléltető szín; a bolti szín nincs ellenőrizve',details:'Részletek',detailLead:'Minden adat mellett látszik, honnan származik: bolti adat (az ellenőrzés napjával), DREAMR becslés (szemléltető) vagy hiányzik.',detailFoot:'A bolti adatok a termék saját oldaláról származnak.',srcStore:'Bolti adat',srcEstimate:'Becslés (szemléltető)',srcMissing:'Nincs adat',dStoreName:'Bolti név',dSku:'Cikkszám',dPrice:'Ár',dWidth:'Szélesség',dDepth:'Mélység',dHeight:'Magasság',dOpen:'Kinyitva',dClosed:'összecsukva',dWall:'Falra szerelhető',dPackage:'Csomagolás',dMaterial:'Anyag',dColor:'Szín',dCategory:'Kategória',dStock:'Készlet',dOffer:'Ajánlati időszak',dSale:'Kiszerelés',dImage:'Termékkép',yes:'igen',no:'nem',offerUntil:'akciós, {d}-ig',lic_own:'saját kép',lic_licensed:'licencelt',lic_permitted:'engedéllyel használt',lic_unsettled:'bolti fotó — felhasználási engedély nincs rendezve',restoreTitle:'A mentett terv helyreállítása',restoreMissing:'A mentett „{what}” termék már nem érhető el a katalógusban — helyette az alapajánlat látszik.',restoreBroken:'A megosztott link sérült vagy hiányos, ezért nem nyitható meg. Az alapértelmezett terv látszik — kérd el újra a linket.',
    pcChecked:'Ár ellenőrizve:',pcStale:'Elavult ár — utoljára ellenőrizve:',pcUnverified:'Nem ellenőrzött ár — még nem sikerült igazolni a boltban',
    pcBlocked:'Nem ellenőrzött ár — a bolt oldala automatikusan nem ellenőrizhető',pcSale:'akciós, {until}-ig (eredetileg {price} Ft)',pcStoreOnly:'csak áruházban',
    pcUncertainTitle:'Bizonytalan ár: ellenőrizd a bolt oldalán',pcUncertainSum:'Ebből bizonytalan ár ({n} tétel)',
    pcExportNote:'* Bizonytalan ár (elavult vagy nem ellenőrzött) — vásárlás előtt ellenőrizd a bolt oldalán.',
    goneTitle:'Megszűnt termék.',goneText:'A bolt már nem árulja; az ára nem ellenőrizhető.',goneSuggest:'Ellenőrzött csere:',goneReplace:'Csere erre',
    replacedNote:'Lecserélve: {from} helyett (megszűnt termék, {when}).',
    modeDelivery:'Házhozszállítás',modePickup:'Bolti átvétel',zoneLabel:'Szállítási cím (IKEA díjzóna)',zoneUnknown:'Még nem tudom',zoneA:'Budapest (1007–1299)',zoneB:'Vidék (2000–9999)',
    brkFurn:'Termékek',brkAcc:'Kiegészítők (becslés)',brkPaint:'Falfesték (becslés)',grandPlusUnknown:'+ ismeretlen tételek — lásd lent',
    buyQty:'Vásárlandó: {units} {u}',pieces:'db',buyExtra:'{n} többletdarab',whyPack:'a bolt {n} darabos egységben ({u}) árulja',
    whyDeliveryMultiple:'házhozszállításnál csak {n} többszörösében rendelhető',whyMultiple:'csak {n} többszörösében rendelhető',whyMin:'legalább {n} egység rendelhető',
    whyPickupAlt:'Bolti átvételnél elég {n}.',accMissing:'Nem tartozék:',accSeparate:'(külön számolva)',accUnknown:'nincs benne az árban, a boltban pontosítandó',
    costNoPrice:'nincs ár',shipFree:'ingyenes',shipUnknown:'ismeretlen',shipByZone:'(címtől függ)',shipFrom:'{n} Ft-tól',shipBelowMin:'csak {n} Ft felett',
    openTitle:'Nincs benne / a boltban pontosítandó',openPrice:'{name}: nincs ellenőrzött ár',openShipping:'szállítási díj',
    openExtra:'{name}: {n} többletdarab a rendelési szabály miatt',openPaint:'Falfesték: becslés, az ár nem ellenőrzött',
    priceChange:'Mentéskor: {from} Ft → most: {to} Ft ({delta} Ft)',priceChangeItems:'Mentés óta változott ár ({delta} Ft):',exPlanned:'tervezve',exAcc:'Kiegészítő',exQty:'Mennyiség',exShipping:'Szállítás / átvétel'
  });
  Object.assign(T.en,{
    b1:'6 room types',b2:'6 styles',b3:'4 stores',b4:'Fits your room',b5:'Fits your budget',b6:'PDF offer',
    reset:'Reset layout',exportBtn:'Offer (PDF)',autofit:'Fit to budget',cheapAll:'Cheapest everywhere',
    exportFull:'Download offer (PDF)',prices:'Prices',shoppingBtn:'Shopping list',slPrint:'Print / PDF',view3d:'3D view',
    houseBtn:'My house',saveRoomBtn:'Save to my house',houseShop:'Whole-house shopping list',shareBtn:'Share link',aiBtn:'AI visualization',
    heroProof:'Real prices · 3D view · PDF offer',
    enterKicker:'WELCOME HOME',enterTitle:'Let’s furnish',enterTitleAlt:'your dream.',signInTab:'Sign in',signUpTab:'Sign up',bagLabel:'Shopping list',imgMissing:'No verified product photo',vizColor:'Visual colour',vizColorTitle:'Only the colour in the plan and 3D view — not a store variant',vizColorNote:'Illustrative colour; the store product is: {c}',vizColorNoteNone:'Illustrative colour; store colour not verified',details:'Details',detailLead:'Each field shows its origin: store data (with check date), DREAMR estimate (illustrative) or missing.',detailFoot:'Store data comes from the product’s own page.',srcStore:'Store data',srcEstimate:'Estimate (illustrative)',srcMissing:'No data',dStoreName:'Store name',dSku:'Article no.',dPrice:'Price',dWidth:'Width',dDepth:'Depth',dHeight:'Height',dOpen:'Extended',dClosed:'closed',dWall:'Wall-mounted',dPackage:'Package',dMaterial:'Material',dColor:'Colour',dCategory:'Category',dStock:'Stock',dOffer:'Offer period',dSale:'Sales unit',dImage:'Product image',yes:'yes',no:'no',offerUntil:'on sale until {d}',lic_own:'own image',lic_licensed:'licensed',lic_permitted:'used with permission',lic_unsettled:'store photo — usage permission not settled',restoreTitle:'Restoring the saved plan',restoreMissing:'The saved “{what}” product is no longer in the catalogue — the default is shown instead.',restoreBroken:'The shared link is damaged or incomplete and cannot be opened. The default plan is shown — ask for the link again.',
    pcChecked:'Price checked:',pcStale:'Outdated price — last checked:',pcUnverified:'Unverified price — not yet confirmed at the store',
    pcBlocked:'Unverified price — the store page cannot be checked automatically',pcSale:'on sale until {until} (was {price} Ft)',pcStoreOnly:'in-store only',
    pcUncertainTitle:'Uncertain price: check it on the store page',pcUncertainSum:'Of which uncertain ({n} items)',
    pcExportNote:'* Uncertain price (outdated or unverified) — check it on the store page before buying.',
    goneTitle:'Discontinued product.',goneText:'The store no longer sells it; its price cannot be verified.',goneSuggest:'Verified replacement:',goneReplace:'Replace',
    replacedNote:'Replaced: was {from} (discontinued, {when}).',
    modeDelivery:'Home delivery',modePickup:'Store pickup',zoneLabel:'Delivery address (IKEA fee zone)',zoneUnknown:'Not sure yet',zoneA:'Budapest (1007–1299)',zoneB:'Rest of Hungary (2000–9999)',
    brkFurn:'Products',brkAcc:'Accessories (estimate)',brkPaint:'Wall paint (estimate)',grandPlusUnknown:'+ unknown items — see below',
    buyQty:'To buy: {units} {u}',pieces:'pcs',buyExtra:'{n} extra',whyPack:'the store sells it in units of {n} ({u})',
    whyDeliveryMultiple:'for home delivery it can only be ordered in multiples of {n}',whyMultiple:'can only be ordered in multiples of {n}',whyMin:'minimum order is {n} units',
    whyPickupAlt:'For store pickup {n} is enough.',accMissing:'Not included:',accSeparate:'(counted separately)',accUnknown:'not in the price, to be confirmed in store',
    costNoPrice:'no price',shipFree:'free',shipUnknown:'unknown',shipByZone:'(depends on address)',shipFrom:'from {n} Ft',shipBelowMin:'only above {n} Ft',
    openTitle:'Not included / to be confirmed in store',openPrice:'{name}: no verified price',openShipping:'delivery fee',
    openExtra:'{name}: {n} extra due to the ordering rule',openPaint:'Wall paint: estimate, price not verified',
    priceChange:'When saved: {from} Ft → now: {to} Ft ({delta} Ft)',priceChangeItems:'Prices changed since saving ({delta} Ft):',exPlanned:'planned',exAcc:'Accessory',exQty:'Quantity',exShipping:'Delivery / pickup'
  });
  // ---- 5. szakasz szövegei (ajánlás, keret, elhelyezés, keresés) ----
  Object.assign(T.hu,{
    precisionNote:'Ellenőrizve: falak (6 cm), bútorok átfedése, az ajtó nyitási területe, a belmagasság (ahol a magasság ismert) és a falra szerelés. Csak jelezve: szék kihúzása, szekrény- és fióknyitás (szaggatott sáv). Nincs ellenőrizve: ablak, radiátor, konnektor, közlekedési útvonal a szobán át. Az AI-kép illusztráció, nem méretezett terv.',
    planHint:'Húzd a bútort; koppints rá, majd ↻ a forgatáshoz.',
    rotOnly:'csak elforgatva fér el',rotOnlyTitle:'Ebben a szobában csak 90°-kal elforgatva fér el — az alaprajz így helyezi el.',
    nofitHeight:'Túl magas',nofitSpace:'Nincs szabad hely',roleRequired:'fő funkció',roleRequiredTitle:'A szoba fő funkciója — a kerethez igazítás nem hagyja el, legfeljebb olcsóbb változatra cseréli.',
    roleLocked:'zárolt',lockTitle:'Zárolva a kerethez igazítás és a „Legolcsóbb mindenhol” nem változtat rajta.',locked:'Zárolva',lock:'Zárolás',
    cheapestOf:'✓ legolcsóbb a {n} vizsgált közül',cheaperPreOf:'a {n} vizsgált közül a legolcsóbb: ',
    ex_store:'nem választott boltból',ex_link:'megszűnt / hibás link',ex_variant:'nem ebbe a kategóriába való',ex_size:'hiányzó méret',
    missingInStores:'Nincs megfelelő termék a választott boltokban ({stores}) — ez a tétel most üres, más bolt nem tölti ki.',missingWhy:'Kizárva:',
    missingRequired:'A szoba fő funkciójához tartozik: kapcsolj be másik boltot, vagy keress a teljes katalógusban.',
    filterNote:'A szűrés csak a listát szűkíti ({shown} / {all} látszik) — az összeg, az alaprajz és a 3D mind a {all} tételt tartalmazza.',searchCatalogFor:'Keresés a teljes katalógusban: „{q}”',
    layoutOmittedHead:'Nem került az alaprajzra:',layoutOmittedTail:'Ezek nem szerepelnek az összegben.',
    why_size:'semmilyen állásban nem fér el',why_height:'magasabb a belmagasságnál',why_space:'nincs szabad hely (bútor vagy ajtónyitás)',why_wall:'nem fér a falak közé',why_mount:'nincs szabad falfelület',
    clearHead:'Kevés a használati hely:',clear_chair:'{what} kihúzásához {need} cm kell, itt {have} cm van',clear_door:'{what} nyitásához {need} cm kell, itt {have} cm van',
    rotateSel:'↻ {what} forgatása 90°-kal',rotateHint:'↻ Forgatás (koppints egy bútorra)',rotateBlocked:'Elforgatva itt nem fér el: {why}. Húzd szabadabb helyre, és próbáld újra.',rotWhy_wall:'nem fér a falak közé',rotWhy_overlap:'másik bútorba ütközne',rotWhy_door:'az ajtó nyitási területébe lógna',rotWhy_height:'magasabb a belmagasságnál',rotWhy_mount:'nincs mellette fal',
    blockWall:'Ide nem helyezhető: kilógna a falon túlra. Visszaállt az eredeti helyére.',blockOverlap:'Ide nem helyezhető: másik bútorba ütközne. Visszaállt az eredeti helyére.',
    blockDoor:'Ide nem helyezhető: az ajtó nyitási területe. Visszaállt az eredeti helyére.',blockHeight:'Ide nem helyezhető: magasabb a belmagasságnál.',blockMount:'Falra szerelt elem: csak fal mellé tehető. Visszaállt az eredeti helyére.',
    logCheapTitle:'„Legolcsóbb mindenhol” — cserék:',logOkTitle:'Igazítva a kerethez (−{saving} Ft):',logFailTitle:'A keret a szoba fő funkciójának megtartásával nem érhető el — a legolcsóbb megfelelő összeállítás is {over} Ft-tal túllépi.',
    logFailWhy:'Ami nem hagyható el:',logNotApplied:'Nem változtattam semmit. A legkisebb elérhető összeg {total} Ft lenne az alábbi lépésekkel:',logApply:'Mégis a legolcsóbb ({total} Ft)',logNothing:'Már belefér a keretbe — nem kellett változtatni.',logNoMove:'Nincs olyan megfelelő, ellenőrzött árú csere, ami csökkentené az összeget.',
    logSwap:'{cat}: {from} → {to}',logQty:'{cat}: {from} → {to} db',logDrop:'{cat} elhagyva ({name})',logUndone:'visszavonva',undo:'Visszavonás',undoAll:'Mind visszavonása',
    whyTitle:'Miért ez a termék?',whyHow_search:'A teljes katalógusból választottad.',whyHow_budget:'A kerethez igazítás cserélte olcsóbbra.',whyHow_cheap:'A „Legolcsóbb mindenhol” cserélte.',
    whyBefore:'Előtte: {name}.',whyUser:'Te választottad.',whySaved:'A mentett terv választása.',
    whyPrimary:'A {style} {room} alapajánlata (stílus szerint válogatva).',
    whyAlt:'Az alapajánlat ({name}) helyett:',whyBlk_store:'a boltja ({store}) nincs kiválasztva;',whyBlk_link:'megszűnt vagy hibás a linkje;',whyBlk_variant:'nem ebbe a kategóriába való;',
    whyBlk_size:'hiányzik a mérete;',whyBlk_unverified:'az ára nem ellenőrzött;',whyBlk_fit:'nem fér be a szobába;',whyAltRule:'ezért a hozzá legközelebbi árszintű, megfelelő termék került előre.',
    whyExamined:'Vizsgált kör: {n} megfelelő termék.',whyExcluded:'Kizárva: {list}.',whyUnsure:'Bizonytalan adat:',
    u_priceStale:'az ár elavult',u_priceUnverified:'az ár nincs ellenőrizve',u_gone:'a termék megszűnt',u_sizeEstimated:'a méret becsült',u_heightMissing:'a magasság hiányzik',u_heightEstimated:'a magasság becsült',u_colorUnknown:'a szín nincs megadva',
    catSearchBtn:'🔎 Teljes katalógus',catSearchTitle:'Keresés a teljes katalógusban',catSearchLead:'Minden termék a választott boltokból, ami megfelelő (él a linkje, megvan a mérete). Ha a szobában van ilyen tétel, egy kattintással beteheted.',
    catSearchPh:'Terméknév, pl. „ektorp” vagy „kanapé”',csCat:'Kategória',csAllCats:'Minden kategória',csOther:'Más szobák',csMaxW:'Max. szélesség',csMaxD:'Max. mélység',csMinP:'Min. ár',csMaxP:'Max. ár',
    csCount:'{n} találat',csFirst:'(az első {n} látszik)',csNotRoom:'nem ebbe a szobába való',csLocked:'zárolt tétel',csPick:'Csere: {cat}',csNone:'Nincs találat ezekkel a szűrőkkel.',
    doorLabel:'Ajtó:',doorBottom:'alsó fal',doorTop:'felső fal',doorLeft:'bal fal',doorRight:'jobb fal',doorFrom:'cm-től',doorWidthL:'szélesség (cm)'
  });
  Object.assign(T.en,{
    precisionNote:'Checked: walls (6 cm), overlapping furniture, the door swing area, ceiling height (where the height is known) and wall mounting. Only flagged: pulling out chairs, opening cabinets and drawers (dashed band). Not checked: windows, radiators, sockets, walkways through the room. The AI image is an illustration, not a scaled plan.',
    planHint:'Drag a piece; tap it, then ↻ to rotate.',
    rotOnly:'fits only rotated',rotOnlyTitle:'In this room it only fits rotated by 90° — the plan places it that way.',
    nofitHeight:'Too tall',nofitSpace:'No free space',roleRequired:'core item',roleRequiredTitle:'The room’s core function — budget fitting never removes it, at most swaps it for a cheaper variant.',
    roleLocked:'locked',lockTitle:'When locked, budget fitting and “Cheapest everywhere” leave it unchanged.',locked:'Locked',lock:'Lock',
    cheapestOf:'✓ cheapest of the {n} examined',cheaperPreOf:'cheapest of the {n} examined: ',
    ex_store:'from an unselected store',ex_link:'discontinued / broken link',ex_variant:'wrong category',ex_size:'missing size',
    missingInStores:'No suitable product in the selected stores ({stores}) — this item is empty now; no other store fills it.',missingWhy:'Excluded:',
    missingRequired:'It is part of the room’s core function: enable another store or search the full catalogue.',
    filterNote:'Filtering only narrows the list ({shown} / {all} shown) — the total, the plan and 3D include all {all} items.',searchCatalogFor:'Search the full catalogue: “{q}”',
    layoutOmittedHead:'Not placed on the plan:',layoutOmittedTail:'These are not in the total.',
    why_size:'does not fit in any orientation',why_height:'taller than the ceiling',why_space:'no free space (furniture or door swing)',why_wall:'does not fit between the walls',why_mount:'no free wall space',
    clearHead:'Little room for use:',clear_chair:'{what} needs {need} cm to pull out, {have} cm here',clear_door:'{what} needs {need} cm to open, {have} cm here',
    rotateSel:'↻ Rotate {what} by 90°',rotateHint:'↻ Rotate (tap a piece first)',rotateBlocked:'Does not fit here when rotated: {why}. Drag it to a freer spot and try again.',rotWhy_wall:'it does not fit between the walls',rotWhy_overlap:'it would hit other furniture',rotWhy_door:'it would reach into the door swing',rotWhy_height:'taller than the ceiling',rotWhy_mount:'no wall next to it',
    blockWall:'Cannot go here: it would cross the wall. Moved back.',blockOverlap:'Cannot go here: it would hit other furniture. Moved back.',
    blockDoor:'Cannot go here: door swing area. Moved back.',blockHeight:'Cannot go here: taller than the ceiling.',blockMount:'Wall-mounted item: it must sit against a wall. Moved back.',
    logCheapTitle:'“Cheapest everywhere” — swaps:',logOkTitle:'Fitted to the budget (−{saving} Ft):',logFailTitle:'The budget cannot be met while keeping the room’s core function — even the cheapest suitable set is {over} Ft over.',
    logFailWhy:'What cannot be removed:',logNotApplied:'Nothing was changed. The lowest reachable total would be {total} Ft with these steps:',logApply:'Apply the cheapest anyway ({total} Ft)',logNothing:'Already within budget — nothing to change.',logNoMove:'No suitable, price-verified swap would lower the total.',
    logSwap:'{cat}: {from} → {to}',logQty:'{cat}: {from} → {to} pcs',logDrop:'{cat} removed ({name})',logUndone:'undone',undo:'Undo',undoAll:'Undo all',
    whyTitle:'Why this product?',whyHow_search:'You picked it from the full catalogue.',whyHow_budget:'Budget fitting swapped it for a cheaper one.',whyHow_cheap:'“Cheapest everywhere” swapped it.',
    whyBefore:'Before: {name}.',whyUser:'You chose it.',whySaved:'Chosen in the saved plan.',
    whyPrimary:'The default pick for a {style} {room} (curated by style).',
    whyAlt:'Instead of the default ({name}):',whyBlk_store:'its store ({store}) is not selected;',whyBlk_link:'it is discontinued or its link is broken;',whyBlk_variant:'it is in another category;',
    whyBlk_size:'its size is missing;',whyBlk_unverified:'its price is not verified;',whyBlk_fit:'it does not fit the room;',whyAltRule:'so the closest suitable product by price level comes first.',
    whyExamined:'Examined: {n} suitable products.',whyExcluded:'Excluded: {list}.',whyUnsure:'Uncertain data:',
    u_priceStale:'outdated price',u_priceUnverified:'price not verified',u_gone:'discontinued',u_sizeEstimated:'estimated size',u_heightMissing:'height missing',u_heightEstimated:'estimated height',u_colorUnknown:'colour not given',
    catSearchBtn:'🔎 Full catalogue',catSearchTitle:'Search the full catalogue',catSearchLead:'Every suitable product from the selected stores (live link, known size). If the room has a matching item, swap it in with one click.',
    catSearchPh:'Product name, e.g. “ektorp” or “sofa”',csCat:'Category',csAllCats:'All categories',csOther:'Other rooms',csMaxW:'Max. width',csMaxD:'Max. depth',csMinP:'Min. price',csMaxP:'Max. price',
    csCount:'{n} results',csFirst:'(first {n} shown)',csNotRoom:'not for this room',csLocked:'locked item',csPick:'Swap: {cat}',csNone:'No results with these filters.',
    doorLabel:'Door:',doorBottom:'bottom wall',doorTop:'top wall',doorLeft:'left wall',doorRight:'right wall',doorFrom:'cm from corner',doorWidthL:'width (cm)'
  });
  const t=k=>T[state.lang][k];
  const M=window.DRMotion;
  const catName=id=>!META[id]?id:state.lang==='hu'?META[id].cat:(CAT.categories[id].label.en||META[id].cat);
  const ROOM_LABEL={nappali:['Nappali','Living room'],haloszoba:['Hálószoba','Bedroom'],etkezo:['Étkező','Dining'],konyha:['Konyha','Kitchen'],dolgozo:['Dolgozószoba','Home office'],gyerek:['Gyerekszoba','Kids room']};
  const ROOM_LOWER={nappali:['nappali','living room'],haloszoba:['hálószoba','bedroom'],etkezo:['étkező','dining room'],konyha:['konyha','kitchen'],dolgozo:['dolgozószoba','home office'],gyerek:['gyerekszoba','kids room']};
  const STYLE_LABEL={modern:['Modern','Modern'],skandinav:['Skandináv','Scandinavian'],minimalista:['Minimalista','Minimalist'],japandi:['Japandi','Japandi'],luxus:['Luxus','Luxury'],ipari:['Ipari','Industrial']};
  const COLOR_EN={white:'Pure white',greige:'Warm greige',grey:'Light grey',sage:'Sage green',blue:'Misty blue',sand:'Sand beige',terra:'Terracotta',char:'Anthracite'};
  const li=i=>state.lang==='hu'?0:1;
  const keyOf=id=>state.room+':'+state.style+':'+id;

  // ---- HIBÁS TERMÉKEK (A05) ----
  // Megszűnt termék nem lehet választható vagy kezdőajánlat; igazolatlan (pl. robotszűrős bolt) nem lehet kezdőajánlat.
  // A mentett tervekben a sorszám marad a forrás — ezért a listák sorrendje nem változik, csak a választás.
  const isGone=o=>!!(o&&o.check&&o.check.status==='gone');
  const isVerified=o=>['fresh','stale'].includes(priceState(o).kind);
  // Ellenőrzött csere ugyanabból a kategóriából: lehetőleg azonos bolt, a legközelebbi ár.
  function suggestReplacement(slot,fromIdx,allowed){
    const from=slot.options[fromIdx];
    const cands=(allowed||slot.options.map((o,i)=>i)).filter(i=>i!==fromIdx&&!isGone(slot.options[i])&&isVerified(slot.options[i]));
    cands.sort((a,b)=>{ const A=slot.options[a],B=slot.options[b];
      return ((A.store!==from.store)-(B.store!==from.store))||(Math.abs(A.price-from.price)-Math.abs(B.price-from.price)); });
    return cands.length?cands[0]:-1;
  }
  // ---- AJÁNLÁS (5. szakasz, R01): előbb szűrés, utána rangsor — recommendations.js ----
  // A boltszűrő soha nem lazul: ha egy tételhez nincs megfelelő termék a választott boltokban, a tétel üres marad
  // (missingSlots), és a lista ezt kiírja — más bolt nem tölti ki.
  const heightOf=o=>{ const h=o&&o.variant&&o.variant.dimensions.height; return h&&h.status==='verified'&&h.value>0?h.value:null; };
  const wallMountedOf=o=>!!(o&&o.variant&&o.variant.dimensions.wallMounted&&o.variant.dimensions.wallMounted.value);
  const roomNow=()=>LY.roomBox(len(),wid(),hei());
  // R03: befér-e (bármelyik 90°-os állásban, ismert magassággal) — ugyanaz a szabály, mint az elhelyezésnél
  function itemFit(o,slotId){
    const cat=CAT.categories[(o&&o.category)||slotId]; if(!cat||!cat.plan) return {fits:true,rotated:false,reason:null};
    const rug=cat.plan==='rug', w=rug?Math.max(o.w,o.d):o.w, d=rug?Math.min(o.w,o.d):o.d;
    return LY.fitsRoom({w,d,h:heightOf(o)||0,wallMounted:wallMountedOf(o)},roomNow());
  }
  const recoCtx=slot=>({stores:state.stores,category:CAT.categories[slot.category],keepVid:state.sel[keyOf(slot.id)]||null,
    verified:o=>!priceDataLoaded||(!isGone(o)&&isVerified(o)),fits:o=>itemFit(o,slot.id).fits});
  function defaultIdx(slot){ return RECO.recommend(slot,recoCtx(slot)).idx; }
  // C02: a választás termékazonosítóval (változat-id) tárolódik, nem sorszámmal — a sorrend vagy az URL
  // változása így nem cseréli le másik bútorra. state.sel[szoba:stílus:tétel] = változatazonosító.
  const savedIdx=slot=>{ const v=state.sel[keyOf(slot.id)]; if(v==null) return -1; const i=slot.options.findIndex(o=>o.vid===v); return i; };
  // how: honnan jött a választás (user / search / budget / cheap) — R05: visszakövethető és visszavonható
  const setSel=(slotId,idx,how)=>{ const slot=getSlots().find(s=>s.id===slotId), k=keyOf(slotId), cur=selIndex(slotId);
    const from=cur>=0?slot.options[cur].vid:null; state.sel[k]=slot.options[idx].vid;
    if(how&&from!==state.sel[k]) state.picked[k]={how,from,at:new Date().toISOString()}; };
  // A mentett választás csak akkor él, ha átmegy a szűrőn (pl. engedélyezett bolt) — különben az ajánlás, de a mentett
  // érték megmarad: a bolt visszakapcsolásakor visszajön.
  function selIndex(id){
    const slot=getSlots().find(s=>s.id===id), i=savedIdx(slot);
    return i>=0&&allowedIdxs(slot).includes(i)?i:defaultIdx(slot);
  }
  function allowedIdxs(slot){ return RECO.filterSlot(slot,recoCtx(slot)).eligible.map(e=>e.idx); }
  let missingSlots=[];
  function curItems(){
    const out=[]; missingSlots=[];
    getSlots().forEach(slot=>{
      const ctx=recoCtx(slot), rec=RECO.recommend(slot,ctx), allowed=rec.eligible.map(e=>e.idx);
      if(!allowed.length){ missingSlots.push({id:slot.id,role:slot.role,excluded:rec.reason.excluded}); return; }
      const i=savedIdx(slot), sel=i>=0&&allowed.includes(i)?i:rec.idx;
      const o=slot.options[sel], cheap=RECO.cheapest(rec.eligible), min=cheap.o.price, k=keyOf(slot.id);
      out.push({...META[slot.id], id:slot.id, ...o, optCount:allowed.length, optIndex:allowed.indexOf(sel), selFull:sel, minPrice:min, isCheapest:o.price===min,
        options:slot.options, allowed, role:slot.role, locked:state.locked.has(k), reco:rec.reason, recoIdx:rec.idx, picked:i===sel?state.picked[k]||null:null, fit:itemFit(o,slot.id)});
    });
    return out;
  }
  function fits(it){ return it.fit?it.fit.fits:itemFit(it,it.id).fits; }
  // A single conservative finish map feeds both the plan and the 3D models.
  // Unknown product finishes stay neutral instead of pretending to know an exact colour.
  // ---- KÖLTSÉG (2. szakasz) ----
  // Tervezett (kért) darabszám alapértéke kategóriánként — tervezési döntés (pl. 4 étkezőszék, 2 függönylap).
  // A kiszerelés, minimum, többszörös és teljesítési szabály NEM innen jön, hanem a sales-data.js-ből és az élő adatból.
  const qtyFor=id=>Math.max(1,Math.min(8,Math.round(+state.quantity[id]||(CAT.categories[id]&&CAT.categories[id].planQty)||1)));
  const actualQty=it=>it.plan?(state.layoutQty[it.id]??0):qtyFor(it.id);
  // Értékesítési szabály: a sales-data.js adata, a JYSK házhozszállítási többszörösét a napi frissítő felülírja.
  function saleFor(p){
    const base=(p.variant&&p.variant.sale)||{unit:'db',pack:1}, live=p.check;
    // A napi frissítő csak a JYSK-oldalakról olvassa ki a házhozszállítási többszöröst — máshol a sales-data.js az irányadó.
    if(p.store!=='jysk'||!live||live.status!=='ok'||!('deliveryMultiple' in live)) return base;
    const modes={...(base.modes||{})};
    if(live.deliveryMultiple) modes.delivery={multiple:live.deliveryMultiple}; else delete modes.delivery;
    return {...base,modes};
  }
  const refInfo=id=>{ const p=CAT.variant(id); if(!p) return null;
    return {name:p.name,store:p.store,url:p.url,unitPrice:isGone(p)?null:p.price,sale:saleFor(p),uncertain:isUncertain(p)}; };
  const costInput=it=>({id:it.id,key:it.key,name:it.name,store:it.store,url:it.url,unitPrice:it.price,
    requested:qtyFor(it.id),placed:it.plan?(state.layoutQty[it.id]??0):undefined,
    sale:saleFor(it),requires:(it.variant&&it.variant.requires)||[],uncertain:isUncertain(it)});
  // Az EGYETLEN költségszámítás: lista, összegzés, PDF, bevásárlólista, mentés és megosztás is ezt használja (B05).
  // Feltétel: a bútorelrendezés (state.layoutQty) már ki van számolva.
  function currentCost(){
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100;
    const items=curItems().filter(it=>fits(it)&&!state.off.has(it.id));
    return DRPricing.compute({lines:items.map(costInput),mode:state.fulfillment,zone:state.zone,shipping:DRSales.SHIPPING,
      refInfo,paint:{cost:computePaint(L,W,H).cost},priceDate:PRICE_DATE});
  }
  const costLine=(cost,id)=>cost.lines.find(l=>l.id===id);
  let lastCost=null;
  const UNIT_EN={db:'pc',pár:'pair',csomag:'pack'};
  const unitWord=u=>state.lang==='hu'?(u||'db'):(UNIT_EN[u]||u||'pc');
  const L10N=v=>v&&typeof v==='object'?(v[state.lang]||v.hu):v;
  // Kártya: mennyit kell ténylegesen megvenni és miért, illetve mi nem tartozék (B01–B03).
  function costNotesHtml(l,acc){
    let h='';
    if(l.units&&(l.pack>1||l.extra>0)){
      const why=l.reasons.map(r=>r.code==='pack'?t('whyPack').replace('{n}',r.pack).replace('{u}',unitWord(r.unit))
        :r.code==='multiple'?(r.mode==='delivery'?t('whyDeliveryMultiple'):t('whyMultiple')).replace('{n}',r.multiple)
        :r.code==='min'?t('whyMin').replace('{n}',r.min):'').filter(Boolean).join('; ');
      let alt='';
      if(l.reasons.some(r=>r.code==='multiple'&&r.mode==='delivery')){ const p=DRPricing.purchase(l.requested,l.sale,'pickup'); alt=' '+t('whyPickupAlt').replace('{n}',p.units); }
      h+=`<div class="buy-note">${t('buyQty').replace('{units}',l.units).replace('{u}',unitWord(l.unit))}${l.pack>1?` (${l.pieces} ${t('pieces')})`:''}`+
        (l.extra>0?` · <b>${t('buyExtra').replace('{n}',l.extra)}</b> — ${why}.${alt}`:'')+`</div>`;
    }
    acc.forEach(a=>{
      const what=`${L10N(a.label)}${a.note?` (${a.note})`:''} × ${a.need}`;
      const accWhy=a.known&&a.extra>0?` · ${t('buyQty').replace('{units}',a.units).replace('{u}',unitWord(a.unit))}${a.pack>1?` (${a.pieces} ${t('pieces')})`:''}: `+
        a.reasons.map(r=>r.code==='pack'?t('whyPack').replace('{n}',r.pack).replace('{u}',unitWord(r.unit)):r.code==='multiple'?(r.mode==='delivery'?t('whyDeliveryMultiple'):t('whyMultiple')).replace('{n}',r.multiple):t('whyMin').replace('{n}',r.min)).join('; '):'';
      h+=a.known?`<div class="acc-note">${t('accMissing')} ${what} — ${escapeHtml(a.ref.name)} ≈ ${fmt(a.total)} Ft ${t('accSeparate')}${accWhy}</div>`
        :`<div class="acc-note is-unknown">${t('accMissing')} ${what} — ${t('accUnknown')}</div>`;
    });
    return h;
  }
  const shipText=s=>s.known?(s.amount?fmt(s.amount)+' Ft':t('shipFree'))
    :s.belowMinimum?t('shipBelowMin').replace('{n}',fmt(s.belowMinimum))
    :s.min!=null&&s.max!=null?fmt(s.min)+'–'+fmt(s.max)+' Ft '+t('shipByZone')
    :s.min!=null?t('shipFrom').replace('{n}',fmt(s.min)):t('shipUnknown');
  // ---- TERMÉKLAP (3. szakasz, C03–C05): mi bolti adat és mi szemléltető becslés ----
  function dimsText(it){
    const d=it.variant&&it.variant.dimensions; if(!d) return `${it.w} × ${it.d} cm`;
    const sure=d.width.status==='verified'&&d.depth.status==='verified';
    return `${sure?'':'≈ '}${d.width.value} × ${d.depth.value}${d.height.value?` × ${d.height.value}`:''} cm`;
  }
  const AVAIL={InStock:['Raktáron','In stock'],InStoreOnly:['Csak áruházban','In store only'],OutOfStock:['Nincs készleten','Out of stock'],LimitedAvailability:['Korlátozottan elérhető','Limited']};
  function statusBadge(f){
    if(!f||f.status==='missing') return `<span class="src-badge is-missing">${t('srcMissing')}</span>`;
    if(f.status==='verified') return `<span class="src-badge is-verified">${t('srcStore')}${f.checkedAt?' · '+fmtDay(String(f.checkedAt).slice(0,10)):''}</span>`;
    return `<span class="src-badge is-estimated">${t('srcEstimate')}</span>`;
  }
  function openDetails(slotId){
    const it=curItems().find(x=>x.id===slotId); if(!it||!it.variant) return;
    const v=it.variant, d=v.dimensions, A=v.attributes, row=(label,value,f)=>`<tr><th>${label}</th><td>${value??'—'}</td><td>${statusBadge(f)}</td></tr>`;
    const cmv=f=>f&&f.value!=null?f.value+' cm':null;
    const pk=v.package&&v.package.parcels?v.package.parcels.map(p=>`${p.count||1} × ${p.width} × ${p.height} × ${p.length} cm, ${String(p.weightKg).replace('.',',')} kg`).join('<br>'):null;
    const ps=priceState(it), priceF=ps.kind==='fresh'||ps.kind==='stale'?{status:'verified',checkedAt:ps.c.checkedAt}:{status:ps.kind==='unverified'?'estimated':'missing'};
    const av=A.availability&&A.availability.value?(AVAIL[A.availability.value]||[A.availability.value,A.availability.value])[li()]:null;
    const off=A.offerPeriod&&A.offerPeriod.value?t('offerUntil').replace('{d}',fmtDay(A.offerPeriod.value.until)):null;
    const lic=v.image&&v.image.license?t('lic_'+v.image.license.status)+(v.image.license.owner?` (${STORE_LABEL[v.image.license.owner]||v.image.license.owner})`:''):null;
    const imgF=v.image&&v.image.status==='verified'?{status:'verified',checkedAt:v.image.checkedAt}:{status:v.image&&v.image.url?'estimated':'missing'};
    const sale=v.sale?`${v.sale.pack>1?v.sale.pack+' db / '+unitWord(v.sale.unit):'1 '+unitWord(v.sale.unit)}${v.sale.modes&&v.sale.modes.delivery?` · ${t('whyDeliveryMultiple').replace('{n}',v.sale.modes.delivery.multiple)}`:''}`:'1 db';
    const html=`<div class="slbox detail-box"><div class="slhead"><h3>${escapeHtml(it.name)}</h3><button class="slclose" id="dX" aria-label="${t('slClose')}">✕</button></div>
      <p class="detail-lead">${t('detailLead')}</p>
      <table class="detail-table"><tbody>
      ${row(t('dStoreName'),v.storeName?escapeHtml(v.storeName.value):null,v.storeName)}
      ${row(t('dSku'),v.sku,v.sku?{status:'verified',checkedAt:v.storeName&&v.storeName.checkedAt}:{status:'missing'})}
      ${row(t('dPrice'),fmt(it.price)+' Ft / '+unitWord((v.sale&&v.sale.unit)||'db'),priceF)}
      ${row(t('dWidth'),cmv(d.width),d.width)}${row(t('dDepth'),cmv(d.depth),d.depth)}${row(t('dHeight'),cmv(d.height),d.height)}
      ${d.open?row(t('dOpen'),cmv(d.open.width)+(d.open.closedWidth?` (${t('dClosed')}: ${cmv(d.open.closedWidth)})`:''),d.open.width):''}
      ${row(t('dWall'),d.wallMounted.value?t('yes'):t('no'),d.wallMounted)}
      ${row(t('dPackage'),pk,v.package)}
      ${row(t('dMaterial'),A.material&&A.material.value?escapeHtml(A.material.value):null,A.material)}
      ${row(t('dColor'),A.color&&A.color.value?escapeHtml(A.color.value):null,A.color)}
      ${row(t('dCategory'),A.storeCategory&&A.storeCategory.value?escapeHtml(A.storeCategory.value):catName(it.id),A.storeCategory)}
      ${row(t('dStock'),av,A.availability)}
      ${row(t('dOffer'),off,A.offerPeriod&&A.offerPeriod.value?A.offerPeriod:{status:'missing'})}
      ${row(t('dSale'),sale,v.sale?{status:'verified',checkedAt:v.sale.checked||null}:{status:'estimated'})}
      ${row(t('dImage'),lic,imgF)}
      </tbody></table>
      <p class="detail-foot">${t('detailFoot')} <a href="${escapeHtml(v.urls.canonical)}" target="_blank" rel="noopener">${t('slOpen')}</a></p>
      <div class="slbtns"><button class="cl" id="dX2">${t('slClose')}</button></div></div>`;
    const ov=document.getElementById('slOverlay'); ov.innerHTML=html; ov.style.display='flex';
    const close=()=>{ ov.style.display='none'; }; ov.querySelector('#dX').onclick=close; ov.querySelector('#dX2').onclick=close; ov.onclick=e=>{ if(e.target===ov) close(); };
  }
  // C06: helyreállítási üzenet régi / sérült mentésnél
  function restoreText(n){
    if(n.code==='brokenLink') return t('restoreBroken');
    return t('restoreMissing').replace('{what}',catName(n.slot));
  }
  // Összegzés: mit tartalmaz a becsült végösszeg, és mit kell a boltban pontosítani (B04).
  function renderCostSummary(cost){
    const T=cost.totals, el=id=>document.getElementById(id);
    el('furnTotal').textContent=fmt(T.products)+' Ft';
    el('paintTotal').textContent=T.paint?'≈ '+fmt(T.paint)+' Ft':'—';
    el('accRow').hidden=!cost.accessories.length;
    el('accTotal').textContent=T.accessories?'≈ '+fmt(T.accessories)+' Ft':t('shipUnknown');
    el('shipRows').innerHTML=cost.stores.filter(s=>s.subtotal||cost.lines.some(l=>l.store===s.store&&l.units)).map(s=>
      `<div class="brk ship-row"><span>${STORE_LABEL[s.store]} · ${cost.mode==='pickup'?t('modePickup'):t('modeDelivery')}</span><span class="${s.shipping.known?'':'is-unknown'}">${shipText(s.shipping)}</span></div>`).join('');
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===cost.mode));
    el('fulfillSeg').dataset.mode=cost.mode;
    el('zoneRow').hidden=cost.mode!=='delivery'||!cost.stores.some(s=>s.store==='ikea');
    el('zoneSel').value=state.zone||'';
    el('grandNote').textContent=T.hasUnknown?t('grandPlusUnknown'):'';
    const u=cost.unknown, items=[];
    u.prices.forEach(p=>items.push(t('openPrice').replace('{name}',p.name)));
    u.accessories.forEach(a=>items.push(`${L10N(a.label)}${a.note?` (${a.note})`:''} × ${a.need} — ${escapeHtml(a.forName)}`));
    u.shipping.forEach(s=>items.push(`${STORE_LABEL[s.store]}: ${t('openShipping')} (${shipText(s)})`));
    cost.extras.forEach(x=>items.push(t('openExtra').replace('{name}',x.name).replace('{n}',x.extra)));
    if(T.paint) items.push(t('openPaint'));
    el('costOpen').hidden=!items.length;
    el('costOpenList').innerHTML=items.map(x=>`<li>${x}</li>`).join('');
    // Mentett / megosztott terv: a mentéskori árpillanatképhez képest látszik a változás (B05)
    el('restoreNote').hidden=!restoreNotes.length;
    if(restoreNotes.length) el('restoreNote').innerHTML=`<b>${t('restoreTitle')}</b><ul>${restoreNotes.map(n=>`<li>${restoreText(n)}</li>`).join('')}</ul>`;
    // Csak valódi egységár-változást jelzünk; a teljes összeget csak azonos teljesítési mód és zóna mellett vetjük össze
    // (különben a különbség a mód váltásából jönne, nem az árból).
    const d=state.compareSnap?DRPricing.diff(state.compareSnap,cost):null;
    el('priceChange').hidden=!d||!d.changed.length;
    if(d&&d.changed.length){
      const sameBasis=state.compareSnap.mode===cost.mode&&(state.compareSnap.zone||null)===(cost.zone||null);
      const pd=d.changed.reduce((a,c)=>a+(c.to-c.from)*c.units,0), sign=n=>(n>0?'+':'')+fmt(n);
      el('priceChange').innerHTML=t('priceChangeItems').replace('{delta}',sign(pd))
        +`<ul>${d.changed.map(c=>`<li>${escapeHtml(c.name)}: ${fmt(c.from)} → ${fmt(c.to)} Ft</li>`).join('')}</ul>`
        +(sameBasis?`<div>${t('priceChange').replace('{from}',fmt(d.from)).replace('{to}',fmt(d.to)).replace('{delta}',sign(d.delta))}</div>`:'');
    }
  }
  // ---- ÁR-FRISSESSÉG (A04) ----
  // Minden termék saját ellenőrzési idővel rendelkezik (prices.json v2 → items[url].checkedAt).
  // Egy napi import nem teszi „maivá” a kimaradt terméket: az ő ára a saját utolsó sikeres idejét mutatja.
  const FRESH_HOURS=48; // kezdeti frissességi határ; partnerenként pontosítandó
  let priceDataLoaded=false;
  function priceState(it){
    const c=it.check;
    if(!priceDataLoaded) return {kind:'loading'};
    if(c&&c.status==='gone') return {kind:'gone',c};
    if(!c||!c.checkedAt) return {kind:'unverified',c,blocked:!!(c&&c.status==='blocked')};
    const age=(Date.now()-Date.parse(c.checkedAt))/36e5;
    return {kind:age>FRESH_HOURS?'stale':'fresh',c,failedSince:c.status!=='ok'};
  }
  const isUncertain=it=>['stale','unverified','gone'].includes(priceState(it).kind);
  const fmtWhen=iso=>new Date(iso).toLocaleString(state.lang==='hu'?'hu-HU':'en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const fmtDay=ymd=>new Date(ymd+'T12:00:00Z').toLocaleDateString(state.lang==='hu'?'hu-HU':'en-GB',{month:'short',day:'numeric'}).replace(/\.$/,'');
  // A05: megszűnt termék jelzése ellenőrzött csereajánlattal, és a korábbi csere története.
  function recordReplacement(id,fromO,toO,reason){
    const pick=o=>({vid:o.vid,key:o.key,name:o.name,store:o.store,price:o.price,url:o.url});
    state.replaced[keyOf(id)]={from:pick(fromO),to:pick(toO),reason,at:new Date().toISOString()};
  }
  function replaceNoteHtml(it){
    let h='';
    if(isGone(it)){
      const slot=getSlots().find(s=>s.id===it.id), to=suggestReplacement(slot,it.selFull,allowedIdxs(slot)), o=to>=0?slot.options[to]:null;
      h+=`<div class="gone-note" role="alert"><b>${t('goneTitle')}</b> ${t('goneText')}`+
        (o?`<span class="gone-suggest">${t('goneSuggest')} <b>${escapeHtml(o.name)}</b> · ${fmt(o.price)} Ft</span><button type="button" class="replace-btn" data-id="${it.id}" data-to="${to}">${t('goneReplace')}</button>`:'')+`</div>`;
    }
    const rec=state.replaced[keyOf(it.id)];
    if(rec&&rec.to&&(rec.to.vid?rec.to.vid===it.vid:rec.to.key===it.key)) h+=`<div class="replace-history">${t('replacedNote').replace('{from}',escapeHtml(rec.from.name)).replace('{when}',fmtDay(rec.at.slice(0,10)))}</div>`;
    return h;
  }
  // ---- R05: miért ez a termék? — eredet, a vizsgált kör, mi változott a keret miatt, mi bizonytalan ----
  function whyHtml(it){
    const r=it.reco||{}, p=it.picked, parts=[], room=ROOM_LOWER[state.room][li()], style=STYLE_LABEL[state.style][li()].toLowerCase();
    const nameOf=vid=>{ const o=vid&&CAT.variant(vid); return o?escapeHtml(o.name):'—'; };
    let head;
    if(p&&p.how!=='user'){
      head=t('whyHow_'+p.how)+(p.from?` ${t('whyBefore').replace('{name}',nameOf(p.from))}`:'');
      head+=` <button type="button" class="linkbtn why-undo" data-undo-pick="${it.id}">${t('undo')}</button>`;
    } else if(p&&p.how==='user') head=t('whyUser');
    else if(it.selFull!==it.recoIdx) head=t('whySaved');
    else if(r.code==='primary') head=t('whyPrimary').replace('{style}',style).replace('{room}',room);
    else {
      const b=(r.primaryBlocked||[])[0], what=r.primaryName?escapeHtml(r.primaryName):'';
      head=t('whyAlt').replace('{name}',what)+' '+(b==='store'?t('whyBlk_store').replace('{store}',STORE_LABEL[r.primaryStore]||r.primaryStore):b?t('whyBlk_'+b):'')+' '+t('whyAltRule');
    }
    parts.push(head);
    const exN=Object.values(r.excluded||{}).reduce((a,n)=>a+n,0);
    parts.push(t('whyExamined').replace('{n}',r.examined||it.optCount)+(exN?' '+t('whyExcluded').replace('{list}',Object.entries(r.excluded).map(([k,n])=>`${n} ${t('ex_'+k)}`).join(', ')):''));
    const u=RECO.uncertainties(it,priceState(it).kind);
    if(u.length) parts.push(`<span class="why-unsure">${t('whyUnsure')} ${u.map(x=>t('u_'+x)).join(', ')}.</span>`);
    return `<details class="why"><summary>${t('whyTitle')}</summary><ul>${parts.map(x=>`<li>${x}</li>`).join('')}</ul></details>`;
  }
  function priceNoteHtml(it){
    const s=priceState(it),c=s.c||{};
    const sale=c.listPrice&&c.saleUntil&&s.kind==='fresh'?` · <span class="price-sale">${t('pcSale').replace('{price}',fmt(c.listPrice)).replace('{until}',fmtDay(c.saleUntil))}</span>`:'';
    const store=c.availability==='InStoreOnly'?` · ${t('pcStoreOnly')}`:'';
    if(s.kind==='fresh') return `<div class="price-check is-fresh">${t('pcChecked')} ${fmtWhen(c.checkedAt)}${sale}${store}</div>`;
    if(s.kind==='stale') return `<div class="price-check is-stale" role="note">${t('pcStale')} ${fmtWhen(c.checkedAt)}</div>`;
    if(s.kind==='unverified') return `<div class="price-check is-unverified" role="note">${s.blocked?t('pcBlocked'):t('pcUnverified')}</div>`;
    return '';
  }
  function finishFor(it){
    if(it && state.itemColors[it.id]) return state.itemColors[it.id];
    const s=((it&&it.name)||'').toLowerCase();
    if(/black|fekete|antracit|sötét/.test(s)) return '#343434';
    if(/white|fehér|világos/.test(s)) return '#e8e5de';
    if(/grey|gray|szürke/.test(s)) return '#858782';
    if(/beige|bézs|homok/.test(s)) return '#c5ae8d';
    if(/green|zöld/.test(s)) return '#64765b';
    if(/blue|kék/.test(s)) return '#536b82';
    if(/brown|barna|tölgy|dió|nyír|fa/.test(s)) return '#987858';
    if(it&&(it.rug||it.floor==='rug')) return '#c6b28f';
    return '#9a9993';
  }
  function finishForKind(kind,items){ const it=(items||[]).find(x=>x.id===kind); return it?finishFor(it):(kind==='rug'?'#c6b28f':'#9a9993'); }
  const len=()=>parseFloat(document.getElementById('len').value)||0;
  const wid=()=>parseFloat(document.getElementById('wid').value)||0;
  const hei=()=>parseFloat(document.getElementById('hei').value)||0;

  function computePaint(L,W,H){
    if(state.color==='none'||L<=0||W<=0||H<=0) return {cost:0,html:`<div class="row"><span>${t('paintLabelNone')}</span><b>${t('paintNone')}</b></div>`};
    const net=Math.max(2*(L+W)*H-OPENINGS,0), liters=net*COATS/PAINT.coverage, cans=Math.max(1,Math.ceil(liters/PAINT.can)), cost=cans*PAINT.price;
    return {cost,html:`<div class="row"><span>${t('paintNet')}</span><b>${net.toFixed(1)} m²</b></div><div class="row"><span>${t('paintLiters')}</span><b>${liters.toFixed(1)} ${state.lang==='hu'?'liter':'litre'}</b></div><div class="row"><span>${t('paintCans')}</span><b>${cans} ${t('cans')}</b></div><div class="row"><span>${t('paintCost')}</span><b>${fmt(cost)} Ft</b></div>`};
  }
  function computeCosts(){
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100;
    const resolved=placements3D(L,W,drawnList());
    const placed=new Set(resolved.map(b=>b.productId));
    state.layoutQty={};
    resolved.forEach(b=>state.layoutQty[b.productId]=(state.layoutQty[b.productId]||0)+1);
    state.layoutOmit=new Set(drawnList().filter(it=>placed.has(it.id)===false).map(it=>it.id));
    const c=currentCost(); return {furnTotal:c.totals.products,paintTotal:c.totals.paint,grand:c.totals.known};
  }
  // ---- KERETHEZ IGAZÍTÁS (5. szakasz, R02) ----
  // Kötelező (a szoba fő funkciója, katalógusadat) / opcionális / zárolt tételek. Sorrend: olcsóbb megfelelő változat →
  // darabszám → opcionális tétel elhagyása. Kötelező és zárolt tétel nem esik ki; ha nincs megoldás, kiírjuk.
  // Minden változtatás naplózva és egyenként visszavonható (R05).
  const minQtyOf=id=>{ const c=CAT.categories[id]||{}; return c.minQty??c.planQty??1; };
  function withPlan(plan,fn){
    // Egy feltételezett összeállítás kiértékelése a valódi költség- és elrendezésszámítással, utána minden visszaáll.
    const keep={sel:{...state.sel},off:new Set(state.off),quantity:{...state.quantity},layoutQty:{...state.layoutQty},layoutOmit:new Set(state.layoutOmit)};
    try{
      getSlots().forEach(slot=>{ const i=plan.sel[slot.id]; if(i!=null&&slot.options[i]) state.sel[keyOf(slot.id)]=slot.options[i].vid; });
      state.off=new Set(plan.off);
      Object.entries(plan.qty).forEach(([id,n])=>{ if(n!==qtyFor(id)) state.quantity[id]=n; });
      return fn();
    } finally { Object.assign(state,keep); }
  }
  function evaluatePlan(plan){
    return withPlan(plan,()=>{ const c=computeCosts(), placed={};
      curItems().forEach(it=>{ if(!fits(it)||state.off.has(it.id)) return; placed[it.id]=it.plan?(state.layoutQty[it.id]||0):qtyFor(it.id); });
      return {total:c.grand,placed}; });
  }
  function autoFit(){
    const items=curItems();
    const slots=items.map(it=>({id:it.id,role:it.role,locked:it.locked,on:fits(it)&&!state.off.has(it.id),sel:it.selFull,options:it.options,
      // csere csak megfelelő (R01), ellenőrzött árú és a szobába beférő termékre
      candidates:it.allowed.filter(i=>{ const o=it.options[i]; return !isGone(o)&&isVerified(o)&&itemFit(o,it.id).fits; }),
      qty:qtyFor(it.id),minQty:minQtyOf(it.id),qtyLocked:state.quantity[it.id]!=null}));
    const before={sel:{...state.sel},off:[...state.off],quantity:{...state.quantity},picked:{...state.picked}};
    const r=RECO.fitBudget({slots,budget:state.budget,evaluate:evaluatePlan});
    const changes=r.changes.map(c=>({...c,slotName:catName(c.slot)}));
    // Ha a fő funkció megtartásával nincs megoldás, magától nem változtat semmit: kimondja, és felajánlja a legolcsóbbat.
    if(r.ok) applyChanges(changes,slots,'budget');
    state.budgetLog={kind:'budget',at:new Date().toISOString(),before,ok:r.ok,applied:r.ok,over:r.over,total:r.total,startTotal:r.startTotal,budget:state.budget,blockers:r.blockers,changes,slots};
    render();
  }
  function applyChanges(changes,slots,how){
    changes.forEach(c=>{ const s=slots.find(x=>x.id===c.slot), k=keyOf(c.slot);
      if(c.type==='swap'){ c.fromVid=s.options[c.from].vid; c.toVid=s.options[c.to].vid; state.sel[k]=c.toVid; state.picked[k]={how,from:c.fromVid,at:new Date().toISOString()}; }
      else if(c.type==='qty'){ c.wasSet=state.quantity[c.slot]!=null; state.quantity[c.slot]=c.to; }
      else if(c.type==='drop') state.off.add(c.slot); });
  }
  function undoChange(i){
    const log=state.budgetLog, c=log&&log.changes[i]; if(!c||c.undone) return;
    const k=keyOf(c.slot);
    if(c.type==='swap'){ state.sel[k]=c.fromVid; delete state.picked[k]; }
    else if(c.type==='qty'){ if(c.wasSet) state.quantity[c.slot]=c.from; else delete state.quantity[c.slot]; }
    else if(c.type==='drop') state.off.delete(c.slot);
    c.undone=true; render();
  }
  function undoAll(){
    const log=state.budgetLog; if(!log) return;
    state.sel=log.before.sel; state.off=new Set(log.before.off); state.quantity=log.before.quantity; state.picked=log.before.picked;
    state.budgetLog=null; render();
  }
  // Egy tétel választásának visszavonása (keresésből, keret-igazításból vagy „legolcsóbb mindenhol”-ból jött csere)
  function undoPick(id){
    const k=keyOf(id), p=state.picked[k]; if(!p) return;
    if(p.from) state.sel[k]=p.from; else delete state.sel[k];
    delete state.picked[k];
    if(state.budgetLog) state.budgetLog.changes.forEach(c=>{ if(c.slot===id&&c.type==='swap') c.undone=true; });
    render();
  }
  function budgetLogHtml(){
    const log=state.budgetLog; if(!log) return '';
    const head=log.kind==='cheap'?t('logCheapTitle'):log.ok?t('logOkTitle').replace('{saving}',fmt(Math.max(0,log.startTotal-log.total))):t('logFailTitle').replace('{over}',fmt(log.over));
    const pending=log.kind==='budget'&&!log.applied;
    const rows=log.changes.map((c,i)=>{
      const txt=c.type==='swap'?t('logSwap').replace('{cat}',c.slotName).replace('{from}',escapeHtml(c.fromName)).replace('{to}',escapeHtml(c.toName))
        :c.type==='qty'?t('logQty').replace('{cat}',c.slotName).replace('{from}',c.from).replace('{to}',c.to)
        :t('logDrop').replace('{cat}',c.slotName).replace('{name}',escapeHtml(c.name||''));
      return `<li class="${c.undone?'is-undone':''}"><span>${txt}${c.saving?` <b>−${fmt(c.saving)} Ft</b>`:''}</span>${pending?'':c.undone?`<em>${t('logUndone')}</em>`:`<button type="button" class="minibtn log-undo" data-undo="${i}">${t('undo')}</button>`}</li>`; }).join('');
    const why=!log.ok&&log.kind!=='cheap'?`<p class="log-why">${t('logFailWhy')} ${log.blockers.map(b=>`<b>${catName(b.slot)}</b> (${b.locked?t('roleLocked'):t('roleRequired')}${b.name?': '+escapeHtml(b.name):''})`).join(', ')}.</p>`:'';
    const none=!log.changes.length?`<p class="log-why">${log.ok?t('logNothing'):t('logNoMove')}</p>`:'';
    const offer=pending&&log.changes.length?`<p class="log-why">${t('logNotApplied').replace('{total}',fmt(log.total))}</p><button type="button" class="replace-btn" id="logApply">${t('logApply').replace('{total}',fmt(log.total))}</button>`:'';
    return `<div class="budget-log${log.ok||log.kind==='cheap'?'':' is-fail'}" role="status"><div class="log-head"><b>${head}</b>${log.changes.length&&!pending?`<button type="button" class="minibtn" id="logUndoAll">${t('undoAll')}</button>`:''}<button type="button" class="minibtn" id="logClose" aria-label="${t('slClose')}">✕</button></div>${why}${none}${offer}${rows?`<ul${pending?' class="is-pending"':''}>${rows}</ul>`:''}</div>`;
  }

  function drawBlock(P,x,y,w,h,fill,stroke,icon,dragId,i,cls){
    const dattr=dragId?` data-drag="${dragId}" data-x="${P+x}" data-y="${P+y}" style="cursor:grab"`:'';
    // A belső .pb csoport animálható (beesés), a külső transform marad a pozícióé.
    return `<g transform="translate(${P+x},${P+y})"${dattr}${cls?` class="${cls}"`:''}><g class="pb" style="--i:${i||0}"><rect width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/><text x="${w/2}" y="${h/2}" font-size="44" text-anchor="middle" dominant-baseline="central">${icon}</text></g></g>`;
  }
  // R04: ajtó (zsanér, ajtólap, nyitási ív) a választott falon; a nyitási négyzet tiltott terület
  function doorSvg(P,door,wallHex){
    const {wall,offset:o,width:w,zone}=door, R=roomNow(), Wd=R.W, Dp=R.D;
    const pts=wall==='bottom'?[[o,Dp],[o+w,Dp],[o,Dp-w]]:wall==='top'?[[o,0],[o+w,0],[o,w]]:wall==='left'?[[0,o],[0,o+w],[w,o]]:[[Wd,o],[Wd,o+w],[Wd-w,o]];
    const [h,c,op]=pts.map(p=>[P+p[0],P+p[1]]), sweep=((c[0]-h[0])*(op[1]-h[1])-(c[1]-h[1])*(op[0]-h[0]))>0?1:0;
    const gap=wall==='bottom'||wall==='top'?`<rect x="${P+o}" y="${(wall==='top'?P:P+Dp)-6}" width="${w}" height="12" fill="${wallHex}"/>`:`<rect x="${(wall==='left'?P:P+Wd)-6}" y="${P+o}" width="12" height="${w}" fill="${wallHex}"/>`;
    return `<rect x="${P+zone.x}" y="${P+zone.y}" width="${zone.w}" height="${zone.d}" class="plan-door-zone"/>${gap}`+
      `<path d="M ${h[0]} ${h[1]} L ${op[0]} ${op[1]} M ${c[0]} ${c[1]} A ${w} ${w} 0 0 ${sweep} ${op[0]} ${op[1]}" fill="none" class="plan-door" stroke-width="3" stroke-dasharray="6 6"/>`;
  }
  function buildPlan(L,W,drawn,wallHex,prevWallHex){
    const roomW=Math.max(L,W)*100,roomH=Math.min(L,W)*100,P=32,vw=roomW+2*P,vh=roomH+2*P;
    const lay=runLayout(L,W,drawn);
    let blocks='',zones='',n=0;
    // Ugyanazok a cm-koordináták hajtják az alaprajzot és a 3D-jelenetet (layout.js).
    lay.placed.forEach(b=>{
      const it=drawn.find(x=>x.id===b.productId)||drawn.find(x=>x.plan===b.kind);
      const icon=it?it.icon:(META[b.kind]||{}).icon||'▪';
      const color=it?finishFor(it):finishForKind(b.kind,drawn), isRug=!!b.rug;
      blocks+=drawBlock(P,b.box.x,b.box.y,b.w,b.d,color,isRug?'#a08a5b':'#3a352d',icon,b.instanceId,n++,[state.selBlock===b.instanceId?'is-selected':'',b.wall?'is-wall':''].filter(Boolean).join(' '));
      // R04: használati sáv (szék kihúzása, ajtó/fiók nyitása) — piros, ha kevés a hely
      if(b.clear){ const z=b.clear.zone; zones+=`<rect x="${P+z.x}" y="${P+z.y}" width="${z.w}" height="${z.d}" class="plan-clear${b.clear.have<b.clear.need?' is-short':''}"/>`; }
    });
    const screen=tvScreen(lay.placed);
    if(screen) blocks+=drawBlock(P,screen.cx-screen.w/2,screen.cy-screen.d/2,screen.w,screen.d,String.fromCharCode(35)+'202124',String.fromCharCode(35)+'202124',state.tvPlacement==='wall'?(state.lang==='hu'?'TV: falon':'TV: wall'):(state.lang==='hu'?'TV: bútoron':'TV: stand'),null,n++);
    // Falszínváltáskor az új szín körhullámként terül szét a régi fölött.
    const under=prevWallHex?`<rect x="${P}" y="${P}" width="${roomW}" height="${roomH}" fill="${prevWallHex}" class="plan-wall-old"/>`:'';
    return `<svg class="plan" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      ${under}<rect x="${P}" y="${P}" width="${roomW}" height="${roomH}" fill="${wallHex}" class="plan-floor${prevWallHex?' wall-reveal':''}"/>
      <rect x="${P}" y="${P}" width="${roomW}" height="${roomH}" fill="none" class="plan-wall" stroke-width="10" pathLength="1000"/>
      ${doorSvg(P,lay.door,wallHex)}
      ${zones}${blocks}
      <text x="${vw/2}" y="${P/1.4}" font-size="34" text-anchor="middle" class="plan-dim">${Math.max(L,W).toLocaleString('hu-HU')} m</text>
      <text x="${P/1.4}" y="${vh/2}" font-size="34" text-anchor="middle" class="plan-dim" transform="rotate(-90 ${P/1.4} ${vh/2})">${Math.min(L,W).toLocaleString('hu-HU')} m</text>
    </svg>`;
  }
  // R03: minden mozgatás és forgatás ugyanazon a szabályon megy át (layout.js validateMove) — 2D-ben és 3D-ben is.
  let lastBlock=null;
  const blockText=r=>t({wall:'blockWall',overlap:'blockOverlap',door:'blockDoor',height:'blockHeight',mount:'blockMount'}[r]||'layoutBlocked');
  function canPlace(id,cx,cy,rot){
    const lay=runLayout(len(),wid(),drawnList());
    lastBlock=LY.validateMove(lay,id,cx,cy,lay.room,state.door,rot);
    return !lastBlock;
  }
  function freezeLayout(lay){ lay.placed.forEach(b=>{ state.pos[keyOf(b.instanceId)]={x:b.box.x,y:b.box.y}; if(b.rot) state.rot[keyOf(b.instanceId)]=b.rot; }); }
  function commitPlacement(it){
    if(!canPlace(it.instanceId,it.cx,it.cy)) return false;
    const lay=runLayout(len(),wid(),drawnList()), current=lay.placed.find(b=>b.instanceId===it.instanceId);
    if(!current) return false;
    freezeLayout(lay);
    state.pos[keyOf(it.instanceId)]={x:it.cx-current.w/2,y:it.cy-current.d/2};
    render();
    return true;
  }
  // Forgatás 90°-kal a középpont körül; ha így nem fér el, visszaáll és megmondja, miért.
  function rotateSelected(){
    const id=state.selBlock; if(!id) return;
    const lay=runLayout(len(),wid(),drawnList()), p=lay.placed.find(b=>b.instanceId===id);
    const status=document.getElementById('layoutStatus');
    if(!p){ state.selBlock=null; render(); return; }
    const next=LY.norm(p.rot+90), f=LY.footprint(p.baseW,p.baseD,next), R=lay.room;
    // a középpont körül forgat; ha a fal útban van, a falon belülre csúsztatja (a többi szabály ugyanúgy érvényes)
    const cx=Math.max(LY.WALL+f.w/2,Math.min(p.cx,R.W-LY.WALL-f.w/2)), cy=Math.max(LY.WALL+f.d/2,Math.min(p.cy,R.D-LY.WALL-f.d/2));
    if(!canPlace(id,cx,cy,next)){ status.textContent=t('rotateBlocked').replace('{why}',t('rotWhy_'+lastBlock)||''); return; }
    freezeLayout(lay);
    state.rot[keyOf(id)]=next; state.pos[keyOf(id)]={x:cx-f.w/2,y:cy-f.d/2};
    render();
  }
  function attachDrag(){
    const svg=document.querySelector('svg.plan'); if(!svg) return;
    const vb=svg.viewBox.baseVal, P=32;
    let cur=null;
    svg.querySelectorAll('[data-drag]').forEach(g=>{
      g.addEventListener('pointerdown',e=>{
        const rect=svg.getBoundingClientRect(), scale=1/svg.getScreenCTM().a;
        cur={g,id:g.getAttribute('data-drag'),sx:e.clientX,sy:e.clientY,ox:+g.getAttribute('data-x'),oy:+g.getAttribute('data-y'),scale};
        g.setPointerCapture(e.pointerId); g.style.cursor='grabbing'; e.preventDefault();
      });
      g.addEventListener('pointermove',e=>{
        if(!cur||cur.g!==g) return;
        cur.nx=cur.ox+(e.clientX-cur.sx)*cur.scale; cur.ny=cur.oy+(e.clientY-cur.sy)*cur.scale;
        g.setAttribute('transform',`translate(${cur.nx},${cur.ny})`);
      });
      const done=()=>{
        if(!cur) return;
        // apró elmozdulás = koppintás: kijelölés (forgatáshoz)
        const moved=cur.nx!=null&&Math.hypot(cur.nx-cur.ox,cur.ny-cur.oy)>3;
        if(moved){
          const box=g.querySelector('rect'), w=box?+box.getAttribute('width'):0, h=box?+box.getAttribute('height'):0;
          const x=cur.nx-P,y=cur.ny-P;
          if(!commitPlacement({instanceId:cur.id,cx:x+w/2,cy:y+h/2})) cur.blocked=true;
        }
        g.style.cursor='grab'; const c=cur; cur=null;
        if(!moved){ state.selBlock=state.selBlock===c.id?null:c.id; render(); return; }
        render();   // érvénytelen helynél az eredeti hely áll vissza
        if(c.blocked) document.getElementById('layoutStatus').textContent=blockText(lastBlock);
      };
      g.addEventListener('pointerup',done);
      g.addEventListener('pointercancel',()=>{ if(cur) cur.nx=null; done(); render(); });
    });
  }

  function buildTabs(){
    const rt=document.getElementById('roomtabs');
    rt.innerHTML=ROOMS.map(r=>`<div class="tab room ${state.room===r.id?'sel':''}" data-r="${r.id}">${ROOM_LABEL[r.id][li()]}</div>`).join('');
    rt.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{state.room=el.dataset.r;state.off=new Set();state.selBlock=null;state.budgetLog=null;state.compareSnap=null;restoreNotes=[];render();}));
    const stb=document.getElementById('styletabs');
    stb.innerHTML=STYLES.map(s=>`<div class="tab ${state.style===s.id?'sel':''}" data-s="${s.id}">${STYLE_LABEL[s.id][li()]}</div>`).join('');
    stb.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{state.style=el.dataset.s;state.off=new Set();state.selBlock=null;state.budgetLog=null;state.compareSnap=null;restoreNotes=[];render();}));
  }
  function applyStatic(){
    document.documentElement.lang=state.lang;
    document.querySelectorAll('[data-i18n]').forEach(e=>{ if(e.id==='welcomeTitle') M.setSplitText(e,t(e.dataset.i18n)); else e.textContent=t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(e=>{e.innerHTML=t(e.dataset.i18nHtml);});
    document.querySelectorAll('[data-i18n-ph]').forEach(e=>{e.placeholder=t(e.dataset.i18nPh);});
    document.getElementById('plannerWord').textContent=t('planner');
    document.getElementById('langBtn').textContent=state.lang==='hu'?'EN':'HU';
    const hb=document.getElementById('houseBtn'); if(hb) hb.textContent=t('houseBtn')+' ('+state.house.length+')';
  }
  function buildPalette(){
    const el=document.getElementById('palette');
    const cls=id=>(state.color===id?'sel':'')+(justPicked===id?' just':'');
    let html=COLORS.map(c=>`<div class="swatch ${cls(c.id)}" data-c="${c.id}"><div class="chip" style="background:${c.hex}"></div>${state.lang==='hu'?c.name:(COLOR_EN[c.id]||c.name)}</div>`).join('');
    html+=`<div class="swatch none ${cls('none')}" data-c="none"><div class="chip">∅</div>${t('noneItem')}</div>`;
    el.innerHTML=html;
    el.querySelectorAll('.swatch').forEach(s=>s.addEventListener('click',()=>{ if(state.color===s.dataset.c) return; state.color=s.dataset.c; justPicked=s.dataset.c; render(); justPicked=null; }));
  }
  let justPicked=null,lastWall=null,pendingSwap=null,pendingFly=null;
  const wallHex=()=>{const c=COLORS.find(x=>x.id===state.color);return c?c.hex:'#ffffff';};
  function buildStoreChips(){
    const el=document.getElementById('storechips'); if(!el) return;
    el.innerHTML=STORES.map(s=>`<span class="schip ${state.stores.has(s)?'on':''}" data-s="${s}">${STORE_LABEL[s]}</span>`).join('');
    el.querySelectorAll('.schip').forEach(c=>c.addEventListener('click',()=>{ const s=c.dataset.s; if(state.stores.has(s)){ if(state.stores.size>1) state.stores.delete(s); } else state.stores.add(s); render(); }));
  }

  function render(){
    updateTVUI();
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100,roomArea=(L*W)*10000;
    state.layoutOmit.clear();
    const list=curItems();
    applyStatic();
    document.getElementById('styleName').textContent=STYLE_LABEL[state.style][li()];
    document.getElementById('roomName').textContent=ROOM_LOWER[state.room][li()];
    // R06: a listaszűrő CSAK a megjelenítést szűkíti — az összeg, az alaprajz és a 3D minden tételt tartalmaz.
    const q=RECO.fold((state.search||'').trim());
    let hiddenN=0;

    const listEl=document.getElementById('list'); listEl.innerHTML='';
    let furnArea=0,fitCount=0,onCount=0; const drawn=[];
    list.forEach(it=>{
      const ok=fits(it); if(ok) fitCount++;
      const qty=qtyFor(it.id);
      const on=ok&&!state.off.has(it.id);
      if(on&&it.plan) drawn.push(it);
      if(q && !(RECO.fold(it.name).includes(q) || RECO.fold(catName(it.id)).includes(q))){ hiddenN++; return; }
      const badge=ok?(it.fit.rotated?`<span class="badge-rot" title="${t('rotOnlyTitle')}">${t('rotOnly')}</span>`:'')
        :`<span class="badge-nofit">${it.fit.reason==='height'?t('nofitHeight'):t('nofit')}</span>`;
      const roleTag=it.role==='required'?`<span class="role-tag" title="${t('roleRequiredTitle')}">${t('roleRequired')}</span>`:'';
      const lockBtn=`<button type="button" class="lock-btn${it.locked?' is-on':''}" data-lock="${it.id}" aria-pressed="${it.locked}" title="${t('lockTitle')}">${it.locked?'🔒 '+t('locked'):'🔓 '+t('lock')}</button>`;
      let swap='',cmp='';
      if(it.optCount>1){
        // R05: a „legolcsóbb” csak a vizsgált, megfelelő termékek közül értendő
        const cheap=it.isCheapest?`<span class="cheap best">${t('cheapestOf').replace('{n}',it.optCount)}</span>`:`<span class="cheap">${t('cheaperPreOf').replace('{n}',it.optCount)}<b>${fmt(it.minPrice)} Ft</b></span>`;
        swap=`<div class="swap"><button class="sbtn" data-id="${it.id}" data-dir="-1">◀</button><span class="sidx">${it.optIndex+1} / ${it.optCount}</span><button class="sbtn" data-id="${it.id}" data-dir="1">▶</button>${cheap}<button class="cmpbtn" data-cmp="${it.id}">${t('prices')} (${it.optCount})</button></div>`;
        if(state.openCmp.has(it.id)){
          const rows=it.allowed.map(idx=>({o:it.options[idx],idx})).sort((a,b)=>a.o.price-b.o.price).map(({o,idx})=>{
            const isCur=idx===it.selFull, isBest=o.price===it.minPrice;
            const tag=isCur?`<span class="ct cur">${t('cmpSel')}</span>`:(isBest?`<span class="ct best">${t('cmpCheap')}</span>`:'');
            return `<div class="cmprow ${isCur?'cur':''}" data-id="${it.id}" data-idx="${idx}">${storeBadge(o.store)}<span class="cn">${o.name}</span>${tag}<span class="cp">${fmt(o.price)} Ft</span></div>`;
          }).join('');
          cmp=`<div class="compare">${rows}</div>`;
        }
      }
      const el=document.createElement('div'); el.className='item'+(on?'':' off');
      const itemColor=finishFor(it);
      // C05: a színválasztó csak a látványterv színét állítja — nem ígér nem létező bolti változatot
      const colorLabel=t('vizColor'), quantityLabel=state.lang==='hu'?'Darab':'Qty';
      const realColor=it.variant&&it.variant.attributes.color.status==='verified'?it.variant.attributes.color.value:null;
      const vizNote=it.plan&&state.itemColors[it.id]?`<span class="viz-note">${realColor?t('vizColorNote').replace('{c}',escapeHtml(realColor)):t('vizColorNoteNone')}</span>`:'';
      // B01: a darabszám minden tételnél állítható (a bútoroknál a szín is); a megvásárolandó mennyiséget a költségszámítás adja.
      const colorCtl=it.plan?`<label class="item-color"><span>${colorLabel}</span><input class="furn-color" type="color" aria-label="${colorLabel}: ${it.name}" title="${t('vizColorTitle')}" value="${itemColor}" data-id="${it.id}"></label>${vizNote}`:'';
      const controls=`<div class="item-controls">${colorCtl}<div class="quantity-control"><span>${quantityLabel}</span><button type="button" class="qty-btn" data-id="${it.id}" data-step="-1" aria-label="Kevesebb">−</button><b class="qty-value" data-qty-for="${it.id}">${qty}</b><button type="button" class="qty-btn" data-id="${it.id}" data-step="1" aria-label="Több">+</button></div><button type="button" class="detail-btn" data-detail="${it.id}">${t('details')}</button>${lockBtn}</div>`;
      el.innerHTML=`<input type="checkbox" class="chk" ${on?'checked':''} ${ok?'':'disabled'} data-id="${it.id}">${productPhoto(it)}<div class="info"><div class="name">${it.name}${roleTag}</div><div class="meta"><span class="dims">${dimsText(it)}</span> · ${catName(it.id)} ${storeBadge(it.store)}${badge}</div>${priceNoteHtml(it)}${replaceNoteHtml(it)}${whyHtml(it)}<div class="cost-notes" data-notes-for="${it.id}"></div>${controls}${swap}${cmp}</div><div class="right"><div class="price${isUncertain(it)?' is-uncertain':''}" data-price-for="${it.id}"${isUncertain(it)?` title="${t('pcUncertainTitle')}"`:''}>—</div><div class="unit-price" data-unit-for="${it.id}"></div><a class="buy" href="${it.url}" target="_blank" rel="noopener">${t('buy')}</a></div>`;
      el.querySelector('.product-photo img')?.addEventListener('error',e=>{
        e.currentTarget.hidden=true;
        el.querySelector('.photo-fallback').hidden=false;
        console.warn('DREAMR product image unavailable:',it.url);
      },{once:true});
      listEl.appendChild(el);
    });
    // R01: üresen maradt tétel — a választott boltokban nincs megfelelő termék; más bolt nem tölti ki
    missingSlots.forEach(m=>{
      const ex=Object.entries(m.excluded||{}).map(([k,n])=>`${n} ${t('ex_'+k)}`).join(', ');
      const el=document.createElement('div'); el.className='item is-missing';
      el.innerHTML=`<div class="info"><div class="name">${META[m.id]?META[m.id].icon:''} ${catName(m.id)}${m.role==='required'?`<span class="role-tag">${t('roleRequired')}</span>`:''}</div><div class="missing-note" role="note">${t('missingInStores').replace('{stores}',[...state.stores].map(s=>STORE_LABEL[s]||s).join(', '))}${ex?` <span class="muted">(${t('missingWhy')} ${ex})</span>`:''}${m.role==='required'?` <b>${t('missingRequired')}</b>`:''}</div></div>`;
      listEl.appendChild(el);
    });
    const fnote=document.getElementById('filterNote');
    if(fnote){ fnote.hidden=!q; if(q) fnote.innerHTML=`${t('filterNote').replace('{shown}',list.length-hiddenN).split('{all}').join(list.length)} <button type="button" class="linkbtn" id="filterToCatalog">${t('searchCatalogFor').replace('{q}',escapeHtml(state.search.trim()))}</button>`; }
    // Az elrendezés (layout.js) dönti el, mi fér el: a költség, az alaprajz és a 3D ugyanezt használja.
    const lay=runLayout(L,W,drawn), resolved=lay.placed, placedKinds=new Set(resolved.map(x=>x.productId));
    state.layoutQty={}; resolved.forEach(x=>state.layoutQty[x.productId]=(state.layoutQty[x.productId]||0)+1);
    const rejected=drawn.filter(it=>!placedKinds.has(it.id));
    state.layoutOmit=new Set(rejected.map(it=>it.id));
    drawn.forEach(it=>{ const actual=state.layoutQty[it.id]||0; const qtyEl=listEl.querySelector(`[data-qty-for="${it.id}"]`); if(qtyEl) qtyEl.textContent=actual+' / '+qtyFor(it.id); });
    rejected.forEach(it=>{ const cb=listEl.querySelector(`.chk[data-id="${it.id}"]`); if(cb){cb.checked=false;cb.disabled=true;cb.closest('.item')?.classList.add('off');const meta=cb.closest('.item')?.querySelector('.meta');meta?.querySelector('.badge-rot')?.remove();if(meta&&!meta.querySelector('.badge-nofit'))meta.insertAdjacentHTML('beforeend',` <span class="badge-nofit">${t('nofitSpace')}</span>`);} });

    const photoRect=el=>(el.closest('.item')?.querySelector('.product-photo')||el).getBoundingClientRect();
    listEl.querySelectorAll('.chk').forEach(c=>c.addEventListener('change',()=>{ if(c.checked){ state.off.delete(c.dataset.id); pendingFly=photoRect(c); } else state.off.add(c.dataset.id); render(); }));
    listEl.querySelectorAll('.furn-color').forEach(c=>c.addEventListener('change',()=>{state.itemColors[c.dataset.id]=c.value;syncFurnitureViews();}));
    labelFurnitureControls(listEl);
    listEl.querySelectorAll('.qty-btn').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.id,before=qtyFor(id);state.quantity[id]=Math.max(1,Math.min(8,before+(+b.dataset.step)));if(state.quantity[id]>before) M.flyTo(photoRect(b),document.getElementById('navBagBtn'));syncFurnitureViews();}));
    listEl.querySelectorAll('.sbtn').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id,dir=+b.dataset.dir; const slot=getSlots().find(s=>s.id===id); const allowed=allowedIdxs(slot); const cur=selIndex(id); let pos=allowed.indexOf(cur); if(pos<0) pos=0; const next=allowed[(pos+dir+allowed.length)%allowed.length];
      if(isGone(slot.options[cur])&&next!==cur) recordReplacement(id,slot.options[cur],slot.options[next],'gone');
      setSel(id,next,'user'); pendingSwap={id,dir}; render(); }));
    listEl.querySelectorAll('.replace-btn').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id,to=+b.dataset.to; const slot=getSlots().find(s=>s.id===id);
      recordReplacement(id,slot.options[selIndex(id)],slot.options[to],'gone'); setSel(id,to,'user'); pendingSwap={id,dir:1}; render(); }));
    listEl.querySelectorAll('.lock-btn').forEach(b=>b.addEventListener('click',()=>{ const k=keyOf(b.dataset.lock); state.locked.has(k)?state.locked.delete(k):state.locked.add(k); render(); }));
    listEl.querySelectorAll('.why-undo').forEach(b=>b.addEventListener('click',()=>undoPick(b.dataset.undoPick)));
    document.getElementById('filterToCatalog')?.addEventListener('click',()=>openCatalogSearch(state.search.trim()));
    if(pendingSwap){ M.swapIn(listEl.querySelector(`.chk[data-id="${pendingSwap.id}"]`)?.closest('.item'),pendingSwap.dir); pendingSwap=null; }
    listEl.querySelectorAll('.detail-btn').forEach(b=>b.addEventListener('click',()=>openDetails(b.dataset.detail)));
    listEl.querySelectorAll('.cmpbtn').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.cmp; state.openCmp.has(id)?state.openCmp.delete(id):state.openCmp.add(id); render(); }));
    listEl.querySelectorAll('.cmprow').forEach(r=>r.addEventListener('click',()=>{ const id=r.dataset.id,to=+r.dataset.idx,slot=getSlots().find(s=>s.id===id),cur=selIndex(id);
      if(isGone(slot.options[cur])&&to!==cur) recordReplacement(id,slot.options[cur],slot.options[to],'gone');
      setSel(id,to,'user'); render(); }));

    // B05: egyetlen költségszámítás — a lista, az összegzés és minden más felület ebből dolgozik.
    const cost=currentCost(); lastCost=cost;
    onCount=cost.lines.reduce((a,l)=>a+l.requested,0);
    resolved.forEach(it=>{if(!it.rug) furnArea+=it.w*it.d;});
    list.forEach(it=>{
      // kikapcsolt / be nem férő tétel: ugyanazzal a számítással, csak a végösszegen kívül
      const l=costLine(cost,it.id)||DRPricing.line(costInput(it),cost.mode);
      const pe=listEl.querySelector(`[data-price-for="${it.id}"]`); if(pe) pe.textContent=l.total!=null?fmt(l.total)+' Ft':t('costNoPrice');
      const ue=listEl.querySelector(`[data-unit-for="${it.id}"]`); if(ue) ue.textContent=l.units>1&&l.unitPrice!=null?fmt(l.unitPrice)+' Ft / '+unitWord(l.unit):'';
      const ne=listEl.querySelector(`[data-notes-for="${it.id}"]`); if(ne) ne.innerHTML=costNotesHtml(l,cost.accessories.filter(a=>a.for===it.id));
      ne?.closest('.item')?.classList.toggle('is-partial',cost.accessories.some(a=>a.for===it.id));
    });
    // R03–R04: ami nem fért el (okkal), és ahol kevés a használati hely — jól látható, nem csendes
    const name=id=>catName(String(id).split('~')[0]);
    const lines=[];
    if(lay.unplaced.length){ const g={}; lay.unplaced.forEach(u=>{ const k=u.productId+'|'+u.reason; g[k]=g[k]||{id:u.productId,reason:u.reason,n:0}; g[k].n++; });
      lines.push(`<b>${t('layoutOmittedHead')}</b> `+Object.values(g).map(x=>`${catName(x.id)}${x.n>1?' ×'+x.n:''} — ${t('why_'+x.reason)}${list.find(it=>it.id===x.id&&it.role==='required')?` <b class="core-miss">(${t('roleRequired')}!)</b>`:''}`).join('; ')+'. '+t('layoutOmittedTail')); }
    if(lay.warnings.length) lines.push(`<span class="warn-clear"><b>${t('clearHead')}</b> `+lay.warnings.map(w=>t('clear_'+(w.kind in {dchair:1,barstool:1,ochair:1}?'chair':'door')).replace('{what}',name(w.instanceId)).replace('{have}',w.have).replace('{need}',w.need)).join('; ')+'.</span>');
    document.getElementById('layoutStatus').innerHTML=lines.join('<br>');
    const rb=document.getElementById('rotateBtn'); if(rb){ const sel=resolved.find(p=>p.instanceId===state.selBlock); if(!sel) state.selBlock=null; rb.disabled=!sel; rb.textContent=sel?t('rotateSel').replace('{what}',name(sel.instanceId)):t('rotateHint'); }
    syncDoorControls();
    const bl=document.getElementById('budgetLog'); if(bl){ bl.innerHTML=budgetLogHtml();
      bl.querySelectorAll('.log-undo').forEach(b=>b.addEventListener('click',()=>undoChange(+b.dataset.undo)));
      bl.querySelector('#logUndoAll')?.addEventListener('click',undoAll);
      bl.querySelector('#logApply')?.addEventListener('click',()=>{ const log=state.budgetLog; applyChanges(log.changes,log.slots,'budget'); log.applied=true; render(); }); bl.querySelector('#logClose')?.addEventListener('click',()=>{ state.budgetLog=null; render(); }); }
    const paint=computePaint(L,W,H), paintTotal=paint.cost;
    document.getElementById('paintcalc').innerHTML=paint.html;
    const wall=wallHex(),planEl=document.getElementById('plan');
    planEl.innerHTML=buildPlan(L,W,drawn,wall,lastWall&&lastWall!==wall&&!M.reduced()?lastWall:null);
    lastWall=wall;
    if(!document.body.classList.contains('welcome-mode')) M.markNewBlocks(planEl);
    attachDrag();
    document.getElementById('wallDot').style.background=wall;
    buildPalette(); buildTabs(); buildStoreChips();

    const grand=cost.totals.known;
    M.countTo(document.getElementById('grand'),grand,fmt);
    renderCostSummary(cost);
    M.budgetRing(document.getElementById('budgetRing'),state.budget>0?grand/state.budget:0);
    const bagCount=document.getElementById('navBagCount');
    if(bagCount.textContent!==String(onCount)){ bagCount.textContent=onCount; M.bump(bagCount); }
    document.getElementById('navBagBtn').setAttribute('aria-label',t('bagLabel')+' ('+onCount+')');
    if(pendingFly){ M.flyTo(pendingFly,document.getElementById('navBagBtn')); pendingFly=null; }
    // A04: a végösszegből mennyi a bizonytalan (elavult / nem ellenőrzött / megszűnt) tétel
    let unsure=0,unsureN=0;
    cost.lines.forEach(l=>{ if(!l.units||!l.uncertain||l.total==null) return; unsure+=l.total; unsureN++; });
    const ur=document.getElementById('uncertainRow'); ur.hidden=!unsureN;
    if(unsureN){ document.getElementById('uncertainLabel').textContent=t('pcUncertainSum').replace('{n}',unsureN); document.getElementById('uncertainTotal').textContent='≈ '+fmt(unsure)+' Ft'; }
    document.getElementById('countPill').textContent=onCount+' '+t('on')+' · '+fitCount+'/'+list.length+' '+t('fit');

    const budget=state.budget,within=grand<=budget;
    document.getElementById('budgetVal').textContent=fmt(budget)+' Ft';
    const bS=document.getElementById('budgetState'),bB=document.getElementById('budgetBar'),bH=document.getElementById('budgetHint');
    bB.style.width=Math.min(budget>0?grand/budget:1,1)*100+'%';
    if(within){bS.textContent=t('fitState');bS.style.background='var(--good-soft)';bS.style.color='var(--good)';bB.style.background='var(--good)';bH.style.color='var(--good)';bH.textContent=t('within')+fmt(budget-grand)+t('within2');}
    else{bS.textContent=t('overState');bS.style.background='var(--bad-soft)';bS.style.color='var(--bad)';bB.style.background='var(--bad)';bH.style.color='var(--bad)';bH.textContent=t('over1')+fmt(grand-budget)+t('over2');}

    const pct=Math.round((roomArea>0?furnArea/roomArea:0)*100);
    let label,col,soft;
    if(pct<30){label=t('fillAiry');col='var(--good)';soft='var(--good-soft)';}
    else if(pct<45){label=t('fillComfy');col='var(--good)';soft='var(--good-soft)';}
    else if(pct<60){label=t('fillTight');col='var(--warn)';soft='var(--warn-soft)';}
    else{label=t('fillCrowd');col='var(--bad)';soft='var(--bad-soft)';}
    document.getElementById('fillPct').textContent=t('floorPct')+pct+t('floorPct2');
    const fs=document.getElementById('fillState'); fs.textContent=label; fs.style.background=soft; fs.style.color=col;
    const fb=document.getElementById('fillBar'); fb.style.width=Math.min(pct,100)+'%'; fb.style.background=col;
  }

  function exportOffer(){
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100;
    const styleLabel=STYLE_LABEL[state.style][li()], roomLabel=ROOM_LABEL[state.room][li()];
    const colorName=state.color==='none'?t('exNone'):(state.lang==='hu'?(COLORS.find(c=>c.id===state.color)||{}).name:(COLOR_EN[state.color]||''));
    // B05: ugyanaz a számítás, mint a képernyőn (currentCost) — tételenként a megvásárolandó egységgel
    const cost=lastCost||currentCost(); let rows='', unsure=0;
    cost.lines.filter(l=>l.units).forEach(l=>{
      const mark=l.uncertain||l.total==null?(unsure++,' *'):'';
      const qty=`${l.units} ${unitWord(l.unit)}${l.extra>0?` (${t('exPlanned')} ${l.requested})`:''}`;
      rows+=`<tr><td>${catName(l.id)}</td><td>${l.name}</td><td>${STORE_LABEL[l.store]||l.store.toUpperCase()}</td><td class="r">${qty}</td><td class="r">${l.total!=null?fmt(l.total)+' Ft':t('costNoPrice')}${mark}</td></tr>`; });
    cost.accessories.forEach(a=>{ rows+=`<tr><td>${t('exAcc')}</td><td>${L10N(a.label)}${a.note?` (${a.note})`:''}${a.known?' — '+a.ref.name:''}</td><td>${a.known?STORE_LABEL[a.ref.store]:'—'}</td><td class="r">${a.known?a.units+' '+unitWord(a.unit):a.need}</td><td class="r">${a.known?'≈ '+fmt(a.total)+' Ft':t('shipUnknown')}</td></tr>`; });
    const ship=cost.stores.map(s=>`${STORE_LABEL[s.store]}: ${shipText(s.shipping)}`).join(' · ');
    const open=[...cost.unknown.prices.map(p=>t('openPrice').replace('{name}',p.name)),...cost.unknown.accessories.map(a=>`${L10N(a.label)} — ${a.forName}`),
      ...cost.unknown.shipping.map(s=>`${STORE_LABEL[s.store]}: ${t('openShipping')}`),...cost.extras.map(x=>t('openExtra').replace('{name}',x.name).replace('{n}',x.extra))];
    const T=cost.totals;
    const svg=document.querySelector('#plan svg') ? document.querySelector('#plan').innerHTML : '';
    document.getElementById('printArea').innerHTML=
      `<div class="pa-h">${t('exTitle')}</div>
       <div class="pa-meta">${roomLabel} · ${styleLabel} ${t('exStyle')} · ${L} × ${W} m (${t('belm')} ${H} m) · ${t('exWall')}: ${colorName} · ${t('exDate')}: ${PRICE_DATE} · ${cost.mode==='pickup'?t('modePickup'):t('modeDelivery')}</div>
       <div class="pa-plan">${svg}</div>
       <table><thead><tr><th>${t('exCat')}</th><th>${t('exProd')}</th><th>${t('exStore')}</th><th class="r">${t('exQty')}</th><th class="r">${t('exPrice')}</th></tr></thead><tbody>${rows}</tbody></table>
       <div class="pa-tot">${t('exFurn')}: <b>${fmt(T.products)} Ft</b>${T.accessories?` &nbsp;·&nbsp; ${t('brkAcc')}: <b>≈ ${fmt(T.accessories)} Ft</b>`:''} &nbsp;·&nbsp; ${t('exPaint')}: <b>≈ ${fmt(T.paint)} Ft</b><br>${t('exShipping')}: ${ship||'—'}<br><span class="g">${t('exTotal')}: ${fmt(T.known)} Ft${T.hasUnknown?' '+t('grandPlusUnknown'):''}</span></div>
       ${open.length?`<div class="pa-meta" style="margin-top:10px;"><b>${t('openTitle')}:</b> ${open.join(' · ')}</div>`:''}
       <div class="pa-meta" style="margin-top:14px;">${unsure?t('pcExportNote')+'<br>':''}${t('exNote')}</div>`;
    window.print();
  }

  ['len','wid','hei'].forEach(id=>document.getElementById(id).addEventListener('input',render));
  document.querySelectorAll('.preset').forEach(b=>{ if(b.id==='autofit') return; b.addEventListener('click',()=>{document.getElementById('len').value=b.dataset.l;document.getElementById('wid').value=b.dataset.w;render();}); });
  const bRange=document.getElementById('budgetRange'),bNum=document.getElementById('budgetNum');
  bRange.addEventListener('input',()=>{state.budget=+bRange.value;bNum.value=bRange.value;render();});
  bNum.addEventListener('input',()=>{state.budget=+bNum.value||0;bRange.value=Math.min(Math.max(state.budget,+bRange.min),+bRange.max);render();});
  document.getElementById('autofit').addEventListener('click',autoFit);
  document.getElementById('resetLayout').addEventListener('click',()=>{ const pre=state.room+':'+state.style+':'; [state.pos,state.rot].forEach(o=>Object.keys(o).forEach(k=>{ if(k.startsWith(pre)) delete o[k]; })); state.selBlock=null; render(); });
  document.getElementById('exportBtn').addEventListener('click',exportOffer);
  document.getElementById('exportBtn2').addEventListener('click',exportOffer);

  function shoppingGroups(){
    // B05: a bevásárlólista a megvásárolandó egységeket mutatja (nem a tervezett darabot), kiegészítőkkel és szállítással.
    const cost=lastCost||currentCost(), g={};
    cost.lines.filter(l=>l.units).forEach(l=>{ const it=curItems().find(x=>x.id===l.id)||{};
      (g[l.store]=g[l.store]||[]).push({icon:it.icon||'',url:l.url,name:`${l.name} × ${l.units} ${unitWord(l.unit)}`,quantity:l.units,price:l.total||0,unknown:l.total==null}); });
    cost.accessories.filter(a=>a.known).forEach(a=>{ (g[a.ref.store]=g[a.ref.store]||[]).push({icon:'+',url:a.ref.url,name:`${a.ref.name} × ${a.units} ${unitWord(a.unit)} (${L10N(a.label)})`,quantity:a.units,price:a.total}); });
    const order=STORES;
    return {groups:order.filter(s=>g[s]).map(s=>({store:s,items:g[s],sub:g[s].reduce((a,x)=>a+x.price,0),shipping:(cost.stores.find(x=>x.store===s)||{}).shipping})), grand:cost.totals.known, cost};
  }
  function openShopping(){
    const {groups,grand,cost}=shoppingGroups();
    let html=`<div class="slbox"><div class="slhead"><h3>${t('slTitle')}</h3><button class="slclose" id="slX">✕</button></div>`;
    groups.forEach(gr=>{
      html+=`<div class="slstore"><div class="sst"><span>${storeBadge(gr.store)} <span style="color:var(--muted);font-size:12.5px;">${gr.items.length} ${t('slItems')}</span></span><span class="sub">${fmt(gr.sub)} Ft</span></div>`;
      gr.items.forEach(it=>{ html+=`<div class="slitem"><span class="in">${it.icon} ${escapeHtml(it.name)}</span><span class="ip">${it.unknown?t('costNoPrice'):fmt(it.price)+' Ft'}</span><a href="${it.url}" target="_blank" rel="noopener">${t('slOpen')}</a></div>`; });
      if(gr.shipping) html+=`<div class="slitem sl-ship"><span class="in">${cost.mode==='pickup'?t('modePickup'):t('modeDelivery')}</span><span class="ip">${shipText(gr.shipping)}</span><span></span></div>`;
      html+=`</div>`;
    });
    html+=`<div class="slgrand"><span>${t('slTotal')}</span><span>${fmt(grand)} Ft${cost.totals.hasUnknown?' '+t('grandPlusUnknown'):''}</span></div><div class="slbtns"><button class="pr" id="slPrint">${t('slPrint')}</button><button class="cl" id="slX2">${t('slClose')}</button></div></div>`;
    const ov=document.getElementById('slOverlay'); ov.innerHTML=html; ov.style.display='flex';
    document.getElementById('slX').onclick=closeShopping;
    document.getElementById('slX2').onclick=closeShopping;
    document.getElementById('slPrint').onclick=printShopping;
    ov.onclick=e=>{ if(e.target===ov) closeShopping(); };
  }
  function closeShopping(){ document.getElementById('slOverlay').style.display='none'; }
  function printShopping(){
    const {groups,grand}=shoppingGroups();
    let rows='';
    groups.forEach(gr=>{ rows+=`<tr><td colspan="2" style="padding-top:14px;font-weight:800;border-bottom:none;">${STORE_LABEL[gr.store]} — ${fmt(gr.sub)} Ft</td></tr>`;
      gr.items.forEach(it=>{ rows+=`<tr><td>${it.name}</td><td class="r">${fmt(it.price)} Ft</td></tr>`; }); });
    document.getElementById('printArea').innerHTML=`<div class="pa-h">${t('slTitle')}</div><div class="pa-meta">DREAMR · ${PRICE_DATE}</div><table><tbody>${rows}</tbody></table><div class="pa-tot"><span class="g">${t('slTotal')}: ${fmt(grand)} Ft</span></div>`;
    window.print();
  }
  document.getElementById('shopBtn').addEventListener('click',openShopping);

  // ---- 3D NÉZET ----
  function drawnList(){
    const L=len(),W=wid(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100; const arr=[];
    curItems().forEach(it=>{ const ok=fits(it), on=ok&&!state.off.has(it.id); if(on&&it.plan) arr.push(it); });
    return arr;
  }
  function tvScreen(items){
    if(state.room!=='nappali') return null;
    if(!state.tvPlacement) return null;
    const W=Math.max(len(),wid())*100,H=hei()*100;
    if(state.tvPlacement==='wall') return {cx:W/2,cy:4,w:Math.min(118,W-12),d:5,h:Math.min(68,H/3),bottom:H*0.48,mode:'wall'};
    const stand=items.find(it=>it.productId==='tv');
    if(!stand) return null;
    return {instanceId:stand.instanceId,cx:stand.cx,cy:stand.cy,w:Math.min(118,stand.w),d:5,h:Math.min(68,H-stand.h-6),bottom:stand.h,mode:'stand'};
  }
  // R03: az elrendezés a közös layout.js-ből jön; a 2D-alaprajz, a 3D-nézet, a költség (elhelyezett darabszám)
  // és minden mozgatás ugyanezt az eredményt használja. Gyorsítótár: azonos bemenetre nem számol újra.
  let layoutCache={key:null,val:null};
  function layoutItems(drawn){
    return drawn.map(it=>({id:it.id,plan:it.plan,w:it.w,d:it.d,h:heightOf(it),hKnown:heightOf(it)!=null,wallMounted:wallMountedOf(it),qty:qtyFor(it.id)}));
  }
  function runLayout(L,W,drawn){
    const room=LY.roomBox(L,W,hei()), items=layoutItems(drawn), pre=state.room+':'+state.style+':';
    const pick=o=>Object.fromEntries(Object.entries(o).filter(([k])=>k.startsWith(pre)));
    const key=JSON.stringify([state.room,room,state.door,items,pick(state.pos),pick(state.rot)]);
    if(layoutCache.key===key) return layoutCache.val;
    const r=LY.place({roomType:state.room,room,door:state.door,items,pos:id=>state.pos[keyOf(id)]||null,rot:id=>state.rot[keyOf(id)]??null});
    r.room=room;
    layoutCache={key,val:r};
    return r;
  }
  // a színt a hívás pillanatában adjuk (a szín változása nem érinti az elrendezést)
  function placements3D(L,W,drawn){ return runLayout(L,W,drawn).placed.map(p=>({...p,color:finishFor(drawn.find(x=>x.id===p.productId))})); }
  let R3={};
  function close3D(){ if(R3.stop)R3.stop(); if(R3.dom&&R3.onwheel)R3.dom.removeEventListener('wheel',R3.onwheel); R3={}; document.getElementById('d3Overlay').style.display='none'; }
  function labelFurnitureControls(host){
    host.querySelectorAll('.qty-btn').forEach(b=>{
      const less=+b.dataset.step<0,q=qtyFor(b.dataset.id);
      b.disabled=less?q<=1:q>=8;
      b.setAttribute('aria-label',(state.lang==='hu'?(less?'Kevesebb: ':'Több: '):(less?'Fewer: ':'More: '))+catName(b.dataset.id));
    });
    host.querySelectorAll('.three-d-color').forEach(el=>el.setAttribute('aria-label',catName(el.dataset.id)+(state.lang==='hu'?' színe':' colour')));
  }
  function syncFurnitureViews(){
    render();
    if(document.getElementById('d3Overlay').style.display==='flex'){build3DFurnitureControls();refresh3DScene();}
  }
  function build3DFurnitureControls(){
    const host=document.getElementById('threeDFurnitureControls'); if(!host) return;
    const items=curItems().filter(it=>it.plan);
    host.innerHTML=`<div class="three-d-controls-title">${state.lang==='hu'?'Bútorok színe és darabszáma':'Furniture colour and quantity'}</div>`+
      items.map(it=>{const qty=actualQty(it)+' / '+qtyFor(it.id);return `<div class="three-d-control"><span class="three-d-icon">${it.icon}</span><span class="three-d-name">${catName(it.id)}</span><input type="color" class="three-d-color" aria-label="${catName(it.id)} színe" data-id="${it.id}" value="${finishFor(it)}"><button type="button" class="qty-btn three-d-qty" data-id="${it.id}" data-step="-1">−</button><b>${qty}</b><button type="button" class="qty-btn three-d-qty" data-id="${it.id}" data-step="1">+</button></div>`;}).join('');
    labelFurnitureControls(host);
    host.querySelectorAll('.three-d-color').forEach(input=>input.addEventListener('change',()=>{state.itemColors[input.dataset.id]=input.value;syncFurnitureViews();}));
    host.querySelectorAll('.three-d-qty').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.id;state.quantity[id]=Math.max(1,Math.min(8,qtyFor(id)+(+button.dataset.step)));syncFurnitureViews();}));
  }
  function refresh3DScene(){
    const cont=document.getElementById('d3canvas'); if(!cont) return;
    const view=window.HV3D?.getView?.();
    if(R3.stop) R3.stop();
    cont.querySelectorAll('canvas').forEach(canvas=>canvas.remove());
    R3={}; init3D(view);
  }
  function tvInstruction(){
    const screen=tvScreen(placements3D(len(),wid(),drawnList()));
    if(!screen) return 'No television is present. Do not add a screen or TV stand.';
    return screen.mode==='wall'?'The television is attached to the wall. Do not put a television on a cabinet.':'The television rests directly on the placed TV cabinet. Keep it on that cabinet; do not mount it on the wall.';
  }
  function open3D(){
    const ov=document.getElementById('d3Overlay');
    ov.innerHTML=`<div class="slbox" style="max-width:760px;"><div class="slhead"><h3>${t('d3Title')}</h3><button class="slclose" id="d3X">✕</button></div><div id="d3canvas" style="width:100%;height:440px;border-radius:14px;overflow:hidden;background:${document.body.classList.contains('dark')?'#12151b':'#eef1f5'};touch-action:none;"></div><div style="font-size:12.5px;color:var(--muted);margin-top:10px;">${t('d3Hint')}</div><div id="threeDFurnitureControls"></div><div id="d3MoveStatus" role="status" aria-live="polite"></div><div id="aiResult"></div><div class="slbtns">${(window.HVCloud&&window.HVCloud.enabled)?`<button class="pr" id="aiBtn">${t('aiBtn')}</button>`:''}<button class="cl" id="d3X2">${t('slClose')}</button></div></div>`;
    ov.style.display='flex';
    document.getElementById('d3X').onclick=close3D; document.getElementById('d3X2').onclick=close3D;
    ov.onclick=e=>{ if(e.target===ov) close3D(); };
    build3DFurnitureControls();
    const ab=document.getElementById('aiBtn');
    if(ab) ab.onclick=async()=>{
      if(!window.HVCloud.getUser()){ alert(t('aiLogin')); return; }
      if(!window.HV3D||!window.HV3D.snapshot){ alert(t('d3NoLib')); return; }
      ab.disabled=true; ab.textContent=t('aiWorking');
      try{
        // A 3D nézet aktuális képe + angol prompt a beállításokból
        await window.HV3D.ready; if(!ab.isConnected) return;
        const img=window.HV3D.snapshot();
        const prompt=`Turn this 3D room render into a photorealistic interior design photograph of a ${STYLE_LABEL[state.style][1]} style ${ROOM_LABEL[state.room][1].toLowerCase()}. Keep the exact same camera angle, room shape, wall and floor layout, and keep every piece of furniture in exactly the same position, size and proportion. Do not add, remove, move or resize any object. Walls colour ${wallHex()}. ${tvInstruction()} Furniture finishes and all instance counts must match the source. Realistic materials, soft natural daylight, sharp details, high quality.`;
        const res=await window.HVCloud.aiRender(img,prompt);
        if(res&&res.url){
          document.getElementById('aiResult').innerHTML=`<img src="${res.url}" style="width:100%;border-radius:14px;margin-top:12px;" alt="AI render">`+(res.remaining!=null?`<div style="font-size:12px;color:var(--muted);margin-top:6px;">${t('aiLeft')} ${res.remaining}</div>`:'');
        }
        else if(res&&res.error==='limit') alert(t('aiLimit'));
        else if(res&&res.error==='auth') alert(t('aiLogin'));
        else alert(t('aiErr')+(res&&res.error?' ['+res.error+(res.detail?': '+String(res.detail).slice(0,300):'')+']':''));
      }catch(e){ alert(t('aiErr')+' ['+e+']'); }
      ab.disabled=false; ab.textContent=t('aiBtn');
    };
    init3D();
    const container=document.getElementById('d3canvas');
    container.style.position='relative';
    const transition=document.createElement('div');
    transition.className='dreamr-transition';
    const preview=document.querySelector('svg.plan').cloneNode(true);
    preview.querySelectorAll('[data-drag]').forEach(g=>g.removeAttribute('data-drag'));
    transition.innerHTML='<div class="transition-plan"></div><div class="transition-brand">DREAM<span>R</span></div><div class="transition-caption"></div><div class="transition-progress"><i></i></div>';
    transition.querySelector('.transition-plan').appendChild(preview);
    transition.querySelector('.transition-caption').textContent=t('transitionCaption');
    container.appendChild(transition);
    if(ab) ab.disabled=true;
    const ready=window.HV3D ? window.HV3D.ready : Promise.resolve();
    Promise.all([ready,new Promise(resolve=>setTimeout(resolve,720))]).then(()=>{
      transition.classList.add('is-leaving');setTimeout(()=>transition.remove(),520);
      if(ab) ab.disabled=false;
    });
  }
  function init3D(view){
    const cont=document.getElementById('d3canvas');
    // Ha a Three.js modul betöltött (viewer3d.js), a valódi 3D nézetet használjuk.
    // Ha nem (pl. nincs internet), automatikusan a régi, beépített canvas-nézet fut.
    if(window.HV3D){
      const L=len(),Wd=wid(),Hh=hei();
      const dispose=window.HV3D.mount(cont,{ view, roomW:Math.max(L,Wd), roomD:Math.min(L,Wd), roomH:Hh,
        wallColor:wallHex(), floorColor:'#cbb48d', items:placements3D(L,Wd,drawnList()), tvScreen:tvScreen(placements3D(L,Wd,drawnList())), onMove:commitPlacement, canMove:(id,cx,cy)=>canPlace(id,cx,cy), onBlocked:()=>{ const m=blockText(lastBlock); document.getElementById('layoutStatus').textContent=m; document.getElementById('d3MoveStatus').textContent=m; } });
      R3={stop:dispose};
      return;
    }
    const Wc=cont.clientWidth||700, Hc=cont.clientHeight||440, dpr=Math.min(window.devicePixelRatio||1,2);
    const cv=document.createElement('canvas'); cv.width=Wc*dpr; cv.height=Hc*dpr; cv.style.width='100%'; cv.style.height='100%'; cv.style.cursor='grab'; cont.appendChild(cv);
    const ctx=cv.getContext('2d'); ctx.scale(dpr,dpr);
    const L=len(),Wd=wid(),Hh=hei(); const RW=Math.max(L,Wd), RD=Math.min(L,Wd);
    const wallHexV=wallHex();
    const boxes=[];
    placements3D(L,Wd,drawnList()).forEach(b=>{ const X=(b.cx-(RW*100)/2)/100, Z=(b.cy-(RD*100)/2)/100, w=b.w/100, d=b.d/100, h=Math.max(b.h,2)/100;
      boxes.push({min:[X-w/2,0,Z-d/2],max:[X+w/2,h,Z+d/2],color:b.color}); });
    const target=[0,Hh*0.35,0];
    let theta=Math.PI*0.72, phi=Math.PI*0.36, radius=Math.max(RW,RD)*1.7+2.5;
    const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
    const shade=(hex,f)=>{ hex=hex.replace('#',''); let r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16); return 'rgb('+Math.min(255,r*f|0)+','+Math.min(255,g*f|0)+','+Math.min(255,b*f|0)+')'; };
    function draw(){
      const cam=[target[0]+radius*Math.sin(phi)*Math.cos(theta),target[1]+radius*Math.cos(phi),target[2]+radius*Math.sin(phi)*Math.sin(theta)];
      const fwd=nrm(sub(target,cam)), right=nrm(cross(fwd,[0,1,0])), up=cross(right,fwd), foc=Hc*1.05;
      const proj=p=>{ const r=sub(p,cam), cz=dot(r,fwd); if(cz<=0.05)return null; return [Wc/2+foc*dot(r,right)/cz, Hc/2-foc*dot(r,up)/cz, cz]; };
      const faces=[];
      const quad=(A,B,C,D,color,cull,n)=>{ if(cull){ const c=[(A[0]+C[0])/2,(A[1]+C[1])/2,(A[2]+C[2])/2]; if(dot(n,sub(cam,c))<=0)return; } const q=[proj(A),proj(B),proj(C),proj(D)]; if(q.some(x=>!x))return; faces.push({pts:q,depth:(q[0][2]+q[1][2]+q[2][2]+q[3][2])/4,fill:color}); };
      quad([-RW/2,0,-RD/2],[RW/2,0,-RD/2],[RW/2,0,RD/2],[-RW/2,0,RD/2],shade('#cbb48d',1.0),false,null); // padló
      if(cam[2]>-RD/2) quad([-RW/2,0,-RD/2],[RW/2,0,-RD/2],[RW/2,Hh,-RD/2],[-RW/2,Hh,-RD/2],shade(wallHexV,0.9),false,null);
      if(cam[2]< RD/2) quad([-RW/2,0,RD/2],[RW/2,0,RD/2],[RW/2,Hh,RD/2],[-RW/2,Hh,RD/2],shade(wallHexV,1.0),false,null);
      if(cam[0]>-RW/2) quad([-RW/2,0,-RD/2],[-RW/2,0,RD/2],[-RW/2,Hh,RD/2],[-RW/2,Hh,-RD/2],shade(wallHexV,0.85),false,null);
      if(cam[0]< RW/2) quad([RW/2,0,-RD/2],[RW/2,0,RD/2],[RW/2,Hh,RD/2],[RW/2,Hh,-RD/2],shade(wallHexV,0.95),false,null);
      boxes.forEach(bx=>{ const a=bx.min,b=bx.max,C=bx.color;
        const c0=[a[0],a[1],a[2]],c1=[b[0],a[1],a[2]],c2=[b[0],a[1],b[2]],c3=[a[0],a[1],b[2]],c4=[a[0],b[1],a[2]],c5=[b[0],b[1],a[2]],c6=[b[0],b[1],b[2]],c7=[a[0],b[1],b[2]];
        quad(c4,c5,c6,c7,shade(C,1.18),true,[0,1,0]); quad(c3,c2,c6,c7,shade(C,0.95),true,[0,0,1]); quad(c0,c1,c5,c4,shade(C,0.8),true,[0,0,-1]); quad(c1,c2,c6,c5,shade(C,0.9),true,[1,0,0]); quad(c0,c3,c7,c4,shade(C,0.72),true,[-1,0,0]); });
      faces.sort((A,B)=>B.depth-A.depth);
      ctx.clearRect(0,0,Wc,Hc);
      faces.forEach(f=>{ ctx.beginPath(); ctx.moveTo(f.pts[0][0],f.pts[0][1]); for(let i=1;i<4;i++)ctx.lineTo(f.pts[i][0],f.pts[i][1]); ctx.closePath(); ctx.fillStyle=f.fill; ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.08)'; ctx.lineWidth=0.6; ctx.stroke(); });
    }
    let drag=false,px=0,py=0;
    cv.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing';});
    cv.addEventListener('pointermove',e=>{ if(!drag)return; theta-=(e.clientX-px)*0.01; phi=Math.max(0.12,Math.min(1.45,phi-(e.clientY-py)*0.01)); px=e.clientX;py=e.clientY; draw(); });
    cv.addEventListener('pointerup',()=>{drag=false;cv.style.cursor='grab';}); cv.addEventListener('pointercancel',()=>{drag=false;});
    cv.addEventListener('wheel',e=>{ e.preventDefault(); radius=Math.max(1.6,Math.min(45,radius+e.deltaY*0.01)); draw(); },{passive:false});
    R3={stop:()=>{}}; draw();
  }
  document.getElementById('view3dBtn').addEventListener('click',open3D);

  // ---- HÁZAM (mentett szobák) ----
  const LSKEY='homevision_house_v1';
  function loadHouse(){ try{ const s=localStorage.getItem(LSKEY); if(s) state.house=JSON.parse(s)||[]; }catch(e){} }
  function saveHouse(){ try{ localStorage.setItem(LSKEY, JSON.stringify(state.house)); }catch(e){} if(window.HVCloud&&window.HVCloud.enabled) window.HVCloud.scheduleSave(state.house); }
  function currentSnapshot(){
    // B05: a mentés ugyanabból a számításból készül, és árpillanatképet is őriz (mikor, mennyi, milyen egységárral).
    const L=len(),W=wid(),H=hei(), cost=lastCost||currentCost(), items=[];
    cost.lines.filter(l=>l.units).forEach(l=>{ const it=curItems().find(x=>x.id===l.id)||{};
      items.push({cat:catName(l.id),name:`${l.name} × ${l.units} ${unitWord(l.unit)}`,store:l.store,price:l.total||0,quantity:l.units,color:finishFor(it),url:l.url}); });
    cost.accessories.filter(a=>a.known).forEach(a=>items.push({cat:L10N(a.label),name:`${a.ref.name} × ${a.units} ${unitWord(a.unit)}`,store:a.ref.store,price:a.total,quantity:a.units,url:a.ref.url}));
    return {items,furn:cost.totals.products,paint:cost.totals.paint,grand:cost.totals.known,hasUnknown:cost.totals.hasUnknown,priceSnap:DRPricing.snapshot(cost),L,W,H};
  }
  function saveRoom(){
    const snap=currentSnapshot(), label=ROOM_LABEL[state.room][li()];
    const n=state.house.filter(r=>r.roomId===state.room).length, name=label+(n>0?(' '+(n+1)):'');
    // C06: verziózott rekord (helyi és felhős mentés egyaránt); a config maga dreamr-plan/2
    state.house.push({ format:'dreamr-room/2', id:'h'+Date.now()+Math.random().toString(36).slice(2,6), name, roomId:state.room, styleLabel:STYLE_LABEL[state.style][li()], sizeStr:snap.L+'×'+snap.W+' m', total:snap.grand, hasUnknown:snap.hasUnknown, items:snap.items, priceSnap:snap.priceSnap,
      config:currentConfig() });
    saveHouse(); openHouse();
  }
  // C06: a mentett / megosztott terv betöltéskor a jelenlegi formátumra vezetődik át (DRCatalog.migratePlan).
  // A régi sorszámok a rögzített régi sorrendből azonosítóra fordulnak; ami már nem létezik, arról üzenet szól.
  let restoreNotes=[];
  function migrateConfig(c){
    const m=CAT.migratePlan(c);
    // azonosító, ami létezik, de ebben a szobában már nem választható → szintén jelezzük
    getSlotsFor(m.config.room,m.config.style).forEach(slot=>{ const k=m.config.room+":"+m.config.style+":"+slot.id, v=m.config.sel[k];
      // R06: a keresésből választott, azonos kategóriájú termék is érvényes választás
      if(v&&!slot.options.some(o=>o.vid===v)&&!(CAT.variant(v)&&CAT.variant(v).category===slot.category)){ m.notes.push({key:k,slot:slot.id,code:"notInRoom",was:v}); delete m.config.sel[k]; } });
    return m;
  }
  function loadRoom(r){ const c=r.config; document.getElementById('len').value=c.len; document.getElementById('wid').value=c.wid; document.getElementById('hei').value=c.hei; state.room=c.room; state.style=c.style; state.color=c.color; state.budget=c.budget; state.tvPlacement=c.tvPlacement==='wall'?'wall':'stand'; state.quantity=JSON.parse(JSON.stringify(c.quantity||{})); state.itemColors=JSON.parse(JSON.stringify(c.itemColors||{})); document.getElementById('budgetNum').value=c.budget; document.getElementById('budgetRange').value=Math.min(Math.max(c.budget,100000),1200000); const mig=migrateConfig(c); restoreNotes=mig.notes; state.sel=JSON.parse(JSON.stringify(mig.config.sel)); state.replaced=JSON.parse(JSON.stringify(c.replaced||{})); if(c.fulfillment==='pickup'||c.fulfillment==='delivery') state.fulfillment=c.fulfillment; state.zone=c.zone==='A'||c.zone==='B'?c.zone:state.zone; state.compareSnap=r.priceSnap||c.snap||null; state.off=new Set(c.off||[]); state.pos=JSON.parse(JSON.stringify(c.pos||{}));
    // 5. szakasz (opcionális mezők — régebbi mentésben hiányoznak, akkor alapérték)
    state.rot=JSON.parse(JSON.stringify(c.rot||{})); state.locked=new Set(c.locked||[]); state.door={...LY.DOOR_DEFAULT,...(c.door||{})}; state.picked=JSON.parse(JSON.stringify(c.picked||{})); state.budgetLog=null; state.selBlock=null;
    closeHouse(); render(); }
  function closeHouse(){ document.getElementById('houseOverlay').style.display='none'; }
  function printHouseShopping(){
    const g={}; let grand=0; const order=STORES;
    state.house.forEach(r=>r.items.forEach(it=>{ grand+=it.price; (g[it.store]=g[it.store]||[]).push(it); }));
    let rows=''; order.filter(s=>g[s]).forEach(s=>{ const sub=g[s].reduce((a,x)=>a+x.price,0); rows+=`<tr><td colspan="2" style="padding-top:14px;font-weight:800;border-bottom:none;">${STORE_LABEL[s]} — ${fmt(sub)} Ft</td></tr>`; g[s].forEach(it=>{ rows+=`<tr><td>${it.name}</td><td class="r">${fmt(it.price)} Ft</td></tr>`; }); });
    document.getElementById('printArea').innerHTML=`<div class="pa-h">${t('houseTitle')} — ${t('slTitle')}</div><div class="pa-meta">DREAMR · ${PRICE_DATE}</div><table><tbody>${rows}</tbody></table><div class="pa-tot"><span class="g">${t('slTotal')}: ${fmt(grand)} Ft</span></div>`;
    window.print();
  }
  function openHouse(){
    const ov=document.getElementById('houseOverlay'); let rows='';
    if(!state.house.length){ rows=`<div style="color:var(--muted);padding:14px 2px;font-size:14px;">${t('houseEmpty')}</div>`; }
    else state.house.forEach(r=>{ rows+=`<div class="slstore"><div class="sst"><input class="hname" data-id="${r.id}" value="${(r.name||'').replace(/"/g,'&quot;')}"><span class="sub">${fmt(r.total)} Ft</span></div><div style="font-size:12.5px;color:var(--muted);margin-bottom:10px;">${ROOM_LABEL[r.roomId]?ROOM_LABEL[r.roomId][li()]:r.roomId} · ${r.styleLabel} · ${r.sizeStr} · ${r.items.length} ${t('slItems')}</div><div class="slbtns" style="margin-top:0;"><button class="pr" data-load="${r.id}">${t('load')}</button><button class="cl" data-del="${r.id}">${t('del')}</button></div></div>`; });
    const grand=state.house.reduce((a,r)=>a+r.total,0);
    let html=`<div class="slbox"><div class="slhead"><h3>${t('houseTitle')}</h3><button class="slclose" id="hX">✕</button></div>${rows}`;
    if(state.house.length) html+=`<div class="slgrand"><span>${t('houseTotal')}</span><span>${fmt(grand)} Ft</span></div>`;
    html+=`<div class="slbtns"><button class="pr" id="hSave">${t('saveRoomBtn')}</button>${state.house.length?`<button class="cl" id="hShop">${t('houseShop')}</button>`:''}<button class="cl" id="hX2">${t('slClose')}</button></div></div>`;
    ov.innerHTML=html; ov.style.display='flex';
    ov.querySelector('#hX').onclick=closeHouse; ov.querySelector('#hX2').onclick=closeHouse; ov.onclick=e=>{ if(e.target===ov) closeHouse(); };
    ov.querySelector('#hSave').onclick=saveRoom; const sh=ov.querySelector('#hShop'); if(sh) sh.onclick=printHouseShopping;
    ov.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{ const r=state.house.find(x=>x.id===b.dataset.load); if(r) loadRoom(r); });
    ov.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ state.house=state.house.filter(x=>x.id!==b.dataset.del); saveHouse(); openHouse(); });
    ov.querySelectorAll('.hname').forEach(inp=>inp.onchange=()=>{ const r=state.house.find(x=>x.id===inp.dataset.id); if(r){ r.name=inp.value; saveHouse(); } });
    const hb=document.getElementById('houseBtn'); if(hb) hb.textContent=t('houseBtn')+' ('+state.house.length+')';
  }
  document.getElementById('saveRoomBtn').addEventListener('click',saveRoom);
  document.getElementById('houseBtn').addEventListener('click',openHouse);

  // ---- MEGOSZTHATÓ LINK (a szoba állapota a URL #c= részébe kódolva) ----
  function currentConfig(){
    // Egy formátum mentéshez és megosztáshoz; a cserék története (A05) is benne van.
    // C06: verziózott formátum (dreamr-plan/2) — minden tétel változatazonosítóval rögzítve.
    const sel=JSON.parse(JSON.stringify(state.sel));
    getSlots().forEach(slot=>{ const i=selIndex(slot.id); if(i>=0) sel[keyOf(slot.id)]=slot.options[i].vid; });
    return {format:'dreamr-plan/2',room:state.room,style:state.style,len:len(),wid:wid(),hei:hei(),color:state.color,budget:state.budget,tvPlacement:state.tvPlacement,
      fulfillment:state.fulfillment,zone:state.zone,
      quantity:{...state.quantity},itemColors:{...state.itemColors},sel,replaced:JSON.parse(JSON.stringify(state.replaced)),off:[...state.off],pos:JSON.parse(JSON.stringify(state.pos)),
      rot:JSON.parse(JSON.stringify(state.rot)),locked:[...state.locked],door:{...state.door},picked:JSON.parse(JSON.stringify(state.picked))};
  }
  function makeShareLink(){
    // A megosztott terv a konfigurációt és egy rövid árpillanatképet visz (URL nélkül, tétel-azonosítóval),
    // így a címzettnél is látszik, ha azóta változott az ár (B05).
    const snap=DRPricing.snapshot(lastCost||currentCost()); snap.lines=snap.lines.map(({url,...l})=>l);
    const encoded=LZString.compressToEncodedURIComponent(JSON.stringify({...currentConfig(),snap}));
    return location.origin+location.pathname+'#c='+encoded;
  }
  function shareRoom(){
    if(typeof LZString==='undefined'){ alert(t('d3NoLib')); return; } // CDN nem töltött be (nincs net)
    const link=makeShareLink(), btn=document.getElementById('shareBtn');
    const done=()=>{ btn.textContent=t('shareCopied'); setTimeout(()=>{ btn.textContent=t('shareBtn'); },1800); };
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done,()=>prompt(t('shareFail'),link));
    else prompt(t('shareFail'),link); // régi böngésző: kézzel másolható ablak
  }
  function loadFromHash(){
    const m=location.hash.match(/^#c=(.+)$/); if(!m||typeof LZString==='undefined') return;
    try{
      const c=JSON.parse(LZString.decompressFromEncodedURIComponent(m[1]));
      if(c&&c.room&&c.style) loadRoom({config:c}); // a meglévő betöltő újrahasznosítva
      else throw new Error('hiányos terv');
    }catch(e){ console.warn('DREAMR megosztott link:',e); restoreNotes=[{code:'brokenLink'}]; } // C06: érthető üzenet, az app alaphelyzetből indul
  }
  const heroCompare=document.getElementById('heroCompare');
  heroCompare.addEventListener('input',()=>{
    document.querySelector('.dreamr-hero-visual').style.setProperty('--compare-position',heroCompare.value+'%');
  });

  document.getElementById('shareBtn').addEventListener('click',shareRoom);

  // Felhasználói belépéskor (űrlap vagy vendég) a belépőből átmeneti animáció vezet a tervezőbe.
  let celebrateFrom=null,entering=false;
  function enterPlanner(){
    if(entering) return;
    const origin=celebrateFrom; celebrateFrom=null;
    if(origin&&document.body.classList.contains('welcome-mode')){
      entering=true;
      const submit=document.getElementById('aGo');
      if(origin.button===submit) M.buttonDone(submit);
      const r=origin.button.getBoundingClientRect();
      setTimeout(()=>M.playEnter({
        origin:{x:r.left+r.width/2,y:r.top+r.height/2},
        kicker:t('enterKicker'),title:t('enterTitle'),titleAlt:t('enterTitleAlt'),
        onSwap:()=>{ entering=false; showPlanner(); window.scrollTo(0,0); }
      }),origin.button===submit&&!M.reduced()?650:0);
      return;
    }
    showPlanner();
  }
  function showPlanner(){
    document.body.classList.remove('welcome-mode');
    document.getElementById('welcomePage').hidden=true;
    document.getElementById('welcomeAuth').innerHTML='';
    document.getElementById('authOverlay').style.display='none';
    document.getElementById('authOverlay').innerHTML='';
    render();
    if(!M.reduced()){ document.body.classList.add('dr-intro'); setTimeout(()=>document.body.classList.remove('dr-intro'),2400); }
  }
  function showWelcome(){
    guestMode=false;
    close3D();closeHouse();
    document.getElementById('authOverlay').style.display='none';
    document.getElementById('authOverlay').innerHTML='';
    document.body.classList.add('welcome-mode');
    document.getElementById('welcomePage').hidden=false;
    render();
  }
  document.getElementById('guestBtn').onclick=e=>{guestMode=true;celebrateFrom={button:e.currentTarget};enterPlanner();};
  document.getElementById('welcomeLang').onclick=()=>{
    state.lang=state.lang==='hu'?'en':'hu';render();
    document.getElementById('welcomeLang').textContent=state.lang==='hu'?'EN':'HU';
    if(window.HVCloud?.showWelcomeAuth) window.HVCloud.showWelcomeAuth();
  };
  // ---- FIÓK + FELHŐ-MENTÉS (Supabase, lásd cloud.js) ----
  // Ha a cloud.js nincs konfigurálva, a gomb rejtve marad, minden megy localStorage-ból.
  if(window.HVCloud&&window.HVCloud.enabled){
    const accBtn=document.getElementById('accountBtn');
    accBtn.style.display='';
    accBtn.addEventListener('click',async()=>{
      const u=window.HVCloud.getUser();
      if(!u){ openAuth(); }
      else{
        const nm=(u.user_metadata&&(u.user_metadata.full_name||u.user_metadata.name))||'';
        if(confirm(t('accSignedIn')+' '+(nm?nm+' · ':'')+u.email+'\n\n'+t('accSignOut')+'?')){
          try{await window.HVCloud.signOut();}catch(error){window.HVCloud.onError(error);}
        }
      }
    });
    // Minimal, luxus stílusú belépő ablak: Google, jelszó+regisztráció, vagy e-mailes link
    function openAuth(embedded=false){
      const ov=document.getElementById(embedded?'welcomeAuth':'authOverlay'); let mode='in',prevMode='in';
      const draw=()=>{
        const reg=mode==='up';
        // A váltó kijelölése az előző állásból csúszik át az újba.
        ov.innerHTML=`<div class="authbox${reg?' is-reg':''}">${embedded?'':'<button class="aclose" id="aX" type="button" aria-label="Close">✕</button>'}
          <div class="abrand">DREAMR</div>
          <div class="aseg" data-mode="${prevMode}" role="group"><span class="aseg-ind"></span><button type="button" data-m="in" aria-pressed="${!reg}">${t('signInTab')}</button><button type="button" data-m="up" aria-pressed="${reg}">${t('signUpTab')}</button></div>
          <h2>${reg?t('authCreate'):t('authWelcome')}</h2>
          <div class="asub">${reg?t('authCreateSub'):t('authSub')}</div>
          ${window.HVCloud.google?`<button class="agoogle" id="aG">`:`<button class="agoogle" id="aG" style="display:none">`}<svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.4-5.7c-2 1.4-4.7 2.3-7.8 2.3-6.3 0-11.7-4-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>${t('authGoogle')}</button>
          ${window.HVCloud.google?`<div class="aor">${t('authOr')}</div>`:''}
          <form id="authForm">
          ${reg?`<input id="aName" type="text" aria-label="${t('authName')}" placeholder="${t('authName')}" autocomplete="name">`:''}
          <input id="aMail" type="email" name="email" aria-label="${t('authEmail')}" placeholder="${t('authEmail')}" autocomplete="username" required>
          <input id="aPass" type="password" name="password" aria-label="${t('authPass')}" placeholder="${t('authPass')}" autocomplete="${reg?'new-password':'current-password'}" required>
          <button class="asubmit dr-shine dr-ripple" id="aGo" type="submit"><span class="asubmit-label">${reg?t('authSignUp'):t('authSignIn')}</span></button>
          </form>
          <p class="auth-remember">${t('authRemember')}</p>
          <div class="amsg" id="aMsg" role="status" aria-live="polite"></div>
          ${reg?'':`<button type="button" class="amagic" id="aMagic">${t('authMagic')}</button>`}
          <div class="aswitch">${reg?t('authHave'):t('authNew')} <button type="button" id="aSw">${reg?t('authSignIn'):t('authSignUp')}</button></div></div>`;
        if(!embedded) ov.style.display='flex';
        const msg=(m,ok)=>{ const e=document.getElementById('aMsg'); e.textContent=m||''; e.className='amsg'+(ok?' ok':''); };
        const close=()=>{
          if(embedded){enterPlanner();return;}
          ov.style.display='none';ov.innerHTML='';
          document.getElementById('accountBtn').focus();
        };
        const x=document.getElementById('aX');
        if(x) x.onclick=close;
        if(!embedded) ov.onclick=e=>{ if(e.target===ov) close(); };
        const switchTo=m=>{ if(m===mode) return; prevMode=mode; mode=m; draw(); };
        document.getElementById('aSw').onclick=()=>switchTo(reg?'in':'up');
        ov.querySelectorAll('.aseg button').forEach(b=>b.onclick=()=>switchTo(b.dataset.m));
        const seg=ov.querySelector('.aseg'); requestAnimationFrame(()=>{ seg.dataset.mode=mode; prevMode=mode; });
        const run=async(action,useSubmit)=>{
          const buttons=[...ov.querySelectorAll('button')],submit=document.getElementById('aGo');
          buttons.forEach(b=>b.disabled=true);msg('');
          if(useSubmit){ M.buttonBusy(submit,true); celebrateFrom={button:submit}; }
          try{await action();}catch(error){console.error('DREAMR sign-in:',error);if(ov.querySelector('#aMsg')) msg(error.message||t('authNetwork'));}
          finally{
            buttons.forEach(b=>b.disabled=false);M.buttonBusy(submit,false);
            // Ha nem történt belépés (hiba vagy megerősítésre vár), nincs ünneplés.
            if(!entering) celebrateFrom=null;
          }
        };
        document.getElementById('aG').onclick=()=>run(async()=>{ const err=await window.HVCloud.signInGoogle(); if(err) msg(err); });
        document.getElementById('authForm').onsubmit=e=>{
          e.preventDefault();
          return run(async()=>{
          const email=document.getElementById('aMail').value.trim(), pass=document.getElementById('aPass').value;
          if(!email||!pass){ msg(t('authFill')); return; }
          if(reg){
            if(pass.length<6){ msg(t('authShort')); return; }
            const r=await window.HVCloud.signUp(email,pass,document.getElementById('aName').value.trim());
            if(r.error) msg(r.error); else if(r.needsConfirm) msg(t('authConfirm'),true); else close();
          } else {
            const err=await window.HVCloud.signInPassword(email,pass);
            if(err) msg(err); else close();
          }
          },true);
        };
        const mg=document.getElementById('aMagic');
        if(mg) mg.onclick=()=>run(async()=>{
          const input=document.getElementById('aMail'),email=input.value.trim();
          if(!email){msg(t('authEmailRequired'));return;}
          if(!input.reportValidity()) return;
          const err=await window.HVCloud.signIn(email); if(err) msg(err); else msg(t('authDelivery'),true);
        });
      };
      draw();
    }
    // Bejelentkezéskor: felhő és helyi mentések összefésülése
    let lastUserId;
    window.HVCloud.onError=error=>{
      const text=(state.lang==='hu'?'Fiók / felhő hiba: ':'Account / cloud error: ')+(error.message||t('authNetwork'));
      document.getElementById('welcomeStatus').textContent=text;
      document.getElementById('layoutStatus').textContent=text;
    };
    window.HVCloud.showWelcomeAuth=()=>openAuth(true);
    window.HVCloud.onAuthChange=async(u)=>{
      const name=u?.user_metadata?.full_name||u?.user_metadata?.name||'';
      accBtn.classList.toggle('is-signed',!!u);
      accBtn.title=u?(t('accSignedIn')+' '+(name?name+' · ':'')+u.email):t('authSignIn');
      const id=u?u.id:null;
      if(id===lastUserId) return;
      const previous=lastUserId;lastUserId=id;
      if(u) enterPlanner();
      else if(previous){showWelcome();openAuth(true);}
      if(!u) return;
      const cloud=await window.HVCloud.fetchHouse();
      if(window.HVCloud.getUser()?.id!==u.id) return;
      if(cloud===null&&state.house.length){
        // Még nincs felhő-mentés, de van helyi: felajánljuk a feltöltést
        if(confirm(t('accUpload').replace('{n}',state.house.length))) await window.HVCloud.pushHouse(state.house);
      } else if(cloud&&cloud.length){
        // Összefésülés id szerint: ami csak helyben van, megmarad — semmi sem vész el
        const ids=new Set(cloud.map(r=>r.id));
        state.house=[...cloud,...state.house.filter(r=>!ids.has(r.id))];
        saveHouse();
        const hb=document.getElementById('houseBtn'); if(hb) hb.textContent=t('houseBtn')+' ('+state.house.length+')';
      }
    };
    window.HVCloud.ready.then(u=>{
      const notification=window.HVCloud.onAuthChange(u);
      if(!u&&!guestMode) openAuth(true);
      return notification;
    }).catch(error=>{
      window.HVCloud.onError(error);
      if(document.body.classList.contains('welcome-mode')&&!document.querySelector('#welcomeAuth #aMail')) openAuth(true);
    });
  }else{
    document.getElementById('welcomeAuth').innerHTML=`<p role="status" data-i18n="authUnavailable">${t('authUnavailable')}</p>`;
  }

  function updateTVUI(){
    const ov=document.getElementById('tvPlacementOverlay');
    const labels=['BEFORE PLANNING','Where should the TV go?','Used in the 2D, 3D and AI plan.','On a TV stand','On the first placed TV cabinet.','Wall mounted','The cabinet is optional.'];
    const nodes=ov.querySelectorAll('.section-label,h2,p:not(.section-label),button b,button small');
    nodes.forEach((n,i)=>{if(!n.dataset.hu) n.dataset.hu=n.textContent;n.textContent=state.lang==='hu'?n.dataset.hu:labels[i];});
    const needsChoice=!document.body.classList.contains('welcome-mode')&&state.room==='nappali'&&!state.tvPlacement;
    ov.style.display=needsChoice?'flex':'none'; if(needsChoice) ov.querySelector('button').focus();
    document.querySelectorAll('.nav,.wrap').forEach(el=>el.inert=needsChoice);
    const btn=document.getElementById('tvPlacementBtn');
    btn.hidden=state.room!=='nappali';
    btn.textContent=state.lang==='hu'
      ? ('TV: '+(state.tvPlacement==='wall'?'falon':'bútoron'))
      : ('TV: '+(state.tvPlacement==='wall'?'wall':'stand'));
  }
  document.querySelectorAll('[data-tv-placement]').forEach(b=>b.onclick=()=>{state.tvPlacement=b.dataset.tvPlacement;render();document.getElementById('tvPlacementBtn').focus();});
  document.getElementById('tvPlacementBtn').onclick=()=>{document.getElementById('tvPlacementOverlay').style.display='flex';document.querySelectorAll('.nav,.wrap').forEach(el=>el.inert=true);document.querySelector('[data-tv-placement]').focus();};
  document.getElementById('tvPlacementOverlay').addEventListener('keydown',e=>{
    if(e.key!=='Tab') return;e.preventDefault();
    const bs=[...document.querySelectorAll('[data-tv-placement]')];
    bs[(bs.indexOf(document.activeElement)+1)%bs.length].focus();
  });
  loadHouse();
  loadFromHash();
  // Világos (krém-arany) az alap, a sötét luxus a sötét mód; a választás megmarad ezen a böngészőn.
  const MOON='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  const SUN='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
  function applyTheme(dark){
    document.body.classList.toggle('dark',dark);
    const b=document.getElementById('themeBtn'); b.innerHTML=dark?SUN:MOON; b.setAttribute('aria-label',dark?'Világos mód':'Sötét mód');
  }
  try{ applyTheme(localStorage.getItem('dreamr-theme')==='dark'); }catch(e){ applyTheme(false); }
  document.getElementById('themeBtn').addEventListener('click',()=>{
    const dark=!document.body.classList.contains('dark');
    applyTheme(dark);
    try{ localStorage.setItem('dreamr-theme',dark?'dark':'light'); }catch(e){}
  });
  document.getElementById('navBagBtn').addEventListener('click',openShopping);
  // B02/B04: teljesítési mód és IKEA díjzóna — a választás megmarad ezen a böngészőn
  try{ const m=localStorage.getItem('dreamr-fulfillment'); if(m==='pickup'||m==='delivery') state.fulfillment=m; const z=localStorage.getItem('dreamr-zone'); if(z==='A'||z==='B') state.zone=z; }catch(e){}
  document.querySelectorAll('#fulfillSeg [data-mode]').forEach(b=>b.addEventListener('click',()=>{
    state.fulfillment=b.dataset.mode; try{ localStorage.setItem('dreamr-fulfillment',state.fulfillment); }catch(e){} render(); }));
  document.getElementById('zoneSel').addEventListener('change',e=>{
    state.zone=e.target.value||null; try{ localStorage.setItem('dreamr-zone',state.zone||''); }catch(err){} render(); });
  // Mozgás: belépő aranypor, előtte/utána söprés, billenő kártyák, söpörhető alternatívák, beúszó blokkok.
  M.dust(document.getElementById('welcomeDust'),14);
  M.autoSweep(document.querySelector('.dreamr-hero-visual'),document.getElementById('heroCompare'));
  M.gyroParallax(document.querySelector('.dreamr-hero-visual'));
  M.tiltWithin(document.getElementById('list'),'.item');
  M.swipeWithin(document.getElementById('list'),(item,dir)=>item?.querySelector(`.sbtn[data-dir="${dir}"]`)?.click());
  M.watchPlanIntro(document.getElementById('plan'));
  M.revealOnScroll('.planner-intro,.selectors,.wrap>.cardbox,.grid .cardbox,.list-head,.summary,.disclaimer');
  document.getElementById('langBtn').addEventListener('click',()=>{ state.lang=state.lang==='hu'?'en':'hu'; render(); });
  document.getElementById('searchBox').addEventListener('input',e=>{ state.search=e.target.value; render(); });
  // „Legolcsóbb mindenhol”: csak a megfelelő (R01), lehetőleg ellenőrzött árú, beférő termékek közül; zárolt tétel marad.
  // Minden csere naplózva és visszavonható (R05).
  document.getElementById('cheapAll').addEventListener('click',()=>{
    const before={sel:{...state.sel},off:[...state.off],quantity:{...state.quantity},picked:{...state.picked}}, changes=[], slots=[];
    curItems().forEach(it=>{ if(it.locked) return;
      const ok=it.allowed.filter(i=>itemFit(it.options[i],it.id).fits), ver=ok.filter(i=>!isGone(it.options[i])&&isVerified(it.options[i])), pool=ver.length?ver:ok;
      if(!pool.length) return;
      const best=pool.reduce((b,i)=>it.options[i].price<it.options[b].price?i:b, pool[0]), cur=it.selFull;
      if(best===cur||it.options[best].price>=it.options[cur].price) return;
      if(isGone(it.options[cur])) recordReplacement(it.id,it.options[cur],it.options[best],'gone');
      slots.push({id:it.id,options:it.options});
      changes.push({type:'swap',slot:it.id,role:it.role,from:cur,to:best,fromName:it.options[cur].name,toName:it.options[best].name,saving:it.options[cur].price-it.options[best].price,slotName:catName(it.id)});
    });
    applyChanges(changes,slots,'cheap');
    state.budgetLog={kind:'cheap',at:new Date().toISOString(),before,ok:true,over:0,changes,blockers:[]};
    render();
  });
  // ---- R06: keresés a teljes engedélyezett katalógusban ----
  const SEARCH={q:'',category:'',maxW:'',maxD:'',minPrice:'',maxPrice:'',stores:null};
  function openCatalogSearch(q){
    if(q!=null) SEARCH.q=q;
    const allowedStores=STORES.filter(s=>state.stores.has(s));
    if(!SEARCH.stores||[...SEARCH.stores].some(s=>!state.stores.has(s))) SEARCH.stores=new Set(allowedStores);
    const slots=getSlots(), cats=[...new Set(CAT.allItems().map(o=>o.category))].filter(c=>!CAT.categories[c].accessoryOnly);
    const ov=document.getElementById('searchOverlay');
    const opt=(v,l,sel)=>`<option value="${v}"${sel?' selected':''}>${l}</option>`;
    ov.innerHTML=`<div class="slbox search-box" role="dialog" aria-label="${t('catSearchTitle')}"><div class="slhead"><h3>${t('catSearchTitle')}</h3><button class="slclose" id="csX" aria-label="${t('slClose')}">✕</button></div>
      <p class="detail-lead">${t('catSearchLead')}</p>
      <div class="cs-form">
        <input id="csQ" class="searchbox" type="search" placeholder="${t('catSearchPh')}" value="${escapeHtml(SEARCH.q)}">
        <label>${t('csCat')}<select id="csCat">${opt('',t('csAllCats'),!SEARCH.category)}<optgroup label="${ROOM_LABEL[state.room][li()]}">${slots.map(s=>opt(s.category,catName(s.category),SEARCH.category===s.category)).join('')}</optgroup><optgroup label="${t('csOther')}">${cats.filter(c=>!slots.some(s=>s.category===c)).map(c=>opt(c,catName(c),SEARCH.category===c)).join('')}</optgroup></select></label>
        <label>${t('csMaxW')}<input id="csW" type="number" min="0" step="5" value="${SEARCH.maxW}" placeholder="cm"></label>
        <label>${t('csMaxD')}<input id="csD" type="number" min="0" step="5" value="${SEARCH.maxD}" placeholder="cm"></label>
        <label>${t('csMinP')}<input id="csP0" type="number" min="0" step="1000" value="${SEARCH.minPrice}" placeholder="Ft"></label>
        <label>${t('csMaxP')}<input id="csP1" type="number" min="0" step="1000" value="${SEARCH.maxPrice}" placeholder="Ft"></label>
        <div class="cs-stores"><span class="flabel">${t('storesLabel')}</span>${allowedStores.map(s=>`<span class="schip ${SEARCH.stores.has(s)?'on':''}" data-cs="${s}">${STORE_LABEL[s]||s}</span>`).join('')}</div>
      </div>
      <div id="csInfo" class="cs-info" role="status" aria-live="polite"></div><div id="csResults" class="cs-results"></div>
      <div class="slbtns"><button class="cl" id="csX2">${t('slClose')}</button></div></div>`;
    ov.style.display='flex';
    const close=()=>{ ov.style.display='none'; ov.innerHTML=''; };
    ov.querySelector('#csX').onclick=close; ov.querySelector('#csX2').onclick=close; ov.onclick=e=>{ if(e.target===ov) close(); };
    const bind=(id,k)=>ov.querySelector(id).addEventListener('input',e=>{ SEARCH[k]=e.target.value; draw(); });
    bind('#csQ','q'); bind('#csW','maxW'); bind('#csD','maxD'); bind('#csP0','minPrice'); bind('#csP1','maxPrice');
    ov.querySelector('#csCat').addEventListener('change',e=>{ SEARCH.category=e.target.value; draw(); });
    ov.querySelectorAll('[data-cs]').forEach(c=>c.addEventListener('click',()=>{ const s=c.dataset.cs; if(SEARCH.stores.has(s)){ if(SEARCH.stores.size>1) SEARCH.stores.delete(s); } else SEARCH.stores.add(s); c.classList.toggle('on',SEARCH.stores.has(s)); draw(); }));
    function draw(){
      const hits=RECO.search(CAT.allItems(),{q:SEARCH.q,stores:SEARCH.stores,category:SEARCH.category,maxW:+SEARCH.maxW||0,maxD:+SEARCH.maxD||0,minPrice:+SEARCH.minPrice||0,maxPrice:+SEARCH.maxPrice||0},
        {categories:CAT.categories,categoryLabel:c=>catName(c)});
      const cur=curItems(), MAX=60;
      ov.querySelector('#csInfo').textContent=t('csCount').replace('{n}',hits.length)+(hits.length>MAX?' '+t('csFirst').replace('{n}',MAX):'');
      ov.querySelector('#csResults').innerHTML=hits.slice(0,MAX).map(o=>{
        const slot=slots.find(s=>s.category===o.category), it=slot&&cur.find(x=>x.id===slot.id), isSel=it&&it.vid===o.vid, fit=itemFit(o,o.category);
        const act=!slot?`<span class="cs-na">${t('csNotRoom')}</span>`:isSel?`<span class="ct cur">${t('cmpSel')}</span>`
          :it&&it.locked?`<span class="cs-na">${t('csLocked')}</span>`:`<button type="button" class="replace-btn" data-cs-pick="${o.vid}" data-cs-slot="${slot.id}">${t('csPick').replace('{cat}',catName(slot.id))}</button>`;
        return `<div class="cs-row">${storeBadge(o.store)}<div class="cs-main"><b>${escapeHtml(o.name)}</b><span class="muted">${catName(o.category)} · ${dimsText(o)}${fit.fits?'':' · <span class="badge-nofit">'+t('nofit')+'</span>'}</span></div><span class="cp${isUncertain(o)?' is-uncertain':''}">${fmt(o.price)} Ft</span>${act}</div>`;
      }).join('')||`<p class="muted">${t('csNone')}</p>`;
      ov.querySelectorAll('[data-cs-pick]').forEach(b=>b.addEventListener('click',()=>{
        const id=b.dataset.csSlot, vid=b.dataset.csPick, k=keyOf(id), prev=curItems().find(x=>x.id===id);
        state.sel[k]=vid; state.picked[k]={how:'search',from:prev?prev.vid:null,at:new Date().toISOString()};
        state.off.delete(id); pendingSwap={id,dir:1}; close(); render();
        document.querySelector(`.chk[data-id="${id}"]`)?.closest('.item')?.scrollIntoView({behavior:M.reduced()?'auto':'smooth',block:'center'});
      }));
    }
    draw(); ov.querySelector('#csQ').focus();
  }
  document.getElementById('catalogSearchBtn')?.addEventListener('click',()=>openCatalogSearch());
  // ---- R04: ajtó helye ----
  function syncDoorControls(){
    const d=LY.door(roomNow(),state.door), w=document.getElementById('doorWall'), o=document.getElementById('doorOffset'), s=document.getElementById('doorWidth');
    if(!w) return;
    w.value=d.wall; if(document.activeElement!==o) o.value=Math.round(d.offset); if(document.activeElement!==s) s.value=d.width;
    o.max=Math.round((d.wall==='left'||d.wall==='right'?roomNow().D:roomNow().W)-d.width);
  }
  ['doorWall','doorOffset','doorWidth'].forEach(id=>document.getElementById(id)?.addEventListener(id==='doorWall'?'change':'input',()=>{
    state.door={wall:document.getElementById('doorWall').value,offset:+document.getElementById('doorOffset').value||0,width:+document.getElementById('doorWidth').value||80};
    render(); }));
  document.getElementById('rotateBtn')?.addEventListener('click',rotateSelected);

  render();

  // ---- ÉLŐ ÁRAK (prices.json — naponta frissíti a GitHub Actions robot) ----
  const HU_MONTHS=['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
  const EN_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function refreshDateTexts(){
    // A T-beli szövegek betöltéskor épülnek — új dátumnál újraírjuk őket
    T.hu.note='Utolsó árfrissítés: <strong>'+PRICE_DATE_HU+'</strong>. Az árak tájékoztató jellegűek; az egyes termékek ellenőrzési ideje a terméklistában látható.';
    T.en.note='Last price update: <strong>'+PRICE_DATE_EN+'</strong>. Prices are indicative; each product shows when its price was last checked.';
    T.hu.footR='Árak: ikea.com/hu, jysk.hu · '+PRICE_DATE;
    T.en.footR='Prices: ikea.com/hu, jysk.hu · '+PRICE_DATE;
    T.hu.exNote='Az árak tájékoztató jellegűek ('+PRICE_DATE+'), a boltok oldalán ellenőrizhetők. Készült a DREAMR tervezővel.';
    T.en.exNote='Prices are indicative ('+PRICE_DATE+'), verify on the store pages. Made with the DREAMR planner.';
  }
  function applyLivePrices(data){
    priceDataLoaded=true;
    if(!data||!data.prices){ render(); return; } // nincs árfájl: minden ár „nem ellenőrzött”
    // v3 óta minden ár EGY megvásárolható egység ára. A régebbi (v1/v2) fájlban a többdarabos tételek ára
    // szorzott volt — azt nem használjuk egységárként, így ilyenkor minden ár „nem ellenőrzött” marad.
    if(!(data.version>=3)){ console.warn('DREAMR: elavult prices.json formátum (v'+(data.version||1)+'), az árak nem ellenőrzöttként jelennek meg.'); render(); return; }
    // Minden terméklistán végigmegyünk; az URL a termék egyedi azonosítója.
    // v2: tételenkénti ellenőrzési adatok; v1: csak ár → az akkori futás idejével ellenőrzöttnek tekintjük.
    // v4: tételek változatazonosító szerint (C02); v3: URL szerint — a katalógus a régi URL-eket is ismeri.
    const byUrl={}; if(!(data.version>=4)) Object.entries(data.items||{}).forEach(([u,info])=>{ const it=CAT.byUrl(u); if(it) byUrl[it.vid]=info; });
    CAT.allItems().forEach(p=>{
      let info=(data.version>=4?data.items[p.vid]:byUrl[p.vid])||null;
      // 4. szakasz: a bolti feedből érkező termék ára és ellenőrzési ideje magából a feedből jön; a feedből eltűnt tétel megszűnt
      if(!info&&p.variant&&p.product&&p.product.source&&p.product.source.feed){ const bp=p.variant.basePrice;
        info=p.variant.missingSince?{price:null,checkedAt:null,status:'gone'}:{price:bp.amount,checkedAt:bp.checkedAt?bp.checkedAt+'T06:00:00Z':null,status:bp.status==='verified'?'ok':'parse_error'}; }
      p.check=info;
      if(info&&info.price) p.price=info.price;
    });
    if(data.date&&/^\d{4}-\d{2}-\d{2}$/.test(data.date)){
      const [y,mo,d]=data.date.split('-').map(Number);
      PRICE_DATE=data.date;
      PRICE_DATE_HU=y+'. '+HU_MONTHS[mo-1]+' '+d+'-i';
      PRICE_DATE_EN=d+' '+EN_MONTHS[mo-1]+' '+y;
      refreshDateTexts();
    }
    render(); // friss árakkal, dátummal és ellenőrzési állapottal újrarajzolás
  }
  // Ha nincs prices.json vagy nem tölthető be, a beépített árak maradnak — de „nem ellenőrzött” jelzéssel.
  fetch('prices.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(applyLivePrices).catch(()=>applyLivePrices(null));
