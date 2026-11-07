import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const IMPORTED_VESSELS = [];

export function getImportedVessel(id) {
  return IMPORTED_VESSELS.find(asset => asset.id === id) || null;
}

export function createImportedVesselWrapper(THREE_NS, asset, loaded, savedState = {}) {
  const root = new THREE_NS.Group();
  root.name = asset.label;
  root.userData.isImportedModel = true;
  root.userData.importedAssetId = asset.id;
  root.userData.importedMetadata = {
    label: asset.label,
    category: asset.category,
    license: asset.license,
    description: asset.description,
    dimensions: { ...asset.dimensions },
    sources: asset.sources.map(source => ({ ...source })),
  };
  root.userData.importedResources = [...(loaded.resources || [])];

  const model = loaded.scene;
  model.name = model.name || 'Imported model';
  root.add(model);

  const registry = new Map();
  const original = new Map();
  const base = new Map();
  const hiddenParts = {};
  const unlinkedParts = [];
  const partTransforms = {};
  const unlinked = new THREE_NS.Group();
  unlinked.name = 'unlinked-parts';
  root.add(unlinked);

  let index = 0;
  model.traverse(object => {
    if (object === model) return;
    if (!object.isMesh && object.children.length === 0) return;
    const sourceName = (object.name || (object.isMesh ? 'Mesh' : 'Group')).trim();
    const safeName = sourceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'part';
    const id = 'imported-' + String(++index).padStart(3, '0') + '-' + safeName;
    object.userData.sourceName = sourceName;
    object.name = id;
    object.userData.shipPart = true;
    registry.set(id, object);
    const record = {
      parent: object.parent,
      position: object.position.clone(),
      quaternion: object.quaternion.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
      visible: object.visible,
    };
    original.set(id, record);
    base.set(id, record);
  });

  if (!registry.size) {
    const id = 'imported-001-whole-model';
    registry.set(id, model);
    const record = {
      parent: root,
      position: model.position.clone(),
      quaternion: model.quaternion.clone(),
      rotation: model.rotation.clone(),
      scale: model.scale.clone(),
      visible: model.visible,
    };
    original.set(id, record);
    base.set(id, record);
    model.name = id;
    model.userData.shipPart = true;
  }

  const convertTransformRecord = (record, fromParent, toParent) => {
    if (!record || !fromParent || !toParent) return record;
    fromParent.updateWorldMatrix(true, false);
    toParent.updateWorldMatrix(true, false);
    const local = new THREE_NS.Matrix4().compose(record.position, record.quaternion, record.scale);
    const world = fromParent.matrixWorld.clone().multiply(local);
    const converted = toParent.matrixWorld.clone().invert().multiply(world);
    const position = new THREE_NS.Vector3();
    const quaternion = new THREE_NS.Quaternion();
    const scale = new THREE_NS.Vector3();
    converted.decompose(position, quaternion, scale);
    const rotation = new THREE_NS.Euler().setFromQuaternion(quaternion, 'XYZ');
    return { ...record, parent: toParent, position, quaternion, rotation, scale };
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const api = {
    partNames: [...registry.keys()],
    getPart(name) { return registry.get(name) || null; },
    getPartTransform(name) {
      const object = registry.get(name), record = base.get(name);
      if (!object || !record) return null;
      return {
        x: object.position.x - record.position.x,
        y: object.position.y - record.position.y,
        z: object.position.z - record.position.z,
        rx: object.rotation.x - record.rotation.x,
        ry: object.rotation.y - record.rotation.y,
        rz: object.rotation.z - record.rotation.z,
        sx: object.scale.x / (record.scale.x || 1),
        sy: object.scale.y / (record.scale.y || 1),
        sz: object.scale.z / (record.scale.z || 1),
      };
    },
    setPartTransform(name, transform = {}) {
      const object = registry.get(name), record = base.get(name);
      if (!object || !record) return false;
      const value = {
        x: clamp(transform.x, -100, 100), y: clamp(transform.y, -100, 100), z: clamp(transform.z, -100, 100),
        rx: clamp(transform.rx, -Math.PI, Math.PI), ry: clamp(transform.ry, -Math.PI, Math.PI), rz: clamp(transform.rz, -Math.PI, Math.PI),
        sx: clamp(transform.sx ?? 1, .02, 40), sy: clamp(transform.sy ?? 1, .02, 40), sz: clamp(transform.sz ?? 1, .02, 40),
      };
      object.position.copy(record.position).add(new THREE_NS.Vector3(value.x, value.y, value.z));
      object.rotation.set(record.rotation.x + value.rx, record.rotation.y + value.ry, record.rotation.z + value.rz, 'XYZ');
      object.scale.set(record.scale.x * value.sx, record.scale.y * value.sy, record.scale.z * value.sz);
      partTransforms[name] = value;
      return true;
    },
    resetPartTransform(name) {
      const object = registry.get(name), record = original.get(name);
      if (!object || !record) return false;
      if (object.parent !== record.parent) {
        object.parent?.remove(object);
        record.parent.add(object);
      }
      object.position.copy(record.position);
      object.quaternion.copy(record.quaternion);
      object.rotation.copy(record.rotation);
      object.scale.copy(record.scale);
      object.visible = record.visible;
      base.set(name, record);
      delete partTransforms[name];
      delete hiddenParts[name];
      const at = unlinkedParts.indexOf(name);
      if (at >= 0) unlinkedParts.splice(at, 1);
      return true;
    },
    setPartVisible(name, visible) {
      const object = registry.get(name);
      if (!object) return false;
      object.visible = !!visible;
      if (object.visible) delete hiddenParts[name];
      else hiddenParts[name] = true;
      return true;
    },
    detachPart(name) {
      const object = registry.get(name);
      if (!object || object.parent === unlinked) return false;
      const previousParent = object.parent;
      const previousBase = base.get(name);
      if (!previousParent || !previousBase) return false;
      root.updateMatrixWorld(true);
      unlinked.updateMatrixWorld(true);
      const world = object.matrixWorld.clone();
      const nextBase = convertTransformRecord(previousBase, previousParent, unlinked);
      previousParent.remove(object);
      unlinked.add(object);
      unlinked.updateMatrixWorld(true);
      unlinked.matrixWorld.clone().invert().multiply(world).decompose(object.position, object.quaternion, object.scale);
      base.set(name, nextBase);
      unlinkedParts.push(name);
      return true;
    },
    relinkPart(name) {
      const object = registry.get(name), record = original.get(name);
      if (!object || !record || object.parent !== unlinked) return false;
      root.updateMatrixWorld(true);
      const world = object.matrixWorld.clone();
      const nextBase = convertTransformRecord(base.get(name), unlinked, record.parent);
      record.parent.add(object);
      record.parent.updateWorldMatrix(true, false);
      record.parent.matrixWorld.clone().invert().multiply(world).decompose(object.position, object.quaternion, object.scale);
      base.set(name, nextBase);
      const at = unlinkedParts.indexOf(name);
      if (at >= 0) unlinkedParts.splice(at, 1);
      return true;
    },
    getShipState() {
      const transforms = Object.fromEntries([...registry.keys()]
        .map(name => [name, api.getPartTransform(name)])
        .filter(([, value]) => value && Object.values(value).some((v, i) => i < 6 ? Math.abs(v) > 1e-8 : Math.abs(v - 1) > 1e-8)));
      return { partTransforms: transforms, hiddenParts: { ...hiddenParts }, unlinkedParts: [...unlinkedParts] };
    },
    applyShipState(state = {}) {
      for (const name of state.unlinkedParts || []) api.detachPart(name);
      for (const [name, transform] of Object.entries(state.partTransforms || {})) api.setPartTransform(name, transform);
      for (const [name, hidden] of Object.entries(state.hiddenParts || {})) api.setPartVisible(name, !hidden);
      return true;
    },
  };

  root.userData.partNames = api.partNames;
  root.userData.getPart = api.getPart.bind(api);
  root.userData.getPartTransform = api.getPartTransform.bind(api);
  root.userData.setPartTransform = api.setPartTransform.bind(api);
  root.userData.resetPartTransform = api.resetPartTransform.bind(api);
  root.userData.setPartVisible = api.setPartVisible.bind(api);
  root.userData.detachPart = api.detachPart.bind(api);
  root.userData.relinkPart = api.relinkPart.bind(api);
  root.userData.getShipState = api.getShipState.bind(api);
  root.userData.applyShipState = api.applyShipState.bind(api);
  root.userData.setRudderAngle = () => false;
  root.userData.setSailTrim = () => false;
  root.userData.setMastLean = () => false;
  root.userData.setSailDeployment = () => false;
  root.userData.vehicle = {
    mode: 'boat',
    vesselType: asset.id,
    label: asset.label,
    dimensions: { ...asset.dimensions },
  };
  if (Object.keys(savedState.partTransforms || {}).length || Object.keys(savedState.hiddenParts || {}).length || (savedState.unlinkedParts || []).length) {
    api.applyShipState(savedState);
  }
  return root;
}

export async function loadImportedAsset(asset, localFiles = null) {
  if (localFiles) return loadLocalModelFiles(localFiles);
  const loaded = await asset.load();
  return { asset, root: createImportedVesselWrapper(THREE, asset, loaded) };
}

function normalizeImportPath(value) {
  const segments = [];
  for (const segment of String(value || '').replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') segments.pop();
    else segments.push(segment);
  }
  return segments.join('/');
}

export function createLocalAssetId(files, main, mainData) {
  const list = Array.from(files || []);
  const paths = list.map(file => normalizeImportPath(file.webkitRelativePath || file.name));
  const firstSegments = paths.map(path => path.split('/')[0]);
  const sharedRoot = paths.length > 1
    && firstSegments[0]
    && paths.every(path => path.includes('/') && path.startsWith(firstSegments[0] + '/'))
    ? firstSegments[0] + '/'
    : '';
  const canonical = path => sharedRoot && path.startsWith(sharedRoot) ? path.slice(sharedRoot.length) : path;
  const mainPath = canonical(normalizeImportPath(main.webkitRelativePath || main.name));
  const records = list.map((file, index) => ({
    path: canonical(paths[index]),
    size: Number(file.size) || 0,
  })).sort((a, b) => a.path.localeCompare(b.path));
  const metadata = new TextEncoder().encode(JSON.stringify({ main: mainPath, files: records }));
  const content = typeof mainData === 'string'
    ? new TextEncoder().encode(mainData)
    : new Uint8Array(mainData);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  const update = bytes => {
    for (let index = 0; index < bytes.length; index++) {
      const byte = bytes[index];
      first = Math.imul(first ^ byte, 0x01000193) >>> 0;
      second = Math.imul(second ^ (byte + (index & 255)), 0x85ebca6b) >>> 0;
    }
  };
  update(metadata);
  update(new Uint8Array([255]));
  update(content);
  const hex = value => value.toString(16).padStart(8, '0');
  return 'imported-local-' + hex(first) + hex(second);
}

export async function loadLocalModelFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) throw new Error('Choose a GLB file or a glTF folder with its texture and binary files.');
  const main = list.find(file => /\.glb$/i.test(file.name)) || list.find(file => /\.gltf$/i.test(file.name));
  if (!main) throw new Error('No .glb or .gltf model file was found in the selection.');

  const resources = [];
  const pathLookup = new Map();
  const basenameLookup = new Map();
  for (const file of list) {
    const relative = normalizeImportPath(file.webkitRelativePath || file.name);
    pathLookup.set(relative, file);
    if (basenameLookup.has(file.name)) basenameLookup.set(file.name, null);
    else basenameLookup.set(file.name, file);
  }
  const mainPath = normalizeImportPath(main.webkitRelativePath || main.name);
  const mainDirectory = mainPath.includes('/') ? mainPath.slice(0, mainPath.lastIndexOf('/') + 1) : '';
  const objectUrls = new Map();
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) return url;
    let decoded;
    try { decoded = decodeURIComponent(url); } catch { return url; }
    const resourcePath = decoded.split(/[?#]/, 1)[0].replace(/\\/g, '/');
    const candidates = [
      normalizeImportPath(mainDirectory + resourcePath),
      normalizeImportPath(resourcePath),
    ];
    let file = null;
    for (const candidate of candidates) {
      if (pathLookup.has(candidate)) {
        file = pathLookup.get(candidate);
        break;
      }
    }
    if (!file) file = basenameLookup.get(candidates[candidates.length - 1].split('/').pop()) || null;
    if (!file) return url;
    let objectUrl = objectUrls.get(file);
    if (!objectUrl) {
      objectUrl = URL.createObjectURL(file);
      objectUrls.set(file, objectUrl);
      resources.push(objectUrl);
    }
    return objectUrl;
  });
  const loader = new GLTFLoader(manager);
  try {
    const ext = main.name.toLowerCase().split('.').pop();
    const data = ext === 'glb' ? await main.arrayBuffer() : await main.text();
    const gltf = await loader.parseAsync(data, '');
    const localAsset = {
      id: createLocalAssetId(list, main, data),
      label: main.name.replace(/\.(glb|gltf)$/i, ''),
      category: 'Local import',
      license: 'User-supplied model; verify its licence before redistribution.',
      description: 'Locally imported glTF model. File materials and embedded textures are preserved where supported.',
      dimensions: { length: 0, beam: 0, height: 0, draft: null },
      sources: [],
    };
    const root = createImportedVesselWrapper(THREE, localAsset, { scene: gltf.scene, resources });
    return { asset: localAsset, root };
  } catch (error) {
    for (const url of resources) URL.revokeObjectURL(url);
    throw error;
  }
}

export function disposeImportedModel(root) {
  if (!root) return;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : (object.material ? [object.material] : []);
    for (const material of list) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
  for (const url of root.userData.importedResources || []) URL.revokeObjectURL(url);
  root.parent?.remove(root);
}
