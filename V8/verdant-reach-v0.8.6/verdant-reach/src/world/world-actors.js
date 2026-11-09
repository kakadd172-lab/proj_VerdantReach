import * as THREE from 'three';
import { boxCollider, circleCollider } from './collision.js';
import { buildDrapedRoadData } from './road-geometry.js';
import { createShipModel, disposeShipModel } from './ship-models.js?v=0.8.10';
import {
  createFreeCityModel, createRuinedCastleModel,
  createFreeCityCollisionBodies, createRuinedCastleCollisionBodies,
} from './settlement-models.js?v=0.8.4-completion';

function material(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

function makeActorGableRoofGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0, 0.5, 0.5,
    -0.5, -0.5, -0.5, 0, 0.5, -0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0, 0.5, -0.5,
    0, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5,
    -0.5, -0.5, 0.5, 0, 0.5, 0.5, 0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0, 0.5, -0.5,
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}

export class WorldActorManager {
  constructor(scene, generator, intelligence, civilization, ecosystem, combat = null) {
    this.scene = scene;
    this.generator = generator;
    this.intelligence = intelligence;
    this.civilization = civilization;
    this.ecosystem = ecosystem;
    this.combat = combat;
    this.collisionWorld = null;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.originX = 0;
    this.originZ = 0;
    this.lastRefreshCell = '';
    this.lastRefreshDay = -1;
    this.settlements = new Map();
    this.ruins = new Map();
    this.npcs = new Map();
    this.animals = new Map();
    this.hostiles = new Map();
    this.vehicles = new Map();
    this.caravans = [];
    this.maritimeShips = new Map();
    this.currentHour = 8;
    this.currentDay = 1;
    this.elapsed = 0;
    this._buildAssets();
  }

  setCollisionWorld(collisionWorld) {
    this.collisionWorld = collisionWorld ?? null;
    if (!this.collisionWorld) return;
    for (const [id, record] of this.settlements) {
      this.collisionWorld.setBodies('settlement:' + id, record.collisionBodies ?? []);
    }
    for (const [id, record] of this.ruins) {
      this.collisionWorld.setBodies('ruin:' + id, record.collisionBodies ?? []);
    }
  }

  _buildAssets() {
    this.geometry = {
      house: new THREE.BoxGeometry(5.2, 3.2, 5.2),
      roof: makeActorGableRoofGeometry(),
      houseBase: new THREE.BoxGeometry(5.8, 0.42, 5.8),
      houseUpper: new THREE.BoxGeometry(5.5, 2.2, 5.5),
      houseFramePost: new THREE.BoxGeometry(0.18, 5.8, 0.18),
      houseFrameBeam: new THREE.BoxGeometry(5.9, 0.2, 0.2),
      houseChimney: new THREE.BoxGeometry(0.78, 2.2, 0.78),
      personArm: new THREE.CylinderGeometry(0.09, 0.12, 0.72, 6),
      personHat: new THREE.ConeGeometry(0.3, 0.3, 6),
      door: new THREE.BoxGeometry(0.82, 1.8, 0.12),
      window: new THREE.BoxGeometry(0.72, 0.7, 0.12),
      well: new THREE.CylinderGeometry(1.0, 1.15, 0.9, 8),
      stall: new THREE.BoxGeometry(3.8, 0.6, 2.4),
      stallPost: new THREE.CylinderGeometry(0.075, 0.11, 2.7, 6),
      stallSign: new THREE.BoxGeometry(1.6, 0.55, 0.12),
      marketGoods: new THREE.BoxGeometry(0.58, 0.48, 0.58),
      personBody: new THREE.CylinderGeometry(0.28, 0.38, 1.12, 7),
      personHead: new THREE.SphereGeometry(0.27, 9, 7),
      personLeg: new THREE.CylinderGeometry(0.105, 0.12, 0.65, 6),
      animalBody: new THREE.SphereGeometry(0.55, 9, 7),
      animalHead: new THREE.SphereGeometry(0.27, 8, 6),
      animalLeg: new THREE.CylinderGeometry(0.07, 0.09, 0.52, 5),
      horseBody: new THREE.SphereGeometry(0.7, 10, 8),
      horseHead: new THREE.SphereGeometry(0.32, 9, 7),
      wheel: new THREE.CylinderGeometry(0.6, 0.6, 0.22, 12),
      cartBed: new THREE.BoxGeometry(2.4, 0.55, 3.2),
      boatHull: new THREE.BoxGeometry(2.8, 0.65, 7.2),
      mast: new THREE.CylinderGeometry(0.08, 0.11, 6.4, 6),
      sail: new THREE.PlaneGeometry(2.7, 3.4),
      road: new THREE.BoxGeometry(1, 0.14, 1),
      crop: new THREE.BoxGeometry(0.5, 0.12, 4.2),
      cargoBox: new THREE.BoxGeometry(0.72, 0.62, 0.72),
      hostileBody: new THREE.IcosahedronGeometry(0.68, 1),
      hostileShard: new THREE.OctahedronGeometry(0.26, 0),
      hostileRing: new THREE.TorusGeometry(0.82, 0.055, 5, 28),
      river: null,
    };
    this.materials = {
      wall: [material(0x9b8061), material(0x9a8c70), material(0x7e8068), material(0x9c7959)],
      roof: [material(0x5b4840), material(0x6b5948), material(0x6b5142)],
      dark: material(0x413a32),
      window: material(0x9dc3bd, 0.35, { emissive: 0x274e4a, emissiveIntensity: 0.22 }),
      wood: material(0x78593e),
      stone: material(0x777c70),
      crop: material(0x758e4f),
      road: material(0x9a896b),
      roadShoulder: material(0x756b56),
      person: [material(0x49685e), material(0x8b6c4b), material(0x6a647a), material(0xa08b65), material(0x657d88)],
      skin: material(0xc69a76),
      leg: material(0x433f39),
      horse: material(0x866346),
      animal: new Map(),
      boat: material(0x5f4937),
      awning: [material(0x9a5947), material(0xc4a873), material(0x587568), material(0x82794e)],
      marketGoods: [material(0x9b7546), material(0x7d8e50), material(0x8b5441), material(0x6f806a)],
      sail: material(0xd4c7a7, 0.9, { side: THREE.DoubleSide }),
      metal: material(0x8a948b, 0.55, { metalness: 0.25 }),
      hostile: material(0x526b68, 0.56, { emissive: 0x173c37, emissiveIntensity: 0.72 }),
      hostileAccent: material(0x9cc9a8, 0.42, { emissive: 0x315b45, emissiveIntensity: 0.42 }),
    };
  }

  _addHouse(group, x, z, index, scale = 1) {
    const sample = this.generator.sample(x, z);
    if (!Number.isFinite(sample.height)) return;
    const house = new THREE.Group();
    const base = new THREE.Mesh(this.geometry.houseBase, this.materials.stone);
    base.position.y = 0.2 * scale; base.scale.setScalar(scale); base.castShadow = true; base.receiveShadow = true; house.add(base);
    const wall = new THREE.Mesh(this.geometry.house, this.materials.wall[index % this.materials.wall.length]);
    wall.position.y = 1.8 * scale; wall.scale.setScalar(scale); wall.castShadow = true; wall.receiveShadow = true; house.add(wall);
    const upper = new THREE.Mesh(this.geometry.houseUpper, this.materials.wall[(index + 1) % this.materials.wall.length]);
    upper.position.y = 4.55 * scale; upper.scale.setScalar(scale); upper.castShadow = true; upper.receiveShadow = true; house.add(upper);
    const roof = new THREE.Mesh(this.geometry.roof, this.materials.roof[index % this.materials.roof.length]);
    roof.position.y = 6.35 * scale; roof.scale.set(5.9 * scale, 2.75 * scale, 5.9 * scale);
    roof.castShadow = true; roof.receiveShadow = true; house.add(roof);
    for (const side of [-1, 1]) for (const front of [-1, 1]) {
      const post = new THREE.Mesh(this.geometry.houseFramePost, this.materials.wood);
      post.position.set(side * 2.48 * scale, 2.9 * scale, front * 2.56 * scale);
      post.scale.setScalar(scale); house.add(post);
    }
    for (const y of [3.45, 5.65]) {
      const beam = new THREE.Mesh(this.geometry.houseFrameBeam, this.materials.wood);
      beam.position.set(0, y * scale, 2.67 * scale); beam.scale.setScalar(scale); house.add(beam);
    }
    const door = new THREE.Mesh(this.geometry.door, this.materials.dark);
    door.position.set(0, 0.91 * scale, 2.67 * scale); door.scale.setScalar(scale); house.add(door);
    for (const side of [-1, 1]) {
      const windowMesh = new THREE.Mesh(this.geometry.window, this.materials.window);
      windowMesh.position.set(side * 1.62 * scale, 2.0 * scale, 2.68 * scale); windowMesh.scale.setScalar(scale); house.add(windowMesh);
      const upperWindow = new THREE.Mesh(this.geometry.window, this.materials.window);
      upperWindow.position.set(side * 1.35 * scale, 4.65 * scale, 2.82 * scale); upperWindow.scale.setScalar(scale * 0.9); house.add(upperWindow);
      const shutter = new THREE.Mesh(this.geometry.houseFrameBeam, this.materials.wood);
      shutter.scale.set(0.12 * scale, 0.85 * scale, 0.12 * scale);
      shutter.position.set(side * 2.0 * scale, 2.0 * scale, 2.76 * scale); house.add(shutter);
    }
    const chimney = new THREE.Mesh(this.geometry.houseChimney, this.materials.stone);
    chimney.position.set((index % 2 ? 1 : -1) * 1.7 * scale, 6.0 * scale, -1.35 * scale);
    chimney.scale.setScalar(scale); house.add(chimney);
    house.position.set(x, sample.height, z); group.add(house);
  }

  _createSettlement(settlement, day) {
    const root = new THREE.Group();
    const collisionBodies = [];
    root.userData.settlementId = settlement.id;
    if (settlement.type === 'freeCity') {
      root.add(createFreeCityModel(settlement, this.generator));
      collisionBodies.push(...createFreeCityCollisionBodies(settlement, this.generator));
    } else {
      const count = settlement.buildingCount;
      for (let i = 0; i < count; i += 1) {
        const angle = i * Math.PI * 2 / count + (settlement.seed % 13) * 0.08;
        const radius = 15 + (i % 3) * 7;
        const x = settlement.x + Math.cos(angle) * radius;
        const z = settlement.z + Math.sin(angle) * radius;
        const sample = this.generator.sample(x, z, true);
        const houseScale = i % 4 === 0 ? 1.12 : 0.92;
        if (sample.slope < 0.5 && sample.height > 0) {
          this._addHouse(root, x, z, i, houseScale);
          collisionBodies.push(boxCollider('house-' + i, x, z, 5.8 * houseScale, 5.8 * houseScale, 0, { kind: 'settlement-house' }));
        }
      }

      const well = new THREE.Mesh(this.geometry.well, this.materials.stone);
      well.position.set(settlement.x, settlement.elevation + 0.45, settlement.z);
      well.castShadow = true;
      root.add(well);
      collisionBodies.push(circleCollider('settlement-well', settlement.x, settlement.z, 1.2, { kind: 'well' }));
      // The detailed, stocked stalls are added below; do not draw a duplicate empty counter.
      for (let i = 0; i < 5; i += 1) {
        const crop = new THREE.Mesh(this.geometry.crop, this.materials.crop);
        crop.position.set(settlement.x - 19 + i * 2, settlement.elevation + 0.12, settlement.z + 32 + (i % 2) * 1.3);
        root.add(crop);
      }
      const stallCount = settlement.type === 'port' ? 7 : settlement.type === 'market' ? 6 : 3;
      for (let index = 0; index < stallCount; index += 1) {
        const angle = (index / stallCount) * Math.PI * 2 + 0.35;
        const radius = settlement.type === 'port' ? 16 : 14;
        const x = settlement.x + Math.cos(angle) * radius, z = settlement.z + Math.sin(angle) * radius;
        const stall = new THREE.Group(); stall.rotation.y = angle + Math.PI * 0.5;
        const counter = new THREE.Mesh(this.geometry.stall, this.materials.wood); counter.position.y = 1.05; counter.castShadow = true; stall.add(counter);
        const canopy = new THREE.Mesh(this.geometry.sail, this.materials.awning[index % this.materials.awning.length]);
        canopy.rotation.x = -Math.PI / 2; canopy.scale.set(1.72, 1.08, 1); canopy.position.y = 3.05; canopy.castShadow = true; stall.add(canopy);
        for (const side of [-1, 1]) for (const end of [-1, 1]) {
          const post = new THREE.Mesh(this.geometry.stallPost, this.materials.wood);
          post.position.set(side * 1.62, 1.88, end * 1.05); stall.add(post);
        }
        const sign = new THREE.Mesh(this.geometry.stallSign, this.materials.wood); sign.position.set(0, 3.55, 1.33); stall.add(sign);
        for (let goods = 0; goods < 3; goods += 1) {
          const item = new THREE.Mesh(this.geometry.marketGoods, this.materials.marketGoods[(index + goods) % this.materials.marketGoods.length]);
          item.position.set(-1.25 + goods * 1.25, 1.62, 0.1); item.scale.setScalar(0.8 + (goods % 2) * 0.14); stall.add(item);
        }
        stall.position.set(x, this.generator.heightAt(x, z), z); root.add(stall);
        collisionBodies.push(boxCollider('market-stall-' + index, x, z, 4.1, 3.0, angle + Math.PI * 0.5, { kind: 'market-stall' }));
      }
    }

    const state = this.civilization.ensureSettlement(settlement, day);
    const npcActors = [];
    state.npcs.forEach((npc, index) => {
      const actor = this._createPerson(npc, settlement, index);
      root.add(actor.group);
      npcActors.push(actor);
      this.npcs.set(npc.id, actor);
    });

    const horse = this._createHorse(settlement);
    root.add(horse.group);
    this.vehicles.set(horse.id, horse);

    let boat = null;
    if (settlement.type === 'port' || settlement.coastAccess) {
      const shore = this._findShore(settlement);
      if (shore) {
        boat = this._createBoat(settlement, shore);
        root.add(boat.group);
        this.vehicles.set(boat.id, boat);
      }
    }

    const cart = this._createCart(settlement);
    root.add(cart.group);
    this.vehicles.set(cart.id, cart);

    this.root.add(root);
    this.collisionWorld?.setBodies('settlement:' + settlement.id, collisionBodies);
    return { root, settlement, state, npcActors, horse, cart, boat, collisionBodies };
  }

  _createRuin(site) {
    const group = createRuinedCastleModel(site, this.generator);
    const collisionBodies = createRuinedCastleCollisionBodies(site, this.generator);
    this.collisionWorld?.setBodies('ruin:' + site.id, collisionBodies);
    group.userData.interactable = {
      type: 'ruinedCastle', id: site.id,
      label: `Explore ${site.name}`,
    };
    this.root.add(group);
    return { ...site, group, collisionBodies };
  }

  _createPerson(npc, settlement, index) {
    const group = new THREE.Group();
    const colorIndex = Math.abs(npc.profession.split('').reduce((value, char) => value + char.charCodeAt(0), 0)) % this.materials.person.length;
    const body = new THREE.Mesh(this.geometry.personBody, this.materials.person[colorIndex]);
    body.position.y = 0.94;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(this.geometry.personHead, this.materials.skin);
    head.position.y = 1.72;
    head.castShadow = true;
    group.add(head);
    const legMeshes = [], armMeshes = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(this.geometry.personLeg, this.materials.leg);
      leg.position.set(side * 0.16, 0.31, 0); group.add(leg); legMeshes.push(leg);
      const arm = new THREE.Mesh(this.geometry.personArm, this.materials.person[colorIndex]);
      arm.position.set(side * 0.37, 1.02, 0); arm.rotation.z = side * -0.12; arm.castShadow = true;
      group.add(arm); armMeshes.push(arm);
    }
    if (npc.profession === 'guard' || npc.profession === 'trader') {
      const hat = new THREE.Mesh(this.geometry.personHat, npc.profession === 'guard' ? this.materials.metal : this.materials.wood);
      hat.position.y = 1.96; hat.castShadow = true; group.add(hat);
    }
    const homeX = settlement.x + npc.homeOffset.x;
    const homeZ = settlement.z + npc.homeOffset.z;
    group.position.set(homeX, this.generator.heightAt(homeX, homeZ), homeZ);
    group.userData.interactable = { type: 'npc', id: npc.id, label: npc.profession === 'trader' ? 'Speak with trader' : `Speak with ${npc.name}` };
    return { id: npc.id, npc, settlement, group, homeX, homeZ, x: homeX, z: homeZ, phase: index * 1.7, scheduleKey: '', routePath: [], routeIndex: 0, armMeshes, legMeshes };
  }

  _createAnimal(animal) {
    const group = new THREE.Group();
    let bodyMaterial = this.materials.animal.get(animal.species);
    if (!bodyMaterial) {
      bodyMaterial = material(animal.color, 0.92);
      this.materials.animal.set(animal.species, bodyMaterial);
    }
    const body = new THREE.Mesh(this.geometry.animalBody, bodyMaterial);
    body.position.y = animal.species === 'crane' ? 0.9 : 0.7;
    body.scale.set(animal.species === 'hare' ? 0.75 : 1.25, 0.8, 0.7);
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(this.geometry.animalHead, bodyMaterial);
    head.position.set(0, 1.1, 0.72);
    head.scale.set(0.8, 0.82, 1.0);
    group.add(head);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(this.geometry.animalLeg, bodyMaterial);
        leg.position.set(sx * 0.35, 0.26, sz * 0.27);
        group.add(leg);
      }
    }
    const y = this.generator.heightAt(animal.x, animal.z);
    group.position.set(animal.x, y, animal.z);
    group.userData.interactable = { type: 'wildlife', id: animal.id, label: `Observe ${animal.label}` };
    return { ...animal, group, x: animal.x, z: animal.z, baseX: animal.x, baseZ: animal.z };
  }

  _createHostile(hostile) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geometry.hostileBody, this.materials.hostile);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);
    for (let i = 0; i < 4; i += 1) {
      const shard = new THREE.Mesh(this.geometry.hostileShard, this.materials.hostileAccent);
      const angle = i * Math.PI * 0.5 + hostile.phase;
      shard.position.set(Math.cos(angle) * 0.66, 1.05 + (i % 2) * 0.38, Math.sin(angle) * 0.66);
      shard.scale.set(0.68, 1.25, 0.68);
      shard.rotation.z = (i % 2 ? -1 : 1) * 0.42;
      group.add(shard);
    }
    const ring = new THREE.Mesh(this.geometry.hostileRing, this.materials.hostileAccent);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.28;
    group.add(ring);
    group.position.set(hostile.x, hostile.y, hostile.z);
    group.userData.interactable = { type: 'hostile', id: hostile.id, label: `Challenge ${hostile.name.toLowerCase()}` };
    return { ...hostile, group, baseX: hostile.x, baseZ: hostile.z };
  }

  _createHorse(settlement) {
    const id = `vehicle:${settlement.id}:horse`;
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.geometry.horseBody, this.materials.horse);
    body.position.set(0, 1.0, 0);
    body.scale.set(0.8, 0.75, 1.45);
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(this.geometry.horseHead, this.materials.horse);
    head.position.set(0, 1.65, 1.15);
    head.scale.set(0.72, 1.15, 0.75);
    group.add(head);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(this.geometry.animalLeg, this.materials.horse);
      leg.position.set(sx * 0.42, 0.35, sz * 0.58);
      group.add(leg);
    }
    const x = settlement.x - 25;
    const z = settlement.z - 13;
    group.position.set(x, this.generator.heightAt(x, z), z);
    group.userData.vehicle = { id, mode: 'horse', label: 'Ride horse' };
    return { id, mode: 'horse', group, x, z, settlementId: settlement.id };
  }

  _createCart(settlement) {
    const id = `vehicle:${settlement.id}:cart`;
    const group = new THREE.Group();
    const bed = new THREE.Mesh(this.geometry.cartBed, this.materials.wood);
    bed.position.y = 1.0;
    bed.castShadow = true;
    group.add(bed);
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(this.geometry.wheel, this.materials.dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.35, 0.68, 0);
      group.add(wheel);
    }
    const x = settlement.x + 26;
    const z = settlement.z + 4;
    group.position.set(x, this.generator.heightAt(x, z), z);
    group.userData.vehicle = { id, mode: 'cart', label: 'Take the handcart' };
    return { id, mode: 'cart', group, x, z, settlementId: settlement.id };
  }

  _findShore(settlement) {
    let best = null;
    for (let i = 0; i < 32; i += 1) {
      const angle = i * Math.PI * 2 / 32;
      for (let radius = 28; radius <= 170; radius += 14) {
        const x = settlement.x + Math.cos(angle) * radius;
        const z = settlement.z + Math.sin(angle) * radius;
        const height = this.generator.heightAt(x, z);
        if (height < 0.4 && height > -30) {
          const score = Math.abs(height + 0.2) + radius * 0.002;
          if (!best || score < best.score) best = { x, z, score };
          break;
        }
      }
    }
    return best;
  }

  _createBoat(settlement, shore) {
    const id = `vehicle:${settlement.id}:boat`;
    const group = new THREE.Group();
    const hull = new THREE.Mesh(this.geometry.boatHull, this.materials.boat);
    hull.position.y = 0.1;
    hull.castShadow = true;
    group.add(hull);
    const mast = new THREE.Mesh(this.geometry.mast, this.materials.wood);
    mast.position.set(0, 3.4, -0.4);
    group.add(mast);
    const sail = new THREE.Mesh(this.geometry.sail, this.materials.sail);
    sail.position.set(0, 3.2, -0.35);
    sail.rotation.y = Math.PI / 2;
    group.add(sail);
    group.position.set(shore.x, -0.12, shore.z);
    group.rotation.y = Math.atan2(settlement.x - shore.x, settlement.z - shore.z);
    group.userData.vehicle = { id, mode: 'boat', label: 'Sail skiff' };
    return { id, mode: 'boat', group, x: shore.x, z: shore.z, settlementId: settlement.id };
  }

  _makeRoad(link) {
    const path = link.path?.length >= 2 ? link.path : [link.a, link.b];
    const minX = Math.min(...path.map((point) => point.x)) - 80;
    const maxX = Math.max(...path.map((point) => point.x)) + 80;
    const minZ = Math.min(...path.map((point) => point.z)) - 80;
    const maxZ = Math.max(...path.map((point) => point.z)) + 80;
    const rivers = this.intelligence.riversInBounds(minX, minZ, maxX, maxZ);

    const nearestRiver = (x, z) => {
      let nearest = null;
      for (const river of rivers) {
        for (let i = 1; i < river.path.length; i += 1) {
          const a = river.path[i - 1];
          const b = river.path[i];
          const dx = b.x - a.x;
          const dz = b.z - a.z;
          const lengthSq = dx * dx + dz * dz || 1;
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / lengthSq));
          const px = a.x + dx * t;
          const pz = a.z + dz * t;
          const startWidth = a.width ?? 2;
          const endWidth = b.width ?? startWidth;
          const width = startWidth + (endWidth - startWidth) * t;
          const distance = Math.hypot(x - px, z - pz);
          if (distance <= width * 0.5 + 2.6 && (!nearest || distance < nearest.distance)) {
            const startY = a.y ?? this.generator.heightAt(px, pz);
            const endY = b.y ?? startY;
            nearest = { distance, y: startY * (1 - t) + endY * t, width };
          }
        }
      }
      return nearest;
    };
    const surfaceHeightAt = (x, z) => {
      const terrain = this.generator.heightAt(x, z);
      const river = nearestRiver(x, z);
      return river ? Math.max(terrain, river.y + 0.72) : terrain;
    };

    // Both the road and its shoulder are sampled across their full width and
    // along the route. A shallow crown sheds water instead of trapping it.
    const shoulderData = buildDrapedRoadData(path, surfaceHeightAt, {
      width: 6.2, maxSpacing: 4, clearance: 0.055, camberRatio: 0.018, crossSegments: 4,
    });
    const roadData = buildDrapedRoadData(path, surfaceHeightAt, {
      width: 4.35, maxSpacing: 4, clearance: 0.16, camberRatio: 0.025, crossSegments: 4,
    });
    const makeGeometry = (data) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geometry.setIndex(data.indices);
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      return geometry;
    };
    const group = new THREE.Group();
    const shoulderGeometry = makeGeometry(shoulderData);
    const shoulder = new THREE.Mesh(shoulderGeometry, this.materials.roadShoulder);
    shoulder.receiveShadow = true;
    group.add(shoulder);
    const roadGeometry = makeGeometry(roadData);
    const roadSurface = new THREE.Mesh(roadGeometry, this.materials.road);
    roadSurface.receiveShadow = true;
    group.add(roadSurface);

    // Where the sampled route meets a river channel, lift the deck over water
    // and add closely spaced timber boards rather than letting the road vanish.
    const bridgePoints = roadData.points.filter((point) => nearestRiver(point.x, point.z));
    for (const point of bridgePoints) {
      const index = roadData.points.indexOf(point);
      const before = roadData.points[Math.max(0, index - 1)];
      const after = roadData.points[Math.min(roadData.points.length - 1, index + 1)];
      const yaw = Math.atan2(after.x - before.x, after.z - before.z);
      const deckY = surfaceHeightAt(point.x, point.z) + 0.28;
      const board = new THREE.Mesh(this.geometry.road, this.materials.wood);
      board.scale.set(4.75, 1.75, 3.9);
      board.position.set(point.x, deckY, point.z);
      board.rotation.y = yaw;
      board.castShadow = true;
      group.add(board);
      if (index % 2 === 0) {
        for (const side of [-1, 1]) {
          const rail = new THREE.Mesh(this.geometry.road, this.materials.wood);
          rail.scale.set(0.16, 0.92, 3.9);
          rail.position.set(
            point.x + Math.cos(yaw) * side * 2.25,
            deckY + 0.54,
            point.z - Math.sin(yaw) * side * 2.25
          );
          rail.rotation.y = yaw;
          group.add(rail);
        }
      }
    }
    group.userData.routeGeometries = [shoulderGeometry, roadGeometry];
    return group;
  }

  _createCaravan(link, index, convoy = null) {
    const group = new THREE.Group();
    const cart = new THREE.Mesh(this.geometry.cartBed, this.materials.wood);
    cart.position.y = 1.0;
    group.add(cart);
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(this.geometry.wheel, this.materials.dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.35, 0.68, 0);
      group.add(wheel);
    }
    const horse = new THREE.Mesh(this.geometry.horseBody, this.materials.horse);
    horse.position.set(0, 1.05, 2.8);
    horse.scale.set(0.65, 0.65, 1.1);
    group.add(horse);
    const cargo = convoy?.cargo ?? null;
    if (cargo) {
      const crateMaterial = cargo.resource === 'fish' ? this.materials.window
        : cargo.resource === 'herbs' ? this.materials.crop
          : cargo.resource === 'timber' ? this.materials.wood : this.materials.roof[0];
      for (let i = 0; i < Math.min(3, cargo.quantity); i += 1) {
        const crate = new THREE.Mesh(this.geometry.cargoBox, crateMaterial);
        crate.position.set((i % 2 ? 0.46 : -0.46), 1.62 + Math.floor(i / 2) * 0.56, -0.15 + (i % 2) * 0.48);
        crate.castShadow = true;
        group.add(crate);
      }
    }
    this.root.add(group);
    const path = convoy?.fromId === link.b.id ? [...(link.path ?? [link.a, link.b])].reverse() : (link.path ?? [link.a, link.b]);
    const segments = [];
    let totalLength = 0;
    for (let i = 1; i < path.length; i += 1) {
      const length = Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
      segments.push({ start: path[i - 1], end: path[i], length, startDistance: totalLength });
      totalLength += length;
    }
    return { group, link, index, convoy, cargo, path, segments, totalLength, phase: (index * 0.33 + (link.a.seed % 7) * 0.03) % 1 };
  }

  _createRiverMesh(rivers) {
    const positions = [];
    const indices = [];
    for (const river of rivers) {
      for (let i = 1; i < river.path.length; i += 1) {
        const a = river.path[i - 1];
        const b = river.path[i];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const length = Math.hypot(dx, dz);
        if (length < 0.01) continue;
        const nx = -dz / length;
        const nz = dx / length;
        const wa = a.width * 0.5;
        const wb = b.width * 0.5;
        const base = positions.length / 3;
        positions.push(a.x + nx * wa, a.y, a.z + nz * wa);
        positions.push(a.x - nx * wa, a.y, a.z - nz * wa);
        positions.push(b.x + nx * wb, b.y, b.z + nz * wb);
        positions.push(b.x - nx * wb, b.y, b.z - nz * wb);
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
      for (const fall of river.waterfalls ?? []) {
        const flowLength = Math.hypot(fall.flowX, fall.flowZ) || 1;
        const nx = -fall.flowZ / flowLength;
        const nz = fall.flowX / flowLength;
        const half = fall.width * 0.5;
        const base = positions.length / 3;
        positions.push(
          fall.x + nx * half, fall.topY, fall.z + nz * half,
          fall.x - nx * half, fall.topY, fall.z - nz * half,
          fall.x + nx * half, fall.bottomY, fall.z + nz * half,
          fall.x - nx * half, fall.bottomY, fall.z - nz * half,
        );
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }
    for (const river of rivers) {
      if (!river.lake) continue;
      const lake = river.lake;
      const base = positions.length / 3;
      positions.push(lake.x, lake.y, lake.z);
      const segments = 24;
      for (let i = 0; i <= segments; i += 1) {
        const angle = i / segments * Math.PI * 2;
        positions.push(lake.x + Math.cos(angle) * lake.radius, lake.y, lake.z + Math.sin(angle) * lake.radius);
      }
      for (let i = 0; i < segments; i += 1) indices.push(base, base + i + 1, base + i + 2);
    }
    if (!positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const water = new THREE.Mesh(geometry, material(0x4e91a0, 0.24, { transparent: true, opacity: 0.78, side: THREE.DoubleSide, metalness: 0.08 }));
    water.renderOrder = 2;
    this.root.add(water);
    return water;
  }

  refreshNow(playerX, playerZ, day) {
    this.lastRefreshCell = '';
    this._refresh(playerX, playerZ, day);
  }

  _refresh(playerX, playerZ, day) {
    const radius = 2600;
    const settlementMap = new Map(this.intelligence.settlementsNear(playerX, playerZ, radius).map((item) => [item.id, item]));
    // Large free cities have a wider visual footprint than villages. Load their
    // instanced urban model a little earlier so the curtain wall and outer wards
    // do not pop into view only when the player is already close to the gates.
    for (const city of this.intelligence.settlementsNear(playerX, playerZ, 3600)) {
      if (city.type === 'freeCity' && Math.hypot(city.x - playerX, city.z - playerZ) <= 3600) settlementMap.set(city.id, city);
    }
    const settlements = [...settlementMap.values()];
    const activeIds = new Set(settlements.map((item) => item.id));
    for (const [id, record] of this.settlements) {
      if (!activeIds.has(id)) {
        this.collisionWorld?.removeBodies('settlement:' + id);
        this.root.remove(record.root);
        record.root.traverse((child) => { if (child.userData?.ownedGeometry) child.geometry?.dispose(); });
        this.settlements.delete(id);
        for (const npc of record.npcActors) this.npcs.delete(npc.id);
        if (!record.horse.detached) this.vehicles.delete(record.horse.id);
        if (!record.cart.detached) this.vehicles.delete(record.cart.id);
        if (record.boat && !record.boat.detached) this.vehicles.delete(record.boat.id);
      }
    }
    for (const settlement of settlements) {
      if (this.settlements.has(settlement.id)) continue;
      const record = this._createSettlement(settlement, day);
      this.settlements.set(settlement.id, record);
    }

    const nearbyRuins = this.intelligence.ruinsNear(playerX, playerZ, 2450);
    const activeRuinIds = new Set(nearbyRuins.map((site) => site.id));
    for (const [id, ruin] of this.ruins) {
      if (activeRuinIds.has(id)) continue;
      this.collisionWorld?.removeBodies('ruin:' + id);
      this.root.remove(ruin.group);
      this.ruins.delete(id);
    }
    for (const site of nearbyRuins) {
      if (!this.ruins.has(site.id)) this.ruins.set(site.id, this._createRuin(site));
    }

    // A resident may migrate while both towns are loaded. Reconcile the actor
    // registry so the same persistent NPC identity is never rendered twice.
    const desiredResidents = new Map();
    for (const [settlementId, record] of this.settlements) {
      record.state.npcs.forEach((npc) => desiredResidents.set(npc.id, { npc, record }));
    }
    for (const [npcId, actor] of this.npcs) {
      const desired = desiredResidents.get(npcId);
      if (desired && desired.record.settlement.id === actor.settlement.id) continue;
      actor.group.parent?.remove(actor.group);
      this.npcs.delete(npcId);
      const oldRecord = this.settlements.get(actor.settlement.id);
      if (oldRecord) oldRecord.npcActors = oldRecord.npcActors.filter((person) => person.id !== npcId);
    }
    for (const [npcId, desired] of desiredResidents) {
      if (this.npcs.has(npcId)) continue;
      const actor = this._createPerson(desired.npc, desired.record.settlement, desired.record.npcActors.length);
      desired.record.root.add(actor.group);
      desired.record.npcActors.push(actor);
      this.npcs.set(npcId, actor);
    }

    const wildlife = this.ecosystem.animalsNear(playerX, playerZ, 680);
    const wildlifeIds = new Set(wildlife.map((animal) => animal.id));
    for (const [id, animal] of this.animals) {
      if (!wildlifeIds.has(id)) {
        this.root.remove(animal.group);
        this.animals.delete(id);
      }
    }
    for (const animal of wildlife) {
      if (this.animals.has(animal.id)) continue;
      const actor = this._createAnimal(animal);
      this.root.add(actor.group);
      this.animals.set(animal.id, actor);
    }

    const hostiles = this.combat?.hostilesNear(playerX, playerZ, 680) ?? [];
    const hostileIds = new Set(hostiles.map((hostile) => hostile.id));
    for (const [id, actor] of this.hostiles) {
      if (!hostileIds.has(id)) {
        this.root.remove(actor.group);
        this.hostiles.delete(id);
      }
    }
    for (const hostile of hostiles) {
      if (this.hostiles.has(hostile.id)) continue;
      const actor = this._createHostile(hostile);
      this.root.add(actor.group);
      this.hostiles.set(hostile.id, actor);
    }

    for (const caravan of this.caravans) {
      if (caravan.group) this.root.remove(caravan.group);
      if (caravan.road) {
        this.root.remove(caravan.road);
        for (const geometry of caravan.road.userData.routeGeometries ?? []) geometry.dispose();
        caravan.road.userData.routeGeometry?.dispose();
      }
    }
    this.caravans = [];
    const settlementList = [...this.settlements.values()].map((record) => record.settlement);
    const linksById = new Map(this.intelligence.roadLinksFor(settlementList, 4400).map((link) => [link.id, link]));
    const activeConvoys = this.civilization.tradeConvoys.filter((convoy) => convoy.status === 'enroute' && convoy.arrivalDay >= day);
    for (const convoy of activeConvoys) {
      if (linksById.has(convoy.roadId)) continue;
      const a = settlementList.find((settlement) => settlement.id === convoy.fromId);
      const b = settlementList.find((settlement) => settlement.id === convoy.toId);
      if (!a || !b) continue;
      const route = this.intelligence.roadLinksFor([a, b], 4400)[0];
      if (route) linksById.set(convoy.roadId, { ...route, id: convoy.roadId });
    }
    for (const link of linksById.values()) {
      const road = this._makeRoad(link);
      this.root.add(road);
      const convoy = activeConvoys.find((item) => item.roadId === link.id) ?? null;
      if (convoy) {
        const caravan = this._createCaravan(link, this.caravans.length, convoy);
        this.caravans.push({ ...caravan, road });
      } else {
        this.caravans.push({ group: null, link, road, convoy: null, path: link.path, phase: 0 });
      }
    }
    if (this.riverMesh) {
      this.root.remove(this.riverMesh);
      this.riverMesh.geometry.dispose();
      this.riverMesh.material.dispose();
      this.riverMesh = null;
    }
    const rivers = this.intelligence.riversInBounds(playerX - 700, playerZ - 700, playerX + 700, playerZ + 700);
    this.riverMesh = this._createRiverMesh(rivers);
    this.lastRefreshCell = `${Math.floor(playerX / 90)}:${Math.floor(playerZ / 90)}`;
    this.lastRefreshDay = day;
  }

  update(delta, playerX, playerZ, hour, day, originX = this.originX, originZ = this.originZ) {
    this.elapsed += delta;
    this.currentHour = hour;
    this.currentDay = day;
    const cell = `${Math.floor(playerX / 90)}:${Math.floor(playerZ / 90)}`;
    if (cell !== this.lastRefreshCell || day !== this.lastRefreshDay) {
      this._refresh(playerX, playerZ, day);
      this.elapsed = 0;
    }
    this.originX = originX;
    this.originZ = originZ;
    this.root.position.set(-originX, 0, -originZ);

    // Detached vehicles remain available near the player after dismounting, but
    // are discarded once they are well outside the active simulation region.
    // This prevents a long journey from retaining every settlement vehicle.
    for (const [id, vehicle] of this.vehicles) {
      if (!vehicle.detached || Math.hypot(vehicle.x - playerX, vehicle.z - playerZ) <= 1250) continue;
      vehicle.group.parent?.remove(vehicle.group);
      this.vehicles.delete(id);
    }

    for (const actor of this.npcs.values()) this._updateNPC(actor, delta, hour);
    for (const animal of this.animals.values()) this._updateAnimal(animal, delta, playerX, playerZ, day);
    for (const hostile of this.hostiles.values()) this._updateHostile(hostile, delta, playerX, playerZ);
    for (const caravan of this.caravans) {
      if (caravan.group) this._updateCaravan(caravan, day, hour);
    }
  }

  _updateNPC(actor, delta, hour) {
    const { npc, settlement } = actor;
    const schedule = this.civilization.scheduleForNpc(npc, settlement, hour, this.currentDay);
    const scheduleKey = `${schedule.activity}:${Math.round(schedule.x / 4)}:${Math.round(schedule.z / 4)}`;
    if (scheduleKey !== actor.scheduleKey) {
      actor.scheduleKey = scheduleKey;
      const from = { id: `${npc.id}:from:${Math.round(actor.x)}:${Math.round(actor.z)}`, x: actor.x, z: actor.z };
      const to = { id: `${npc.id}:to:${scheduleKey}`, x: schedule.x, z: schedule.z };
      actor.routePath = this.intelligence.routePathFor(from, to, { resolution: 14 });
      actor.routeIndex = actor.routePath.length > 1 ? 1 : 0;
    }
    let target = actor.routePath[actor.routeIndex] ?? schedule;
    let dx = target.x - actor.x;
    let dz = target.z - actor.z;
    let distance = Math.hypot(dx, dz);
    if (distance < 1.8 && actor.routeIndex < actor.routePath.length - 1) {
      actor.routeIndex += 1;
      target = actor.routePath[actor.routeIndex];
      dx = target.x - actor.x;
      dz = target.z - actor.z;
      distance = Math.hypot(dx, dz);
    }
    if (distance > 0.25) {
      const speed = npc.profession === 'guard' ? 1.45 : npc.profession === 'trader' ? 1.12 : 0.98;
      const move = Math.min(distance, delta * speed);
      const nx = actor.x + dx / distance * move;
      const nz = actor.z + dz / distance * move;
      const sample = this.generator.sample(nx, nz, true);
      if (sample.height > 1.05 && sample.slope < 1.35) {
        actor.x = nx;
        actor.z = nz;
      } else {
        actor.routeIndex = Math.min(actor.routePath.length - 1, actor.routeIndex + 1);
      }
    }
    npc.activity = schedule.activity;
    actor.group.position.set(actor.x, this.generator.heightAt(actor.x, actor.z), actor.z);
    if (distance > 0.1) actor.group.rotation.y = Math.atan2(dx, dz);
    const moving = distance > 0.25;
    const gait = moving ? Math.sin(this.elapsed * 8.4 + actor.phase) * 0.36 : Math.sin(this.elapsed * 1.6 + actor.phase) * 0.025;
    actor.armMeshes?.forEach((arm, index) => { arm.rotation.x = gait * (index === 0 ? 1 : -1); });
    actor.legMeshes?.forEach((leg, index) => { leg.rotation.x = gait * (index === 0 ? -1 : 1) * 0.82; });
  }

  _createMaritimeShip(voyage) {
    const group = createShipModel(voyage.shipType ?? 'sloop');
    const cargoCount = Math.min(6, Math.max(0, Number(voyage.cargo?.quantity ?? 0)));
    const dimensions = group.userData.shipDimensionsUnits ?? { length: 14, beam: 5 };
    const deckY = group.userData.deckHeightUnits ?? 1.8;
    const crateScale = Math.max(0.42, Math.min(1, dimensions.beam / 8));
    for (let i = 0; i < cargoCount; i += 1) {
      const crate = new THREE.Mesh(this.geometry.cargoBox, this.materials.wood);
      crate.scale.setScalar(crateScale);
      const column = i % 2;
      const row = Math.floor(i / 2);
      crate.position.set((column ? 1 : -1) * dimensions.beam * 0.13, deckY + 0.34 * crateScale, -dimensions.length * 0.12 + row * dimensions.length * 0.07);
      crate.castShadow = true;
      crate.receiveShadow = true;
      group.add(crate);
    }
    group.userData.voyage = { id: voyage.id, cargo: voyage.cargo, shipType: voyage.shipType ?? 'sloop' };
    this.root.add(group);
    const path = voyage.path ?? [];
    const segments = [];
    let totalLength = 0;
    for (let i = 1; i < path.length; i += 1) {
      const length = Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
      segments.push({ start: path[i - 1], end: path[i], length, startDistance: totalLength });
      totalLength += length;
    }
    return { id: voyage.id, group, voyage, segments, totalLength };
  }

  updateMaritimeShips(voyages, absoluteDay, playerX = 0, playerZ = 0, delta = 0.016, weather = null) {
    const active = (voyages ?? []).filter((voyage) => voyage.status === 'enroute' && voyage.path?.length >= 2)
      .slice(-32).map((voyage) => {
        let nearest = Infinity;
        for (const point of voyage.path) nearest = Math.min(nearest, Math.hypot(point.x - playerX, point.z - playerZ));
        return { voyage, nearest };
      }).filter((entry) => entry.nearest <= 1100).slice(-8).map((entry) => entry.voyage);
    const ids = new Set(active.map((voyage) => voyage.id));
    for (const [id, ship] of this.maritimeShips) {
      if (ids.has(id)) continue;
      this.root.remove(ship.group);
      disposeShipModel(ship.group);
      this.maritimeShips.delete(id);
    }
    for (const voyage of active) {
      let ship = this.maritimeShips.get(voyage.id);
      if (!ship) {
        ship = this._createMaritimeShip(voyage);
        this.maritimeShips.set(voyage.id, ship);
      }
      const duration = Math.max(0.001, voyage.arrivalDay - voyage.departureDay);
      const progress = Math.max(0, Math.min(1, (absoluteDay - voyage.departureDay) / duration));
      const remaining = ship.totalLength * progress;
      const segments = ship.segments;
      let point = voyage.path[0];
      let next = voyage.path[1];
      let segment = segments[segments.length - 1];
      // Route segment lengths are cached once per voyage rather than rebuilt every frame.
      for (const candidate of segments) {
        if (remaining <= candidate.startDistance + candidate.length) {
          segment = candidate;
          break;
        }
      }
      if (segment) {
        const along = Math.max(0, Math.min(segment.length, remaining - segment.startDistance));
        const t = segment.length > 0 ? along / segment.length : 0;
        point = {
          x: segment.start.x + (segment.end.x - segment.start.x) * t,
          z: segment.start.z + (segment.end.z - segment.start.z) * t,
        };
        next = segment.end;
      }
      ship.group.position.set(point.x, -0.12 + Math.sin(absoluteDay * 12 + voyage.id.length) * 0.08, point.z);
      ship.group.rotation.y = Math.atan2(next.x - point.x, next.z - point.z) + Math.PI;
      ship.group.rotation.x = Math.sin(absoluteDay * 17 + voyage.id.length) * 0.012;
      ship.group.rotation.z = Math.cos(absoluteDay * 13 + voyage.id.length) * 0.008;
      ship.group.userData.animateShip?.(delta, { windAngle: weather?.windAngle ?? 0, windStrength: weather?.windStrength ?? 0.25 });
    }
  }

  _updateAnimal(animal, delta, playerX, playerZ, day) {
    const time = day * 24 + this.currentHour;
    const isPredator = animal.diet === 'predator' || animal.species === 'fox';
    const radius = animal.species === 'hare' ? 21 : 15;
    let tx = animal.baseX + Math.sin(time * 0.19 + animal.phase) * radius;
    let tz = animal.baseZ + Math.cos(time * 0.14 + animal.phase * 1.3) * radius;
    const dxPlayer = animal.x - playerX;
    const dzPlayer = animal.z - playerZ;
    const playerDistance = Math.hypot(dxPlayer, dzPlayer);

    if (!isPredator) {
      let nearestThreat = null;
      let threatDistance = 20;
      for (const other of this.animals.values()) {
        if (other === animal || (other.diet !== 'predator' && other.species !== 'fox')) continue;
        const d = Math.hypot(other.x - animal.x, other.z - animal.z);
        if (d < threatDistance) { nearestThreat = other; threatDistance = d; }
      }
      if (nearestThreat && playerDistance > 22 && threatDistance > 0.01) {
        tx = animal.x + (animal.x - nearestThreat.x) / threatDistance * 22;
        tz = animal.z + (animal.z - nearestThreat.z) / threatDistance * 22;
      }
    } else if (playerDistance > 22) {
      let prey = null;
      let preyDistance = 25;
      for (const other of this.animals.values()) {
        if (other === animal || other.diet === 'predator') continue;
        const d = Math.hypot(other.x - animal.x, other.z - animal.z);
        if (d < preyDistance) { prey = other; preyDistance = d; }
      }
      if (prey && preyDistance < 19) {
        tx = prey.x;
        tz = prey.z;
        if (preyDistance < 2.2 && this.ecosystem.predate(prey.id)) this.removeAnimal(prey.id);
      }
    }

    if (playerDistance < 22 && playerDistance > 0.01) {
      tx = animal.x + dxPlayer / playerDistance * (isPredator ? 9 : 18);
      tz = animal.z + dzPlayer / playerDistance * (isPredator ? 9 : 18);
    }
    const dx = tx - animal.x;
    const dz = tz - animal.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.2) {
      const speedFactor = playerDistance < 22 ? (isPredator ? 1.15 : 1.7) : isPredator ? 0.42 : 0.22;
      const move = Math.min(distance, delta * animal.speed * speedFactor);
      const nx = animal.x + dx / distance * move;
      const nz = animal.z + dz / distance * move;
      if (this.generator.heightAt(nx, nz) > 0.8) {
        animal.x = nx;
        animal.z = nz;
      }
    }
    animal.group.position.set(animal.x, this.generator.heightAt(animal.x, animal.z), animal.z);
    animal.group.rotation.y = Math.atan2(dx, dz);
  }

  _updateHostile(actor, delta, playerX, playerZ) {
    const dxPlayer = playerX - actor.x;
    const dzPlayer = playerZ - actor.z;
    const distanceToPlayer = Math.hypot(dxPlayer, dzPlayer);
    let targetX = actor.baseX + Math.sin(this.currentDay * 0.08 + actor.phase) * 3.5;
    let targetZ = actor.baseZ + Math.cos(this.currentDay * 0.07 + actor.phase) * 3.5;
    if (distanceToPlayer < 24 && distanceToPlayer > 0.01) {
      targetX = playerX - dxPlayer / distanceToPlayer * 1.8;
      targetZ = playerZ - dzPlayer / distanceToPlayer * 1.8;
    }
    const dx = targetX - actor.x;
    const dz = targetZ - actor.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 0.18) {
      const chaseFactor = distanceToPlayer < 24 ? 1 : 0.28;
      const move = Math.min(distance, delta * actor.speed * chaseFactor);
      const nx = actor.x + dx / distance * move;
      const nz = actor.z + dz / distance * move;
      if (this.generator.heightAt(nx, nz) > 1.1) {
        actor.x = nx;
        actor.z = nz;
      }
    }
    actor.group.position.set(actor.x, this.generator.heightAt(actor.x, actor.z) + 0.08, actor.z);
    actor.group.rotation.y += delta * 0.42;
  }

  _updateCaravan(caravan, day, hour) {
    let progress;
    if (caravan.convoy) {
      const currentDay = day + hour / 24;
      const duration = Math.max(1, caravan.convoy.arrivalDay - caravan.convoy.departureDay);
      progress = Math.max(0, Math.min(1, (currentDay - caravan.convoy.departureDay) / duration));
    } else {
      progress = ((day * 24 + hour) / 58 + caravan.phase) % 1;
    }
    const segments = caravan.segments ?? [];
    let remaining = caravan.totalLength * progress;
    let point = caravan.path?.[0] ?? caravan.link.a;
    let next = caravan.path?.[1] ?? caravan.link.b;
    for (const segment of segments) {
      if (remaining <= segment.startDistance + segment.length || segment === segments.at(-1)) {
        const along = Math.max(0, Math.min(segment.length, remaining - segment.startDistance));
        const t = segment.length > 0 ? along / segment.length : 0;
        point = { x: segment.start.x + (segment.end.x - segment.start.x) * t, z: segment.start.z + (segment.end.z - segment.start.z) * t };
        next = segment.end;
        break;
      }
    }
    caravan.group.position.set(point.x, this.generator.heightAt(point.x, point.z) + 0.1, point.z);
    caravan.group.rotation.y = Math.atan2(next.x - point.x, next.z - point.z);
  }

  nearestNPC(x, z, maxDistance = 5.5) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const actor of this.npcs.values()) {
      const dx = actor.x - x;
      const dz = actor.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = actor; }
    }
    return nearest ? { actor: nearest, distance: Math.sqrt(best) } : null;
  }

  nearestAnimal(x, z, maxDistance = 5.5) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const actor of this.animals.values()) {
      const dx = actor.x - x;
      const dz = actor.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = actor; }
    }
    return nearest ? { actor: nearest, distance: Math.sqrt(best) } : null;
  }

  nearestHostile(x, z, maxDistance = 5) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const actor of this.hostiles.values()) {
      const dx = actor.x - x;
      const dz = actor.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = actor; }
    }
    return nearest ? { actor: nearest, distance: Math.sqrt(best) } : null;
  }

  removeHostile(id) {
    const actor = this.hostiles.get(id);
    if (!actor) return false;
    this.root.remove(actor.group);
    this.hostiles.delete(id);
    return true;
  }

  nearestVehicle(x, z, maxDistance = 7) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const vehicle of this.vehicles.values()) {
      const dx = vehicle.x - x;
      const dz = vehicle.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = vehicle; }
    }
    return nearest ? { vehicle: nearest, distance: Math.sqrt(best) } : null;
  }

  nearestSettlement(x, z, maxDistance = 1000) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const record of this.settlements.values()) {
      const dx = record.settlement.x - x;
      const dz = record.settlement.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = record; }
    }
    return nearest ? { ...nearest, distance: Math.sqrt(best) } : null;
  }

  nearestRuin(x, z, maxDistance = 24) {
    let nearest = null;
    let best = maxDistance * maxDistance;
    for (const ruin of this.ruins.values()) {
      const dx = ruin.x - x;
      const dz = ruin.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; nearest = ruin; }
    }
    return nearest ? { actor: nearest, distance: Math.sqrt(best) } : null;
  }

  removeAnimal(id) {
    const actor = this.animals.get(id);
    if (!actor) return false;
    this.root.remove(actor.group);
    this.animals.delete(id);
    return true;
  }

  detachVehicle(id) {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return false;
    if (vehicle.group.parent !== this.root) {
      vehicle.group.parent?.remove(vehicle.group);
      this.root.add(vehicle.group);
    }
    vehicle.detached = true;
    return true;
  }

  ensureVehicle(mode, id, x, z, y = 0) {
    if (!id || !['horse', 'cart', 'boat'].includes(mode)) return null;
    let vehicle = this.vehicles.get(id);
    if (vehicle && vehicle.mode !== mode) {
      vehicle.group.parent?.remove(vehicle.group);
      this.vehicles.delete(id);
      vehicle = null;
    }
    if (!vehicle) {
      const group = new THREE.Group();
      if (mode === 'horse') {
        const body = new THREE.Mesh(this.geometry.horseBody, this.materials.horse);
        body.position.set(0, 1.0, 0);
        body.scale.set(0.8, 0.75, 1.45);
        body.castShadow = true;
        group.add(body);
        const head = new THREE.Mesh(this.geometry.horseHead, this.materials.horse);
        head.position.set(0, 1.65, 1.15);
        group.add(head);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const leg = new THREE.Mesh(this.geometry.animalLeg, this.materials.horse);
          leg.position.set(sx * 0.42, 0.35, sz * 0.58);
          group.add(leg);
        }
      } else if (mode === 'cart') {
        const bed = new THREE.Mesh(this.geometry.cartBed, this.materials.wood);
        bed.position.y = 1;
        group.add(bed);
        for (const side of [-1, 1]) {
          const wheel = new THREE.Mesh(this.geometry.wheel, this.materials.dark);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(side * 1.35, 0.68, 0);
          group.add(wheel);
        }
      } else {
        const hull = new THREE.Mesh(this.geometry.boatHull, this.materials.boat);
        hull.position.y = 0.1;
        group.add(hull);
        const mast = new THREE.Mesh(this.geometry.mast, this.materials.wood);
        mast.position.set(0, 3.4, -0.4);
        group.add(mast);
        const sail = new THREE.Mesh(this.geometry.sail, this.materials.sail);
        sail.position.set(0, 3.2, -0.35);
        sail.rotation.y = Math.PI / 2;
        group.add(sail);
      }
      group.userData.vehicle = { id, mode, label: mode === 'boat' ? 'Sailing skiff' : mode === 'cart' ? 'Travel cart' : 'Riding horse' };
      this.root.add(group);
      vehicle = { id, mode, group, x, z, detached: true, settlementId: null };
      this.vehicles.set(id, vehicle);
    }
    this.detachVehicle(id);
    this.vehiclePosition(id, x, z, y);
    return vehicle;
  }

  vehiclePosition(id, playerX, playerZ, playerY) {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return;
    vehicle.x = playerX;
    vehicle.z = playerZ;
    vehicle.group.position.set(playerX, playerY, playerZ);
  }

  getSaveData() {
    return null; // All actor identity and state is held by the civilization/ecosystem systems.
  }

  dispose() {
    for (const id of this.settlements.keys()) this.collisionWorld?.removeBodies('settlement:' + id);
    for (const id of this.ruins.keys()) this.collisionWorld?.removeBodies('ruin:' + id);
    this.scene.remove(this.root);
    for (const caravan of this.caravans) {
      for (const geometry of caravan.road?.userData.routeGeometries ?? []) geometry.dispose();
      caravan.road?.userData.routeGeometry?.dispose();
    }
    for (const record of this.settlements.values()) {
      record.root.traverse((child) => { if (child.userData?.ownedGeometry) child.geometry?.dispose(); });
    }
    this.caravans = [];
    for (const ship of this.maritimeShips.values()) {
      this.root.remove(ship.group);
      disposeShipModel(ship.group);
    }
    this.maritimeShips.clear();
    this.geometry.road.dispose();
    Object.values(this.geometry).forEach((geometry) => geometry?.dispose?.());
    for (const mat of Object.values(this.materials)) {
      if (Array.isArray(mat)) mat.forEach((item) => item.dispose());
      else if (mat instanceof Map) mat.forEach((item) => item.dispose());
      else mat?.dispose?.();
    }
    this.settlements.clear();
    this.ruins.clear();
    this.npcs.clear();
    this.animals.clear();
    this.hostiles.clear();
    this.vehicles.clear();
  }
}
