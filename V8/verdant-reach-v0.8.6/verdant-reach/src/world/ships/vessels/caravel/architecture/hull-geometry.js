import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}
export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}
export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),fore=.9+.1*Math.pow(t,.8),aft=.82+.18*Math.pow(1-t,.6);return d.beamUnits*.5*Math.pow(mid,.83)*fore*aft*(1+.04*Math.sin(3*Math.PI*t));}
export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const section=Math.pow(Math.max(.02,1-Math.pow(Math.abs(2*v-1),2.45)),.52),bilge=1+.16*Math.sin(Math.PI*v),tumble=1-d.hull.tumblehome*Math.max(0,(v-.7)/.3);return V(Math.cos(a)*halfBreadth(d,t)*section*bilge*tumble,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
