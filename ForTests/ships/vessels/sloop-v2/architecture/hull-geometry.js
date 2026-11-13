import * as THREE from 'three';
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp01=value=>Math.max(0,Math.min(1,Number(value)||0));
const UNITS_PER_METRE=4/3;

// t=0 is the fine bow; t=1 is the rounded transom. These stations were
// redrawn from the plan's overhead silhouette: a full middle, little overhang.
const BREADTH_STATIONS=Object.freeze([
 [0,.025],[.025,.07],[.06,.16],[.11,.29],[.18,.48],[.27,.68],
 [.37,.83],[.47,.94],[.54,1],[.63,.99],[.72,.96],[.81,.89],
 [.89,.79],[.95,.68],[1,.56]
]);
/**
 * Shape-preserving cubic interpolation for station offsets. The previous
 * per-interval smoothstep forced the tangent to zero at EVERY station; that
 * made the beam outline scallop and made every longitudinal deck seam inherit
 * the same repeated wiggle. PCHIP-style harmonic slopes keep a fair curve
 * through the measured/reconstructed stations without overshoot.
 */
function monotoneStationSlopes(profile){
 const count=profile.length,intervals=[],secants=[];
 for(let i=0;i<count-1;i++){
  const h=profile[i+1][0]-profile[i][0];
  intervals.push(h);secants.push((profile[i+1][1]-profile[i][1])/h);
 }
 const slopes=new Array(count);
 const endpoint=(h0,h1,d0,d1)=>{
  let value=((2*h0+h1)*d0-h0*d1)/(h0+h1);
  if(Math.sign(value)!==Math.sign(d0))value=0;
  else if(Math.sign(d0)!==Math.sign(d1)&&Math.abs(value)>3*Math.abs(d0))value=3*d0;
  return value;
 };
 slopes[0]=endpoint(intervals[0],intervals[1],secants[0],secants[1]);
 slopes[count-1]=endpoint(intervals[count-2],intervals[count-3],
  secants[count-2],secants[count-3]);
 for(let i=1;i<count-1;i++){
  const before=secants[i-1],after=secants[i];
  if(before===0||after===0||Math.sign(before)!==Math.sign(after)){
   slopes[i]=0;continue;
  }
  const hBefore=intervals[i-1],hAfter=intervals[i];
  const w1=2*hAfter+hBefore,w2=hAfter+2*hBefore;
  slopes[i]=(w1+w2)/(w1/before+w2/after);
 }
 return slopes;
}
const BREADTH_SLOPES=monotoneStationSlopes(BREADTH_STATIONS);
function sample(profile,t,slopes=BREADTH_SLOPES){
 const x=clamp01(t);
 for(let i=0;i<profile.length-1;i++){
  const a=profile[i],b=profile[i+1];
  if(x<=b[0]){
   const h=b[0]-a[0],u=(x-a[0])/h,u2=u*u,u3=u2*u;
   return (2*u3-3*u2+1)*a[1]+(u3-2*u2+u)*h*slopes[i]+
    (-2*u3+3*u2)*b[1]+(u3-u2)*h*slopes[i+1];
  }
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
/**
 * Open-top section: port sheer -> keel -> starboard sheer. The former
 * sin(angle) mapping pinched both sheer edges to the centreline, leaving
 * the separate full-beam deck detached from the hull.
 */
export function hullPoint(d,t,angle){
 const s=clamp01(t),raw=Number(angle)||0,fullTurn=Math.PI*2;
 const wrapped=((raw%fullTurn)+fullTurn)%fullTurn;
 const a=raw>0&&wrapped<1e-10?fullTurn:wrapped;
 const level=(1+Math.cos(a))*.5,side=a<=Math.PI?-1:1;
 const breadth=halfBreadth(d,s)*sectionBreadth(d,s,level);
 return V(side*breadth,
  keelY(d,s)+(deckY(d,s)-keelY(d,s))*level,stationZ(d,s,level));
}


/** Shared rudder stock centre, used by both the rotating blade and tiller. */
export function rudderStockPosition(d){
 return V(0,deckY(d,1)+.045,stationZ(d,1,1)+.04);
}

/** Aft-face station on the transom at a given ship-local height. */
export function transomZAtY(d,y){
 const top=deckY(d,1),bottom=keelY(d,1);
 const level=clamp01((y-bottom)/Math.max(1e-6,top-bottom));
 return stationZ(d,1,level);
}
