  const META = {
    sofa:{cat:'Kanapé',icon:'🛋️',floor:'furniture',plan:'sofa'},
    chair:{cat:'Fotel',icon:'🪑',floor:'furniture',plan:'armchair'},
    coffee:{cat:'Dohányzóasztal',icon:'🪵',floor:'furniture',plan:'coffee'},
    tv:{cat:'TV-állvány',icon:'📺',floor:'furniture',plan:'tv'},
    rug:{cat:'Szőnyeg',icon:'🟫',floor:'rug',plan:'rug'},
    lamp:{cat:'Állólámpa',icon:'💡',floor:'small',plan:'lamp'},
    curtain:{cat:'Függöny',icon:'🪟',floor:'none',plan:null},
    cushion:{cat:'Díszpárna',icon:'🟦',floor:'none',plan:null},
    vase:{cat:'Dekoráció',icon:'🏺',floor:'small',plan:null},
    bed:{cat:'Ágy',icon:'🛏️',floor:'furniture',plan:'bed'},
    nightstand:{cat:'Éjjeliszekrény',icon:'🗄️',floor:'furniture',plan:'nightstands'},
    wardrobe:{cat:'Gardrób',icon:'🚪',floor:'furniture',plan:'wardrobe'},
    bedding:{cat:'Ágynemű',icon:'🛌',floor:'none',plan:null},
    dtable:{cat:'Étkezőasztal',icon:'🍽️',floor:'furniture',plan:'dtable'},
    dchair:{cat:'Étkezőszék',icon:'🪑',floor:'furniture',plan:'dchairs'},
    sideboard:{cat:'Tálalószekrény',icon:'🗄️',floor:'furniture',plan:'sideboard'},
    island:{cat:'Konyhasziget',icon:'🍳',floor:'furniture',plan:'island'},
    barstool:{cat:'Bárszék',icon:'🪑',floor:'furniture',plan:'barstools'},
    kcabinet:{cat:'Tárolószekrény',icon:'🗄️',floor:'furniture',plan:'kcabinet'},
    fridge:{cat:'Hűtőszekrény',icon:'🧊',floor:'furniture',plan:'fridge'},
    desk:{cat:'Íróasztal',icon:'🖥️',floor:'furniture',plan:'desk'},
    ochair:{cat:'Irodai szék',icon:'🪑',floor:'furniture',plan:'ochair'},
    shelf:{cat:'Könyvespolc',icon:'📚',floor:'furniture',plan:'shelf'},
    kbed:{cat:'Gyerekágy',icon:'🛏️',floor:'furniture',plan:'kbed'},
    kdesk:{cat:'Gyerek íróasztal',icon:'✏️',floor:'furniture',plan:'kdesk'},
  };
  const P_ = (key,name,store,price,w,d,url)=>({key,name,store,price,w,d,url});
  let PRICE_DATE='2026-08-29'; // az árellenőrzés dátuma — a prices.json betöltése automatikusan frissíti
  let PRICE_DATE_HU='2026. augusztus 29-i', PRICE_DATE_EN='29 August 2026';
  // ---- NAPPALI poolok ----
  const POOL={
    sofa:[
      P_('viskafors',"VISKAFORS 3 személyes kanapé, szürke","ikea",449900,224,90,"https://www.ikea.com/hu/hu/p/viskafors-3-szemelyes-kanape-lejde-szuerke-zoeld-nyir-s29443337/"),
      P_('ektorp',"EKTORP 3 személyes kanapé, világosbézs","ikea",179900,218,88,"https://www.ikea.com/hu/hu/p/ektorp-3-szemelyes-kanape-kilanda-vilagosbezs-s69509010/"),
      P_('gedved',"GEDVED 3 személyes kanapé, szürke","jysk",214900,210,84,"https://jysk.hu/nappali/kanapek/kanape-gedved-3-szemelyes-szurke"),
      P_('egense',"EGENSE 3 személyes kanapé, sötétszürke","jysk",139900,200,80,"https://jysk.hu/nappali/kanapek/kanape-egense-3-szemelyes-sotetszurke-szovet"),
      P_('hellerup',"HELLERUP 3 személyes kanapé, bézs/tölgy","jysk",179900,219,90,"https://jysk.hu/nappali/kanapek/kanape-hellerup-3-szemelyes-bezs-szovet-natur-tolgy"),
      P_('applaryd',"ÄPPLARYD 3 személyes kanapé, világosszürke","ikea",299900,231,93,"https://www.ikea.com/hu/hu/p/aepplaryd-3-szemelyes-kanape-lejde-vilagosszuerke-30506239/"),
      P_('trevo',"Trevo 3 személyes kanapé","mobelix",219900,201,94,"https://www.moebelix.hu/p/haromueleses-kanape-trevo-002694005702"),
      P_('kiss',"Kiss 3 személyes kanapé","momax",289900,241,117,"https://www.moemax.hu/p/kanape-kiss-000812011601"),
    ],
    chair:[
      P_('strandmon',"STRANDMON füles fotel, sötétszürke","ikea",84990,82,96,"https://www.ikea.com/hu/hu/p/strandmon-fueles-fotel-nordvalla-soetetszuerke-20343224/"),
      P_('poang',"POÄNG fotel, nyír/világosbézs","ikea",36990,68,82,"https://www.ikea.com/hu/hu/p/poaeng-fotel-nyir-furner-knisa-vilagosbezs-s39240787/"),
      P_('gedvedchair',"GEDVED fotel, szürke szövet","jysk",59900,69,76,"https://jysk.hu/nappali/fotelek/fotel-gedved-szurke-szovet"),
      P_('ekenaset',"ÅRSUNDA fotel, világosszürke","ikea",22990,66,80,"https://www.ikea.com/hu/hu/p/arsunda-fotel-knisa-vilagosszuerke-00535894/"),
      P_('vejen',"VEJEN fotel, fekete textilbőr","jysk",60000,76,92,"https://jysk.hu/nappali/fotelek/fotel-vejen-fekete-textilbor"),
      P_('strandmondeep',"STRANDMON füles fotel, mélybézs","ikea",99990,82,96,"https://www.ikea.com/hu/hu/p/strandmon-fueles-fotel-tommaboda-melybezs-50613163/"),
    ],
    coffee:[
      P_('lack',"LACK dohányzóasztal, fehér, 90×55","ikea",8990,90,55,"https://www.ikea.com/hu/hu/p/lack-dohanyzoasztal-feher-90449905/"),
      P_('lejre',"LEJRE dohányzóasztal, fehér/tölgy","jysk",21500,120,60,"https://jysk.hu/nappali/dohanyzoasztalok-es-kisasztalok/dohanyzoasztal-lejre-60x120-feher-natur-tolgy"),
      P_('vedde',"VEDDE dohányzóasztal, sötét tölgy","jysk",35000,110,60,"https://jysk.hu/nappali/dohanyzoasztalok-es-kisasztalok/dohanyzoasztal-vedde-60x110-1-polcos-sotet-tolgyszinu"),
      P_('markskel',"JEGIND dohányzóasztal, ÁTM80, fehér/tölgy","jysk",19950,80,80,"https://jysk.hu/nappali/dohanyzoasztalok-es-kisasztalok/dohanyzoasztal-jegind-atm80-polccal-feher-natur-tolgyszinu"),
      P_('frotorp',"FRÖTORP dohányzóasztal, márvány hatású","ikea",59990,88,88,"https://www.ikea.com/hu/hu/p/froetorp-dohanyzoasztal-antracit-marvany-hatasu-fekete-ueveg-70497582/"),
      P_('sandby',"SANDBY dohányzóasztal, tölgy/fekete","jysk",65000,110,60,"https://jysk.hu/nappali/dohanyzoasztalok-es-kisasztalok/dohanyzoasztal-sandby-60x110-natur-tolgy-fekete"),
      P_('brava',"Brava dohányzóasztal, kerek 70 cm","momax",32990,70,70,"https://www.moemax.hu/p/dohanyzoasztal-brava-008103019102"),
      P_('quattro',"Quattro dohányzóasztal, 105×60","mobelix",59990,105,60,"https://www.moebelix.hu/p/dohanyzoasztal-quattro-001803024706"),
    ],
    tv:[
      P_('besta',"BESTÅ TV-állvány, fehér","ikea",29990,120,40,"https://www.ikea.com/hu/hu/p/besta-tv-allvany-feher-80294503/"),
      P_('favrbo',"HEMDRUP TV-állvány, 2 ajtós, tölgy/fekete","jysk",42500,134,38,"https://jysk.hu/nappali/tv-allvanyok/tv-allvany-hemdrup-2-ajtos-meleg-tolgyszinu-fekete"),
      P_('evetofte',"EVETOFTE TV-állvány, világos tölgy","jysk",45000,175,35,"https://jysk.hu/nappali/tv-allvanyok/tv-allvany-evetofte-vilagos-tolgyszinu"),
      P_('fjallbo',"FJÄLLBO TV-állvány, fekete/fenyő","ikea",79990,150,36,"https://www.ikea.com/hu/hu/p/fjaellbo-tv-allvany-fekete-90339290/"),
      P_('tonstad',"TONSTAD TV-állvány, tölgy furnér","ikea",99990,178,37,"https://www.ikea.com/hu/hu/p/tonstad-tv-allvany-toelgy-furner-00489302/"),
      P_('malta',"Malta TV-elem, 185×42","mobelix",79990,185,42,"https://www.moebelix.hu/p/tv-elem-malta-001803031864"),
      P_('carlos',"Carlos TV-szekrény, 180×42","momax",129900,180,42,"https://www.moemax.hu/p/tv-szekreny-carlos-002798001801"),
    ],
    rug:[
      P_('tiphede',"TIPHEDE szőnyeg, 155×220","ikea",8490,220,155,"https://www.ikea.com/hu/hu/p/tiphede-szonyeg-sikszoevoett-fekete-natur-20470047/"),
      P_('lohals',"LOHALS szőnyeg, natúr, 200×300","ikea",49990,300,200,"https://www.ikea.com/hu/hu/p/lohals-szonyeg-sikszoevoett-natur-00277395/"),
      P_('stoense',"STOENSE szőnyeg, 200×300","ikea",54990,300,200,"https://www.ikea.com/hu/hu/p/stoense-szonyeg-roevid-szalu-toertfeher-20426808/"),
      P_('paul',"MORUM síkszövött szőnyeg, bézs, 200×300","ikea",29990,300,200,"https://www.ikea.com/hu/hu/p/morum-szonyeg-sikszoevoett-bel-kuelteri-bezs-80198295/"),
      P_('lucy',"Lucy szőtt szőnyeg, 160×230","momax",37990,230,160,"https://www.moemax.hu/p/modern-living-szott-szonyeg-lucy-160-230-004868025101"),
    ],
    lamp:[
      P_('hansson',"HANSSON állólámpa, fekete, 155 cm","jysk",7500,22,22,"https://jysk.hu/lakberendezes/vilagitas/lampak/allolampa-hansson-ma155cm-fekete"),
      P_('nymane',"NYMÅNE állólámpa 3 spottal, fehér","ikea",19990,30,30,"https://www.ikea.com/hu/hu/p/nymane-allolampa-3-spottal-feher-80455483/"),
      P_('lauters',"LAUTERS állólámpa, kőris/fehér","ikea",24990,40,40,"https://www.ikea.com/hu/hu/p/lauters-allolampa-koris-feher-30405042/"),
      P_('stockholm',"STOCKHOLM 2025 állólámpa, sárgaréz-bev.","ikea",39990,50,50,"https://www.ikea.com/hu/hu/p/stockholm-2025-allolampa-feher-textil-sargarez-bev-50585914/"),
      P_('barlast',"BARLAST állólámpa, fekete/fehér, 150 cm","ikea",3990,25,25,"https://www.ikea.com/hu/hu/p/barlast-allolampa-fekete-feher-10430368/"),
      P_('arstid',"ÅRSTID állólámpa, sárgaréz/fehér","ikea",21990,30,30,"https://www.ikea.com/hu/hu/p/arstid-allolampa-sargarez-feher-00321317/"),
    ],
    bed:[
      P_('slattum',"SLATTUM kárpitozott ágykeret, 160×200","ikea",54990,164,206,"https://www.ikea.com/hu/hu/p/slattum-karpitozott-agykeret-vissle-soetetszuerke-40571248/"),
      P_('malm',"MALM ágykeret, magas, fehér, 160×200","ikea",84990,176,209,"https://www.ikea.com/hu/hu/p/malm-agykeret-magas-feher-luroey-s29002433/"),
      P_('kongsberg',"KONGSBERG ágykeret, bézs, 160×200","jysk",105000,174,216,"https://jysk.hu/haloszoba/agyak/agyalapok-agyracsok-agykeretek/agykeretek/agykeret-kongsberg-160x200-bezs-szovet"),
      P_('vihals',"VIHALS ágykeret, fehér, 160×200","ikea",44990,166,207,"https://www.ikea.com/hu/hu/p/vihals-agykeret-feher-60602442/"),
      P_('kleppstadbed',"KLEPPSTAD ágykeret, fehér/bézs, 160×200","ikea",59990,166,207,"https://www.ikea.com/hu/hu/p/kleppstad-agykeret-feher-vissle-bezs-10492672/"),
    ],
    wardrobe:[
      P_('kleppstad2',"KLEPPSTAD gardrób 2 ajtóval, fehér","ikea",39990,79,55,"https://www.ikea.com/hu/hu/p/kleppstad-gardrob-2-ajtoval-feher-80437234/"),
      P_('kleppstad3',"KLEPPSTAD gardrób 3 ajtóval, fehér","ikea",54990,117,55,"https://www.ikea.com/hu/hu/p/kleppstad-gardrobszekreny-3-ajtoval-feher-00441758/"),
      P_('brimnes3',"BRIMNES gardrób 3 ajtóval, fehér","ikea",79990,117,50,"https://www.ikea.com/hu/hu/p/brimnes-3-ajtos-gardrob-feher-40407922/"),
      P_('kleppstadslide',"KLEPPSTAD tolóajtós gardrób, fehér","ikea",59990,117,55,"https://www.ikea.com/hu/hu/p/kleppstad-toloajtos-gardrobszekreny-feher-90437238/"),
    ],
    dtable:[
      P_('alling',"ALLING kihúzható étkezőasztal, tölgy","jysk",64900,163,80,"https://jysk.hu/etkezo/etkezoasztalok/etkezoasztal-alling-80x100-163-meleg-tolgyszinu"),
      P_('nordviken',"NORDVIKEN meghosszabbítható asztal, fekete","ikea",129900,152,95,"https://www.ikea.com/hu/hu/p/nordviken-meghosszabbithato-asztal-fekete-20368714/"),
      P_('morbylanga',"MÖRBYLÅNGA asztal, tölgy furnér","ikea",249900,140,85,"https://www.ikea.com/hu/hu/p/moerbylanga-asztal-toelgy-furner-barna-pacolt-50386245/"),
      P_('vihalstable',"VIHALS asztal, fehér, 125×74","ikea",19990,125,74,"https://www.ikea.com/hu/hu/p/vihals-asztal-feher-feher-s39578509/"),
    ],
    dchair:[
      P_('jonstrup',"JONSTRUP étkezőszék, szürke/tölgy (4 db)","jysk",40000,45,53,"https://jysk.hu/etkezo/etkezoszekek/etkezoszek-jonstrup-szurke-szovet-natur-tolgyszinu"),
      P_('bistrup',"BISTRUP étkezőszék, homok/tölgy (4 db)","jysk",71600,44,53,"https://jysk.hu/etkezo/etkezoszekek/etkezoszek-bistrup-homok-natur-tolgy"),
      P_('pinntorp',"PINNTORP szék, fenyő (4 db)","ikea",51960,45,50,"https://www.ikea.com/hu/hu/p/pinntorp-szek-vilagos-barnara-pacolt-fenyo-00590480/"),
      P_('hauga',"HAUGA szék, fehér (4 db)","ikea",39960,46,50,"https://www.ikea.com/hu/hu/p/hauga-szek-feher-10576718/"),
    ],
    sideboard:[
      P_('havstasb',"HAVSTA tálalószekrény, fehér","ikea",139900,121,47,"https://www.ikea.com/hu/hu/p/havsta-talaloszekreny-feher-40529235/"),
      P_('idanas',"IDANÄS tálalószekrény, fehér","ikea",149900,124,50,"https://www.ikea.com/hu/hu/p/idanaes-talaloszekreny-feher-80496025/"),
      P_('skruvby',"SKRUVBY tálalószekrény, fehér","ikea",59990,120,38,"https://www.ikea.com/hu/hu/p/skruvby-talaloszekreny-feher-60568725/"),
      P_('haugasb',"HAUGA tálalószekrény, szürke","ikea",89990,140,46,"https://www.ikea.com/hu/hu/p/hauga-talaloszekreny-szuerke-60621488/"),
    ],
    island:[
      P_('raskog',"RÅSKOG zsúrkocsi, fehér","ikea",14990,35,45,"https://www.ikea.com/hu/hu/p/raskog-zsurkocsi-feher-30586783/"),
      P_('vadholma',"VADHOLMA konyhasziget, fekete/tölgy","ikea",249900,126,79,"https://www.ikea.com/hu/hu/p/vadholma-konyhasziget-fekete-toelgy-20359154/"),
      P_('tornviken',"TORNVIKEN konyhasziget, törtfehér/tölgy","ikea",199900,126,77,"https://www.ikea.com/hu/hu/p/tornviken-konyhasziget-toertfeher-toelgy-40391657/"),
      P_('forhoja',"FÖRHÖJA konyhai zsúrkocsi, nyír","ikea",49990,100,43,"https://www.ikea.com/hu/hu/p/foerhoeja-konyhai-zsurkocsi-nyir-80035920/"),
    ],
    barstool:[
      P_('stig',"STIG bárszék, fekete (2 db)","ikea",15980,40,42,"https://www.ikea.com/hu/hu/p/stig-barszek-hattamla-barpult-magassagu-fekete-fekete-30498418/"),
      P_('dalfred',"DALFRED bárszék, fekete (2 db)","ikea",33980,50,50,"https://www.ikea.com/hu/hu/p/dalfred-barszek-fekete-60155602/"),
      P_('franklin',"FRANKLIN összecsukható bárszék, fekete (2 db)","ikea",25980,44,50,"https://www.ikea.com/hu/hu/p/franklin-tamlas-barszek-oesszecsukhato-barpult-magassagu-fekete-fekete-50406465/"),
      P_('bergmund',"BERGMUND bárszék háttámlával, fekete (2 db)","ikea",79980,45,49,"https://www.ikea.com/hu/hu/p/bergmund-barszek-hattamla-barpult-magassagu-fekete-gunnared-koezepszuerke-s59384690/"),
    ],
    kcabinet:[
      P_('ivar',"IVAR szekrény ajtókkal, fekete háló","ikea",34990,80,30,"https://www.ikea.com/hu/hu/p/ivar-szekreny-ajtok-fekete-halo-00531240/"),
      P_('havstagl',"HAVSTA üvegajtós szekrény, fehér","ikea",109900,81,35,"https://www.ikea.com/hu/hu/p/havsta-uevegajtos-szekreny-feher-60529263/"),
      P_('metodwall',"METOD faliszekrény, vízszintesen nyíló","ikea",29000,80,40,"https://www.ikea.com/hu/hu/p/metod-faliszekreny-vizszintesen-nyilo-feher-vallstena-feher-s39507277/"),
      P_('knoxhult',"KNOXHULT faliszekrény ajtóval, fehér","ikea",15000,60,60,"https://www.ikea.com/hu/hu/p/knoxhult-faliszekreny-ajto-feher-10326791/"),
    ],
    fridge:[
      P_('rakall',"RÅKALL beépíthető hűtő/fagyasztó","ikea",169900,54,55,"https://www.ikea.com/hu/hu/p/rakall-hutoszekreny-fagyaszto-ikea-500-beepitett-80572868/"),
      P_('lagan',"LAGAN szabadonálló hűtő/fagyasztó, fehér","ikea",129900,55,58,"https://www.ikea.com/hu/hu/p/lagan-hutoszekreny-fagyaszto-szabadon-allo-feher-50619457/"),
      P_('tinad',"TINAD beépíthető hűtő/fagyasztó","ikea",219900,54,55,"https://www.ikea.com/hu/hu/p/tinad-hutoszekreny-fagyaszto-ikea-500-beepitett-00572872/"),
    ],
    desk:[
      P_('lagkapten',"LAGKAPTEN/ADILS íróasztal, fehér","ikea",21990,120,60,"https://www.ikea.com/hu/hu/p/lagkapten-adils-iroasztal-feher-s29416758/"),
      P_('pahl',"PÅHL íróasztal, állítható magasságú","ikea",26990,96,58,"https://www.ikea.com/hu/hu/p/pahl-iroasztal-allithato-magassagu-feher-s49619340/"),
      P_('stauning',"STAUNING íróasztal, fehér, 160×80","jysk",35000,160,80,"https://jysk.hu/dolgozoszoba/iroasztalok/iroasztal-stauning-80x160-feher"),
      P_('micke',"MICKE íróasztal, fehér, 142×50","ikea",44990,142,50,"https://www.ikea.com/hu/hu/p/micke-iroasztal-feher-90214308/"),
    ],
    ochair:[
      P_('flintan',"FLINTAN irodai szék, fekete","ikea",24990,71,71,"https://www.ikea.com/hu/hu/p/flintan-irodai-szek-fekete-10489028/"),
      P_('millberget',"MILLBERGET forgószék, fekete","ikea",44990,70,70,"https://www.ikea.com/hu/hu/p/millberget-forgoszek-murum-fekete-70489394/"),
      P_('markus',"MARKUS irodai szék, sötétszürke","ikea",79990,62,60,"https://www.ikea.com/hu/hu/p/markus-irodai-szek-vissle-soetetszuerke-70261150/"),
      P_('flintanarm',"FLINTAN irodai szék karfákkal, fekete","ikea",32990,71,71,"https://www.ikea.com/hu/hu/p/flintan-irodai-szek-karfakkal-fekete-s89424468/"),
    ],
    shelf:[
      P_('kallax',"KALLAX polcos elem, fehér, 77×77","ikea",15990,77,39,"https://www.ikea.com/hu/hu/p/kallax-polcos-elem-feher-20275814/"),
      P_('skals',"SKALS könyvespolc-elem, fehér","jysk",18500,71,35,"https://jysk.hu/tarolas/polcok-es-terelvalasztok/polc-kombinacio-elem-skals-konyvespolc-feher"),
      P_('billy',"BILLY könyvespolc, fehér, 80×28","ikea",22990,80,28,"https://www.ikea.com/hu/hu/p/billy-koenyvespolc-feher-00263850/"),
    ],
    kbed:[
      P_('slakt',"SLÄKT ágykeret, fehér, 90×200","ikea",33990,96,206,"https://www.ikea.com/hu/hu/p/slaekt-agykeret-feher-00362746/"),
      P_('kura',"KURA megfordítható ágy, 90×200","ikea",79990,99,209,"https://www.ikea.com/hu/hu/p/kura-megfordithato-agy-feher-fenyo-80253809/"),
      P_('klippuggla',"KLIPPUGGLA tárolós gyerekágy, 90×200","ikea",72480,96,206,"https://www.ikea.com/hu/hu/p/klippuggla-agykeret-taroloval-feher-leesesgatloval-s09627827/"),
    ],
    curtain:[
      P_('stadsholmen',"STADSHOLMEN fényzáró függöny (2 db)","jysk",11000,140,245,"https://jysk.hu/fuggonyok/keszfuggonyok/fenyzaro-fuggonyok/fenyzaro-fuggony-stadsholmen-140x245-szurke"),
      P_('majgull',"MAJGULL fényzáró függöny, szürke (1 pár)","ikea",14990,145,300,"https://www.ikea.com/hu/hu/p/majgull-fenyzaro-fueggoeny-1-par-szuerke-fueggoenyrancolo-szalaggal-80417815/"),
      P_('idse',"AMUNGEN dimout függöny, szürke (2 db)","jysk",17000,140,300,"https://jysk.hu/fuggonyok/keszfuggonyok/fenyzaro-fuggonyok/dimout-fuggony-amungen-140x300-szurke"),
      P_('dytag',"DYTÅG függönypár, bézs len (1 pár)","ikea",34990,145,300,"https://www.ikea.com/hu/hu/p/dytag-fueggoenypar-bezs-fueggoenyrancolo-szalaggal-80607820/"),
      P_('sanela',"VILBORG sötétítőfüggöny, bézs (1 pár)","ikea",29990,145,300,"https://www.ikea.com/hu/hu/p/vilborg-soetetitofueggoeny-1-par-bezs-fueggoenyrancolo-szalaggal-50297555/"),
    ],
    cushion:[
      P_('sanelac',"SANELA díszpárnahuzat, sárga-barna (2 db)","ikea",4980,50,50,"https://www.ikea.com/hu/hu/p/sanela-diszparnahuzat-sarga-barna-50635990/"),
      P_('kongsspir',"MYRFIOL díszpárna, topszín (2 db)","jysk",4000,45,45,"https://jysk.hu/lakberendezes/diszparnak-es-diszparnahuzatok/diszparnak/diszparna-myrfiol-45x45-topszin"),
      P_('gurli',"GURLI díszpárnahuzat, sötétszürke (2 db)","ikea",2980,50,50,"https://www.ikea.com/hu/hu/p/gurli-diszparnahuzat-soetetszuerke-50598737/"),
      P_('hvidblomme',"HVIDBLOMME díszpárna, homok (2 db)","jysk",4000,45,45,"https://jysk.hu/lakberendezes/diszparnak-es-diszparnahuzatok/diszparnak/diszparna-hvidblomme-45x45-sotet-homokszinu"),
      P_('svartho',"SVARTHÖ díszpárnahuzat, bézs (2 db)","ikea",11980,50,50,"https://www.ikea.com/hu/hu/p/svarthoe-diszparnahuzat-bezs-70336594/"),
    ],
    vase:[
      P_('gradvis',"PÅDRAG váza, átlátszó üveg, 17 cm","ikea",495,17,17,"https://www.ikea.com/hu/hu/p/padrag-vaza-atlatszo-ueveg-10470991/"),
      P_('frovaxt',"FRÖVÄXT váza, fehér, 20 cm","ikea",2490,10,10,"https://www.ikea.com/hu/hu/p/froevaext-vaza-feher-60591919/"),
      P_('fulltalig',"FULLTALIG gyertyatartó, 3 db, fekete","ikea",3990,10,10,"https://www.ikea.com/hu/hu/p/fulltalig-gyertyatarto-3db-fekete-40342134/"),
      P_('stilren',"STILREN váza, fehér, 22 cm","ikea",4490,12,12,"https://www.ikea.com/hu/hu/p/stilren-vaza-feher-10442045/"),
      P_('begarlig',"BEGÄRLIG váza, üveg, 29 cm","ikea",7990,19,19,"https://www.ikea.com/hu/hu/p/begaerlig-vaza-atlatszo-ueveg-30309781/"),
    ],
  };
  const PA={
    curtain:{modern:'stadsholmen',skandinav:'idse',minimalista:'stadsholmen',japandi:'dytag',luxus:'sanela',ipari:'majgull'},
    cushion:{modern:'gurli',skandinav:'hvidblomme',minimalista:'kongsspir',japandi:'svartho',luxus:'sanelac',ipari:'gurli'},
    vase:{modern:'gradvis',skandinav:'stilren',minimalista:'frovaxt',japandi:'gradvis',luxus:'begarlig',ipari:'fulltalig'},
  };
  const findP=(cat,key)=>POOL[cat].find(x=>x.key===key);
  const opts=(cat,primary)=>{const p=findP(cat,primary);return [p,...POOL[cat].filter(x=>x.key!==primary)];};
  const single=(o)=>[o];

  // stílusonkénti egyedi kiegészítők (nappali)
  const CURTAIN={
    modern:P_('c','STADSHOLMEN fényzáró függöny (2 db)','jysk',11000,140,245,'https://jysk.hu/fuggonyok/keszfuggonyok/fenyzaro-fuggonyok/fenyzaro-fuggony-stadsholmen-140x245-szurke'),
    skandinav:P_('c','AMUNGEN dimout függöny, szürke (2 db)','jysk',17000,140,300,'https://jysk.hu/fuggonyok/keszfuggonyok/fenyzaro-fuggonyok/dimout-fuggony-amungen-140x300-szurke'),
    minimalista:P_('c','STADSHOLMEN fényzáró függöny (2 db)','jysk',11000,140,245,'https://jysk.hu/fuggonyok/keszfuggonyok/fenyzaro-fuggonyok/fenyzaro-fuggony-stadsholmen-140x245-szurke'),
    japandi:P_('c','DYTÅG függönypár, bézs len (1 pár)','ikea',34990,145,300,'https://www.ikea.com/hu/hu/p/dytag-fueggoenypar-bezs-fueggoenyrancolo-szalaggal-80607820/'),
    luxus:P_('c','VILBORG sötétítőfüggöny, bézs (1 pár)','ikea',29990,145,300,'https://www.ikea.com/hu/hu/p/vilborg-soetetitofueggoeny-1-par-bezs-fueggoenyrancolo-szalaggal-50297555/'),
    ipari:P_('c','MAJGULL fényzáró függöny, szürke (1 pár)','ikea',14990,145,300,'https://www.ikea.com/hu/hu/p/majgull-fenyzaro-fueggoeny-1-par-szuerke-fueggoenyrancolo-szalaggal-80417815/'),
  };
  const CUSHION={
    modern:P_('u','GURLI díszpárnahuzat, sötétszürke (2 db)','ikea',2980,50,50,'https://www.ikea.com/hu/hu/p/gurli-diszparnahuzat-soetetszuerke-50598737/'),
    skandinav:P_('u','HVIDBLOMME díszpárna, homok (2 db)','jysk',4000,45,45,'https://jysk.hu/lakberendezes/diszparnak-es-diszparnahuzatok/diszparnak/diszparna-hvidblomme-45x45-sotet-homokszinu'),
    minimalista:P_('u','MYRFIOL díszpárna, topszín (2 db)','jysk',4000,45,45,'https://jysk.hu/lakberendezes/diszparnak-es-diszparnahuzatok/diszparnak/diszparna-myrfiol-45x45-topszin'),
    japandi:P_('u','SVARTHÖ díszpárnahuzat, bézs (2 db)','ikea',11980,50,50,'https://www.ikea.com/hu/hu/p/svarthoe-diszparnahuzat-bezs-70336594/'),
    luxus:P_('u','SANELA díszpárnahuzat, sárga-barna (2 db)','ikea',4980,50,50,'https://www.ikea.com/hu/hu/p/sanela-diszparnahuzat-sarga-barna-50635990/'),
    ipari:P_('u','GURLI díszpárnahuzat, sötétszürke (2 db)','ikea',2980,50,50,'https://www.ikea.com/hu/hu/p/gurli-diszparnahuzat-soetetszuerke-50598737/'),
  };
  const VASE={
    modern:P_('v','PÅDRAG váza, átlátszó üveg, 17 cm','ikea',495,17,17,'https://www.ikea.com/hu/hu/p/padrag-vaza-atlatszo-ueveg-10470991/'),
    skandinav:P_('v','STILREN váza, fehér, 22 cm','ikea',4490,12,12,'https://www.ikea.com/hu/hu/p/stilren-vaza-feher-10442045/'),
    minimalista:P_('v','FRÖVÄXT váza, fehér, 20 cm','ikea',2490,10,10,'https://www.ikea.com/hu/hu/p/froevaext-vaza-feher-60591919/'),
    japandi:P_('v','PÅDRAG váza, átlátszó üveg, 17 cm','ikea',495,17,17,'https://www.ikea.com/hu/hu/p/padrag-vaza-atlatszo-ueveg-10470991/'),
    luxus:P_('v','BEGÄRLIG váza, üveg, 29 cm','ikea',7990,19,19,'https://www.ikea.com/hu/hu/p/begaerlig-vaza-atlatszo-ueveg-30309781/'),
    ipari:P_('v','FULLTALIG gyertyatartó, 3 db','ikea',3990,10,10,'https://www.ikea.com/hu/hu/p/fulltalig-gyertyatarto-3db-fekete-40342134/'),
  };
  const NIGHTSTAND=P_('n','KULLEN éjjeliszekrény, fehér (2 db)','ikea',19980,35,40,'https://www.ikea.com/hu/hu/p/kullen-2-fiokos-szekreny-feher-80309241/');
  const BEDDING={
    default:P_('b','ÄNGSLILJA ágyneműhuzat, szürke','ikea',6990,150,200,'https://www.ikea.com/hu/hu/p/aengslilja-paplanhuzat-parnahuzat-szuerke-70608882/'),
  };

  // stílus-primaryk
  const PRIMARY={
    nappali:{
      modern:{sofa:'viskafors',chair:'strandmon',coffee:'vedde',tv:'besta',rug:'stoense',lamp:'nymane'},
      skandinav:{sofa:'ektorp',chair:'ekenaset',coffee:'sandby',tv:'evetofte',rug:'stoense',lamp:'lauters'},
      minimalista:{sofa:'gedved',chair:'gedvedchair',coffee:'markskel',tv:'favrbo',rug:'stoense',lamp:'hansson'},
      japandi:{sofa:'hellerup',chair:'gedvedchair',coffee:'lejre',tv:'evetofte',rug:'lohals',lamp:'lauters'},
      luxus:{sofa:'applaryd',chair:'strandmondeep',coffee:'frotorp',tv:'tonstad',rug:'stoense',lamp:'stockholm'},
      ipari:{sofa:'egense',chair:'vejen',coffee:'sandby',tv:'fjallbo',rug:'stoense',lamp:'hansson'},
    },
    haloszoba:{
      modern:{bed:'malm',wardrobe:'kleppstad3',rug:'stoense',lamp:'nymane'},
      skandinav:{bed:'slattum',wardrobe:'kleppstad2',rug:'stoense',lamp:'lauters'},
      minimalista:{bed:'slattum',wardrobe:'kleppstad2',rug:'stoense',lamp:'hansson'},
      japandi:{bed:'malm',wardrobe:'kleppstad3',rug:'lohals',lamp:'lauters'},
      luxus:{bed:'kongsberg',wardrobe:'kleppstad3',rug:'stoense',lamp:'stockholm'},
      ipari:{bed:'malm',wardrobe:'kleppstad3',rug:'stoense',lamp:'hansson'},
    },
    etkezo:{
      modern:{dtable:'nordviken',dchair:'jonstrup',sideboard:'idanas',rug:'stoense',lamp:'nymane'},
      skandinav:{dtable:'alling',dchair:'jonstrup',sideboard:'havstasb',rug:'stoense',lamp:'lauters'},
      minimalista:{dtable:'alling',dchair:'jonstrup',sideboard:'havstasb',rug:'stoense',lamp:'hansson'},
      japandi:{dtable:'morbylanga',dchair:'bistrup',sideboard:'havstasb',rug:'lohals',lamp:'lauters'},
      luxus:{dtable:'morbylanga',dchair:'bistrup',sideboard:'idanas',rug:'stoense',lamp:'stockholm'},
      ipari:{dtable:'nordviken',dchair:'jonstrup',sideboard:'idanas',rug:'stoense',lamp:'hansson'},
    },
    konyha:{
      modern:{island:'vadholma',barstool:'stig',kcabinet:'ivar',lamp:'nymane'},
      skandinav:{island:'raskog',barstool:'stig',kcabinet:'ivar',lamp:'lauters'},
      minimalista:{island:'raskog',barstool:'stig',kcabinet:'ivar',lamp:'hansson'},
      japandi:{island:'raskog',barstool:'dalfred',kcabinet:'havstagl',lamp:'lauters'},
      luxus:{island:'vadholma',barstool:'dalfred',kcabinet:'havstagl',lamp:'stockholm'},
      ipari:{island:'vadholma',barstool:'stig',kcabinet:'ivar',lamp:'hansson'},
    },
    dolgozo:{
      modern:{desk:'micke',ochair:'millberget',shelf:'billy',rug:'stoense',lamp:'nymane'},
      skandinav:{desk:'lagkapten',ochair:'flintan',shelf:'kallax',rug:'stoense',lamp:'lauters'},
      minimalista:{desk:'lagkapten',ochair:'flintan',shelf:'kallax',rug:'stoense',lamp:'hansson'},
      japandi:{desk:'micke',ochair:'flintan',shelf:'billy',rug:'lohals',lamp:'lauters'},
      luxus:{desk:'micke',ochair:'millberget',shelf:'billy',rug:'stoense',lamp:'stockholm'},
      ipari:{desk:'stauning',ochair:'flintan',shelf:'kallax',rug:'stoense',lamp:'hansson'},
    },
    gyerek:{
      modern:{kbed:'slakt',kdesk:'pahl',wardrobe:'kleppstad2',shelf:'kallax',rug:'stoense',lamp:'nymane'},
      skandinav:{kbed:'slakt',kdesk:'pahl',wardrobe:'kleppstad2',shelf:'kallax',rug:'stoense',lamp:'lauters'},
      minimalista:{kbed:'slakt',kdesk:'pahl',wardrobe:'kleppstad2',shelf:'kallax',rug:'stoense',lamp:'hansson'},
      japandi:{kbed:'kura',kdesk:'pahl',wardrobe:'kleppstad2',shelf:'kallax',rug:'lohals',lamp:'lauters'},
      luxus:{kbed:'kura',kdesk:'micke',wardrobe:'kleppstad3',shelf:'billy',rug:'stoense',lamp:'stockholm'},
      ipari:{kbed:'kura',kdesk:'pahl',wardrobe:'kleppstad2',shelf:'kallax',rug:'stoense',lamp:'hansson'},
    },
  };

  function getSlots(){
    const rt=state.room, st=state.style, pr=PRIMARY[rt][st];
    if(rt==='nappali'){
      return [
        {id:'sofa',options:opts('sofa',pr.sofa)},
        {id:'chair',options:opts('chair',pr.chair)},
        {id:'coffee',options:opts('coffee',pr.coffee)},
        {id:'tv',options:opts('tv',pr.tv)},
        {id:'rug',options:opts('rug',pr.rug)},
        {id:'lamp',options:opts('lamp',pr.lamp)},
        {id:'curtain',options:opts('curtain',PA.curtain[st])},
        {id:'cushion',options:opts('cushion',PA.cushion[st])},
        {id:'vase',options:opts('vase',PA.vase[st])},
      ];
    } else if(rt==='haloszoba'){
      return [
        {id:'bed',options:opts('bed',pr.bed)},
        {id:'nightstand',options:single(NIGHTSTAND)},
        {id:'wardrobe',options:opts('wardrobe',pr.wardrobe)},
        {id:'rug',options:opts('rug',pr.rug)},
        {id:'lamp',options:opts('lamp',pr.lamp)},
        {id:'curtain',options:opts('curtain',PA.curtain[st])},
        {id:'bedding',options:single(BEDDING.default)},
      ];
    } else if(rt==='etkezo'){
      return [
        {id:'dtable',options:opts('dtable',pr.dtable)},
        {id:'dchair',options:opts('dchair',pr.dchair)},
        {id:'sideboard',options:opts('sideboard',pr.sideboard)},
        {id:'rug',options:opts('rug',pr.rug)},
        {id:'lamp',options:opts('lamp',pr.lamp)},
        {id:'curtain',options:opts('curtain',PA.curtain[st])},
      ];
    } else if(rt==='konyha'){
      return [
        {id:'island',options:opts('island',pr.island)},
        {id:'barstool',options:opts('barstool',pr.barstool)},
        {id:'kcabinet',options:opts('kcabinet',pr.kcabinet)},
        {id:'fridge',options:single(POOL.fridge[0])},
        {id:'lamp',options:opts('lamp',pr.lamp)},
        {id:'curtain',options:opts('curtain',PA.curtain[st])},
      ];
    } else if(rt==='dolgozo'){
      return [
        {id:'desk',options:opts('desk',pr.desk)},
        {id:'ochair',options:opts('ochair',pr.ochair)},
        {id:'shelf',options:opts('shelf',pr.shelf)},
        {id:'rug',options:opts('rug',pr.rug)},
        {id:'lamp',options:opts('lamp',pr.lamp)},
        {id:'curtain',options:opts('curtain',PA.curtain[st])},
      ];
    } else {
      return [
        {id:'kbed',options:opts('kbed',pr.kbed)},
        {id:'kdesk',options:opts('desk',pr.kdesk)},
        {id:'wardrobe',options:opts('wardrobe',pr.wardrobe)},
        {id:'shelf',options:opts('shelf',pr.shelf)},
        {id:'rug',options:opts('rug',pr.rug)},
        {id:'lamp',options:opts('lamp',pr.lamp)},
      ];
    }
  }

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
  const MARGIN=40;
  const STORE_LABEL={ikea:'IKEA',jysk:'JYSK',momax:'MÖMAX',mobelix:'MÖBELIX'};
  const storeBadge=s=>`<span class="store ${s}">${STORE_LABEL[s]||s.toUpperCase()}</span>`;
  const state={room:'nappali', style:'modern', off:new Set(), color:'white', budget:600000, sel:{}, pos:{}, openCmp:new Set(), lang:'hu', stores:new Set(['ikea','jysk','momax','mobelix']), search:'', house:[]};
  const fmt=n=>n.toLocaleString(state.lang==='hu'?'hu-HU':'en-US');

  // ---- I18N ----
  const T={
    hu:{try:'Próbáld ki',kicker:'Interaktív tervező · valódi árak',planner:'tervező',
      sub:'Válassz szobatípust és stílust, méretet, falszínt, keretet. A bútoroknál <strong>valódi alternatívák</strong> közül választhatsz (◀ ▶), az alaprajzon <strong>áthúzhatod</strong> a bútorokat, végül <strong>ajánlatot</strong> exportálhatsz ügyfélnek. Minden ár valódi, kattintható linkkel.',
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
      footL:'© 2026 HomeVision AI — Lakberendező tervező',footR:'Árak: ikea.com/hu, jysk.hu · '+PRICE_DATE,
      exTitle:'Berendezési ajánlat — HomeVision AI',exStyle:'stílus',exWall:'falszín',exNone:'nincs',exDate:'dátum',exCat:'Kategória',exProd:'Termék',exStore:'Bolt',exPrice:'Ár',exFurn:'Bútorok',exPaint:'Falfesték',exTotal:'Végösszeg',exNote:'Az árak tájékoztató jellegűek ('+PRICE_DATE+'), a boltok oldalán ellenőrizhetők. Készült a HomeVision AI tervezővel.',
      noneItem:'Nincs festés',belm:'belmagasság',shoppingBtn:'🛒 Bevásárlólista',slTitle:'Bevásárlólista — bolt szerint',slItems:'tétel',slTotal:'Végösszeg',slOpen:'Megnézem →',slPrint:'🖨️ Nyomtatás / PDF',slClose:'Bezárás',view3d:'🧊 3D nézet',d3Title:'3D nézet',d3Hint:'Húzd az egérrel a forgatáshoz · görgő = nagyítás',d3NoLib:'A 3D nézethez internet szükséges.',houseBtn:'🏠 Házam',saveRoomBtn:'💾 Mentés a házamba',houseTitle:'A házam — mentett szobák',houseEmpty:'Még nincs mentett szoba. Állíts össze egy szobát, és mentsd el a szobatípus nevével!',load:'Betöltés',del:'Törlés',houseTotal:'Teljes ház összesen',houseShop:'🛒 Teljes ház – bevásárlólista',shareBtn:'🔗 Megosztás linkkel',shareCopied:'✔ Link a vágólapon!',shareFail:'Másold ki a linket:',
      accSignIn:'Add meg az e-mail címed — belépő linket küldünk:',accSent:'✉️ Elküldve! Nyisd meg az e-mailben kapott linket.',accSignedIn:'Bejelentkezve:',accSignOut:'Kijelentkezés',accSynced:'☁ A Házam mentések mostantól a fiókodba is mentődnek.',accUpload:'Van {n} helyi mentésed. Feltöltsük a fiókodba?'},
    en:{try:'Try it',kicker:'Interactive planner · real prices',planner:'planner',
      sub:'Pick a room type and style, size, wall colour, budget. For every item you can choose from <strong>real alternatives</strong> (◀ ▶), <strong>drag</strong> the furniture on the floor plan, and export an <strong>offer</strong> for your client. Every price is real, with a clickable link.',
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
      footL:'© 2026 HomeVision AI — Interior planner',footR:'Prices: ikea.com/hu, jysk.hu · '+PRICE_DATE,
      exTitle:'Furnishing offer — HomeVision AI',exStyle:'style',exWall:'wall',exNone:'none',exDate:'date',exCat:'Category',exProd:'Product',exStore:'Store',exPrice:'Price',exFurn:'Furniture',exPaint:'Wall paint',exTotal:'Total',exNote:'Prices are indicative ('+PRICE_DATE+'), verify on the store pages. Made with the HomeVision AI planner.',
      noneItem:'No paint',belm:'ceiling',shoppingBtn:'🛒 Shopping list',slTitle:'Shopping list — by store',slItems:'items',slTotal:'Total',slOpen:'Open →',slPrint:'🖨️ Print / PDF',slClose:'Close',view3d:'🧊 3D view',d3Title:'3D view',d3Hint:'Drag to rotate · scroll = zoom',d3NoLib:'The 3D view needs an internet connection.',houseBtn:'🏠 My house',saveRoomBtn:'💾 Save to my house',houseTitle:'My house — saved rooms',houseEmpty:'No saved rooms yet. Design a room and save it under its room-type name!',load:'Load',del:'Delete',houseTotal:'Whole house total',houseShop:'🛒 Whole-house shopping list',shareBtn:'🔗 Share link',shareCopied:'✔ Link copied!',shareFail:'Copy this link:',
      accSignIn:'Enter your email — we will send a sign-in link:',accSent:'✉️ Sent! Open the link in the email.',accSignedIn:'Signed in:',accSignOut:'Sign out',accSynced:'☁ Your saved rooms now sync to your account.',accUpload:'You have {n} local saves. Upload them to your account?'},
  };
  const t=k=>T[state.lang][k];
  const CAT_EN={sofa:'Sofa',chair:'Armchair',coffee:'Coffee table',tv:'TV unit',rug:'Rug',lamp:'Floor lamp',curtain:'Curtain',cushion:'Cushion',vase:'Decor',bed:'Bed',nightstand:'Nightstand',wardrobe:'Wardrobe',bedding:'Bedding',dtable:'Dining table',dchair:'Dining chair',sideboard:'Sideboard',island:'Kitchen island',barstool:'Bar stool',kcabinet:'Storage cabinet',fridge:'Fridge',desk:'Desk',ochair:'Office chair',shelf:'Bookcase',kbed:'Kids bed',kdesk:'Kids desk'};
  const catName=id=>state.lang==='hu'?META[id].cat:(CAT_EN[id]||META[id].cat);
  const ROOM_LABEL={nappali:['Nappali','Living room'],haloszoba:['Hálószoba','Bedroom'],etkezo:['Étkező','Dining'],konyha:['Konyha','Kitchen'],dolgozo:['Dolgozószoba','Home office'],gyerek:['Gyerekszoba','Kids room']};
  const ROOM_LOWER={nappali:['nappali','living room'],haloszoba:['hálószoba','bedroom'],etkezo:['étkező','dining room'],konyha:['konyha','kitchen'],dolgozo:['dolgozószoba','home office'],gyerek:['gyerekszoba','kids room']};
  const STYLE_LABEL={modern:['Modern','Modern'],skandinav:['Skandináv','Scandinavian'],minimalista:['Minimalista','Minimalist'],japandi:['Japandi','Japandi'],luxus:['Luxus','Luxury'],ipari:['Ipari','Industrial']};
  const COLOR_EN={white:'Pure white',greige:'Warm greige',grey:'Light grey',sage:'Sage green',blue:'Misty blue',sand:'Sand beige',terra:'Terracotta',char:'Anthracite'};
  const li=i=>state.lang==='hu'?0:1;
  const keyOf=id=>state.room+':'+state.style+':'+id;

  function selIndex(id){
    const slot=getSlots().find(s=>s.id===id); const n=slot.options.length;
    let i=state.sel[keyOf(id)]||0; return Math.min(Math.max(i,0),n-1);
  }
  function allowedIdxs(slot){
    const a=slot.options.map((o,i)=>i).filter(i=>state.stores.has(slot.options[i].store));
    return a.length?a:slot.options.map((o,i)=>i);
  }
  function curItems(){
    return getSlots().map(slot=>{
      const allowed=allowedIdxs(slot);
      let sel=selIndex(slot.id);
      if(!allowed.includes(sel)){
        sel=allowed.reduce((b,i)=>slot.options[i].price<slot.options[b].price?i:b, allowed[0]);
        state.sel[keyOf(slot.id)]=sel;
      }
      const o=slot.options[sel], min=Math.min(...allowed.map(i=>slot.options[i].price));
      return {...META[slot.id], id:slot.id, ...o, optCount:allowed.length, optIndex:allowed.indexOf(sel), selFull:sel, minPrice:min, isCheapest:o.price===min, options:slot.options, allowed:allowed};
    });
  }
  function fits(it,RL,RS){ if(it.floor==='none') return true; const lo=Math.max(it.w,it.d),sh=Math.min(it.w,it.d); return lo<=RL-MARGIN&&sh<=RS-MARGIN; }
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
    let f=0; curItems().forEach(it=>{ if(fits(it,RL,RS)&&!state.off.has(it.id)) f+=it.price; });
    const p=computePaint(L,W,H).cost; return {furnTotal:f,paintTotal:p,grand:f+p};
  }
  function autoFit(){
    state.off=new Set();
    const PRIO={nappali:['vase','cushion','lamp','curtain','chair','tv','rug','coffee','sofa'],haloszoba:['bedding','lamp','curtain','nightstand','rug','wardrobe','bed'],etkezo:['lamp','curtain','rug','sideboard','dchair','dtable'],konyha:['lamp','curtain','fridge','kcabinet','barstool','island'],dolgozo:['lamp','curtain','rug','shelf','ochair','desk'],gyerek:['lamp','rug','shelf','wardrobe','kdesk','kbed']};
    const pr=PRIO[state.room];
    for(const id of pr){ if(computeCosts().grand<=state.budget) break; if(curItems().some(x=>x.id===id)) state.off.add(id); }
    render();
  }

  function drawBlock(P,x,y,w,h,fill,stroke,icon,dragId){
    const dattr=dragId?` data-drag="${dragId}" data-x="${P+x}" data-y="${P+y}" style="cursor:grab"`:'';
    return `<g transform="translate(${P+x},${P+y})"${dattr}><rect width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="3"/><text x="${w/2}" y="${h/2}" font-size="44" text-anchor="middle" dominant-baseline="central">${icon}</text></g>`;
  }
  function buildPlan(L,W,drawn,wallHex){
    const roomW=Math.max(L,W)*100,roomH=Math.min(L,W)*100,P=32,vw=roomW+2*P,vh=roomH+2*P;
    const clampX=(x,w)=>Math.max(6,Math.min(x,roomW-w-6)), clampY=(y,h)=>Math.max(6,Math.min(y,roomH-h-6));
    let anchors={}, order=[];
    if(state.room==='nappali'){
      anchors={tv:[(roomW-120)/2,10],sofa:[(roomW-224)/2,roomH-90-10],coffee:[(roomW-110)/2,roomH/2+10],armchair:[12,roomH-96-12],lamp:[12,12]};
      order=['rug','sofa','coffee','tv','armchair','lamp'];
    } else if(state.room==='haloszoba'){
      const bed=drawn.find(x=>x.plan==='bed'); const bw=bed?bed.w:160;
      anchors={bed:[(roomW-bw)/2,12],wardrobe:[roomW-130,roomH-55-10],lamp:[roomW-42,12]};
      order=['rug','bed','nightstands','wardrobe','lamp'];
    } else if(state.room==='etkezo'){
      const dt=drawn.find(x=>x.plan==='dtable'); const tw=dt?dt.w:140, th=dt?dt.d:85;
      anchors={dtable:[(roomW-tw)/2,(roomH-th)/2],sideboard:[roomW-135,roomH-50-10],lamp:[12,12]};
      order=['rug','dtable','dchairs','sideboard','lamp'];
    } else if(state.room==='konyha'){
      const isl=drawn.find(x=>x.plan==='island'); const iw=isl?isl.w:120, ih=isl?isl.d:80;
      anchors={island:[(roomW-iw)/2,(roomH-ih)/2-20],kcabinet:[12,10],fridge:[roomW-66,10],lamp:[12,roomH-52]};
      order=['kcabinet','island','barstools','fridge','lamp'];
    } else if(state.room==='dolgozo'){
      const dk=drawn.find(x=>x.plan==='desk'); const dw=dk?dk.w:120, dd=dk?dk.d:60;
      anchors={desk:[(roomW-dw)/2,10],ochair:[(roomW-70)/2,10+dd+14],shelf:[12,roomH-40-10],lamp:[roomW-42,10]};
      order=['rug','desk','ochair','shelf','lamp'];
    } else {
      const kd=drawn.find(x=>x.plan==='kdesk'); const kw=kd?kd.w:96;
      anchors={kbed:[12,12],kdesk:[roomW-kw-12,12],wardrobe:[roomW-130,roomH-55-10],shelf:[12,roomH-40-10],lamp:[(roomW-30)/2,(roomH-40)/2]};
      order=['rug','kbed','kdesk','wardrobe','shelf','lamp'];
    }
    let blocks='';
    order.forEach(key=>{
      const it=drawn.find(x=>x.plan===key); if(!it) return;
      if(key==='nightstands'){
        const bed=drawn.find(x=>x.plan==='bed'); const bw=bed?bed.w:160; const bp=state.pos[keyOf('bed')]; const bx=bp?bp.x:(roomW-bw)/2, by=bp?bp.y:12;
        const nw=35,nh=40;
        [clampX(bx-nw-8,nw), clampX(bx+bw+8,nw)].forEach(nx=>{ blocks+=drawBlock(P,nx,clampY(by,nh),nw,nh,'#9aa6b2','#64748b',it.icon,null); });
        return;
      }
      if(key==='dchairs'){
        const dt=drawn.find(x=>x.plan==='dtable'); const tw=dt?dt.w:140, th=dt?dt.d:85; const tp=state.pos[keyOf('dtable')]; const tx=tp?tp.x:(roomW-tw)/2, ty=tp?tp.y:(roomH-th)/2;
        const cw=44,ch=46;
        [tx+tw*0.22-cw/2, tx+tw*0.78-cw/2].forEach(cx=>{ blocks+=drawBlock(P,clampX(cx,cw),clampY(ty-ch-4,ch),cw,ch,'#9aa6b2','#64748b',it.icon,null); blocks+=drawBlock(P,clampX(cx,cw),clampY(ty+th+4,ch),cw,ch,'#9aa6b2','#64748b',it.icon,null); });
        return;
      }
      if(key==='barstools'){
        const isl=drawn.find(x=>x.plan==='island'); const iw=isl?isl.w:120, ih=isl?isl.d:80; const ip=state.pos[keyOf('island')]; const ix=ip?ip.x:(roomW-iw)/2, iy=ip?ip.y:(roomH-ih)/2-20;
        const sw=42,sh=42;
        [ix+iw*0.30-sw/2, ix+iw*0.65-sw/2].forEach(sx=>{ blocks+=drawBlock(P,clampX(sx,sw),clampY(iy+ih+6,sh),sw,sh,'#9aa6b2','#64748b',it.icon,null); });
        return;
      }
      let w=(key==='rug')?Math.max(it.w,it.d):it.w, h=(key==='rug')?Math.min(it.w,it.d):it.d;
      let ax,ay;
      const custom=state.pos[keyOf(it.id)];
      if(custom){ ax=custom.x; ay=custom.y; }
      else if(key==='rug'){ if(state.room==='haloszoba'){ax=(roomW-300)/2;ay=roomH*0.5;} else {ax=(roomW-w)/2;ay=(roomH-h)/2;} }
      else { [ax,ay]=anchors[key]; }
      ax=clampX(ax,w); ay=clampY(ay,h);
      const fill=key==='rug'?'#e7ded0':'#9aa6b2', stroke=key==='rug'?'#cbb995':'#64748b';
      blocks+=drawBlock(P,ax,ay,w,h,fill,stroke,it.icon,it.id);
    });
    const doorX=P+40,doorW=80;
    return `<svg class="plan" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
      <rect x="${P}" y="${P}" width="${roomW}" height="${roomH}" fill="${wallHex}" stroke="#334155" stroke-width="10"/>
      <rect x="${doorX}" y="${P+roomH-5}" width="${doorW}" height="12" fill="${wallHex}"/>
      <path d="M ${doorX} ${P+roomH} a ${doorW} ${doorW} 0 0 0 ${doorW} ${-doorW}" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="6 6"/>
      ${blocks}
      <text x="${vw/2}" y="${P/1.4}" font-size="34" text-anchor="middle" fill="#94a3b8">${Math.max(L,W).toLocaleString('hu-HU')} m</text>
      <text x="${P/1.4}" y="${vh/2}" font-size="34" text-anchor="middle" fill="#94a3b8" transform="rotate(-90 ${P/1.4} ${vh/2})">${Math.min(L,W).toLocaleString('hu-HU')} m</text>
    </svg>`;
  }
  function attachDrag(){
    const svg=document.querySelector('svg.plan'); if(!svg) return;
    const vb=svg.viewBox.baseVal, P=32;
    let cur=null;
    svg.querySelectorAll('[data-drag]').forEach(g=>{
      g.addEventListener('pointerdown',e=>{
        const rect=svg.getBoundingClientRect(), scale=vb.width/rect.width;
        cur={g,id:g.getAttribute('data-drag'),sx:e.clientX,sy:e.clientY,ox:+g.getAttribute('data-x'),oy:+g.getAttribute('data-y'),scale};
        g.setPointerCapture(e.pointerId); g.style.cursor='grabbing'; e.preventDefault();
      });
      g.addEventListener('pointermove',e=>{
        if(!cur||cur.g!==g) return;
        cur.nx=cur.ox+(e.clientX-cur.sx)*cur.scale; cur.ny=cur.oy+(e.clientY-cur.sy)*cur.scale;
        g.setAttribute('transform',`translate(${cur.nx},${cur.ny})`);
      });
      const done=()=>{ if(!cur) return; if(cur.nx!=null){ state.pos[keyOf(cur.id)]={x:cur.nx-P,y:cur.ny-P}; } g.style.cursor='grab'; const c=cur; cur=null; if(c.nx!=null) render(); };
      g.addEventListener('pointerup',done);
      g.addEventListener('pointercancel',done);
    });
  }

  function buildTabs(){
    const rt=document.getElementById('roomtabs');
    rt.innerHTML=ROOMS.map(r=>`<div class="tab room ${state.room===r.id?'sel':''}" data-r="${r.id}">${ROOM_LABEL[r.id][li()]}</div>`).join('');
    rt.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{state.room=el.dataset.r;state.off=new Set();render();}));
    const stb=document.getElementById('styletabs');
    stb.innerHTML=STYLES.map(s=>`<div class="tab ${state.style===s.id?'sel':''}" data-s="${s.id}">${STYLE_LABEL[s.id][li()]}</div>`).join('');
    stb.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>{state.style=el.dataset.s;state.off=new Set();render();}));
  }
  function applyStatic(){
    document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n);});
    document.querySelectorAll('[data-i18n-html]').forEach(e=>{e.innerHTML=t(e.dataset.i18nHtml);});
    document.querySelectorAll('[data-i18n-ph]').forEach(e=>{e.placeholder=t(e.dataset.i18nPh);});
    document.getElementById('plannerWord').textContent=t('planner');
    document.getElementById('langBtn').textContent=state.lang==='hu'?'EN':'HU';
    const hb=document.getElementById('houseBtn'); if(hb) hb.textContent=t('houseBtn')+' ('+state.house.length+')';
  }
  function buildPalette(){
    const el=document.getElementById('palette');
    let html=COLORS.map(c=>`<div class="swatch ${state.color===c.id?'sel':''}" data-c="${c.id}"><div class="chip" style="background:${c.hex}"></div>${state.lang==='hu'?c.name:(COLOR_EN[c.id]||c.name)}</div>`).join('');
    html+=`<div class="swatch none ${state.color==='none'?'sel':''}" data-c="none"><div class="chip">∅</div>${t('noneItem')}</div>`;
    el.innerHTML=html;
    el.querySelectorAll('.swatch').forEach(s=>s.addEventListener('click',()=>{state.color=s.dataset.c;render();}));
  }
  const wallHex=()=>{const c=COLORS.find(x=>x.id===state.color);return c?c.hex:'#ffffff';};
  function buildStoreChips(){
    const el=document.getElementById('storechips'); if(!el) return;
    el.innerHTML=['ikea','jysk','momax','mobelix'].map(s=>`<span class="schip ${state.stores.has(s)?'on':''}" data-s="${s}">${STORE_LABEL[s]}</span>`).join('');
    el.querySelectorAll('.schip').forEach(c=>c.addEventListener('click',()=>{ const s=c.dataset.s; if(state.stores.has(s)){ if(state.stores.size>1) state.stores.delete(s); } else state.stores.add(s); render(); }));
  }

  function render(){
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100,roomArea=(L*W)*10000;
    const list=curItems();
    applyStatic();
    document.getElementById('styleName').textContent=STYLE_LABEL[state.style][li()];
    document.getElementById('roomName').textContent=ROOM_LOWER[state.room][li()];
    const q=(state.search||'').trim().toLowerCase();

    const listEl=document.getElementById('list'); listEl.innerHTML='';
    let furnTotal=0,furnArea=0,fitCount=0,onCount=0; const drawn=[];
    list.forEach(it=>{
      const ok=fits(it,RL,RS); if(ok) fitCount++;
      const on=ok&&!state.off.has(it.id);
      if(on){ furnTotal+=it.price; onCount++; if(it.floor==='furniture') furnArea+=it.w*it.d; if(it.plan) drawn.push(it); }
      if(q && !(it.name.toLowerCase().includes(q) || catName(it.id).toLowerCase().includes(q))) return;
      const badge=ok?'':`<span class="badge-nofit">${t('nofit')}</span>`;
      let swap='',cmp='';
      if(it.optCount>1){
        const cheap=it.isCheapest?`<span class="cheap best">${t('cheapest')}</span>`:`<span class="cheap">${t('cheaperPre')}<b>${fmt(it.minPrice)} Ft</b></span>`;
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
      el.innerHTML=`<input type="checkbox" class="chk" ${on?'checked':''} ${ok?'':'disabled'} data-id="${it.id}"><div class="thumb">${it.icon}</div><div class="info"><div class="name">${it.name}</div><div class="meta"><span class="dims">${it.w} × ${it.d} cm</span> · ${catName(it.id)} ${storeBadge(it.store)}${badge}</div>${swap}${cmp}</div><div class="right"><div class="price">${fmt(it.price)} Ft</div><a class="buy" href="${it.url}" target="_blank" rel="noopener">${t('buy')}</a></div>`;
      listEl.appendChild(el);
    });
    listEl.querySelectorAll('.chk').forEach(c=>c.addEventListener('change',()=>{ if(c.checked) state.off.delete(c.dataset.id); else state.off.add(c.dataset.id); render(); }));
    listEl.querySelectorAll('.sbtn').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id,dir=+b.dataset.dir; const slot=getSlots().find(s=>s.id===id); const allowed=allowedIdxs(slot); let pos=allowed.indexOf(selIndex(id)); if(pos<0) pos=0; state.sel[keyOf(id)]=allowed[(pos+dir+allowed.length)%allowed.length]; render(); }));
    listEl.querySelectorAll('.cmpbtn').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.cmp; state.openCmp.has(id)?state.openCmp.delete(id):state.openCmp.add(id); render(); }));
    listEl.querySelectorAll('.cmprow').forEach(r=>r.addEventListener('click',()=>{ state.sel[keyOf(r.dataset.id)]=+r.dataset.idx; render(); }));

    const paint=computePaint(L,W,H), paintTotal=paint.cost;
    document.getElementById('paintcalc').innerHTML=paint.html;
    document.getElementById('plan').innerHTML=buildPlan(L,W,drawn,wallHex());
    attachDrag();
    document.getElementById('wallDot').style.background=wallHex();
    buildPalette(); buildTabs(); buildStoreChips();

    const grand=furnTotal+paintTotal;
    document.getElementById('grand').textContent=fmt(grand);
    document.getElementById('furnTotal').textContent=fmt(furnTotal)+' Ft';
    document.getElementById('paintTotal').textContent=fmt(paintTotal)+' Ft';
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
    let rows='', furn=0;
    curItems().forEach(it=>{ const ok=fits(it,RL,RS), on=ok&&!state.off.has(it.id); if(!on) return; furn+=it.price;
      rows+=`<tr><td>${catName(it.id)}</td><td>${it.name}</td><td>${STORE_LABEL[it.store]||it.store.toUpperCase()}</td><td class="r">${fmt(it.price)} Ft</td></tr>`; });
    const paint=computePaint(L,W,H); const grand=furn+paint.cost;
    const svg=document.querySelector('#plan svg') ? document.querySelector('#plan').innerHTML : '';
    document.getElementById('printArea').innerHTML=
      `<div class="pa-h">${t('exTitle')}</div>
       <div class="pa-meta">${roomLabel} · ${styleLabel} ${t('exStyle')} · ${L} × ${W} m (${t('belm')} ${H} m) · ${t('exWall')}: ${colorName} · ${t('exDate')}: ${PRICE_DATE}</div>
       <div class="pa-plan">${svg}</div>
       <table><thead><tr><th>${t('exCat')}</th><th>${t('exProd')}</th><th>${t('exStore')}</th><th class="r">${t('exPrice')}</th></tr></thead><tbody>${rows}</tbody></table>
       <div class="pa-tot">${t('exFurn')}: <b>${fmt(furn)} Ft</b> &nbsp;·&nbsp; ${t('exPaint')}: <b>${fmt(paint.cost)} Ft</b><br><span class="g">${t('exTotal')}: ${fmt(grand)} Ft</span></div>
       <div class="pa-meta" style="margin-top:14px;">${t('exNote')}</div>`;
    window.print();
  }

  ['len','wid','hei'].forEach(id=>document.getElementById(id).addEventListener('input',render));
  document.querySelectorAll('.preset').forEach(b=>{ if(b.id==='autofit') return; b.addEventListener('click',()=>{document.getElementById('len').value=b.dataset.l;document.getElementById('wid').value=b.dataset.w;render();}); });
  const bRange=document.getElementById('budgetRange'),bNum=document.getElementById('budgetNum');
  bRange.addEventListener('input',()=>{state.budget=+bRange.value;bNum.value=bRange.value;render();});
  bNum.addEventListener('input',()=>{state.budget=+bNum.value||0;bRange.value=Math.min(Math.max(state.budget,+bRange.min),+bRange.max);render();});
  document.getElementById('autofit').addEventListener('click',autoFit);
  document.getElementById('resetLayout').addEventListener('click',()=>{ Object.keys(state.pos).forEach(k=>{ if(k.startsWith(state.room+':'+state.style+':')) delete state.pos[k]; }); render(); });
  document.getElementById('exportBtn').addEventListener('click',exportOffer);
  document.getElementById('exportBtn2').addEventListener('click',exportOffer);

  function shoppingGroups(){
    const L=len(),W=wid(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100;
    const g={}; let grand=0;
    curItems().forEach(it=>{ const ok=fits(it,RL,RS), on=ok&&!state.off.has(it.id); if(!on) return; grand+=it.price; (g[it.store]=g[it.store]||[]).push(it); });
    const order=['ikea','jysk','momax','mobelix'];
    return {groups:order.filter(s=>g[s]).map(s=>({store:s,items:g[s],sub:g[s].reduce((a,x)=>a+x.price,0)})), grand};
  }
  function openShopping(){
    const {groups,grand}=shoppingGroups();
    let html=`<div class="slbox"><div class="slhead"><h3>${t('slTitle')}</h3><button class="slclose" id="slX">✕</button></div>`;
    groups.forEach(gr=>{
      html+=`<div class="slstore"><div class="sst"><span>${storeBadge(gr.store)} <span style="color:var(--muted);font-size:12.5px;">${gr.items.length} ${t('slItems')}</span></span><span class="sub">${fmt(gr.sub)} Ft</span></div>`;
      gr.items.forEach(it=>{ html+=`<div class="slitem"><span class="in">${it.icon} ${it.name}</span><span class="ip">${fmt(it.price)} Ft</span><a href="${it.url}" target="_blank" rel="noopener">${t('slOpen')}</a></div>`; });
      html+=`</div>`;
    });
    html+=`<div class="slgrand"><span>${t('slTotal')}</span><span>${fmt(grand)} Ft</span></div><div class="slbtns"><button class="pr" id="slPrint">${t('slPrint')}</button><button class="cl" id="slX2">${t('slClose')}</button></div></div>`;
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
    document.getElementById('printArea').innerHTML=`<div class="pa-h">${t('slTitle')}</div><div class="pa-meta">HomeVision AI · ${PRICE_DATE}</div><table><tbody>${rows}</tbody></table><div class="pa-tot"><span class="g">${t('slTotal')}: ${fmt(grand)} Ft</span></div>`;
    window.print();
  }
  document.getElementById('shopBtn').addEventListener('click',openShopping);

  // ---- 3D NÉZET ----
  function drawnList(){
    const L=len(),W=wid(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100; const arr=[];
    curItems().forEach(it=>{ const ok=fits(it,RL,RS), on=ok&&!state.off.has(it.id); if(on&&it.plan) arr.push(it); });
    return arr;
  }
  const H3={sofa:80,chair:95,coffee:42,tv:48,rug:2,lamp:150,bed:45,nightstand:45,wardrobe:180,dtable:75,dchair:90,sideboard:80,island:90,barstool:72,kcabinet:120,fridge:180,desk:75,ochair:100,shelf:180,kbed:45,kdesk:65};
  function placements3D(L,W,drawn){
    const roomW=Math.max(L,W)*100,roomH=Math.min(L,W)*100;
    const cX=(x,w)=>Math.max(6,Math.min(x,roomW-w-6)), cY=(y,h)=>Math.max(6,Math.min(y,roomH-h-6));
    let anchors={}, order=[];
    if(state.room==='nappali'){ anchors={tv:[(roomW-120)/2,10],sofa:[(roomW-224)/2,roomH-90-10],coffee:[(roomW-110)/2,roomH/2+10],armchair:[12,roomH-96-12],lamp:[12,12]}; order=['rug','sofa','coffee','tv','armchair','lamp']; }
    else if(state.room==='haloszoba'){ const bed=drawn.find(x=>x.plan==='bed'); const bw=bed?bed.w:160; anchors={bed:[(roomW-bw)/2,12],wardrobe:[roomW-130,roomH-55-10],lamp:[roomW-42,12]}; order=['rug','bed','nightstands','wardrobe','lamp']; }
    else if(state.room==='etkezo'){ const dt=drawn.find(x=>x.plan==='dtable'); const tw=dt?dt.w:140, th=dt?dt.d:85; anchors={dtable:[(roomW-tw)/2,(roomH-th)/2],sideboard:[roomW-135,roomH-50-10],lamp:[12,12]}; order=['rug','dtable','dchairs','sideboard','lamp']; }
    else if(state.room==='konyha'){ const isl=drawn.find(x=>x.plan==='island'); const iw=isl?isl.w:120, ih=isl?isl.d:80; anchors={island:[(roomW-iw)/2,(roomH-ih)/2-20],kcabinet:[12,10],fridge:[roomW-66,10],lamp:[12,roomH-52]}; order=['kcabinet','island','barstools','fridge','lamp']; }
    else if(state.room==='dolgozo'){ const dk=drawn.find(x=>x.plan==='desk'); const dw=dk?dk.w:120, dd=dk?dk.d:60; anchors={desk:[(roomW-dw)/2,10],ochair:[(roomW-70)/2,10+dd+14],shelf:[12,roomH-40-10],lamp:[roomW-42,10]}; order=['rug','desk','ochair','shelf','lamp']; }
    else { const kd=drawn.find(x=>x.plan==='kdesk'); const kw=kd?kd.w:96; anchors={kbed:[12,12],kdesk:[roomW-kw-12,12],wardrobe:[roomW-130,roomH-55-10],shelf:[12,roomH-40-10],lamp:[(roomW-30)/2,(roomH-40)/2]}; order=['rug','kbed','kdesk','wardrobe','shelf','lamp']; }
    const out=[]; const push=(id,x,y,w,d)=>{ x=cX(x,w); y=cY(y,d); out.push({kind:id,cx:x+w/2,cy:y+d/2,w,d,h:(H3[id]||60),rug:(META[id]&&META[id].floor==='rug')}); };
    order.forEach(key=>{ const it=drawn.find(x=>x.plan===key); if(!it) return;
      if(key==='nightstands'){ const bed=drawn.find(x=>x.plan==='bed'); const bw=bed?bed.w:160; const bp=state.pos[keyOf('bed')]; const bx=bp?bp.x:(roomW-bw)/2, by=bp?bp.y:12; [bx-43,bx+bw+8].forEach(nx=>push('nightstand',nx,by,35,40)); return; }
      if(key==='dchairs'){ const dt=drawn.find(x=>x.plan==='dtable'); const tw=dt?dt.w:140, th=dt?dt.d:85; const tp=state.pos[keyOf('dtable')]; const tx=tp?tp.x:(roomW-tw)/2, ty=tp?tp.y:(roomH-th)/2; [tx+tw*0.22-22,tx+tw*0.78-22].forEach(cx=>{ push('dchair',cx,ty-50,44,46); push('dchair',cx,ty+th+4,44,46); }); return; }
      if(key==='barstools'){ const isl=drawn.find(x=>x.plan==='island'); const iw=isl?isl.w:120, ih=isl?isl.d:80; const ip=state.pos[keyOf('island')]; const ix=ip?ip.x:(roomW-iw)/2, iy=ip?ip.y:(roomH-ih)/2-20; [ix+iw*0.30-21,ix+iw*0.65-21].forEach(sx=>push('barstool',sx,iy+ih+6,42,42)); return; }
      let w=(key==='rug')?Math.max(it.w,it.d):it.w, d=(key==='rug')?Math.min(it.w,it.d):it.d;
      let x,y; const cu=state.pos[keyOf(it.id)];
      if(cu){ x=cu.x; y=cu.y; } else if(key==='rug'){ if(state.room==='haloszoba'){x=(roomW-300)/2;y=roomH*0.5;} else {x=(roomW-w)/2;y=(roomH-d)/2;} } else { [x,y]=anchors[key]; }
      push(it.id,x,y,w,d);
    });
    return out;
  }
  let R3={};
  function close3D(){ if(R3.stop)R3.stop(); if(R3.dom&&R3.onwheel)R3.dom.removeEventListener('wheel',R3.onwheel); R3={}; document.getElementById('d3Overlay').style.display='none'; }
  function open3D(){
    const ov=document.getElementById('d3Overlay');
    ov.innerHTML=`<div class="slbox" style="max-width:760px;"><div class="slhead"><h3>${t('d3Title')}</h3><button class="slclose" id="d3X">✕</button></div><div id="d3canvas" style="width:100%;height:440px;border-radius:14px;overflow:hidden;background:${document.body.classList.contains('dark')?'#12151b':'#eef1f5'};touch-action:none;"></div><div style="font-size:12.5px;color:var(--muted);margin-top:10px;">${t('d3Hint')}</div><div class="slbtns"><button class="cl" id="d3X2">${t('slClose')}</button></div></div>`;
    ov.style.display='flex';
    document.getElementById('d3X').onclick=close3D; document.getElementById('d3X2').onclick=close3D;
    ov.onclick=e=>{ if(e.target===ov) close3D(); };
    init3D();
  }
  function init3D(){
    const cont=document.getElementById('d3canvas');
    // Ha a Three.js modul betöltött (viewer3d.js), a valódi 3D nézetet használjuk.
    // Ha nem (pl. nincs internet), automatikusan a régi, beépített canvas-nézet fut.
    if(window.HV3D){
      const L=len(),Wd=wid(),Hh=hei();
      const dispose=window.HV3D.mount(cont,{ roomW:Math.max(L,Wd), roomD:Math.min(L,Wd), roomH:Hh,
        wallColor:wallHex(), floorColor:'#cbb48d', items:placements3D(L,Wd,drawnList()) });
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
      boxes.push({min:[X-w/2,0,Z-d/2],max:[X+w/2,h,Z+d/2],color:b.rug?'#d8c6a0':'#9aa6b6'}); });
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
    const L=len(),W=wid(),H=hei(),RL=Math.max(L,W)*100,RS=Math.min(L,W)*100; const items=[]; let furn=0;
    curItems().forEach(it=>{ const ok=fits(it,RL,RS), on=ok&&!state.off.has(it.id); if(!on)return; furn+=it.price; items.push({cat:catName(it.id),name:it.name,store:it.store,price:it.price,url:it.url}); });
    const paint=computePaint(L,W,H).cost; return {items,furn,paint,grand:furn+paint,L,W,H};
  }
  function saveRoom(){
    const snap=currentSnapshot(), label=ROOM_LABEL[state.room][li()];
    const n=state.house.filter(r=>r.roomId===state.room).length, name=label+(n>0?(' '+(n+1)):'');
    state.house.push({ id:'h'+Date.now()+Math.random().toString(36).slice(2,6), name, roomId:state.room, styleLabel:STYLE_LABEL[state.style][li()], sizeStr:snap.L+'×'+snap.W+' m', total:snap.grand, items:snap.items,
      config:{room:state.room,style:state.style,len:snap.L,wid:snap.W,hei:snap.H,color:state.color,budget:state.budget,sel:JSON.parse(JSON.stringify(state.sel)),off:[...state.off],pos:JSON.parse(JSON.stringify(state.pos))} });
    saveHouse(); openHouse();
  }
  function loadRoom(r){ const c=r.config; document.getElementById('len').value=c.len; document.getElementById('wid').value=c.wid; document.getElementById('hei').value=c.hei; state.room=c.room; state.style=c.style; state.color=c.color; state.budget=c.budget; document.getElementById('budgetNum').value=c.budget; document.getElementById('budgetRange').value=Math.min(Math.max(c.budget,100000),1200000); state.sel=JSON.parse(JSON.stringify(c.sel||{})); state.off=new Set(c.off||[]); state.pos=JSON.parse(JSON.stringify(c.pos||{})); closeHouse(); render(); }
  function closeHouse(){ document.getElementById('houseOverlay').style.display='none'; }
  function printHouseShopping(){
    const g={}; let grand=0; const order=['ikea','jysk','momax','mobelix'];
    state.house.forEach(r=>r.items.forEach(it=>{ grand+=it.price; (g[it.store]=g[it.store]||[]).push(it); }));
    let rows=''; order.filter(s=>g[s]).forEach(s=>{ const sub=g[s].reduce((a,x)=>a+x.price,0); rows+=`<tr><td colspan="2" style="padding-top:14px;font-weight:800;border-bottom:none;">${STORE_LABEL[s]} — ${fmt(sub)} Ft</td></tr>`; g[s].forEach(it=>{ rows+=`<tr><td>${it.name}</td><td class="r">${fmt(it.price)} Ft</td></tr>`; }); });
    document.getElementById('printArea').innerHTML=`<div class="pa-h">${t('houseTitle')} — ${t('slTitle')}</div><div class="pa-meta">HomeVision AI · ${PRICE_DATE}</div><table><tbody>${rows}</tbody></table><div class="pa-tot"><span class="g">${t('slTotal')}: ${fmt(grand)} Ft</span></div>`;
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
    // Ugyanaz a config objektum, mint a saveRoom-ban — egy formátum, több felhasználás.
    return {room:state.room,style:state.style,len:len(),wid:wid(),hei:hei(),color:state.color,budget:state.budget,
      sel:JSON.parse(JSON.stringify(state.sel)),off:[...state.off],pos:JSON.parse(JSON.stringify(state.pos))};
  }
  function makeShareLink(){
    const encoded=LZString.compressToEncodedURIComponent(JSON.stringify(currentConfig()));
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
    }catch(e){} // hibás/csonka link: az app simán alaphelyzetből indul
  }
  document.getElementById('shareBtn').addEventListener('click',shareRoom);

  // ---- FIÓK + FELHŐ-MENTÉS (Supabase, lásd cloud.js) ----
  // Ha a cloud.js nincs konfigurálva, a gomb rejtve marad, minden megy localStorage-ból.
  if(window.HVCloud&&window.HVCloud.enabled){
    const accBtn=document.getElementById('accountBtn');
    accBtn.style.display='';
    accBtn.addEventListener('click',async()=>{
      const u=window.HVCloud.getUser();
      if(!u){
        const email=prompt(t('accSignIn')); if(!email) return;
        const err=await window.HVCloud.signIn(email.trim());
        alert(err?('Hiba: '+err):t('accSent'));
      } else {
        if(confirm(t('accSignedIn')+' '+u.email+'\n\n'+t('accSignOut')+'?')) await window.HVCloud.signOut();
      }
    });
    // Bejelentkezéskor: felhő és helyi mentések összefésülése
    window.HVCloud.onAuthChange=async(u)=>{
      accBtn.textContent=u?'☁':'👤'; accBtn.title=u?(t('accSignedIn')+' '+u.email):'Fiók';
      if(!u) return;
      const cloud=await window.HVCloud.fetchHouse();
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
  }

  loadHouse();
  loadFromHash();
  document.getElementById('themeBtn').addEventListener('click',()=>{
    const dark=document.body.classList.toggle('dark');
    document.getElementById('themeBtn').textContent=dark?'☀️':'🌙';
  });
  document.getElementById('langBtn').addEventListener('click',()=>{ state.lang=state.lang==='hu'?'en':'hu'; render(); });
  document.getElementById('searchBox').addEventListener('input',e=>{ state.search=e.target.value; render(); });
  document.getElementById('cheapAll').addEventListener('click',()=>{
    getSlots().forEach(slot=>{ const allowed=allowedIdxs(slot); const best=allowed.reduce((b,i)=>slot.options[i].price<slot.options[b].price?i:b, allowed[0]); state.sel[keyOf(slot.id)]=best; });
    render();
  });

  render();

  // ---- ÉLŐ ÁRAK (prices.json — naponta frissíti a GitHub Actions robot) ----
  const HU_MONTHS=['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
  const EN_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  function refreshDateTexts(){
    // A T-beli szövegek betöltéskor épülnek — új dátumnál újraírjuk őket
    T.hu.note='Az árak <strong>'+PRICE_DATE_HU+'</strong> tájékoztató árak. A pontos árat a termék oldalán ellenőrizd.';
    T.en.note='Prices are indicative, as of <strong>'+PRICE_DATE_EN+'</strong>. Check the exact price on the product page.';
    T.hu.footR='Árak: ikea.com/hu, jysk.hu · '+PRICE_DATE;
    T.en.footR='Prices: ikea.com/hu, jysk.hu · '+PRICE_DATE;
    T.hu.exNote='Az árak tájékoztató jellegűek ('+PRICE_DATE+'), a boltok oldalán ellenőrizhetők. Készült a HomeVision AI tervezővel.';
    T.en.exNote='Prices are indicative ('+PRICE_DATE+'), verify on the store pages. Made with the HomeVision AI planner.';
  }
  function applyLivePrices(data){
    if(!data||!data.prices) return;
    // Minden terméklistán végigmegyünk; az URL a termék egyedi azonosítója
    const lists=[...Object.values(POOL),Object.values(CURTAIN),Object.values(CUSHION),Object.values(VASE),[NIGHTSTAND],Object.values(BEDDING)];
    let n=0;
    lists.forEach(arr=>arr.forEach(p=>{ const np=data.prices[p.url]; if(np&&np!==p.price){ p.price=np; n++; } }));
    if(data.date&&/^\d{4}-\d{2}-\d{2}$/.test(data.date)){
      const [y,mo,d]=data.date.split('-').map(Number);
      PRICE_DATE=data.date;
      PRICE_DATE_HU=y+'. '+HU_MONTHS[mo-1]+' '+d+'-i';
      PRICE_DATE_EN=d+' '+EN_MONTHS[mo-1]+' '+y;
      refreshDateTexts();
    }
    if(n||data.date) render(); // friss árakkal/dátummal újrarajzolás
  }
  fetch('prices.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(applyLivePrices).catch(()=>{}); // ha nincs még prices.json, marad minden a beépített áron
