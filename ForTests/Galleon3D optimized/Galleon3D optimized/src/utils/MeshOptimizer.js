import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Merges static THREE.Mesh instances inside a group by material so a single
 * galleon drops from ~500+ draw calls down to ~15-20 draw calls for game use.
 */
export class MeshOptimizer {
  static optimizeStaticGroup(group, excludeObjects = []) {
    const excluded = new Set(excludeObjects.filter(Boolean));
    const isExcluded = (obj) => {
      let cur = obj;
      while (cur) {
        if (excluded.has(cur)) return true;
        cur = cur.parent;
      }
      return false;
    };

    group.updateMatrixWorld(true);
    const rootInv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    const buckets = new Map();
    const toRemove = [];

    group.traverse((child) => {
      if (!child.isMesh || isExcluded(child) || Array.isArray(child.material)) return;
      const mat = child.material;
      let geo = child.geometry.clone();
      if (geo.index) geo = geo.toNonIndexed();
      if (!geo.attributes.normal) geo.computeVertexNormals();
      if (!geo.attributes.uv) {
        const count = geo.attributes.position.count;
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
      }
      const hasColor = Boolean(geo.attributes.color);
      for (const attr of Object.keys(geo.attributes)) {
        if (attr !== 'position' && attr !== 'normal' && attr !== 'uv' && !(hasColor && attr === 'color')) {
          geo.deleteAttribute(attr);
        }
      }
      const relMat = new THREE.Matrix4().multiplyMatrices(rootInv, child.matrixWorld);
      geo.applyMatrix4(relMat);

      const key = `${mat.uuid}_${hasColor ? 'c' : 'n'}`;
      if (!buckets.has(key)) buckets.set(key, { mat, geos: [], castShadow: child.castShadow, receiveShadow: child.receiveShadow });
      const b = buckets.get(key);
      b.geos.push(geo);
      b.castShadow = b.castShadow || child.castShadow;
      b.receiveShadow = b.receiveShadow || child.receiveShadow;
      toRemove.push(child);
    });

    toRemove.forEach((m) => {
      if (m.parent) m.parent.remove(m);
      if (m.geometry) m.geometry.dispose();
    });

    let mergedCount = 0;
    buckets.forEach(({ mat, geos, castShadow, receiveShadow }) => {
      if (!geos.length) return;
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.name = `MergedStatic_${mat.name || mergedCount}`;
      group.add(mesh);
      mergedCount++;
    });

    return { removedMeshes: toRemove.length, mergedDrawCalls: mergedCount };
  }
}
