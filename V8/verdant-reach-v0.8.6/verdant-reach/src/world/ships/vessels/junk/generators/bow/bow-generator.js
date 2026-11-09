import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildBow(d,ctx){
 const {part,beam,tube,materials,V}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');
 const stem=part('junk-high-stem',bow),tip=-d.hullLengthUnits*.5;
 const stemBottom=keelY(d,.008),stemTop=deckY(d,.025)+d.deckHeightUnits*.38;
 beam(stem,V(0,stemBottom,tip),V(0,stemTop,tip+d.hullLengthUnits*.025),Math.max(.12,d.beamUnits*.035),materials.trim,'junk-raised-stempost');
 const cap=part('junk-bow-cap',bow),capZ=-d.hullLengthUnits*.43,capY=deckY(d,.055)+d.deckHeightUnits*.3,capHalf=halfBreadth(d,.055)*.78;
 beam(cap,V(-capHalf,capY,capZ),V(capHalf,capY,capZ),Math.max(.07,d.beamUnits*.018),materials.trim,'junk-bow-cross-cap');
 const bulwark=part('junk-bow-bulwark',bow);
 for(const side of [-1,1]){
  const line=[];
  for(let i=0;i<=14;i++){
   const t=.012+.12*i/14,x=side*halfBreadth(d,t)*.84,y=deckY(d,t)+d.deckHeightUnits*.28,z=(t-.5)*d.hullLengthUnits;
   line.push(V(x,y,z));
   if(i%3===0)beam(bulwark,V(x,y-.24,z),V(x,y+.03,z),.035,materials.trim,'junk-bow-bulwark-post');
  }
  tube(bulwark,line,.045,materials.trim,'junk-raised-bow-rail',24);
 }
}
