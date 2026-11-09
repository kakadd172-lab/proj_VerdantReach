import { deckY, keelY, halfBreadth, hullPoint, sectionBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStern(d,ctx){
  const {part,beam,box,materials,V}=ctx;
  const stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);
  const station=1,segments=72,profile=new ctx.THREE.Shape();
  for(let i=0;i<=segments;i++){
    const point=hullPoint(d,station,(i/segments)*Math.PI*2);
    if(i===0)profile.moveTo(point.x,point.y);
    else profile.lineTo(point.x,point.y);
  }
  profile.closePath();
  const geometry=new ctx.THREE.ShapeGeometry(profile,28);
  const position=geometry.getAttribute('position');
  const deck=deckY(d,station),keel=keelY(d,station),range=Math.max(0.001,deck-keel);
  for(let i=0;i<position.count;i++){
    const v=Math.max(0,Math.min(1,(position.getY(i)-keel)/range));
    position.setZ(i,stationZ(d,station,v)+0.006);
  }
  geometry.computeVertexNormals();
  ctx.mesh(stern,geometry,materials.hull,'loguivy-flat-transom');

  const halfWidth=halfBreadth(d,station)*sectionBreadth(d,station,1)*0.94;
  const top=deck-0.04,topZ=stationZ(d,station,1)+0.018;
  beam(gallery,V(-halfWidth,top,topZ),V(halfWidth,top,topZ),0.022,materials.trim,'transom-top-edge');
  for(const side of [-1,1]){
    beam(gallery,V(side*halfWidth,top,topZ),V(side*halfWidth*0.90,top-0.34,stationZ(d,station,0.78)+0.02),0.020,materials.trim,'transom-quarter-rib');
  }
  const paneW=halfWidth*0.10,paneH=range*0.055;
  for(let n=0;n<3;n++){
    const x=(n-1)*halfWidth*0.46;
    const pane=box(windows,paneW,paneH,0.018,materials.glass,'transom-light');
    pane.position.set(x,deck-range*0.23,stationZ(d,station,0.76)+0.02);
  }
}
