import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),body=.87+.15*Math.sin(Math.PI*t*.92),bow=.82+.18*Math.min(1,t*3.8),stern=.92+.08*Math.min(1,(1-t)*4.2);return d.beamUnits*.5*Math.pow(mid,.68)*body*bow*stern;}
export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const c=Math.cos(a),chine=1-.12*Math.pow(1-v,4)+d.structure.bilge*.12*Math.sin(Math.PI*v),tumble=v>.65?1-d.structure.tumble*(v-.65)/.35:1;return V(c*halfBreadth(d,t)*chine*tumble,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
