import { createShipContext, finishShipModel, disposeShipModel } from '../../core/ship-editor-kit.js';
import { CANNON_PROFILES, CANNON_PROFILE_VERSION, getCannonProfile } from './profiles/cannon-profiles.js';
import { assembleCannon, CANNON_ASSEMBLY_ORDER } from './assembly/cannon-assembly.js';

export const CANNON_GENERATOR_VERSION = '0.1.0';
export { CANNON_PROFILES, CANNON_PROFILE_VERSION, CANNON_ASSEMBLY_ORDER, getCannonProfile };
export const CANNON_PART_NAMES = Object.freeze([
 'barrel-body','muzzle-face','muzzle-band','chase-band','reinforce-band-forward',
 'reinforce-band-aft','breech-band','trunnion-port','trunnion-starboard','cascabel',
 'carriage-cheek-port','carriage-cheek-starboard','carriage-bed','carriage-transom-fore',
 'carriage-transom-aft','carriage-axle-fore','carriage-axle-aft','wheel-port-fore',
 'wheel-port-aft','wheel-starboard-fore','wheel-starboard-aft',
 'carriage-hardware-port','carriage-hardware-starboard','carriage-breech-support'
]);

const WORLD_UNITS_PER_METRE = 4/3;
function resolveDimensions(profile, options={}) {
 const factor = Number.isFinite(options.worldUnitsPerMetre) && options.worldUnitsPerMetre>0
  ? options.worldUnitsPerMetre : WORLD_UNITS_PER_METRE;
 const barrelLength=profile.barrelLengthMetres*factor;
 const bodyRadius=profile.bodyRadiusMetres*factor;
 const wheelRadius=profile.wheelRadiusMetres*factor;
 const carriageWidth=profile.carriageWidthMetres*factor;
 const carriageLength=barrelLength*profile.carriageLengthFactor;
 return {
  profileId:profile.id,calibreMm:profile.calibreMm,
  barrelLength,bodyRadius,muzzleRadiusFactor:profile.muzzleRadiusFactor,
  breechRadiusFactor:profile.breechRadiusFactor,wheelRadius,carriageWidth,carriageLength,
  barrelCenterY:wheelRadius+bodyRadius*2.05,
  worldUnitsPerMetre:factor
 };
}
function makeCannonVessel(profile, dimensions) {
 return {
  editorModulePath:'src/world/ships/vessels/cannons/index.js',
  gameDefinitionPath:'src/world/ships/vessels/cannons/index.js',
  editorDefaults:{componentState:{}},
  design:{
   id:'cannon-'+profile.id,label:profile.label,
   hullLength:profile.barrelLengthMetres,beam:profile.carriageWidthMetres,
   draft:profile.wheelRadiusMetres,freeboard:profile.bodyRadiusMetres*2,
   hullLengthUnits:dimensions.barrelLength,beamUnits:dimensions.carriageWidth,
   draftUnits:dimensions.wheelRadius,deckHeightUnits:dimensions.bodyRadius*2,
   lengthBeamRatio:profile.barrelLengthMetres/profile.carriageWidthMetres,
   rig:'Non-functional static display model',
   era:'Historical blueprint-inspired visual reconstruction',
   reference:'Supplied 36-, 18- and 9-pounder barrel elevation and naval carriage assembly drawings.',
   sources:[],masts:[],partNames:[...CANNON_PART_NAMES]
  },
  structure:{frameCount:12}
 };
}
export function createCannonModel(profileId='18-pounder', componentTransforms={}, savedState={}, options={}) {
 const profile=getCannonProfile(profileId);
 if(!profile) throw new Error('Unknown cannon display profile: '+String(profileId));
 const dimensions=resolveDimensions(profile,options);
 const vessel=makeCannonVessel(profile,dimensions);
 const palette={hull:0x4c3425,lower:0x302a24,plank:0x65452e,deck:0x79583a,trim:0x32271f,iron:0x434849,brass:0x795b3b};
 const ctx=createShipContext(vessel,palette);
 assembleCannon(ctx,dimensions);
 const root=finishShipModel(ctx,componentTransforms,savedState);
 root.name='Verdant Reach · '+profile.label;
 root.userData.shipType='cannon';root.userData.cannonId=profile.id;
 root.userData.cannonProfile={...profile};root.userData.cannonDimensions={...dimensions};
 root.userData.cannonNonFunctionalVisualOnly=true;root.userData.muzzleSealed=true;root.userData.firingMechanism=false;
 root.userData.cannonAssemblyOrder=[...CANNON_ASSEMBLY_ORDER];
 root.userData.cannonComponentNames=[...ctx.registry.keys()];root.userData.partNames=[...ctx.registry.keys()];
 root.userData.dispose=()=>disposeShipModel(root);
 return root;
}
export function generateCannon(profileId='18-pounder',componentTransforms={},savedState={},options={}) {
 return createCannonModel(profileId,componentTransforms,savedState,options);
}
