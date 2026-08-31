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
function fallbackBox(w, h, d, rug) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color: rug ? 0xd8c6a0 : 0x9aa6b6 }));
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
    scene.add(wall);
  });

  // Bútorok elhelyezése a tervrajzi (cm) koordinátákból
  let disposed = false;
  opts.items.forEach(it => {
    const X = (it.cx - roomW * 100 / 2) / 100, Z = (it.cy - roomD * 100 / 2) / 100;
    let rotY = 0;
    if (!NO_FACE.has(it.kind)) { // forgatás a szoba közepe felé, 90°-ra kerekítve
      rotY = Math.round(Math.atan2(-X, -Z) / (Math.PI / 2)) * (Math.PI / 2);
    }
    const place = obj => {
      if (disposed) return;
      obj.rotation.y = rotY;
      // a forgatás után igazítjuk a befoglaló méretet, mert 90°-nál cserélődik a szélesség/mélység
      const swap = Math.abs(Math.round(rotY / (Math.PI / 2))) % 2 === 1;
      const wrap = normalize(obj, (swap ? it.d : it.w) / 100, Math.max(it.h, 2) / 100, (swap ? it.w : it.d) / 100);
      if (swap) { const s = wrap.scale; wrap.scale.set(s.z, s.y, s.x); } // visszaigazítás a világtengelyekhez
      wrap.position.set(X, 0, Z);
      wrap.traverse(o => { if (o.isMesh) { o.castShadow = !it.rug; o.receiveShadow = true; } });
      scene.add(wrap);
    };
    loadModel(it.kind).then(place).catch(() => place(fallbackBox(it.w / 100, Math.max(it.h, 2) / 100, it.d / 100, it.rug)));
  });

  // Egérrel forgatás/zoom — ezt kapjuk "ingyen" az OrbitControls-tól
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, roomH * 0.3, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.03; // ne mehessünk a padló alá
  controls.minDistance = 1.2;
  controls.maxDistance = Math.max(roomW, roomD) * 4;

  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

  // Pillanatkép az AI-látványtervhez: lekicsinyítve (max 768px), JPEG-ként,
  // hogy a feltöltendő adat kicsi maradjon (~100 KB).
  window.HV3D.snapshot = function () {
    const src = renderer.domElement;
    const w = Math.min(768, src.width), h = Math.round(w * src.height / src.width);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.82);
  };

  return function dispose() {
    disposed = true;
    window.HV3D.snapshot = null;
    renderer.setAnimationLoop(null);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };
}

window.HV3D = { mount, snapshot: null };
