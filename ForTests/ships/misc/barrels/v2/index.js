import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../../shared/prop-kit.js';

export const BARREL_V2_GENERATOR_VERSION='0.1.0';
export const BARREL_V2_PART_NAMES=Object.freeze([
  'barrel-body-core',
  'barrel-staves',
  'barrel-hoop-lower',
  'barrel-hoop-lower-middle',
  'barrel-hoop-upper-middle',
  'barrel-hoop-upper',
  'barrel-head-top',
  'barrel-head-bottom',
  'barrel-bung',
  'barrel-rim-details'
]);

const PROFILE=Object.freeze([
  [-.52,.305],
  [-.43,.342],
  [-.26,.378],
  [0,.402],
  [.26,.378],
  [.43,.342],
  [.52,.305]
]);

function radiusAt(y){
  for(let i=0;i<PROFILE.length-1;i++){
    const [y0,r0]=PROFILE[i], [y1,r1]=PROFILE[i+1];
    if(y>=y0&&y<=y1){
      const t=(y-y0)/(y1-y0);
      return r0+(r1-r0)*t;
    }
  }
  return y<PROFILE[0][0]?PROFILE[0][1]:PROFILE[PROFILE.length-1][1];
}

function makeStaveGeometry(angle,halfWidth,thickness=.032){
  const positions=[];
  const indices=[];
  for(const [y,radius] of PROFILE){
    const r=radiusAt(y),inner=r-thickness;
    const samples=[
      [r,angle-halfWidth],[r,angle+halfWidth],
      [inner,angle-halfWidth],[inner,angle+halfWidth]
    ];
    for(const [distance,a] of samples){
      positions.push(Math.sin(a)*distance,y,Math.cos(a)*distance);
    }
  }
  const row=PROFILE.length;
  for(let i=0;i<row-1;i++){
    const a=i*4,b=(i+1)*4;
    // Exterior and interior curved faces.
    indices.push(a,a+1,b+1,a,b+1,b);
    indices.push(a+2,b+2,b+3,a+2,b+3,a+3);
    // The two narrow stave edges.
    indices.push(a,b,a+2,a+2,b,b+2);
    indices.push(a+1,a+3,b+3,a+1,b+3,b+1);
  }
  // Close the stave ends so each board remains a solid editable piece.
  indices.push(0,2,3,0,3,1);
  const last=(row-1)*4;
  indices.push(last,last+1,last+3,last,last+3,last+2);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeHoopGeometry(radius,width=.044,radial=.014){
  const y=width/2;
  const profile=[
    new THREE.Vector2(radius-radial,-y),
    new THREE.Vector2(radius+radial,-y),
    new THREE.Vector2(radius+radial,y),
    new THREE.Vector2(radius-radial,y),
    new THREE.Vector2(radius-radial,-y)
  ];
  const geometry=new THREE.LatheGeometry(profile,64);
  geometry.computeVertexNormals();
  return geometry;
}

function makeHeadGrooves(group,ctx,y,reverse=false){
  const { THREE:T,mesh,materials }=ctx;
  const seams=mesh(group,new T.CylinderGeometry(.305,.305,.008,48),materials.deck,'head-disc');
  seams.position.y=y;
  const grooveMaterial=materials.trim;
  for(let i=-2;i<=2;i++){
    const x=i*.092;
    const chord=2*Math.sqrt(Math.max(.01,.292*.292-x*x))-.018;
    const groove=mesh(group,new T.BoxGeometry(.006,.002,chord),grooveMaterial,'head-board-joint-'+(i+3));
    groove.position.set(x,y+(reverse?-.005:.005),0);
  }
}

export function createBarrelV2Model(componentTransforms={},savedState={}){
  const ctx=createPropContext(
    'cargo-barrel-v2',
    'Cargo Barrel V2',
    {length:1.04,beam:.82,draft:.82}
  );
  const { THREE:T,part,mesh,materials }=ctx;

  const core=part('barrel-body-core');
  const innerProfile=PROFILE.map(([y,r])=>new T.Vector2(r-.032,y));
  mesh(core,new T.LatheGeometry(innerProfile,48),materials.lower,'inner-cask-shell');

  const staves=part('barrel-staves');
  const count=22;
  const angularStep=(Math.PI*2)/count;
  for(let i=0;i<count;i++){
    const hueShift=((i%5)-2)*.006;
    const staveMaterial=materials.plank.clone();
    staveMaterial.color.offsetHSL(0,0,hueShift);
    const stave=mesh(
      staves,
      makeStaveGeometry(i*angularStep,angularStep*.475),
      staveMaterial,
      'longitudinal-oak-stave-'+String(i+1).padStart(2,'0')
    );
    stave.castShadow=true;
  }

  const hoopSpecs=[
    ['barrel-hoop-lower',-.365],
    ['barrel-hoop-lower-middle',-.205],
    ['barrel-hoop-upper-middle',.205],
    ['barrel-hoop-upper',.365]
  ];
  for(const [name,y] of hoopSpecs){
    const group=part(name);
    const radius=radiusAt(y)+.014;
    const band=mesh(group,makeHoopGeometry(radius),materials.iron,'forged-iron-band');
    band.position.y=y;
    // A restrained pair of rivet heads marks the hoop closure.
    for(const angle of [-.11,.11]){
      const rivet=mesh(group,new T.SphereGeometry(.014,10,8),materials.brass,'hoop-rivet');
      rivet.position.set(Math.sin(angle)*(radius+.014),y,Math.cos(angle)*(radius+.014));
    }
  }

  const top=part('barrel-head-top');
  makeHeadGrooves(top,ctx,.515,false);
  const topRim=mesh(top,new T.TorusGeometry(.306,.012,8,48),materials.trim,'top-head-chime');
  topRim.rotation.x=Math.PI/2;
  topRim.position.y=.506;

  const bottom=part('barrel-head-bottom');
  makeHeadGrooves(bottom,ctx,-.515,true);
  const bottomRim=mesh(bottom,new T.TorusGeometry(.306,.012,8,48),materials.trim,'bottom-head-chime');
  bottomRim.rotation.x=Math.PI/2;
  bottomRim.position.y=-.506;

  const bung=part('barrel-bung');
  const bungSocket=mesh(bung,new T.TorusGeometry(.044,.009,8,24),materials.trim,'bung-socket');
  bungSocket.rotation.x=Math.PI/2;
  bungSocket.position.set(.09,.523,.035);
  const plug=mesh(bung,new T.CylinderGeometry(.032,.035,.026,16),materials.plank,'tapered-wooden-bung');
  plug.position.set(.09,.526,.035);
  const plugGrain=mesh(bung,new T.BoxGeometry(.003,.001,.042),materials.trim,'bung-grain-mark');
  plugGrain.position.set(.09,.54,.035);

  const rims=part('barrel-rim-details');
  for(const [y,r] of [[.445,.342],[-.445,.342]]){
    const rim=mesh(rims,new T.TorusGeometry(r,.009,7,48),materials.deck,'head-edge-bead');
    rim.rotation.x=Math.PI/2;
    rim.position.y=y;
  }

  return finishPropModel(ctx,'misc-prop-barrel-v2',componentTransforms,savedState);
}

export function generateBarrelV2(componentTransforms={},savedState={}){
  return createBarrelV2Model(componentTransforms,savedState);
}
