import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),belly=.88+.18*Math.sin(Math.PI*t*.9),beak=.77+.23*Math.min(1,t*3.1),transom=.9+.1*Math.min(1,(1-t)*4);return d.beamUnits*.5*Math.pow(mid,.61)*belly*beak*transom;}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const floor=.72+.28*Math.sqrt(Math.max(0,v)),tumble=1-d.hull.tumblehome*Math.pow(Math.max(0,(v-.56)/.44),1.25),flare=1+d.structure.flare*Math.max(0,v-.35);return V(Math.cos(a)*halfBreadth(d,t)*floor*tumble*flare,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
