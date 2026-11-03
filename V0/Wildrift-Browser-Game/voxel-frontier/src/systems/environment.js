import * as THREE from 'three';
import { LightingRig } from './lighting.js';

const vertexShader = `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uSunDirection;
  uniform float uDay;
  varying vec3 vDirection;
  void main() {
    vec3 dir = normalize(vDirection);
    float horizon = smoothstep(-0.18, 0.82, dir.y);
    vec3 dayZenith = vec3(0.16, 0.39, 0.57);
    vec3 dayHorizon = vec3(0.70, 0.81, 0.77);
    vec3 nightZenith = vec3(0.012, 0.025, 0.065);
    vec3 nightHorizon = vec3(0.055, 0.105, 0.15);
    vec3 dayColor = mix(dayHorizon, dayZenith, horizon);
    vec3 nightColor = mix(nightHorizon, nightZenith, horizon);
    vec3 color = mix(nightColor, dayColor, uDay);
    float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
    float sunDisk = pow(sunDot, 650.0);
    float sunGlow = pow(sunDot, 13.0) * 0.18;
    color += vec3(1.0, 0.76, 0.48) * (sunDisk * 1.2 + sunGlow) * uDay;
    float stars = smoothstep(0.9975, 1.0, sin(dir.x * 911.0 + dir.y * 127.0) * sin(dir.z * 631.0 + dir.x * 317.0));
    color += vec3(0.55, 0.68, 0.82) * stars * (1.0 - uDay) * (1.0 - horizon);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.29;
    this.sunDirection = new THREE.Vector3();
    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: { uSunDirection: { value: new THREE.Vector3(0, 1, 0) }, uDay: { value: 1 } },
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 20), this.skyMaterial);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    scene.add(this.sky);

    this.sun = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(5.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xc8d8e8 }));
    scene.add(this.sun, this.moon);

    this.lighting = new LightingRig(scene);
  }

  update(delta, camera) {
    this.time = (this.time + delta / 360) % 1;
    const angle = this.time * Math.PI * 2 - Math.PI / 2;
    this.sunDirection.set(Math.cos(angle), Math.sin(angle), 0.22).normalize();
    const day = THREE.MathUtils.smoothstep(this.sunDirection.y, -0.22, 0.2);
    this.skyMaterial.uniforms.uSunDirection.value.copy(this.sunDirection);
    this.skyMaterial.uniforms.uDay.value = day;
    this.sky.position.copy(camera.position);
    this.sun.position.copy(camera.position).addScaledVector(this.sunDirection, 470);
    this.moon.position.copy(camera.position).addScaledVector(this.sunDirection, -430);
    this.sun.visible = day > 0.03;
    this.moon.visible = day < 0.25;
    this.lighting.update(camera, this.sunDirection, day);
  }

  dispose() {
    this.sky.geometry.dispose();
    this.skyMaterial.dispose();
    this.sun.geometry.dispose();
    this.sun.material.dispose();
    this.moon.geometry.dispose();
    this.moon.material.dispose();
    this.lighting.dispose();
  }
}
