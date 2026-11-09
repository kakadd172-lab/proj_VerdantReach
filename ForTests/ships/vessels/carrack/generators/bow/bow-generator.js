import { deckY, V } from "../../architecture/hull-geometry.js";
export function buildBow(d,ctx){
 const {part,beam,box,tube,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');
 const base=deckY(d,.045)+d.deckHeightUnits*.18,tip=-d.hullLengthUnits*.5;
 const forecastle=part('carrack-forecastle',bow),forecastleDeck=part('carrack-forecastle-deck',forecastle);
 const along=24,across=20,positions=[],indices=[];
 for(let i=0;i<=along;i++){
  const t=.045+.175*i/along,half=halfBreadth(d,t)*.86,z=(t-.5)*d.hullLengthUnits;
  for(let j=0;j<=across;j++){
   const u=j/across*2-1,camber=d.hull.deckCamber*d.deckHeightUnits*(1-u*u);
   positions.push(u*half,deckY(d,t)+d.deckHeightUnits*0.26+camber,z);
  }
 }
 for(let i=0;i<along;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j;
  indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
 }
 const deckGeometry=new ctx.THREE.BufferGeometry();
 deckGeometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(positions,3));
 deckGeometry.setIndex(indices);deckGeometry.computeVertexNormals();
 ctx.mesh(forecastleDeck,deckGeometry,materials.deck,'carrack-raised-forecastle-platform');
 for(const side of [-1,1]){
  const railLine=[];
  for(let i=0;i<=24;i++){
   const t=.045+.175*i/24,x=side*halfBreadth(d,t)*.86;
   const y=deckY(d,t)+d.deckHeightUnits*0.26+.34,z=(t-.5)*d.hullLengthUnits;
   railLine.push(V(x,y,z));
   if(i%3===0)beam(forecastle,V(x,y-.28,z),V(x,y+.04,z),.042,materials.trim,'forecastle-bulwark-stanchion');
  }
  tube(forecastle,railLine,.048,materials.trim,'forecastle-top-rail',48);
  tube(forecastle,railLine.map(p=>V(p.x,p.y-.16,p.z)),.026,materials.trim,'forecastle-lower-rail',48);
 }
 const aftZ=(.22-.5)*d.hullLengthUnits,aftHalf=halfBreadth(d,.22)*.82;
 const aftY=deckY(d,.22)+d.deckHeightUnits*0.26;
 beam(forecastle,V(-aftHalf,aftY+.08,aftZ),V(aftHalf,aftY+.08,aftZ),.045,materials.trim,'forecastle-aft-cross-rail');
 const sheathing=part('forecastle-side-sheathing',forecastle);
 for(const [side,label] of [[-1,'port'],[1,'starboard']]){
  const verts=[],faces=[];
  for(let i=0;i<=along;i++){
   const t=.045+.175*i/along,z=(t-.5)*d.hullLengthUnits,half=halfBreadth(d,t)*.86;
   const lowerY=deckY(d,t)+.035,upperY=deckY(d,t)+d.deckHeightUnits*.26+.015;
   verts.push(side*half*.98,lowerY,z,side*half,upperY,z);
  }
  for(let i=0;i<along;i++){
   const a=i*2;faces.push(a,a+1,a+2,a+1,a+3,a+2);
  }
  const wallGeometry=new ctx.THREE.BufferGeometry();
  wallGeometry.setAttribute('position',new ctx.THREE.Float32BufferAttribute(verts,3));
  wallGeometry.setIndex(faces);wallGeometry.computeVertexNormals();
  ctx.mesh(sheathing,wallGeometry,materials.hull,'forecastle-side-panel-'+label);
 }
 const aftBulkhead=box(forecastle,halfBreadth(d,.22)*1.62,d.deckHeightUnits*.26,.12,materials.hull,'forecastle-aft-bulkhead');
 aftBulkhead.position.set(0,deckY(d,.22)+d.deckHeightUnits*.13,(.22-.5)*d.hullLengthUnits);
 const beakhead=part('carrack-beakhead',bow),length=d.beamUnits*.78;
 beam(beakhead,V(0,base,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.42,tip-length),d.beamUnits*.04,materials.trim,'beakhead-stem');
 const platform=box(beakhead,d.beamUnits*.34,.14,length*.82,materials.deck,'beakhead-platform');
 platform.position.set(0,base+d.deckHeightUnits*.24,tip-length*.52);
 for(const side of [-1,1]){
  beam(beakhead,V(0,base+d.deckHeightUnits*.24,tip-length*.9),V(side*d.beamUnits*.19,base+d.deckHeightUnits*.2,tip),.035,materials.trim,'beakhead-cheek');
 }
 if(d.headsails>0){
  const lashing=part('bowsprit-gammoning',bow);
  beam(lashing,V(0,base+.12,tip+d.hullLengthUnits*.08),V(0,base+d.deckHeightUnits*.28,tip-d.beamUnits*.5),.026,materials.rope,'gammoning-line');
 }
}
