import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../shared/prop-kit.js';

export const LANTERN_GENERATOR_VERSION='0.2.0';
export const LANTERN_PART_NAMES=Object.freeze([
  'lantern-base',
  'lantern-frame',
  'lantern-glass',
  'lantern-roof',
  'lantern-vent',
  'lantern-handle',
  'lantern-burner',
  'lantern-hardware',
  'lantern-guard'
]);

function addBox(ctx,parent,name,size,position,material,rotationY=0){
  const object=ctx.mesh(parent,new THREE.BoxGeometry(...size),material,name);
  object.position.set(...position);
  object.rotation.y=rotationY;
  return object;
}

function addCylinder(ctx,parent,name,radiusTop,radiusBottom,height,position,material,segments=24){
  const object=ctx.mesh(
    parent,
    new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments,1),
    material,
    name
  );
  object.position.set(...position);
  return object;
}

function addStudRing(ctx,parent,name,count,radius,y,studRadius,material){
  const { mesh }=ctx;
  for(let i=0;i<count;i++){
    const angle=(i/count)*Math.PI*2;
    const stud=mesh(parent,new THREE.SphereGeometry(studRadius,8,6),material,name+'-'+String(i+1).padStart(2,'0'));
    stud.position.set(Math.sin(angle)*radius,y,Math.cos(angle)*radius);
  }
}

export function createLanternModel(transforms={},savedState={}){
  const ctx=createPropContext(
    'deck-lantern',
    'Deck Lantern',
    {length:.52,beam:.52,draft:1.28}
  );
  const { THREE:T,part,mesh,materials }=ctx;

  // Lower foot, octagonal plinth, and the sealed oil-reservoir silhouette.
  const base=part('lantern-base');
  addCylinder(ctx,base,'weighted-foot',.145,.17,.075,[0,.038,0],materials.iron,12);
  addCylinder(ctx,base,'brass-foot-collar',.17,.17,.025,[0,.087,0],materials.brass,12);
  addCylinder(ctx,base,'octagonal-pedestal',.205,.225,.065,[0,.132,0],materials.trim,8);
  addCylinder(ctx,base,'reservoir-lower-shell',.16,.17,.115,[0,.222,0],materials.brass,24);
  addCylinder(ctx,base,'reservoir-upper-lip',.178,.178,.026,[0,.284,0],materials.iron,24);
  addCylinder(ctx,base,'reservoir-top-plate',.205,.205,.035,[0,.307,0],materials.brass,12);
  const reservoirBand=mesh(base,new T.TorusGeometry(.164,.012,8,32),materials.trim,'reservoir-bead');
  reservoirBand.rotation.x=Math.PI/2;
  reservoirBand.position.y=.236;
  addStudRing(ctx,base,'reservoir-rivet',12,.173,.222,.009,materials.iron);

  // Main cage: four substantial uprights, top/bottom rails, and corner gussets.
  const frame=part('lantern-frame');
  const half=.164;
  for(const x of [-half,half]){
    for(const z of [-half,half]){
      const post=mesh(frame,new T.BoxGeometry(.034,.535,.034),materials.brass,'corner-upright');
      post.position.set(x,.575,z);
      const foot=mesh(frame,new T.BoxGeometry(.052,.065,.052),materials.iron,'upright-socket');
      foot.position.set(x,.332,z);
      const crown=mesh(frame,new T.BoxGeometry(.05,.055,.05),materials.brass,'upright-crown');
      crown.position.set(x,.826,z);
    }
  }
  for(const y of [.335,.385,.795,.835]){
    for(const z of [-half,half]){
      addBox(ctx,frame,'front-back-frame-rail',[.34,.022,.022],[0,y,z],materials.brass);
    }
    for(const x of [-half,half]){
      addBox(ctx,frame,'side-frame-rail',[.022,.022,.34],[x,y,0],materials.brass);
    }
  }
  for(const z of [-half,half]){
    for(const x of [-.105,.105]){
      const brace=mesh(frame,new T.BoxGeometry(.018,.11,.018),materials.trim,'corner-brace');
      brace.position.set(x,.377,z);
      brace.rotation.z=x<0?-.28:.28;
    }
  }

  // Individual panes remain transparent and do not cast opaque pane shadows.
  const glass=part('lantern-glass');
  const paneMaterial=materials.glass.clone();
  paneMaterial.color.setHex(0x9ebbb4);
  paneMaterial.opacity=.34;
  paneMaterial.transparent=true;
  paneMaterial.roughness=.2;
  paneMaterial.depthWrite=false;
  const paneSpecs=[
    ['front',new T.BoxGeometry(.285,.385,.009),[0,.577,half-.009],0],
    ['rear',new T.BoxGeometry(.285,.385,.009),[0,.577,-half+.009],0],
    ['port',new T.BoxGeometry(.009,.385,.285),[-half+.009,.577,0],0],
    ['starboard',new T.BoxGeometry(.009,.385,.285),[half-.009,.577,0],0]
  ];
  for(const [name,geometry,position] of paneSpecs){
    const pane=mesh(glass,geometry,paneMaterial,'glazed-pane-'+name);
    pane.position.set(...position);
    pane.castShadow=false;
    pane.receiveShadow=false;
  }

  // Four-sided pitched hood, eaves, and a fine lower drip edge.
  const roof=part('lantern-roof');
  const eave=mesh(roof,new T.BoxGeometry(.47,.035,.47),materials.iron,'roof-eave-plate');
  eave.position.y=.866;
  const eaveBead=mesh(roof,new T.BoxGeometry(.485,.012,.485),materials.brass,'eave-bead');
  eaveBead.position.y=.845;
  const hood=mesh(
    roof,
    new T.CylinderGeometry(.062,.252,.17,4,1,false),
    materials.brass,
    'four-sided-pitched-hood'
  );
  hood.position.y=.965;
  hood.rotation.y=Math.PI/4;
  const roofCap=mesh(roof,new T.CylinderGeometry(.075,.075,.025,12),materials.trim,'hood-apex-cap');
  roofCap.position.y=1.056;
  addStudRing(ctx,roof,'roof-rivet',8,.226,.869,.009,materials.brass);

  // Static decorative vent stack and rain cap.
  const vent=part('lantern-vent');
  addCylinder(ctx,vent,'vent-collar',.072,.082,.045,[0,1.079,0],materials.iron,16);
  addCylinder(ctx,vent,'vent-stack',.047,.052,.12,[0,1.15,0],materials.brass,16);
  addCylinder(ctx,vent,'vent-rim',.075,.075,.022,[0,1.215,0],materials.iron,16);
  addCylinder(ctx,vent,'rain-cap',.092,.063,.025,[0,1.239,0],materials.brass,16);
  const ventSlots=part('lantern-hardware');
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    const slot=mesh(ventSlots,new T.BoxGeometry(.012,.032,.004),materials.lower,'vent-slot-'+(i+1));
    slot.position.set(Math.sin(angle)*.049,1.151,Math.cos(angle)*.049);
    slot.rotation.y=angle;
  }

  // Upright carrying bail, mounted through paired hinge ears.
  const handle=part('lantern-handle');
  const bail=mesh(handle,new T.TorusGeometry(.112,.014,8,28,Math.PI),materials.iron,'arched-carrying-bail');
  bail.position.y=1.255;
  for(const x of [-.145,.145]){
    const ear=mesh(handle,new T.BoxGeometry(.055,.075,.025),materials.brass,'bail-hinge-ear');
    ear.position.set(x,.837,0);
    const pin=mesh(handle,new T.CylinderGeometry(.014,.014,.055,10),materials.iron,'bail-hinge-pin');
    pin.rotation.z=Math.PI/2;
    pin.position.set(x,.837,0);
  }

  // Decorative burner/reflector assembly; purely static visual detailing.
  const burner=part('lantern-burner');
  addCylinder(ctx,burner,'lower-burner-cup',.062,.075,.035,[0,.399,0],materials.brass,20);
  addCylinder(ctx,burner,'burner-neck',.031,.04,.085,[0,.456,0],materials.iron,16);
  const reflector=mesh(burner,new T.CylinderGeometry(.11,.072,.045,24,1,true),materials.brass,'reflector-shade');
  reflector.position.y=.514;
  const center=mesh(burner,new T.SphereGeometry(.035,14,10),materials.glass,'frosted-centerpiece');
  center.position.y=.555;
  center.material=materials.glass.clone();
  center.material.color.setHex(0xd7c38d);
  center.material.opacity=.78;
  center.material.emissive=new T.Color(0x4a3010);
  center.material.emissiveIntensity=.22;

  // Hinge straps, front latch, screws, and separate corner guard rods.
  const hardware=part('lantern-hardware');
  for(const x of [-.164,.164]){
    for(const z of [-.164,.164]){
      const rivet=mesh(hardware,new T.SphereGeometry(.012,10,8),materials.iron,'frame-fastener');
      rivet.position.set(x,.796,z);
    }
  }
  const latch=mesh(hardware,new T.BoxGeometry(.035,.105,.018),materials.iron,'front-door-latch');
  latch.position.set(0,.59,half+.012);
  const latchGrip=mesh(hardware,new T.SphereGeometry(.018,10,8),materials.brass,'latch-grip');
  latchGrip.position.set(0,.565,half+.026);
  const hinge=mesh(hardware,new T.BoxGeometry(.026,.12,.014),materials.brass,'door-hinge-strap');
  hinge.position.set(-.12,.59,half+.012);

  const guard=part('lantern-guard');
  for(const x of [-.135,.135]){
    for(const z of [-.135,.135]){
      const rod=mesh(guard,new T.CylinderGeometry(.006,.006,.39,8),materials.iron,'glass-guard-rod');
      rod.position.set(x,.58,z);
    }
  }
  return finishPropModel(ctx,'misc-prop-lantern',transforms,savedState);
}
