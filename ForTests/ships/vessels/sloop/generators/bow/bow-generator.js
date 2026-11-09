import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function buildBow(d,ctx){
  const {part,beam,materials,V}=ctx;
  const bow=part('bowworks'),bowsprit=part('bowsprit');
  const base=deckY(d,0.035)+0.12;
  const stemZ=stationZ(d,0.012,1);
  const bowspritLength=(d.bowspritLength??2.7)*(4/3);
  const heelZ=stationZ(d,0.10,1);
  const tipZ=stemZ-bowspritLength;
  beam(
    bowsprit,
    V(0,base,heelZ),
    V(0,base+0.20,tipZ),
    Math.max(0.05,d.beamUnits*0.014),
    materials.trim,
    'Loguivy-long-bowsprit'
  );
  for(const side of [-1,1]){
    beam(
      bow,
      V(side*d.beamUnits*0.045,base+0.08,stationZ(d,0.075,1)),
      V(side*d.beamUnits*0.15,base-0.11,stemZ-bowspritLength*0.28),
      0.024,
      materials.trim,
      'bow-headrail'
    );
    beam(
      bow,
      V(side*d.beamUnits*0.17,base-0.10,stemZ-bowspritLength*0.30),
      V(0,base+0.12,tipZ),
      0.020,
      materials.rope,
      'bowsprit-guy'
    );
  }
  const gammoning=part('bowsprit-gammoning',bow);
  beam(gammoning,V(0,base+0.16,heelZ+0.12),V(0,base+0.24,stemZ-bowspritLength*0.20),0.025,materials.rope,'bowsprit-gammoning');
}
