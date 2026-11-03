import * as THREE from 'three';

function makeMaterial(color, roughness = 0.88, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, ...extra });
}

export class Player {
  constructor(scene, generator, x, z) {
    this.scene = scene;
    this.generator = generator;
    this.position = new THREE.Vector3(x, generator.heightAt(x, z), z);
    this.velocity = new THREE.Vector3();
    this.facing = 0;
    this.walkTime = 0;
    this.renderOriginX = 0;
    this.renderOriginZ = 0;
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this._buildAvatar();
    scene.add(this.group);
  }

  _buildAvatar() {
    const cloak = new THREE.Mesh(
      new THREE.ConeGeometry(0.67, 1.65, 7, 1, false),
      makeMaterial(0x35544d, 0.98, { flatShading: true }),
    );
    cloak.position.y = 0.96;
    cloak.rotation.x = Math.PI;
    cloak.scale.set(1, 0.78, 1);
    cloak.castShadow = true;
    this.group.add(cloak);

    const tunic = new THREE.Mesh(
      new THREE.CylinderGeometry(0.33, 0.46, 1.1, 7),
      makeMaterial(0x8c9a76, 0.9, { flatShading: true }),
    );
    tunic.position.y = 1.08;
    tunic.castShadow = true;
    this.group.add(tunic);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      makeMaterial(0xc99e79, 0.85),
    );
    head.position.y = 1.92;
    head.scale.set(0.86, 1, 0.9);
    head.castShadow = true;
    this.group.add(head);

    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.62),
      makeMaterial(0x243d3a, 0.94, { flatShading: true }),
    );
    hood.position.set(0, 2.02, -0.035);
    hood.scale.set(1.04, 1.03, 1.06);
    hood.castShadow = true;
    this.group.add(hood);

    const shoulderCape = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 8, 6),
      makeMaterial(0x496a5b, 0.95, { flatShading: true }),
    );
    shoulderCape.position.y = 1.51;
    shoulderCape.scale.set(1, 0.4, 0.82);
    shoulderCape.castShadow = true;
    this.group.add(shoulderCape);

    const belt = new THREE.Mesh(
      new THREE.TorusGeometry(0.37, 0.055, 5, 8),
      makeMaterial(0xb79558, 0.78, { metalness: 0.14 }),
    );
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.88;
    this.group.add(belt);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.64, 6), makeMaterial(0x333d39, 0.96));
    leftLeg.position.set(-0.2, 0.28, 0.02);
    leftLeg.castShadow = true;
    this.group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.2;
    this.group.add(rightLeg);
    this.legs = [leftLeg, rightLeg];

    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.025, 5, 44),
      new THREE.MeshBasicMaterial({ color: 0x91c8ab, transparent: true, opacity: 0.44 }),
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = 0.035;
    this.group.add(aura);
    this.aura = aura;

    const marker = new THREE.PointLight(0x8ccdb6, 0.7, 5, 2);
    marker.position.set(0, 2.2, 0);
    this.group.add(marker);
  }

  update(delta, input, camera, rpg, transport = null, weather = null) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const move = new THREE.Vector3();
    if (input.forward) move.add(forward);
    if (input.backward) move.sub(forward);
    if (input.right) move.add(right);
    if (input.left) move.sub(right);
    const moving = move.lengthSq() > 0.001;
    if (moving) move.normalize();

    const wantsRun = moving && input.run && rpg.stamina > 1 && transport?.mode !== 'boat';
    const profile = transport?.movementProfile(wantsRun) ?? { speed: wantsRun ? 22.5 : 13.2, staminaDrain: wantsRun ? 19 : 0, mode: null };
    const weatherPenalty = weather?.type === 'storm' ? 0.88 : weather?.type === 'snow' ? 0.92 : 1;
    const speed = profile.speed * weatherPenalty * (transport?.mode === 'horse' ? 1 : 1 + Math.min(0.12, ((rpg.skills?.endurance ?? 1) - 1) * 0.015));
    if (moving) {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, move.x * speed, 10, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, move.z * speed, 10, delta);
      this.facing = Math.atan2(move.x, move.z);
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 12, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 12, delta);
    }

    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const nextSample = this.generator.sample(nextX, nextZ, true);
    const nextGround = nextSample.height;
    const currentGround = this.generator.heightAt(this.position.x, this.position.z);
    const canTraverse = transport ? transport.canTraverse(nextGround, nextSample.slope) : (nextGround > 0.55 || currentGround < 0.55);
    if (canTraverse) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
    const ground = this.generator.heightAt(this.position.x, this.position.z);
    this.position.y = transport?.mode === 'boat' && ground < 1.8 ? -0.12 : ground;
    if (transport && moving) transport.recordDistance(Math.hypot(this.velocity.x, this.velocity.z) * delta);
    this.group.position.set(this.position.x - this.renderOriginX, this.position.y, this.position.z - this.renderOriginZ);
    const angleDelta = THREE.MathUtils.euclideanModulo(this.facing - this.group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    this.group.rotation.y += angleDelta * (1 - Math.exp(-12 * delta));

    if (profile.staminaDrain > 0) {
      const enduranceFactor = Math.max(0.68, 1 - ((rpg.skills?.endurance ?? 1) - 1) * 0.035);
      rpg.stamina = Math.max(0, rpg.stamina - profile.staminaDrain * delta * enduranceFactor * (weather?.type === 'storm' ? 1.2 : 1));
    }
    else rpg.stamina = Math.min(rpg.maxStamina, rpg.stamina + (transport?.mode === 'horse' ? 7 : 12) * delta);

    if (moving) {
      this.walkTime += delta * (wantsRun ? 12 : 8);
      const swing = Math.sin(this.walkTime) * (wantsRun ? 0.34 : 0.22);
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.group.position.y += Math.abs(Math.sin(this.walkTime * 2)) * 0.055;
    } else {
      this.legs[0].rotation.x = THREE.MathUtils.damp(this.legs[0].rotation.x, 0, 8, delta);
      this.legs[1].rotation.x = THREE.MathUtils.damp(this.legs[1].rotation.x, 0, 8, delta);
      this.walkTime += delta * 1.6;
      this.group.position.y += Math.sin(this.walkTime) * 0.018;
    }
    this.aura.rotation.z += delta * 0.16;
    this.aura.material.opacity = 0.34 + (Math.sin(this.walkTime * 0.75) + 1) * 0.07;
    return moving;
  }

  setRenderOrigin(x, z) {
    this.renderOriginX = x;
    this.renderOriginZ = z;
    this.group.position.set(this.position.x - x, this.position.y, this.position.z - z);
  }

  setPosition(x, z) {
    this.position.set(x, this.generator.heightAt(x, z), z);
    this.group.position.set(x - this.renderOriginX, this.position.y, z - this.renderOriginZ);
  }

  getSaveData() {
    return { x: this.position.x, z: this.position.z, facing: this.facing };
  }

  applySaveData(data) {
    if (!data) return;
    this.setPosition(Number(data.x) || 0, Number(data.z) || 0);
    this.facing = Number(data.facing) || 0;
    this.group.rotation.y = this.facing;
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    });
  }
}
