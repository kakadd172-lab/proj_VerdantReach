import * as THREE from 'three';
import { SHIP_DESIGNS, getShipDesign } from './ship-designs.js?v=0.8.5';
import { getHullHalfBeam, getHullSectionWidth, getHullKeelY, getDeckSheer, getHullFrameCount, getShipStructureBlueprint, getSheerPoint } from './ship-structures.js?v=0.8.5';
import { getParametricHullPoint, getOpenHullPoint, getStemProfile, getSternProfile } from './ship-hull-parameterization.js?v=0.8.5';

const COLORS = Object.freeze({
  hull: 0x684632, lower: 0x3e342d, plank: 0x8d6b4b, deck: 0xb1946a,
  trim: 0x49382b, rope: 0x6d5944, sail: 0xe5dcc8, sailShade: 0xbdb39a,
  iron: 0x58615f, brass: 0xb58b4e, flag: 0x8b4938,
});
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
const lerp = (a, b, t) => a + (b - a) * t;

function createMaterials() {
  return {
    hull: new THREE.MeshStandardMaterial({ color: COLORS.hull, roughness: .9, side: THREE.DoubleSide }),
    lower: new THREE.MeshStandardMaterial({ color: COLORS.lower, roughness: .94, side: THREE.DoubleSide }),
    plank: new THREE.MeshStandardMaterial({ color: COLORS.plank, roughness: .92 }),
    deck: new THREE.MeshStandardMaterial({ color: COLORS.deck, roughness: .94, side: THREE.DoubleSide }),
    trim: new THREE.MeshStandardMaterial({ color: COLORS.trim, roughness: .88 }),
    rope: new THREE.MeshStandardMaterial({ color: COLORS.rope, roughness: 1 }),
    sail: new THREE.MeshStandardMaterial({ color: COLORS.sail, roughness: 1, side: THREE.DoubleSide }),
    sailShade: new THREE.MeshStandardMaterial({ color: COLORS.sailShade, roughness: 1, side: THREE.DoubleSide }),
    iron: new THREE.MeshStandardMaterial({ color: COLORS.iron, roughness: .72, metalness: .22 }),
    brass: new THREE.MeshStandardMaterial({ color: COLORS.brass, roughness: .58, metalness: .28 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x7faaa6, roughness: .35, metalness: .08, transparent: true, opacity: .72 }),
    flag: new THREE.MeshStandardMaterial({ color: COLORS.flag, roughness: .96, side: THREE.DoubleSide }),
  };
}

function registerPart(registry, name, parent) {
  const group = new THREE.Group();
  group.name = name;
  group.userData.shipPart = true;
  parent.add(group);
  if (registry.has(name)) throw new Error('Duplicate ship component: ' + name);
  registry.set(name, group);
  return group;
}

function mastLocalPoint(mastGroup, point) {
  return point.clone().sub(mastGroup.position);
}

function addMesh(parent, geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name || '';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.shipOwned = true;
  parent.add(mesh);
  return mesh;
}

function addBeam(parent, material, start, end, radius, name) {
  const a = start.isVector3 ? start : V(...start);
  const b = end.isVector3 ? end : V(...end);
  const direction = b.clone().sub(a);
  const length = direction.length();
  if (length < .001) return null;
  const mesh = addMesh(parent, new THREE.CylinderGeometry(radius * .82, radius, length, 9, 1), material, name);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), direction.normalize());
  return mesh;
}

function addTube(parent, points, radius, material, name, tubularSegments = 48) {
  if (points.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(points.map((p) => p.isVector3 ? p : V(...p)));
  const mesh = addMesh(parent, new THREE.TubeGeometry(curve, tubularSegments, radius, 7, false), material, name);
  return mesh;
}

function hullPoint(design, t, angle) {
  const profile = getShipStructureBlueprint(design.id);
  const deckY = getDeckSheer(design, t);
  const point = getParametricHullPoint(design, profile, t, angle, deckY);
  return V(point.x, point.y, point.z);
}

function hullSectionPoint(design, station, section, side = 1) {
  const profile = getShipStructureBlueprint(design.id);
  const point = getOpenHullPoint(design, profile, station, section, side, getDeckSheer(design, station));
  return V(point.x, point.y, point.z);
}

function mastWorldPoint(mastGroup, point) {
  return point.clone().sub(mastGroup.position).applyQuaternion(mastGroup.quaternion).add(mastGroup.position);
}

function hullGeometry(design) {
  const stations = 96;
  const ringSegments = 40;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    for (let j = 0; j <= ringSegments; j += 1) {
      const p = hullPoint(design, t, (j / ringSegments) * Math.PI * 2);
      positions.push(p.x, p.y, p.z);
    }
  }
  const row = ringSegments + 1;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < ringSegments; j += 1) {
      const a = i * row + j;
      indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }

  // Close the forward and aft cross-section boundaries. The end faces are
  // separate triangles so nonzero transom widths do not leave open holes.
  const endCapIndices = [];
  for (const stationIndex of [0, stations]) {
    const t = stationIndex / stations;
    const deckY = getDeckSheer(design, t);
    const keelY = getHullKeelY(design, t);
    const midSection = getOpenHullPoint(design, getShipStructureBlueprint(design.id), t, .5, 1, deckY);
    const centreIndex = positions.length / 3;
    // End caps use the same curved stem/transom station as the hull perimeter.
    positions.push(0, (deckY + keelY) * .5, midSection.z);
    for (let j = 0; j < ringSegments; j += 1) {
      const a = stationIndex * row + j;
      const b = a + 1;
      endCapIndices.push(centreIndex, a, b);
    }
  }
  indices.push(...endCapIndices);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function deckGeometry(design) {
  const stations = 72;
  const across = 20;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const edge = getSheerPoint(design, t, 1);
    for (let j = 0; j <= across; j += 1) {
      const u = (j / across) * 2 - 1;
      const camber = design.hull.deckCamber * design.deckHeightUnits * (1 - u * u);
      positions.push(u * edge.x, edge.y + camber, edge.z);
    }
  }
  const row = across + 1;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < across; j += 1) {
      const a = i * row + j;
      indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addHullAndDeck(design, root, registry, mats) {
  const hull = registerPart(registry, 'hull', root);
  addMesh(hull, hullGeometry(design), mats.hull, 'lofted-hull-shell');
  const deck = registerPart(registry, 'deck', root);
  addMesh(deck, deckGeometry(design), mats.deck, 'cambered-weather-deck');

  const keel = registerPart(registry, 'keel', root);
  const profile = getShipStructureBlueprint(design.id);
  const keelPoints = [];
  for (let i = 0; i <= 28; i += 1) {
    const t = i / 28;
    const keelY = getHullKeelY(design, t);
    const keelEdge = getOpenHullPoint(design, profile, t, 0, 1, getDeckSheer(design, t));
    keelPoints.push(V(0, keelY - (design.id === 'junk' ? .02 : .06), keelEdge.z));
  }
  const keelRadius = design.id === 'junk'
    ? Math.max(.04, design.beamUnits * .006)
    : Math.max(.08, design.beamUnits * .018);
  addTube(keel, keelPoints, keelRadius, mats.trim, design.id === 'junk' ? 'shallow-centre-keelson' : 'keelson-and-keel', 84);

  const stem = registerPart(registry, 'stem', root);
  if (design.id !== 'junk') {
    const stemPoints = [];
    const sternPostPoints = [];
    const bowDeck = getDeckSheer(design, 0);
    const sternDeck = getDeckSheer(design, 1);
    for (let i = 0; i <= 20; i += 1) {
      const fraction = i / 20;
      const bow = getStemProfile(design, profile, fraction, bowDeck);
      const stern = getSternProfile(design, profile, fraction, sternDeck);
      stemPoints.push(V(0, bow.y, bow.z));
      sternPostPoints.push(V(0, stern.y, stern.z));
    }
    addTube(stem, stemPoints, Math.max(.1, design.beamUnits * .025), mats.trim, 'curved-stem-post', 48);
    addTube(stem, sternPostPoints, Math.max(.09, design.beamUnits * .022), mats.trim, 'curved-stern-post', 48);
  }
}


function raisedDeckPatchGeometry(design, startStation, endStation, lift) {
  const stations = Math.max(8, Math.ceil((endStation - startStation) * 120));
  const across = 16;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = startStation + (endStation - startStation) * (i / stations);
    const edge = getSheerPoint(design, t, 1);
    const half = edge.x * .88;
    for (let j = 0; j <= across; j += 1) {
      const u = (j / across) * 2 - 1;
      const camber = design.hull.deckCamber * design.deckHeightUnits * .7 * (1 - u * u);
      positions.push(u * half, edge.y + lift + camber, edge.z);
    }
  }
  const row = across + 1;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < across; j += 1) {
      const a = i * row + j;
      indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addRaisedDecks(design, root, registry, mats) {
  const group = registerPart(registry, 'raised-decks', root);
  const structure = getShipStructureBlueprint(design.id);
  const visibleDecks = Math.max(1, Math.floor(structure?.visibleDecks ?? 1));
  const forecastleLength = clamp(structure?.forecastleLength ?? 0, 0, .32);
  const quarterdeckLength = clamp(structure?.quarterdeckLength ?? 0, 0, .38);
  const baseLift = design.deckHeightUnits * .16;
  if (visibleDecks >= 2 && forecastleLength > .035) {
    const start = .045;
    const end = Math.min(.46, start + forecastleLength);
    addMesh(group, raisedDeckPatchGeometry(design, start, end, baseLift), mats.deck, 'forecastle-raised-deck');
  }
  if (visibleDecks >= 2 && quarterdeckLength > .035) {
    const end = .955;
    const start = Math.max(.58, end - quarterdeckLength);
    addMesh(group, raisedDeckPatchGeometry(design, start, end, baseLift), mats.deck, 'quarterdeck-raised-deck');
  }
  if (visibleDecks >= 3 && quarterdeckLength > .08) {
    addMesh(group, raisedDeckPatchGeometry(design, .86, .955, baseLift * 1.75), mats.deck, 'upper-afterdeck');
  }
}

function addFrames(design, root, registry, mats) {
  const count = getHullFrameCount(design);
  for (let i = 0; i < count; i += 1) {
    const t = .035 + (.93 * i) / Math.max(1, count - 1);
    const frame = registerPart(registry, 'frame-' + String(i + 1).padStart(2, '0'), root);
    const points = [];
    for (let j = 0; j <= 48; j += 1) {
      points.push(hullPoint(design, t, (j / 48) * Math.PI * 2));
    }
    addTube(frame, points, Math.max(.035, design.beamUnits * .006), mats.trim, 'rising-frame', 48);
  }
}

function addStrakesAndPlanking(design, root, registry, mats) {
  const strakes = registerPart(registry, 'hull-strakes', root);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 7; row += 1) {
      const vertical = .17 + row * .105;
      const points = [];
      for (let i = 0; i <= 64; i += 1) {
        const t = .025 + (.95 * i) / 64;
        const p = hullSectionPoint(design, t, vertical, side);
        p.y += .018;
        points.push(p);
      }
      addTube(strakes, points, Math.max(.018, design.beamUnits * .0035), row === 0 ? mats.lower : mats.plank, 'strake-' + side + '-' + row, 72);
    }
  }

  const structure = getShipStructureBlueprint(design.id);
  for (let index = 0; index < (structure?.waleHeights ?? []).length; index += 1) {
    const height = structure.waleHeights[index];
    for (const side of [-1, 1]) {
      const points = [];
      for (let i = 0; i <= 64; i += 1) {
        const t = .025 + (.95 * i) / 64;
        const point = hullSectionPoint(design, t, height, side);
        point.y += .035;
        points.push(point);
      }
      addTube(strakes, points, Math.max(.035, design.beamUnits * .0075), mats.lower, 'wale-' + side + '-' + index, 80);
    }
  }

  const deckPlanks = registerPart(registry, 'deck-planks', root);
  for (let plank = -8; plank <= 8; plank += 1) {
    const u = plank / 9;
    const points = [];
    for (let i = 0; i <= 48; i += 1) {
      const t = .035 + (.93 * i) / 48;
      const edge = getSheerPoint(design, t, 1);
      const y = edge.y + design.hull.deckCamber * design.deckHeightUnits * (1 - u * u) + .024;
      points.push(V(u * edge.x * .97, y, edge.z));
    }
    addTube(deckPlanks, points, .012, mats.plank, 'deck-seam-' + plank, 50);
  }
}

function sternHouseGeometry(width, height, depth) {
  const stations = 14;
  const ring = [
    [-0.84, 0], [-1.0, .28], [-.96, .74], [-.74, 1],
    [.74, 1], [.96, .74], [1.0, .28], [.84, 0],
  ];
  const positions = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const fullness = .84 + .16 * Math.sin(Math.PI * t);
    const upperTaper = .9 + .1 * Math.sin(Math.PI * t);
    const half = width * .5 * fullness;
    const z = (t - .5) * depth;
    for (const [x, y] of ring) {
      const taper = y > .72 ? upperTaper : 1;
      positions.push(x * half * taper, y * height, z);
    }
  }
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < ring.length; j += 1) {
      const next = (j + 1) % ring.length;
      const a = i * ring.length + j;
      const b = i * ring.length + next;
      const c = (i + 1) * ring.length + j;
      const d = (i + 1) * ring.length + next;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addWindowFrame(parent, mats, x, y, z, width, height, name) {
  const glass = addMesh(parent, new THREE.BoxGeometry(width * .72, height * .72, .035), mats.glass, name + '-glass');
  glass.position.set(x, y, z);
  const halfW = width * .5;
  const halfH = height * .5;
  addBeam(parent, mats.trim, V(x - halfW, y - halfH, z), V(x + halfW, y - halfH, z), .035, name + '-sill');
  addBeam(parent, mats.trim, V(x - halfW, y + halfH, z), V(x + halfW, y + halfH, z), .035, name + '-lintel');
  addBeam(parent, mats.trim, V(x - halfW, y - halfH, z), V(x - halfW, y + halfH, z), .035, name + '-left-jamb');
  addBeam(parent, mats.trim, V(x + halfW, y - halfH, z), V(x + halfW, y + halfH, z), .035, name + '-right-jamb');
  addBeam(parent, mats.trim, V(x, y - halfH, z - .012), V(x, y + halfH, z - .012), .018, name + '-mullion');
}

function addSternworks(design, root, registry, mats) {
  const sternworks = registerPart(registry, 'sternworks', root);
  const gallery = registerPart(registry, 'stern-gallery', root);
  const windows = registerPart(registry, 'stern-windows', root);
  const configs = {
    'high-aftercastle': [{ w: .58, d: .16, h: 2.2 }, { w: .46, d: .14, h: 1.55 }, { w: .34, d: .12, h: 1.25 }],
    'galleon-castle': [{ w: .58, d: .16, h: 2.15 }, { w: .44, d: .135, h: 1.55 }, { w: .32, d: .11, h: 1.2 }],
    'first-rate-aftercastle': [{ w: .57, d: .17, h: 2.2 }, { w: .47, d: .145, h: 1.65 }, { w: .35, d: .12, h: 1.35 }],
    quarterdeck: [{ w: .5, d: .145, h: 1.7 }, { w: .37, d: .12, h: .9 }],
    'low-quarter': [{ w: .48, d: .14, h: 1.2 }, { w: .35, d: .1, h: .6 }],
    'fluyt-roundhouse': [{ w: .52, d: .15, h: 1.55 }, { w: .35, d: .12, h: .85 }],
    'low-cabin': [{ w: .42, d: .12, h: 1.3 }],
    'xebec-platform': [{ w: .38, d: .12, h: .85 }],
    'open-boat': [],
  };
  const tiers = configs[design.sternwork] ?? configs['low-cabin'];
  const deckY = getDeckSheer(design, .94);
  const sternDeckEdge = getSheerPoint(design, .94, 1);

  tiers.forEach((tier, index) => {
    const tierName = 'stern-tier-' + (index + 1);
    const group = registerPart(registry, tierName, sternworks);
    const width = design.beamUnits * tier.w;
    const depth = design.hullLengthUnits * tier.d;
    const tierHeight = tier.h * (4 / 3);
    const baseZ = sternDeckEdge.z - depth * .72;
    const body = addMesh(group, sternHouseGeometry(width, tierHeight, depth), mats.hull, 'curved-sternhouse-tier-' + (index + 1));
    body.position.set(0, deckY + tiers.slice(0, index).reduce((sum, item) => sum + item.h * (4 / 3) + .08, 0), baseZ + index * depth * .17);
    const cap = addMesh(group, new THREE.BoxGeometry(width * 1.035, .1, depth * 1.025), mats.trim, 'tier-cap-rail');
    cap.position.set(0, body.position.y + tierHeight + .06, body.position.z);

    const windowY = body.position.y + tierHeight * .58;
    const sternZ = body.position.z + depth * .5 + .025;
    const count = Math.max(2, Math.min(7, Math.round(width / 1.25)));
    for (let window = 0; window < count; window += 1) {
      const x = -width * .34 + (width * .68 * window) / Math.max(1, count - 1);
      addWindowFrame(windows, mats, x, windowY, sternZ, Math.max(.3, width * .075), Math.max(.32, tierHeight * .22), 'stern-window-' + (index + 1) + '-' + window);
    }
    for (const side of [-1, 1]) {
      const sideX = side * (width * .5 + .025);
      for (let window = 0; window < 2; window += 1) {
        const z = body.position.z - depth * .22 + window * depth * .42;
        const glass = addMesh(windows, new THREE.BoxGeometry(.035, Math.max(.3, tierHeight * .22), Math.max(.34, depth * .11)), mats.glass, 'side-window-' + side + '-' + index + '-' + window);
        glass.position.set(sideX, windowY, z);
        addBeam(windows, mats.trim, V(sideX, windowY - tierHeight * .12, z - depth * .06), V(sideX, windowY + tierHeight * .12, z - depth * .06), .03, 'side-window-post-' + side + '-' + index + '-' + window);
      }
    }
  });

  if (tiers.length > 1) {
    for (const side of [-1, 1]) {
      for (let level = 0; level < Math.min(3, tiers.length); level += 1) {
        const width = design.beamUnits * tiers[level].w;
        const depth = design.hullLengthUnits * tiers[level].d;
        const y = deckY + tiers.slice(0, level + 1).reduce((sum, item) => sum + item.h * (4 / 3), 0);
        const z = baseZ + level * depth * .17 + depth * .35;
        const railX = side * width * .53;
        addBeam(gallery, mats.trim, V(railX, y, z - depth * .55), V(railX, y, z + depth * .48), .052, 'gallery-rail-' + side + '-' + level);
        for (let post = 0; post < 5; post += 1) {
          const pz = z - depth * .5 + (depth * post) / 4;
          addBeam(gallery, mats.trim, V(railX, y - .36, pz), V(railX, y + .02, pz), .032, 'gallery-post-' + side + '-' + level + '-' + post);
        }
      }
    }
  }
}
function addBowworks(design, root, registry, mats) {
  const bowworks = registerPart(registry, 'bowworks', root);
  const bowsprit = registerPart(registry, 'bowsprit', root);
  const profile = getShipStructureBlueprint(design.id);
  if (!['open-bow', 'none'].includes(design.bowwork)) {
    const startEdge = getSheerPoint(design, .13, 1);
    const bowTip = getStemProfile(design, profile, 1, getDeckSheer(design, 0));
    const baseY = startEdge.y + .45;
    const start = V(0, baseY, startEdge.z);
    const isLongProjection = ['long-bowsprit', 'long-beak'].includes(design.bowwork);
    const end = V(0, bowTip.y + design.deckHeightUnits * .25,
      bowTip.z - design.beamUnits * (isLongProjection ? 1.2 : .72));
    addBeam(bowsprit, mats.trim, start, end, Math.max(.08, design.beamUnits * .022), 'bowsprit-spar');
    addBeam(bowworks, mats.rope, V(0, baseY + .15, startEdge.z + .02), end, .028, 'bowsprit-gammoning');
    for (const side of [-1, 1]) {
      addBeam(bowworks, mats.trim, V(side * .12, baseY, startEdge.z),
        V(side * design.beamUnits * .18, baseY - .2, bowTip.z), .045, 'headrail-' + side);
    }
    const figurehead = addMesh(bowworks, new THREE.ConeGeometry(.22, .78, 7), mats.trim, 'abstract-bow-ornament');
    figurehead.position.set(0, bowTip.y + .35, bowTip.z);
    figurehead.rotation.x = Math.PI / 2;
  }
}

function addRailings(design, root, registry, mats) {
  const railings = registerPart(registry, 'railings', root);
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'railings-port' : 'railings-starboard';
    const group = registerPart(registry, name, railings);
    const railPoints = [];
    for (let i = 0; i <= 36; i += 1) {
      const t = .1 + (.8 * i) / 36;
      const edge = hullSectionPoint(design, t, .96, side);
      const x = edge.x;
      const y = getDeckSheer(design, t) + .62;
      const z = edge.z;
      railPoints.push(V(x, y, z));
      if (i % 3 === 0) addBeam(group, mats.trim, V(x, y - .58, z), V(x, y + .05, z), .045, 'rail-post-' + i);
    }
    addTube(group, railPoints, .065, mats.trim, 'top-rail', 72);
  }
}

function addRudderAndHelm(design, root, registry, mats) {
  const rudder = registerPart(registry, 'rudder', root);
  const sternDatum = getSternProfile(design, getShipStructureBlueprint(design.id), .42, getDeckSheer(design, 1));
  const pivotOffset = design.id === 'junk' ? .12 : .22;
  rudder.position.set(0, 0, sternDatum.z + pivotOffset);
  const rudderY = -design.draftUnits * (design.id === 'junk' ? .3 : .38);
  const rudderBreadth = design.beamUnits * (design.id === 'junk' ? .2 : .12);
  const rudderDepth = design.draftUnits * (design.id === 'junk' ? 1.12 : .8);
  const blade = addMesh(rudder, new THREE.BoxGeometry(rudderBreadth, rudderDepth, .22), mats.trim, 'rudder-blade');
  blade.position.set(0, rudderY, .06);
  const stock = addBeam(rudder, mats.trim, V(0, -design.draftUnits * .4, 0), V(0, getDeckSheer(design, .97) + .3, 0), .09, 'rudder-stock');
  if (stock) stock.name = 'rudder-stock';

  const helm = registerPart(registry, 'helm', root);
  const wheel = registerPart(registry, 'helm-wheel', root);
  const deckY = getDeckSheer(design, .83);
  const wheelZ = design.hullLengthUnits * .31;
  addBeam(helm, mats.trim, V(0, deckY + .25, wheelZ), V(0, deckY + 1.15, wheelZ), .07, 'helm-post');
  const ring = addMesh(wheel, new THREE.TorusGeometry(.48, .055, 8, 20), mats.trim, 'wheel-ring');
  ring.position.set(0, deckY + 1.35, wheelZ);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    addBeam(wheel, mats.trim, V(0, deckY + 1.35, wheelZ), V(Math.cos(a) * .48, deckY + 1.35 + Math.sin(a) * .48, wheelZ), .025, 'wheel-spoke-' + i);
  }
}

function addAnchors(design, root, registry, mats) {
  const anchors = registerPart(registry, 'anchors', root);
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'port' : 'starboard';
    const anchor = registerPart(registry, 'anchor-' + suffix, anchors);
    const foreEdge = getSheerPoint(design, .1, 1);
    const x = side * foreEdge.x * .94;
    const y = foreEdge.y - .35;
    const z = foreEdge.z;
    addBeam(anchor, mats.iron, V(x, y, z), V(x, y - 1.15, z), .055, 'anchor-shank');
    addBeam(anchor, mats.iron, V(x - .42, y - .95, z), V(x + .42, y - .95, z), .06, 'anchor-stock');
    addBeam(anchor, mats.iron, V(x - .42, y - .95, z), V(x - .18, y - 1.38, z), .05, 'anchor-fluke-a');
    addBeam(anchor, mats.iron, V(x + .42, y - .95, z), V(x + .18, y - 1.38, z), .05, 'anchor-fluke-b');
    const chain = registerPart(registry, 'anchor-chain-' + suffix, anchors);
    addTube(chain, [V(x, y, z), V(x, y - .3, z - .28), V(x * .92, y - .62, z - .48)], .025, mats.iron, 'anchor-rode', 18);
  }
}

function clothGeometry(corners, fullness = .06, rows = 14, columns = 20, fullnessAxis = 'z') {
  const points = corners.map((p) => p.isVector3 ? p : V(...p));
  const positions = [];
  const indices = [];
  for (let row = 0; row <= rows; row += 1) {
    const v = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const u = column / columns;
      const lower = points[0].clone().lerp(points[3], u);
      const upper = points[1].clone().lerp(points[2], u);
      const p = lower.lerp(upper, v);
      const billow = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * fullness;
      if (fullnessAxis === 'x') p.x += billow;
      else p.z += billow;
      positions.push(p.x, p.y, p.z);
    }
  }
  const stride = columns + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * stride + column;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addSail(registry, root, mats, name, mastId, corners, fullness, parent = root, fullnessAxis = 'z', pivot = V(), pivotInParent = false) {
  const control = registerPart(registry, name, parent);
  control.position.copy(pivotInParent ? V() : pivot);
  control.userData.sailControl = { mastId, clothPart: 'cloth-' + name };
  const localCorners = corners.map((point) => point.clone().sub(pivot));
  const cloth = registerPart(registry, 'cloth-' + name, control);
  addMesh(cloth, clothGeometry(localCorners, fullness, 14, 20, fullnessAxis), mats.sail, 'sail-cloth');
  return control;
}

function addSquareRig(registry, root, mats, design, mast, mastGroup, mastBase, mastTop, levelName, levelIndex) {
  const structure = getShipStructureBlueprint(design.id);
  const mastZ = mast.z * design.hullLengthUnits;
  const origin = mastGroup.position;
  const y0 = mastBase + (mastTop - mastBase) * (.22 + levelIndex * .2);
  const y1 = Math.min(mastTop - .5, y0 + (mastTop - mastBase) * .22);
  const courseRatio = structure?.courseYardToBeam ?? 1.45;
  const levelRatio = levelIndex === 0 ? 1
    : levelIndex === 1 ? (structure?.topsailYardRatio ?? .72)
      : (structure?.topgallantYardRatio ?? .5);
  const width = design.beamUnits * courseRatio * levelRatio * (structure?.yardSpread ?? 1);
  const yard = registerPart(registry, 'yard-' + mast.id + '-' + levelName, mastGroup);
  addBeam(yard, mats.trim,
    mastLocalPoint(mastGroup, V(-width / 2, y1, mastZ)),
    mastLocalPoint(mastGroup, V(width / 2, y1, mastZ)),
    Math.max(.055, design.beamUnits * .012), 'square-yard');
  const sail = addSail(registry, root, mats, 'sail-' + mast.id + '-' + levelName, mast.id, [
    V(-width * .48, y0, mastZ), V(-width * .43, y1, mastZ), V(width * .43, y1, mastZ), V(width * .48, y0, mastZ),
  ], .085 + levelIndex * .012, mastGroup, 'z', origin, true);
  const sheets = registerPart(registry, 'sheets-' + mast.id + '-' + levelName, mastGroup);
  for (const side of [-1, 1]) {
    addBeam(sheets, mats.rope,
      mastLocalPoint(mastGroup, V(side * width * .45, y0, mastZ)),
      mastLocalPoint(mastGroup, V(side * width * .45, y0 - .3, mastZ + .18)),
      .018, 'sheet-line');
  }
  return sail;
}
function addGaffRig(registry, root, mats, design, mast, mastGroup, mastBase, mastTop, type = 'gaff') {
  const mastZ = mast.z * design.hullLengthUnits;
  const origin = mastGroup.position;
  const run = design.hullLengthUnits * (mast.span ?? .38);
  const lowY = mastBase + (mastTop - mastBase) * .16;
  const highY = mastBase + (mastTop - mastBase) * .77;
  const gaff = registerPart(registry, 'gaff-spar-' + mast.id, mastGroup);
  const boom = registerPart(registry, 'boom-' + mast.id, mastGroup);
  addBeam(gaff, mats.trim,
    mastLocalPoint(mastGroup, V(0, highY, mastZ - .15)),
    mastLocalPoint(mastGroup, V(0, highY + .1, mastZ + run)), .07, 'gaff-spar');
  addBeam(boom, mats.trim,
    mastLocalPoint(mastGroup, V(0, lowY, mastZ + .04)),
    mastLocalPoint(mastGroup, V(0, lowY, mastZ + run * 1.02)), .075, 'boom-spar');
  return addSail(registry, root, mats, 'sail-' + mast.id + '-' + type, mast.id, [
    V(0, lowY, mastZ + .04), V(0, highY, mastZ - .15),
    V(0, highY + .08, mastZ + run), V(0, lowY, mastZ + run * 1.02),
  ], .095, mastGroup, 'x', origin, true);
}
function addLateenRig(registry, root, mats, design, mast, mastGroup, mastBase, mastTop) {
  const mastZ = mast.z * design.hullLengthUnits;
  const origin = mastGroup.position;
  const span = design.hullLengthUnits * (mast.span ?? .42) * .62;
  const yard = registerPart(registry, 'lateen-yard-' + mast.id, mastGroup);
  const high = V(0, mastTop * .92, mastZ - span * .45);
  const low = V(0, mastBase + .25, mastZ + span);
  addBeam(yard, mats.trim,
    mastLocalPoint(mastGroup, high), mastLocalPoint(mastGroup, low),
    .085, 'lateen-yard');
  return addSail(registry, root, mats, 'sail-' + mast.id + '-lateen', mast.id, [
    V(0, mastBase + .2, mastZ), high, low, V(0, mastBase + .15, mastZ + span),
  ], .1, mastGroup, 'x', origin, true);
}
function addJunkRig(registry, root, mats, design, mast, mastGroup, mastBase, mastTop) {
  const mastZ = mast.z * design.hullLengthUnits;
  const origin = mastGroup.position;
  const run = design.hullLengthUnits * (mast.span ?? .72) * .35;
  const lowY = mastBase + (mastTop - mastBase) * .1;
  const highY = mastBase + (mastTop - mastBase) * .91;
  const yard = registerPart(registry, 'junk-yard-' + mast.id, mastGroup);
  addBeam(yard, mats.trim,
    mastLocalPoint(mastGroup, V(0, highY, mastZ - .08)),
    mastLocalPoint(mastGroup, V(0, highY - .08, mastZ + run)),
    Math.max(.09, design.beamUnits * .015), 'upper-lug-spar');

  const sail = registerPart(registry, 'sail-' + mast.id + '-junk', mastGroup);
  sail.userData.sailControl = { mastId: mast.id, clothPart: 'cloth-sail-' + mast.id + '-junk' };
  const cloth = registerPart(registry, 'cloth-sail-' + mast.id + '-junk', sail);
  addMesh(cloth, clothGeometry([
    V(0, lowY - mastBase, 0), V(0, highY - mastBase, -.08),
    V(0, highY - mastBase - .08, run), V(0, lowY - mastBase, run),
  ], .12, 18, 18, 'x'), mats.sail, 'battened-lug-sail');

  const battens = registerPart(registry, 'junk-battens-' + mast.id, mastGroup);
  for (let index = 1; index <= 7; index += 1) {
    const fraction = index / 8;
    const y = lerp(lowY, highY, fraction);
    const reach = run * (1.02 - fraction * .05);
    const batten = registerPart(registry, 'batten-' + mast.id + '-' + index, battens);
    addBeam(batten, mats.trim,
      mastLocalPoint(mastGroup, V(0, y, mastZ)),
      mastLocalPoint(mastGroup, V(0, y - .08 * fraction, mastZ + reach)),
      Math.max(.035, design.beamUnits * .006), 'bamboo-sail-batten');
  }

  const sheets = registerPart(registry, 'junk-sheets-' + mast.id, mastGroup);
  addTube(sheets, [
    mastLocalPoint(mastGroup, V(.16, lowY, mastZ + run)),
    mastLocalPoint(mastGroup, V(.25, lowY - .45, mastZ + run * .82)),
    mastLocalPoint(mastGroup, V(.25, mastBase + .2, mastZ + run * .48)),
  ], .018, mats.rope, 'lower-sail-sheet', 20);
  addTube(sheets, [
    mastLocalPoint(mastGroup, V(.16, highY - .08, mastZ + run)),
    mastLocalPoint(mastGroup, V(.25, highY - .4, mastZ + run * .8)),
    mastLocalPoint(mastGroup, V(.25, mastBase + .45, mastZ + run * .45)),
  ], .016, mats.rope, 'upper-sail-sheet', 20);
}
function addMastsAndRigging(design, root, registry, mats) {
  const structure = getShipStructureBlueprint(design.id);
  for (const mast of design.masts) {
    const mastZ = mast.z * design.hullLengthUnits;
    const baseY = getDeckSheer(design, .5 + mast.z * .45) + .12;
    const mastTop = baseY + mast.height * (4 / 3);
    const mastGroup = registerPart(registry, 'mast-' + mast.id, root);
    mastGroup.position.set(0, baseY, mastZ);
    const mastRake = Number.isFinite(mast.rake)
      ? mast.rake
      : (structure?.mastRakeDeg ?? 0) * Math.PI / 180;
    mastGroup.rotation.x = mastRake;
    mastGroup.userData.mastControl = { mastId: mast.id, baseRake: mastRake };
    const lowerTop = baseY + (mastTop - baseY) * (mast.rig === 'junk' ? .76 : (structure?.lowerMastRatio ?? .64));
    const lower = registerPart(registry, 'mast-lower-' + mast.id, mastGroup);
    const topmast = registerPart(registry, 'mast-topmast-' + mast.id, mastGroup);
    const step = registerPart(registry, 'mast-step-' + mast.id, root);
    const mastRadius = design.beamUnits * (mast.rig === 'junk' ? .027 : .018);
    addBeam(step, mats.trim, V(-.34, baseY - .2, mastZ), V(.34, baseY - .2, mastZ), .12, 'mast-step');
    addBeam(lower, mats.trim, V(0, 0, 0), V(0, lowerTop - baseY, 0), Math.max(.13, mastRadius), 'lower-mast');
    addBeam(topmast, mats.trim, V(0, lowerTop - baseY - .15, 0), V(0, mastTop - baseY, 0), Math.max(.08, mastRadius * .7), 'topmast');

    if (mast.rig === 'junk') {
      const running = registerPart(registry, 'running-rigging-' + mast.id, root);
      addJunkRig(registry, root, mats, design, mast, mastGroup, baseY, mastTop);
      continue;
    }

    const platform = (mast.rig === 'square' || mast.rig === 'brigantine')
      ? registerPart(registry, 'mast-platform-' + mast.id, mastGroup) : null;
    if (platform) {
      const disk = addMesh(platform, new THREE.CylinderGeometry(.58, .68, .13, 12), mats.trim, 'top-platform');
      disk.position.set(0, lowerTop - baseY + .25, 0);
    }

    const standing = registerPart(registry, 'standing-rigging-' + mast.id, root);
    const shrouds = registerPart(registry, 'shrouds-' + mast.id, standing);
    const ratlines = registerPart(registry, 'ratlines-' + mast.id, standing);
    const stays = registerPart(registry, 'mast-stays-' + mast.id, standing);
    const running = registerPart(registry, 'running-rigging-' + mast.id, root);
    const braces = registerPart(registry, 'running-braces-' + mast.id, running);
    const topY = baseY + (mastTop - baseY) * .9;
    const railX = getHullHalfBeam(design, .46 + mast.z * .2) * .82;
    const pairCount = structure?.shroudPairs ?? 2;
    for (const side of [-1, 1]) {
      for (let pair = 0; pair < pairCount; pair += 1) {
        const spread = pairCount <= 1 ? 0 : (pair / (pairCount - 1) - .5);
        const attachmentZ = mastZ + spread * design.beamUnits * .28;
        const topAttachmentY = mastTop - pair * (mastTop - lowerTop) * .12;
        const shroudPoints = [
          mastWorldPoint(mastGroup, V(side * .08, topAttachmentY, mastZ)),
          mastWorldPoint(mastGroup, V(side * .2, lowerTop + .5, mastZ + spread * design.beamUnits * .1)),
          V(side * railX, baseY + .35, attachmentZ),
        ];
        addTube(shrouds, shroudPoints, .023, mats.rope, 'standing-shroud-' + side + '-' + pair, 24);
      }

      addTube(running, [
        mastWorldPoint(mastGroup, V(side * .05, lowerTop, mastZ)),
        V(side * railX, baseY + .25, mastZ + side * .25),
      ], .014, mats.rope, 'running-line', 20);
      addTube(braces, [
        mastWorldPoint(mastGroup, V(0, topY, mastZ)),
        V(side * design.beamUnits * .44, topY - .2, mastZ + design.hullLengthUnits * .07),
      ], .014, mats.rope, 'yard-brace', 20);
    }

    const ratlineCount = structure?.ratlines ?? 8;
    for (let r = 0; r < ratlineCount; r += 1) {
      const f = (r + 1) / (ratlineCount + 1);
      const y = lerp(baseY + .6, lowerTop + .25, f);
      addBeam(ratlines, mats.rope, V(-railX, y, mastZ), V(railX, y, mastZ), .012, 'ratline-' + r);
    }
    addTube(stays, [
      mastWorldPoint(mastGroup, V(0, mastTop, mastZ)),
      V(0, baseY + .2, getSheerPoint(design, .07, 1).z),
    ], .018, mats.rope, 'forestay', 28);

    if (mast.rig === 'square') {
      ['course', 'topsail', 'topgallant'].slice(0, mast.squares ?? 2).forEach((level, index) => {
        addSquareRig(registry, root, mats, design, mast, mastGroup, lowerTop, mastTop, level, index);
      });
      if (mast.spanker) addGaffRig(registry, root, mats, design, mast, mastGroup, baseY, mastTop, 'spanker');
    } else if (mast.rig === 'brigantine') {
      addGaffRig(registry, root, mats, design, mast, mastGroup, baseY, mastTop, 'gaff');
      addSquareRig(registry, root, mats, design, mast, mastGroup, lowerTop, mastTop, 'topsail', 0);
    } else if (mast.rig === 'lateen') {
      addLateenRig(registry, root, mats, design, mast, mastGroup, baseY, mastTop);
    } else {
      addGaffRig(registry, root, mats, design, mast, mastGroup, baseY, mastTop, mast.rig === 'trysail' ? 'trysail' : 'gaff');
    }
  }

  const head = registerPart(registry, 'head-sails', root);
  if (design.headsails > 0) {
    const foreMast = design.masts[0];
    const foreTop = getDeckSheer(design, .35) + foreMast.height * (4 / 3);
    const bowZ = getStemProfile(design, getShipStructureBlueprint(design.id), 1, getDeckSheer(design, 0)).z - design.beamUnits * .65;
    for (let i = 0; i < design.headsails; i += 1) {
      const f = (i + 1) / (design.headsails + 1);
      const sail = registerPart(registry, 'sail-head-' + (i + 1), head);
      const aftZ = getSheerPoint(design, .12 + f * .08, 1).z;
      const lowY = getDeckSheer(design, .04) + .3 + i * .12;
      const pivot = V(0, lowY, bowZ + f * design.beamUnits * .1);
      sail.position.copy(pivot);
      sail.userData.sailControl = { mastId: foreMast.id, clothPart: 'cloth-sail-head-' + (i + 1) };
      const cloth = registerPart(registry, 'cloth-sail-head-' + (i + 1), sail);
      addMesh(cloth, clothGeometry([
        V(0, 0, 0),
        V(0, foreTop * (1 - f * .09) - pivot.y, aftZ - pivot.z),
        V(0, foreTop * .65 - pivot.y, bowZ + f * design.beamUnits * .08 - pivot.z),
        V(0, 0, 0),
      ], .045, 14, 20, 'x'), mats.sail, 'headsail-cloth');
    }
  }
}
function addDeckDetails(design, root, registry, mats) {
  const details = registerPart(registry, 'deck-fittings', root);
  const deckY = getDeckSheer(design, .68);
  const hatch = addMesh(details, new THREE.BoxGeometry(design.beamUnits * .28, .12, design.hullLengthUnits * .055), mats.trim, 'main-hatch-frame');
  hatch.position.set(0, deckY + .1, design.hullLengthUnits * .12);
  const companion = addMesh(details, new THREE.BoxGeometry(design.beamUnits * .2, .45, design.hullLengthUnits * .045), mats.hull, 'companionway');
  companion.position.set(0, deckY + .28, design.hullLengthUnits * .32);
  if (design.oars) {
    const oars = registerPart(registry, 'oars', details);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i += 1) {
        const t = .25 + i * .075;
        const x = side * getHullHalfBeam(design, t) * 1.15;
        const z = (t - .5) * design.hullLengthUnits;
        addBeam(oars, mats.trim, V(x * .55, deckY + .5, z), V(x * 1.9, deckY + .25, z - side * .25), .045, 'sweep-oar');
      }
    }
  }
}

function setupPartApi(root, registry, design) {
  const unlinked = new THREE.Group();
  unlinked.name = 'unlinked-parts';
  root.add(unlinked);
  const original = new Map();
  const transformBase = new Map();
  const state = { rudderAngle: 0, sailTrim: {}, sailDeployment: {}, mastLean: {}, hiddenParts: {}, unlinkedParts: [], partTransforms: {}, time: 0 };
  for (const [name, part] of registry) {
    original.set(name, { parent: part.parent, position: part.position.clone(), quaternion: part.quaternion.clone(), rotation: part.rotation.clone(), scale: part.scale.clone() });
    transformBase.set(name, { position: part.position.clone(), rotation: part.rotation.clone() });
  }
  const sailControls = [...registry.values()].filter((part) => part.userData.sailControl);
  const sailCloths = new Map(sailControls.map((part) => {
    const cloth = registry.get(part.userData.sailControl.clothPart);
    return [part.name, { cloth, from: cloth?.scale.y ?? 1, target: cloth?.scale.y ?? 1, elapsed: 0, duration: 0 }];
  }));
  const mastControls = [...registry.values()].filter((part) => part.userData.mastControl);
  const api = {
    parts: registry,
    getPart(name) { return registry.get(name) ?? null; },
    detachPart(name) {
      const part = registry.get(name);
      if (!part || part === unlinked || part.parent === unlinked) return false;
      root.updateMatrixWorld(true);
      const world = part.matrixWorld.clone();
      unlinked.updateMatrixWorld(true);
      part.parent?.remove(part);
      unlinked.add(part);
      unlinked.updateMatrixWorld(true);
      const local = unlinked.matrixWorld.clone().invert().multiply(world);
      local.decompose(part.position, part.quaternion, part.scale);
      transformBase.set(name, { position: part.position.clone(), rotation: part.rotation.clone() });
      state.unlinkedParts = [...new Set([...state.unlinkedParts, name])];
      return true;
    },
    relinkPart(name) {
      const part = registry.get(name);
      const info = original.get(name);
      if (!part || !info || part.parent !== unlinked) return false;
      unlinked.updateMatrixWorld(true);
      const world = part.matrixWorld.clone();
      info.parent.updateMatrixWorld(true);
      info.parent.add(part);
      const local = info.parent.matrixWorld.clone().invert().multiply(world);
      local.decompose(part.position, part.quaternion, part.scale);
      transformBase.set(name, { position: part.position.clone(), rotation: part.rotation.clone() });
      state.unlinkedParts = state.unlinkedParts.filter((item) => item !== name);
      return true;
    },
    setPartVisible(name, visible) {
      const part = registry.get(name);
      if (!part) return false;
      part.visible = Boolean(visible);
      state.hiddenParts[name] = !part.visible;
      return true;
    },
    setPartTransform(name, transform = {}) {
      const part = registry.get(name);
      const base = transformBase.get(name);
      if (!part || !base) return false;
      const values = {
        x: clamp(transform.x, -24, 24), y: clamp(transform.y, -24, 24), z: clamp(transform.z, -24, 24),
        rx: clamp(transform.rx, -Math.PI, Math.PI), ry: clamp(transform.ry, -Math.PI, Math.PI), rz: clamp(transform.rz, -Math.PI, Math.PI),
      };
      part.position.copy(base.position).add(V(values.x, values.y, values.z));
      part.rotation.set(base.rotation.x + values.rx, base.rotation.y + values.ry, base.rotation.z + values.rz, 'XYZ');
      state.partTransforms[name] = values;
      return true;
    },
    resetPartTransform(name) {
      if (!registry.has(name)) return false;
      return api.setPartTransform(name, {});
    },
    setRudderAngle(radians) {
      const part = registry.get('rudder');
      if (!part) return false;
      state.rudderAngle = clamp(radians, -.62, .62);
      part.rotation.y = state.rudderAngle + (state.partTransforms.rudder?.ry ?? 0);
      return true;
    },
    setSailTrim(mastId, radians) {
      const targets = sailControls.filter((part) => part.userData.sailControl.mastId === mastId);
      if (!targets.length) return false;
      state.sailTrim[mastId] = clamp(radians, -1.1, 1.1);
      for (const part of targets) part.rotation.y = state.sailTrim[mastId] + (state.partTransforms[part.name]?.ry ?? 0);
      return true;
    },
    setMastLean(mastId, radians) {
      const target = mastControls.find((part) => part.userData.mastControl.mastId === mastId);
      if (!target) return false;
      state.mastLean[mastId] = clamp(radians, -.16, .16);
      target.rotation.x = (target.userData.mastControl.baseRake ?? 0)
        + state.mastLean[mastId] + (state.partTransforms[target.name]?.rx ?? 0);
      return true;
    },
    setSailDeployment(mastId, deployment = 'full', duration = .85) {
      const targets = sailControls.filter((part) => part.userData.sailControl.mastId === mastId);
      if (!targets.length || !['full', 'reefed', 'furled'].includes(deployment)) return false;
      const targetScale = deployment === 'full' ? 1 : deployment === 'reefed' ? .48 : .001;
      state.sailDeployment[mastId] = deployment;
      for (const part of targets) {
        const animation = sailCloths.get(part.name);
        if (!animation?.cloth) continue;
        animation.from = animation.cloth.scale.y;
        animation.target = targetScale;
        animation.elapsed = 0;
        animation.duration = clamp(duration, 0, 4);
        if (animation.duration === 0) animation.cloth.scale.y = targetScale;
      }
      return true;
    },
    animateShip(delta = .016, weather = {}) {
      state.time += clamp(delta, 0, .1);
      const wind = clamp(weather.windStrength ?? .25, 0, 1);
      const angle = Number(weather.windAngle) || 0;
      for (const part of sailControls) {
        const mastId = part.userData.sailControl.mastId;
        const manual = state.sailTrim[mastId] ?? 0;
        const gust = Math.sin(state.time * 1.4 + mastId.length) * .018 * wind;
        part.rotation.y = (state.partTransforms[part.name]?.ry ?? 0) + manual + Math.sin(angle) * .08 * wind + gust;
        const animation = sailCloths.get(part.name);
        if (animation?.cloth && animation.elapsed < animation.duration) {
          animation.elapsed = Math.min(animation.duration, animation.elapsed + clamp(delta, 0, .1));
          const t = animation.duration > 0 ? animation.elapsed / animation.duration : 1;
          animation.cloth.scale.y = THREE.MathUtils.lerp(animation.from, animation.target, t * t * (3 - 2 * t));
        }
      }
    },
    getShipState() {
      return {
        rudderAngle: state.rudderAngle,
        sailTrim: { ...state.sailTrim },
        sailDeployment: { ...state.sailDeployment },
        mastLean: { ...state.mastLean },
        hiddenParts: { ...state.hiddenParts },
        unlinkedParts: [...state.unlinkedParts],
        partTransforms: Object.fromEntries(Object.entries(state.partTransforms).map(([name, value]) => [name, { ...value }])),
      };
    },
    applyShipState(saved = {}) {
      for (const name of saved.unlinkedParts ?? []) if (registry.has(name)) api.detachPart(name);
      for (const [name, transform] of Object.entries(saved.partTransforms ?? {})) if (registry.has(name)) api.setPartTransform(name, transform);
      api.setRudderAngle(saved.rudderAngle ?? 0);
      for (const [id, value] of Object.entries(saved.sailTrim ?? {})) api.setSailTrim(id, value);
      for (const [id, value] of Object.entries(saved.sailDeployment ?? {})) api.setSailDeployment(id, value, 0);
      for (const [id, value] of Object.entries(saved.mastLean ?? {})) api.setMastLean(id, value);
      for (const [name, hidden] of Object.entries(saved.hiddenParts ?? {})) if (registry.has(name)) api.setPartVisible(name, !hidden);
      return true;
    },
    summary() {
      return {
        type: design.id, label: design.label,
        dimensions: { length: design.hullLength, beam: design.beam, draft: design.draft },
        lengthBeamRatio: design.lengthBeamRatio, rig: design.rig, era: design.era,
        reference: design.reference, sources: design.sources.map((source) => ({ ...source })),
        hullProfile: design.hullProfile, partCount: registry.size, parts: [...registry.keys()],
        unlinkedParts: [...state.unlinkedParts],
      };
    },
  };
  return api;
}

export function createShipModel(type) {
  const design = getShipDesign(type);
  if (!design) throw new Error('Unknown historical ship type: ' + type);
  const root = new THREE.Group();
  root.name = 'Verdant Reach · ' + design.label;
  const mats = createMaterials();
  const registry = new Map();
  root.userData.shipType = design.id;
  root.userData.shipLabel = design.label;
  root.userData.forwardAxis = '-z';
  root.userData.shipDimensions = { length: design.hullLength, beam: design.beam, draft: design.draft };
  root.userData.shipDimensionsUnits = { length: design.hullLengthUnits, beam: design.beamUnits, draft: design.draftUnits };
  root.userData.deckHeightUnits = design.deckHeightUnits;
  root.userData.deckHeight = design.deckHeightUnits;
  root.userData.vehicle = { mode: 'boat', vesselType: design.id, deckHeight: design.deckHeightUnits, label: 'Board ' + design.label };

  addHullAndDeck(design, root, registry, mats);
  addRaisedDecks(design, root, registry, mats);
  addFrames(design, root, registry, mats);
  addStrakesAndPlanking(design, root, registry, mats);
  addSternworks(design, root, registry, mats);
  addBowworks(design, root, registry, mats);
  addRailings(design, root, registry, mats);
  addRudderAndHelm(design, root, registry, mats);
  addAnchors(design, root, registry, mats);
  addMastsAndRigging(design, root, registry, mats);
  addDeckDetails(design, root, registry, mats);

  const api = setupPartApi(root, registry, design);
  for (const key of ['getPart', 'detachPart', 'relinkPart', 'setPartVisible', 'setPartTransform', 'resetPartTransform', 'setRudderAngle', 'setSailTrim', 'setMastLean', 'setSailDeployment', 'animateShip', 'getShipState', 'applyShipState']) {
    root.userData[key] = api[key].bind(api);
  }
  root.userData.shipModelSummary = api.summary.bind(api);
  root.userData.partNames = [...registry.keys()];
  const geometries = new Set();
  const materials = new Set(Object.values(mats));
  root.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
    else materials.add(object.material);
    object.userData.shipOwned = true;
  });
  root.userData.ownedGeometries = [...geometries];
  root.userData.ownedMaterials = [...materials];
  return root;
}

export function disposeShipModel(group) {
  if (!group) return;
  for (const geometry of new Set(group.userData.ownedGeometries ?? [])) geometry.dispose();
  for (const material of new Set(group.userData.ownedMaterials ?? [])) material.dispose();
  group.parent?.remove(group);
}

export function shipModelSummary(type) {
  const design = SHIP_DESIGNS[String(type ?? '').replace(/^ship-/, '')];
  if (!design) return null;
  return {
    id: design.id, label: design.label,
    dimensions: design.hullLength.toFixed(1) + ' × ' + design.beam.toFixed(1) + ' m',
    ratio: design.lengthBeamRatio.toFixed(2), rig: design.rig, period: design.era,
    hullProfile: design.hullProfile, hullFormNote: design.hullFormNote,
    modelScaleNote: design.modelScaleNote, reference: design.reference,
    sources: design.sources.map((source) => ({ ...source })),
    mastCount: design.mastCount, partCount: design.partNames.length, parts: design.partNames,
  };
}
