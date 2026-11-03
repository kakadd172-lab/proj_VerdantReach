import * as THREE from 'three';

export class FieldTestCourse {
  constructor(scene, generator, layout, saved = null) {
    this.generator = generator;
    this.layout = layout;
    this.steps = layout.courseSteps.map((step) => ({ ...step }));
    this.completed = new Set(saved?.completed ?? []);
    this.root = new THREE.Group();
    this.scene = scene;
    this.scene.add(this.root);
    this.elapsed = 0;
    this.lastCurrentId = this.currentStep?.id ?? null;
    this.materials = {
      active: new THREE.MeshStandardMaterial({ color: 0xe3c77e, emissive: 0x6e5120, emissiveIntensity: 0.65, roughness: 0.42 }),
      pending: new THREE.MeshStandardMaterial({ color: 0x8da292, emissive: 0x203b32, emissiveIntensity: 0.14, roughness: 0.68 }),
      done: new THREE.MeshStandardMaterial({ color: 0x7db99a, emissive: 0x244a37, emissiveIntensity: 0.28, roughness: 0.56 }),
      ring: new THREE.MeshBasicMaterial({ color: 0xd8c58d, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    };
    this.geometry = {
      base: new THREE.CylinderGeometry(1.55, 1.95, 0.34, 12),
      pole: new THREE.CylinderGeometry(0.12, 0.2, 2.6, 8),
      orb: new THREE.OctahedronGeometry(0.58, 1),
      ring: new THREE.TorusGeometry(1.55, 0.055, 6, 28),
    };
    this.markers = new Map();
    for (const [index, step] of this.steps.entries()) this._createMarker(step, index);
    this._refreshMarkerStyles();
  }

  get currentIndex() {
    return this.steps.findIndex((step) => !this.completed.has(step.id));
  }

  get currentStep() {
    const index = this.currentIndex;
    return index >= 0 ? this.steps[index] : null;
  }

  get finished() {
    return this.currentIndex < 0;
  }

  _createMarker(step, index) {
    const group = new THREE.Group();
    const ground = this.generator.heightAt(step.x, step.z);
    const base = new THREE.Mesh(this.geometry.base, this.materials.pending);
    base.position.y = 0.18;
    base.castShadow = true;
    group.add(base);
    const pole = new THREE.Mesh(this.geometry.pole, this.materials.pending);
    pole.position.y = 1.62;
    pole.castShadow = true;
    group.add(pole);
    const orb = new THREE.Mesh(this.geometry.orb, this.materials.pending);
    orb.position.y = 3.12;
    orb.castShadow = true;
    group.add(orb);
    const ring = new THREE.Mesh(this.geometry.ring, this.materials.ring);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    group.add(ring);
    group.position.set(step.x, ground, step.z);
    group.userData = { stepId: step.id, orb, ring, base, pole, index };
    this.root.add(group);
    this.markers.set(step.id, group);
  }

  _refreshMarkerStyles() {
    const active = this.currentStep?.id;
    for (const [id, group] of this.markers) {
      const material = this.completed.has(id) ? this.materials.done : id === active ? this.materials.active : this.materials.pending;
      group.children[0].material = material;
      group.children[1].material = material;
      group.children[2].material = material;
      group.userData.ring.material = id === active ? this.materials.ring : this.materials.ring;
      group.visible = this.completed.has(id) || id === active || this.steps.findIndex((step) => step.id === id) <= this.currentIndex + 1;
    }
  }

  complete(id) {
    if (this.finished || this.currentStep?.id !== id) return { ok: false, reason: 'not-current' };
    this.completed.add(id);
    const next = this.currentStep;
    this._refreshMarkerStyles();
    return { ok: true, completed: id, next, finished: !next };
  }

  nearest(x, z, maxDistance = 6) {
    const step = this.currentStep;
    if (!step || step.trigger === 'visit') return null;
    const distance = Math.hypot(step.x - x, step.z - z);
    if (distance > maxDistance) return null;
    const object = this.markers.get(step.id);
    object.userData.interactable = { type: 'field-test-course', id: step.id, label: step.title };
    return { object, distance, step };
  }

  update(delta, x, z, originX = 0, originZ = 0) {
    this.elapsed += delta;
    this.root.position.set(-originX, 0, -originZ);
    const step = this.currentStep;
    if (step?.trigger === 'visit' && Math.hypot(step.x - x, step.z - z) <= 10) {
      this.complete(step.id);
      return { advanced: true, completed: step.id, next: this.currentStep };
    }
    const active = step ? this.markers.get(step.id) : null;
    if (active) {
      active.userData.orb.rotation.y += delta * 0.8;
      active.userData.orb.position.y = 3.12 + Math.sin(this.elapsed * 2.2) * 0.18;
      active.userData.ring.rotation.z += delta * 0.24;
    }
    return null;
  }

  getSaveData() {
    return { version: 1, completed: [...this.completed] };
  }

  dispose() {
    this.scene.remove(this.root);
    for (const geometry of Object.values(this.geometry)) geometry.dispose();
    for (const material of Object.values(this.materials)) material.dispose();
    this.markers.clear();
  }
}
