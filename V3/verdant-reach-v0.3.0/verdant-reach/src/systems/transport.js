export class TransportSystem {
  constructor(saved = null) {
    this.mode = saved?.mode ?? null;
    this.vehicleId = saved?.vehicleId ?? null;
    this.distanceTravelled = saved?.distanceTravelled ?? 0;
    this.position = saved?.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.z)
      ? { x: saved.position.x, z: saved.position.z, y: Number.isFinite(saved.position.y) ? saved.position.y : 0 }
      : null;
  }

  get mounted() {
    return Boolean(this.mode);
  }

  mount(vehicle) {
    if (!vehicle || !['horse', 'cart', 'boat'].includes(vehicle.mode)) return false;
    this.mode = vehicle.mode;
    this.vehicleId = vehicle.id;
    return true;
  }

  setPosition(x, z, y = 0) {
    if (!this.mounted || !Number.isFinite(x) || !Number.isFinite(z)) return false;
    this.position = { x, z, y: Number.isFinite(y) ? y : 0 };
    return true;
  }

  dismount() {
    const previous = this.mode;
    this.mode = null;
    this.vehicleId = null;
    this.position = null;
    return previous;
  }

  movementProfile(running = false) {
    if (this.mode === 'horse') return { speed: running ? 35 : 25, staminaDrain: running ? 1.2 : 0, mode: 'horse' };
    if (this.mode === 'cart') return { speed: running ? 21 : 15, staminaDrain: running ? 0.6 : 0, mode: 'cart' };
    if (this.mode === 'boat') return { speed: running ? 25 : 19, staminaDrain: 0, mode: 'boat' };
    return { speed: running ? 22.5 : 13.2, staminaDrain: running ? 19 : 0, mode: null };
  }

  canTraverse(height, slope = 0) {
    if (this.mode === 'boat') return height < 1.8;
    if (height <= 0.55) return false;
    if (this.mode === 'horse') return slope < 1.2;
    if (this.mode === 'cart') return slope < 0.48;
    return true;
  }

  recordDistance(distance) {
    if (Number.isFinite(distance) && distance > 0) this.distanceTravelled += distance;
  }

  getSaveData() {
    return {
      mode: this.mode,
      vehicleId: this.vehicleId,
      distanceTravelled: this.distanceTravelled,
      position: this.position ? { ...this.position } : null,
    };
  }
}
