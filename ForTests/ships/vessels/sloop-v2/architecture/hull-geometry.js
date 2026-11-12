import * as THREE from 'three';
export const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
const smooth=v=>{const t=clamp01(v);return t*t*(3-2*t);};
const UNITS_PER_METRE=4/3;
const BREADTH_STATIONS=[[0,.025],[.025,.075],[.06,.18],[.11,.34],[.19,.56],[.29,.75],[.40,.89],[.52,.97],[.63,1],[.73,.985],[.82,.93],[.90,.84],[.96,.70],[1,.57]];
function stationCurve(t){
 const x=clamp01(t);
 for(let i=0;i<BREADTH_STATIONS.length-1;i++){
  const a=BREADTH_STATIONS[i],b=BREADTH_STATIONS[i+1];
  if(x<=b[0]){const u=smooth((x-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*u;}
 }
 return BREADTH_STATIONS[BREADTH_STATIONS.length-1][1];
}
/** Sloop V2's own plan-view breadth curve: fuller working midbody, fine entry and rounded counter. */
export function halfBreadth(d,t){
 const station=clamp01(t),plan=stationCurve(station),shoulder=1+0.035*Math.sin(Math.PI*station);
 return d.beamUnits*0.5*plan*shoulder;
}
export function sectionBreadth(d,t,v){
 const level=clamp01(v),round=Math.pow(Math.max(0,Math.sin(level*Math.PI*.5)),.82);
 const flare=(d.hull.flare??.13)*Math.pow(level,2.2);
 const tuck=(d.hull.tumblehome??.025)*Math.pow(Math.max(0,(level-.78)/.22),2);
 return Math.max(.015,round*(1+flare-tuck));
}
export function deckY(d,t){
 const s=clamp01(t),ends=(d.hull.bowRise??.42)*Math.pow(1-s,2.25)+(d.hull.sternRise??.24)*Math.pow(s,2);
 const sheer=(d.hull.sheer??.17)*4*s*(1-s);
 return d.deckHeightUnits+(ends+sheer)*UNITS_PER_METRE;
}
export function keelY(d,t){
 const s=clamp01(t),endLift=.17*Math.pow(Math.abs(s-.5)*2,1.6);
 return deckY(d,s)-(d.deckHeightUnits+d.draftUnits)*(1-endLift);
}
export function stationZ(d,t,v=1){
 const s=clamp01(t),level=clamp01(v),base=(s-.5)*d.hullLengthUnits;
 const bowRake=(d.hull.stemRake??.07)*d.beamUnits*Math.pow(1-s,2)*level;
 const sternRake=(d.hull.sternRake??.035)*d.beamUnits*Math.pow(s,2.4)*level;
 return base-bowRake+sternRake;
}
export function hullSurfacePoint(d,t,side,v){
 const s=clamp01(t),level=clamp01(v),y=keelY(d,s)+(deckY(d,s)-keelY(d,s))*level;
 return V(side*halfBreadth(d,s)*sectionBreadth(d,s,level),y,stationZ(d,s,level));
}
export function hullPoint(d,t,angle){
 const s=clamp01(t),a=((Number(angle)||0)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
 const c=Math.cos(a),sn=Math.sin(a),level=(1-c)*.5;
 return V(sn*halfBreadth(d,s)*sectionBreadth(d,s,level),
  keelY(d,s)+(deckY(d,s)-keelY(d,s))*level,stationZ(d,s,level));
}
