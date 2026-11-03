import * as THREE from 'three';
import { SHIP_DESIGNS, getShipDesign } from './ship-designs.js';

const WOOD_DARK = 0x49372b;
const WOOD_HULL = 0x684a34;
const WOOD_WARM = 0x8a6545;
const DECK_WOOD = 0x9a7954;
const SAIL_CLOTH = 0xd9cfb1;
const ROPE_COLOR = 0x675745;
const IRON_DARK = 0x535b58;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...options });
}

function addMesh(group, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.shipOwned = true;
  group.add(mesh);
  return mesh;
}

function addBox(group, mat, size, position, rotation = [0, 0, 0]) {
  return addMesh(group, new THREE.BoxGeometry(...size), mat, position, rotation);
}

function addCylinder(group, mat, radiusTop, radiusBottom, length, position, axis = 'y', radialSegments = 7) {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, radialSegments, 1, false);
  const rotation = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return addMesh(group, geometry, mat, position, rotation);
}

function addBeam(group, mat, start, end, radius = 0.055) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  if (length < 0.001) return null;
  const mesh = addCylinder(group, mat, radius * 0.82, radius, length, [0, 0, 0]);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function makeSailGeometry(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 1);
  geometry.computeVertexNormals();
  return geometry;
}

function addSquareSail(group, cloth, z, centerY, width, height, fullness = 0.08) {
  const half = width / 2;
  const geometry = makeSailGeometry([
    [-half, height * 0.46], [half, height * 0.46],
    [half * 0.88, -height * 0.46], [0, -height * 0.46 - fullness], [-half * 0.88, -height * 0.46],
  ]);
  return addMesh(group, geometry, cloth, [0, centerY, z]);
}

function addGaffSail(group, mats, mastZ, deckY, mastHeight, span, boomY = deckY + 0.25) {
  const topY = deckY + mastHeight * 0.8;
  const endZ = mastZ + span;
  // Sail shape is authored in its local vertical plane; its lower edge starts
  // just above the deck rather than inheriting the deck's world-space height.
  const geometry = makeSailGeometry([
    [0, 0.1], [span, boomY - deckY], [span * 0.83, topY - deckY],
  ]);
  addMesh(group, geometry, mats.cloth, [0, deckY, mastZ], [0, -Math.PI / 2, 0]);
  addBeam(group, mats.wood, [0, boomY, mastZ - 0.1], [0, boomY, endZ], 0.085);
  addBeam(group, mats.wood, [0, topY, mastZ], [0, topY - mastHeight * 0.03, endZ * 0.83 + mastZ * 0.17], 0.07);
}

function addLateenSail(group, mats, mastZ, deckY, mastHeight, span) {
  const yardTop = [0, deckY + mastHeight * 0.93, mastZ - span * 0.16];
  const yardBottom = [0, deckY + mastHeight * 0.1, mastZ + span * 0.94];
  const sailGeometry = makeSailGeometry([[0, 0], [span * 0.94, -mastHeight * 0.78], [span * 0.15, -mastHeight * 0.8]]);
  addMesh(group, sailGeometry, mats.cloth, [0, deckY + mastHeight * 0.93, mastZ - span * 0.16], [0, -Math.PI / 2, 0]);
  addBeam(group, mats.wood, yardTop, yardBottom, 0.09);
}

function addSquareRig(group, mats, z, deckY, mastHeight, beam, sailCount = 3) {
  const yardCount = sailCount;
  for (let i = 0; i < yardCount; i += 1) {
    const level = [0.42, 0.65, 0.83][i];
    const height = mastHeight * level;
    const width = beam * [1.18, 0.95, 0.72][i];
    const sailHeight = mastHeight * [0.22, 0.16, 0.12][i];
    const yardY = deckY + height;
    addCylinder(group, mats.wood, 0.075, 0.095, width, [0, yardY, z], 'x', 6);
    addSquareSail(group, mats.cloth, z, yardY - sailHeight * 0.52, width * 0.78, sailHeight, 0.12);
    addBeam(group, mats.rope, [0, yardY + 0.03, z], [0, deckY + mastHeight * 0.96, z], 0.035);
  }
}

function makeHullGeometry(design) {
  const stations = 34;
  const perimeter = [
    [0, -1], [0.44, -0.79], [0.83, -0.39], [1, 0],
    [-1, 0], [-0.83, -0.39], [-0.44, -0.79],
  ];
  const vertices = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const z = (t - 0.5) * design.hullLength;
    const endTaper = Math.pow(Math.max(0.002, Math.sin(Math.PI * t)), design.id === 'galleon' ? 0.64 : 0.76);
    const aftFullness = design.id === 'galleon' ? 1 + 0.08 * t : 1;
    const halfBeam = design.beam * 0.5 * endTaper * aftFullness;
    const sheer = 1.48 + Math.pow(Math.abs(t - 0.5) * 2, 1.55) * (design.id === 'galleon' ? 0.68 : 0.35) + (t > 0.86 && design.id === 'galleon' ? 0.35 : 0);
    for (const [widthFactor, depthFactor] of perimeter) {
      vertices.push(widthFactor * halfBeam, depthFactor < 0 ? -design.draft * Math.abs(depthFactor) + (depthFactor === -1 ? 0 : 0) : sheer, z);
    }
  }
  const ringSize = perimeter.length;
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < ringSize; j += 1) {
      const a = i * ringSize + j;
      const b = i * ringSize + (j + 1) % ringSize;
      const c = (i + 1) * ringSize + j;
      const d = (i + 1) * ringSize + (j + 1) % ringSize;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeDeckGeometry(design) {
  const stations = 32;
  const crossSegments = 4;
  const vertices = [];
  const indices = [];
  for (let i = 0; i <= stations; i += 1) {
    const t = i / stations;
    const z = (t - 0.5) * design.hullLength;
    const taper = Math.pow(Math.max(0.002, Math.sin(Math.PI * t)), design.id === 'galleon' ? 0.64 : 0.76);
    const halfBeam = design.beam * 0.5 * taper * (design.id === 'galleon' ? 1 + 0.08 * t : 1) * 0.94;
    const y = 1.52 + Math.pow(Math.abs(t - 0.5) * 2, 1.55) * (design.id === 'galleon' ? 0.68 : 0.35);
    for (let j = 0; j <= crossSegments; j += 1) {
      const u = j / crossSegments;
      vertices.push(-halfBeam + u * halfBeam * 2, y, z);
    }
  }
  for (let i = 0; i < stations; i += 1) {
    for (let j = 0; j < crossSegments; j += 1) {
      const a = i * (crossSegments + 1) + j;
      const b = a + 1;
      const c = a + crossSegments + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addHullDetails(group, design, mats) {
  const L = design.hullLength;
  const B = design.beam;
  const deckY = 1.55;
  const hull = addMesh(group, makeHullGeometry(design), mats.hull, [0, 0, 0]);
  hull.material.side = THREE.DoubleSide;
  addMesh(group, makeDeckGeometry(design), mats.deck, [0, 0, 0]);
  addBox(group, mats.dark, [B * 0.13, 0.32, L * 0.78], [0, -design.draft * 0.91, 0]);
  // Raised gunwale / rail lines are kept simple so the silhouette reads from game camera distance.
  for (const side of [-1, 1]) {
    const railStart = [side * B * 0.32, deckY + 0.48, -L * 0.41];
    const railEnd = [side * B * 0.32, deckY + 0.48, L * 0.42];
    addBeam(group, mats.rail, railStart, railEnd, design.id === 'sloop' ? 0.055 : 0.075);
    for (let i = 0; i < 9; i += 1) {
      const z = -L * 0.38 + (L * 0.76 * i) / 8;
      const taper = Math.pow(Math.max(0.002, Math.sin(Math.PI * (z / L + 0.5))), 0.76);
      const x = side * B * 0.5 * taper * 0.93;
      addBeam(group, mats.rail, [x, deckY + 0.08, z], [x, deckY + 0.48, z], 0.045);
    }
  }
  // Keel, sternpost, rudder and a restrained bow stem.
  addBeam(group, mats.dark, [0, -design.draft - 0.12, -L * 0.37], [0, -design.draft - 0.12, L * 0.43], 0.18);
  addBeam(group, mats.dark, [0, -design.draft * 0.25, L * 0.46], [0, -design.draft - 0.85, L * 0.49], 0.12);
  addBox(group, mats.dark, [0.24, design.draft * 0.75, 0.28], [0, -design.draft * 0.48, L * 0.49]);
  addBeam(group, mats.wood, [0, deckY + 0.35, -L * 0.47], [0, deckY - 0.3, -L * 0.58], 0.16);

  // Subtle deck plank seams and outer strakes give the hull scale and structure
  // without relying on a high-poly imported model.
  for (let i = 0; i < 17; i += 1) {
    const t = 0.12 + i * 0.047;
    const z = (t - 0.5) * L;
    const taper = Math.pow(Math.max(0.002, Math.sin(Math.PI * t)), design.id === 'galleon' ? 0.64 : 0.76);
    const half = B * 0.5 * taper * 0.9;
    addBeam(group, mats.wood, [-half, 1.57, z], [half, 1.57, z], 0.018);
  }
  for (const side of [-1, 1]) {
    for (const fraction of [0.42, 0.58]) {
      const points = [];
      for (let i = 0; i <= 16; i += 1) {
        const t = 0.06 + i * 0.055;
        const taper = Math.pow(Math.max(0.002, Math.sin(Math.PI * t)), design.id === 'galleon' ? 0.64 : 0.76);
        points.push([side * B * 0.5 * taper * 0.98, -design.draft * fraction, (t - 0.5) * L]);
      }
      for (let i = 1; i < points.length; i += 1) addBeam(group, mats.dark, points[i - 1], points[i], 0.035);
    }
  }
  // Anchors and a forward bitt make the bow recognizable from the isometric view.
  for (const side of [-1, 1]) {
    const anchorX = side * B * 0.34;
    addBeam(group, mats.dark, [anchorX, deckY + 0.18, -L * 0.39], [anchorX, deckY - 0.8, -L * 0.42], 0.075);
    addBeam(group, mats.dark, [anchorX - 0.48, deckY - 0.72, -L * 0.42], [anchorX + 0.48, deckY - 0.72, -L * 0.42], 0.08);
  }

  if (design.id === 'galleon') {
    // Lower foredeck and stepped aft castle are signature features of this interpretation.
    addBox(group, mats.deck, [B * 0.58, 1.05, L * 0.16], [0, 2.0, -L * 0.32]);
    addBox(group, mats.hull, [B * 0.57, 2.25, L * 0.19], [0, 2.45, L * 0.33]);
    addBox(group, mats.deck, [B * 0.62, 0.18, L * 0.2], [0, 3.65, L * 0.33]);
    addBox(group, mats.hull, [B * 0.48, 1.6, L * 0.12], [0, 4.55, L * 0.37]);
    addBox(group, mats.deck, [B * 0.5, 0.16, L * 0.13], [0, 5.38, L * 0.37]);
    for (const x of [-B * 0.19, B * 0.19]) {
      for (let i = 0; i < 3; i += 1) {
        const window = addMesh(group, new THREE.BoxGeometry(0.38, 0.45, 0.08), mats.window, [x, 2.05 + i * 1.06, L * 0.433]);
        window.castShadow = false;
      }
    }
    addBox(group, mats.wood, [B * 0.16, 0.8, 0.38], [0, 6.0, L * 0.37]);
  } else if (design.id === 'sloop') {
    addBox(group, mats.hull, [B * 0.52, 1.45, L * 0.15], [0, 2.05, L * 0.31]);
    addBox(group, mats.deck, [B * 0.56, 0.14, L * 0.16], [0, 2.8, L * 0.31]);
  } else if (design.id === 'brigantine') {
    addBox(group, mats.hull, [B * 0.55, 1.2, L * 0.12], [0, 2.0, L * 0.35]);
    addBox(group, mats.deck, [B * 0.58, 0.14, L * 0.13], [0, 2.65, L * 0.35]);
    addBox(group, mats.deck, [B * 0.24, 0.16, L * 0.12], [0, 1.76, -L * 0.12]);
  } else {
    // Working deck hatches and small deckhouse for the long schooner hull.
    for (const z of [-L * 0.12, L * 0.12]) addBox(group, mats.hull, [B * 0.3, 0.38, L * 0.085], [0, 1.82, z]);
    addBox(group, mats.hull, [B * 0.3, 1.1, L * 0.09], [0, 2.05, L * 0.34]);
  }
}

function addMastAndRig(group, design, mats, mastIndex, z, height, rigType) {
  const deckY = 1.55;
  const mastBase = deckY + (design.id === 'galleon' && mastIndex === 2 ? 1.2 : 0.05);
  const mainRadius = Math.max(0.16, design.beam * 0.021) * (mastIndex === 0 ? 0.93 : 1);
  const lowerMastLength = height * 0.81;
  const topmastLength = height * 0.19;
  addCylinder(group, mats.wood, mainRadius * 0.55, mainRadius, lowerMastLength, [0, mastBase + lowerMastLength / 2, z], 'y', 9);
  const topY = mastBase + height;
  addCylinder(group, mats.wood, mainRadius * 0.33, mainRadius * 0.43, topmastLength, [0, mastBase + lowerMastLength + topmastLength / 2, z], 'y', 7);
  addBox(group, mats.dark, [mainRadius * 5, 0.12, mainRadius * 5], [0, mastBase + 0.4, z]);
  for (const side of [-1, 1]) {
    addBeam(group, mats.rope, [0, topY * 0.93, z], [side * design.beam * 0.43, deckY + 0.15, z + (mastIndex === 0 ? -design.hullLength * 0.1 : design.hullLength * 0.12)], 0.035);
  }

  if (rigType === 'square') {
    addSquareRig(group, mats, z, mastBase, height, design.beam, design.id === 'galleon' ? 3 : 2);
  } else if (rigType === 'gaff') {
    addGaffSail(group, mats, z, mastBase, height, design.hullLength * (design.id === 'schooner' ? 0.22 : 0.2));
    const gaffEnd = [0, mastBase + height * 0.79, z + design.hullLength * 0.18];
    addBeam(group, mats.wood, [0, mastBase + height * 0.96, z], gaffEnd, 0.085);
  } else if (rigType === 'lateen') {
    addLateenSail(group, mats, z, mastBase, height, design.hullLength * 0.26);
  }
  addBeam(group, mats.rope, [0, topY + height * 0.04, z], [0, deckY + 0.05, -design.hullLength * 0.47], 0.035);
  addBeam(group, mats.rope, [0, topY + height * 0.04, z], [0, deckY + 0.05, design.hullLength * 0.45], 0.035);
}

function addHeadsails(group, design, mats, mastZ) {
  const deckY = 1.55;
  const bowZ = -design.hullLength * 0.52;
  const bowspritTip = -design.hullLength * 0.66;
  addBeam(group, mats.wood, [0, deckY + 0.55, bowZ], [0, deckY + 1.2, bowspritTip], design.id === 'galleon' ? 0.2 : 0.12);
  addBeam(group, mats.rope, [0, deckY + 1.0, bowspritTip], [0, deckY + (design.id === 'galleon' ? 22 : design.mastHeights[0]) * 0.9, mastZ], 0.04);
  const sailCount = design.id === 'galleon' ? 2 : 1;
  for (let i = 0; i < sailCount; i += 1) {
    const x = 0;
    const yTop = deckY + design.mastHeights[0] * (0.84 - i * 0.12);
    const yBottom = deckY + 0.55;
    const forward = bowZ + 0.2 - i * 1.3;
    const aft = mastZ - 0.25;
    const geo = makeSailGeometry([[0, 0], [design.hullLength * 0.12, yBottom - yTop], [0, yBottom - yTop]]);
    addMesh(group, geo, mats.cloth, [x, yTop, forward], [0, -Math.PI / 2, 0]);
    addBeam(group, mats.rope, [0, yTop, forward], [0, yBottom, aft], 0.025);
  }
}

export function createShipModel(type) {
  const design = getShipDesign(type);
  if (!design) throw new Error(`Unknown historical ship type: ${type}`);
  const group = new THREE.Group();
  group.name = `Verdant Reach ${design.label}`;
  const mats = {
    hull: material(WOOD_HULL), deck: material(DECK_WOOD), wood: material(WOOD_WARM),
    dark: material(WOOD_DARK), rail: material(WOOD_DARK), cloth: material(SAIL_CLOTH, { side: THREE.DoubleSide, roughness: 1 }),
    rope: material(ROPE_COLOR, { roughness: 1 }), window: material(0x91a9a4, { roughness: 0.38, metalness: 0.08 }),
  };
  addHullDetails(group, design, mats);
  if (design.id === 'sloop') {
    const mastZ = -design.hullLength * 0.16; // Approximately one third aft of the bow.
    addMastAndRig(group, design, mats, 0, mastZ, design.mastHeights[0], 'gaff');
    addHeadsails(group, design, mats, mastZ);
  } else if (design.id === 'brigantine') {
    const foreZ = -design.hullLength * 0.23;
    const mainZ = design.hullLength * 0.16;
    addMastAndRig(group, design, mats, 0, foreZ, design.mastHeights[0], 'square');
    addMastAndRig(group, design, mats, 1, mainZ, design.mastHeights[1], 'gaff');
    // Main topsail: a compact square sail above the fore-and-aft mainsail.
    addSquareSail(group, mats.cloth, mainZ, 1.55 + design.mastHeights[1] * 0.82, design.beam * 0.68, 3.2, 0.05);
    addHeadsails(group, design, mats, foreZ);
  } else if (design.id === 'schooner') {
    const foreZ = -design.hullLength * 0.24;
    const mainZ = design.hullLength * 0.12;
    addMastAndRig(group, design, mats, 0, foreZ, design.mastHeights[0], 'gaff');
    addMastAndRig(group, design, mats, 1, mainZ, design.mastHeights[1], 'gaff');
    addHeadsails(group, design, mats, foreZ);
  } else {
    const foreZ = -design.hullLength * 0.27;
    const mainZ = -design.hullLength * 0.02;
    const mizzenZ = design.hullLength * 0.29;
    addMastAndRig(group, design, mats, 0, foreZ, design.mastHeights[0], 'square');
    addMastAndRig(group, design, mats, 1, mainZ, design.mastHeights[1], 'square');
    addMastAndRig(group, design, mats, 2, mizzenZ, design.mastHeights[2], 'lateen');
    addHeadsails(group, design, mats, foreZ);
  }
  group.userData.shipType = design.id;
  group.userData.shipLabel = design.label;
  group.userData.forwardAxis = '-z';
  group.userData.shipDimensions = { length: design.hullLength, beam: design.beam, draft: design.draft };
  group.userData.deckHeight = 1.55;
  group.userData.vehicle = { mode: 'boat', vesselType: design.id, label: `Sail ${design.label}` };
  group.traverse((object) => {
    if (object.isMesh) object.userData.shipOwned = true;
  });
  group.userData.ownedGeometries = [];
  group.userData.ownedMaterials = Object.values(mats);
  group.traverse((object) => {
    if (object.isMesh) group.userData.ownedGeometries.push(object.geometry);
  });
  return group;
}

export function disposeShipModel(group) {
  if (!group) return;
  for (const geometry of new Set(group.userData.ownedGeometries ?? [])) geometry.dispose();
  for (const mat of new Set(group.userData.ownedMaterials ?? [])) mat.dispose();
  group.parent?.remove(group);
}

export function shipModelSummary(type) {
  const design = SHIP_DESIGNS[type];
  if (!design) return null;
  return {
    label: design.label,
    dimensions: `${design.hullLength.toFixed(1)} × ${design.beam.toFixed(1)} m`,
    ratio: design.lengthBeamRatio.toFixed(2),
    rig: design.rig,
    period: design.era,
  };
}
