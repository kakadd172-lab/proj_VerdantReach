import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildDeckEquipment(d,ctx){const {part,beam,tube,box,materials,V}=ctx;
const fittings=part('deck-fittings');
 for(let h=0;h<2;h++){const t=.32+h*.13,z=(t-.5)*d.hullLengthUnits,group=part('cargo-hatch-'+h,fittings),size=d.beamUnits*.2,cover=box(group,size,.12,size*.84,materials.plank,'hatch-cover');cover.position.set(0,deckY(d,t)+.12,z);}
 
 const oarsGroup=part('oars'),oarCount=16;for(let i=0;i<oarCount;i++){const t=.18+i/(oarCount-1)*.64,z=(t-.5)*d.hullLengthUnits,y=deckY(d,t)-.1;for(let side of [-1,1]){beam(oarsGroup,V(side*halfBreadth(d,t)*.72,y,z),V(side*halfBreadth(d,t)*1.55,y-.28,z-.9),.035,materials.trim,'xebec-sweep-oar-'+side+'-'+i,7);}}
}
