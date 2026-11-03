import { getShipDesign, WORLD_UNITS_PER_METRE } from '../world/ship-designs.js';

export class TransportSystem {
  constructor(saved = null) {
    this.mode = saved?.mode ?? null;
    this.vehicleId = saved?.vehicleId ?? null;
    this.vesselType = saved?.vesselType ?? null;
    this.deckHeight = Number.isFinite(saved?.deckHeight) ? saved.deckHeight : 0.45;
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
    this.vesselType = vehicle.mode === 'boat' ? (vehicle.vesselType ?? null) : null;
    this.deckHeight = vehicle.mode === 'boat' ? (Number.isFinite(vehicle.deckHeight) ? vehicle.deckHeight : (this.vesselType ? 1.55 : 0.45)) : 0;
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
    this.vesselType = null;
    this.deckHeight = 0.45;
    this.position = null;
    return previous;
  }

  movementProfile(running = false) {
    if (this.mode === 'horse') return { speed: running ? 35 : 25, staminaDrain: running ? 1.2 : 0, mode: 'horse' };
    if (this.mode === 'cart') return { speed: running ? 21 : 15, staminaDrain: running ? 0.6 : 0, mode: 'cart' };
    if (this.mode === 'boat') {
      const design = getShipDesign(this.vesselType);
      const cruise = design
        ? design.sailingSpeed * 0.514444 * WORLD_UNITS_PER_METRE * 3
        : 16.5;
      return {
        speed: running ? cruise * 1.05 : cruise,
        staminaDrain: 0,
        mode: 'boat',
        vesselType: this.vesselType,
        turnRate: design?.handling ?? 1.05,
        acceleration: design ? 0.7 + design.handling * 1.35 : 1.8,
        draft: design?.draftUnits ?? 1,
        hullLength: design?.hullLengthUnits ?? 8,
        beam: design?.beamUnits ?? 3,
      };
    }
    return { speed: running ? 22.5 : 13.2, staminaDrain: running ? 19 : 0, mode: null };
  }

  canTraverse(height, slope = 0) {
    if (this.mode === 'boat') return this.vesselType ? height < 0.55 : height < 1.8;
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
      vesselType: this.vesselType,
      deckHeight: this.deckHeight,
      distanceTravelled: this.distanceTravelled,
      position: this.position ? { ...this.position } : null,
    };
  }
}
