import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../shared/prop-kit.js';

export const BARREL_PART_NAMES=Object.freeze(['barrel-body','barrel-top','barrel-bottom','stave-set','hoop-top','hoop-middle','hoop-bottom']);
export function createBarrelModel(transforms={},savedState={}) {
  const ctx=createPropContext('cargo-barrel','Cargo barrel',{length:1.05,beam:.82,draft:.82});
  const {part,mesh,materials}=ctx;
  const body=part('barrel-body');
  mesh(body,new THREE.CylinderGeometry(.39,.34,1.05,16,1,false),materials.plank,'barrel-shell');
  const top=part('barrel-top');
  mesh(top,new THREE.CylinderGeometry(.385,.385,.045,16),materials.deck,'barrel-lid');
  const bottom=part('barrel-bottom');
  mesh(bottom,new THREE.CylinderGeometry(.34,.34,.04,16),materials.lower,'barrel-base');
  const staves=part('stave-set');
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    const board=mesh(staves,new THREE.BoxGeometry(.145,1.02,.035),materials.hull,'stave-'+String(i+1).padStart(2,'0'));
    board.position.set(Math.sin(a)*.345,0,Math.cos(a)*.345);
    board.rotation.y=a;
  }
  for(const [name,y,r] of [['hoop-top',.39,.386],['hoop-middle',0,.405],['hoop-bottom',-.39,.35]]){
    const hoop=part(name);
    const ring=mesh(hoop,new THREE.TorusGeometry(r,.025,8,32),materials.iron,'iron-hoop');
    ring.rotation.x=Math.PI/2;ring.position.y=y;
  }
  return finishPropModel(ctx,'misc-prop-barrel',transforms,savedState);
}
