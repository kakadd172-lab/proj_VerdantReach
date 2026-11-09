import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),belly=.93+.13*Math.exp(-Math.pow((t-.54)*3.4,2)),bow=.75+.25*Math.min(1,t*4.3),stern=.86+.14*Math.min(1,(1-t)*3.6);return d.beamUnits*.5*Math.pow(mid,.55)*belly*bow*stern;}
export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const lower=.78+.22*Math.sqrt(Math.max(0,v)),upper=1-d.structure.tumble*(Math.max(0,v-.58)/.42),bilge=1+.12*Math.sin(Math.PI*v);return V(Math.cos(a)*halfBreadth(d,t)*lower*upper*bilge,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
