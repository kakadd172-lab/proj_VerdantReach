/**
 * Common APIs for independent ForTests ship definitions.
 * No vessel catalogue is stored here; the definitions live in vessels/<id>.js.
 */
export const SHIP_CATALOGUE_VERSION='0.8.9';
export const SHIP_DESIGN_MODULE_VERSION=SHIP_CATALOGUE_VERSION;
export const SHIP_STRUCTURE_MODULE_VERSION=SHIP_CATALOGUE_VERSION;
export const WORLD_UNITS_PER_METRE=4/3;
export const SHIP_PART_BASE_NAMES=Object.freeze([
'hull','hull-strakes','deck','deck-planks','keel','stem','sternworks','stern-gallery','stern-windows',
'bowworks','bowsprit','rudder','helm','helm-wheel','anchors','anchor-port','anchor-starboard',
'anchor-chain-port','anchor-chain-starboard','railings','railings-port','railings-starboard','head-sails','deck-fittings']);
const designOverrides=new Map(),structureOverrides=new Map();
const clone=value=>value==null?value:structuredClone(value);
function deepFreeze(value,seen=new WeakSet()){
 if(!value||typeof value!=='object'||seen.has(value))return value;
 seen.add(value);Object.values(value).forEach(child=>deepFreeze(child,seen));return Object.freeze(value);
}
function mergeData(base,patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))return base;
 const out={...base};
 for(const [key,value] of Object.entries(patch)){
  if(value===undefined)continue;
  if(value&&typeof value==='object'&&!Array.isArray(value))out[key]=mergeData(base[key]&&typeof base[key]==='object'&&!Array.isArray(base[key])?base[key]:{},value);
  else out[key]=Array.isArray(value)?clone(value):value;
 }
 return out;
}
function prepareDesign(data,structure){
 const frames=Array.from({length:structure.frameCount},(_,i)=>'frame-'+String(i+1).padStart(2,'0'));
 const masts=data.masts.flatMap(mast=>{
  const id=mast.id,names=['mast-'+id,'mast-lower-'+id,'mast-topmast-'+id,'mast-step-'+id,'running-rigging-'+id];
  if(mast.rig==='junk'){names.push('junk-yard-'+id,'junk-battens-'+id,'junk-sheets-'+id,'sail-'+id+'-junk','cloth-sail-'+id+'-junk');for(let i=1;i<=7;i++)names.push('batten-'+id+'-'+i);return names;}
  names.push('standing-rigging-'+id,'shrouds-'+id,'ratlines-'+id,'mast-stays-'+id);
  if(mast.runningBraces!==false)names.push('running-braces-'+id);
  if(mast.rig==='square'||mast.rig==='brigantine')names.push('mast-platform-'+id);
  if(mast.rig==='square'){['course','topsail','topgallant'].slice(0,mast.squares??2).forEach(level=>names.push('yard-'+id+'-'+level,'sail-'+id+'-'+level,'cloth-sail-'+id+'-'+level,'sheets-'+id+'-'+level));if(mast.spanker)names.push('gaff-spar-'+id,'boom-'+id,'sail-'+id+'-spanker','cloth-sail-'+id+'-spanker');}
  else if(mast.rig==='brigantine')names.push('gaff-spar-'+id,'boom-'+id,'sail-'+id+'-gaff','cloth-sail-'+id+'-gaff','yard-'+id+'-topsail','sail-'+id+'-topsail','cloth-sail-'+id+'-topsail','sheets-'+id+'-topsail');
  else if(mast.rig==='lateen')names.push('lateen-yard-'+id,'sail-'+id+'-lateen','cloth-sail-'+id+'-lateen');
  else {const type=mast.rig==='trysail'?'trysail':'gaff';names.push('gaff-spar-'+id,'boom-'+id,'sail-'+id+'-'+type,'cloth-sail-'+id+'-'+type);}
  return names;
 });
 const heads=Array.from({length:Math.max(0,data.headsails??0)},(_,i)=>['sail-head-'+(i+1),'cloth-sail-head-'+(i+1)]).flat();
 const stern=Array.from({length:data.sternTiers.length},(_,i)=>'stern-tier-'+(i+1));
 const editorParts=Array.isArray(data.editorPartNames)
  ?data.editorPartNames.filter(name=>typeof name==='string'&&name.length>0&&!SHIP_PART_BASE_NAMES.includes(name))
  :[];
 const partNames=[...new Set([...SHIP_PART_BASE_NAMES,...frames,...stern,...(data.oars?['oars']:[]),...heads,...masts,...editorParts])];
 return deepFreeze({...data,structure,mastCount:data.primaryMastCount??data.masts.filter(m=>!m.auxiliary).length,
 totalMastSpars:data.masts.length,mastHeights:data.masts.map(m=>m.height),lengthBeamRatio:data.hullLength/data.beam,
 hullLengthUnits:data.hullLength*WORLD_UNITS_PER_METRE,beamUnits:data.beam*WORLD_UNITS_PER_METRE,
 draftUnits:data.draft*WORLD_UNITS_PER_METRE,deckHeightUnits:data.freeboard*WORLD_UNITS_PER_METRE,
 partNames,
 modelScaleNote:data.modelScaleNote??'Dimensions are historical reference values where stated; rig heights and unrecorded details are reconstruction estimates.',
 hullFormNote:data.hullFormNote??'Original parametric hull loft informed by the cited vessel type; not a traced CAD or surviving lines plan.'});
}
export function defineVesselSpec(value,editorDefaults={}){
 if(!value||typeof value.id!=='string'||!value.id)throw new TypeError('Vessel id is required.');
 if(value.design?.id!==value.id)throw new TypeError('Vessel design id must match '+value.id+'.');
 if(!Number.isFinite(value.structure?.frameCount))throw new TypeError('Vessel '+value.id+' requires a frame count.');
 if(!Array.isArray(value.design?.masts)||!value.design.masts.length)throw new TypeError('Vessel '+value.id+' requires mast definitions.');
 if(!Array.isArray(value.design?.sternTiers))throw new TypeError('Vessel '+value.id+' requires a stern profile.');
 if(!value.design.keelDetails||!value.design.rudderDetails)throw new TypeError('Vessel '+value.id+' requires keel and rudder details.');
 return deepFreeze({id:value.id,design:clone(value.design),structure:clone(value.structure),
 editorModulePath:value.editorModulePath??('ForTests/ships/vessels/'+value.id+'.js'),gameDefinitionPath:'src/world/ships/vessels/'+value.id+'.js',editorDefaults:deepFreeze(clone(editorDefaults||{}))});
}
export function getResolvedVesselDefinition(spec){
 if(!spec?.id)return null;
 const persisted=spec.editorDefaults||{};
 const design=mergeData(mergeData(spec.design,persisted.design||{}),designOverrides.get(spec.id)||{});
 const structure=deepFreeze(mergeData(mergeData(spec.structure,persisted.structure||{}),structureOverrides.get(spec.id)||{}));
 return deepFreeze({id:spec.id,design:prepareDesign(design,structure),structure,editorModulePath:spec.editorModulePath,gameDefinitionPath:spec.gameDefinitionPath,editorDefaults:persisted});
}
export const getShipDesignFromSpec=spec=>getResolvedVesselDefinition(spec)?.design??null;
export const getShipStructureFromSpec=spec=>getResolvedVesselDefinition(spec)?.structure??null;
export function setDesignOverrideForSpec(spec,patch={}){if(!spec?.id)return false;if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('Design overrides must be an object.');if(Object.keys(patch).length)designOverrides.set(spec.id,clone(patch));else designOverrides.delete(spec.id);return true;}
export function setStructureOverrideForSpec(spec,patch={}){if(!spec?.id)return false;if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('Structure overrides must be an object.');if(Object.keys(patch).length)structureOverrides.set(spec.id,clone(patch));else structureOverrides.delete(spec.id);return true;}
export const resetDesignOverrideForSpec=spec=>setDesignOverrideForSpec(spec,{});
export const resetStructureOverrideForSpec=spec=>setStructureOverrideForSpec(spec,{});
export const resolveVesselForGeneration = getResolvedVesselDefinition;
