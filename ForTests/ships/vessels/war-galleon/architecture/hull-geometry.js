import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp01 = value => Math.max(0,Math.min(1,value));
const smooth = value => { const t=clamp01(value); return t*t*(3-2*t); };
export function deckY(d,t) {
  const shoulder=Math.pow(Math.abs(t-.5)*2,1.24);
  const endRise=t<.5?d.hull.bowRise:d.hull.sternRise;
  return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*Math.pow(shoulder,1.10)+endRise*d.deckHeightUnits*shoulder*d.structure.sheer;
}
export function keelY(d,t) {
  const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.82);
  const fore=Math.pow(1-clamp01(t/.18),1.6);
  const aft=Math.pow(clamp01((t-.82)/.18),1.3);
  return -d.draftUnits*(.43+d.hull.keelDepth*mid)+d.draftUnits*(.045*fore+.025*aft);
}
export function halfBreadth(d,t){
  const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.60);
  const entrance=.54+.46*smooth(t/.23);
  const run=.90+.10*smooth((1-t)/.24);
  const shoulder=1-.075*Math.pow(Math.abs(t-.5)*2,1.7);
  const transom=d.hull.sternWidth*smooth((t-.76)/.24);
  return d.beamUnits*.5*Math.max(mid*entrance*run*shoulder*d.hull.fullness,transom);
}
export function hullPoint(d,t,a) {
  const vertical=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);
  const floor=.66+.34*Math.sqrt(Math.max(0,vertical));
  const tumble=1-d.hull.tumblehome*Math.pow(Math.max(0,(vertical-.55)/.45),1.18);
  const flare=1+d.structure.flare*Math.max(0,.48-vertical);
  return V(Math.cos(a)*halfBreadth(d,t)*floor*tumble*flare,keel+(deck-keel)*vertical,(t-.5)*d.hullLengthUnits);
}
