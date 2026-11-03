import * as THREE from 'three';
import { isSolid } from '../world/blocks.js';

export class PlayerController {
  constructor(camera, domElement, world, settings = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;
    this.position = new THREE.Vector3(0, 45, 0); // feet position
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.radius = 0.29;
    this.height = 1.78;
    this.eyeHeight = 1.61;
    this.speed = 5.2;
    this.sprintSpeed = 8.0;
    this.jumpSpeed = 8.2;
    this.gravity = 22;
    this.onGround = false;
    this.pointerLocked = false;
    this.keys = new Set();
    this.sensitivity = settings.sensitivity ?? 0.12;
    this.fov = settings.fov ?? 78;
    this.lastBreak = 0;
    this.bindEvents();
    this.syncCamera();
  }

  bindEvents() {
    this.onKeyDown = (event) => {
      if (['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onMouseMove = (event) => {
      if (!this.pointerLocked) return;
      this.yaw -= event.movementX * this.sensitivity * 0.02;
      this.pitch -= event.movementY * this.sensitivity * 0.02;
      this.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, this.pitch));
      this.syncCamera();
    };
    this.onPointerChange = () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
      if (!this.pointerLocked) this.keys.clear();
      this.onLockChange?.(this.pointerLocked);
    };
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerChange);
    this.domElement.addEventListener('click', this.requestLock);
  }

  requestLock = () => {
    if (!this.pointerLocked && !this.pausedByUI) this.requestPointerCapture();
  };

  requestPointerCapture() {
    try {
      const request = this.domElement.requestPointerLock?.();
      if (request && typeof request.catch === 'function') {
        request.catch((error) => console.info('Click the world to enable mouse look.', error?.name || error));
      }
    } catch (error) {
      console.info('Click the world to enable mouse look.', error?.name || error);
    }
  }

  lock() {
    this.pausedByUI = false;
    this.requestPointerCapture();
  }

  unlock() {
    this.pausedByUI = true;
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.keys.clear();
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.syncCamera();
  }

  setLook(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.syncCamera();
  }

  setFov(value) {
    this.fov = value;
    this.camera.fov = value;
    this.camera.updateProjectionMatrix();
  }

  setSensitivity(value) { this.sensitivity = value; }

  syncCamera() {
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  collidesAt(x, y, z) {
    const minX = Math.floor(x - this.radius), maxX = Math.floor(x + this.radius);
    const minY = Math.floor(y + 0.001), maxY = Math.floor(y + this.height - 0.001);
    const minZ = Math.floor(z - this.radius), maxZ = Math.floor(z + this.radius);
    for (let by = minY; by <= maxY; by++) {
      for (let bz = minZ; bz <= maxZ; bz++) {
        for (let bx = minX; bx <= maxX; bx++) {
          if (isSolid(this.world.getBlock(bx, by, bz))) return true;
        }
      }
    }
    return false;
  }

  intersectsBlock(x, y, z) {
    return (this.position.x + this.radius > x && this.position.x - this.radius < x + 1 &&
      this.position.y + this.height > y && this.position.y < y + 1 &&
      this.position.z + this.radius > z && this.position.z - this.radius < z + 1);
  }

  moveAxis(axis, amount) {
    if (!amount) return;
    const next = this.position.clone();
    next[axis] += amount;
    if (!this.collidesAt(next.x, next.y, next.z)) {
      this.position[axis] = next[axis];
      return;
    }
    if (axis === 'y') {
      if (amount < 0) this.onGround = true;
      this.velocity.y = 0;
      return;
    }
    // Small step-up helps walking over isolated one-block terrain changes without tunnelling.
    const stepped = this.position.clone();
    stepped.y += 0.55;
    stepped[axis] += amount;
    if (!this.collidesAt(stepped.x, stepped.y, stepped.z)) {
      this.position.copy(stepped);
    } else {
      this.velocity[axis] = 0;
    }
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    const forward = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const strafe = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = sprint ? this.sprintSpeed : this.speed;
    const length = Math.hypot(forward, strafe) || 1;
    const f = forward / length, s = strafe / length;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // Match Three.js camera orientation: forward is (-sin(yaw), -cos(yaw))
    // and right is (cos(yaw), -sin(yaw)). This keeps W/A/S/D aligned
    // with the direction the player is actually looking.
    const targetX = (-sin * f + cos * s) * speed;
    const targetZ = (-cos * f - sin * s) * speed;
    const accel = this.onGround ? 17 : 6;
    this.velocity.x += (targetX - this.velocity.x) * Math.min(1, accel * dt);
    this.velocity.z += (targetZ - this.velocity.z) * Math.min(1, accel * dt);

    if (this.keys.has('Space') && this.onGround) {
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
    }
    this.velocity.y -= this.gravity * dt;
    this.onGround = false;

    this.moveAxis('x', this.velocity.x * dt);
    this.moveAxis('z', this.velocity.z * dt);
    this.moveAxis('y', this.velocity.y * dt);

    if (this.position.y < -8) {
      const spawn = this.world.sampleColumn(Math.floor(this.position.x), Math.floor(this.position.z));
      this.setPosition(this.position.x, spawn.height + 3, this.position.z);
      this.velocity.y = 0;
    }
    this.syncCamera();
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerChange);
    this.domElement.removeEventListener('click', this.requestLock);
    this.unlock();
  }
}
