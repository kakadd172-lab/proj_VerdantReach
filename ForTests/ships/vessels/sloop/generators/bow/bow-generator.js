import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildBow(d,ctx){
  const {part,beam,materials,V}=ctx;
  const bow=part('bowworks'),bowsprit=part('bowsprit');
  const base=deckY(d,0.045)+d.deckHeightUnits*0.16;
  const tip=stationZ(d,0.012,1);
  const length=d.beamUnits*0.95;
  beam(
    bowsprit,
    V(0,base,stationZ(d,0.12,1)),
    V(0,base+d.deckHeightUnits*0.30,tip-length),
    Math.max(0.06,d.beamUnits*0.018),
    materials.trim,
    'sloop-bowsprit'
  );
  for(const side of [-1,1]){
    beam(
      bow,
      V(side*0.1,base+0.1,stationZ(d,0.10,1)),
      V(side*d.beamUnits*0.17,base-0.16,tip-d.beamUnits*0.10),
      0.032,
      materials.trim,
      'headrail'
    );
  }
  if(d.headsails>0){
    const lashing=part('bowsprit-gammoning',bow);
    beam(
      lashing,
      V(0,base+0.12,stationZ(d,0.08,1)),
      V(0,base+d.deckHeightUnits*0.25,tip-d.beamUnits*0.48),
      0.024,
      materials.rope,
      'gammoning-line'
    );
  }
}
