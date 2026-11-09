import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildRudder(d,ctx){
  const {part,box,beam,materials,V}=ctx;
  const sternZ=stationZ(d,0.986,0.18);
  const rudder=part('rudder'),config=d.rudderDetails;
  rudder.position.set(0,0,sternZ+config.pivotOffset);
  const width=d.beamUnits*config.breadthFactor*1.05;
  const height=d.draftUnits*config.depthFactor;
  const blade=box(rudder,width,height,0.20,materials.trim,'sloop-rudder-blade');
  blade.position.set(0,-d.draftUnits*config.yFactor,0);
  const stockTopZ=stationZ(d,0.97,1)-sternZ;
  beam(
    rudder,
    V(0,-d.draftUnits*0.4,-0.02),
    V(0,deckY(d,0.97)+0.18,stockTopZ),
    Math.max(0.04,d.beamUnits*0.013),
    materials.trim,
    'rudder-stock'
  );
}
