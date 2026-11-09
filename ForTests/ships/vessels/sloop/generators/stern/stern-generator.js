import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildStern(d,ctx){
  const {part,box,beam,materials,V}=ctx;
  const stern=part('sternworks'),gallery=part('stern-gallery',stern),windows=part('stern-windows',stern);
  const station=0.984,baseZ=stationZ(d,station,1),deck=deckY(d,station);
  const width=Math.max(0.42,halfBreadth(d,station)*1.88);
  const height=d.deckHeightUnits*0.46,depth=d.hullLengthUnits*0.032;
  const transom=box(stern,width,height,depth,materials.hull,'sloop-counter-transom');
  transom.position.set(0,deck+height*0.30,baseZ);

  for(const side of [-1,1]){
    const x=side*width*0.5;
    beam(
      gallery,
      V(x,deck+0.10,baseZ-depth*0.72),
      V(x*0.94,deck+height*0.63,baseZ+depth*0.38),
      0.037,
      materials.trim,
      'quarter-gallery-rail'
    );
    for(let p=0;p<3;p++){
      const z=baseZ-depth*0.66+p*depth*0.52;
      beam(
        gallery,
        V(x,deck+0.10,z),
        V(x*0.94,deck+height*0.58,z),
        0.024,
        materials.trim,
        'gallery-baluster'
      );
    }
  }

  const paneW=width*0.13,paneH=height*0.27;
  for(let n=0;n<3;n++){
    const x=(n-1)*width*0.29;
    const pane=box(windows,paneW,paneH,0.028,materials.glass,'counter-window');
    pane.position.set(x,deck+height*0.48,baseZ+depth*0.53);
  }
}
