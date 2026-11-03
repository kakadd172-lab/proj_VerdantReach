import * as THREE from 'three';
import { SHIP_DESIGNS, WORLD_UNITS_PER_METRE, getShipDesign } from './ship-designs.js?v=0.8.1';

const PALETTE = Object.freeze({
  hull: 0x684632, lowerHull: 0x3f342b, plank: 0x8b6748, deck: 0xa88a61,
  trim: 0x4c3829, rope: 0x6d5944, sail: 0xe2d7bd, sailShade: 0xbdb092,
  iron: 0x56605d, brass: 0xb58b4e, glass: 0x93b5b0, flag: 0x8c4939,
});

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function createMaterials() {
  return {
    hull: new THREE.MeshStandardMaterial({ color: PALETTE.hull, roughness: 0.9 }),
    lowerHull: new THREE.MeshStandardMaterial({ color: PALETTE.lowerHull, roughness: 0.94 }),
    plank: new THREE.MeshStandardMaterial({ color: PALETTE.plank, roughness: 0.92 }),
    deck: new THREE.MeshStandardMaterial({ color: PALETTE.deck, roughness: 0.92 }),
    trim: new THREE.MeshStandardMaterial({ color: PALETTE.trim, roughness: 0.9 }),
    rope: new THREE.MeshStandardMaterial({ color: PALETTE.rope, roughness: 1 }),
    sail: new THREE.MeshStandardMaterial({ color: PALETTE.sail, roughness: 1, side: THREE.DoubleSide }),
    sailShade: new THREE.MeshStandardMaterial({ color: PALETTE.sailShade, roughness: 1, side: THREE.DoubleSide }),
    iron: new THREE.MeshStandardMaterial({ color: PALETTE.iron, roughness: 0.7, metalness: 0.28 }),
    brass: new THREE.MeshStandardMaterial({ color: PALETTE.brass, roughness: 0.58, metalness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: PALETTE.glass, roughness: 0.3, metalness: 0.08 }),
    flag: new THREE.MeshStandardMaterial({ color: PALETTE.flag, roughness: 0.95, side: THREE.DoubleSide }),
  };
}

function ownMesh(parent, geometry, material, name = '') {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.shipOwned = true;
  parent.add(mesh);
  return mesh;
}

function box(parent, material, size, position, name = '') {
  const mesh = ownMesh(parent, new THREE.BoxGeometry(...size), material, name);
  mesh.position.set(...position);
  return mesh;
}

function cylinder(parent, material, radiusTop, radiusBottom, length, position, options = {}) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, options.radialSegments ?? 8, 1, false);
  const mesh = ownMesh(parent, geometry, material, options.name ?? '');
  mesh.position.set(...position);
  if (options.axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (options.axis === 'z') mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function beam(parent, material, start, end, radius, name = '') {
  const a = V3(...start);
  const b = V3(...end);
  const direction = b.clone().sub(a);
  const length = direction.length();
  if (length < 0.001) return null;
  const mesh = cylinder(parent, material, radius * 0.78, radius, length, [0, 0, 0], { radialSegments: 7, name });
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(V3(0, 1, 0), direction.normalize());
  return mesh;
}

function addLoftGeometry(design) {
  const { hullLengthUnits: length, beamUnits: beamWidth, draftUnits: draft, deckHeightUnits: freeboard, hull } = design;
  const stations = 56;
  const ringSegments = 24;
  const positions = [];
  const indices = [];
  const bowExponent = 0.58 + (1 - hull.entry) * 1.05;
  const sternExponent = hull.stern === 'transom' ? 0.52 : hull.stern === 'counter' ? 0.72 : 0.9;
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const z = (t - 0.5) * length;
    const bow = Math.pow(Math.max(0.0005, Math.sin(Math.PI * Math.min(0.5, t))), bowExponent);
    const aftTaper = t > 0.74
      ? THREE.MathUtils.lerp(1, hull.sternWidth, Math.pow((t - 0.74) / 0.26, sternExponent))
      : 1;
    const foreTaper = t < 0.2 ? THREE.MathUtils.lerp(0.12, 1, Math.pow(t / 0.2, bowExponent)) : 1;
    const stationFactor = Math.min(1, bow * 1.22) * aftTaper * foreTaper;
    const fullness = 0.74 + hull.fullness * 0.36;
    const halfBeam = beamWidth * 0.5 * stationFactor * fullness;
    const sheerFactor = Math.pow(Math.abs(t - 0.5) * 2, 1.32);
    const sheerY = freeboard + hull.sheer * freeboard * sheerFactor
      + (t < 0.5 ? hull.bowRise : hull.sternRise) * freeboard * Math.pow(sheerFactor, 1.25);
    for (let j = 0; j <= ringSegments; j += 1) {
      const angle = (j / ringSegments) * Math.PI * 2;
      const vertical = (Math.cos(angle) + 1) * 0.5;
      const tumble = vertical > 0.58 ? 1 - hull.tumblehome * ((vertical - 0.58) / 0.42) : 1;
      const bilge = Math.sin(angle);
      const verticalY = -draft + vertical * (draft + sheerY);
      const waterlineBulge = 0.84 + 0.16 * Math.sin(Math.PI * vertical);
      const x = bilge * halfBeam * waterlineBulge * tumble;
      positions.push(x, verticalY, z);
    }
  }
  const startCenter = positions.length / 3;
  positions.push(0, -draft * 0.36, -length * 0.5);
  const endCenter = positions.length / 3;
  positions.push(0, -draft * 0.22, length * 0.5);
  const ring = ringSegments + 1;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < ringSegments; j += 1) {
      const a = i * ring + j;
      const b = a + 1;
      const c = a + ring;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  for (let j = 0; j < ringSegments; j += 1) {
    indices.push(startCenter, j + 1, j);
    const last = stations * ring;
    indices.push(endCenter, last + j, last + j + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function stationHalfBeam(design, t, deck = false) {
  const h = design.hull;
  const length = design.hullLengthUnits;
  const bowExponent = 0.58 + (1 - h.entry) * 1.05;
  const bow = Math.pow(Math.max(0.0005, Math.sin(Math.PI * Math.min(0.5, t))), bowExponent);
  const aft = t > 0.74 ? THREE.MathUtils.lerp(1, h.sternWidth, Math.pow((t - 0.74) / 0.26, h.stern === 'transom' ? 0.52 : 0.82)) : 1;
  const fore = t < 0.2 ? THREE.MathUtils.lerp(0.12, 1, Math.pow(t / 0.2, bowExponent)) : 1;
  const width = design.beamUnits * 0.5 * Math.min(1, bow * 1.22) * aft * fore * (0.74 + h.fullness * 0.36);
  return deck ? width * (1 - h.tumblehome * 0.4) * 0.94 : width;
}

function addDeckGeometry(design) {
  const stations = 44;
  const across = 12;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const z = (t - 0.5) * design.hullLengthUnits;
    const half = stationHalfBeam(design, t, true);
    const sheerFactor = Math.pow(Math.abs(t - 0.5) * 2, 1.32);
    const deckY = design.deckHeightUnits + design.hull.sheer * design.deckHeightUnits * sheerFactor
      + (t < 0.5 ? design.hull.bowRise : design.hull.sternRise) * design.deckHeightUnits * Math.pow(sheerFactor, 1.25);
    for (let j = 0; j <= across; j += 1) {
      const u = j / across * 2 - 1;
      const camber = design.hull.deckCamber * design.deckHeightUnits * (1 - u * u);
      positions.push(u * half, deckY + camber, z);
    }
  }
  const row = across + 1;
  for (let i = 0; i < stations; i += 1) for (let j = 0; j < across; j += 1) {
    const a = i * row + j;
    indices.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makePart(root, registry, name, parent = root) {
  const group = new THREE.Group();
  group.name = name;
  group.userData.shipPart = name;
  group.userData.originalParentName = parent === root ? null : parent.name;
  parent.add(group);
  registry.set(name, group);
  return group;
}

function addHull(design, root, parts, mats) {
  const hull = makePart(root, parts, 'hull');
  const main = ownMesh(hull, addLoftGeometry(design), mats.hull, 'continuous-carvel-hull');
  main.material.side = THREE.DoubleSide;
  const keel = makePart(root, parts, 'keel');
  const L = design.hullLengthUnits;
  const D = design.draftUnits;
  beam(keel, mats.lowerHull, [0, -D - 0.06, -L * 0.37], [0, -D - 0.06, L * 0.44], Math.max(0.08, design.beamUnits * 0.018), 'keel-run');
  beam(keel, mats.lowerHull, [0, -D * 0.55, -L * 0.49], [0, design.deckHeightUnits * 0.12, -L * 0.51], Math.max(0.08, design.beamUnits * 0.013), 'stem-post');
  beam(keel, mats.lowerHull, [0, -D * 0.18, L * 0.48], [0, -D - 0.1, L * 0.5], Math.max(0.08, design.beamUnits * 0.014), 'stern-post');

  const deck = makePart(root, parts, 'deck');
  if (design.sternwork !== 'open-boat') ownMesh(deck, addDeckGeometry(design), mats.deck, 'cambered-main-deck').material.side = THREE.DoubleSide;
  // Fine longitudinal plank seams follow the hull taper instead of spanning empty air.
  for (let row = -4; row <= 4; row += 1) {
    const fraction = row / 5;
    const points = [];
    for (let i = 3; i <= 41; i += 1) {
      const t = i / 44;
      const half = stationHalfBeam(design, t, true);
      const y = design.deckHeightUnits + design.hull.deckCamber * design.deckHeightUnits * (1 - fraction * fraction);
      points.push(V3(fraction * half, y + 0.015, (t - 0.5) * L));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    ownMesh(deck, new THREE.TubeGeometry(curve, 52, 0.009, 4, false), mats.plank, `deck-plank-${row}`);
  }
  // Transverse frames are visible only beneath the sheer line near the rail.
  const fittings = makePart(root, parts, 'deck-fittings');
  for (let i = 0; i < 18; i += 1) {
    const t = 0.12 + i * 0.045;
    const z = (t - 0.5) * L;
    const half = stationHalfBeam(design, t, true) * 0.94;
    const deckY = design.deckHeightUnits + design.hull.sheer * design.deckHeightUnits * Math.abs(t - 0.5) * 2;
    for (const side of [-1, 1]) {
      beam(fittings, mats.trim, [side * half, deckY + 0.03, z], [side * half * 0.96, deckY + 0.12, z], 0.04, `rail-frame-${i}-${side}`);
    }
  }
  return { hull, deck, keel, fittings };
}

function addSternworks(design, root, parts, mats) {
  const group = makePart(root, parts, 'sternworks');
  const gallery = makePart(root, parts, 'stern-gallery', group);
  const B = design.beamUnits;
  const L = design.hullLengthUnits;
  const y = design.deckHeightUnits;
  const addDeckhouse = (width, height, depth, z, level = 0) => {
    box(group, mats.hull, [B * width, height, L * depth], [0, y + level + height * 0.5, z], `stern-house-${z}`);
    box(group, mats.deck, [B * (width + 0.045), 0.12, L * (depth + 0.02)], [0, y + level + height + 0.06, z], `stern-house-roof-${z}`);
  };
  if (design.sternwork === 'high-aftercastle' || design.sternwork === 'galleon-castle') {
    const galleon = design.sternwork === 'galleon-castle';
    const lowerHeight = y * (galleon ? 1.45 : 1.75);
    addDeckhouse(0.64, lowerHeight, 0.2, L * 0.34, 0.05);
    addDeckhouse(0.72, y * (galleon ? 0.78 : 1.1), 0.16, L * 0.405, lowerHeight);
    if (galleon) addDeckhouse(0.48, y * 0.52, 0.1, L * 0.43, y * 2.23);
    for (const side of [-1, 1]) {
      for (let row = 0; row < (galleon ? 3 : 4); row += 1) {
        const z = L * (0.34 + row * 0.025);
        const post = makePart(root, parts, `stern-gallery-post-${side}-${row}`, gallery);
        box(post, mats.trim, [0.16, 0.55, 0.16], [side * B * 0.22, y + row * y * 0.44 + 0.55, z], `gallery-post-${side}-${row}`);
      }
      const wing = makePart(root, parts, `stern-gallery-wing-${side}`, gallery);
      box(wing, mats.plank, [B * 0.16, 0.14, L * 0.13], [side * B * 0.34, y * 1.18, L * 0.35], `gallery-wing-${side}`);
      const balcony = makePart(root, parts, `stern-gallery-balcony-${side}`, gallery);
      box(balcony, mats.deck, [B * 0.2, 0.12, L * 0.13], [side * B * 0.34, y * 1.22, L * 0.35], `gallery-balcony-${side}`);
    }
    // Decorative transom windows and gallery railings are separated from the stern structure.
    const transom = makePart(root, parts, 'stern-transom-trim', gallery);
    for (let i = -2; i <= 2; i += 1) {
      const x = i * B * 0.095;
      box(transom, mats.glass, [B * 0.055, y * 0.24, 0.055], [x, y * 1.62, L * 0.445], `transom-window-${i}`);
    }
    for (const side of [-1, 1]) {
      beam(gallery, mats.trim, [side * B * 0.22, y * 1.52, L * 0.35], [side * B * 0.36, y * 1.52, L * 0.35], 0.045, `gallery-balustrade-${side}`);
    }
  } else if (design.sternwork === 'quarterdeck') {
    addDeckhouse(0.38, y * 0.55, 0.16, L * 0.34, 0.03);
    box(group, mats.deck, [B * 0.82, 0.16, L * 0.2], [0, y + y * 0.58, L * 0.34], 'quarterdeck-platform');
  } else if (design.sternwork === 'low-cabin') {
    addDeckhouse(0.34, Math.max(0.75, y * 0.54), 0.13, L * 0.34, 0.02);
  } else if (design.sternwork === 'fluyt-roundhouse') {
    cylinder(group, mats.hull, B * 0.15, B * 0.18, L * 0.12, [0, y + y * 0.48, L * 0.38], { name: 'roundhouse', radialSegments: 12 });
    cylinder(group, mats.deck, B * 0.17, B * 0.19, 0.16, [0, y + y * 0.95, L * 0.38], { name: 'roundhouse-cap', radialSegments: 12 });
  } else if (design.sternwork === 'xebec-platform') {
    box(group, mats.deck, [B * 0.58, 0.16, L * 0.16], [0, y + 0.08, L * 0.46], 'projecting-stern-platform');
  } else if (design.sternwork === 'open-boat') {
    for (let i = -2; i <= 2; i += 1) box(group, mats.deck, [B * 0.72, 0.12, 0.12], [0, y * 0.3, i * L * 0.15], `thwart-${i}`);
  }
  return group;
}

function addRailings(design, root, parts, mats) {
  const group = makePart(root, parts, 'railings');
  const L = design.hullLengthUnits;
  const yBase = design.deckHeightUnits;
  for (const side of [-1, 1]) {
    const sideGroup = makePart(root, parts, `railings-${side < 0 ? 'port' : 'starboard'}`, group);
    const railPoints = [];
    for (let i = 0; i <= 18; i += 1) {
      const t = 0.1 + (i / 18) * 0.8;
      const half = stationHalfBeam(design, t, true) * 0.92;
      const sheer = Math.pow(Math.abs(t - 0.5) * 2, 1.32);
      const y = yBase + design.hull.sheer * yBase * sheer
        + (t < 0.5 ? design.hull.bowRise : design.hull.sternRise) * yBase * Math.pow(sheer, 1.25);
      const z = (t - 0.5) * L;
      const x = side * half;
      railPoints.push(V3(x, y + 0.72, z));
      if (i % 2 === 0) {
        const post = makePart(root, parts, `rail-post-${side < 0 ? 'port' : 'starboard'}-${i}`, sideGroup);
        beam(post, mats.trim, [x, y + 0.06, z], [x, y + 0.72, z], 0.035, `rail-post-${i}`);
      }
    }
    const railCurve = new THREE.CatmullRomCurve3(railPoints);
    ownMesh(sideGroup, new THREE.TubeGeometry(railCurve, 72, 0.055, 6, false), mats.trim, 'upper-rail');
    const lowerPoints = railPoints.map((point) => V3(point.x * 0.99, point.y - 0.28, point.z));
    ownMesh(sideGroup, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lowerPoints), 72, 0.035, 5, false), mats.plank, 'lower-rail');
  }
  return group;
}

function addBowworks(design, root, parts, mats) {
  const group = makePart(root, parts, 'bowworks');
  const L = design.hullLengthUnits;
  const B = design.beamUnits;
  const y = design.deckHeightUnits;
  if (design.bowwork === 'high-forecastle') {
    const forecastle = makePart(root, parts, 'forecastle', group);
    box(forecastle, mats.hull, [B * 0.62, y * 1.05, L * 0.16], [0, y + y * 0.52, -L * 0.36], 'forecastle-volume');
    box(forecastle, mats.deck, [B * 0.66, 0.13, L * 0.17], [0, y * 2.1, -L * 0.36], 'forecastle-deck');
  }
  if (design.bowwork === 'beakhead' || design.bowwork === 'long-beak') {
    const beakhead = makePart(root, parts, 'beakhead', group);
    const tip = design.bowwork === 'long-beak' ? 0.73 : 0.64;
    beam(beakhead, mats.trim, [0, y * 0.56, -L * 0.42], [0, y * 0.2, -L * tip], B * 0.026, 'beakhead-spine');
    beam(beakhead, mats.plank, [-B * 0.12, y * 0.3, -L * 0.48], [B * 0.12, y * 0.3, -L * tip], B * 0.018, 'beakhead-platform');
  }
  const hasBowsprit = ['bowsprit', 'long-bowsprit', 'short-bowsprit', 'spritsail-platform', 'beakhead', 'high-forecastle'].includes(design.bowwork);
  if (hasBowsprit) {
    const bowsprit = makePart(root, parts, 'bowsprit', group);
    const extension = design.bowwork === 'long-bowsprit' ? 0.25 : design.bowwork === 'short-bowsprit' ? 0.09 : 0.17;
    const start = [0, y + y * 0.15, -L * 0.43];
    const end = [0, y + y * 0.42, -L * (0.5 + extension)];
    beam(bowsprit, mats.plank, start, end, B * 0.028, 'bowsprit-spar');
    const gammoning = makePart(root, parts, 'bowsprit-gammoning', bowsprit);
    beam(gammoning, mats.rope, end, [0, y + y * 0.05, -L * 0.25], 0.035, 'gammoning-wrap');
  }
  if (design.bowwork === 'open-bow') {
    const rim = makePart(root, parts, 'open-bow-rim', group);
    for (const side of [-1, 1]) beam(rim, mats.trim, [side * B * 0.38, y * 0.7, -L * 0.4], [side * B * 0.05, y * 0.42, -L * 0.48], 0.045, `bow-rim-${side}`);
  }
  return group;
}


function clothGeometry(width, height, fullness = 0.035, curvature = 0.06) {
  const columns = 10;
  const rows = 12;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let y = 0; y <= rows; y += 1) {
    const v = y / rows;
    for (let x = 0; x <= columns; x += 1) {
      const u = x / columns;
      const belly = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      positions.push((u - 0.5) * width, (0.5 - v) * height, fullness * belly + curvature * Math.sin(Math.PI * u));
      uvs.push(u, v);
    }
  }
  for (let y = 0; y < rows; y += 1) for (let x = 0; x < columns; x += 1) {
    const a = y * (columns + 1) + x;
    const b = a + 1;
    const c = a + columns + 1;
    indices.push(a, c, b, b, c, c + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function polygonClothGeometry(points, fullness = 0.025) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 8);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    position.setZ(i, fullness * Math.sin(Math.PI * (x / Math.max(0.001, Math.abs(points.at(-1)[0]) * 2 + 0.001))) * Math.sin(Math.PI * (y / Math.max(0.001, Math.abs(points.at(-1)[1]) * 2 + 0.001))));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function makeSquareSail(mastGroup, mast, design, mats, level, index) {
  const root = mastGroup.parent;
  const registry = root.userData.shipPartRegistry;
  const id = ['course', 'topsail', 'topgallant'][index] ?? `upper-${index}`;
  const name = `sail-${mast.id}-${id}`;
  const group = makePart(root, registry, name, mastGroup);
  const height = design.mastHeights[design.masts.findIndex((item) => item.id === mast.id)] * WORLD_UNITS_PER_METRE;
  const y = height * level;
  const width = design.beamUnits * [1.38, 1.12, 0.82][index];
  const sailHeight = height * [0.205, 0.15, 0.105][index];
  group.position.set(0, y, 0);
  const yard = makePart(root, registry, `yard-${mast.id}-${id}`, group);
  cylinder(yard, mats.trim, 0.065, 0.075, width * 1.08, [0, 0, 0], { axis: 'x', radialSegments: 7, name: `${id}-yard-spar` });
  const canvas = makePart(root, registry, `cloth-${mast.id}-${id}`, group);
  const cloth = ownMesh(canvas, clothGeometry(width, sailHeight, sailHeight * 0.04, sailHeight * 0.012), index === 0 ? mats.sail : mats.sailShade, `${name}-cloth`);
  cloth.position.y = -sailHeight * 0.54;
  const sheets = makePart(root, registry, `sheets-${mast.id}-${id}`, group);
  beam(sheets, mats.rope, [-width * 0.5, 0.02, 0], [-width * 0.5, -sailHeight * 0.8, 0], 0.022, 'port-sheet');
  beam(sheets, mats.rope, [width * 0.5, 0.02, 0], [width * 0.5, -sailHeight * 0.8, 0], 0.022, 'starboard-sheet');
  group.userData.sailControl = { mastId: mast.id, kind: 'square', base: 0 };
  return group;
}


function addGaffAssembly(mastGroup, mast, design, mats) {
  const root = mastGroup.parent;
  const registry = root.userData.shipPartRegistry;
  const mastIndex = design.masts.findIndex((item) => item.id === mast.id);
  const height = design.mastHeights[mastIndex] * WORLD_UNITS_PER_METRE;
  const span = design.hullLengthUnits * (mast.span ?? 0.22);
  const sail = makePart(root, registry, `sail-${mast.id}-gaff`, mastGroup);
  const lowerY = height * 0.18;
  const upperY = height * 0.86;
  const aftZ = span;
  const canvas = makePart(root, registry, `cloth-${mast.id}-gaff`, sail);
  const cloth = ownMesh(canvas, polygonClothGeometry([[0, 0], [aftZ, -height * 0.1], [aftZ * 0.78, -height * 0.7], [0, -height * 0.65]], height * 0.035), mats.sail, 'gaff-mainsail-cloth');
  cloth.rotation.y = Math.PI / 2;
  cloth.position.set(0, upperY, 0);
  const boom = makePart(root, registry, `boom-${mast.id}`, sail);
  beam(boom, mats.trim, [0, lowerY, 0], [0, lowerY, aftZ], Math.max(0.055, design.beamUnits * 0.008), 'boom-spar');
  const gaff = makePart(root, registry, `gaff-spar-${mast.id}`, sail);
  beam(gaff, mats.trim, [0, upperY, 0], [0, upperY - height * 0.12, aftZ * 0.82], Math.max(0.045, design.beamUnits * 0.006), 'gaff-spar');
  const lines = makePart(root, registry, `sail-lines-${mast.id}-gaff`, sail);
  beam(lines, mats.rope, [0, upperY - height * 0.12, aftZ * 0.82], [0, lowerY, aftZ], 0.018, 'gaff-lift');
  sail.userData.sailControl = { mastId: mast.id, kind: 'gaff', base: 0 };
  return sail;
}


function addLateenAssembly(mastGroup, mast, design, mats) {
  const root = mastGroup.parent;
  const registry = root.userData.shipPartRegistry;
  const index = design.masts.findIndex((item) => item.id === mast.id);
  const height = design.mastHeights[index] * WORLD_UNITS_PER_METRE;
  const span = design.hullLengthUnits * (mast.span ?? 0.36);
  const group = makePart(root, registry, `sail-${mast.id}-lateen`, mastGroup);
  const upper = [0, height * 0.94, -span * 0.58];
  const lower = [0, height * 0.12, span * 0.62];
  const aft = [0, height * 0.22, span * 0.5];
  const canvas = makePart(root, registry, `cloth-${mast.id}-lateen`, group);
  const sail = ownMesh(canvas, polygonClothGeometry([[upper[2], upper[1]], [lower[2], lower[1]], [aft[2], aft[1]]], height * 0.04), mats.sail, 'lateen-cloth');
  sail.rotation.y = Math.PI / 2;
  const yard = makePart(root, registry, `lateen-yard-${mast.id}`, group);
  beam(yard, mats.trim, upper, lower, Math.max(0.06, design.beamUnits * 0.009), 'lateen-yard-spar');
  const lines = makePart(root, registry, `sail-lines-${mast.id}-lateen`, group);
  beam(lines, mats.rope, upper, [0, design.deckHeightUnits + 0.18, mast.z * design.hullLengthUnits], 0.018, 'lateen-halyard');
  group.userData.sailControl = { mastId: mast.id, kind: 'lateen', base: 0 };
  return group;
}


function addTrysail(mastGroup, mast, design, mats) {
  const root = mastGroup.parent;
  const registry = root.userData.shipPartRegistry;
  const index = design.masts.findIndex((item) => item.id === mast.id);
  const height = design.mastHeights[index] * WORLD_UNITS_PER_METRE;
  const span = design.hullLengthUnits * 0.17;
  const group = makePart(root, registry, `sail-${mast.id}-trysail`, mastGroup);
  const canvas = makePart(root, registry, `cloth-${mast.id}-trysail`, group);
  const sail = ownMesh(canvas, polygonClothGeometry([[0, height * 0.8], [span, height * 0.4], [span * 0.9, height * 0.16], [0, height * 0.12]], height * 0.025), mats.sailShade, 'snow-trysail-cloth');
  sail.rotation.y = Math.PI / 2;
  const gaff = makePart(root, registry, `trysail-gaff-${mast.id}`, group);
  beam(gaff, mats.trim, [0, height * 0.8, 0], [0, height * 0.4, span], 0.055, 'trysail-gaff-spar');
  group.userData.sailControl = { mastId: mast.id, kind: 'trysail', base: 0 };
  return group;
}


function addDecorativeGunports(design, root, parts, mats) {
  const group = makePart(root, parts, 'gunports');
  if (!(design.gunportRows > 0)) return group;
  const L = design.hullLengthUnits;
  const B = design.beamUnits;
  const rowCount = design.gunportRows;
  const count = design.gunportsPerRow ?? 7;
  for (const side of [-1, 1]) {
    const label = side < 0 ? 'port' : 'starboard';
    const sideGroup = makePart(root, parts, `gunports-${label}`, group);
    for (let row = 0; row < rowCount; row += 1) {
      for (let index = 0; index < count; index += 1) {
        const t = 0.16 + (index / Math.max(1, count - 1)) * 0.68;
        const halfBeam = stationHalfBeam(design, t, false);
        const z = (t - 0.5) * L;
        const y = design.deckHeightUnits * (0.14 + row * 0.18);
        const shutter = makePart(root, parts, `gunport-shutter-${label}-${row * count + index + 1}`, sideGroup);
        // Closed, non-functional exterior shutter detail only; no interior mechanism or projectile component.
        const shutterWidth = Math.min(0.56, L * 0.018);
        const shutterHeight = 0.34;
        const faceX = side * (halfBeam + 0.018);
        const plate = box(shutter, mats.plank, [0.045, shutterHeight, shutterWidth], [faceX, y, z], `closed-port-shutter-${label}-${row}-${index}`);
        plate.rotation.z = side * -0.04;
        const frameX = side * (halfBeam + 0.044);
        for (const edge of [-1, 1]) {
          box(shutter, mats.trim, [0.05, shutterHeight + 0.07, 0.045], [frameX, y, z + edge * (shutterWidth * 0.5 + 0.018)], `closed-port-frame-stile-${label}-${row}-${index}-${edge}`);
          box(shutter, mats.trim, [0.05, 0.045, shutterWidth + 0.08], [frameX, y + edge * (shutterHeight * 0.5 + 0.018), z], `closed-port-frame-rail-${label}-${row}-${index}-${edge}`);
        }
      }
    }
  }
  return group;
}

function addHullStrakes(design, root, parts, mats) {
  const group = makePart(root, parts, 'hull-strakes');
  const draft = design.draftUnits;
  const levels = [0.24, 0.34, 0.45, 0.56];
  for (const side of [-1, 1]) {
    for (let index = 0; index < levels.length; index += 1) {
      const vertical = levels[index];
      const points = [];
      for (let sample = 4; sample <= 52; sample += 1) {
        const t = sample / 56;
        const half = stationHalfBeam(design, t, false);
        const sheerFactor = Math.pow(Math.abs(t - 0.5) * 2, 1.32);
        const sheerY = design.deckHeightUnits + design.hull.sheer * design.deckHeightUnits * sheerFactor
          + (t < 0.5 ? design.hull.bowRise : design.hull.sternRise) * design.deckHeightUnits * Math.pow(sheerFactor, 1.25);
        const tumble = vertical > 0.58 ? 1 - design.hull.tumblehome * ((vertical - 0.58) / 0.42) : 1;
        const bulge = 0.84 + 0.16 * Math.sin(Math.PI * vertical);
        const x = side * half * bulge * tumble;
        const y = -draft + vertical * (draft + sheerY);
        points.push(V3(x, y, (t - 0.5) * design.hullLengthUnits));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      ownMesh(group, new THREE.TubeGeometry(curve, 72, Math.max(0.025, design.beamUnits * 0.0025), 4, false), index === 0 ? mats.lowerHull : mats.plank, `strake-${side}-${index}`);
    }
  }
  return group;
}

function addAnchors(design, root, parts, mats) {
  const group = makePart(root, parts, 'anchors');
  const B = design.beamUnits;
  const L = design.hullLengthUnits;
  const y = design.deckHeightUnits * 0.55;
  for (const [side, label] of [[-1, 'port'], [1, 'starboard']]) {
    const anchor = makePart(root, parts, `anchor-${label}`, group);
    const x = side * B * 0.46;
    const z = -L * 0.35;
    const shoulder = [x, y - 0.25, z];
    const crown = [x + side * 0.18, y - 1.2, z - 0.12];
    beam(anchor, mats.iron, shoulder, crown, 0.075, 'anchor-shank');
    beam(anchor, mats.iron, [x - 0.42, y - 1.05, z - 0.12], [x + 0.42, y - 1.05, z - 0.12], 0.07, 'anchor-stock');
    beam(anchor, mats.iron, crown, [x - side * 0.42, y - 0.72, z - 0.1], 0.07, 'anchor-port-fluke');
    beam(anchor, mats.iron, crown, [x + side * 0.42, y - 0.72, z - 0.1], 0.07, 'anchor-starboard-fluke');
    const chain = makePart(root, parts, `anchor-chain-${label}`, anchor);
    const chainPath = new THREE.CatmullRomCurve3([
      V3(x, y - 0.1, z - 0.08), V3(x + side * 0.22, y - 0.45, z - 0.2), V3(x + side * 0.12, y - 0.82, z - 0.16), V3(crown[0], crown[1], crown[2]),
    ]);
    ownMesh(chain, new THREE.TubeGeometry(chainPath, 18, 0.035, 5, false), mats.iron, 'anchor-chain');
  }
  return group;
}

function addMastsAndRigging(design, root, parts, mats) {
  const standing = makePart(root, parts, 'standing-rigging');
  const running = makePart(root, parts, 'running-rigging');
  const mastGroups = [];
  const L = design.hullLengthUnits;
  const B = design.beamUnits;
  for (let i = 0; i < design.masts.length; i += 1) {
    const mast = design.masts[i];
    const mastName = `mast-${mast.id}`;
    const mastGroup = makePart(root, parts, mastName);
    mastGroup.position.set(0, design.deckHeightUnits, mast.z * L);
    mastGroup.userData.mastControl = { mastId: mast.id, baseLean: 0 };
    const height = design.mastHeights[i] * WORLD_UNITS_PER_METRE;
    const standingMast = makePart(root, parts, `standing-rigging-${mast.id}`, standing);
    const runningMast = makePart(root, parts, `running-rigging-${mast.id}`, running);
    const shrouds = makePart(root, parts, `shrouds-${mast.id}`, standingMast);
    const ratlines = makePart(root, parts, `ratlines-${mast.id}`, standingMast);
    const stays = makePart(root, parts, `mast-stays-${mast.id}`, standingMast);
    const braces = makePart(root, parts, `running-braces-${mast.id}`, runningMast);
    const lowerHeight = height * 0.69;
    const topHeight = height * 0.31;
    const radius = Math.max(0.095, B * (mast.auxiliary ? 0.011 : 0.018));
    const lowerMast = makePart(root, parts, `mast-lower-${mast.id}`, mastGroup);
    cylinder(lowerMast, mats.trim, radius * 0.48, radius, lowerHeight, [0, lowerHeight * 0.5, 0], { radialSegments: 10, name: `${mast.id}-lower-mast` });
    const topMast = makePart(root, parts, `mast-topmast-${mast.id}`, mastGroup);
    cylinder(topMast, mats.plank, radius * 0.26, radius * 0.46, topHeight, [0, lowerHeight + topHeight * 0.5, 0], { radialSegments: 8, name: `${mast.id}-topmast` });
    const mastStep = makePart(root, parts, `mast-step-${mast.id}`, mastGroup);
    box(mastStep, mats.trim, [radius * 4.2, 0.12, radius * 4.2], [0, lowerHeight * 0.58, 0], `${mast.id}-mast-step`);
    if (mast.rig === 'square' || mast.rig === 'brigantine') {
      const platform = makePart(root, parts, `mast-top-platform-${mast.id}`, mastGroup);
      box(platform, mats.trim, [B * 0.16, 0.16, 0.32], [0, lowerHeight * 0.91, 0], `${mast.id}-top-platform`);
    }
    // Shrouds, ratlines, stays and braces are independently editable linked groups.
    for (const side of [-1, 1]) {
      const chainplateZ = mast.z * L + (i === 0 ? -L * 0.075 : L * 0.07);
      const shroud = makePart(root, parts, `shroud-${mast.id}-${side < 0 ? 'port' : 'starboard'}`, shrouds);
      beam(shroud, mats.rope, [0, design.deckHeightUnits + height * 0.92, mast.z * L], [side * B * 0.43, design.deckHeightUnits + 0.16, chainplateZ], 0.027, `${mast.id}-shroud-${side}`);
      const ratlineSide = makePart(root, parts, `ratlines-${mast.id}-${side < 0 ? 'port' : 'starboard'}`, ratlines);
      for (let r = 0; r < 6; r += 1) {
        const f = (r + 1) / 7;
        beam(ratlineSide, mats.rope,
          [side * B * (0.08 + f * 0.35), design.deckHeightUnits + height * (0.72 - f * 0.42), mast.z * L - L * 0.012],
          [side * B * (0.08 + f * 0.35), design.deckHeightUnits + height * (0.72 - f * 0.42) - 0.13, chainplateZ],
          0.009, `${mast.id}-ratline-${side}-${r}`);
      }
      beam(braces, mats.rope, [0, design.deckHeightUnits + height, mast.z * L], [side * B * 0.4, design.deckHeightUnits + 0.14, mast.z * L + L * 0.16], 0.018, `${mast.id}-brace-${side}`);
    }
    beam(stays, mats.rope, [0, design.deckHeightUnits + height * 0.84, mast.z * L], [0, design.deckHeightUnits + 0.08, -L * 0.47], 0.025, `${mast.id}-forestay`);
    beam(stays, mats.rope, [0, design.deckHeightUnits + height * 0.84, mast.z * L], [0, design.deckHeightUnits + 0.08, L * 0.46], 0.025, `${mast.id}-backstay`);
    if (mast.rig === 'square') {
      const levels = Math.max(1, Math.min(3, mast.squares ?? 2));
      const mastSpec = { ...mast, height };
      for (let level = 0; level < levels; level += 1) makeSquareSail(mastGroup, mastSpec, design, mats, [0.37, 0.61, 0.82][level], level);
    } else if (mast.rig === 'gaff') addGaffAssembly(mastGroup, mast, design, mats);
    else if (mast.rig === 'lateen') addLateenAssembly(mastGroup, mast, design, mats);
    else if (mast.rig === 'trysail') addTrysail(mastGroup, mast, design, mats);
    else if (mast.rig === 'brigantine') {
      addGaffAssembly(mastGroup, mast, design, mats);
      makeSquareSail(mastGroup, { ...mast, height }, design, mats, 0.84, 1);
    }
    mastGroups.push(mastGroup);
  }
  // Headsails are individually addressable groups on stays between bowsprit and foremast.
  {
    const heads = makePart(root, parts, 'head-sails');
    const fore = design.masts[0];
    const foreIndex = 0;
    const foreTop = design.deckHeightUnits + design.mastHeights[foreIndex] * WORLD_UNITS_PER_METRE * 0.83;
    const bowZ = -L * (design.bowwork === 'long-bowsprit' ? 0.73 : 0.64);
    for (let i = 0; i < design.headsails; i += 1) {
      const sailName = `sail-head-${i + 1}`;
      const group = makePart(root, parts, sailName, heads);
      const topZ = THREE.MathUtils.lerp(-L * 0.48, fore.z * L, i / Math.max(1, design.headsails));
      const topY = foreTop * (0.9 - i * 0.045);
      const bottomZ = THREE.MathUtils.lerp(bowZ, -L * 0.5, i * 0.11);
      const bottomY = design.deckHeightUnits + 0.45 + i * 0.17;
      const canvas = makePart(root, parts, `cloth-head-${i + 1}`, group);
      const cloth = ownMesh(canvas, polygonClothGeometry([[0, topY - bottomY], [topZ - bottomZ, 0], [0, 0]], design.deckHeightUnits * 0.035), mats.sailShade, `headsail-${i + 1}-cloth`);
      cloth.rotation.y = Math.PI / 2;
      cloth.position.set(0, bottomY, bottomZ);
      const stay = makePart(root, parts, `stay-head-${i + 1}`, group);
      beam(stay, mats.rope, [0, topY, topZ], [0, bottomY, bottomZ], 0.016, `headsail-${i + 1}-stay`);
      group.userData.sailControl = { mastId: fore.id, kind: 'headsail', base: 0 };
    }
    const forestay = makePart(root, parts, 'head-forestay', heads);
    beam(forestay, mats.rope, [0, foreTop, fore.z * L], [0, design.deckHeightUnits + 0.25, bowZ], 0.022, 'forestay-to-bowsprit');
  }
  return { standing, running, mastGroups };
}

function addRudderAndHelm(design, root, parts, mats) {
  const L = design.hullLengthUnits;
  const D = design.draftUnits;
  const rudder = makePart(root, parts, 'rudder');
  rudder.position.set(0, -D * 0.28, L * 0.49);
  beam(rudder, mats.trim, [0, design.deckHeightUnits * 0.15, 0], [0, -D * 0.82, 0.12], Math.max(0.09, design.beamUnits * 0.018), 'rudder-stock');
  const blade = box(rudder, mats.lowerHull, [design.beamUnits * 0.09, D * 0.68, design.beamUnits * 0.04], [0, -D * 0.44, 0.25], 'rudder-blade');
  blade.rotation.x = -0.12;
  beam(rudder, mats.iron, [-design.beamUnits * 0.07, -D * 0.2, 0.16], [design.beamUnits * 0.07, -D * 0.2, 0.16], 0.04, 'rudder-pintle');
  const helm = makePart(root, parts, 'helm');
  const y = design.deckHeightUnits + 0.5;
  const z = L * 0.35;
  cylinder(helm, mats.trim, 0.1, 0.1, 0.75, [0, y, z], { name: 'helm-post' });
  const wheel = makePart(root, parts, 'helm-wheel', helm);
  wheel.name = 'helm-wheel';
  wheel.position.set(0, y + 0.6, z);
  cylinder(wheel, mats.plank, 0.48, 0.48, 0.1, [0, 0, 0], { axis: 'z', radialSegments: 12, name: 'wheel-rim' });
  cylinder(wheel, mats.trim, 0.1, 0.1, 0.18, [0, 0, 0], { axis: 'z', name: 'wheel-hub' });
  for (let i = 0; i < 8; i += 1) {
    const angle = i * Math.PI / 4;
    beam(wheel, mats.trim, [0, 0, 0.07], [Math.cos(angle) * 0.46, Math.sin(angle) * 0.46, 0.07], 0.025, `wheel-spoke-${i}`);
    cylinder(wheel, mats.plank, 0.035, 0.035, 0.28, [Math.cos(angle) * 0.52, Math.sin(angle) * 0.52, 0.07], { axis: 'z', name: `wheel-handle-${i}` });
  }
  return { rudder, helm };
}

function addDeckDetails(design, root, parts, mats) {
  const group = parts.get('deck-fittings');
  const L = design.hullLengthUnits;
  const B = design.beamUnits;
  const y = design.deckHeightUnits + 0.1;
  // Cargo hatches and removable covers, scaled by ship size.
  const hatchCount = design.hullLength > 20 ? 3 : 1;
  for (let i = 0; i < hatchCount; i += 1) {
    const z = -L * 0.15 + i * (L * 0.15);
    box(group, mats.trim, [B * 0.27, 0.12, L * 0.075], [0, y, z], `cargo-hatch-${i + 1}`);
    for (let plank = -2; plank <= 2; plank += 1) {
      box(group, mats.plank, [B * 0.045, 0.035, L * 0.07], [plank * B * 0.048, y + 0.08, z], `hatch-plank-${i}-${plank}`);
    }
  }
  // Capstan, bitts, and pumps are small but important deck-scale details.
  cylinder(group, mats.trim, B * 0.035, B * 0.04, 0.6, [0, y + 0.28, -L * 0.03], { name: 'capstan' });
  for (const side of [-1, 1]) {
    box(group, mats.trim, [0.18, 0.65, 0.18], [side * B * 0.3, y + 0.33, -L * 0.43], `bow-bitt-${side}`);
    cylinder(group, mats.trim, 0.12, 0.14, 0.9, [side * B * 0.28, y + 0.45, L * 0.08], { name: `deck-pump-${side}` });
  }
  // Rowing benches and oars appear only on vessel families historically associated with them.
  if (design.oars) {
    for (let i = 0; i < 7; i += 1) {
      const z = -L * 0.34 + i * L * 0.105;
      box(group, mats.plank, [B * 0.78, 0.09, 0.12], [0, y * 0.72, z], `rowing-thwart-${i}`);
      for (const side of [-1, 1]) {
        const pivot = [side * B * 0.46, y * 0.66, z];
        beam(group, mats.plank, pivot, [side * B * 0.86, y * 0.52, z - L * 0.055], 0.025, `oar-${i}-${side}`);
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
  for (const [name, part] of registry) {
    const baseline = {
      position: part.position.clone(), rotation: part.rotation.clone(),
    };
    original.set(name, {
      parent: part.parent,
      position: part.position.clone(), quaternion: part.quaternion.clone(), rotation: part.rotation.clone(), scale: part.scale.clone(),
    });
    transformBase.set(name, baseline);
  }
  const removeTransformOffset = (name, part) => {
    const offset = state.partTransforms[name] ?? {};
    return {
      position: part.position.clone().sub(V3(offset.x, offset.y, offset.z)),
      rotation: part.rotation.clone().set(
        part.rotation.x - (offset.rx ?? 0),
        part.rotation.y - (offset.ry ?? 0),
        part.rotation.z - (offset.rz ?? 0),
        'XYZ',
      ),
    };
  };
  const sailControls = [...registry.values()].filter((part) => part.userData.sailControl);
  const mastControls = [...registry.values()].filter((part) => part.userData.mastControl);
  const state = { rudderAngle: 0, sailTrim: {}, mastLean: {}, hiddenParts: {}, unlinkedParts: [], partTransforms: {} };
  const api = {
    parts: registry,
    getPart(name) { return registry.get(name) ?? null; },
    detachPart(name) {
      const part = registry.get(name);
      if (!part || part === unlinked || name === 'unlinked-parts' || part.parent === unlinked) return false;
      root.updateMatrixWorld(true);
      const world = part.matrixWorld.clone();
      unlinked.updateMatrixWorld(true);
      part.parent?.remove(part);
      unlinked.add(part);
      const local = unlinked.matrixWorld.clone().invert().multiply(world);
      local.decompose(part.position, part.quaternion, part.scale);
      transformBase.set(name, removeTransformOffset(name, part));
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
      transformBase.set(name, removeTransformOffset(name, part));
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
      part.position.copy(base.position).add(V3(values.x, values.y, values.z));
      const rotation = base.rotation.clone().set(
        base.rotation.x + values.rx, base.rotation.y + values.ry, base.rotation.z + values.rz, 'XYZ',
      );
      part.rotation.copy(rotation);
      state.partTransforms[name] = values;
      if (name === 'rudder') part.rotation.y = state.rudderAngle + values.ry;
      if (part.userData.mastControl) part.rotation.x = (state.mastLean[part.userData.mastControl.mastId] ?? 0) + values.rx;
      if (part.userData.sailControl) part.rotation.y = (state.sailTrim[part.userData.sailControl.mastId] ?? 0) + values.ry;
      return true;
    },
    resetPartTransform(name) {
      if (!registry.has(name)) return false;
      return api.setPartTransform(name, {});
    },
    setRudderAngle(radians) {
      const part = registry.get('rudder');
      if (!part) return false;
      state.rudderAngle = clamp(radians, -0.62, 0.62);
      part.rotation.y = state.rudderAngle + (state.partTransforms.rudder?.ry ?? 0);
      return true;
    },
    setSailTrim(mastId, radians) {
      const targets = sailControls.filter((part) => part.userData.sailControl.mastId === mastId);
      if (!targets.length) return false;
      const value = clamp(radians, -1.1, 1.1);
      state.sailTrim[mastId] = value;
      for (const part of targets) part.rotation.y = value + (state.partTransforms[part.name]?.ry ?? 0);
      return true;
    },
    setMastLean(mastId, radians) {
      const target = mastControls.find((part) => part.userData.mastControl.mastId === mastId);
      if (!target) return false;
      const value = clamp(radians, -0.16, 0.16);
      state.mastLean[mastId] = value;
      target.rotation.x = value + (state.partTransforms[target.name]?.rx ?? 0);
      return true;
    },
    animateShip(delta = 0.016, weather = {}) {
      state.time = (state.time ?? 0) + clamp(delta, 0, 0.1);
      const wind = clamp(weather.windStrength ?? 0.25, 0, 1);
      const angle = Number(weather.windAngle) || 0;
      for (const part of sailControls) {
        const mastId = part.userData.sailControl.mastId;
        const manual = state.sailTrim[mastId] ?? 0;
        const gust = Math.sin(state.time * 1.4 + mastId.length) * 0.018 * wind;
        part.rotation.y = (state.partTransforms[part.name]?.ry ?? 0) + manual + Math.sin(angle) * 0.08 * wind + gust;
      }
    },
    getShipState() {
      return {
        rudderAngle: state.rudderAngle,
        sailTrim: { ...state.sailTrim },
        mastLean: { ...state.mastLean },
        hiddenParts: { ...state.hiddenParts },
        unlinkedParts: [...state.unlinkedParts],
        partTransforms: Object.fromEntries(Object.entries(state.partTransforms).map(([name, values]) => [name, { ...values }])),
      };
    },
    applyShipState(saved = {}) {
      // Restore the saved hierarchy before local offsets so detached components
      // retain their original local transform baseline after reload.
      for (const name of saved.unlinkedParts ?? []) if (registry.has(name)) api.detachPart(name);
      for (const [name, transform] of Object.entries(saved.partTransforms ?? {})) {
        if (registry.has(name)) api.setPartTransform(name, transform);
      }
      api.setRudderAngle(saved.rudderAngle ?? 0);
      for (const [id, value] of Object.entries(saved.sailTrim ?? {})) api.setSailTrim(id, value);
      for (const [id, value] of Object.entries(saved.mastLean ?? {})) api.setMastLean(id, value);
      for (const [name, hidden] of Object.entries(saved.hiddenParts ?? {})) if (registry.has(name)) api.setPartVisible(name, !hidden);
      return true;
    },
    summary() {
      return {
        type: design.id,
        label: design.label,
        dimensions: { length: design.hullLength, beam: design.beam, draft: design.draft },
        lengthBeamRatio: design.lengthBeamRatio,
        rig: design.rig,
        era: design.era,
        reference: design.reference,
        sources: design.sources.map((source) => ({ ...source })),
        hullProfile: design.hullProfile,
        partCount: registry.size,
        parts: [...registry.keys()],
        unlinkedParts: [...state.unlinkedParts],
      };
    },
  };
  return { api, state };
}

export function createShipModel(type) {
  const design = getShipDesign(type);
  if (!design) throw new Error(`Unknown historical ship type: ${type}`);
  const root = new THREE.Group();
  root.name = `Verdant Reach · ${design.label}`;
  const mats = createMaterials();
  const registry = new Map();
  root.userData.shipPartRegistry = registry;
  root.userData.shipType = design.id;
  root.userData.shipLabel = design.label;
  root.userData.forwardAxis = '-z';
  root.userData.shipDimensions = { length: design.hullLength, beam: design.beam, draft: design.draft };
  root.userData.shipDimensionsUnits = { length: design.hullLengthUnits, beam: design.beamUnits, draft: design.draftUnits };
  root.userData.deckHeightUnits = design.deckHeightUnits;
  root.userData.deckHeight = design.deckHeightUnits;
  root.userData.vehicle = { mode: 'boat', vesselType: design.id, deckHeight: design.deckHeightUnits, label: `Board ${design.label}` };

  addHull(design, root, registry, mats);
  addHullStrakes(design, root, registry, mats);
  addDecorativeGunports(design, root, registry, mats);
  addSternworks(design, root, registry, mats);
  addRailings(design, root, registry, mats);
  addBowworks(design, root, registry, mats);
  addMastsAndRigging(design, root, registry, mats);
  addRudderAndHelm(design, root, registry, mats);
  addAnchors(design, root, registry, mats);
  addDeckDetails(design, root, registry, mats);

  const { api } = setupPartApi(root, registry, design);
  root.userData.getPart = api.getPart;
  root.userData.detachPart = api.detachPart;
  root.userData.relinkPart = api.relinkPart;
  root.userData.setPartVisible = api.setPartVisible;
  root.userData.setPartTransform = api.setPartTransform;
  root.userData.resetPartTransform = api.resetPartTransform;
  root.userData.setRudderAngle = api.setRudderAngle;
  root.userData.setSailTrim = api.setSailTrim;
  root.userData.setMastLean = api.setMastLean;
  root.userData.animateShip = api.animateShip;
  root.userData.getShipState = api.getShipState;
  root.userData.applyShipState = api.applyShipState;
  root.userData.shipModelSummary = api.summary;
  root.userData.partNames = [...registry.keys()];
  const ownedGeometries = new Set();
  const ownedMaterials = new Set(Object.values(mats));
  root.traverse((object) => {
    if (!object.isMesh) return;
    ownedGeometries.add(object.geometry);
    if (Array.isArray(object.material)) object.material.forEach((item) => ownedMaterials.add(item));
    else ownedMaterials.add(object.material);
    object.userData.shipOwned = true;
  });
  root.userData.ownedGeometries = [...ownedGeometries];
  root.userData.ownedMaterials = [...ownedMaterials];
  delete root.userData.shipPartRegistry;
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
    id: design.id,
    label: design.label,
    dimensions: `${design.hullLength.toFixed(1)} × ${design.beam.toFixed(1)} m`,
    ratio: design.lengthBeamRatio.toFixed(2),
    rig: design.rig,
    period: design.era,
    hullProfile: design.hullProfile,
    hullFormNote: design.hullFormNote,
    modelScaleNote: design.modelScaleNote,
    reference: design.reference,
    sources: design.sources.map((source) => ({ ...source })),
    mastCount: design.mastCount,
    partCount: design.partNames.length,
    parts: design.partNames,
  };
}
