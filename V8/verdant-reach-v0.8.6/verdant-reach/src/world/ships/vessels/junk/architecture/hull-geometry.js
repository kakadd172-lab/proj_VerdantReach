import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),boxy=1+.09*Math.cos(2*Math.PI*t),fore=.88+.12*Math.min(1,t*2.8),aft=.94+.06*Math.min(1,(1-t)*2.8);return d.beamUnits*.5*Math.pow(mid,.39)*boxy*fore*aft;}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const side=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.24),chine=v<.25?.82+.18*v/.25:1-.07*(v-.25),flat=1-.04*Math.pow(1-v,2);return V(side*halfBreadth(d,t)*chine*flat,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
