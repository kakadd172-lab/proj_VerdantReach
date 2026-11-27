import * as THREE from 'three';

export class ProceduralMaterials {
  constructor(config) {
    this.config = config;
    this.textures = [];
    this.materials = new Map();
    this._buildAll();
  }
  _rand(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  _woodTex(baseHex, grainHex, lines, seed) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d'), rand = this._rand(seed);
    ctx.fillStyle = baseHex; ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = grainHex; ctx.globalAlpha = 0.08 + rand() * 0.14;
      ctx.fillRect(0, rand() * 256, 256, 1 + rand() * 2);
    }
    ctx.globalAlpha = 0.45; ctx.strokeStyle = '#1b110a'; ctx.lineWidth = 1.5;
    const step = 256 / lines;
    for (let p = 0; p < lines; p++) {
      const y = p * step;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }
  _sailTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ebe0ca'; ctx.fillRect(0, 0, 256, 256);
    // Vertical cloth seams
    ctx.globalAlpha = 0.34; ctx.strokeStyle = '#8c7758'; ctx.lineWidth = 1.5;
    for (let x = 32; x < 256; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
    }
    // Horizontal reef bands
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#6e5c42'; ctx.lineWidth = 2.5;
    [85, 170].forEach((y) => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }
  _transomTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3b2416'; ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = '#d4a23a'; ctx.lineWidth = 5; ctx.strokeRect(6, 6, 244, 116);
    ctx.fillStyle = '#eab308'; ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('E', 68, 66); ctx.fillText('R', 188, 66);
    ctx.fillStyle = '#8b1e1e'; ctx.beginPath(); ctx.arc(128, 64, 27, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fbbf24'; ctx.stroke();
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(124, 46, 8, 36); ctx.fillRect(110, 60, 36, 8);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }
  _buildAll() {
    const oakTex = this._woodTex('#754f30', '#3d2514', 8, 1575); oakTex.repeat.set(3, 2);
    const deckTex = this._woodTex('#a38258', '#5c4429', 10, 1582); deckTex.repeat.set(4, 4);
    const darkTex = this._woodTex('#3c2819', '#1e120a', 6, 1588); darkTex.repeat.set(2, 2);
    this.materials.set('weatheredOak', new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.80, metalness: 0.04, side: THREE.DoubleSide }));
    this.materials.set('deckPlank', new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide }));
    this.materials.set('darkTimber', new THREE.MeshStandardMaterial({ map: darkTex, roughness: 0.84, metalness: 0.05, side: THREE.DoubleSide }));
    this.materials.set('tarredHull', new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.76, metalness: 0.06, side: THREE.DoubleSide }));
    this.materials.set('sparWood', new THREE.MeshStandardMaterial({ color: 0x94683b, roughness: 0.72, metalness: 0.03 }));
    this.materials.set('sailCanvas', new THREE.MeshStandardMaterial({ map: this._sailTex(), roughness: 0.88, side: THREE.DoubleSide }));
    this.materials.set('hempRope', new THREE.MeshStandardMaterial({ color: 0xa68b60, roughness: 0.92 }));
    this.materials.set('agedIron', new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.42, metalness: 0.45 }));
    this.materials.set('bronzeCannon', new THREE.MeshStandardMaterial({ color: 0x997338, roughness: 0.36, metalness: 0.82 }));
    this.materials.set('goldLeaf', new THREE.MeshStandardMaterial({ color: 0xd9a431, roughness: 0.30, metalness: 0.85 }));
    this.materials.set('crimsonTrim', new THREE.MeshStandardMaterial({ color: 0x8f2424, roughness: 0.70, side: THREE.DoubleSide }));
    this.materials.set('transomCrest', new THREE.MeshStandardMaterial({ map: this._transomTex(), roughness: 0.62, metalness: 0.25 }));
    this.materials.set('lanternGlass', new THREE.MeshStandardMaterial({ color: 0xffd782, emissive: 0xff9a24, emissiveIntensity: 1.4, roughness: 0.2 }));
    this.materials.set('cabinGlass', new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xf59e0b, emissiveIntensity: 0.55, roughness: 0.22, metalness: 0.15 }));
  }
  get(n) { return this.materials.get(n) || this.materials.get('weatheredOak'); }
  setWireframe(enabled) {
    this.materials.forEach((m) => { m.wireframe = enabled; });
  }
  dispose() {
    this.materials.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
    this.materials.clear(); this.textures = [];
  }
}
