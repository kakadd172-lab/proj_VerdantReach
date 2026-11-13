import * as THREE from 'three';

export const SLOOP_V2_ROCKING_VERSION='0.1.0';

const DEGREES_TO_RADIANS=Math.PI/180;
const WORLD_UNITS_PER_METRE=4/3;
const clamp=(value,minimum,maximum)=>
 Math.max(minimum,Math.min(maximum,
  Number.isFinite(Number(value))?Number(value):minimum));

/**
 * Adds the Sloop V1 waterline-centred sea response to the independently
 * generated Maid of Endor (Sloop V2).
 *
 * V2 keeps its design waterline at y=0 and amidships at z=0, making the model
 * root the neutral pivot for the complete assembled vessel. The editor passes
 * wave controls through weather.sea.
 */
export function attachSloopV2Rocking(root){
 if(!root?.isObject3D){
  throw new TypeError('Sloop V2 rocking requires a Three.js Object3D root.');
 }
 const originalAnimateShip=root.userData.animateShip;
 if(typeof originalAnimateShip!=='function'){
  throw new TypeError('Sloop V2 rocking requires the standard ship animation API.');
 }
 if(root.userData.sloopV2Rocking)return root.userData.sloopV2Rocking;

 const basePosition=root.position.clone();
 const baseRotation=root.rotation.clone();
 const rotationOrder=root.rotation.order;
 const state={
  version:SLOOP_V2_ROCKING_VERSION,
  vesselId:'sloop-v2',
  pivot:'design-waterline-at-amidships',
  phase:0,
  seaBlend:0,
  waveHeightMeters:0,
  wavePeriodSeconds:6,
  waveDirectionDeg:90,
  rollRadians:0,
  pitchRadians:0,
  heaveWorldUnits:0,
  heaveMeters:0,
  enabled:false
 };

 // Preserve the existing preview telemetry contract and expose an explicit
 // V2 state handle for tests and future vessel-specific tools.
 root.userData.sloopV2Rocking=state;
 root.userData.sloopRocking=state;

 root.userData.animateShip=function animateSloopV2WithSea(deltaSeconds=.016,weather={}){
  const delta=clamp(deltaSeconds,0,.05);
  originalAnimateShip(delta,weather);

  const sea=weather?.sea??{};
  const enabled=sea.enabled===true;
  const suppliedHeight=enabled?clamp(sea.heightMeters,0,4):0;
  const suppliedPeriod=clamp(sea.periodSeconds??6,2,12);
  const suppliedDirection=((Number(sea.directionDeg??90)%360)+360)%360;

  if(enabled&&suppliedHeight>0){
   state.waveHeightMeters=suppliedHeight;
   state.wavePeriodSeconds=suppliedPeriod;
   state.waveDirectionDeg=suppliedDirection;
  }

  const blendTarget=enabled&&suppliedHeight>0?1:0;
  const blendRate=2.8;
  state.seaBlend+=(blendTarget-state.seaBlend)*(1-Math.exp(-delta*blendRate));
  state.enabled=blendTarget>0;

  // Continue the final wave through a damped fade-out rather than snapping
  // the hull back at an arbitrary point in its rocking cycle.
  if(state.seaBlend>1e-4&&state.waveHeightMeters>0){
   state.phase=(state.phase+delta*(2*Math.PI/state.wavePeriodSeconds))%(2*Math.PI);
  }

  const direction=state.waveDirectionDeg*DEGREES_TO_RADIANS;
  const sideApproach=Math.sin(direction);
  const headOnApproach=Math.cos(direction);
  const waveCycle=Math.sin(state.phase);

  const rollLimit=THREE.MathUtils.degToRad(Math.min(8,state.waveHeightMeters*2));
  const pitchLimit=THREE.MathUtils.degToRad(Math.min(3.6,state.waveHeightMeters*.9));
  const roll=rollLimit*sideApproach*waveCycle*state.seaBlend;
  const pitch=pitchLimit*headOnApproach*Math.sin(state.phase+.3)*state.seaBlend;
  const heave=state.waveHeightMeters*.12*WORLD_UNITS_PER_METRE
   *Math.sin(state.phase-.55)*state.seaBlend;

  state.rollRadians=roll;
  state.pitchRadians=pitch;
  state.heaveWorldUnits=heave;
  state.heaveMeters=heave/WORLD_UNITS_PER_METRE;

  // Apply motion at the root so hull, keel, rigging, sails and fittings rock
  // together around the V2 design waterline at amidships.
  root.position.copy(basePosition);
  root.position.y+=heave;
  root.rotation.set(
   baseRotation.x+pitch,
   baseRotation.y,
   baseRotation.z+roll,
   rotationOrder
  );
 };

 return state;
}
