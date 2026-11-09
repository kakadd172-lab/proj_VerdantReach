import { deckY, halfBreadth, sectionBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildDeck(d,ctx){
  const {THREE,part,mesh,materials}=ctx;
  const deck=part('deck'),along=144,across=40,pos=[],faces=[];
  const vivier=d.vivier||{width:1.1,startStation:0.40,endStation:0.69};
  const vivierHalf=vivier.width*(4/3)*0.5;
  for(let i=0;i<=along;i++){
    const t=i/along,half=halfBreadth(d,t)*sectionBreadth(d,t,1)*0.985,z=stationZ(d,t,1);
    for(let j=0;j<=across;j++){
      const u=j/across*2-1;
      const camber=d.hull.deckCamber*d.beamUnits*0.045*(1-u*u);
      pos.push(u*half,deckY(d,t)+camber,z);
    }
  }
  for(let i=0;i<along;i++){
    const tMid=(i+0.5)/along;
    for(let j=0;j<across;j++){
      const uMid=((j+0.5)/across)*2-1;
      const localHalf=halfBreadth(d,tMid)*sectionBreadth(d,tMid,1)*0.985;
      const inVivier=tMid>vivier.startStation && tMid<vivier.endStation
        && Math.abs(uMid*localHalf)<vivierHalf;
      if(inVivier)continue; // Actual deck opening over the live-fish well.
      const a=i*(across+1)+j;
      faces.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1);
    }
  }
  const deckGeo=new THREE.BufferGeometry();
  deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  deckGeo.setIndex(faces);
  deckGeo.computeVertexNormals();
  mesh(deck,deckGeo,materials.deck,'loguivy-open-deck-plan');
}
