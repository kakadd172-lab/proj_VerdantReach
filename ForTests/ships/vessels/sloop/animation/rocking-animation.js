import * as THREE from 'three';

export const SLOOP_ROCKING_VERSION = '0.1.0';

const DEGREES_TO_RADIANS = Math.PI / 180;
const WORLD_UNITS_PER_METRE = 4 / 3;
const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(maximum, Number.isFinite(Number(value)) ? Number(value) : minimum));

/**
 * Adds a waterline-centred sea response to the Sloop only.
 *
 * The vessel generators place the design waterline at y=0 and amidships at
 * z=0. The model root is therefore the correct neutral pivot: the entire
 * hull, rig, sails, fittings and editor components rock as one rigid vessel.
 *
 * Wave height is specified crest-to-trough in metres by the preview controls.
 * Motion is deliberately restrained and damped; it is a testable first-pass
 * response model, not a full hydrodynamic or stability simulation.
 */
export function attachSloopRocking(root) {
  if (!root?.isObject3D) {
    throw new TypeError('Sloop rocking requires a Three.js Object3D root.');
  }

  const originalAnimateShip = root.userData.animateShip;
  if (typeof originalAnimateShip !== 'function') {
    throw new TypeError('Sloop rocking requires the standard ship animation API.');
  }
  if (root.userData.sloopRocking) return root.userData.sloopRocking;

  const basePosition = root.position.clone();
  const baseRotation = root.rotation.clone();
  const rotationOrder = root.rotation.order;

  const state = {
    version: SLOOP_ROCKING_VERSION,
    pivot: 'design-waterline-at-amidships',
    phase: 0,
    seaBlend: 0,
    waveHeightMeters: 0,
    wavePeriodSeconds: 6,
    waveDirectionDeg: 90,
    rollRadians: 0,
    pitchRadians: 0,
    heaveWorldUnits: 0,
    heaveMeters: 0,
    enabled: false
  };

  root.userData.sloopRocking = state;
  root.userData.animateShip = function animateSloopWithSea(deltaSeconds = 0.016, weather = {}) {
    const delta = clamp(deltaSeconds, 0, 0.05);
    originalAnimateShip(delta, weather);

    const sea = weather?.sea ?? {};
    const enabled = sea.enabled === true;
    const suppliedHeight = enabled ? clamp(sea.heightMeters, 0, 4) : 0;
    const suppliedPeriod = clamp(sea.periodSeconds ?? 6, 2, 12);
    const suppliedDirection = ((Number(sea.directionDeg ?? 90) % 360) + 360) % 360;

    if (enabled && suppliedHeight > 0) {
      state.waveHeightMeters = suppliedHeight;
      state.wavePeriodSeconds = suppliedPeriod;
      state.waveDirectionDeg = suppliedDirection;
    }

    const blendTarget = enabled && suppliedHeight > 0 ? 1 : 0;
    const blendRate = 2.8;
    state.seaBlend += (blendTarget - state.seaBlend) * (1 - Math.exp(-delta * blendRate));
    state.enabled = blendTarget > 0;

    // Keep the last wave moving during the gentle fade-out after sea conditions
    // are disabled. This prevents the hull from snapping back at an arbitrary
    // point in its rocking cycle.
    if (state.seaBlend > 1e-4 && state.waveHeightMeters > 0) {
      state.phase = (state.phase + delta * (2 * Math.PI / state.wavePeriodSeconds)) % (2 * Math.PI);
    }

    const direction = state.waveDirectionDeg * DEGREES_TO_RADIANS;
    const sideApproach = Math.sin(direction);
    const headOnApproach = Math.cos(direction);
    const waveCycle = Math.sin(state.phase);

    // A moderate 1.5 m sea yields about 3° peak roll or 1.35° peak pitch.
    // Hard limits prevent the preview from showing implausible exaggerated motion.
    const rollLimit = THREE.MathUtils.degToRad(Math.min(8, state.waveHeightMeters * 2));
    const pitchLimit = THREE.MathUtils.degToRad(Math.min(3.6, state.waveHeightMeters * 0.9));
    const roll = rollLimit * sideApproach * waveCycle * state.seaBlend;
    const pitch = pitchLimit * headOnApproach * Math.sin(state.phase + 0.3) * state.seaBlend;
    const heave = state.waveHeightMeters * 0.12 * WORLD_UNITS_PER_METRE
      * Math.sin(state.phase - 0.55) * state.seaBlend;

    state.rollRadians = roll;
    state.pitchRadians = pitch;
    state.heaveWorldUnits = heave;
    state.heaveMeters = heave / WORLD_UNITS_PER_METRE;

    // Root origin is the design waterline at amidships (0, 0, 0), so applying
    // pitch/roll here rocks the complete vessel about a useful buoyancy centre.
    root.position.copy(basePosition);
    root.position.y += heave;
    root.rotation.set(
      baseRotation.x + pitch,
      baseRotation.y,
      baseRotation.z + roll,
      rotationOrder
    );
  };

  return state;
}
