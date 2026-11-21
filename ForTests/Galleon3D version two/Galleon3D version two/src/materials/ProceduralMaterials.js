import * as THREE from 'three';

/**
 * Generates procedural canvas textures and PBR materials for an Elizabethan galleon:
 * weathered oak, tarred wales, pitch-coated lower hull, deck planking, hemp rope,
 * aged iron, bronze/brass ordnance, gilded "E R" transom heraldry, and linen canvas.
 */
export class ProceduralMaterials {
  constructor(config) {
    this.config = config;
    this.textures = [];
    this.materials = new Map();
    this._buildAll();
  }

  _seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  _makeWoodTexture(baseHex, grainHex, plankLines = 8, seed = 101) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rand = this._seededRandom(seed);

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Organic wood grain streaks
    for (let i = 0; i < 420; i++) {
      const y = rand() * 512;
      const h = 1 + rand() * 2.5;
      ctx.fillStyle = grainHex;
      ctx.globalAlpha = 0.08 + rand() * 0.16;
      ctx.fillRect(0, y, 512, h);
    }

    // Plank seams
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = '#1b110a';
    ctx.lineWidth = 2;
    const step = 512 / plankLines;
    for (let p = 0; p < plankLines; p++) {
      const y = p * step;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Butt joints
      const jointX = ((p * 173 + 80) % 440) + 36;
      ctx.beginPath();
      ctx.moveTo(jointX, y);
      ctx.lineTo(jointX, y + step);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  _makeSailTexture(seed = 303) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const rand = this._seededRandom(seed);

    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle linen weave
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#d8c9aa' : '#f2ead9';
      ctx.globalAlpha = 0.12;
      ctx.fillRect(rand() * 512, rand() * 512, 16 + rand() * 28, 2);
    }

    // Vertical cloth bolt seams
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#9b8768';
    ctx.lineWidth = 2;
    for (let x = 64; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Horizontal reef bands
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#7c6a4e';
    ctx.lineWidth = 3;
    [160, 320].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  _makeTransomCrestTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep oak / crimson-ochre Elizabethan transom panel
    ctx.fillStyle = '#3b2416';
    ctx.fillRect(0, 0, 512, 256);

    // Decorative gold border & Tudor chevron trim
    ctx.strokeStyle = '#d4a23a';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 488, 232);

    // "E R" royal cipher (Elizabeth Regina) per Golden Hind blueprints
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 88px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', 135, 134);
    ctx.fillText('R', 377, 134);

    // Central Tudor shield / Golden Hind medallion
    ctx.fillStyle = '#8b1e1e';
    ctx.beginPath();
    ctx.arc(256, 128, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // Stylized gold cross/fleur inside shield
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(248, 92, 16, 72);
    ctx.fillRect(220, 120, 72, 16);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.push(tex);
    return tex;
  }

  _buildAll() {
    const oakTex = this._makeWoodTexture('#6e4b2e', '#3d2514', 10, this.config.seed);
    oakTex.repeat.set(3, 2);

    const deckTex = this._makeWoodTexture('#9b7a52', '#5c4429', 12, this.config.seed + 7);
    deckTex.repeat.set(4, 4);

    const darkTex = this._makeWoodTexture('#3a2618', '#1e120a', 6, this.config.seed + 13);
    darkTex.repeat.set(2, 2);

    const sailTex = this._makeSailTexture(this.config.seed + 29);
    const crestTex = this._makeTransomCrestTexture();

    this.materials.set(
      'weatheredOak',
      new THREE.MeshStandardMaterial({
        map: oakTex,
        roughness: 0.82,
        metalness: 0.04,
      })
    );

    this.materials.set(
      'deckPlank',
      new THREE.MeshStandardMaterial({
        map: deckTex,
        roughness: 0.86,
        metalness: 0.02,
      })
    );

    this.materials.set(
      'darkTimber',
      new THREE.MeshStandardMaterial({
        map: darkTex,
        roughness: 0.85,
        metalness: 0.05,
      })
    );

    this.materials.set(
      'tarredHull',
      new THREE.MeshStandardMaterial({
        color: 0x241912,
        roughness: 0.78,
        metalness: 0.06,
      })
    );

    this.materials.set(
      'sparWood',
      new THREE.MeshStandardMaterial({
        color: 0x8e6438,
        roughness: 0.74,
        metalness: 0.03,
      })
    );

    this.materials.set(
      'sailCanvas',
      new THREE.MeshStandardMaterial({
        map: sailTex,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
      })
    );

    this.materials.set(
      'hempRope',
      new THREE.MeshStandardMaterial({
        color: 0xa68b60,
        roughness: 0.92,
        metalness: 0.0,
      })
    );

    this.materials.set(
      'agedIron',
      new THREE.MeshStandardMaterial({
        color: 0x2d3238,
        roughness: 0.55,
        metalness: 0.72,
      })
    );

    this.materials.set(
      'bronzeCannon',
      new THREE.MeshStandardMaterial({
        color: 0x8f6b36,
        roughness: 0.38,
        metalness: 0.82,
      })
    );

    this.materials.set(
      'goldLeaf',
      new THREE.MeshStandardMaterial({
        color: 0xd9a431,
        roughness: 0.32,
        metalness: 0.85,
      })
    );

    this.materials.set(
      'crimsonTrim',
      new THREE.MeshStandardMaterial({
        color: 0x8b2323,
        roughness: 0.72,
        metalness: 0.06,
        side: THREE.DoubleSide,
      })
    );

    this.materials.set(
      'tudorGreen',
      new THREE.MeshStandardMaterial({
        color: 0x2b4c3b,
        roughness: 0.76,
        metalness: 0.05,
      })
    );

    this.materials.set(
      'transomCrest',
      new THREE.MeshStandardMaterial({
        map: crestTex,
        roughness: 0.65,
        metalness: 0.25,
      })
    );

    this.materials.set(
      'lanternGlass',
      new THREE.MeshStandardMaterial({
        color: 0xffd782,
        emissive: 0xff9a24,
        emissiveIntensity: 1.4,
        roughness: 0.2,
        metalness: 0.1,
      })
    );
  }

  get(name) {
    return this.materials.get(name) || this.materials.get('weatheredOak');
  }

  dispose() {
    this.materials.forEach((mat) => mat.dispose());
    this.textures.forEach((tex) => tex.dispose());
    this.materials.clear();
    this.textures = [];
  }
}
