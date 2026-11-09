import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),fore=1-.24*Math.pow(1-t,1.7),aft=1-.11*Math.pow(t,2.1);return d.beamUnits*.5*Math.pow(mid,.91)*fore*aft*(1-.035*Math.cos(2*Math.PI*t));}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const section=Math.pow(Math.max(.02,1-Math.pow(Math.abs(2*v-1),2.7)),.52),flare=1+d.structure.flare*(v-.42);return V(Math.cos(a)*halfBreadth(d,t)*section*flare,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
