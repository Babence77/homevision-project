// DREAMR — elhelyezőmotor tesztjei (5. szakasz, R03–R04). Futtatás: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const DR = require('../catalog.js');
const LY = require('../layout.js');

const RAW = JSON.parse(await readFile('data/catalog.json', 'utf8'));
const CAT = DR.fromJSON(RAW, JSON.parse(await readFile('data/legacy-v1.json', 'utf8')));
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d;
// Egy szoba alapajánlatának alaprajzi tételei, ahogy az app átadja (app.js layoutItems)
function itemsFor(room, style) {
  return CAT.slotsFor(room, style).filter(s => RAW.categories[s.category].plan).map(s => {
    const o = s.options[0], v = o.variant.dimensions, c = RAW.categories[s.category];
    return { id: s.id, plan: c.plan, w: o.w, d: o.d, h: v.height.status === 'verified' ? v.height.value : null, hKnown: v.height.status === 'verified', wallMounted: !!v.wallMounted.value, qty: c.planQty };
  });
}

test('R03: csak elforgatva férő bútor — felismeri és elforgatva elhelyezi', () => {
  const room = LY.roomBox(3, 2, 2.6);                       // 300 × 200 cm
  const bed = { id: 'bed', plan: 'bed', w: 166, d: 207, h: 86, qty: 1 };   // 207 cm mély: állva nem fér el
  assert.deepEqual(LY.fitsRoom(bed, room), { fits: true, rotated: true, reason: null });
  // ajtó a sarokban (0–80 cm), így az elforgatott ágy mellette elfér; az alapajtóval (40–120 cm) nem férne el
  const r = LY.place({ roomType: 'haloszoba', room, items: [bed], door: { wall: 'bottom', offset: 0, width: 80 } });
  assert.equal(LY.place({ roomType: 'haloszoba', room, items: [bed] }).unplaced[0].reason, 'space', 'alapajtónál okkal kimarad');
  assert.equal(r.unplaced.length, 0);
  const p = r.placed[0]; assert.equal(p.rot, 90); assert.equal(p.w, 207); assert.equal(p.d, 166);
  assert.ok(p.box.y >= LY.WALL && p.box.y + p.d <= room.D - LY.WALL);
});

test('R03: ami semmilyen állásban nem fér el vagy túl magas, nem tűnik el csendben — okkal kimarad', () => {
  const room = LY.roomBox(2, 1.5, 2.2);
  const r = LY.place({ roomType: 'nappali', room, items: [
    { id: 'sofa', plan: 'sofa', w: 241, d: 117, qty: 1 },
    { id: 'lamp', plan: 'lamp', w: 30, d: 30, h: 240, hKnown: true, qty: 1 }] });
  assert.deepEqual(r.unplaced.map(u => [u.productId, u.reason]), [['sofa', 'size'], ['lamp', 'height']]);
  assert.equal(r.placed.length, 0);
});

test('R03: érvénytelen mozgatás okkal elutasítva (fal, másik bútor); a forgatás is ugyanígy ellenőrzött', () => {
  const room = LY.roomBox(4, 3, 2.6);
  const r = LY.place({ roomType: 'nappali', room, items: itemsFor('nappali', 'modern') });
  const sofa = r.placed.find(p => p.productId === 'sofa'), coffee = r.placed.find(p => p.productId === 'coffee');
  assert.equal(LY.validateMove(r, sofa.instanceId, 20, sofa.cy, room), 'wall');
  assert.equal(LY.validateMove(r, sofa.instanceId, coffee.cx, coffee.cy, room), 'overlap');
  assert.equal(LY.validateMove(r, sofa.instanceId, sofa.cx, sofa.cy, room), null, 'a saját helye érvényes');
  // 224 cm-es kanapé a 300 cm-es oldalon elforgatva: 224 > 300-12? nem; de a szoba közepén forgatva a dohányzóasztalba ütközik
  assert.notEqual(LY.validateMove(r, sofa.instanceId, room.W / 2, room.D / 2, room, null, 90), null);
});

test('R04: az ajtónyitás területére semmi nem kerül (minden szoba, alapajánlat, kis és nagy szoba, mind a 4 fal)', () => {
  for (const roomType of Object.keys(RAW.rooms)) for (const size of [[3, 2.6], [4.5, 3.5]]) for (const wall of ['bottom', 'top', 'left', 'right']) {
    const room = LY.roomBox(size[0], size[1], 2.6), doorCfg = { wall, offset: 30, width: 90 };
    const r = LY.place({ roomType, room, door: doorCfg, items: itemsFor(roomType, 'modern') });
    const zone = r.door.zone;
    for (const p of r.placed) if (!p.rug) assert.ok(!overlaps(p.box, zone), `${roomType} ${size} ${wall}: ${p.instanceId}`);
    const any = r.placed.filter(p => !p.rug).sort((x, y) => x.w * x.d - y.w * y.d)[0];   // a legkisebb darab, hogy a falba ne ütközzön
    if (any) assert.equal(LY.validateMove(r, any.instanceId, zone.x + zone.w / 2, zone.y + zone.d / 2, room, doorCfg), 'door');
  }
});

test('R04: ajtó paraméterei a falhoz igazítva (nem lóghat ki)', () => {
  const room = LY.roomBox(3, 2, 2.6);
  const d = LY.door(room, { wall: 'left', offset: 500, width: 90 });
  assert.equal(d.offset, 200 - 90); assert.deepEqual(d.zone, { x: 0, y: 110, w: 90, d: 90 });
});

test('R04: szék kihúzása és szekrénynyitás — kevés helynél jól látható figyelmeztetés', () => {
  const room = LY.roomBox(2.6, 2.2, 2.6);
  const r = LY.place({ roomType: 'etkezo', room, items: itemsFor('etkezo', 'modern') });
  const chairs = r.placed.filter(p => p.kind === 'dchair');
  assert.ok(chairs.length > 0);
  for (const c of chairs) { assert.ok(c.clear, 'minden szék kap kihúzási sávot'); assert.equal(c.clear.need, LY.CLEAR.dchair); }
  const roomy = LY.place({ roomType: 'etkezo', room: LY.roomBox(5, 4, 2.6), items: itemsFor('etkezo', 'modern') });
  assert.ok(r.warnings.length >= roomy.warnings.length);
  for (const w of r.warnings) { assert.ok(w.have < w.need); assert.ok(w.by); }
  // szekrény a falnál: az ajtaja a szoba felé nyílik (a legközelebbi fallal szemben)
  const side = roomy.placed.find(p => p.kind === 'sideboard'); assert.ok(side && side.clear);
  assert.ok(['up', 'down', 'left', 'right'].includes(side.clear.dir));
});

test('R03: falra szerelt elem a falhoz tapad, alatta alacsony bútor maradhat, magas nem', () => {
  const room = LY.roomBox(3, 2.5, 2.6);
  const wallUnit = { id: 'kcabinet', plan: 'kcabinet', w: 60, d: 31, h: 60, hKnown: true, wallMounted: true, qty: 1 };
  const r = LY.place({ roomType: 'konyha', room, items: [wallUnit] });
  const p = r.placed[0]; assert.ok(p.wall);
  const b = p.box, touch = [b.x - LY.WALL, b.y - LY.WALL, room.W - LY.WALL - (b.x + b.w), room.D - LY.WALL - (b.y + b.d)].some(v => Math.abs(v) < 1);
  assert.ok(touch, 'falhoz tapad');
  const low = { x: b.x, y: b.y, w: 40, d: 30, h: 80 }, tall = { ...low, h: 180 };
  assert.equal(LY.check(low, r.placed, room, null), null);
  assert.equal(LY.check(tall, r.placed, room, null), 'overlap');
  assert.equal(LY.fitsRoom({ ...wallUnit, h: 130 }, LY.roomBox(3, 2.5, 2.6)).reason, 'height', '140 cm-es szerelési magasság + 130 > 260');
});

test('R03: a mentett hely és forgatás érvényesül (ugyanaz a forrás az alaprajznak és a 3D-nek)', () => {
  const room = LY.roomBox(4, 3, 2.6), items = itemsFor('nappali', 'modern');
  const first = LY.place({ roomType: 'nappali', room, items });
  const lamp = first.placed.find(p => p.productId === 'lamp');
  const pos = { lamp: { x: 300, y: 150 } }, rot = { tv: 90 };
  const again = LY.place({ roomType: 'nappali', room, items, pos: id => pos[id] || null, rot: id => rot[id] ?? null });
  const lamp2 = again.placed.find(p => p.productId === 'lamp'), tv = again.placed.find(p => p.productId === 'tv');
  assert.deepEqual([lamp2.box.x, lamp2.box.y], [300, 150]); assert.notDeepEqual([lamp.box.x, lamp.box.y], [300, 150]);
  assert.equal(tv.rot, 90); assert.equal(tv.w, tv.baseD); assert.equal(tv.d, tv.baseW);
  // nincs két nem-szőnyeg darab átfedésben
  const solid = again.placed.filter(p => !p.rug && !p.wall);
  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) assert.ok(!overlaps(solid[i].box, solid[j].box), solid[i].instanceId + ' × ' + solid[j].instanceId);
});
