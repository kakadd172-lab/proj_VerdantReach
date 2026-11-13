import { deckY, V } from '../../architecture/hull-geometry.js';
export function buildDeckEquipment(d,ctx){
  const {THREE,part,box,beam,materials}=ctx,fittings=part('deck-fittings');
  for(const [id,t,scale] of [['cargo-hatch-forward',.39,.90],['cargo-hatch-aft',.60,.78]]){
    const group=part(id,fittings),width=d.beamUnits*.19*scale,depth=width*.72,z=(t-.5)*d.hullLengthUnits;
    const coaming=box(group,width,.10,depth,materials.trim,'raised-hatch-coaming');coaming.position.set(0,deckY(d,t)+.075,z);
    const cover=box(group,width*.92,.055,depth*.90,materials.plank,'planked-hatch-cover');cover.position.set(0,deckY(d,t)+.14,z);
    for(const side of [-1,1])beam(group,V(side*width*.28,deckY(d,t)+.18,z-depth*.43),V(side*width*.28,deckY(d,t)+.18,z+depth*.43),.018,materials.trim,'hatch-lifting-cleat');
  }
  const capstan=part('deck-capstan',fittings),capstanZ=d.hullLengthUnits*.20,capstanY=deckY(d,.70);
  const drum=ctx.mesh(capstan,new THREE.CylinderGeometry(.23,.28,.48,16),materials.trim,'capstan-drum');drum.position.set(0,capstanY+.24,capstanZ);
  const head=ctx.mesh(capstan,new THREE.CylinderGeometry(.33,.33,.12,16),materials.plank,'capstan-head');head.position.set(0,capstanY+.52,capstanZ);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(capstan,V(Math.cos(a)*.24,capstanY+.64,capstanZ+Math.sin(a)*.24),V(Math.cos(a)*.72,capstanY+.64,capstanZ+Math.sin(a)*.72),.025,materials.trim,'capstan-bar');}
  const skylight=part('quarterdeck-skylight',fittings),light=box(skylight,d.beamUnits*.12,.09,d.beamUnits*.075,materials.glass,'aft-skylight-glass');
  light.position.set(0,deckY(d,.78)+.12,d.hullLengthUnits*.28);
  for(const side of [-1,1]){
    const group=part(side<0?'bollard-port':'bollard-starboard',fittings),x=side*d.beamUnits*.34,z=-d.hullLengthUnits*.27;
    const post=ctx.mesh(group,new THREE.CylinderGeometry(.08,.11,.40,10),materials.trim,'mooring-bollard-post');post.position.set(x,deckY(d,.20)+.20,z);
    beam(group,V(x-.20,deckY(d,.20)+.28,z),V(x+.20,deckY(d,.20)+.28,z),.055,materials.trim,'bollard-crosshead');
  }
}
