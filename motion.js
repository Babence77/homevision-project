// ---- DREAMR MOZGÁS ----
// Minden animáció itt él; az app.js csak meghívja ezeket (window.DRMotion).
// Csökkentett mozgás (prefers-reduced-motion) esetén minden azonnal, animáció nélkül történik.
(function(){
  const reduceQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>reduceQuery.matches;
  const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // Finom rezgés (Androidon); a böngésző csak valódi érintés után engedi.
  const buzz=ms=>{ try{ if(navigator.vibrate&&navigator.userActivation?.hasBeenActive) navigator.vibrate(ms); }catch(e){} };

  // 1. Szövegfelfedés: a mondatok soronként, a szavak egyenként emelkednek fel.
  //    Az első mondat után következők dőlt, arany sort kapnak („Álmodd meg. / Lakd meg.”).
  function setSplitText(el,text){
    if(!el||el.dataset.splitText===text) return;
    el.dataset.splitText=text;
    el.setAttribute('aria-label',text);
    const lines=text.match(/[^.!?]+[.!?]*/g)||[text];
    let i=0;
    el.innerHTML=lines.map((line,n)=>`<span class="dr-line${n?' dr-line-alt':''}" aria-hidden="true">`+
      line.trim().split(/\s+/).map(w=>`<span class="dr-word" style="--i:${i++}">${esc(w)}</span>`).join(' ')+'</span>').join(' ');
  }

  // 2. Hullám a gombnyomás helyéről (a fénycsík tisztán CSS: .dr-shine).
  document.addEventListener('pointerdown',e=>{
    const host=e.target.closest('.dr-ripple');
    if(!host||reduced()) return;
    const r=host.getBoundingClientRect(),dot=document.createElement('span');
    dot.className='dr-ripple-dot';
    dot.style.left=(e.clientX-r.left)+'px'; dot.style.top=(e.clientY-r.top)+'px';
    host.appendChild(dot);
    dot.addEventListener('animationend',()=>dot.remove(),{once:true});
  });

  // 3. Alaprajz: első megjelenéskor a falak kirajzolódnak, a bútorok rugózva a helyükre esnek;
  //    később csak az újonnan bekapcsolt bútor esik be.
  let seenBlocks=null;
  function markNewBlocks(planEl){
    const ids=new Set([...planEl.querySelectorAll('[data-drag]')].map(g=>g.getAttribute('data-drag')));
    if(seenBlocks&&!reduced()){
      planEl.querySelectorAll('[data-drag]').forEach(g=>{ if(!seenBlocks.has(g.getAttribute('data-drag'))){ g.querySelector('.pb')?.classList.add('is-new'); buzz(8); } });
    }
    seenBlocks=ids;
  }
  function watchPlanIntro(planEl){
    if(!planEl||!('IntersectionObserver' in window)||reduced()) return;
    const io=new IntersectionObserver(entries=>{
      if(!entries.some(en=>en.isIntersecting)) return;
      io.disconnect();
      planEl.classList.add('is-intro');
      setTimeout(()=>planEl.classList.remove('is-intro'),3200);
    },{threshold:.35});
    io.observe(planEl);
  }

  // 4. Számláló: az összegek felpörögnek az új értékre.
  function countTo(el,value,format){
    if(!el) return;
    const from=+el.dataset.v||0; el.dataset.v=value;
    if(reduced()||from===value||!el.isConnected){ el.textContent=format(value); return; }
    const t0=performance.now(),dur=700;
    cancelAnimationFrame(el._raf);
    const step=now=>{
      const p=Math.min(1,(now-t0)/dur),k=1-Math.pow(1-p,3);
      el.textContent=format(Math.round(from+(value-from)*k));
      if(p<1) el._raf=requestAnimationFrame(step);
    };
    el._raf=requestAnimationFrame(step);
  }

  // 5. Büdzsé-gyűrű: arany ív a keretig, terrakotta ív a túllépésre.
  const RING=2*Math.PI*48;
  function budgetRing(host,ratio,format){
    if(!host) return;
    const base=host.querySelector('.ring-base'),over=host.querySelector('.ring-over');
    base.style.strokeDasharray=over.style.strokeDasharray=RING;
    base.style.strokeDashoffset=RING*(1-Math.min(ratio,1));
    over.style.strokeDashoffset=RING*(1-Math.min(Math.max(ratio-1,0),1));
    host.classList.toggle('is-over',ratio>1);
    countTo(host.querySelector('.ring-pct'),Math.round(ratio*100),n=>n+'%');
  }

  // 6. Kosárba repülés: arany pötty ívben a bevásárlólista gombjába.
  function flyTo(fromRect,toEl){
    if(!fromRect||!toEl||reduced()){ bump(toEl); return; }
    const to=toEl.getBoundingClientRect();
    const x0=fromRect.left+fromRect.width/2,y0=fromRect.top+fromRect.height/2;
    const x1=to.left+to.width/2,y1=to.top+to.height/2;
    const cx=(x0+x1)/2,cy=Math.min(y0,y1)-160;
    const dot=document.createElement('div'); dot.className='dr-fly'; document.body.appendChild(dot);
    const frames=[];
    for(let i=0;i<=16;i++){
      const t=i/16,u=1-t;
      const x=u*u*x0+2*u*t*cx+t*t*x1,y=u*u*y0+2*u*t*cy+t*t*y1;
      frames.push({transform:`translate(${x-14}px,${y-14}px) scale(${1-t*.6})`,opacity:i===0?0:1});
    }
    dot.animate(frames,{duration:820,easing:'cubic-bezier(.5,0,.3,1)'}).onfinish=()=>{ dot.remove(); bump(toEl); buzz(12); };
  }
  function bump(el){
    if(!el||reduced()) return;
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
  }

  // 7. Billenő kártyák: egérrel (asztalon) megdől a kártya, fény siklik át rajta.
  function tiltWithin(root,selector){
    if(!root) return;
    root.addEventListener('pointermove',e=>{
      if(!finePointer.matches||reduced()) return;
      const card=e.target.closest(selector); if(!card) return;
      const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--rx',(-py*5).toFixed(2)+'deg');
      card.style.setProperty('--ry',(px*7).toFixed(2)+'deg');
      card.style.setProperty('--gx',((px+.5)*100).toFixed(0)+'%');
      card.classList.add('is-tilt');
    });
    root.addEventListener('pointerout',e=>{
      const card=e.target.closest(selector);
      if(card&&!card.contains(e.relatedTarget)) card.classList.remove('is-tilt');
    });
  }
  // Telefonon a döntés mozgatja az előtte/utána képet (iOS engedélykérés nélkül nem elérhető, ott kimarad).
  function gyroParallax(el){
    if(!el||!('DeviceOrientationEvent' in window)||typeof DeviceOrientationEvent.requestPermission==='function') return;
    window.addEventListener('deviceorientation',e=>{
      if(reduced()||e.gamma==null) return;
      el.style.setProperty('--tx',Math.max(-1,Math.min(1,e.gamma/25)).toFixed(3));
      el.style.setProperty('--ty',Math.max(-1,Math.min(1,(e.beta-45)/25)).toFixed(3));
    });
  }

  // 8. Lapozható alternatívák: söprés a termékfotón = ◀ ▶ gomb.
  function swipeWithin(root,onSwipe){
    if(!root) return;
    let start=null;
    root.addEventListener('pointerdown',e=>{ const p=e.target.closest('.product-photo'); if(p) start={x:e.clientX,y:e.clientY,p}; });
    root.addEventListener('pointerup',e=>{
      if(!start) return;
      const dx=e.clientX-start.x,dy=e.clientY-start.y,p=start.p; start=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.4) onSwipe(p.closest('.item'),dx<0?1:-1);
    });
    root.addEventListener('pointercancel',()=>{start=null;});
  }
  function swapIn(item,dir){
    if(!item||reduced()) return;
    item.classList.add(dir>0?'swap-next':'swap-prev');
    setTimeout(()=>item.classList.remove('swap-next','swap-prev'),600);
  }

  // 9. Előtte / utána: a csúszka magától oda-vissza söpör, amíg a felhasználó hozzá nem ér.
  function autoSweep(visual,input){
    if(!visual||!input||reduced()) return;
    let stopped=false,visible=true,raf=0;const t0=performance.now();
    const stop=()=>{ stopped=true; cancelAnimationFrame(raf); };
    ['pointerdown','keydown','focus','input'].forEach(ev=>input.addEventListener(ev,stop,{once:true}));
    if('IntersectionObserver' in window) new IntersectionObserver(en=>{ visible=en[0].isIntersecting; if(visible&&!stopped) raf=requestAnimationFrame(loop); }).observe(visual);
    function loop(now){
      if(stopped||!visible) return;
      const pos=50+34*Math.sin((now-t0)/1600);
      visual.style.setProperty('--compare-position',pos.toFixed(2)+'%');
      input.value=Math.round(pos);
      raf=requestAnimationFrame(loop);
    }
    setTimeout(()=>{ if(!stopped) raf=requestAnimationFrame(loop); },1400);
  }

  // 10. Görgetésre beúszó blokkok.
  function revealOnScroll(selector){
    if(!('IntersectionObserver' in window)||reduced()) return;
    const io=new IntersectionObserver(entries=>entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); } }),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll(selector).forEach(el=>{ el.classList.add('dr-reveal'); io.observe(el); });
  }

  // 11. Belépő: lebegő aranypor.
  function dust(host,count){
    if(!host||reduced()) return;
    for(let i=0;i<count;i++){
      const s=document.createElement('span'); s.className='dr-dust';
      s.style.left=(4+Math.random()*92)+'%'; s.style.top=(40+Math.random()*55)+'%';
      const size=(2+Math.random()*2.5).toFixed(1)+'px'; s.style.width=s.style.height=size;
      s.style.animationDelay=(-Math.random()*10).toFixed(2)+'s'; s.style.animationDuration=(8+Math.random()*5).toFixed(2)+'s';
      host.appendChild(s);
    }
  }

  // 12. Gomb: töltés → pipa.
  function buttonBusy(btn,on){ if(btn){ btn.classList.toggle('is-loading',on); btn.setAttribute('aria-busy',on?'true':'false'); } }
  function buttonDone(btn){
    if(!btn) return;
    btn.classList.remove('is-loading'); btn.classList.add('is-done');
    if(!btn.querySelector('.dr-check')) btn.insertAdjacentHTML('beforeend','<svg class="dr-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>');
  }

  // 13. Átmenet a belépőből a tervezőbe: kapu-körök, kirajzolódó alaprajz, szikrák, berepülés.
  function playEnter({origin,kicker,title,titleAlt,onSwap}){
    if(reduced()){ onSwap(); return; }
    const ox=origin?origin.x:window.innerWidth/2,oy=origin?origin.y:window.innerHeight*.75;
    const ov=document.createElement('div');
    ov.className='dr-enter'; ov.setAttribute('aria-hidden','true');
    ov.style.setProperty('--ox',ox+'px'); ov.style.setProperty('--oy',oy+'px');
    const sparks=[[-120,-90],[130,-70],[-150,40],[140,80],[-40,-150],[50,150],[0,-170],[-90,130],[160,-10],[-170,-20]]
      .map(([x,y])=>`<span class="dr-spark" style="--dx:${x}px;--dy:${y}px"></span>`).join('');
    ov.innerHTML=`<div class="dr-enter-c1"></div><div class="dr-enter-c2"></div><div class="dr-enter-ring"></div>
      <div class="dr-enter-stage">
        <svg class="dr-enter-plan" viewBox="0 0 300 220">
          <path class="dr-enter-wall" d="M20 20 H280 V200 H170 M130 200 H20 Z M150 20 V95 H280"/>
          <rect class="dr-enter-f is-main" x="40" y="130" width="90" height="38" rx="8"/>
          <rect class="dr-enter-f" style="--d:.15s" x="58" y="80" width="54" height="30" rx="5"/>
          <circle class="dr-enter-f" style="--d:.3s" cx="215" cy="150" r="22"/>
          <rect class="dr-enter-f" style="--d:.45s" x="175" y="40" width="80" height="34" rx="6"/>
        </svg>
        <div class="dr-enter-copy"><div class="dr-enter-kicker">${esc(kicker)}</div><div class="dr-enter-title">${esc(title)}<br><em>${esc(titleAlt)}</em></div></div>
        <div class="dr-enter-progress"><i></i></div>
        ${sparks}
      </div>`;
    document.body.appendChild(ov);
    buzz(10);
    setTimeout(()=>{ onSwap(); ov.classList.add('is-leaving'); },3300);
    setTimeout(()=>ov.remove(),4200);
  }

  window.DRMotion={reduced,setSplitText,markNewBlocks,watchPlanIntro,countTo,budgetRing,flyTo,bump,tiltWithin,gyroParallax,swipeWithin,swapIn,autoSweep,revealOnScroll,dust,buttonBusy,buttonDone,playEnter};
})();
