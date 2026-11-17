// DREAMR — közös elhelyezőmotor az alaprajzhoz és a 3D-nézethez (5. szakasz, R03–R04)
// Tiszta függvények, DOM nélkül: böngészőben window.DRLayout, Node-ban require('./layout.js').
//
// Egy helyen dől el, hová kerül egy bútor, és ugyanaz a szabály érvényes az alaprajzi és a 3D-s mozgatásra:
//  • szobahatár (6 cm faltávolság), 90°-os forgatás (a csak elforgatva férő bútor is elhelyezhető),
//  • magasság (ha a bútor magasabb a belmagasságnál, nem kerül be), falra szerelt elem (falhoz tapad,
//    alatta alacsony bútor maradhat), átfedés (5 cm hézag; a szőnyeg alá-fölé mehet),
//  • R04: az ajtónyitás területére semmi nem kerülhet (a szőnyeg kivételével); a székek kihúzásához és a
//    szekrényajtók nyitásához szükséges hely jelzés (figyelmeztetés), nem tiltás — a felület kiírja.
//  • ami nem fér el, nem tűnik el csendben: az „unplaced” lista okkal adja vissza.
(function(root,factory){ const api=factory(); if(typeof module==='object'&&module.exports) module.exports=api; else root.DRLayout=api; })(typeof self!=='undefined'?self:this,function(){

  const WALL=6, GAP=5, MOUNT_BOTTOM=140, EPS=0.01;
  // Becsült magasság (cm), ha a katalógusban nincs ellenőrzött érték — a 3D-hez és a falra szerelt elem alatti helyhez.
  const H_EST={sofa:80,chair:95,coffee:42,tv:48,rug:2,lamp:150,bed:45,nightstand:45,wardrobe:180,dtable:75,dchair:90,sideboard:80,island:90,barstool:72,kcabinet:120,fridge:180,desk:75,ochair:100,shelf:180,kbed:45,kdesk:65};
  // Használati helyigény a bútor „eleje” előtt (cm) — szék kihúzása, ajtó/fiók nyitása. Becsült tervezési érték.
  const CLEAR={dchair:30,barstool:25,ochair:40,wardrobe:60,sideboard:40,nightstand:30,fridge:60,kcabinet:50,shelf:30};
  // A szék a saját asztalától elfelé húzódik ki.
  const PARTNER={dchair:'dtable',barstool:'island',ochair:'desk'};
  const DOOR_DEFAULT={wall:'bottom',offset:40,width:80};

  const roomBox=(L,W,H)=>({W:Math.max(L,W)*100,D:Math.min(L,W)*100,H:(H||0)*100});
  const norm=r=>((Math.round((+r||0)/90)*90)%360+360)%360;
  const footprint=(w,d,rot)=>norm(rot)%180===0?{w,d}:{w:d,d:w};
  const overlap=(a,b,g=0)=>a.x<b.x+b.w+g-EPS&&b.x<a.x+a.w+g-EPS&&a.y<b.y+b.d+g-EPS&&b.y<a.y+a.d+g-EPS;

  // Az ajtó síkja és nyitási négyzete (a szoba belsejébe nyíló ajtólap ív-befoglalója).
  function door(room,d){
    const x=d||DOOR_DEFAULT, width=Math.max(60,Math.min(+x.width||80,120)), wall=['bottom','top','left','right'].includes(x.wall)?x.wall:'bottom';
    const len=(wall==='left'||wall==='right')?room.D:room.W, offset=Math.max(0,Math.min(+x.offset||0,len-width));
    const zone=wall==='bottom'?{x:offset,y:room.D-width,w:width,d:width}:wall==='top'?{x:offset,y:0,w:width,d:width}
      :wall==='left'?{x:0,y:offset,w:width,d:width}:{x:room.W-width,y:offset,w:width,d:width};
    return {wall,offset,width,zone};
  }

  // Befér-e a szobába (bármelyik 90°-os állásban), és csak elforgatva-e. item: {w,d,h,wallMounted}
  function fitsRoom(item,room){
    const h=item.h||0, top=item.wallMounted?MOUNT_BOTTOM+h:h;
    if(room.H&&top>room.H) return {fits:false,rotated:false,reason:'height'};
    const ok=(w,d)=>w<=room.W-2*WALL+EPS&&d<=room.D-2*WALL+EPS;
    if(ok(item.w,item.d)) return {fits:true,rotated:false,reason:null};
    if(ok(item.d,item.w)) return {fits:true,rotated:true,reason:null};
    return {fits:false,rotated:false,reason:'size'};
  }

  // Egy jelölt hely ellenőrzése a már elhelyezett darabokhoz képest. Hiba esetén az ok kódja, különben null.
  // c: {x,y,w,d,h,rug,wall}
  function check(c,placed,room,dz){
    if(c.x<WALL-EPS||c.y<WALL-EPS||c.x+c.w>room.W-WALL+EPS||c.y+c.d>room.D-WALL+EPS) return 'wall';
    if(room.H&&(c.wall?MOUNT_BOTTOM+c.h:c.h)>room.H) return 'height';
    if(c.wall&&!touchesWall(c,room)) return 'mount';
    if(!c.rug&&dz&&overlap(c,dz)) return 'door';
    for(const a of placed){
      if(a.rug||c.rug) continue;
      // falra szerelt elem alatt alacsony bútor maradhat (pl. komód a felső szekrény alatt)
      if(!!a.wall!==!!c.wall){ const floor=a.wall?c:a; if((floor.h||0)<=MOUNT_BOTTOM) continue; }
      if(overlap(a.box||a,c,GAP)) return 'overlap';
    }
    return null;
  }
  const touchesWall=(c,room)=>Math.abs(c.x-WALL)<1||Math.abs(c.y-WALL)<1||Math.abs(c.x+c.w-(room.W-WALL))<1||Math.abs(c.y+c.d-(room.D-WALL))<1;
  function snapToWall(x,y,w,d,room){
    const opts=[[WALL,y],[room.W-WALL-w,y],[x,WALL],[x,room.D-WALL-d]];
    return opts.reduce((b,p)=>Math.hypot(p[0]-x,p[1]-y)<Math.hypot(b[0]-x,b[1]-y)?p:b,opts[0]);
  }

  // A teljes szoba elrendezése. opts:
  //  roomType, room (roomBox), door (beállítás), items: [{id, plan, w, d, h, hKnown, wallMounted, qty}],
  //  pos(instanceId) → {x,y}|null (mentett bal-felső sarok), rot(instanceId) → fok|null
  function place(opts){
    const {roomType,room}=opts, items=opts.items||[], posOf=opts.pos||(()=>null), rotOf=opts.rot||(()=>null);
    const dz=door(room,opts.door).zone, W=room.W, D=room.D;
    const out=[], unplaced=[];
    const find=k=>items.find(x=>x.plan===k);
    const anchors=anchorsFor(roomType,W,D,find,posOf);
    const push=(kind,x,y,it,instanceId,w0,d0)=>{
      const w=w0??it.w, d=d0??it.d, h=it.h||H_EST[kind]||60, rug=it.plan==='rug', wall=!!it.wallMounted;
      const fit=fitsRoom({w,d,h,wallMounted:wall},room);
      if(!fit.fits){ unplaced.push({productId:it.id,instanceId,kind,reason:fit.reason}); return null; }
      let rot=rotOf(instanceId); rot=rot==null?(fit.rotated?90:0):norm(rot);
      let f=footprint(w,d,rot);
      if(f.w>W-2*WALL+EPS||f.d>D-2*WALL+EPS){ rot=fit.rotated?90:0; f=footprint(w,d,rot); }   // a mentett forgatás már nem fér el → befér­ő állás
      const stored=posOf(instanceId); if(stored){ x=stored.x; y=stored.y; }
      x=Math.max(WALL,Math.min(x,W-f.w-WALL)); y=Math.max(WALL,Math.min(y,D-f.d-WALL));
      if(wall){ [x,y]=snapToWall(x,y,f.w,f.d,room); }
      const cand=(px,py)=>({x:px,y:py,w:f.w,d:f.d,h,rug,wall});
      let reason=check(cand(x,y),out,room,dz);
      if(reason&&!rug){
        // az előnyben részesített hely foglalt: a legközelebbi szabad hely 10 cm-es rácson (falra szerelt: csak fal mentén)
        let best=null,bd=Infinity;
        for(let py=WALL;py<=D-f.d-WALL+EPS;py+=10) for(let px=WALL;px<=W-f.w-WALL+EPS;px+=10){
          let qx=px,qy=py; if(wall){ [qx,qy]=snapToWall(px,py,f.w,f.d,room); }
          if(check(cand(qx,qy),out,room,dz)) continue;
          const dist=Math.hypot(qx-x,qy-y); if(dist<bd){ best=[qx,qy]; bd=dist; }
        }
        if(best){ [x,y]=best; reason=null; }
      }
      if(reason&&!(rug&&reason!=='wall')){ unplaced.push({productId:it.id,instanceId,kind,reason:reason==='overlap'||reason==='door'?'space':reason}); return null; }
      const p={productId:it.id,kind,instanceId,cx:x+f.w/2,cy:y+f.d/2,w:f.w,d:f.d,baseW:w,baseD:d,rot,h,hKnown:!!it.hKnown,rug,wall,box:{x,y,w:f.w,d:f.d}};
      out.push(p); return p;
    };
    const order=ORDER[roomType]||[];
    order.forEach(key=>{
      const it=find(key); if(!it) return;
      const qty=Math.max(1,it.qty||1);
      if(key==='nightstands'){ const bed=find('bed'), b=out.find(p=>p.kind===(bed&&bed.id)), bx=b?b.box.x:(W-160)/2, by=b?b.box.y:12, bw=b?b.w:160;
        for(let i=0;i<qty;i++){ const nx=i%2===0?bx-it.w-3-Math.floor(i/2)*(it.w+2):bx+bw+8+Math.floor(i/2)*(it.w+2); push('nightstand',nx,by,it,`nightstand~${i+1}`); } return; }
      if(key==='dchairs'){ const t=out.find(p=>p.kind==='dtable'), tx=t?t.box.x:(W-140)/2, ty=t?t.box.y:(D-85)/2, tw=t?t.w:140, th=t?t.d:85;
        const spots=[[tx+tw*.22-it.w/2,ty-it.d-5],[tx+tw*.78-it.w/2,ty-it.d-5],[tx+tw*.22-it.w/2,ty+th+5],[tx+tw*.78-it.w/2,ty+th+5],[tx-it.w-5,ty+th*.25-it.d/2],[tx-it.w-5,ty+th*.75-it.d/2],[tx+tw+5,ty+th*.25-it.d/2],[tx+tw+5,ty+th*.75-it.d/2]];
        for(let i=0;i<qty;i++){ const [x,y]=spots[i%spots.length]; push('dchair',x,y,it,`dchair~${i+1}`); } return; }
      if(key==='barstools'){ const isl=out.find(p=>p.kind==='island'), ix=isl?isl.box.x:(W-120)/2, iy=isl?isl.box.y:(D-80)/2-20, iw=isl?isl.w:120, ih=isl?isl.d:80;
        for(let i=0;i<qty;i++) push('barstool',ix+iw*(0.2+0.22*i)-it.w/2,iy+ih+6,it,`barstool~${i+1}`); return; }
      const w=key==='rug'?Math.max(it.w,it.d):it.w, d=key==='rug'?Math.min(it.w,it.d):it.d;
      let [x,y]=key==='rug'?(roomType==='haloszoba'?[(W-300)/2,D*0.5]:[(W-w)/2,(D-d)/2]):(anchors[key]||[WALL,WALL]);
      const first=push(it.id,x,y,it,it.id,w,d);
      for(let i=2;i<=qty;i++) push(it.id,first?first.box.x+(i-1)*(first.w+12):x,first?first.box.y:y,it,`${it.id}~${i}`,w,d);
    });
    const warnings=clearances(out,room);
    return {placed:out,unplaced,warnings,door:door(room,opts.door)};
  }

  // A szobák alapelrendezése (a korábbi app.js placements3D horgonyai változatlanul).
  const ORDER={nappali:['rug','sofa','coffee','tv','armchair','lamp'],haloszoba:['rug','bed','nightstands','wardrobe','lamp'],etkezo:['rug','dtable','dchairs','sideboard','lamp'],
    konyha:['kcabinet','island','barstools','fridge','lamp'],dolgozo:['rug','desk','ochair','shelf','lamp'],gyerek:['rug','kbed','kdesk','wardrobe','shelf','lamp']};
  function anchorsFor(room,W,D,find,posOf){
    const sz=(k,dw,dd)=>{ const it=find(k); return it?[it.w,it.d]:[dw,dd]; };
    if(room==='nappali') return {tv:[(W-120)/2,10],sofa:[(W-224)/2,D-90-10],coffee:[(W-110)/2,D/2+10],armchair:[12,D-96-12],lamp:[12,12]};
    if(room==='haloszoba'){ const [bw]=sz('bed',160,200); return {bed:[(W-bw)/2,12],wardrobe:[W-130,D-55-10],lamp:[W-42,12]}; }
    if(room==='etkezo'){ const [tw,th]=sz('dtable',140,85); return {dtable:[(W-tw)/2,(D-th)/2],sideboard:[W-135,D-50-10],lamp:[12,12]}; }
    if(room==='konyha'){ const [iw,ih]=sz('island',120,80); return {island:[(W-iw)/2,(D-ih)/2-20],kcabinet:[12,10],fridge:[W-66,10],lamp:[12,D-52]}; }
    if(room==='dolgozo'){ const [dw,dd]=sz('desk',120,60); return {desk:[(W-dw)/2,10],ochair:[(W-70)/2,10+dd+14],shelf:[12,D-40-10],lamp:[W-42,10]}; }
    const [kw]=sz('kdesk',96,60); return {kbed:[12,12],kdesk:[W-kw-12,12],wardrobe:[W-130,D-55-10],shelf:[12,D-40-10],lamp:[(W-30)/2,(D-40)/2]};
  }

  // R04: használati helyigény — a bútor eleje előtti szabad sáv. Az „eleje” a legközelebbi fallal szemközti oldal,
  // széknél a saját asztalától elfelé eső oldal. Visszaad: figyelmeztetések, és minden érintett darabon .clear (rajzhoz).
  function clearances(placed,room){
    const warnings=[];
    for(const p of placed){
      const need=CLEAR[p.kind]; if(!need||p.rug||p.wall) continue;   // falra szerelt felső szekrény ajtaja fej fölött nyílik
      const b=p.box; let dir;
      const partner=PARTNER[p.kind]&&placed.find(q=>q.kind===PARTNER[p.kind]);
      if(partner){ const dx=p.cx-partner.cx, dy=p.cy-partner.cy;
        dir=Math.abs(dx)/(partner.w/2+p.w/2)>Math.abs(dy)/(partner.d/2+p.d/2)?(dx>0?'right':'left'):(dy>0?'down':'up'); }
      else { const dist={left:b.x,right:room.W-(b.x+b.w),up:b.y,down:room.D-(b.y+b.d)};
        const near=Object.entries(dist).sort((a,c)=>a[1]-c[1])[0][0]; dir={left:'right',right:'left',up:'down',down:'up'}[near]; }
      // szabad távolság az adott irányban: fal vagy az első útban lévő bútor
      let have=dir==='left'?b.x:dir==='right'?room.W-(b.x+b.w):dir==='up'?b.y:room.D-(b.y+b.d), by='wall';
      for(const q of placed){ if(q===p||q.rug||q.wall||(partner&&q===partner)) continue; const o=q.box;
        const span=dir==='left'||dir==='right'?(o.y<b.y+b.d&&b.y<o.y+o.d):(o.x<b.x+b.w&&b.x<o.x+o.w); if(!span) continue;
        const gap=dir==='left'?b.x-(o.x+o.w):dir==='right'?o.x-(b.x+b.w):dir==='up'?b.y-(o.y+o.d):o.y-(b.y+b.d);
        if(gap>=-EPS&&gap<have){ have=gap; by=q.instanceId; } }
      have=Math.max(0,Math.round(have));
      p.clear={dir,need,have,zone:dir==='left'?{x:b.x-need,y:b.y,w:need,d:b.d}:dir==='right'?{x:b.x+b.w,y:b.y,w:need,d:b.d}:dir==='up'?{x:b.x,y:b.y-need,w:b.w,d:need}:{x:b.x,y:b.y+b.d,w:b.w,d:need}};
      if(have<need) warnings.push({instanceId:p.instanceId,productId:p.productId,kind:p.kind,need,have,by});
    }
    return warnings;
  }

  // Egy darab mozgatása / forgatása — ugyanaz a szabály a 2D-s és a 3D-s húzásnál. Hibakód vagy null.
  function validateMove(result,instanceId,cx,cy,room,doorCfg,rot){
    const p=result.placed.find(x=>x.instanceId===instanceId); if(!p) return 'missing';
    const f=rot==null?{w:p.w,d:p.d}:footprint(p.baseW,p.baseD,rot);
    const c={x:cx-f.w/2,y:cy-f.d/2,w:f.w,d:f.d,h:p.h,rug:p.rug,wall:p.wall};
    return check(c,result.placed.filter(x=>x!==p),room,door(room,doorCfg).zone);
  }

  return {WALL,GAP,MOUNT_BOTTOM,H_EST,CLEAR,DOOR_DEFAULT,roomBox,footprint,norm,door,fitsRoom,check,place,clearances,validateMove};
});
