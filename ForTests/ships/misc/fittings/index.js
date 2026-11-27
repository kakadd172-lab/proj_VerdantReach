import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../shared/prop-kit.js';

export const FITTING_PART_NAMES=Object.freeze(['bollard-foot','bollard-stem','bollard-head','bollard-collar','mounting-bolts']);
export function createBollardModel(transforms={},savedState={}) {
  const ctx=createPropContext('mooring-bollard','Mooring bollard',{length:.55,beam:.55,draft:.75});
  const {part,mesh,materials}=ctx;
  const foot=part('bollard-foot');
  mesh(foot,new THREE.CylinderGeometry(.28,.31,.12,16),materials.iron,'mounting-flange');
  const stem=part('bollard-stem');
  mesh(stem,new THREE.CylinderGeometry(.105,.14,.56,12),materials.iron,'vertical-stem').position.y=.32;
  const head=part('bollard-head');
  mesh(head,new THREE.CylinderGeometry(.2,.19,.16,12),materials.iron,'cross-head').position.y=.66;
  const collar=part('bollard-collar');
  const ring=mesh(collar,new THREE.TorusGeometry(.14,.025,8,24),materials.brass,'collar-ring');
  ring.rotation.x=Math.PI/2;ring.position.y=.53;
  const bolts=part('mounting-bolts');
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    const bolt=mesh(bolts,new THREE.CylinderGeometry(.025,.025,.025,8),materials.brass,'bolt-'+i);
    bolt.position.set(Math.cos(a)*.22,.07,Math.sin(a)*.22);
  }
  return finishPropModel(ctx,'misc-prop-bollard',transforms,savedState);
}
