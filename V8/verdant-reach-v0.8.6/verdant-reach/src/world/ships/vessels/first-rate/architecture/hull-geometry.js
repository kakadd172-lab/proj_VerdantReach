import * as THREE from 'three';
export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
export function deckY(d,t){const edge=Math.pow(Math.abs(t-.5)*2,1.35),rise=t<.5?d.hull.bowRise:d.hull.sternRise;return d.deckHeightUnits+d.hull.sheer*d.deckHeightUnits*edge+rise*d.deckHeightUnits*Math.pow(edge,1.12)*d.structure.sheer;}

export function keelY(d,t){const mid=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.72);return -d.draftUnits*.48-d.hull.keelDepth*d.draftUnits*mid;}

export function halfBreadth(d,t){const mid=Math.max(0,Math.sin(Math.PI*t)),body=.93+.15*Math.exp(-Math.pow((t-.52)*3.2,2)),bow=.82+.18*Math.min(1,t*3.4),stern=.91+.09*Math.min(1,(1-t)*3.8);return d.beamUnits*.5*Math.pow(mid,.57)*body*bow*stern;}

export function hullPoint(d,t,a){const v=(Math.sin(a)+1)*.5,deck=deckY(d,t),keel=keelY(d,t);const bilge=1+.16*Math.sin(Math.PI*v),section=Math.sqrt(Math.max(.01,1-Math.pow(Math.abs(2*v-1),2.45))),tumble=1-d.structure.tumble*Math.pow(Math.max(0,(v-.5)/.5),.9),flare=1+d.structure.flare*Math.max(0,v-.45);return V(Math.cos(a)*halfBreadth(d,t)*bilge*section*tumble*flare,keel+(deck-keel)*v,(t-.5)*d.hullLengthUnits);}
