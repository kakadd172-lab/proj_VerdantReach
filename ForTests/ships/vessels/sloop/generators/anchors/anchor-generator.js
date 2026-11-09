import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Two small stowed stock anchors, fitted close against the forward bow cheeks.
 * Each anchor is built in a vertical fore/aft plane so its shank, crown and
 * flukes read clearly from both side and three-quarter views.
 */
export function buildAnchors(d,ctx){
  const {part,beam,tube,mesh,materials,THREE,V}=ctx;
  const anchors=part('anchors');
  const station=0.14;
  const hullSide=halfBreadth(d,station);
  const anchorX=hullSide*1.035+0.055;
  const topY=deckY(d,station)-0.18;
  const bowZ=stationZ(d,station,0.92)+0.16;

  for(const side of [-1,1]){
    const suffix=side<0?'port':'starboard';
    const anchor=part('anchor-'+suffix,anchors);
    anchor.position.set(side*anchorX,0,bowZ);

    const ringCenter=V(0,topY+0.075,-0.105);
    const crown=V(0,topY-0.62,0.14);
    const flukeSpan=0.245;
    const armY=crown.y-0.105;
    const flukeY=crown.y+0.095;

    // Main shank and its upper mooring ring.
    beam(anchor,ringCenter,crown,0.047,materials.iron,'sloop-anchor-shank');
    const ring=mesh(anchor,new THREE.TorusGeometry(0.105,0.026,8,18),materials.iron,'sloop-anchor-ring');
    ring.rotation.y=Math.PI/2;
    ring.position.copy(ringCenter);

    // Stock crosses the crown; the two arms turn down into recognisable flukes.
    beam(anchor,V(0,crown.y,crown.z-flukeSpan),V(0,crown.y,crown.z+flukeSpan),0.045,materials.iron,'sloop-anchor-stock');
    for(const foreAft of [-1,1]){
      const armTip=V(0,armY,crown.z+foreAft*flukeSpan*0.72);
      const flukeTip=V(0,flukeY,crown.z+foreAft*flukeSpan*1.08);
      beam(anchor,crown,armTip,0.052,materials.iron,'sloop-anchor-arm');
      beam(anchor,armTip,flukeTip,0.041,materials.iron,'sloop-anchor-fluke');
      beam(anchor,flukeTip,V(0,flukeY+0.075,crown.z+foreAft*flukeSpan*0.91),0.034,materials.iron,'sloop-anchor-fluke-point');
    }

    // Small collar and a short rode leading back to the bow hawse.
    beam(anchor,V(0,topY-0.035,-0.10),V(0,topY-0.035,-0.015),0.065,materials.iron,'sloop-anchor-shank-collar');
    const rode=part('anchor-chain-'+suffix,anchors);
    tube(
      rode,
      [
        V(side*anchorX,topY+0.075,bowZ-0.105),
        V(side*anchorX,topY+0.12,bowZ-0.19),
        V(side*anchorX*0.97,topY+0.15,bowZ-0.27)
      ],
      0.017,
      materials.iron,
      'sloop-anchor-rode',
      18
    );
  }
}
