import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),fore=.72+.28*Math.pow(t,.55),aft=.9+.1*Math.pow(1-t,.7);return d.beamUnits*.5*Math.pow(mid,1.02)*fore*aft*(1-.08*Math.sin(2*Math.PI*t));}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const section=Math.pow(Math.max(.005,1-Math.pow(Math.abs(2*v-1),3.1)),.64),flat=1-.23*Math.pow(1-v,2.5);return V(Math.cos(a)*halfBreadth(d,t)*section*flat,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
