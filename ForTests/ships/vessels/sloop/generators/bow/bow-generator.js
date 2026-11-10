import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";
import { buildBowspritRigging } from "../rigging/bowsprit-rigging-generator.js";

export function buildBow(d,ctx){
  const {part,beam,materials,V}=ctx;
  const bow=part('bowworks');
  const bowsprit=part('bowsprit');
  const base=deckY(d,.035)+.12;
  const stemZ=stationZ(d,.012,1);
  const bowspritLength=(d.bowspritLength??2.7)*(4/3);
  const heelZ=stationZ(d,.10,1);
  const tipZ=stemZ-bowspritLength;

  beam(bowsprit,
    V(0,base,heelZ),
    V(0,base+.20,tipZ),
    Math.max(.05,d.beamUnits*.014),
    materials.trim,'Loguivy-long-bowsprit');

  // Structural headrails terminate at the stem; their supporting guys and
  // bobstay belong to the separate bowsprit-rigging component.
  for(const side of [-1,1]){
    beam(bow,
      V(side*d.beamUnits*.045,base+.08,stationZ(d,.075,1)),
      V(side*d.beamUnits*.15,base-.11,stemZ-bowspritLength*.28),
      .024,materials.trim,'bow-headrail');
  }

  buildBowspritRigging(d,ctx);
}
