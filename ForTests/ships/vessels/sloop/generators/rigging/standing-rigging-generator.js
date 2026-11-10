import { deckY, halfBreadth, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Standing rig for the single-masted gaff cutter.
 *
 * Coordinates passed to this generator are local to the mast group. Every
 * deck fitting is first located in hull coordinates, then converted by
 * subtracting the mast group's world Z/Y origin. Keeping that conversion in
 * one place prevents the stays from floating beyond the hull.
 */
export function buildStandingRigging(d,ctx,mast,mastGroup,z,baseY,totalHeight,lowerHeight){
  const {part,tube,beam,materials,V}=ctx;
  const mastStation=.5+mast.z;
  const standing=part('standing-rigging-'+mast.id,mastGroup);
  const shrouds=part('shrouds-'+mast.id,standing);
  const ratlines=part('ratlines-'+mast.id,standing);
  const mastStays=part('mast-stays-'+mast.id,standing);
  const backstays=part('backstays-'+mast.id,mastStays);
  const chainplates=part('chainplates-'+mast.id,standing);

  const localZ=station=>stationZ(d,station,1)-z;
  const deckLocalY=station=>deckY(d,station)-baseY;
  const markDeckAnchoredStay=(line,points,radius,segments)=>{
    line.userData.dynamicMastStay={
      mastId:mast.id,
      // All points supplied here are authored in the mast component's local
      // frame, not in the nested shrouds/backstays group that owns the mesh.
      coordinateSpace:'mast-group',
      points:points.map(point=>point.toArray()),
      fixedEndIndex:points.length-1,
      fixedPoint:points[points.length-1].toArray(),
      radius,segments,radialSegments:7
    };
    return line;
  };
  const shroudCount=Math.max(2,d.structure.shroudPairs??2);
  const houndsY=lowerHeight*.92;
  const upperShroudX=.085;
  const foreStation=Math.max(.08,mastStation-.055);
  const aftStation=Math.min(.90,mastStation+.055);
  const foreAnchorZ=localZ(foreStation);
  const aftAnchorZ=localZ(aftStation);
  const foreDeckY=deckLocalY(foreStation)+.08;
  const aftDeckY=deckLocalY(aftStation)+.08;
  const foreRailX=halfBreadth(d,foreStation)*.84;
  const aftRailX=halfBreadth(d,aftStation)*.84;

  // Two distinct shrouds on each side: a forward and an after leg.
  // Each has its own chainplate at the gunwale, rather than all four lines
  // converging on one point at the masthead.
  for(const side of [-1,1]){
    const foreTop=V(side*upperShroudX,houndsY,-.15);
    const aftTop=V(side*upperShroudX,houndsY,.15);
    const foreFoot=V(side*foreRailX,foreDeckY,foreAnchorZ);
    const aftFoot=V(side*aftRailX,aftDeckY,aftAnchorZ);

    markDeckAnchoredStay(
      tube(shrouds,[foreTop,foreFoot],.015,materials.rope,
        'standing-shroud-'+(side<0?'port':'starboard')+'-forward',36),
      [foreTop,foreFoot],.015,36);
    markDeckAnchoredStay(
      tube(shrouds,[aftTop,aftFoot],.015,materials.rope,
        'standing-shroud-'+(side<0?'port':'starboard')+'-after',36),
      [aftTop,aftFoot],.015,36);

    // Narrow iron chainplates continue just below the gunwale.
    beam(chainplates,
      V(side*(foreRailX+.012),foreDeckY-.34,foreAnchorZ),
      V(side*(foreRailX+.012),foreDeckY+.09,foreAnchorZ),
      .017,materials.iron,'shroud-chainplate-forward-'+side,7);
    beam(chainplates,
      V(side*(aftRailX+.012),aftDeckY-.34,aftAnchorZ),
      V(side*(aftRailX+.012),aftDeckY+.09,aftAnchorZ),
      .017,materials.iron,'shroud-chainplate-after-'+side,7);

    // Ratlines are horizontal rungs between the forward and after shrouds.
    // Their endpoints interpolate along the actual shroud lines.
    const count=d.structure.ratlines??9;
    for(let r=0;r<count;r++){
      const t=(r+1)/(count+1);
      const y=foreDeckY+(houndsY-foreDeckY)*t;
      const xFore=foreRailX+(upperShroudX-foreRailX)*t;
      const xAft=aftRailX+(upperShroudX-aftRailX)*t;
      const zFore=foreAnchorZ+(-.15-foreAnchorZ)*t;
      const zAft=aftAnchorZ+(.15-aftAnchorZ)*t;
      beam(ratlines,
        V(side*xFore,y,zFore),
        V(side*xAft,y,zAft),
        .007,materials.rope,'ratline-'+side+'-'+r,7);
    }
  }

  // Paired backstays support the masthead and lead to the two stern quarters.
  // They remain outside the gaff/boom working area.
  const backstayStation=Math.min(.955,mastStation+.36);
  const backstayZ=localZ(backstayStation);
  const backstayY=deckLocalY(backstayStation)+.10;
  const backstayRail=halfBreadth(d,backstayStation)*.82;
  const backstayChainplates=part('backstay-chainplates-'+mast.id,standing);
  for(const side of [-1,1]){
    const head=V(side*.105,totalHeight*.985,0);
    const foot=V(side*backstayRail,backstayY,backstayZ);
    markDeckAnchoredStay(
      tube(backstays,[head,foot],.015,materials.rope,
        'backstay-'+(side<0?'port':'starboard'),40),
      [head,foot],.015,40);
    beam(backstayChainplates,
      V(side*(backstayRail+.012),backstayY-.32,backstayZ),
      V(side*(backstayRail+.012),backstayY+.08,backstayZ),
      .017,materials.iron,'backstay-chainplate-'+side,7);
  }

  standing.userData.riggingType='gaff-cutter-standing-rig';
  standing.userData.shroudPairsPerSide=shroudCount;
  standing.userData.backstayCount=2;
}
