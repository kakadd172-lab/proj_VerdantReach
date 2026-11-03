import * as THREE from 'three';

export class LightingRig {
  constructor(scene) {
    this.scene = scene;
    this.ambient = new THREE.HemisphereLight(0xb9d8e1, 0x4a4435, 0.78);
    this.sunLight = new THREE.DirectionalLight(0xffedcf, 1.05);
    this.sunLight.position.set(40, 100, 25);
    scene.add(this.ambient, this.sunLight, this.sunLight.target);
    scene.fog = new THREE.FogExp2(0x9bb9b8, 0.0038);
    this.fogNight = new THREE.Color(0x172534);
    this.fogDay = new THREE.Color(0xa9c7c3);
    this.tempColor = new THREE.Color();
  }

  update(camera, sunDirection, day) {
    this.sunLight.position.copy(camera.position).addScaledVector(sunDirection, 130);
    this.sunLight.target.position.copy(camera.position);
    this.sunLight.intensity = 0.12 + day * 1.1;
    this.ambient.intensity = 0.22 + day * 0.63;
    this.scene.fog.color.copy(this.tempColor.copy(this.fogNight).lerp(this.fogDay, day));
    this.scene.fog.density = 0.0042 - day * 0.00075;
  }

  dispose() {
    this.scene.remove(this.ambient, this.sunLight, this.sunLight.target);
  }
}
