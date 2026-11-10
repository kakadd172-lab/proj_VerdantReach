import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
export function buildSchoonerDeckhouse(d,ctx){
 const {part,box,beam,materials,V,THREE,mesh}=ctx,cabin=part('deckhouse');
 const t=.78,z=(t-.5)*d.hullLengthUnits,width=halfBreadth(d,t)*.68;
 const length=d.hullLengthUnits*.105,height=d.deckHeightUnits*.40,y=deckY(d,t);
 const profile=new THREE.Shape(),z0=z-length*.5;
 profile.moveTo(0,0);profile.lineTo(0,height*.72);
 profile.quadraticCurveTo(length*.06,height*1.02,length*.16,height*.98);
 profile.lineTo(length*.28,height*.91);profile.lineTo(length*.43,height*.77);
 profile.lineTo(length*.58,height*.62);profile.lineTo(length*.73,height*.48);
 profile.lineTo(length*.88,height*.36);profile.lineTo(length,height*.29);
 profile.lineTo(length,0);profile.closePath();
 const geometry=new THREE.ExtrudeGeometry(profile,{depth:width*1.08,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025});
 geometry.rotateY(-Math.PI/2);geometry.translate(width*.54,y,z0);geometry.computeVertexNormals();
 mesh(cabin,geometry,materials.hull,'schooner-folded-back-cabin');
 const folds=[[.16,.98],[.28,.91],[.43,.77],[.58,.62],[.73,.48],[.88,.36]];
 for(let i=1;i<folds.length;i++){
  const [a,ra]=folds[i-1],[b,rb]=folds[i],radius=.022;
  for(const side of [-1,1])beam(cabin,V(side*width*.54,y+height*ra,z0+length*a),V(side*width*.54,y+height*rb,z0+length*b),radius,materials.trim,'deckhouse-fold-strap');
 }
 const door=box(cabin,width*.22,height*.72,.055,materials.plank,'deckhouse-door');door.position.set(0,y+height*.38,z-length*.505);
 for(let side of [-1,1])for(let n=0;n<2;n++){
  const pane=box(cabin,.045,.28,.36,materials.glass,'deckhouse-side-window');pane.position.set(side*(width*.505),y+height*.58,z+(n-.5)*length*.44);
  beam(cabin,V(side*(width*.53),y+height*.43,z+(n-.5)*length*.44-.20),V(side*(width*.53),y+height*.43,z+(n-.5)*length*.44+.20),.018,materials.trim,'deckhouse-window-sill');
 }
 const companionway=box(cabin,width*.32,.16,length*.24,materials.plank,'companionway-hatch');companionway.position.set(0,y+.12,z-length*.66);
}
