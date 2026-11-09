import { deckY, keelY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStern(d,ctx){
  const {part,beam,box,materials,V}=ctx;
  const stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);

  // This board follows the actual last hull section. It is a shaped transom
  // face, not a box placed behind a narrow pointed stern.
  const transomStation=1;
  const deck=deckY(d,transomStation);
  const keel=keelY(d,transomStation);
  const halfWidth=halfBreadth(d,transomStation)*0.985;
  const depth=(deck-keel)*0.88;
  const top=deck-0.035;
  const bottom=top-depth;
  const profile=new ctx.THREE.Shape();
  profile.moveTo(-halfWidth,top);
  profile.lineTo(halfWidth,top);
  profile.quadraticCurveTo(halfWidth*0.96,top-depth*0.50,halfWidth*0.64,top-depth*0.84);
  profile.quadraticCurveTo(0,bottom,-halfWidth*0.64,top-depth*0.84);
  profile.quadraticCurveTo(-halfWidth*0.96,top-depth*0.50,-halfWidth,top);
  profile.closePath();

  const geometry=new ctx.THREE.ShapeGeometry(profile,16);
  const position=geometry.getAttribute('position');
  const verticalRange=Math.max(0.001,deck-keel);
  for(let i=0;i<position.count;i++){
    const y=position.getY(i);
    const heightFraction=Math.min(1,Math.max(0,(y-keel)/verticalRange));
    const level=Math.pow(heightFraction,1/0.92);
    position.setZ(i,stationZ(d,transomStation,level)+0.008);
  }
  geometry.computeVertexNormals();
  ctx.mesh(stern,geometry,materials.hull,'sloop-natural-transom-face');

  // A single light top rail and two compact corner supports finish the stern.
  const topZ=stationZ(d,transomStation,1)+0.018;
  beam(gallery,V(-halfWidth,top,topZ),V(halfWidth,top,topZ),0.026,materials.trim,'transom-top-rail');
  for(const side of [-1,1]){
    beam(
      gallery,
      V(side*halfWidth,top,topZ),
      V(side*halfWidth*0.76,top-depth*0.68,stationZ(d,transomStation,0.30)+0.015),
      0.026,
      materials.trim,
      'transom-corner-support'
    );
  }

  // Small stern lights remain subordinate to the broad transom.
  const paneW=halfWidth*0.16,paneH=depth*0.13;
  for(let n=0;n<3;n++){
    const x=(n-1)*halfWidth*0.54;
    const pane=box(windows,paneW,paneH,0.022,materials.glass,'transom-light');
    pane.position.set(x,top-depth*0.27,stationZ(d,transomStation,0.68)+0.025);
  }
}
