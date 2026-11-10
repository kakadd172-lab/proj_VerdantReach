import { deckY, halfBreadth, keelY, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Bowsprit standing rig: a load-bearing bobstay below the spar and paired
 * side guys to the forward channels. The bow rails themselves are structural
 * woodwork and are generated separately by bow-generator.js.
 */
export function buildBowspritRigging(d,ctx){
  const {part,tube,materials}=ctx;
  const rig=part('bowsprit-standing-rigging');
  const base=deckY(d,.035)+.12;
  const stemZ=stationZ(d,.012,1);
  const heelZ=stationZ(d,.10,1);
  const bowspritLength=(d.bowspritLength??2.7)*(4/3);
  const tipZ=stemZ-bowspritLength;
  const tip=V(0,base+.20,tipZ);

  // The bobstay counters the upward pull of the forestay at the bowsprit tip.
  const stemFoot=V(0,Math.max(keelY(d,.012)+.18,deckY(d,.012)-.48),
    stationZ(d,.012,.38));
  tube(rig,[stemFoot,V(0,(stemFoot.y+tip.y)*.52,tipZ+(stemFoot.z-tipZ)*.28),tip],
    .016,materials.rope,'bowsprit-bobstay',40);

  // Port and starboard guys prevent the long bowsprit from slewing sideways.
  const guys=part('bowsprit-side-guys',rig);
  const anchorStation=.082;
  const anchorY=deckY(d,anchorStation)+.06;
  const anchorZ=stationZ(d,anchorStation,1);
  const anchorX=halfBreadth(d,anchorStation)*.88;
  for(const side of [-1,1]){
    tube(guys,
      [V(side*.045,base+.18,tipZ+.10),
       V(side*anchorX,anchorY,anchorZ)],
      .014,materials.rope,
      'bowsprit-guy-'+(side<0?'port':'starboard'),32);
  }

  // A compact set of heel lashings, tucked close to the stemhead. These are
  // deliberately separate from the bobstay and side guys.
  const lashings=part('bowsprit-heel-lashings',rig);
  const radius=Math.max(.055,d.beamUnits*.018);
  for(let turn=0;turn<4;turn++){
    const loopZ=heelZ+.06+turn*.035;
    const points=[];
    for(let step=0;step<=16;step++){
      const angle=(step/16)*Math.PI*2;
      points.push(V(Math.cos(angle)*radius,
        base+.20+Math.sin(angle)*radius,loopZ));
    }
    tube(lashings,points,.008,materials.rope,
      'bowsprit-heel-lashing-'+turn,24);
  }

  rig.userData.riggingType='bowsprit-standing-rig';
}
