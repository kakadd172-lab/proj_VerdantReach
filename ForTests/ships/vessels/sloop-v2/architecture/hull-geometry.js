import * as THREE from 'three';
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const smooth=value=>{const t=clamp01(value);return t*t*(3-2*t);};
const UNITS_PER_METRE=4/3;

// t=0 is the fine bow; t=1 is the rounded transom. These stations were
// redrawn from the plan's overhead silhouette: a full middle, little overhang.
const BREADTH_STATIONS=Object.freeze([
 [0,.025],[.025,.07],[.06,.16],[.11,.29],[.18,.48],[.27,.68],
 [.37,.83],[.47,.94],[.54,1],[.63,.99],[.72,.96],[.81,.89],
 [.89,.79],[.95,.68],[1,.56]
]);
function sample(profile,t){
 const x=clamp01(t);
 for(let i=0;i<profile.length-1;i++){
  const a=profile[i],b=profile[i+1];
  if(x<=b[0]){const u=smooth((x-a[0])/(b[0]-a[0]));return THREE.MathUtils.lerp(a[1],b[1],u);}
 }
 return profile[profile.length-1][1];
}
export function halfBreadth(d,t){
 const station=clamp01(t),plan=sample(BREADTH_STATIONS,station);
 return d.beamUnits*.5*plan*(1+.018*Math.sin(Math.PI*station));
}
/** Fuller sections and modest flare, with a round bilge rather than a flat barge. */
export function sectionBreadth(d,t,v){
 const level=clamp01(v);
 const round=Math.pow(Math.max(0,Math.sin(level*Math.PI*.5)),.72);
 const flare=(d.hull.flare??.085)*Math.pow(level,2.0);
 const tumble=(d.hull.tumblehome??.045)*Math.pow(Math.max(0,(level-.76)/.24),2);
 return Math.max(.012,round*(1+flare-tumble));
}
/** Pronounced sheer: both ends stand higher than the middle. */
export function deckY(d,t){
 const s=clamp01(t);
 const bow=(d.hull.bowRise??.12)*Math.pow(1-s,2.1);
 const stern=(d.hull.sternRise??.10)*Math.pow(s,2.0);
 const sheer=(d.hull.sheer??.30)*Math.pow(Math.abs(2*s-1),1.55);
 return d.deckHeightUnits+(bow+stern+sheer)*UNITS_PER_METRE;
}
/** A mostly straight keel with only slight rise into the forefoot and deadwood. */
export function keelY(d,t){
 const s=clamp01(t),endLift=.055*Math.pow(Math.abs(2*s-1),1.6);
 return deckY(d,s)-(d.deckHeightUnits+d.draftUnits)*(1-endLift);
}
export function stationZ(d,t,v=1){
 const s=clamp01(t),level=clamp01(v);
 const base=(s-.5)*d.hullLengthUnits;
 const stemRake=(d.hull.stemRake??.065)*d.beamUnits*Math.pow(1-s,2.05)*level;
 const sternRake=(d.hull.sternRake??.025)*d.beamUnits*Math.pow(s,2.7)*level;
 return base-stemRake+sternRake;
}
export function hullSurfacePoint(d,t,side,v){
 const s=clamp01(t),level=clamp01(v);
 const y=keelY(d,s)+(deckY(d,s)-keelY(d,s))*level;
 const x=side*halfBreadth(d,s)*sectionBreadth(d,s,level);
 return V(x,y,stationZ(d,s,level));
}
export function hullPoint(d,t,angle){
 const s=clamp01(t),a=((Number(angle)||0)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
 const c=Math.cos(a),sn=Math.sin(a),level=(1-c)*.5;
 return V(sn*halfBreadth(d,s)*sectionBreadth(d,s,level),
  keelY(d,s)+(deckY(d,s)-keelY(d,s))*level,stationZ(d,s,level));
}
