import { deckY, stationZ, halfBreadth, V } from "../../architecture/hull-geometry.js";

function setPartPivot(THREE,group,pivot){
  const pivotGroup=new THREE.Group();
  pivotGroup.name=group.name+'-animation-pivot';
  pivotGroup.position.copy(pivot);
  for(const child of [...group.children]){
    group.remove(child);
    child.position.sub(pivot);
    pivotGroup.add(child);
  }
  group.add(pivotGroup);
  group.userData.pivotPoint=pivot.toArray();
  group.userData.animationPivot=pivotGroup;
}
import { buildCanvasSail } from "../sails/sail-cloth-generator.js";
import { buildStandingRigging } from "../rigging/standing-rigging-generator.js";

export function buildMast(d,ctx,mast){
  const {THREE,part,beam,tube,materials,V}=ctx;
  const mastT=.5+mast.z;
  const z=mast.z*d.hullLengthUnits;
  const baseY=deckY(d,mastT)+.12;
  const totalHeight=mast.height*(4/3);
  const group=part('mast-'+mast.id);
  group.position.set(0,baseY,z);
  group.userData.mastControl={mastId:mast.id,windFlex:{side:.012,foreAft:.0045}};

  const lowerHeight=totalHeight*(d.structure.lowerMastRatio??.68);
  const radius=d.beamUnits*.032;
  const lower=part('mast-lower-'+mast.id,group);
  const topmast=part('mast-topmast-'+mast.id,group);
  const step=part('mast-step-'+mast.id);
  beam(step,V(-.42,baseY-.18,z),V(.42,baseY-.18,z),
    .10,materials.trim,'mast-step-crossbeam');

  const lowerBase=Math.max(.12,radius*1.35);
  const lowerTop=Math.max(.075,radius*.68);
  const lowerSpar=ctx.mesh(lower,
    new THREE.CylinderGeometry(lowerTop,lowerBase,lowerHeight,12,1),
    materials.trim,'lower-mast');
  lowerSpar.position.y=lowerHeight*.5;

  const topStart=lowerHeight-.12;
  const topLength=totalHeight-topStart;
  const topSpar=ctx.mesh(topmast,
    new THREE.CylinderGeometry(Math.max(.035,radius*.34),Math.max(.055,radius*.68),topLength,10,1),
    materials.trim,'topmast');
  topSpar.position.y=topStart+topLength*.5;

  // Standing shrouds, chainplates and backstays are built in mast-local space.
  buildStandingRigging(d,ctx,mast,group,z,baseY,totalHeight,lowerHeight);

  if(mast.rig==='gaff'||mast.rig==='trysail'){
    const type=mast.rig==='trysail'?'trysail':'gaff';
    const run=d.hullLengthUnits*(mast.span??.42);
    const low=lowerHeight*.14;
    const throat=lowerHeight*.76;
    const peak=lowerHeight*.95;
    const headRun=run*.78;
    const clewRun=run;

    const gaff=part('gaff-spar-'+mast.id,group);
    const boom=part('boom-'+mast.id,group);
    const tack=V(0,low,0);
    const throatPoint=V(0,throat,0);
    const peakPoint=V(0,peak,headRun);
    const clew=V(0,low*.92,clewRun);
    beam(gaff,throatPoint,peakPoint,.062,materials.trim,'gaff-spar');
    setPartPivot(THREE,gaff,throatPoint);gaff.userData.windControl={kind:'gaff'};
    beam(boom,tack,clew,.066,materials.trim,'boom-spar');
    setPartPivot(THREE,boom,tack);boom.userData.windControl={kind:'boom',trimScale:1};

    // The mainsail is laced to the mast/gaff/boom perimeter; the triangular
    // topsail is set above the gaff with no unsupported spare jackyard.
    const mainsail=buildCanvasSail(ctx,'sail-'+mast.id+'-'+type,mast.id,
      [tack,throatPoint,peakPoint,clew],.105,group,'x');
    mainsail.userData.sailControl.sailType='gaff-mainsail';

    const masthead=V(0,totalHeight*.985,0);
    const topsail=buildCanvasSail(ctx,'sail-'+mast.id+'-gaff-topsail',mast.id,
      [throatPoint,masthead,peakPoint,throatPoint],.112,group,'x');
    topsail.userData.sailControl.sailType='gaff-topsail';

    const running=part('running-rigging-'+mast.id,group);
    const gaffHalyards=part('gaff-halyards-'+mast.id,running);
    const mastDeckY=deckY(d,mastT)-baseY+.18;

    // Throat halyard: gaff throat -> mast hounds block -> deck belaying point.
    const throatBlock=V(-.13,lowerHeight*.96,-.04);
    const throatBelay=V(-.25,mastDeckY,.18);
    tube(gaffHalyards,[V(-.09,throat,0),throatBlock,throatBelay],
      .011,materials.rope,'gaff-throat-halyard',36);

    // Peak halyard: gaff peak -> masthead block -> separate deck lead.
    const peakBlock=V(.15,totalHeight*.985,.06);
    const peakBelay=V(.29,mastDeckY,.24);
    tube(gaffHalyards,[V(.11,peak,headRun),peakBlock,peakBelay],
      .011,materials.rope,'gaff-peak-halyard',40);

    const boomLines=part('boom-running-rigging-'+mast.id,running);

    // Topping lift supports the boom end from the masthead.
    const toppingLift=tube(boomLines,
      [V(.22,totalHeight*.97,.04),V(.18,low*.92,clewRun)],
      .011,materials.rope,'boom-topping-lift',36);
    toppingLift.userData.riggingFunction='supports-boom';

    // Mainsheet runs from the boom clew to a deck horse just ahead of the stern.
    // Its tail leads outboard, away from the helmsman's standing position.
    const sheetStation=.945;
    const sheetAnchor=V(0,deckY(d,sheetStation)-baseY+.14,
      stationZ(d,sheetStation,1)-z);
    const sheetClew=V(.14,low*.92,clewRun);
    tube(boomLines,[sheetClew,
      V(.08,(sheetClew.y+sheetAnchor.y)*.52,
        (sheetClew.z+sheetAnchor.z)*.52),
      sheetAnchor],.013,materials.rope,'mainsheet',36);

    const sheetLeadStation=.82;
    const sheetLead=V(halfBreadth(d,sheetLeadStation)*.72,
      deckY(d,sheetLeadStation)-baseY+.15,
      stationZ(d,sheetLeadStation,1)-z);
    tube(boomLines,[sheetAnchor,sheetLead],.009,materials.rope,
      'mainsheet-tail',24);

    // Boom vang is attached at the forward half of the boom and led to a
    // deck fitting close to the mast; its hull station is converted correctly.
    const vangStation=mastT+.13;
    const vangAnchor=V(halfBreadth(d,vangStation)*.60,
      deckY(d,vangStation)-baseY+.13,
      stationZ(d,vangStation,1)-z);
    const vangBoom=V(.18,low*.58,clewRun*.48);
    tube(boomLines,[vangBoom,vangAnchor],.010,materials.rope,
      'boom-vang',28);
  }
  return group;
}
