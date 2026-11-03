import * as THREE from 'three';
import { mulberry32, hashString } from '../core/random.js';

export class WeatherVisuals {
  constructor(scene, seed, count = 420) {
    this.scene = scene;
    this.count = count;
    this.type = 'clear';
    this.time = 0;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.rng = mulberry32(hashString(seed) ^ 0x71d3a);
    this.positions = new Float32Array(count * 3);
    this.speeds = new Float32Array(count);
    this.offsets = new Float32Array(count * 2);
    for (let i = 0; i < count; i += 1) {
      this.offsets[i * 2] = (this.rng() - 0.5) * 92;
      this.offsets[i * 2 + 1] = (this.rng() - 0.5) * 92;
      this.positions[i * 3] = this.offsets[i * 2];
      this.positions[i * 3 + 1] = this.rng() * 48;
      this.positions[i * 3 + 2] = this.offsets[i * 2 + 1];
      this.speeds[i] = 14 + this.rng() * 20;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.PointsMaterial({ color: 0xc6d6d4, size: 0.12, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
    this.group.visible = false;
  }

  setWeather(weather) {
    if (!weather || weather.type === this.type) return;
    this.type = weather.type;
    this.group.visible = ['rain', 'storm', 'snow'].includes(this.type);
    if (this.type === 'snow') {
      this.material.color.setHex(0xe5eee8);
      this.material.size = 0.22;
      this.material.opacity = 0.8;
    } else {
      this.material.color.setHex(this.type === 'storm' ? 0x9eafb6 : 0xb9c9cf);
      this.material.size = 0.11;
      this.material.opacity = this.type === 'storm' ? 0.72 : 0.48;
    }
    this.material.needsUpdate = true;
  }

  update(delta, playerLocalX, playerY, playerLocalZ, weather) {
    this.setWeather(weather);
    if (!this.group.visible) return;
    this.time += delta;
    const snow = this.type === 'snow';
    for (let i = 0; i < this.count; i += 1) {
      const k = i * 3;
      const fall = this.speeds[i] * delta * (snow ? 0.22 : 1);
      let y = this.positions[k + 1] - fall;
      if (y < -2) y = 38 + (i % 11) * 0.7;
      const drift = snow ? Math.sin(this.time * 0.55 + i) * delta * 1.8 : Math.cos(this.time * 0.3 + i) * delta * 0.25;
      this.positions[k] = this.offsets[i * 2] + drift;
      this.positions[k + 1] = y;
      this.positions[k + 2] = this.offsets[i * 2 + 1] + (snow ? Math.sin(this.time * 0.3 + i * 0.4) * 1.2 : 0);
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.group.position.set(playerLocalX, playerY, playerLocalZ);
    this.group.rotation.y = weather?.windAngle ?? 0;
  }

  dispose() {
    this.scene.remove(this.group);
    this.geometry.dispose();
    this.material.dispose();
  }
}
