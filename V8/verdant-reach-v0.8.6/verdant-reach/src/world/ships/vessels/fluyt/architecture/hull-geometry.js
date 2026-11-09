import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),bulge=1+.18*Math.exp(-Math.pow((t-.5)*3.5,2)),entry=.72+.28*Math.min(1,t*3.5),run=.88+.12*Math.min(1,(1-t)*3);return d.beamUnits*.5*Math.pow(mid,.48)*bulge*entry*run;}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const side=Math.sign(Math.cos(a)||1),floor=.44+.56*Math.pow(Math.max(0,Math.sin(Math.PI*v)),.48),pinch=v>.46?1-d.structure.tumble*Math.pow((v-.46)/.54,1.12):1,bilge=1+.18*Math.sin(Math.PI*v),flare=1+.08*Math.max(0,v-.68);return V(side*halfBreadth(d,t)*floor*pinch*bilge*flare,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
