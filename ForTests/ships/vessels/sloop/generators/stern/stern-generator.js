import { deckY, keelY, halfBreadth, hullPoint, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStern(d,ctx){
  const {part,beam,box,materials,V}=ctx;
  const stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);

  // Shape the transom from the actual cut section of the hull. Its width and
  // rounded lower outline are inherited from the hull, not guessed separately.
  const station=1,segments=64,profile=new ctx.THREE.Shape();
  for(let i=0;i<=segments;i++){
    const angle=(i/segments)*Math.PI*2;
    const point=hullPoint(d,station,angle);
    if(i===0)profile.moveTo(point.x,point.y);
    else profile.lineTo(point.x,point.y);
  }
  profile.closePath();

  const geometry=new ctx.THREE.ShapeGeometry(profile,24);
  const position=geometry.getAttribute('position');
  const deck=deckY(d,station),keel=keelY(d,station);
  const verticalRange=Math.max(0.001,deck-keel);
  for(let i=0;i<position.count;i++){
    const y=position.getY(i);
    const heightFraction=Math.min(1,Math.max(0,(y-keel)/verticalRange));
    const level=Math.pow(heightFraction,1/0.92);
    position.setZ(i,stationZ(d,station,level)+0.006);
  }
  geometry.computeVertexNormals();
  ctx.mesh(stern,geometry,materials.hull,'sloop-natural-transom-face');

  const halfWidth=halfBreadth(d,station)*0.96;
  const top=deck-0.035,topZ=stationZ(d,station,1)+0.018;
  beam(gallery,V(-halfWidth,top,topZ),V(halfWidth,top,topZ),0.022,materials.trim,'transom-top-edge');

  // Three small lights follow the broad, shaped transom face.
  const paneW=halfWidth*0.13,paneH=verticalRange*0.075;
  for(let n=0;n<3;n++){
    const x=(n-1)*halfWidth*0.48;
    const pane=box(windows,paneW,paneH,0.018,materials.glass,'transom-light');
    pane.position.set(x,deck-verticalRange*0.24,stationZ(d,station,0.72)+0.025);
  }
}
