import { deckY, halfBreadth, V } from '../../architecture/hull-geometry.js';
export function buildBow(d,ctx){
  const {THREE,part,beam,tube,box,materials}=ctx,bow=part('bowworks');
  const forecastle=part('war-galleon-forecastle',bow),forecastleDeck=part('war-galleon-forecastle-deck',forecastle);
  const along=30,across=22,positions=[],indices=[];
  for(let i=0;i<=along;i++){const t=.035+.19*i/along,half=halfBreadth(d,t)*.88;for(let j=0;j<=across;j++){const u=j/across*2-1,camber=d.hull.deckCamber*d.deckHeightUnits*(1-u*u);positions.push(u*half,deckY(d,t)+d.deckHeightUnits*.15+camber,(t-.5)*d.hullLengthUnits);}}
  for(let i=0;i<along;i++)for(let j=0;j<across;j++){const a=i*(across+1)+j;indices.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);}
  const deckGeometry=new THREE.BufferGeometry();deckGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));deckGeometry.setIndex(indices);deckGeometry.computeVertexNormals();ctx.mesh(forecastleDeck,deckGeometry,materials.deck,'low-raised-forecastle-planking');
  const sheathing=part('forecastle-side-sheathing',forecastle);
  for(const side of [-1,1]){const rail=[];for(let i=0;i<=28;i++){const t=.035+.19*i/28,x=side*halfBreadth(d,t)*.88,y=deckY(d,t)+d.deckHeightUnits*.15+.46,z=(t-.5)*d.hullLengthUnits;rail.push(V(x,y,z));if(i%4===0)beam(forecastle,V(x,y-.42,z),V(x,y+.02,z),.034,materials.trim,'forecastle-bulwark-post');if(i%3===0){const panel=box(sheathing,.06,d.deckHeightUnits*.14,.10,materials.hull,'forecastle-side-panel');panel.position.set(x,y-d.deckHeightUnits*.10,z);}}tube(forecastle,rail,.05,materials.trim,'forecastle-top-rail',56);tube(forecastle,rail.map(p=>V(p.x,p.y-.15,p.z)),.023,materials.trim,'forecastle-lower-rail',56);}
  const beakhead=part('beakhead',bow),tip=-d.hullLengthUnits*.5-d.beamUnits*.34,baseY=deckY(d,.035)+d.deckHeightUnits*.12;
  beam(beakhead,V(0,baseY,-d.hullLengthUnits*.47),V(0,baseY+d.deckHeightUnits*.26,tip),Math.max(.08,d.beamUnits*.028),materials.trim,'beakhead-stem');
  const platform=box(beakhead,d.beamUnits*.32,.13,d.beamUnits*.78,materials.deck,'beakhead-platform');platform.position.set(0,baseY+d.deckHeightUnits*.17,tip+d.beamUnits*.34);
  const bowsprit=part('bowsprit');beam(bowsprit,V(0,baseY+.38,-d.hullLengthUnits*.39),V(0,baseY+d.deckHeightUnits*.38,tip-d.beamUnits*.34),Math.max(.10,d.beamUnits*.027),materials.trim,'long-raked-bowsprit',12);
  for(const side of [-1,1])beam(bowsprit,V(0,baseY+.18,-d.hullLengthUnits*.43),V(side*d.beamUnits*.18,baseY+.14,tip+d.beamUnits*.18),.036,materials.trim,'beakhead-cheek');
}
