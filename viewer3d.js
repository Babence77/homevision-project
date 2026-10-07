// HomeVision AI — valódi 3D nézet (Three.js + GLTF modellek)
// Ez a fájl ES-modul: az importmap (index.html) mondja meg, honnan jön a "three".
// Az app.js-sel a window.HV3D globálison keresztül beszél, így az app.js maradhat sima szkript.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Bútortípus -> GLB fájl (Kenney Furniture Kit, CC0)
const MODEL = {
  sofa: 'loungeSofa.glb', chair: 'loungeChair.glb', coffee: 'tableCoffee.glb',
  tv: 'cabinetTelevision.glb', rug: 'rugRectangle.glb', lamp: 'lampRoundFloor.glb',
  bed: 'bedDouble.glb', kbed: 'bedSingle.glb', nightstand: 'cabinetBedDrawer.glb',
  wardrobe: 'bookcaseClosedDoors.glb', dtable: 'table.glb', dchair: 'chair.glb',
  sideboard: 'cabinetTelevisionDoors.glb', island: 'kitchenBar.glb', barstool: 'stoolBar.glb',
  kcabinet: 'kitchenCabinet.glb', fridge: 'kitchenFridgeLarge.glb', desk: 'desk.glb',
  ochair: 'chairDesk.glb', shelf: 'bookcaseOpen.glb', kdesk: 'desk.glb'
};
// Ezeknek nincs "eleje", nem kell a szoba közepe felé forgatni
const NO_FACE = new Set(['rug', 'coffee', 'dtable', 'island', 'lamp']);

const loader = new GLTFLoader();
const cache = {}; // kind -> Promise<scene>; minden modellt csak egyszer töltünk le
function loadModel(kind) {
  if (!MODEL[kind]) return Promise.reject(new Error('no model'));
  if (!cache[kind]) cache[kind] = new Promise((res, rej) =>
    loader.load('models/' + MODEL[kind], g => res(g.scene), undefined, rej));
  return cache[kind].then(scene => scene.clone(true)); // klón, hogy többször is elhelyezhető legyen
}

// Tartalék: szürke doboz, ha a modell nem tölthető be (pl. nincs net)
function fallbackBox(w, h, d, rug, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: color || (rug ? 0xc6b28f : 0x9a9993) }));
  m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m); return g;
}

// A modellt pontosan a tervrajzi w×d×h (méter) befoglaló méretre igazítja,
// az alját a padlóra (y=0), a közepét az origóra tolja.
function normalize(obj, w, h, d) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  obj.position.sub(new THREE.Vector3(c.x, box.min.y, c.z));
  const wrap = new THREE.Group(); wrap.add(obj);
  wrap.scale.set(w / Math.max(size.x, 0.01), h / Math.max(size.y, 0.01), d / Math.max(size.z, 0.01));
  return wrap;
}

// opts: { roomW, roomD, roomH (méter), wallColor, floorColor, items:[{kind,cx,cy,w,d,h,rug}] (cm) }
// Visszatérés: dispose függvény (az app.js ezt hívja bezáráskor).
function mount(container, opts) {
  const W = container.clientWidth || 700, H = container.clientHeight || 440;
  const { roomW, roomD, roomH } = opts;

  const ownedGeometry=[],ownedMaterials=[];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.05, 100);
  camera.position.set(roomW * 0.9, roomH * 1.6, roomD * 1.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); // preserve: kell a képmentéshez (snapshot)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Fények: tompa alapfény + árnyékot vető "nap"
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(roomW, roomH * 2.2, roomD * 0.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera, ext = Math.max(roomW, roomD);
  sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
  scene.add(sun);

  // Padló
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomW, roomD),
    new THREE.MeshStandardMaterial({ color: opts.floorColor || '#cbb48d', roughness: 0.9 }));
  ownedGeometry.push(floor.geometry);ownedMaterials.push(floor.material);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 4 fal: mind befelé néz, így a kamera felőli fal automatikusan "átlátszó"
  // (a hátoldalát a GPU nem rajzolja ki — ugyanaz a trükk, mint a régi nézetben)
  const wallMat = new THREE.MeshStandardMaterial({ color: opts.wallColor || '#eeeeee', roughness: 1 });
  [[0, -roomD / 2, 0, roomW], [0, roomD / 2, Math.PI, roomW],
   [-roomW / 2, 0, Math.PI / 2, roomD], [roomW / 2, 0, -Math.PI / 2, roomD]].forEach(([x, z, ry, len]) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, roomH), wallMat);
    wall.position.set(x, roomH / 2, z); wall.rotation.y = ry;
    ownedGeometry.push(wall.geometry);
    scene.add(wall);
  });

  ownedMaterials.push(wallMat);
  // Bútorok elhelyezése a tervrajzi (cm) koordinátákból
  let disposed = false;
  const clonedMaterials = [];
  const screen=opts.tvScreen;
  let television=null;
  if(screen){
    television=new THREE.Mesh(new THREE.BoxGeometry(screen.w/100,screen.h/100,screen.d/100),new THREE.MeshStandardMaterial({color:0x202124,roughness:0.3}));
    television.position.set((screen.cx-roomW*50)/100,(screen.bottom+screen.h/2)/100,(screen.cy-roomD*50)/100);
    scene.add(television);
  }
  function syncTV(id,pos){
    if(!television) return;if(screen.instanceId!==id) return;
    television.position.x=pos.x;television.position.z=pos.z;
  }
  const furniture=[];
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const floorPoint=new THREE.Vector3();
  let drag=null;
  function cast(e){
    const r=renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,camera);
    return ray.ray.intersectPlane(floorPlane,floorPoint);
  }  function down(e){
    if(e.button!==0) return;if(drag) return;if(!cast(e)) return;
    const hit=ray.intersectObjects(furniture,true)[0];if(!hit) return;
    let root=hit.object;while(root.parent!==scene) root=root.parent;
    if(!root.userData.furnishing) return;
    drag={root,id:e.pointerId,start:root.position.clone(),offset:root.position.clone().sub(floorPoint),item:root.userData.furnishing,moved:false,valid:true};
    controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);
    e.stopImmediatePropagation();e.preventDefault();
  }  function move(e){
    if(!drag) return;if(e.pointerId!==drag.id) return;if(!cast(e)) return;
    const pos=floorPoint.clone().add(drag.offset);
    const cx=(pos.x+roomW/2)*100,cy=(pos.z+roomD/2)*100;
    if(pos.distanceTo(drag.start)>0.005) drag.moved=true;
    drag.valid=opts.canMove(drag.item.instanceId,cx,cy);
    if(drag.valid){drag.root.position.set(pos.x,0,pos.z);syncTV(drag.item.instanceId,pos);}
    e.stopImmediatePropagation();e.preventDefault();
  }  function finish(e,cancel=false){
    if(!drag) return;if(e.pointerId!==drag.id) return;
    const d=drag;drag=null;let accepted=!cancel;
    if(d.moved){
      if(accepted) accepted=d.valid;
      if(accepted) accepted=opts.onMove({...d.item,cx:(d.root.position.x+roomW/2)*100,cy:(d.root.position.z+roomD/2)*100});
      if(!accepted){d.root.position.copy(d.start);syncTV(d.item.instanceId,d.start);if(!cancel) opts.onBlocked();}
    }
    controls.enabled=true;
    if(renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
    e.stopImmediatePropagation();e.preventDefault();
  }
  const up=e=>finish(e),cancel=e=>finish(e,true);
  const loading = opts.items.map(it => {
    const X = (it.cx - roomW * 100 / 2) / 100, Z = (it.cy - roomD * 100 / 2) / 100;
    let rotY = 0;
    if (!NO_FACE.has(it.kind)) { // forgatás a szoba közepe felé, 90°-ra kerekítve
      rotY = Math.round(Math.atan2(-X, -Z) / (Math.PI / 2)) * (Math.PI / 2);
    }
    const place = obj => {
      if (disposed) return;
      obj.rotation.y = rotY;
      // a forgatás után igazítjuk a befoglaló méretet, mert 90°-nál cserélődik a szélesség/mélység
      const wrap = normalize(obj, it.w / 100, Math.max(it.h, 2) / 100, it.d / 100);
      wrap.position.set(X, 0, Z);
      wrap.traverse(o => { if (o.isMesh) {
        o.castShadow = !it.rug; o.receiveShadow = true;
        // Product tint is passed from the same catalog finish used by the 2D plan.
        // Clone materials first so instances remain independent.
        if (o.material) {
          o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
          const tint = m => { clonedMaterials.push(m); if (m.color && it.color) m.color.set(it.color); m.roughness = Math.max(m.roughness || 0.7, 0.55); };
          Array.isArray(o.material) ? o.material.forEach(tint) : tint(o.material);
        }
      } });
      wrap.userData.furnishing={...it}; furniture.push(wrap);
      scene.add(wrap);
    };
    return loadModel(it.kind).then(place).catch(() => place(fallbackBox(it.w / 100, Math.max(it.h, 2) / 100, it.d / 100, it.rug, it.color)));
  });

  // Egérrel forgatás/zoom — ezt kapjuk "ingyen" az OrbitControls-tól
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, roomH * 0.3, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.03; // ne mehessünk a padló alá
  controls.minDistance = 1.2;
  controls.maxDistance = Math.max(roomW, roomD) * 4;

  if(opts.view){camera.position.fromArray(opts.view.position);controls.target.fromArray(opts.view.target);controls.update();}
  window.HV3D.getView=()=>({position:camera.position.toArray(),target:controls.target.toArray()});
  if(opts.canMove){
    renderer.domElement.addEventListener('pointerdown',down,true);
    renderer.domElement.addEventListener('pointermove',move,true);
    renderer.domElement.addEventListener('pointerup',up,true);
    renderer.domElement.addEventListener('pointercancel',cancel,true);
    renderer.domElement.addEventListener('lostpointercapture',cancel,true);
  }
  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  // Pillanatkép az AI-látványtervhez: max 1024px, JPEG-ként. Az arány
  // (szélesség:magasság) megmarad; ez önmagában nem garantálja az AI-kép geometriáját.
  window.HV3D.ready = Promise.all(loading);
  window.HV3D.snapshot = function () {
    renderer.render(scene, camera);
    const src = renderer.domElement;
    const w = Math.min(1024, src.width), h = Math.round(w * src.height / src.width);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.9);
  };

  return function dispose() {
    disposed = true;
    window.HV3D.snapshot = null; window.HV3D.getView=null;
    renderer.setAnimationLoop(null);
    renderer.domElement.removeEventListener('pointerdown',down,true);
    renderer.domElement.removeEventListener('pointermove',move,true);
    renderer.domElement.removeEventListener('pointerup',up,true);
    renderer.domElement.removeEventListener('pointercancel',cancel,true);
    renderer.domElement.removeEventListener('lostpointercapture',cancel,true);
    if(television){television.geometry.dispose();television.material.dispose();}
    controls.dispose();
    clonedMaterials.forEach(material => material.dispose());
    ownedGeometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };
}

window.HV3D = { mount, snapshot: null };
