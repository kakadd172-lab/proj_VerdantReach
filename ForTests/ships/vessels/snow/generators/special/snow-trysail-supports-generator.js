import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
export function buildSnowTrysailSupports(d,ctx){
 const {part,beam,box,tube,materials,V}=ctx,horse=part('snow-trysail-mast-horse');
 const main=d.masts.find(m=>m.id==='main'),aux=d.masts.find(m=>m.id==='trysail');
 if(!main||!aux)return;
 const mainZ=main.z*d.hullLengthUnits,auxZ=aux.z*d.hullLengthUnits,deck=deckY(d,.5+aux.z*.45),crossY=deck+.32;
 for(let side of [-1,1]){
  beam(horse,V(side*.34,crossY,mainZ),V(side*.34,crossY,auxZ),.045,materials.trim,'trysail-mast-horse-rail');
  beam(horse,V(side*.34,crossY,auxZ),V(side*.10,deck+.05,auxZ+.35),.038,materials.trim,'trysail-horse-knee');
 }
 beam(horse,V(-.46,crossY,auxZ),V(.46,crossY,auxZ),.065,materials.trim,'trysail-mast-crosspiece');
 const partner=box(horse,.72,.15,.62,materials.trim,'trysail-mast-partner');partner.position.set(0,deck+.08,auxZ);
 const stay=part('snow-trysail-running-stays',horse);tube(stay,[V(0,deck+.22,auxZ),V(0,deck+.22,mainZ)],.018,materials.rope,'snow-mast-connecting-stay',20);
}
